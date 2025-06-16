import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PDFService } from "@/lib/services/pdf.service";
import { RateLimitService } from "@/lib/services/rate-limit.service";
import { uploadFileSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fileName, fileSize, fileType } = body;

    // Validate input
    const validation = uploadFileSchema.safeParse({
      fileName,
      fileSize,
      fileType,
    });

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: validation.error.errors[0]?.message || "Invalid file data" 
        },
        { status: 400 }
      );
    }

    // Check upload rate limit
    const rateLimit = await RateLimitService.checkUploadRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error || "Upload limit exceeded" },
        { status: 429 }
      );
    }

    // Generate upload URL
    const result = await PDFService.generateUploadUrl(fileName);
    
    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate upload URL" 
      },
      { status: 500 }
    );
  }
}
