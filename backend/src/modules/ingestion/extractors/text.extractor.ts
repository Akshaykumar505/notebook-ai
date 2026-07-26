import { ExtractedSegment } from "../ingestion.types";

/**
 * Splits raw pasted text into paragraph-level segments, tracking each
 * paragraph's character offset in the original text (used for citation
 * highlighting later — "highlight characters 500-800").
 */
export function extractText(rawText: string): ExtractedSegment[] {
  const segments: ExtractedSegment[] = [];
  const paragraphs = rawText.split(/\n\s*\n/); // split on blank lines

  let cursor = 0;
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const startIndex = rawText.indexOf(paragraph, cursor);
    if (trimmed) {
      segments.push({
        text: trimmed,
        metadata: { charStart: startIndex, charEnd: startIndex + paragraph.length },
      });
    }
    cursor = startIndex + paragraph.length;
  }

  return segments;
}
