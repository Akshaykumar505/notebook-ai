import { X, ExternalLink } from "lucide-react";
import type { Citation } from "@/types";
import { SourceIcon } from "./SourceIcon";
import { API_ROOT_URL } from "@/api/client";

interface SourceViewerPanelProps {
  citation: Citation;
  onClose: () => void;
}

export function SourceViewerPanel({ citation, onClose }: SourceViewerPanelProps) {
  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <SourceIcon type={citation.sourceType} className="h-4 w-4 shrink-0 text-slate" />
          <h3 className="truncate font-display text-base font-semibold text-ink">
            {citation.sourceTitle}
          </h3>
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate hover:bg-paper" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <SourceLocation citation={citation} />

        <div className="mt-4 rounded-md border border-line bg-paper p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">Cited excerpt</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {citation.content}
          </p>
        </div>
      </div>
    </aside>
  );
}

function SourceLocation({ citation }: { citation: Citation }) {
  const { sourceType, metadata, sourceOriginalRef } = citation;

  if (sourceType === "PDF") {
    const page = (metadata.page ?? metadata.pageStart) as number | undefined;
    const filename = sourceOriginalRef?.split(/[/\\]/).pop();
    const href = filename ? `${API_ROOT_URL}/files/${filename}${page ? `#page=${page}` : ""}` : undefined;
    return (
      <InfoRow label={page ? `Page ${page}` : "PDF"}>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:underline">
            Open PDF at this page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </InfoRow>
    );
  }

  if (sourceType === "YOUTUBE") {
    const start = metadata.startSeconds as number | undefined;
    const href = sourceOriginalRef ? buildYoutubeTimestampUrl(sourceOriginalRef, start) : undefined;
    return (
      <InfoRow label={start !== undefined ? `Starts at ${formatTime(start)}` : "YouTube video"}>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:underline">
            Watch from this moment <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </InfoRow>
    );
  }

  if (sourceType === "URL") {
    return (
      <InfoRow label="Website">
        {sourceOriginalRef && (
          <a href={sourceOriginalRef} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:underline">
            Open original page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </InfoRow>
    );
  }

  if (sourceType === "VTT") {
    const start = metadata.startTime as string | undefined;
    const end = metadata.endTime as string | undefined;
    return <InfoRow label={start ? `${start} → ${end}` : "Transcript"} />;
  }

  // TEXT
  return <InfoRow label="Pasted text" />;
}

function InfoRow({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-amber/10 px-3 py-2">
      <span className="font-mono text-xs text-amber-dark">{label}</span>
      {children}
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildYoutubeTimestampUrl(url: string, startSeconds?: number): string {
  if (startSeconds === undefined) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${startSeconds}s`;
}
