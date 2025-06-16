import { supabaseServer } from "@/lib/supabaseClient";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pineconeIndex } from "@/lib/pinecone";
import { getEmbeddings } from "@/lib/embeddings";
import { sanitizeMetadata } from "@/utils/pineconeUtils";
import { TextChunk } from "@/types";
import { ChatService } from "./chat.service";

export class PDFService {
  private static readonly CHUNK_SIZE = 2000;
  private static readonly CHUNK_OVERLAP = 15;
  private static readonly BUCKET_ID = process.env.SUPABASE_BUCKET_ID as string;

  /**
   * Download PDF from Supabase storage
   */
  static async downloadPDF(path: string): Promise<Blob> {
    const { data, error } = await supabaseServer.storage
      .from(this.BUCKET_ID)
      .download(path);

    if (error || !data) {
      throw new Error(`Failed to download PDF: ${error?.message || "Unknown error"}`);
    }

    return data;
  }

  /**
   * Load and split PDF into text chunks
   */
  static async processPDFToChunks(pdfBlob: Blob): Promise<TextChunk[]> {
    try {
      const loader = new PDFLoader(pdfBlob);
      const pages = await loader.load();

      console.log(`Loaded ${pages.length} total pages.`);

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.CHUNK_SIZE,
        chunkOverlap: this.CHUNK_OVERLAP,
      });

      const splitChunks = await textSplitter.splitDocuments(pages);
      
      return splitChunks.map((chunk) => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          page: Number(chunk.metadata?.loc?.pageNumber ?? 0),
          text: chunk.pageContent as string,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate embeddings and store in Pinecone
   */
  static async embedAndStore(textChunks: TextChunk[], chatId: string): Promise<void> {
    try {
      // Add chat_id to metadata
      const chunksWithChatId = textChunks.map(chunk => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          chat_id: chatId,
        },
      }));

      console.log(`Preparing ${chunksWithChatId.length} document chunks for embedding.`);

      const embeddings = await getEmbeddings(chunksWithChatId);

      const vectors = embeddings.map((item, idx) => ({
        id: `${chatId}-${idx}`,
        values: item.embedding,
        metadata: sanitizeMetadata(item.metadata),
      }));

      await pineconeIndex.describeIndexStats();
      await pineconeIndex.upsert(vectors);

      console.log(`Successfully stored ${vectors.length} vectors in Pinecone.`);
    } catch (error) {
      throw new Error(`Failed to embed and store chunks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Complete PDF processing pipeline
   */
  static async processCompletePDF(filePath: string, userId: string): Promise<string> {
    try {
      // 1. Download PDF
      const pdfBlob = await this.downloadPDF(filePath);

      // 2. Process PDF to text chunks
      const textChunks = await this.processPDFToChunks(pdfBlob);

      // 3. Create chat record
      const fileName = filePath.split("/").pop() || "New Chat";
      const chat = await ChatService.createChat({
        title: fileName.replace('.pdf', ''),
        userId,
        filePath,
      });

      // 4. Embed and store in vector database
      await this.embedAndStore(textChunks, chat.id);

      return chat.id;
    } catch (error) {
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate signed upload URL for Supabase
   */
  static async generateUploadUrl(fileName: string): Promise<{ url: string; path: string }> {
    try {
      const uniqueId = crypto.randomUUID();
      const path = `pdfs/${uniqueId}/${fileName}`;

      const { data, error } = await supabaseServer.storage
        .from(this.BUCKET_ID)
        .createSignedUploadUrl(path);

      if (error || !data) {
        throw new Error(`Failed to generate upload URL: ${error?.message || "Unknown error"}`);
      }

      return {
        url: data.signedUrl,
        path: path,
      };
    } catch (error) {
      throw new Error(`Upload URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Delete PDF from storage and associated vectors
   */
  static async deletePDF(filePath: string, chatId: string): Promise<void> {
    try {
      // Delete from Supabase storage
      await supabaseServer.storage
        .from(this.BUCKET_ID)
        .remove([filePath]);

      // Delete vectors from Pinecone (if needed)
      // Note: This is optional as vectors are filtered by chat_id during retrieval
      // You might want to implement vector cleanup for storage optimization
      
      console.log(`Successfully deleted PDF and associated data for chat ${chatId}`);
    } catch (error) {
      console.error(`Failed to delete PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
      // Don't throw error as this is cleanup operation
    }
  }
} 