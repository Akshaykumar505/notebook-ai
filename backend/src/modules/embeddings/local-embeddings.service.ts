import { env } from "@/config/env";

// @xenova/transformers runs a small ONNX embedding model directly in Node
// (no API, no key, no internet after the first run — the model file is
// downloaded once and cached under node_modules/.cache).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelinePromise: Promise<any> | null = null;

async function getPipeline() {
  if (!pipelinePromise) {
    // Dynamic import because @xenova/transformers is an ESM-only package.
    pipelinePromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", env.LOCAL_EMBEDDING_MODEL)
    );
  }
  return pipelinePromise;
}

export async function embedTextsLocally(texts: string[]): Promise<number[][]> {
  const extractor = await getPipeline();
  const embeddings: number[][] = [];

  for (const text of texts) {
    // mean pooling + normalization gives one fixed-size vector per input text
    const output = await extractor(text, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(output.data as Float32Array));
  }

  return embeddings;
}