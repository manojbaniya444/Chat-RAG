import { RetrieveOptions } from "@/types";
import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  throw new Error(
    "Missing Pinecone configuration. Check PINECONE_API_KEY and PINECONE_INDEX_NAME environment variables."
  );
}

export const pineconeClient = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export const pineconeIndex = pineconeClient.index(PINECONE_INDEX_NAME);

export async function retrieveFromPinecone({
  vector,
  chatId,
  filter = {},
  topK = 3,
}: RetrieveOptions) {
  if (!vector || !Array.isArray(vector)) {
    throw new Error("The 'vector' parameter is required and must be an array.");
  }
  if (!chatId) {
    throw new Error("The 'chatId' parameter is required.");
  }

  const queryFilter = {
    chat_id: chatId,
    ...filter,
  };

  const result = await pineconeIndex.query({
    vector,
    topK,
    filter: queryFilter,
    includeMetadata: true,
  });

  return result.matches || [];
}
