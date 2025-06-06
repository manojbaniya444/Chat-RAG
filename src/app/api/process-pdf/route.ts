import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "@/lib/prisma"; // adjust import path as needed
import { pinecone } from "@/lib/pinecone";

type EmbeddingTask =
  | "text-matching"
  | "classification"
  | "separation"
  | "retrieval.query"
  | "retrieval.passage"
  | string;

type TextChunk = {
  pageContent: string;
  metadata: Record<string, any>;
};

async function getEmbeddings(
  textChunks: TextChunk[],
  dimensions: number,
  task: EmbeddingTask
): Promise<
  {
    embedding: number[];
    metadata: Record<string, any>;
  }[]
> {
  const texts = textChunks.map((chunk) => chunk.pageContent);
  const JINA_API_KEY = process.env.JINA_API_KEY!;

  let response: Response;
  try {
    response = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JINA_API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: "jina-embeddings-v3",
        dimensions,
        task,
      }),
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch from Jina API: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(
      `Jina API error: ${response.status} ${response.statusText}`
    );
  }

  const result: {
    data: { embedding: number[] }[];
  } = await response.json();

  // Merge embedding with metadata
  return result.data.map((item, idx) => ({
    embedding: item.embedding,
    metadata: textChunks[idx].metadata,
  }));
}

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

    // this docs contains a list of Doc with page content where each object is a page from a pdf
    // 500 character per chunk
    const textSplitter = new CharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 15,
    });

    // Add page metadata to each doc
    const docsWithPageMetadata = pages.map((doc, idx) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        page: idx + 1,
        text:
          typeof doc.pageContent === "string"
            ? doc.pageContent.slice(0, 50)
            : "",
      },
    }));

    // Split text in each doc using textSplitter
    const textChunks = [];
    for (const doc of docsWithPageMetadata) {
      const splits = await textSplitter.splitDocuments([doc]);
      textChunks.push(...splits);
    }

    // Example: create a new chat entry in the database using Prisma

    // You may want to generate a title and summary from the textChunks
    const title = path.split("/")[1] || "New Chat";
    const summary = "";

    // Create the chat in the database
    const chat = await prisma.chat.create({
      data: {
        title,
        summary,
        user_id: userId,
      },
    });

    // now include the chat id in all the metadata of the text chunks
    for (const chunk of textChunks) {
      chunk.metadata = {
        ...chunk.metadata,
        chat_id: chat.id,
      };
    }

    // view the docs
    console.log(textChunks);

    const embeddings = await getEmbeddings(
      textChunks,
      1024,
      "retrieval.passage"
    );

    // Prepare vectors for Pinecone
    const vectors = embeddings.map((item, idx) => ({
      id: `${chat.id}-${idx}`,
      values: item.embedding,
      metadata: item.metadata,
    }));
    const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;

    console.log(vectors[0]);

    const index = pinecone.index(PINECONE_INDEX_NAME);

    await index.describeIndexStats();

    // Upload to Pinecone
    await index.upsert(vectors);
  } catch (error: any) {
    console.log("Error loading pdf to text, ", error);
    return NextResponse.json(
      {
        error: `Error loading pdf to text: ${error.message}`,
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
