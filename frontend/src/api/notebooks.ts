import { apiRequest } from "./client";
import type { Notebook, Source } from "@/types";

export function listNotebooks() {
  return apiRequest<Notebook[]>("/notebooks");
}

export function createNotebook(title: string, description?: string) {
  return apiRequest<Notebook>("/notebooks", { method: "POST", body: { title, description } });
}

export function getNotebook(id: string) {
  return apiRequest<Notebook & { sources: Source[] }>(`/notebooks/${id}`);
}

export function deleteNotebook(id: string) {
  return apiRequest<void>(`/notebooks/${id}`, { method: "DELETE" });
}
