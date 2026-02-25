import type {
  AgentMessage,
  AgentSchema,
  MemoryItem,
  Observation,
  SessionState,
} from "@chatos/types";
import { nanoid } from "nanoid";
import type { StorageBackend } from "./backend";
import { AgentPaths } from "./paths";

export class AgentStateStore {
  readonly backend: StorageBackend;

  constructor(backend: StorageBackend) {
    this.backend = backend;
  }

  // ─── Schema ──────────────────────────────────────

  async getSchema(): Promise<AgentSchema | null> {
    const raw = await this.backend.read(AgentPaths.schema);
    return raw ? (JSON.parse(raw) as AgentSchema) : null;
  }

  async setSchema(schema: AgentSchema): Promise<void> {
    await this.backend.write(AgentPaths.schema, JSON.stringify(schema, null, 2));
  }

  // ─── Sessions ────────────────────────────────────

  async createSession(
    params: Omit<SessionState, "id" | "createdAt" | "updatedAt">,
  ): Promise<SessionState> {
    const now = new Date().toISOString();
    const session: SessionState = {
      id: nanoid(),
      ...params,
      createdAt: now,
      updatedAt: now,
    };
    await this.backend.write(AgentPaths.sessionMeta(session.id), JSON.stringify(session, null, 2));
    return session;
  }

  async getSession(sessionId: string): Promise<SessionState | null> {
    const raw = await this.backend.read(AgentPaths.sessionMeta(sessionId));
    return raw ? (JSON.parse(raw) as SessionState) : null;
  }

  async updateSession(
    sessionId: string,
    update: Partial<SessionState>,
  ): Promise<SessionState | null> {
    const existing = await this.getSession(sessionId);
    if (!existing) return null;
    const updated: SessionState = {
      ...existing,
      ...update,
      id: existing.id, // immutable
      createdAt: existing.createdAt, // immutable
      updatedAt: new Date().toISOString(),
    };
    await this.backend.write(AgentPaths.sessionMeta(sessionId), JSON.stringify(updated, null, 2));
    return updated;
  }

  async listSessions(limit?: number): Promise<SessionState[]> {
    const keys = await this.backend.list({
      prefix: AgentPaths.sessionsPrefix,
      limit: limit ?? 100,
    });
    const metaKeys = keys.filter((k) => k.endsWith("/meta.json"));
    const sessions: SessionState[] = [];
    for (const key of metaKeys) {
      const raw = await this.backend.read(key);
      if (raw) sessions.push(JSON.parse(raw) as SessionState);
    }
    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /**
   * Find a session by platform + externalThreadId, or create one if missing.
   */
  async findOrCreateSession(
    externalThreadId: string,
    params: Omit<SessionState, "id" | "createdAt" | "updatedAt" | "externalThreadId">,
  ): Promise<SessionState> {
    const sessions = await this.listSessions();
    const existing = sessions.find(
      (s) => s.externalThreadId === externalThreadId && s.platform === params.platform,
    );
    if (existing) return existing;
    return this.createSession({ ...params, externalThreadId });
  }

  // ─── Messages ────────────────────────────────────

  async appendMessage(
    sessionId: string,
    params: Omit<AgentMessage, "id" | "createdAt">,
  ): Promise<AgentMessage> {
    const msg: AgentMessage = {
      id: nanoid(),
      ...params,
      createdAt: new Date().toISOString(),
    };
    await this.backend.write(AgentPaths.message(sessionId, msg.id), JSON.stringify(msg, null, 2));
    return msg;
  }

  async getMessages(sessionId: string): Promise<AgentMessage[]> {
    const keys = await this.backend.list({ prefix: AgentPaths.messagesPrefix(sessionId) });
    const messages: AgentMessage[] = [];
    for (const key of keys) {
      const raw = await this.backend.read(key);
      if (raw) messages.push(JSON.parse(raw) as AgentMessage);
    }
    return messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // ─── Memory ──────────────────────────────────────

  async addMemory(params: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">): Promise<MemoryItem> {
    const now = new Date().toISOString();
    const item: MemoryItem = {
      id: nanoid(),
      ...params,
      createdAt: now,
      updatedAt: now,
    };
    await this.backend.write(AgentPaths.memory(item.id), JSON.stringify(item, null, 2));
    return item;
  }

  async getMemory(agentId?: string): Promise<MemoryItem[]> {
    const keys = await this.backend.list({ prefix: AgentPaths.memoryPrefix });
    const items: MemoryItem[] = [];
    for (const key of keys) {
      const raw = await this.backend.read(key);
      if (raw) {
        const item = JSON.parse(raw) as MemoryItem;
        if (!agentId || item.agentId === agentId) items.push(item);
      }
    }
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  // ─── Observations ────────────────────────────────

  async record(params: Omit<Observation, "id" | "timestamp">): Promise<Observation> {
    const obs: Observation = {
      id: nanoid(),
      ...params,
      timestamp: new Date().toISOString(),
    };
    await this.backend.write(AgentPaths.observation(obs.id), JSON.stringify(obs, null, 2));
    return obs;
  }

  async getObservations(opts?: { sessionId?: string; type?: string }): Promise<Observation[]> {
    const keys = await this.backend.list({ prefix: AgentPaths.observationsPrefix });
    const observations: Observation[] = [];
    for (const key of keys) {
      const raw = await this.backend.read(key);
      if (raw) {
        const obs = JSON.parse(raw) as Observation;
        if (opts?.sessionId && obs.sessionId !== opts.sessionId) continue;
        if (opts?.type && obs.type !== opts.type) continue;
        observations.push(obs);
      }
    }
    return observations.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
