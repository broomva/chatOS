"use client";

import { Button } from "@chatos/ui";
import { BookOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PromptSummary = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  content: string;
};

export function PromptPicker({ onSelect }: { onSelect: (prompt: PromptSummary) => void }) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/prompts")
      .then((r) => r.json())
      .then((data) => setPrompts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = search
    ? prompts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : prompts;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        title="Browse prompts"
      >
        <BookOpen className="h-4 w-4" />
      </Button>

      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full left-0 mb-2 w-80 rounded-xl border bg-popover p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Prompts</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="mb-2 w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none ring-ring focus:ring-2"
          />

          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <p className="py-4 text-center text-xs text-muted-foreground">Loading...</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {prompts.length === 0 ? "No prompts yet. Save one from the chat!" : "No matches"}
              </p>
            )}
            {filtered.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => {
                  onSelect(prompt);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted"
              >
                <div className="text-sm font-medium">{prompt.title}</div>
                {prompt.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {prompt.description}
                  </div>
                )}
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <a
            href="/prompts"
            className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Manage prompts
          </a>
        </div>
      )}
    </div>
  );
}
