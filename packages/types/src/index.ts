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
export type Chat = {
  id: string;
  title: string;
  userId: string;
  visibility: "public" | "private";
  createdAt: Date;
};

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mimeType?: string }
  | { type: "tool-invocation"; toolInvocation: ToolInvocation }
  | { type: "source"; source: Source }
  | { type: "reasoning"; reasoning: string; details?: ReasoningDetail[] };

export type ReasoningDetail = { type: "text"; text: string } | { type: "redacted"; data: string };

export type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
};

export type Source = {
  url: string;
  title?: string;
  description?: string;
};

export type Message = {
  id: string;
  chatId: string;
  role: MessageRole;
  parts: MessagePart[];
  attachments: Attachment[];
  createdAt: Date;
};

export type Attachment = {
  name: string;
  contentType: string;
  url: string;
};

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
