import { gateway } from "@ai-sdk/gateway";
import { systemPrompt, weatherTool } from "@chatos/ai";
import { DEFAULT_CHAT_MODEL } from "@chatos/ai/models";
import { AgentStateStore, LocalStorageBackend, VercelBlobBackend } from "@chatos/state";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 60;

const AGENT_ID = "chatos-web";

function createStore(): AgentStateStore {
  const isVercel = !!process.env.VERCEL;
  const backend = isVercel
    ? new VercelBlobBackend(".agent/")
    : new LocalStorageBackend(process.env.AGENT_STATE_DIR ?? ".agent");
  return new AgentStateStore(backend);
}

const store = createStore();

export async function POST(request: Request) {
  const { messages, selectedModel, sessionId } = await request.json();

  const modelId = selectedModel || DEFAULT_CHAT_MODEL;

  // Persist user message if session tracking is active
  if (sessionId && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      await store.appendMessage(sessionId, {
        sessionId,
        role: "user",
        parts: Array.isArray(lastMessage.parts)
          ? lastMessage.parts
          : [{ type: "text" as const, text: lastMessage.content ?? "" }],
        platform: "web",
      });
    }
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: gateway(modelId),
    system: systemPrompt({ selectedChatModel: modelId }),
    messages: modelMessages,
    tools: {
      getWeather: weatherTool,
    },
    async onFinish({ text }) {
      if (sessionId && text) {
        await store.appendMessage(sessionId, {
          sessionId,
          role: "assistant",
          parts: [{ type: "text", text }],
          platform: "web",
        });

        await store.record({
          agentId: AGENT_ID,
          sessionId,
          type: "event",
          name: "chat.response",
          value: {
            platform: "web",
            model: modelId,
            responseLength: text.length,
          },
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
