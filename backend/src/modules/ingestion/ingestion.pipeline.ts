import { v4 as uuid } from "uuid";
import { prisma } from "@/db/prisma";
import { chunkSegments } from "./chunker";
import { extractPdf } from "./extractors/pdf.extractor";
import { extractText } from "./extractors/text.extractor";
import { extractUrl } from "./extractors/url.extractor";
import { extractYoutube } from "./extractors/youtube.extractor";
import { extractVtt } from "./extractors/vtt.extractor";
import { ExtractedSegment } from "./ingestion.types";
import { embedTexts } from "@/modules/embeddings/embeddings.service";
import { addVectors, deleteVectorsBySource } from "@/modules/embeddings/vector-store.service";

/**
 * Runs the full pipeline for one source: extract -> chunk -> embed -> store.
 * This is called AFTER the Source row already exists with status UPLOADING,
 * so the API can respond to the client immediately while this keeps working
 * in the background. The frontend polls GET /sources to see status change
 * from UPLOADING -> INDEXING -> READY (or FAILED).
 */
export async function runIngestion(sourceId: string): Promise<void> {
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });

  try {
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "INDEXING", errorMessage: null },
    });

    const segments = await extractSegments(source.type, source.originalRef ?? "");

    const chunks = chunkSegments(segments);
    if (chunks.length === 0) {
      throw new Error("No content could be extracted from this source");
    }

    // Embed all chunk texts in one batched call.
    const embeddings = await embedTexts(chunks.map((c) => c.content));

    // Assign a vectorId (used as the ChromaDB record id) to each chunk up front,
    // so we can save the same id to both SQLite (for lookups/citations) and
    // ChromaDB (for similarity search) and use it to join them together later.
    const vectorIds = chunks.map(() => uuid());

    // Save chunk rows to SQLite first (so we have chunk ids for Chroma metadata).
    const createdChunks = await prisma.$transaction(
      chunks.map((chunk, i) =>
        prisma.chunk.create({
          data: {
            sourceId,
            content: chunk.content,
            chunkIndex: i,
            metadata: JSON.stringify(chunk.metadata),
            vectorId: vectorIds[i]!,
          },
        })
      )
    );

    await addVectors(
      source.notebookId,
      createdChunks.map((chunk, i) => ({
        vectorId: chunk.vectorId,
        embedding: embeddings[i]!,
        content: chunk.content,
        metadata: { sourceId, chunkId: chunk.id },
      }))
    );

    await prisma.source.update({ where: { id: sourceId }, data: { status: "READY" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ingestion error";
    console.error(`Ingestion failed for source ${sourceId}:`, message);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "FAILED", errorMessage: message },
    });
  }
}

async function extractSegments(
  type: string,
  originalRef: string
): Promise<ExtractedSegment[]> {
  switch (type) {
    case "PDF":
      return extractPdf(originalRef); // originalRef = file path
    case "VTT":
      return extractVtt(originalRef); // originalRef = file path
    case "TEXT":
      return extractText(originalRef); // originalRef = raw pasted text
    case "URL":
      return extractUrl(originalRef); // originalRef = website URL
    case "YOUTUBE":
      return extractYoutube(originalRef); // originalRef = video URL
    default:
      throw new Error(`Unsupported source type: ${type}`);
  }
}

/**
 * Removes a source's chunks and vectors, then re-runs the full pipeline.
 * Used by the "re-index" feature.
 */
export async function reindexSource(sourceId: string): Promise<void> {
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  await deleteVectorsBySource(source.notebookId, sourceId);
  await prisma.chunk.deleteMany({ where: { sourceId } });
  await runIngestion(sourceId);
}
