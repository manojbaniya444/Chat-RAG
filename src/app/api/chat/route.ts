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
    const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
      await req.json();

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
