import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  console.log(file);

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json(
      {
        error: "Invalid file type",
      },
      {
        status: 400,
      }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      {
        error: "File size exceeds 5MB.",
      },
      {
        status: 400,
      }
    );
  }

  return NextResponse.json({
    success: true,
    message: "File uploaded success.",
  });
}
