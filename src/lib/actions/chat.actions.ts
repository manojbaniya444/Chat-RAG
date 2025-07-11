"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ChatService } from "@/lib/services/chat.service";
import { RateLimitService } from "@/lib/services/rate-limit.service";
import { 
  chatMessageSchema, 
  deleteChatSchema, 
  getChatMessagesSchema 
} from "@/lib/validations";

// Action result type for consistent error handling
type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all chats for the authenticated user
 */
export async function getChatsAction(): Promise<ActionResult<unknown[]>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const chats = await ChatService.getChatsForUser(userId);
    
    return { success: true, data: chats };
  } catch (error) {
    console.error("Failed to get chats:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to load chats" 
    };
  }
}

/**
 * Get a specific chat with messages
 */
export async function getChatWithMessagesAction(chatId: string): Promise<ActionResult<unknown>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // Validate input
    const validation = getChatMessagesSchema.safeParse({ chatId, userId });
    if (!validation.success) {
      return { success: false, error: "Invalid chat ID" };
    }

    const chat = await ChatService.getChatWithMessages(chatId, userId);
    
    if (!chat) {
      return { success: false, error: "Chat not found or access denied" };
    }

    return { success: true, data: chat };
  } catch (error) {
    console.error("Failed to get chat:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to load chat" 
    };
  }
}

  /**
   * Delete a chat and all its messages
   */
  export async function deleteChatAction(chatId: string): Promise<ActionResult<void>> {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return { success: false, error: "Authentication required" };
      }

      // Validate input
      const validation = deleteChatSchema.safeParse({ chatId, userId });
      if (!validation.success) {
        return { success: false, error: "Invalid chat ID" };
      }

      await ChatService.deleteChat(chatId, userId);

      // Revalidate the chats list
      revalidatePath("/chat");
      
      return { success: true };
    } catch (error) {
      console.error("Failed to delete chat:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete chat" 
      };
    }
  }



/**
 * Add a user message to a chat (for form submissions)
 */
export async function addMessageAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ chatId: string; content: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const chatId = formData.get("chatId") as string;
    const content = formData.get("content") as string;

    // Validate input
    const validation = chatMessageSchema.safeParse({
      chatId,
      userId,
      content,
      role: "user",
    });

    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || "Invalid input" 
      };
    }

    // Check rate limits
    const rateLimit = await RateLimitService.checkRateLimit(userId, chatId);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error || "Rate limit exceeded",
      };
    }

    // Add message to database
    await ChatService.addMessage({
      chatId,
      userId,
      content: content.trim(),
      role: "user",
    });

    revalidatePath(`/chat/${chatId}`);
    
    return { 
      success: true, 
      data: { chatId, content: content.trim() }
    };
  } catch (error) {
    console.error("Failed to add message:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send message" 
    };
  }
}

/**
 * Check if user can send messages (rate limiting check)
 */
export async function checkMessageRateLimitAction(chatId: string): Promise<ActionResult<boolean>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const rateLimit = await RateLimitService.checkRateLimit(userId, chatId);
    
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error,
        data: false 
      };
    }

    return { success: true, data: true };
  } catch (error) {
    console.error("Failed to check rate limit:", error);
    return { 
      success: false, 
      error: "Failed to check rate limit",
      data: false 
    };
  }
} 