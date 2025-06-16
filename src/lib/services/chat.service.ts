import { prisma } from "@/lib/prisma";
import { Chat, Message } from "@prisma/client";
import { ChatMessageInput, CreateChatInput } from "@/lib/validations";
import { cache } from "react";

export class ChatService {
  // Get all chats for a user with caching
  static getChatsForUser = cache(async (userId: string): Promise<Chat[]> => {
    return await prisma.chat.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        user_id: true,
      },
    });
  });

  // Get a specific chat with messages
  static getChatWithMessages = cache(async (chatId: string, userId: string) => {
    return await prisma.chat.findFirst({
      where: {
        id: chatId,
        user_id: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });

  // Create a new chat
  static async createChat(input: CreateChatInput): Promise<Chat> {
    return await prisma.chat.create({
      data: {
        title: input.title,
        summary: "",
        user_id: input.userId,
      },
    });
  }

  // Add a message to a chat
  static async addMessage(input: ChatMessageInput): Promise<Message> {
    return await prisma.message.create({
      data: {
        chatId: input.chatId,
        role: input.role,
        content: input.content,
      },
    });
  }

  // Get message count for rate limiting
  static async getUserMessageCount(userId: string, since: Date): Promise<number> {
    return await prisma.message.count({
      where: {
        chat: {
          user_id: userId,
        },
        role: "user",
        createdAt: {
          gte: since,
        },
      },
    });
  }

  // Get total messages in a chat
  static async getChatMessageCount(chatId: string): Promise<number> {
    return await prisma.message.count({
      where: {
        chatId: chatId,
      },
    });
  }

  // Delete a chat and its messages
  static async deleteChat(chatId: string, userId: string): Promise<void> {
    // Verify ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        user_id: userId,
      },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    // Delete messages first (due to foreign key constraints)
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // Delete chat
    await prisma.chat.delete({
      where: { id: chatId },
    });
  }

  // Update chat title
  static async updateChatTitle(chatId: string, userId: string, title: string): Promise<Chat> {
    return await prisma.chat.update({
      where: {
        id: chatId,
        user_id: userId,
      },
      data: {
        title,
      },
    });
  }

  // Get latest user message for cooldown calculation
  static async getLatestUserMessage(userId: string, since: Date) {
    return await prisma.message.findFirst({
      where: {
        chat: {
          user_id: userId,
        },
        role: "user",
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
  }
} 