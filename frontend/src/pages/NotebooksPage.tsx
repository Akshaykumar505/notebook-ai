import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Plus, Trash2, LogOut, X, Loader2 } from "lucide-react";
import * as notebooksApi from "@/api/notebooks";
import type { Notebook } from "@/types";
import { useAuth } from "@/auth/AuthContext";

export function NotebooksPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    notebooksApi
      .listNotebooks()
      .then(setNotebooks)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this notebook and all its sources? This can't be undone.")) return;
    await notebooksApi.deleteNotebook(id);
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-steel text-white">
            <BookOpen className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className="font-display text-lg font-semibold text-ink">Notebook AI</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate">
          <span>{user?.name}</span>
          <button onClick={logout} className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-paper" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-ink">Your notebooks</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-md bg-steel px-4 py-2 text-sm font-medium text-white hover:bg-steel-dark"
          >
            <Plus className="h-4 w-4" /> New notebook
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate">Loading...</p>
        ) : notebooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="text-sm text-slate">
              No notebooks yet. Create one to start collecting sources and asking questions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((notebook) => (
              <Link
                key={notebook.id}
                to={`/notebooks/${notebook.id}`}
                className="group relative rounded-xl border border-line bg-surface p-5 transition hover:border-steel/40 hover:shadow-sm"
              >
                <h3 className="pr-6 font-display text-base font-semibold text-ink">{notebook.title}</h3>
                {notebook.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate">{notebook.description}</p>
                )}
                <p className="mt-3 font-mono text-xs text-slate">
                  {notebook._count?.sources ?? 0} source{notebook._count?.sources === 1 ? "" : "s"}
                </p>
                <button
                  onClick={(e) => handleDelete(notebook.id, e)}
                  className="absolute right-4 top-5 rounded p-1 text-slate opacity-0 hover:bg-paper hover:text-brick group-hover:opacity-100"
                  aria-label="Delete notebook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateNotebookModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(notebook) => {
            setNotebooks((prev) => [notebook, ...prev]);
            navigate(`/notebooks/${notebook.id}`);
          }}
        />
      )}
    </div>
  );
}

function CreateNotebookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (notebook: Notebook) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const notebook = await notebooksApi.createNotebook(title, description || undefined);
      onCreated(notebook);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">New notebook</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            autoFocus
            placeholder="Notebook title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink focus:border-steel"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-ink focus:border-steel"
          />
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-steel px-4 py-2.5 text-sm font-medium text-white hover:bg-steel-dark disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create notebook
          </button>
        </div>
      </form>
    </div>
  );
}
