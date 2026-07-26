import fs from "fs";
import { AppError } from "@/middleware/errorHandler";
import { ExtractedSegment } from "../ingestion.types";

// Matches a WebVTT timestamp line, e.g. "00:01:23.456 --> 00:01:27.000"
const TIMESTAMP_LINE = /(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/;

/**
 * Parses a .vtt (WebVTT) subtitle/transcript file into segments.
 * Each "cue" (a timestamp range + its text) becomes one segment.
 */
export function extractVtt(filePath: string): ExtractedSegment[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const blocks = raw.split(/\r?\n\r?\n/); // cues are separated by blank lines

  const segments: ExtractedSegment[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((l) => l.trim() !== "");
    const timestampLineIndex = lines.findIndex((l) => TIMESTAMP_LINE.test(l));
    if (timestampLineIndex === -1) continue;

    const match = lines[timestampLineIndex]!.match(TIMESTAMP_LINE)!;
    const startTime = match[1];
    const endTime = match[2];

    const text = lines
      .slice(timestampLineIndex + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "") // strip any inline VTT styling tags
      .trim();

    if (text) {
      segments.push({ text, metadata: { startTime, endTime } });
    }
  }

  if (segments.length === 0) {
    throw new AppError("Could not parse any cues from this VTT file", 422);
  }

  return segments;
}
