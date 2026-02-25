import { gateway } from "@ai-sdk/gateway";
import { DEFAULT_CHAT_MODEL, systemPrompt } from "@chatos/ai";
import { generateText, streamText } from "ai";

export type BotMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateBotResponse(messages: BotMessage[], modelId?: string) {
  const model = modelId || DEFAULT_CHAT_MODEL;

  const { text } = await generateText({
    model: gateway(model),
    system: systemPrompt({ selectedChatModel: model }),
    messages,
  });

  return text;
}

export function streamBotResponse(
  messages: BotMessage[],
  modelId?: string,
): ReturnType<typeof streamText> {
  const model = modelId || DEFAULT_CHAT_MODEL;

  return streamText({
    model: gateway(model),
    system: systemPrompt({ selectedChatModel: model }),
    messages,
  });
}
