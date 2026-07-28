import OpenAI from "openai";
import { env } from "@/config/env";

// Falls back to a placeholder string so the SDK doesn't throw at import time
// when OPENAI_API_KEY is unset — this client is only ever actually called
// if EMBEDDING_PROVIDER or LLM_PROVIDER is "openai" (env.ts already
// validates the real key is present in that case).
export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY ?? "unused" });