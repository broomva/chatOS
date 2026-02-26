import type { AgentStateStore } from "@chatos/state";
import type { MessagePart, Source } from "@chatos/types";

// ─── Types ──────────────────────────────────────────

type ToolCallLike = { toolCallId: string; toolName: string; args?: unknown };
type ToolResultLike = {
  toolCallId: string;
  toolName: string;
  result?: unknown;
};
type StepLike = {
  toolCalls?: ToolCallLike[];
  toolResults?: ToolResultLike[];
  reasoning?: Array<{ type: "reasoning"; text: string }>;
  sources?: Array<{
    sourceType?: string;
    id?: string;
    url?: string;
    title?: string;
  }>;
};

export type StreamFinishData = {
  text: string;
  toolCalls?: ToolCallLike[];
  toolResults?: ToolResultLike[];
  reasoning?: Array<{ type: "reasoning"; text: string }>;
  sources?: Array<{
    sourceType?: string;
    id?: string;
    url?: string;
    title?: string;
  }>;
  /** All steps from multi-step execution — tool calls from intermediate steps are aggregated. */
  steps?: StepLike[];
  usage?: {
    inputTokens: number | undefined;
    outputTokens: number | undefined;
    totalTokens: number | undefined;
    reasoningTokens?: number | undefined;
  };
  finishReason?: string;
};

export type PersistContext = {
  store: AgentStateStore;
  sessionId: string;
  agentId: string;
  platform: string;
  model: string;
};

// ─── Helpers ────────────────────────────────────────

/**
 * Aggregate tool calls, results, reasoning, and sources from all steps.
 * Falls back to the top-level fields when no steps are provided.
 */
function aggregateSteps(data: StreamFinishData) {
  if (!data.steps?.length) {
    return {
      toolCalls: data.toolCalls ?? [],
      toolResults: data.toolResults ?? [],
      reasoning: data.reasoning ?? [],
      sources: data.sources ?? [],
    };
  }
  const toolCalls: ToolCallLike[] = [];
  const toolResults: ToolResultLike[] = [];
  const reasoning: Array<{ type: "reasoning"; text: string }> = [];
  const sources: Array<{
    sourceType?: string;
    id?: string;
    url?: string;
    title?: string;
  }> = [];
  for (const step of data.steps) {
    if (step.toolCalls) toolCalls.push(...step.toolCalls);
    if (step.toolResults) toolResults.push(...step.toolResults);
    if (step.reasoning) reasoning.push(...step.reasoning);
    if (step.sources) sources.push(...step.sources);
  }
  return { toolCalls, toolResults, reasoning, sources };
}

/**
 * Convert AI SDK `onFinish` data into rich `MessagePart[]`.
 */
export function buildAssistantParts(data: StreamFinishData): MessagePart[] {
  const parts: MessagePart[] = [];
  const { toolCalls, toolResults, reasoning, sources } = aggregateSteps(data);

  // Text content
  if (data.text) {
    parts.push({ type: "text", text: data.text });
  }

  // Tool invocations (merge calls + results by toolCallId)
  if (toolCalls.length) {
    for (const call of toolCalls) {
      const matchingResult = toolResults.find((r) => r.toolCallId === call.toolCallId);
      parts.push({
        type: "tool-invocation",
        toolInvocation: {
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          args: (call.args ?? {}) as Record<string, unknown>,
          state: matchingResult ? "result" : "call",
          result: matchingResult?.result,
        },
      });
    }
  }

  // Reasoning
  if (reasoning.length) {
    for (const r of reasoning) {
      parts.push({ type: "reasoning", reasoning: r.text });
    }
  }

  // Sources (only include sources that have a url)
  if (sources.length) {
    for (const s of sources) {
      if (s.url) {
        parts.push({
          type: "source",
          source: { url: s.url, title: s.title } as Source,
        });
      }
    }
  }

  return parts;
}

/**
 * Normalize SDK usage into our persisted format (coerce undefined → 0).
 */
function normalizeUsage(usage: StreamFinishData["usage"]) {
  if (!usage) return undefined;
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
    ...(usage.reasoningTokens != null && { reasoningTokens: usage.reasoningTokens }),
  };
}

/**
 * Persist a completed assistant stream result to the agent state store.
 * Converts SDK data to rich MessagePart[], appends the message, and records an observation.
 */
export async function persistStreamResult(
  ctx: PersistContext,
  data: StreamFinishData,
): Promise<void> {
  const { toolCalls } = aggregateSteps(data);
  const parts = buildAssistantParts(data);
  const usage = normalizeUsage(data.usage);

  // Append the assistant message with metadata
  await ctx.store.appendMessage(ctx.sessionId, {
    sessionId: ctx.sessionId,
    role: "assistant",
    parts,
    platform: ctx.platform,
    usage,
    finishReason: data.finishReason,
    model: ctx.model,
  });

  // Record observation
  await ctx.store.record({
    agentId: ctx.agentId,
    sessionId: ctx.sessionId,
    type: "event",
    name: "chat.response",
    value: {
      platform: ctx.platform,
      model: ctx.model,
      responseLength: data.text.length,
      toolCallCount: toolCalls.length,
      ...(usage && {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      }),
      ...(data.finishReason && { finishReason: data.finishReason }),
    },
  });
}
