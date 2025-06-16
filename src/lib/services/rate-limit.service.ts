import { ChatService } from "./chat.service";

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
  cooldownTime?: string;
}

export class RateLimitService {
  private static readonly MAX_MESSAGES_PER_CHAT = 15;
  private static readonly MAX_MESSAGES_PER_DAY = 25;
  private static readonly COOLDOWN_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if user can send a message based on rate limits
   */
  static async checkRateLimit(userId: string, chatId: string): Promise<RateLimitResult> {
    try {
      // Check chat message limit
      const chatMessageCount = await ChatService.getChatMessageCount(chatId);
      if (chatMessageCount > this.MAX_MESSAGES_PER_CHAT) {
        return {
          allowed: false,
          error: "Maximum messages reached in this chat. Please start a new chat.",
        };
      }

      // Check daily message limit
      const twentyFourHoursAgo = new Date(Date.now() - this.COOLDOWN_PERIOD_MS);
      const dailyMessageCount = await ChatService.getUserMessageCount(userId, twentyFourHoursAgo);

      if (dailyMessageCount > this.MAX_MESSAGES_PER_DAY) {
        const cooldownTime = await this.calculateCooldownTime(userId, twentyFourHoursAgo);
        return {
          allowed: false,
          error: "Message limit reached. Please wait before sending more messages.",
          cooldownTime,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      return {
        allowed: false,
        error: "Failed to check rate limit. Please try again.",
      };
    }
  }

  /**
   * Calculate remaining cooldown time
   */
  private static async calculateCooldownTime(userId: string, since: Date): Promise<string> {
    try {
      const latestMessage = await ChatService.getLatestUserMessage(userId, since);
      
      if (!latestMessage?.createdAt) {
        return "0h 0m 0s";
      }

      const msSinceLast = Date.now() - new Date(latestMessage.createdAt).getTime();
      const cooldownMs = Math.max(0, this.COOLDOWN_PERIOD_MS - msSinceLast);
      
      return this.formatTime(cooldownMs);
    } catch (error) {
      console.error("Failed to calculate cooldown time:", error);
      return "Unknown";
    }
  }

  /**
   * Format milliseconds to human-readable time
   */
  private static formatTime(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Check if user can upload a new PDF (basic rate limiting)
   */
  static async checkUploadRateLimit(userId: string): Promise<RateLimitResult> {
    try {
      // Limit PDF uploads to prevent abuse
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentChats = await ChatService.getChatsForUser(userId);
      const recentUploads = recentChats.filter(chat => 
        new Date(chat.createdAt) > oneHourAgo
      );

      if (recentUploads.length >= 5) {
        return {
          allowed: false,
          error: "Upload limit reached. Please wait before uploading more PDFs.",
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Upload rate limit check failed:", error);
      return {
        allowed: false,
        error: "Failed to check upload limit. Please try again.",
      };
    }
  }
} 