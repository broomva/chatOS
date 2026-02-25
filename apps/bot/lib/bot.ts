import { gateway } from "@ai-sdk/gateway";
import { createSlackAdapter, type SlackAdapter } from "@chat-adapter/slack";
import { createRedisState } from "@chat-adapter/state-redis";
import { DEFAULT_CHAT_MODEL, systemPrompt } from "@chatos/ai";
import { streamText } from "ai";
import { Chat } from "chat";

type BotAdapters = { slack: SlackAdapter };

let _bot: Chat<BotAdapters> | null = null;

export function getBot(): Chat<BotAdapters> {
  if (!_bot) {
    _bot = new Chat<BotAdapters>({
      userName: "chatos",
      adapters: {
        slack: createSlackAdapter(),
      },
      state: createRedisState(),
    });

    _bot.onNewMention(async (thread, message) => {
      await thread.subscribe();

      const result = streamText({
        model: gateway(DEFAULT_CHAT_MODEL),
        system: systemPrompt({ selectedChatModel: DEFAULT_CHAT_MODEL }),
        prompt: message.text,
      });

      await thread.post(result.textStream);
    });

    _bot.onSubscribedMessage(async (thread, message) => {
      const result = streamText({
        model: gateway(DEFAULT_CHAT_MODEL),
        system: systemPrompt({ selectedChatModel: DEFAULT_CHAT_MODEL }),
        prompt: message.text,
      });

      await thread.post(result.textStream);
    });
  }

  return _bot;
}
