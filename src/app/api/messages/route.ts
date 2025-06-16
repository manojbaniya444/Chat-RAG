import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const chatId = req.nextUrl.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const chat = await prisma.chat.findUnique({ 
    where: { id: chatId },
    select: {
      id: true,
      title: true,
      summary: true
    }
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ 
      messages,
      chat: {
        id: chat.id,
        title: chat.title,
        summary: chat.summary
      }
    });
  } catch (error: Error | unknown) {
    return NextResponse.json(
      { error: (error instanceof Error && error.message) || "Unknown error" },
      { status: 500 }
    );
  }
}
