import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;

// Add validation at the top of your file
if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  throw new Error(
    "Missing Pinecone configuration. Check PINECONE_API_KEY and PINECONE_INDEX_NAME environment variables."
  );
}

export const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});
