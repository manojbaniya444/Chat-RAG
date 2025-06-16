"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { PDFService } from "@/lib/services/pdf.service";
import { RateLimitService } from "@/lib/services/rate-limit.service";
import { uploadFileSchema } from "@/lib/validations";
import { z } from "zod";

// Action result type for consistent error handling
type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Generate signed upload URL for PDF
 */
export async function generateUploadUrlAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult<{ url: string; path: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const fileName = formData.get("fileName") as string;
    const fileSize = Number(formData.get("fileSize"));
    const fileType = formData.get("fileType") as string;

    // Validate input
    const validation = uploadFileSchema.safeParse({
      fileName,
      fileSize,
      fileType,
    });

    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || "Invalid file" 
      };
    }

    // Check upload rate limit
    const rateLimit = await RateLimitService.checkUploadRateLimit(userId);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error || "Upload limit exceeded" 
      };
    }

    // Generate upload URL
    const result = await PDFService.generateUploadUrl(fileName);
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate upload URL" 
    };
  }
}

/**
 * Process uploaded PDF and create chat
 */
export async function processPdfAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult<{ chatId: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const filePath = formData.get("filePath") as string;

    if (!filePath) {
      return { success: false, error: "File path is required" };
    }

    // Process PDF and create chat
    const chatId = await PDFService.processCompletePDF(filePath, userId);
    
    // Revalidate multiple paths to ensure cache updates
    revalidatePath("/chat");
    revalidatePath("/chat/[id]", "page");
    revalidatePath("/api/chat");
    
    // Return success with chatId for client-side navigation
    return { 
      success: true, 
      data: { chatId } 
    };
  } catch (error) {
    console.error("Failed to process PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process PDF" 
    };
  }
}

/**
 * Upload PDF to storage (used after getting signed URL)
 */
export async function uploadPdfToStorageAction(
  file: File,
  uploadUrl: string
): Promise<ActionResult> {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf",
      },
      body: file,
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: `Upload failed: ${response.statusText}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to upload PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Upload failed" 
    };
  }
}

/**
 * Complete PDF upload and processing workflow
 */
export async function uploadAndProcessPdfAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult<{ chatId: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const file = formData.get("file") as File;
    
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided" };
    }

    // Validate file
    const validation = uploadFileSchema.safeParse({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors[0]?.message || "Invalid file" 
      };
    }

    // Check upload rate limit
    const rateLimit = await RateLimitService.checkUploadRateLimit(userId);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error || "Upload limit exceeded" 
      };
    }

    // Step 1: Generate signed URL
    const uploadResult = await PDFService.generateUploadUrl(file.name);
    
    // Step 2: Upload file to storage
    const uploadResponse = await fetch(uploadResult.url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      return { 
        success: false, 
        error: "Failed to upload file to storage" 
      };
    }

    // Step 3: Process PDF
    const chatId = await PDFService.processCompletePDF(uploadResult.path, userId);
    
    // Revalidate chat list
    revalidatePath("/chat");
    
    return { success: true, data: { chatId } };
  } catch (error) {
    console.error("Failed to upload and process PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process PDF" 
    };
  }
}

/**
 * Delete PDF and associated chat
 */
export async function deletePdfAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const chatId = formData.get("chatId") as string;
    const filePath = formData.get("filePath") as string;

    if (!chatId || !filePath) {
      return { success: false, error: "Missing required parameters" };
    }

    // Delete PDF from storage (optional cleanup)
    await PDFService.deletePDF(filePath, chatId);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete PDF" 
    };
  }
} 