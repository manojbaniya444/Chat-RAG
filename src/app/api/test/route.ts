import { getQueryEmbedding } from "@/lib/embeddings";
import { retrieveFromPinecone } from "@/lib/pinecone";

export async function GET() {
  try {
    // Dummy query for testing
    const query = "How to build AI Agents";
    // Get embedding for the query
    const embedding = await getQueryEmbedding(query);
    // Retrieve documents from Pinecone using the embedding
    const results = await retrieveFromPinecone({
      vector: embedding,
      chatId: "cmblq1zm00001f2l8fmzg8car",
    });

    console.log(results);
    let context = "";
    for (const doc of results) {
      if (doc.metadata && doc.metadata.text) {
        context += doc.metadata.text;
      }
    }

    console.log(context);

    return Response.json({ results });
  } catch (error) {
    console.error("Error in GET /api/test:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
