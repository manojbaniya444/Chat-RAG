"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PDFService } from "@/lib/services/pdf.service";
import { RateLimitService } from "@/lib/services/rate-limit.service";
import { uploadFileSchema } from "@/lib/validations";
import { z } from "zod";

// Action result type for consistent error handling
type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  redirectTo?: string;
};

/**
 * Generate signed upload URL for PDF
 */
export async function generateUploadUrlAction(
  fileName: string,
  fileSize: number,
  fileType: string
): Promise<ActionResult<{ url: string; path: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // Validate file type
    if (fileType !== "application/pdf") {
      return { success: false, error: "Only PDF files are allowed" };
    }

    // Validate file size (5MB limit)
    if (fileSize > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 5MB" };
    }

    // Check upload rate limit
    const rateLimit = await RateLimitService.checkUploadRateLimit(userId);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error || "Upload limit exceeded",
      };
    }

    // Generate upload URL
    const result = await PDFService.generateUploadUrl(fileName);
    
    return { 
      success: true, 
      data: { url: result.url, path: result.path }
    };
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
export async function processPDFAction(
  filePath: string,
  fileName: string
): Promise<ActionResult<{ chatId: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // Check upload rate limit
    const rateLimit = await RateLimitService.checkUploadRateLimit(userId);
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error || "Upload limit exceeded",
      };
    }

    // Process the PDF
    const chatId = await PDFService.processCompletePDF(filePath, userId);

    // Revalidate relevant paths
    revalidatePath("/chat");
    
    return { 
      success: true, 
      data: { chatId },
      redirectTo: `/chat/${chatId}`
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
export async function deletePDFAction(
  chatId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // Delete the PDF and chat
    await PDFService.deletePDF(chatId, userId);

    // Revalidate the chats list
    revalidatePath("/chat");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete PDF" 
    };
  }
}

/**
 * Check upload rate limit for user
 */
export async function checkUploadRateLimitAction(): Promise<ActionResult<boolean>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const rateLimit = await RateLimitService.checkUploadRateLimit(userId);
    
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error,
        data: false 
      };
    }

    return { success: true, data: true };
  } catch (error) {
    console.error("Failed to check upload rate limit:", error);
    return { 
      success: false, 
      error: "Failed to check upload limit",
      data: false 
    };
  }
}

/**
 * Form action for PDF upload with redirect
 */
export async function uploadPDFFormAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ chatId: string }>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const filePath = formData.get("filePath") as string;
    const fileName = formData.get("fileName") as string;

    if (!filePath || !fileName) {
      return { success: false, error: "File path and name are required" };
    }

    // Process the uploaded PDF
    const result = await processPDFAction(filePath, fileName);
    
    if (result.success && result.data?.chatId) {
      // Revalidate and redirect
      revalidatePath("/chat");
      return {
        success: true,
        data: { chatId: result.data.chatId },
        redirectTo: `/chat/${result.data.chatId}`
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to upload PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to upload PDF" 
    };
  }
} 