import fs from "fs";
import path from "path";
import { env } from "@/config/env";

/**
 * A minimal, dependency-free vector store — no separate server, no Python,
 * no Docker. Good enough for a learning project / small notebooks.
 *
 * How it works:
 * - Each notebook gets its own JSON file: <VECTOR_STORE_DIR>/<notebookId>.json
 *   containing an array of records (this is what gives us "isolated
 *   knowledge base per notebook" — one notebook's file never touches another's).
 * - To add vectors, we read the file, append new records, write it back.
 * - To search, we read the file, compute cosine similarity between the query
 *   vector and every stored vector, and return the top K closest matches.
 *
 * This is O(n) per query (compares against every stored vector) — perfectly
 * fine for hundreds/thousands of chunks. A production system with millions
 * of chunks would use an approximate-nearest-neighbor index (which is what
 * ChromaDB/Pinecone/etc. do internally) instead of brute-force comparison.
 */

interface VectorFileRecord {
  vectorId: string;
  embedding: number[];
  content: string;
  metadata: { sourceId: string; chunkId: string };
}

export interface VectorRecord {
  vectorId: string;
  embedding: number[];
  content: string;
  metadata: { sourceId: string; chunkId: string };
}

function storeFilePath(notebookId: string): string {
  return path.join(env.VECTOR_STORE_DIR, `${notebookId}.json`);
}

function readStore(notebookId: string): VectorFileRecord[] {
  const filePath = storeFilePath(notebookId);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeStore(notebookId: string, records: VectorFileRecord[]): void {
  if (!fs.existsSync(env.VECTOR_STORE_DIR)) {
    fs.mkdirSync(env.VECTOR_STORE_DIR, { recursive: true });
  }
  fs.writeFileSync(storeFilePath(notebookId), JSON.stringify(records));
}

/**
 * Cosine similarity: measures the angle between two vectors, ignoring
 * their magnitude. Returns a value from -1 (opposite) to 1 (identical
 * direction). For text embeddings, closer to 1 means more semantically similar.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function addVectors(notebookId: string, records: VectorRecord[]): Promise<void> {
  if (records.length === 0) return;
  const existing = readStore(notebookId);
  writeStore(notebookId, [...existing, ...records]);
}

export async function queryVectors(notebookId: string, queryEmbedding: number[], topK: number) {
  const records = readStore(notebookId);

  const scored = records.map((record) => ({
    vectorId: record.vectorId,
    content: record.content,
    metadata: record.metadata,
    similarity: cosineSimilarity(queryEmbedding, record.embedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity); // highest similarity first

  return scored.slice(0, topK).map((r) => ({
    vectorId: r.vectorId,
    content: r.content,
    metadata: r.metadata,
    // Expressed as "distance" (lower = more similar) to match the
    // convention used by most vector databases.
    distance: 1 - r.similarity,
  }));
}

export async function deleteVectorsBySource(notebookId: string, sourceId: string): Promise<void> {
  const existing = readStore(notebookId);
  const filtered = existing.filter((r) => r.metadata.sourceId !== sourceId);
  writeStore(notebookId, filtered);
}
