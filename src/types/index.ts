export type TextChunk = {
  pageContent: string;
  metadata: Record<string, unknown>;
};

export type EmbeddingTask =
  | "text-matching"
  | "classification"
  | "separation"
  | "retrieval.query"
  | "retrieval.passage"
  | string;

export type RetrieveOptions = {
  vector: number[];
  topK?: number;
  chatId: string;
  filter?: Record<string, unknown>;
};

export type TextChunkMetadata = {
  page: number;
  text: string;
  chat_id: string;
  [key: string]: unknown;
};
