import { gateway } from "@ai-sdk/gateway";
import { createSlackAdapter, type SlackAdapter } from "@chat-adapter/slack";
import { DEFAULT_CHAT_MODEL, systemPrompt } from "@chatos/ai";
import { AgentStateAdapter, AgentStateStore, LocalStorageBackend } from "@chatos/state";
import type { AgentMessage, MessagePart } from "@chatos/types";
import { streamText } from "ai";
import { Chat } from "chat";

type BotAdapters = { slack: SlackAdapter };

const AGENT_ID = "chatos-bot";

// ─── State layer ─────────────────────────────────────

const stateDir = process.env.AGENT_STATE_DIR ?? ".agent";
const backend = new LocalStorageBackend(stateDir);
const store = new AgentStateStore(backend);
const stateAdapter = new AgentStateAdapter({
  store,
  redisUrl: process.env.REDIS_URL,
});

// ─── Shared message handler ──────────────────────────

async function handleMessage(
  thread: Parameters<Parameters<Chat<BotAdapters>["onNewMention"]>[0]>[0],
  message: Parameters<Parameters<Chat<BotAdapters>["onNewMention"]>[0]>[1],
) {
  // Find or create a session for this thread
  const session = await store.findOrCreateSession(thread.id, {
    agentId: AGENT_ID,
    userId: message.author?.userId,
    platform: "slack",
    mode: "active",
    visibility: "private",
  });

  // Persist the incoming user message
  await store.appendMessage(session.id, {
    sessionId: session.id,
    role: "user",
    parts: [{ type: "text", text: message.text }],
    platform: "slack",
  });

  // Load conversation history for context
  const history = await store.getMessages(session.id);
  const messages = history.map((m: AgentMessage) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.parts
      .filter((p: MessagePart): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n"),
  }));

  // Stream the AI response
  const result = streamText({
    model: gateway(DEFAULT_CHAT_MODEL),
    system: systemPrompt({ selectedChatModel: DEFAULT_CHAT_MODEL }),
    messages,
  });

  // Stream response to thread while collecting the full text
  let fullText = "";
  async function* collectAndStream() {
    for await (const chunk of result.textStream) {
      fullText += chunk;
      yield chunk;
    }
  }

  await thread.post(collectAndStream());

  // Persist the assistant response
  await store.appendMessage(session.id, {
    sessionId: session.id,
    role: "assistant",
    parts: [{ type: "text", text: fullText }],
    platform: "slack",
  });

  // Update session timestamp
  await store.updateSession(session.id, {
    title: session.title ?? message.text.slice(0, 50),
  });

  // Record observation
  await store.record({
    agentId: AGENT_ID,
    sessionId: session.id,
    type: "event",
    name: "chat.response",
    value: {
      platform: "slack",
      model: DEFAULT_CHAT_MODEL,
      messageCount: history.length + 2,
      responseLength: fullText.length,
    },
  });
}

// ─── Bot singleton ───────────────────────────────────

let _bot: Chat<BotAdapters> | null = null;

export function getBot(): Chat<BotAdapters> {
  if (!_bot) {
    _bot = new Chat<BotAdapters>({
      userName: "chatos",
      adapters: {
        slack: createSlackAdapter(),
      },
      state: stateAdapter as never,
    });

    _bot.onNewMention(async (thread, message) => {
      await thread.subscribe();
      await handleMessage(thread, message);
    });

    _bot.onSubscribedMessage(async (thread, message) => {
      await handleMessage(thread, message);
    });
  }

  return _bot;
}

export { store };
