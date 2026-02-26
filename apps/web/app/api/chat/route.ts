import { gateway } from "@ai-sdk/gateway";
import { persistStreamResult, type StreamFinishData, systemPrompt, weatherTool } from "@chatos/ai";
import { DEFAULT_CHAT_MODEL } from "@chatos/ai/models";
import {
  AgentStateStore,
  LocalStorageBackend,
  resolveStateDir,
  VercelBlobBackend,
} from "@chatos/state";
import { convertToModelMessages, stepCountIs, streamText } from "ai";

export const maxDuration = 60;

const AGENT_ID = "chatos-web";

function createStore(): AgentStateStore {
  const isVercel = !!process.env.VERCEL;
  const backend = isVercel
    ? new VercelBlobBackend(".agent/")
    : new LocalStorageBackend(resolveStateDir());
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
    stopWhen: stepCountIs(5),
    async onFinish({ text, steps, totalUsage, finishReason }) {
      if (sessionId) {
        await persistStreamResult(
          { store, sessionId, agentId: AGENT_ID, platform: "web", model: modelId },
          {
            text,
            steps: steps as StreamFinishData["steps"],
            usage: totalUsage,
            finishReason,
          },
        );
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
