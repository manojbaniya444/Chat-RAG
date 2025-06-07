import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "@/lib/prisma";
import { pineconeIndex } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { sanitizeMetadata } from "@/utils/pineconeUtils";
import { TextChunk } from "@/types";

// POST: DOwnload the PDF from the Supabase Bucket and Process the PDF by Splitting, Embedding and Upserting to Vectorstore
// Better use Background Queues
export async function POST(req: NextRequest) {
  const { path, userId } = await req.json();

  // if the file path is not given then return response
  if (!path || !userId) {
    return NextResponse.json(
      {
        error: "Missing file path or userId",
      },
      {
        status: 400,
      }
    );
  }

  const bucketId = process.env.SUPABASE_BUCKET_ID as string;

  const { data, error } = await supabaseServer.storage
    .from(bucketId)
    .download(path);

  if (error || !data) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Download from supabase fail",
      },
      {
        status: 500,
      }
    );
  }

  console.log(data);

  try {
    const loader = new PDFLoader(data);
    const pages = await loader.load();

    console.log(`Loaded ${pages.length} total pages.`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 15,
    });

    const splitChunks = await textSplitter.splitDocuments(pages);

    const chat = await prisma.chat.create({
      data: {
        title: path.split("/")[1] || "New Chat",
        summary: "",
        user_id: userId,
      },
    });

    const textChunks: TextChunk[] = splitChunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        page: Number(chunk.metadata?.loc?.pageNumber ?? 0),
        text: chunk.pageContent as string,
        chat_id: chat.id,
      },
    }));

    console.log(`Prepared total document ${textChunks.length} to store.`);

    const embeddings = await getEmbeddings(textChunks);

    const vectors = embeddings.map((item, idx) => ({
      id: `${chat.id}-${idx}`,
      values: item.embedding,
      metadata: sanitizeMetadata(item.metadata),
    }));

    await pineconeIndex.describeIndexStats();

    await pineconeIndex.upsert(vectors);
  } catch (error: any) {
    console.log("Error processing pdf:, ", error);
    return NextResponse.json(
      {
        error: `Error processing pdf to text: ${error.message}`,
      },
      {
        status: 400,
      }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Successfully process pdf now ready to chat.",
  });
}
