"use client";

import { Button } from "@chatos/ui";
import { ArrowLeft, Box, Camera, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SandboxInstance = {
  id: string;
  sandboxId: string;
  agentId: string;
  sessionId: string;
  provider: string;
  status: string;
  vcpus: number;
  memoryMb: number;
  createdAt: string;
  lastExecAt: string | null;
  destroyedAt: string | null;
};

type Metrics = { active: number; snapshotted: number; total: number };

const STATUS_COLORS: Record<string, string> = {
  running: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  starting: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  snapshotted: "bg-blue-500/15 text-blue-500",
  stopped: "bg-zinc-500/15 text-zinc-500",
  failed: "bg-red-500/15 text-red-500",
};

const PROVIDER_COLORS: Record<string, string> = {
  vercel: "bg-zinc-900/10 text-zinc-700 dark:bg-zinc-100/10 dark:text-zinc-300",
  e2b: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  local: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  bubblewrap: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color ?? "bg-secondary text-secondary-foreground"}`}
    >
      {label}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function SandboxesPage() {
  const [sandboxes, setSandboxes] = useState<SandboxInstance[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ active: 0, snapshotted: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox");
      if (res.ok) {
        const data = await res.json();
        setSandboxes(data.sandboxes ?? []);
        setMetrics(data.metrics ?? { active: 0, snapshotted: 0, total: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  async function handleSnapshot(sandboxId: string) {
    setActing(sandboxId);
    try {
      await fetch(`/api/sandbox/${sandboxId}/snapshot`, { method: "POST" });
      await load();
    } finally {
      setActing(null);
    }
  }

  async function handleDestroy(sandboxId: string) {
    if (!confirm("Destroy this sandbox? This cannot be undone.")) return;
    setActing(sandboxId);
    try {
      await fetch(`/api/sandbox/${sandboxId}`, { method: "DELETE" });
      await load();
    } finally {
      setActing(null);
    }
  }

  const visible = sandboxes.filter((s) => s.status !== "stopped");

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Sandboxes</h1>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <MetricCard label="Active" value={metrics.active} />
        <MetricCard label="Snapshotted" value={metrics.snapshotted} />
        <MetricCard label="Total" value={metrics.total} />
      </div>

      {/* Table */}
      {loading && sandboxes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center">
          <Box className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No active sandboxes.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sandboxes are created automatically when agents run shell commands.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Agent</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Provider</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Last exec</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Resources</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {s.sandboxId.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 max-w-[160px] truncate" title={s.agentId}>
                    {s.agentId}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={s.provider} color={PROVIDER_COLORS[s.provider]} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={s.status} color={STATUS_COLORS[s.status]} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(s.lastExecAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.vcpus}vCPU / {s.memoryMb}MB
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {s.status === "running" && (
                        <button
                          type="button"
                          onClick={() => handleSnapshot(s.sandboxId)}
                          disabled={acting === s.sandboxId}
                          className="rounded p-1.5 hover:bg-muted disabled:opacity-50"
                          title="Snapshot"
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDestroy(s.sandboxId)}
                        disabled={acting === s.sandboxId}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        title="Destroy"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Polling every 15 s. Stopped sandboxes are hidden.
      </p>
    </div>
  );
}
