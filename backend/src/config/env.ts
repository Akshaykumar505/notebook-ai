import "dotenv/config";
import { z } from "zod";

/**
 * Why validate env vars with Zod instead of just reading process.env directly?
 * - If OPENAI_API_KEY is missing, we want the app to crash immediately at startup
 *   with a clear message, not fail confusingly deep inside an API call at 2am.
 * - Every other file imports `env` (typed!) instead of `process.env` (untyped, any string|undefined).
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Which provider generates embeddings (chunk vectors + query vectors).
  // "local" = free, runs on this machine, no API key needed (@xenova/transformers).
  // "openai" = paid, needs OPENAI_API_KEY + billing.
  EMBEDDING_PROVIDER: z.enum(["local", "openai"]).default("local"),

  // Which provider generates the final answer text.
  // "gemini" = free tier, needs a free GEMINI_API_KEY.
  // "openai" = paid, needs OPENAI_API_KEY + billing.
  LLM_PROVIDER: z.enum(["gemini", "openai", "groq"]).default("gemini"),

  // OPENAI_API_KEY is only required if EMBEDDING_PROVIDER or LLM_PROVIDER is "openai" —
  // we validate that conditionally below instead of always requiring it, so the
  // free path works with zero OpenAI setup.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  LOCAL_EMBEDDING_MODEL: z.string().default("Xenova/all-MiniLM-L6-v2"),

  VECTOR_STORE_DIR: z.string().default("./vector-store"),

  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Conditional checks that plain Zod can't express cleanly: only require a
// provider's key if that provider is actually selected, so switching
// providers is just changing env vars — no code changes needed either way.
if (env.EMBEDDING_PROVIDER === "openai" && !env.OPENAI_API_KEY) {
  console.error("❌ EMBEDDING_PROVIDER=openai requires OPENAI_API_KEY to be set");
  process.exit(1);
}
if (env.LLM_PROVIDER === "openai" && !env.OPENAI_API_KEY) {
  console.error("❌ LLM_PROVIDER=openai requires OPENAI_API_KEY to be set");
  process.exit(1);
}
if (env.LLM_PROVIDER === "gemini" && !env.GEMINI_API_KEY) {
  console.error("❌ LLM_PROVIDER=gemini requires GEMINI_API_KEY to be set");
  process.exit(1);
}

if (env.LLM_PROVIDER === "groq" && !env.GROQ_API_KEY) {
  console.error("❌ LLM_PROVIDER=groq requires GROQ_API_KEY to be set");
  process.exit(1);
}