import { prisma } from "@/db/prisma";
import { AppError } from "@/middleware/errorHandler";

export async function createNotebook(ownerId: string, title: string, description?: string) {
  return prisma.notebook.create({
    data: { ownerId, title, description },
  });
}

export async function listNotebooks(ownerId: string) {
  return prisma.notebook.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { sources: true } } },
  });
}

export async function getNotebook(ownerId: string, notebookId: string) {
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, ownerId },
    include: { sources: { orderBy: { createdAt: "desc" } } },
  });

  if (!notebook) {
    throw new AppError("Notebook not found", 404);
  }

  return notebook;
}

/**
 * Lightweight check used by other modules (e.g. sources) to confirm a
 * notebook exists and belongs to this user, without fetching all its data.
 */
export async function assertNotebookOwnership(ownerId: string, notebookId: string) {
  const notebook = await prisma.notebook.findFirst({ where: { id: notebookId, ownerId } });
  if (!notebook) {
    throw new AppError("Notebook not found", 404);
  }
  return notebook;
}

export async function deleteNotebook(ownerId: string, notebookId: string) {
  // findFirst first so we 404 instead of silently deleting nothing
  // if this notebook doesn't belong to this user.
  const notebook = await prisma.notebook.findFirst({ where: { id: notebookId, ownerId } });
  if (!notebook) {
    throw new AppError("Notebook not found", 404);
  }

  await prisma.notebook.delete({ where: { id: notebookId } });
}
