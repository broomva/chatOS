---
name: chatos-ai
description: AI feature development skill. Use when adding models, tools, providers, or streaming features to chatOS.
---

# chatOS AI Development

## Adding a New Model

Edit `packages/ai/src/models.ts`:

```ts
{
  id: "provider/model-name",
  name: "Display Name",
  provider: "provider",
  description: "Brief description",
}
```

Models are accessed via Vercel AI Gateway (`@ai-sdk/gateway`).

## Adding a New Tool

1. Create tool definition in `packages/ai/src/tools/`:

```ts
import { z } from "zod";

export const myTool = {
  description: "What this tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }: { param: string }) => {
    // Implementation
    return { result: "value" };
  },
};
```

2. Export from `packages/ai/src/tools/index.ts`
3. Register in the chat API route in `apps/web`

## Streaming Pattern

```ts
import { streamText } from "ai";
import { gateway } from "@ai-sdk/gateway";

const result = streamText({
  model: gateway("anthropic/claude-sonnet-4.5"),
  messages,
  tools: { weather: weatherTool },
});
```

## Resumable Streams

Redis-backed via `resumable-stream` package. See `packages/ai/src/streaming.ts`.

## System Prompts

Edit `packages/ai/src/prompts.ts`. Reasoning models skip artifact prompts.
