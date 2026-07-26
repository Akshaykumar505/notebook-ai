import { apiRequest } from "./client";
import type { QueryResult } from "@/types";

export function askQuestion(notebookId: string, question: string) {
  return apiRequest<QueryResult>(`/notebooks/${notebookId}/query`, {
    method: "POST",
    body: { question },
  });
}
