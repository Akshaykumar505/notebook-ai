import { prisma } from "@/db/prisma";
import { embedText } from "@/modules/embeddings/embeddings.service";
import { queryVectors } from "@/modules/embeddings/vector-store.service";

export interface RetrievedChunk {
  chunkId: string;
  content: string;
  distance: number;
  metadata: Record<string, unknown>;
  source: { id: string; title: string; type: string; originalRef: string | null };
}

const DEFAULT_TOP_K = 5;

/**
 * The core retrieval step of RAG:
 * 1. Turn the user's question into an embedding (same model as chunks,
 *    so they live in the same vector space and distances are meaningful).
 * 2. Ask ChromaDB (scoped to this notebook only) for the closest chunks.
 * 3. Chroma only stores the vector + a copy of the text + minimal metadata
 *    (sourceId, chunkId) — so we join back to SQLite here to get full
 *    chunk metadata (page numbers, timestamps) and source info (title, type)
 *    needed to render citations.
 */
export async function retrieveRelevantChunks(
  notebookId: string,
  question: string,
  topK: number = DEFAULT_TOP_K
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(question);
  const matches = await queryVectors(notebookId, queryEmbedding, topK);

  if (matches.length === 0) return [];

  const chunkIds = matches.map((m) => m.metadata.chunkId);
  const chunks = await prisma.chunk.findMany({
    where: { id: { in: chunkIds } },
    include: { source: { select: { id: true, title: true, type: true, originalRef: true } } },
  });
  const chunkById = new Map(chunks.map((c) => [c.id, c]));

  return matches
    .map((match) => {
      const chunk = chunkById.get(match.metadata.chunkId);
      if (!chunk) return null; // chunk might have been deleted since indexing
      return {
        chunkId: chunk.id,
        content: chunk.content,
        distance: match.distance,
        metadata: JSON.parse(chunk.metadata),
        source: chunk.source,
      };
    })
    .filter((c): c is RetrievedChunk => c !== null);
}
