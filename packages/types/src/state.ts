import type { Attachment, MessagePart } from "./chat";

// ─── Session State ───────────────────────────────────

export type SessionState = {
  id: string;
  agentId: string;
  userId?: string;
  platform: string;
  /** Platform-specific thread identifier (e.g. Slack thread ts) */
  externalThreadId?: string;
  title?: string;
  mode: "active" | "archived";
  visibility: "public" | "private";
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

// ─── Agent Message ───────────────────────────────────

export type AgentMessageRole = "user" | "assistant" | "system" | "tool";

export type AgentMessage = {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  parts: MessagePart[];
  attachments?: Attachment[];
  /** Platform that originated this message */
  platform?: string;
  /** Token usage for this message (assistant messages only) */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    reasoningTokens?: number;
  };
  /** Why the model stopped generating */
  finishReason?: string;
  /** Model ID used to generate this message */
  model?: string;
  createdAt: string; // ISO 8601
};

// ─── Memory ──────────────────────────────────────────

export type MemoryType = "fact" | "preference" | "instruction" | "observation";

export type MemoryItem = {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  confidence: number; // 0.0–1.0
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

// ─── Observations ────────────────────────────────────

export type ObservationType = "metric" | "event" | "error" | "decision";

export type Observation = {
  id: string;
  agentId: string;
  sessionId?: string;
  type: ObservationType;
  name: string;
  value: Record<string, unknown>;
  timestamp: string; // ISO 8601
};
