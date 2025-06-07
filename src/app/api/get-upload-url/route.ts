import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json();
    console.log("request received here", fileName);

    if (!fileName) {
      return NextResponse.json(
        { error: "File name required." },
        { status: 400 }
      );
    }

    const filePath = `uploads/${Date.now()}-${fileName}`;
    const bucketId = process.env.SUPABASE_BUCKET_ID as string;

    const { data, error } = await supabaseServer.storage
      .from(bucketId)
      .createSignedUploadUrl(filePath, {
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        url: data.signedUrl,
        path: filePath,
      },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        error: (err instanceof Error && err.message) || "Internal server error",
      },
      { status: 500 }
    );
  }
}
