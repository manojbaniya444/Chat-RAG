import { NextRequest, NextResponse } from "next/server";
import { streamText, UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { prisma } from "@/lib/prisma";
import { getQueryEmbedding } from "@/lib/embeddings";
import { retrieveFromPinecone } from "@/lib/pinecone";
import {
  calculateCoolDownPeriod,
  formatTime,
  getTotalMessagesInChat,
  getTotalUserMessagesInDuration,
} from "@/utils/chatUtils";

// GET: All the chat list for the specific userID
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const chats = await prisma.chat.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ chats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST: Handle user submit Input Message
// Get the message, verify UserId and ChatId, Embed Query, Retrieve and Generate Stream Response.
export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
    }: { messages: UIMessage[]; chatId: string; userId: string } =
      await req.json();

    // Validate required fields
    if (!chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Chat ID and User ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the chat exists and belongs to the user
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        user_id: userId,
      },
    });

    if (!chat) {
      return new Response(
        JSON.stringify({ error: "Chat not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const chatMessageCount = await getTotalMessagesInChat(chatId);

    // Limiting the chat messages per chat count to 15 due to the long context and free tier model Context Size limitation.
    if (chatMessageCount > 15) {
      return new Response(
        JSON.stringify({
          error:
            "Maximum messages reached in this chat. Please start a new chat.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // here check if the user has more than limited messages in limited time.
    // Count messages sent by the user in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const messageCount = await getTotalUserMessagesInDuration(
      userId,
      twentyFourHoursAgo
    );

    if (messageCount > 25) {
      const cooldown = await calculateCoolDownPeriod(
        userId,
        twentyFourHoursAgo
      );
      // Return Response
      return new Response(
        JSON.stringify({
          error:
            "Message limit reached. Please wait before sending more messages.",
          cooldown: formatTime(cooldown),
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(messageCount);

    // Get the latest user message
    const latestUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!latestUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save user message first
    try {
      await prisma.message.create({
        data: {
          chatId: chatId,
          role: "user",
          content: latestUserMessage.content,
        },
      });
    } catch (dbError: any) {
      console.error("Database error saving user message:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(latestUserMessage);

    // rephrase the user message using the history for better retrieval

    // get the embeddings
    const queryEmbedding = await getQueryEmbedding(latestUserMessage.content);

    const contextList = await retrieveFromPinecone({
      topK: 5,
      vector: queryEmbedding,
      chatId,
    });

    let context = "";
    for (const doc of contextList) {
      if (doc.metadata && doc.metadata.text) {
        context += doc.metadata.text;
      }
    }

    // Stream the response
    const result = await streamText({
      model: groq("gemma2-9b-it"), // Fixed model name
      system: `You are ChatWithPDF, an AI assistant that helps users interact with their uploaded PDF documents. You have access to the PDF's text provided below in <CONTEXT>. Use only the information from <CONTEXT> to answer the user's question. If the answer is not present or not clear in the context, politely let the user know you cannot answer based on the provided PDF. Be concise, accurate, and only respond with information relevant to the user's query.

      Give concise and clear anser formatted in markdown format.

    <CONTEXT>
    ${context}
    </CONTEXT>`,
      messages,
      onFinish: async (result) => {
        try {
          await prisma.message.create({
            data: {
              chatId: chatId,
              role: "assistant",
              content: result.text,
            },
          });
        } catch (dbError: any) {
          console.error("Database error saving assistant message:", dbError);
        }
      },
    });
    return new NextResponse(result.toDataStream());
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
