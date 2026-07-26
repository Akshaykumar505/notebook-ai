import { YoutubeTranscript } from "youtube-transcript";
import { AppError } from "@/middleware/errorHandler";
import { ExtractedSegment } from "../ingestion.types";

/**
 * Fetches the auto-generated (or manually uploaded) transcript of a YouTube
 * video. Each transcript entry already comes with a start time + duration,
 * which we keep as metadata — this is what lets us later open the citation
 * at the exact timestamp in the video.
 */
export async function extractYoutube(videoUrl: string): Promise<ExtractedSegment[]> {
  let transcriptItems;
  try {
    transcriptItems = await YoutubeTranscript.fetchTranscript(videoUrl);
  } catch {
    throw new AppError(
      "Could not fetch transcript for this video (captions may be disabled)",
      422
    );
  }

  if (!transcriptItems || transcriptItems.length === 0) {
    throw new AppError("No transcript available for this video", 422);
  }

  return transcriptItems.map((item) => ({
    text: item.text,
    metadata: {
      startSeconds: Math.floor(item.offset / 1000),
      endSeconds: Math.floor((item.offset + item.duration) / 1000),
    },
  }));
}
