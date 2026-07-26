import { ExtractedSegment } from "./ingestion.types";

export interface Chunk {
  content: string;
  metadata: Record<string, unknown>;
}

const DEFAULT_CHUNK_SIZE = 1000; // characters
const DEFAULT_OVERLAP = 150; // characters

/**
 * Why chunk at all? LLM context windows and embedding models both work
 * best on small, focused pieces of text (a few hundred words), not entire
 * documents. Smaller chunks also mean retrieval returns more precise,
 * relevant results instead of one giant blob.
 *
 * Why overlap? Without overlap, a sentence that's meaningful only with the
 * sentence before/after it can get split awkwardly across two chunks and
 * lose context. A small overlap (150 chars) keeps continuity.
 *
 * How this works:
 * 1. Concatenate all segment texts into one big string, remembering which
 *    character range came from which original segment (and its metadata).
 * 2. Slide a window of `chunkSize` characters across that string, moving
 *    forward by (chunkSize - overlap) each time.
 * 3. For each window, figure out which original segments it overlaps, and
 *    merge their metadata into a single range (e.g. "pages 2-3").
 */
export function chunkSegments(
  segments: ExtractedSegment[],
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): Chunk[] {
  if (segments.length === 0) return [];

  let fullText = "";
  const offsets: { start: number; end: number; metadata: Record<string, unknown> }[] = [];

  for (const segment of segments) {
    const start = fullText.length;
    fullText += (fullText ? " " : "") + segment.text;
    const end = fullText.length;
    offsets.push({ start, end, metadata: segment.metadata });
  }

  const chunks: Chunk[] = [];
  let pos = 0;

  while (pos < fullText.length) {
    const end = Math.min(pos + chunkSize, fullText.length);
    const content = fullText.slice(pos, end).trim();

    if (content) {
      const overlapping = offsets.filter((o) => o.start < end && o.end > pos);
      const metadata = mergeMetadata(overlapping.map((o) => o.metadata));
      chunks.push({ content, metadata });
    }

    if (end === fullText.length) break;
    pos = end - overlap;
  }

  return chunks;
}

/**
 * Combines the metadata of multiple segments that ended up in the same chunk
 * into a single range. E.g. if a chunk spans PDF pages 2 and 3, the result
 * is { pageStart: 2, pageEnd: 3 } instead of two separate `page` values.
 */
function mergeMetadata(metadataList: Record<string, unknown>[]): Record<string, unknown> {
  if (metadataList.length === 0) return {};
  if (metadataList.length === 1) return metadataList[0]!;

  const first = metadataList[0]!;

  if ("page" in first) {
    const pages = metadataList.map((m) => m.page as number);
    return { pageStart: Math.min(...pages), pageEnd: Math.max(...pages) };
  }

  if ("startSeconds" in first) {
    const starts = metadataList.map((m) => m.startSeconds as number);
    const ends = metadataList.map((m) => m.endSeconds as number);
    return { startSeconds: Math.min(...starts), endSeconds: Math.max(...ends) };
  }

  if ("startTime" in first) {
    return { startTime: first.startTime, endTime: metadataList[metadataList.length - 1]!.endTime };
  }

  if ("charStart" in first) {
    const starts = metadataList.map((m) => m.charStart as number);
    const ends = metadataList.map((m) => m.charEnd as number);
    return { charStart: Math.min(...starts), charEnd: Math.max(...ends) };
  }

  // URL blocks / anything else without a clear numeric range — just keep the first.
  return first;
}
