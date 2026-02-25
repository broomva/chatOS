// ─── Agent Schema & Identity ─────────────────────────

export type OperatingMode = "explore" | "execute" | "verify" | "recover" | "ask-human" | "sleep";

export type AgentCapability = {
  name: string;
  description: string;
  /** Restrict capability to specific platforms (omit = available everywhere) */
  platforms?: string[];
};

export type AgentIdentity = {
  name: string;
  description: string;
  version: string;
};

export type AgentSchema = {
  identity: AgentIdentity;
  capabilities: AgentCapability[];
  defaultModel: string;
  /** Template string with {{capabilities}}, {{memory}}, {{platform}} placeholders */
  systemPromptTemplate?: string;
};
