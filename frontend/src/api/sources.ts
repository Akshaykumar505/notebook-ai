import { apiRequest } from "./client";
import type { Source } from "@/types";

export function listSources(notebookId: string) {
  return apiRequest<Source[]>(`/notebooks/${notebookId}/sources`);
}

export function addTextSource(notebookId: string, title: string, content: string) {
  return apiRequest<Source>(`/notebooks/${notebookId}/sources/text`, {
    method: "POST",
    body: { title, content },
  });
}

export function addUrlSource(notebookId: string, title: string, url: string) {
  return apiRequest<Source>(`/notebooks/${notebookId}/sources/url`, {
    method: "POST",
    body: { title, url },
  });
}

export function addYoutubeSource(notebookId: string, title: string, url: string) {
  return apiRequest<Source>(`/notebooks/${notebookId}/sources/youtube`, {
    method: "POST",
    body: { title, url },
  });
}

export function uploadFileSource(notebookId: string, kind: "pdf" | "vtt", file: File, title?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  return apiRequest<Source>(`/notebooks/${notebookId}/sources/${kind}`, {
    method: "POST",
    body: formData,
  });
}

export function deleteSource(notebookId: string, sourceId: string) {
  return apiRequest<void>(`/notebooks/${notebookId}/sources/${sourceId}`, { method: "DELETE" });
}

export function reindexSource(notebookId: string, sourceId: string) {
  return apiRequest<{ message: string }>(`/notebooks/${notebookId}/sources/${sourceId}/reindex`, {
    method: "POST",
  });
}
