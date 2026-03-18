import { gateway } from "@ai-sdk/gateway";
import { persistStreamResult, type StreamFinishData, systemPrompt, weatherTool } from "@chatos/ai";
import { DEFAULT_CHAT_MODEL } from "@chatos/ai/models";
import { getAITelemetrySettings } from "@chatos/ai/telemetry";
import {
  AgentStateStore,
  LocalStorageBackend,
  resolveStateDir,
  VercelBlobBackend,
} from "@chatos/state";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

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
      listPrompts: tool({
        description:
          "List the user's saved prompt templates. Use when the user asks to see their prompts or wants to use a saved prompt.",
        inputSchema: z.object({
          tag: z.string().optional().describe("Filter prompts by tag"),
          search: z.string().optional().describe("Search term to filter by title or description"),
        }),
        execute: async ({ tag, search }) => {
          const prompts = await store.listPrompts({ tag: tag ?? undefined });
          const filtered = search
            ? prompts.filter(
                (p) =>
                  p.title.toLowerCase().includes(search.toLowerCase()) ||
                  p.description?.toLowerCase().includes(search.toLowerCase()),
              )
            : prompts;
          return filtered.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            tags: p.tags,
          }));
        },
      }),
      getPrompt: tool({
        description:
          "Get the full content of a saved prompt template by ID. Use after listing prompts to retrieve the actual prompt text.",
        inputSchema: z.object({
          id: z.string().describe("The prompt template ID"),
        }),
        execute: async ({ id }) => {
          const prompt = await store.getPrompt(id);
          if (!prompt) return { error: "Prompt not found" };
          return prompt;
        },
      }),
      savePrompt: tool({
        description:
          "Save a new prompt template or update an existing one. Use when the user wants to save a prompt for reuse.",
        inputSchema: z.object({
          id: z.string().optional().describe("If updating an existing prompt, pass its ID"),
          title: z.string().describe("Short descriptive title for the prompt"),
          content: z.string().describe("The full prompt text"),
          description: z.string().optional().describe("Brief description of what this prompt does"),
          tags: z.array(z.string()).optional().describe("Tags for categorizing the prompt"),
        }),
        execute: async ({ id, title, content, description, tags }) => {
          if (id) {
            const updated = await store.updatePrompt(id, { title, content, description, tags });
            if (!updated) return { error: "Prompt not found" };
            return { id: updated.id, title: updated.title, saved: true };
          }
          const created = await store.createPrompt({
            title,
            content,
            description,
            tags,
            visibility: "private",
          });
          return { id: created.id, title: created.title, saved: true };
        },
      }),
      deletePrompt: tool({
        description: "Delete a saved prompt template by ID.",
        inputSchema: z.object({
          id: z.string().describe("The prompt template ID to delete"),
        }),
        execute: async ({ id }) => {
          const deleted = await store.deletePrompt(id);
          return { deleted };
        },
      }),
    },
    experimental_telemetry: getAITelemetrySettings({
      agentId: AGENT_ID,
      sessionId,
      model: modelId,
      platform: "web",
    }),
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
