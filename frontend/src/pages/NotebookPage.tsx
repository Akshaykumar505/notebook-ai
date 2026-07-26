import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import * as notebooksApi from "@/api/notebooks";
import * as sourcesApi from "@/api/sources";
import * as queryApi from "@/api/query";
import type { Source, ChatMessage, Citation } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { AddSourceModal } from "@/components/AddSourceModal";
import { ChatPanel } from "@/components/ChatPanel";
import { SourceViewerPanel } from "@/components/SourceViewerPanel";
import { ApiError } from "@/api/client";

const POLL_INTERVAL_MS = 3000;

export function NotebookPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();

  const [notebookTitle, setNotebookTitle] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSources = useCallback(async () => {
    if (!notebookId) return;
    const updated = await sourcesApi.listSources(notebookId);
    setSources(updated);
  }, [notebookId]);

  // Initial load
  useEffect(() => {
    if (!notebookId) return;
    notebooksApi
      .getNotebook(notebookId)
      .then((notebook) => {
        setNotebookTitle(notebook.title);
        setSources(notebook.sources);
      })
      .finally(() => setIsLoading(false));
  }, [notebookId]);

  // Poll while any source is still uploading/indexing, so status dots
  // update automatically without the user refreshing the page.
  useEffect(() => {
    const hasPendingSource = sources.some((s) => s.status === "UPLOADING" || s.status === "INDEXING");

    if (hasPendingSource && !pollRef.current) {
      pollRef.current = setInterval(refreshSources, POLL_INTERVAL_MS);
    } else if (!hasPendingSource && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [sources, refreshSources]);

  async function handleDeleteSource(sourceId: string) {
    if (!notebookId) return;
    if (!confirm("Remove this source? Its indexed content will no longer be searchable.")) return;
    await sourcesApi.deleteSource(notebookId, sourceId);
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  }

  async function handleReindexSource(sourceId: string) {
    if (!notebookId) return;
    await sourcesApi.reindexSource(notebookId, sourceId);
    refreshSources();
  }

  async function handleSend(question: string) {
    if (!notebookId) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsAsking(true);
    try {
      const result = await queryApi.askQuestion(notebookId, question);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: result.answer, citations: result.citations },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong answering that.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: message }]);
    } finally {
      setIsAsking(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate">Loading notebook...</div>;
  }

  const hasReadySources = sources.some((s) => s.status === "READY");

  return (
    <div className="flex h-screen flex-col bg-paper">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <button
          onClick={() => navigate("/notebooks")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate hover:bg-paper"
        >
          <ArrowLeft className="h-4 w-4" /> Notebooks
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          notebookTitle={notebookTitle}
          sources={sources}
          onAddSource={() => setShowAddModal(true)}
          onDeleteSource={handleDeleteSource}
          onReindexSource={handleReindexSource}
        />

        <ChatPanel
          messages={messages}
          isAsking={isAsking}
          hasReadySources={hasReadySources}
          onSend={handleSend}
          onCitationClick={setActiveCitation}
        />

        {activeCitation && (
          <SourceViewerPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
        )}
      </div>

      {showAddModal && notebookId && (
        <AddSourceModal
          notebookId={notebookId}
          onClose={() => setShowAddModal(false)}
          onSourceAdded={(source) => setSources((prev) => [source, ...prev])}
        />
      )}
    </div>
  );
}
