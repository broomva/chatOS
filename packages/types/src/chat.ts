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
