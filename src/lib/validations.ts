import { z } from "zod";

// Chat schemas
export const createChatSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  userId: z.string().min(1, "User ID is required"),
  filePath: z.string().min(1, "File path is required"),
});

export const chatMessageSchema = z.object({
  chatId: z.string().cuid("Invalid chat ID"),
  userId: z.string().min(1, "User ID is required"),
  content: z.string().min(1, "Message content is required").max(5000, "Message too long"),
  role: z.enum(["user", "assistant"]),
});

export const uploadFileSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  fileType: z.literal("application/pdf"),
});

// API request schemas
export const getChatMessagesSchema = z.object({
  chatId: z.string().cuid("Invalid chat ID"),
  userId: z.string().min(1, "User ID is required"),
});

export const deleteChatSchema = z.object({
  chatId: z.string().cuid("Invalid chat ID"),
  userId: z.string().min(1, "User ID is required"),
});

// Types derived from schemas
export type CreateChatInput = z.infer<typeof createChatSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type GetChatMessagesInput = z.infer<typeof getChatMessagesSchema>;
export type DeleteChatInput = z.infer<typeof deleteChatSchema>; 