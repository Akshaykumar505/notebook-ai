import fs from "fs";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");
import { ExtractedSegment } from "../ingestion.types";

/**
 * Extracts text from a PDF file, one segment per page.
 * We use pdf-parse's `pagerender` hook to capture text page-by-page
 * (by default pdf-parse just returns one giant blob for the whole PDF,
 * which would lose page-number info we need for citations).
 */
export async function extractPdf(filePath: string): Promise<ExtractedSegment[]> {
  const buffer = fs.readFileSync(filePath);
  const segments: ExtractedSegment[] = [];
  let currentPage = 0;

  await pdfParse(buffer, {
    pagerender: (pageData: any) => {
      currentPage += 1;
      const pageNumber = currentPage;
      return pageData
        .getTextContent()
        .then((textContent: any) => {
          const text = textContent.items.map((item: any) => item.str).join(" ");
          if (text.trim()) {
            segments.push({ text: text.trim(), metadata: { page: pageNumber } });
          }
          return text;
        });
    },
  });

  return segments;
}
