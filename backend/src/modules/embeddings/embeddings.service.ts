import { env } from "@/config/env";
import { openai } from "./openai.client";
import { embedTextsLocally } from "./local-embeddings.service";

// OpenAI allows many inputs per request; we still batch defensively
// so a single huge source doesn't send one massive request.
const BATCH_SIZE = 100;

/**
 * Converts an array of text strings into an array of embedding vectors
 * (same order in, same order out). Used both for indexing chunks and
 * for embedding the user's query at retrieval time.
 *
 * Which model actually runs is controlled by EMBEDDING_PROVIDER in .env —
 * everything else in the app (chunking, vector store, retrieval) is
 * unaware of which provider produced the numbers, so switching providers
 * never requires touching any other file.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (env.EMBEDDING_PROVIDER === "local") {
    return embedTextsLocally(texts);
  }

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