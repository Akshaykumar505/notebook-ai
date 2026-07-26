export type SourceType = "PDF" | "TEXT" | "URL" | "YOUTUBE" | "VTT";
export type SourceStatus = "UPLOADING" | "INDEXING" | "READY" | "FAILED";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Notebook {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { sources: number };
}

export interface Source {
  id: string;
  title: string;
  type: SourceType;
  status: SourceStatus;
  errorMessage: string | null;
  originalRef: string | null;
  createdAt: string;
  notebookId: string;
}

export interface Citation {
  index: number;
  chunkId: string;
  content: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: SourceType;
  sourceOriginalRef: string | null;
  metadata: Record<string, unknown>;
}

export interface QueryResult {
  answer: string;
  citations: Citation[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}
