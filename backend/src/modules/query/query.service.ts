import { AppError } from "@/middleware/errorHandler";
import { generateAnswer } from "./llm.service";
import { retrieveRelevantChunks, RetrievedChunk } from "@/modules/retrieval/retrieval.service";

export interface Citation {
  index: number; // the [1], [2], ... number referenced in the answer text
  chunkId: string;
  content: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  sourceOriginalRef: string | null;
  metadata: Record<string, unknown>;
}

export interface QueryResult {
  answer: string;
  citations: Citation[];
}

const SYSTEM_PROMPT = `You are a research assistant. Answer the user's question using ONLY the numbered
source excerpts provided below. Do not use any outside knowledge.

Rules:
- Every factual claim in your answer must be followed by a citation marker like [1] or [2],
  matching the excerpt number(s) it came from.
- If the excerpts don't contain enough information to answer, say so plainly — do not guess.
- Keep the answer concise and directly responsive to the question.`;

export async function answerQuestion(notebookId: string, question: string): Promise<QueryResult> {
  const chunks = await retrieveRelevantChunks(notebookId, question);

  if (chunks.length === 0) {
    throw new AppError(
      "This notebook has no ready sources to search yet. Add and index a source first.",
      422
    );
  }

  const { contextBlock, citations } = buildContext(chunks);

  const answer = await generateAnswer(
    SYSTEM_PROMPT,
    `Source excerpts:\n\n${contextBlock}\n\nQuestion: ${question}`
  );

  return { answer, citations };
}

/**
 * Turns retrieved chunks into a numbered context block for the prompt,
 * and a parallel citations array the frontend can use to render clickable
 * source references. The numbers here ([1], [2], ...) are what we instruct
 * the model to reference in its answer.
 */
function buildContext(chunks: RetrievedChunk[]): { contextBlock: string; citations: Citation[] } {
  const citations: Citation[] = chunks.map((chunk, i) => ({
    index: i + 1,
    chunkId: chunk.chunkId,
    content: chunk.content,
    sourceId: chunk.source.id,
    sourceTitle: chunk.source.title,
    sourceType: chunk.source.type,
    sourceOriginalRef: chunk.source.originalRef,
    metadata: chunk.metadata,
  }));

  const contextBlock = chunks
    .map((chunk, i) => `[${i + 1}] (source: "${chunk.source.title}")\n${chunk.content}`)
    .join("\n\n");

  return { contextBlock, citations };
}
