import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Send, Loader2, MessageCircleQuestion } from "lucide-react";
import type { ChatMessage, Citation } from "@/types";
import { AnswerText } from "./AnswerText";

interface ChatPanelProps {
  messages: ChatMessage[];
  isAsking: boolean;
  hasReadySources: boolean;
  onSend: (question: string) => void;
  onCitationClick: (citation: Citation) => void;
}

export function ChatPanel({ messages, isAsking, hasReadySources, onSend, onCitationClick }: ChatPanelProps) {
  const [question, setQuestion] = useState("");

  function handleSend() {
    const trimmed = question.trim();
    if (!trimmed || isAsking) return;
    onSend(trimmed);
    setQuestion("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate">
            <MessageCircleQuestion className="mb-3 h-10 w-10 text-steel/40" strokeWidth={1.5} />
            <p className="max-w-sm text-sm">
              {hasReadySources
                ? "Ask a question about the sources in this notebook. Every answer comes with citations you can inspect."
                : "Add and index at least one source, then ask a question grounded in it."}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {message.role === "user" ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-steel px-4 py-2.5 text-sm text-white">
                    {message.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3">
                    <AnswerText
                      content={message.content}
                      citations={message.citations ?? []}
                      onCitationClick={onCitationClick}
                    />
                  </div>
                )}
              </div>
            ))}
            {isAsking && (
              <div className="flex items-center gap-2 text-sm text-slate">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking through your sources...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-xl border border-line bg-surface p-2 focus-within:border-steel">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a query here....."
            rows={1}
            disabled={!hasReadySources}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-slate/70 focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!hasReadySources || isAsking || !question.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-steel text-white transition hover:bg-steel-dark disabled:opacity-40"
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
