import { gateway } from "@ai-sdk/gateway";
import { systemPrompt, weatherTool } from "@chatos/ai";
import { DEFAULT_CHAT_MODEL } from "@chatos/ai/models";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages, selectedModel } = await request.json();

  const modelId = selectedModel || DEFAULT_CHAT_MODEL;

  const result = streamText({
    model: gateway(modelId),
    system: systemPrompt({ selectedChatModel: modelId }),
    messages,
    tools: {
      getWeather: weatherTool,
    },
  });

  return result.toUIMessageStreamResponse();
}
