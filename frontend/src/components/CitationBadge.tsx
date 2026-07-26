interface CitationBadgeProps {
  index: number;
  onClick: () => void;
}

/**
 * The signature visual element of the app: a small amber "sticky tab"
 * badge, evoking a highlighter mark or bookmark tab in a real notebook.
 * Clicking it opens the source viewer panel for that citation.
 */
export function CitationBadge({ index, onClick }: CitationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="mx-0.5 inline-flex h-4.5 min-w-4.5 -translate-y-0.5 items-center justify-center rounded-sm bg-amber/25 px-1 font-mono text-[11px] font-medium text-amber-dark transition hover:-translate-y-1 hover:bg-amber/40"
      title={`View source ${index}`}
    >
      {index}
    </button>
  );
}
