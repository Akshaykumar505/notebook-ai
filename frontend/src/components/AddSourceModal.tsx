import { useState, useRef } from "react";
import { X, FileText, Clapperboard, Type, Captions, Link2, Loader2 } from "lucide-react";
import * as sourcesApi from "@/api/sources";
import type { Source } from "@/types";

type Tab = "PDF" | "YOUTUBE" | "TEXT" | "VTT" | "URL";

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "PDF", label: "PDF", icon: FileText },
  { id: "YOUTUBE", label: "YT Link", icon: Clapperboard },
  { id: "TEXT", label: "Text", icon: Type },
  { id: "VTT", label: "VTT", icon: Captions },
  { id: "URL", label: "Web Link", icon: Link2 },
];

interface AddSourceModalProps {
  notebookId: string;
  onClose: () => void;
  onSourceAdded: (source: Source) => void;
}

export function AddSourceModal({ notebookId, onClose, onSourceAdded }: AddSourceModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("PDF");
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      let source: Source;
      switch (activeTab) {
        case "TEXT":
          if (!textContent.trim()) throw new Error("Paste some text first");
          source = await sourcesApi.addTextSource(notebookId, title || "Pasted text", textContent);
          break;
        case "URL":
          if (!url.trim()) throw new Error("Enter a URL first");
          source = await sourcesApi.addUrlSource(notebookId, title || url, url);
          break;
        case "YOUTUBE":
          if (!url.trim()) throw new Error("Enter a YouTube URL first");
          source = await sourcesApi.addYoutubeSource(notebookId, title || url, url);
          break;
        case "PDF":
        case "VTT":
          if (!file) throw new Error(`Choose a ${activeTab} file first`);
          source = await sourcesApi.uploadFileSource(
            notebookId,
            activeTab === "PDF" ? "pdf" : "vtt",
            file,
            title || undefined
          );
          break;
      }
      onSourceAdded(source);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Add source</h3>
          <button onClick={onClose} className="rounded p-1 text-slate hover:bg-paper" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-5 sm:grid-cols-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError(null);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "border-steel bg-steel/10 text-steel"
                  : "border-line text-slate hover:border-steel/40"
              }`}
            >
              <tab.icon className="h-5 w-5" strokeWidth={1.75} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 px-5 pb-5">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-slate/70 focus:border-steel"
          />

          {activeTab === "TEXT" && (
            <textarea
              placeholder="Paste your text here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-slate/70 focus:border-steel"
            />
          )}

          {(activeTab === "URL" || activeTab === "YOUTUBE") && (
            <input
              type="url"
              placeholder={activeTab === "YOUTUBE" ? "https://youtube.com/watch?v=..." : "https://example.com/article"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-slate/70 focus:border-steel"
            />
          )}

          {(activeTab === "PDF" || activeTab === "VTT") && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-md border border-dashed border-line px-3 py-6 text-center text-sm text-slate hover:border-steel/50"
            >
              {file ? file.name : `Click to choose a ${activeTab} file`}
              <input
                ref={fileInputRef}
                type="file"
                accept={activeTab === "PDF" ? ".pdf" : ".vtt"}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {error && <p className="text-sm text-brick">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-steel px-4 py-2.5 text-sm font-medium text-white transition hover:bg-steel-dark disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add source"}
          </button>
        </div>
      </div>
    </div>
  );
}
