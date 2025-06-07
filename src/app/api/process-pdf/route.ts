import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "@/lib/prisma";
import { pineconeIndex } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { sanitizeMetadata } from "@/utils/pineconeUtils";

// type EmbeddingTask =
//   | "text-matching"
//   | "classification"
//   | "separation"
//   | "retrieval.query"
//   | "retrieval.passage"
//   | string;

// type TextChunk = {
//   pageContent: string;
//   metadata: Record<string, any>;
// };

// async function getEmbeddings(
//   textChunks: TextChunk[],
//   dimensions: number,
//   task: EmbeddingTask
// ): Promise<
//   {
//     embedding: number[];
//     metadata: Record<string, any>;
//   }[]
// > {
//   const texts = textChunks.map((chunk) => chunk.pageContent);
//   const JINA_API_KEY = process.env.JINA_API_KEY!;

//   let response: Response;
//   try {
//     response = await fetch("https://api.jina.ai/v1/embeddings", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${JINA_API_KEY}`,
//       },
//       body: JSON.stringify({
//         input: texts,
//         model: "jina-embeddings-v3",
//         dimensions,
//         task,
//       }),
//     });
//   } catch (error: any) {
//     throw new Error(`Failed to fetch from Jina API: ${error.message}`);
//   }

//   if (!response.ok) {
//     throw new Error(
//       `Jina API error: ${response.status} ${response.statusText}`
//     );
//   }

//   const result: {
//     data: { embedding: number[] }[];
//   } = await response.json();

//   // Merge embedding with metadata
// return result.data.map((item, idx) => ({
//   embedding: item.embedding,
//   metadata: textChunks[idx].metadata,
// }));
// }

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

    // this docs contains a list of Doc with page content where each object is a page from a pdf
    // 1000 character per chunk
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 15,
    });

    // Add page metadata to each doc
    // Split all docs at once for efficiency and correctness
    const splitChunks = await textSplitter.splitDocuments(pages);

    // Create the chat in the database
    const chat = await prisma.chat.create({
      data: {
        title: path.split("/")[1] || "New Chat",
        summary: "",
        user_id: userId,
      },
    });

    // Add page metadata to each chunk, but set 'text' to the chunk's content
    type TextChunkMetadata = {
      page: number;
      text: string;
      chat_id: string;
      [key: string]: any;
    };

    type TextChunk = {
      pageContent: string;
      metadata: TextChunkMetadata;
    };

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

    // now include the chat id in all the metadata of the text chunks
    // for (const chunk of textChunks) {
    //   chunk.metadata = {
    //     ...chunk.metadata,
    //     chat_id: chat.id,
    //   };
    // }

    const embeddings = await getEmbeddings(textChunks);

    // Prepare vectors for Pinecone
    const vectors = embeddings.map((item, idx) => ({
      id: `${chat.id}-${idx}`,
      values: item.embedding,
      metadata: sanitizeMetadata(item.metadata),
    }));

    await pineconeIndex.describeIndexStats();

    // Upload to Pinecone
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
    message: "Successfully downloaded pdf file from the supabase",
  });
}
