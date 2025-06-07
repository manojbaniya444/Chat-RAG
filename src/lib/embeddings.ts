import { EmbeddingTask, TextChunk } from "@/types";

const JINA_API_KEY = process.env.JINA_API_KEY!;

// Get the Embeddings from the JINA Embedding Provider
async function fetchJinaEmbeddings(
  input: string[],
  dimensions: number,
  task: EmbeddingTask
): Promise<{ embedding: number[] }[]> {
  let response: Response;
  try {
    response = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JINA_API_KEY}`,
      },
      body: JSON.stringify({
        input,
        model: "jina-embeddings-v3",
        dimensions,
        task,
      }),
    });
  } catch (error: Error | unknown) {
    throw new Error(
      `Failed to fetch from Jina API: ${
        error instanceof Error && error.message
      }`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Jina API error: ${response.status} ${response.statusText}`
    );
  }

  const result: {
    data: { embedding: number[] }[];
  } = await response.json();

  return result.data;
}

// Get the Embeddings List given the Text Chunks
export async function getEmbeddings(
  textChunks: TextChunk[],
  dimensions: number = 1024,
  task: EmbeddingTask = "retrieval.passage"
): Promise<
  {
    embedding: number[];
    metadata: Record<string, unknown>;
  }[]
> {
  const texts = textChunks.map((chunk) => chunk.pageContent);
  const data = await fetchJinaEmbeddings(texts, dimensions, task);
  return data.map((item, idx) => ({
    embedding: item.embedding,
    metadata: textChunks[idx].metadata,
  }));
}

// Get the query embedding given single Query which returns Embedding Vector for that query
export async function getQueryEmbedding(
  query: string,
  dimensions: number = 1024,
  task: EmbeddingTask = "retrieval.query"
): Promise<number[]> {
  const data = await fetchJinaEmbeddings([query], dimensions, task);
  return data[0].embedding;
}
