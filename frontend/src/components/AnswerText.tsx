import { Fragment } from "react";
import type { Citation } from "@/types";
import { CitationBadge } from "./CitationBadge";

const CITATION_MARKER = /\[(\d+)\]/g;

interface AnswerTextProps {
  content: string;
  citations: Citation[];
  onCitationClick: (citation: Citation) => void;
}

export function AnswerText({ content, citations, onCitationClick }: AnswerTextProps) {
  const citationByIndex = new Map(citations.map((c) => [c.index, c]));

  const parts: (string | { index: number })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CITATION_MARKER.lastIndex = 0;
  while ((match = CITATION_MARKER.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ index: Number(match[1]) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
      {parts.map((part, i) => {
        if (typeof part === "string") return <Fragment key={i}>{part}</Fragment>;
        const citation = citationByIndex.get(part.index);
        if (!citation) return <Fragment key={i}>{`[${part.index}]`}</Fragment>;
        return <CitationBadge key={i} index={part.index} onClick={() => onCitationClick(citation)} />;
      })}
    </p>
  );
}
