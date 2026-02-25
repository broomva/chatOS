import { createClient, type RedisClientType } from "redis";
import type { AgentStateStore } from "../store";

/**
 * Lock object returned by acquireLock.
 * Mirrors the Chat SDK's Lock type.
 */
export type Lock = {
  id: string;
  threadId: string;
};

/**
 * Chat SDK StateAdapter interface (from `chat` package v4.14.0).
 *
 * We declare it here to avoid importing the `chat` package as a dependency
 * of `@chatos/state` — the bot app imports both and wires them together.
 */
export interface StateAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(threadId: string): Promise<void>;
  unsubscribe(threadId: string): Promise<void>;
  isSubscribed(threadId: string): Promise<boolean>;
  acquireLock(threadId: string, ttlMs: number): Promise<Lock | null>;
  releaseLock(lock: Lock): Promise<void>;
  extendLock(lock: Lock, ttlMs: number): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export type AgentStateAdapterOptions = {
  store: AgentStateStore;
  redisUrl?: string;
};

/**
 * Bridge between Chat SDK state management and the agent filesystem store.
 *
 * - **Ephemeral ops** (locks, subscriptions) → Redis (fast, volatile)
 * - **Durable ops** (get/set/delete) → AgentStateStore backend (canonical)
 */
export class AgentStateAdapter implements StateAdapter {
  private store: AgentStateStore;
  private redis: RedisClientType | null = null;
  private redisUrl: string | undefined;

  constructor(opts: AgentStateAdapterOptions) {
    this.store = opts.store;
    this.redisUrl = opts.redisUrl;
  }

  async connect(): Promise<void> {
    if (this.redisUrl) {
      try {
        this.redis = createClient({
          url: this.redisUrl,
          socket: { connectTimeout: 3000, reconnectStrategy: false },
        }) as RedisClientType;
        this.redis.on("error", () => {}); // Suppress unhandled error events
        await this.redis.connect();
      } catch {
        console.warn("[state] Redis unavailable, falling back to local-only mode");
        this.redis = null;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
    }
  }

  // ─── Subscriptions (Redis for speed) ─────────────

  async subscribe(threadId: string): Promise<void> {
    if (this.redis) {
      await this.redis.sAdd("chatos:subscriptions", threadId);
    }
  }

  async unsubscribe(threadId: string): Promise<void> {
    if (this.redis) {
      await this.redis.sRem("chatos:subscriptions", threadId);
    }
  }

  async isSubscribed(threadId: string): Promise<boolean> {
    if (this.redis) {
      return this.redis.sIsMember("chatos:subscriptions", threadId);
    }
    return false;
  }

  // ─── Distributed Locks (Redis SETNX) ─────────────

  async acquireLock(threadId: string, ttlMs: number): Promise<Lock | null> {
    const lockId = `lock:${threadId}:${Date.now()}`;
    const key = `chatos:lock:${threadId}`;

    if (this.redis) {
      const acquired = await this.redis.set(key, lockId, { NX: true, PX: ttlMs });
      if (acquired) {
        return { id: lockId, threadId };
      }
      return null;
    }
    // No Redis → always succeed (single-instance)
    return { id: lockId, threadId };
  }

  async releaseLock(lock: Lock): Promise<void> {
    if (this.redis) {
      const key = `chatos:lock:${lock.threadId}`;
      const current = await this.redis.get(key);
      if (current === lock.id) {
        await this.redis.del(key);
      }
    }
  }

  async extendLock(lock: Lock, ttlMs: number): Promise<void> {
    if (this.redis) {
      const key = `chatos:lock:${lock.threadId}`;
      const current = await this.redis.get(key);
      if (current === lock.id) {
        await this.redis.pExpire(key, ttlMs);
      }
    }
  }

  // ─── Durable Key-Value (Agent Store backend) ─────

  /**
   * Map a Chat SDK key to a filesystem path.
   * Keys like `thread-state:slack:C123:ts` → `threads/slack/C123/ts/state.json`
   */
  private keyToPath(key: string): string {
    const parts = key.split(":");
    return `threads/${parts.join("/")}.json`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const path = this.keyToPath(key);
    const raw = await this.store.backend.read(path);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const path = this.keyToPath(key);
    const payload = JSON.stringify(value, null, 2);
    await this.store.backend.write(path, payload);

    // If TTL is specified, also set in Redis for expiry tracking
    if (ttlMs && this.redis) {
      await this.redis.set(`chatos:cache:${key}`, "1", { PX: ttlMs });
    }
  }

  async delete(key: string): Promise<void> {
    const path = this.keyToPath(key);
    await this.store.backend.delete(path);

    if (this.redis) {
      await this.redis.del(`chatos:cache:${key}`);
    }
  }
}
