import { useState } from "react";
import { Plus, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import type { Source } from "@/types";
import { StatusDot } from "./StatusDot";
import { SourceIcon } from "./SourceIcon";

interface SidebarProps {
  notebookTitle: string;
  sources: Source[];
  onAddSource: () => void;
  onDeleteSource: (sourceId: string) => void;
  onReindexSource: (sourceId: string) => void;
}

export function Sidebar({
  notebookTitle,
  sources,
  onAddSource,
  onDeleteSource,
  onReindexSource,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-4 py-4">
        <h2 className="truncate font-display text-lg font-semibold text-ink">{notebookTitle}</h2>
      </div>

      <div className="p-3">
        <button
          onClick={onAddSource}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-steel/50 bg-steel/5 px-3 py-2.5 text-sm font-medium text-steel transition hover:bg-steel/10"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add source
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sources.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate">
            No sources yet. Add a source to start building this notebook's knowledge.
          </p>
        ) : (
          <ul className="space-y-1">
            {sources.map((source) => (
              <li key={source.id} className="group relative">
                <div className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-paper">
                  <SourceIcon type={source.type} className="h-4 w-4 shrink-0 text-slate" />
                  <span className="flex-1 truncate text-ink" title={source.title}>
                    {source.title}
                  </span>
                  <StatusDot status={source.status} />
                  <button
                    onClick={() => setOpenMenuId(openMenuId === source.id ? null : source.id)}
                    className="rounded p-0.5 text-slate opacity-0 hover:bg-line group-hover:opacity-100"
                    aria-label="Source options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {openMenuId === source.id && (
                  <div className="absolute right-2 top-9 z-10 w-40 rounded-md border border-line bg-surface py-1 shadow-lg">
                    <button
                      onClick={() => {
                        onReindexSource(source.id);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-paper"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Re-index
                    </button>
                    <button
                      onClick={() => {
                        onDeleteSource(source.id);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-brick hover:bg-paper"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}

                {source.status === "FAILED" && source.errorMessage && (
                  <p className="mx-2 mb-1 rounded bg-brick/10 px-2 py-1 text-xs text-brick">
                    {source.errorMessage}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
