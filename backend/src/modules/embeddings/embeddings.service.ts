import { env } from "@/config/env";
import { openai } from "./openai.client";

// OpenAI allows many inputs per request; we still batch defensively
// so a single huge source doesn't send one massive request.
const BATCH_SIZE = 100;

/**
 * Converts an array of text strings into an array of embedding vectors
 * (same order in, same order out). Used both for indexing chunks and
 * for embedding the user's query at retrieval time.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: batch,
    });
    allEmbeddings.push(...response.data.map((item) => item.embedding));
  }

  return allEmbeddings;
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding!;
}
