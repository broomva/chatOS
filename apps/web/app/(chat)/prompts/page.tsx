"use client";

import { Button } from "@chatos/ui";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Prompt = {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  visibility: "public" | "private";
  createdAt: string;
  updatedAt: string;
};

type EditState = {
  id?: string;
  title: string;
  content: string;
  description: string;
  tags: string;
};

const emptyEdit: EditState = { title: "", content: "", description: "", tags: "" };

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/prompts");
    setPrompts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!editing || !editing.title.trim() || !editing.content.trim()) return;
    setSaving(true);
    const body = {
      title: editing.title,
      content: editing.content,
      description: editing.description || undefined,
      tags: editing.tags
        ? editing.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    };

    if (editing.id) {
      await fetch(`/api/prompts/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(prompt: Prompt) {
    setEditing({
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      description: prompt.description ?? "",
      tags: prompt.tags?.join(", ") ?? "",
    });
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Prompts</h1>
        </div>
        <Button onClick={() => setEditing(emptyEdit)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="mb-6 rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">{editing.id ? "Edit Prompt" : "New Prompt"}</span>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Title"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <input
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              placeholder="Prompt content..."
              rows={6}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <input
              value={editing.tags}
              onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
              placeholder="Tags (comma-separated, optional)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !editing.title.trim() || !editing.content.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : prompts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No prompts yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one above, or ask the chat agent to save a prompt for you.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{prompt.title}</h3>
                  {prompt.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{prompt.description}</p>
                  )}
                </div>
                <div className="ml-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(prompt)}
                    className="rounded p-1.5 hover:bg-muted"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(prompt.id)}
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                {prompt.content}
              </pre>
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
