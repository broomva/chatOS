// ─── Agent ─────────────────────────────────────────
export * from "./agent";
export * from "./state";

// ─── User & Auth ────────────────────────────────────
export type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

export type Session = {
  user: User;
  expires: string;
};

// ─── Chat ───────────────────────────────────────────
export * from "./chat";

// ─── Documents & Artifacts ──────────────────────────
export type ArtifactKind = "text" | "code" | "image" | "sheet";

export type Document = {
  id: string;
  title: string;
  content: string | null;
  kind: ArtifactKind;
  userId: string;
  createdAt: Date;
};

export type Vote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

// ─── AI Models ──────────────────────────────────────
export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export type ModelProvider = "anthropic" | "openai" | "google" | "xai" | "reasoning";

// ─── Stream ─────────────────────────────────────────
export type StreamState = {
  id: string;
  chatId: string;
  createdAt: Date;
};

// ─── Bot (Chat SDK) ─────────────────────────────────
export type BotPlatform = "slack" | "teams" | "discord";

export type BotEvent = {
  platform: BotPlatform;
  type: "message" | "mention" | "reaction" | "thread_reply";
  channelId: string;
  userId: string;
  text: string;
  threadId?: string;
  timestamp: string;
};
