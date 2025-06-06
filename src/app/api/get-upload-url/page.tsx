import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { fileName } = await req.json();

  if (!fileName) {
    return (
      NextResponse.json({
        error: "File name required.",
      }),
      {
        status: 400,
      }
    );
  }

  const filePath = `uploads/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("pdf-rag")
    .createSignedUploadUrl(filePath, {
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json(
    {
      url: data.signedUrl,
      path: filePath,
    },
    {
      status: 200,
    }
  );
}
