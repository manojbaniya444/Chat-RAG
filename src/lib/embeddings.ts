type TextChunk = {
  pageContent: string;
  metadata: Record<string, any>;
};

type EmbeddingTask =
  | "text-matching"
  | "classification"
  | "separation"
  | "retrieval.query"
  | "retrieval.passage"
  | string;

export async function getEmbeddings(
  textChunks: TextChunk[],
  dimensions: number = 1024,
  task: EmbeddingTask = "retrieval.passage"
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

  return result.data.map((item, idx) => ({
    embedding: item.embedding,
    metadata: textChunks[idx].metadata,
  }));
}

export async function getQueryEmbedding(
  query: string,
  dimensions: number = 1024,
  task: EmbeddingTask = "retrieval.query"
): Promise<number[]> {
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
        input: [query],
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

  return result.data[0].embedding;
}
