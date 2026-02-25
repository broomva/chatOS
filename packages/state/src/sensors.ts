import type { AgentStateStore } from "./store";

export type AgentMetrics = {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  errorCount: number;
  platformBreakdown: Record<string, number>;
};

/** Collect runtime metrics from the agent state store. */
export async function collectMetrics(store: AgentStateStore): Promise<AgentMetrics> {
  const sessions = await store.listSessions();
  const observations = await store.getObservations({ type: "error" });

  let totalMessages = 0;
  const platformBreakdown: Record<string, number> = {};

  for (const session of sessions) {
    const messages = await store.getMessages(session.id);
    totalMessages += messages.length;
    platformBreakdown[session.platform] = (platformBreakdown[session.platform] ?? 0) + 1;
  }

  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter((s) => s.mode === "active").length,
    totalMessages,
    errorCount: observations.length,
    platformBreakdown,
  };
}
