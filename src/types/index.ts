export type TextChunk = {
  pageContent: string;
  metadata: Record<string, any>;
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
  filter?: Record<string, any>;
};

export type TextChunkMetadata = {
  page: number;
  text: string;
  chat_id: string;
  [key: string]: any;
};
