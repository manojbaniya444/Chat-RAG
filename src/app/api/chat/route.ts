import { NextRequest, NextResponse } from "next/server";
import { streamText, UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
    }: { messages: UIMessage[]; chatId: string; userId: string } =
      await req.json();

    // here check if the user has more than limited messages in limited time.
    // Count messages sent by the user in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messageCount = await prisma.message.count({
      where: {
        chat: {
          user_id: userId,
        },
        role: "user",
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // also if the messages in the chat exceeds 25 throw error showing maximum chat reach
    const chatMessageCount = await prisma.message.count({
      where: {
        chatId: chatId,
      },
    });

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

    if (messageCount > 30) {
      const latestMessage = await prisma.message.findFirst({
        where: {
          chat: {
            user_id: userId,
          },
          role: "user",
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      console.log(chatMessageCount);

      let cooldown = 0;
      if (latestMessage?.createdAt) {
        const msSinceLast =
          Date.now() - new Date(latestMessage.createdAt).getTime();
        cooldown = Math.max(0, 24 * 60 * 60 * 1000 - msSinceLast);
      }

      const formatTime = (ms: number) => {
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
      };

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

    // Validate chatId
    if (!chatId) {
      return new Response(JSON.stringify({ error: "Chat ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    await prisma.message.create({
      data: {
        chatId: chatId,
        role: "user",
        content: latestUserMessage.content,
      },
    });

    // rephrase the user message using the history for better retrieval

    // get the embeddings

    // filter and select top n matching retrieval from the pinecone database

    // provide the llm with the system prompt, fetch context and then the history messages to generate the answer.

    // Stream the response
    const result = await streamText({
      model: groq("gemma2-9b-it"), // Fixed model name
      system:
        "You are a really funny friend who always jokes and answer in a clear and concise response.",
      messages,
      onFinish: async (result) => {
        // Save AI response when streaming is complete
        await prisma.message.create({
          data: {
            chatId: chatId,
            role: "assistant",
            content: result.text,
          },
        });
      },
    });

    // Return the streamed response
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Model error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
