import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "@/config/env";
import { openai } from "@/modules/embeddings/openai.client";

let geminiClient: GoogleGenerativeAI | null = null;
function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? "");
  }
  return geminiClient;
}

// Groq exposes an OpenAI-compatible API, so we can reuse the same OpenAI
// SDK client, just pointed at Groq's base URL with a Groq key.
let groqClient: OpenAI | null = null;
function getGroqClient(): OpenAI {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: env.GROQ_API_KEY ?? "unused",
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return groqClient;
}

/**
 * Generates the final answer text from a system prompt + user prompt
 * (which already contains the retrieved context + question — see
 * query.service.ts). Which model actually answers is controlled by
 * LLM_PROVIDER in .env; callers don't need to know or care which one ran.
 */
export async function generateAnswer(systemPrompt: string, userPrompt: string): Promise<string> {
  if (env.LLM_PROVIDER === "gemini") {
    const model = getGeminiClient().getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  }

  if (env.LLM_PROVIDER === "groq") {
    const completion = await getGroqClient().chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });
    return completion.choices[0]?.message.content ?? "";
  }

  const completion = await openai.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });
  return completion.choices[0]?.message.content ?? "";
}