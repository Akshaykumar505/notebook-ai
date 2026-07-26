import fs from "fs";
import { prisma } from "@/db/prisma";
import { AppError } from "@/middleware/errorHandler";
import { runIngestion, reindexSource } from "@/modules/ingestion/ingestion.pipeline";
import { deleteVectorsBySource } from "@/modules/embeddings/vector-store.service";

/**
 * Creates a Source row with status UPLOADING, then fires off the ingestion
 * pipeline WITHOUT awaiting it. This lets the API respond immediately
 * (so the UI can show the "uploading" state right away) while extraction/
 * chunking/embedding happens in the background. The client polls
 * GET /notebooks/:id (which includes sources) to see status progress.
 */
async function createAndIngest(params: {
  notebookId: string;
  title: string;
  type: "PDF" | "TEXT" | "URL" | "YOUTUBE" | "VTT";
  originalRef: string;
}) {
  const source = await prisma.source.create({
    data: {
      notebookId: params.notebookId,
      title: params.title,
      type: params.type,
      originalRef: params.originalRef,
      status: "UPLOADING",
    },
  });

  // Fire-and-forget. Errors inside runIngestion are caught internally
  // and recorded on the source's status/errorMessage.
  void runIngestion(source.id);

  return source;
}

export async function createTextSource(notebookId: string, title: string, content: string) {
  return createAndIngest({ notebookId, title, type: "TEXT", originalRef: content });
}

export async function createUrlSource(notebookId: string, title: string, url: string) {
  return createAndIngest({ notebookId, title, type: "URL", originalRef: url });
}

export async function createYoutubeSource(notebookId: string, title: string, url: string) {
  return createAndIngest({ notebookId, title, type: "YOUTUBE", originalRef: url });
}

export async function createFileSource(
  notebookId: string,
  title: string,
  type: "PDF" | "VTT",
  filePath: string
) {
  return createAndIngest({ notebookId, title, type, originalRef: filePath });
}

export async function listSources(notebookId: string) {
  return prisma.source.findMany({ where: { notebookId }, orderBy: { createdAt: "desc" } });
}

async function getSourceOrThrow(notebookId: string, sourceId: string) {
  const source = await prisma.source.findFirst({ where: { id: sourceId, notebookId } });
  if (!source) {
    throw new AppError("Source not found", 404);
  }
  return source;
}

export async function deleteSource(notebookId: string, sourceId: string) {
  const source = await getSourceOrThrow(notebookId, sourceId);

  await deleteVectorsBySource(notebookId, sourceId);

  // Clean up the uploaded file on disk for PDF/VTT sources.
  if ((source.type === "PDF" || source.type === "VTT") && source.originalRef) {
    fs.unlink(source.originalRef, () => {
      /* best-effort cleanup, ignore errors */
    });
  }

  await prisma.source.delete({ where: { id: sourceId } }); // cascades to chunks
}

export async function reindex(notebookId: string, sourceId: string) {
  await getSourceOrThrow(notebookId, sourceId);
  void reindexSource(sourceId);
}
