/**
 * Every extractor (PDF, Text, URL, YouTube, VTT) breaks the source down into
 * "segments" — small pieces of text with metadata describing WHERE in the
 * original source that text came from. This metadata is what powers citations
 * later (e.g. "this came from page 3" or "this came from 1:20-1:45 in the video").
 */
export interface ExtractedSegment {
  text: string;
  metadata: Record<string, unknown>;
}
