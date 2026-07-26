import * as cheerio from "cheerio";
import { AppError } from "@/middleware/errorHandler";
import { ExtractedSegment } from "../ingestion.types";

/**
 * Fetches a webpage and extracts its main readable text.
 * We strip out script/style/nav/footer/ads-ish elements since those
 * add noise that would pollute embeddings and answers.
 * Each paragraph-like block becomes its own segment (metadata has no
 * page/timestamp concept for websites — citation just links to the URL).
 */
export async function extractUrl(url: string): Promise<ExtractedSegment[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NotebookAI/1.0)" },
  });

  if (!response.ok) {
    throw new AppError(`Failed to fetch URL (status ${response.status})`, 422);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, noscript, iframe, svg").remove();

  const segments: ExtractedSegment[] = [];
  let blockIndex = 0;

  $("p, li, h1, h2, h3, h4").each((_i, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 20) {
      segments.push({ text, metadata: { blockIndex: blockIndex++, url } });
    }
  });

  if (segments.length === 0) {
    throw new AppError("Could not extract readable text from this URL", 422);
  }

  return segments;
}
