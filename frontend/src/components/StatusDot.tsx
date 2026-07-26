import type { SourceStatus } from "@/types";

const STATUS_CONFIG: Record<SourceStatus, { color: string; label: string; pulse: boolean }> = {
  UPLOADING: { color: "bg-slate", label: "Uploading", pulse: true },
  INDEXING: { color: "bg-amber", label: "Indexing", pulse: true },
  READY: { color: "bg-sage", label: "Ready to search", pulse: false },
  FAILED: { color: "bg-brick", label: "Failed", pulse: false },
};

export function StatusDot({ status }: { status: SourceStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={config.label}
      role="status"
      aria-label={config.label}
    >
      <span className={`relative flex h-2.5 w-2.5`}>
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-60`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`} />
      </span>
    </span>
  );
}
