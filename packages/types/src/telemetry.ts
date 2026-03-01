// ─── Telemetry Types ────────────────────────────────

/**
 * Semantic convention attribute keys for GenAI / LLM observability.
 * Based on OpenTelemetry GenAI semantic conventions.
 */
export const GenAiAttributes = {
  // OTel GenAI semantic conventions
  SYSTEM: "gen_ai.system",
  REQUEST_MODEL: "gen_ai.request.model",
  RESPONSE_MODEL: "gen_ai.response.model",
  REQUEST_MAX_TOKENS: "gen_ai.request.max_tokens",
  REQUEST_TEMPERATURE: "gen_ai.request.temperature",
  USAGE_INPUT_TOKENS: "gen_ai.usage.input_tokens",
  USAGE_OUTPUT_TOKENS: "gen_ai.usage.output_tokens",

  // AI SDK attributes
  AI_MODEL_ID: "ai.model.id",
  AI_MODEL_PROVIDER: "ai.model.provider",
  AI_USAGE_PROMPT_TOKENS: "ai.usage.promptTokens",
  AI_USAGE_COMPLETION_TOKENS: "ai.usage.completionTokens",
  AI_RESPONSE_MS_TO_FIRST_CHUNK: "ai.response.msToFirstChunk",
  AI_RESPONSE_MS_TO_FINISH: "ai.response.msToFinish",
  AI_RESPONSE_AVG_TOKENS_PER_SECOND: "ai.response.avgCompletionTokensPerSecond",

  // chatOS custom attributes
  CHATOS_SESSION_ID: "chatos.session.id",
  CHATOS_AGENT_ID: "chatos.agent.id",
  CHATOS_PLATFORM: "chatos.platform",

  // LangSmith thread grouping
  LANGSMITH_SESSION_ID: "langsmith.trace.session_id",
} as const;

/** Available telemetry backend identifiers. */
export type TelemetryBackend = "console" | "langfuse" | "langsmith" | "otlp";

/** Resolved telemetry configuration from environment variables. */
export type TelemetryConfig = {
  /** Master switch — false if TELEMETRY_ENABLED is not "true". */
  enabled: boolean;
  /** Active backends derived from available credentials. */
  backends: TelemetryBackend[];
  /** Whether to log spans to console (TELEMETRY_CONSOLE=true). */
  console: boolean;
  /** Whether to record prompt inputs in spans. */
  recordInputs: boolean;
  /** Whether to record model outputs in spans. */
  recordOutputs: boolean;
  /** OTel service name override. */
  serviceName: string;

  // ── Backend-specific ───────────────────────────────
  langfuse?: {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
  };
  langsmith?: {
    apiKey: string;
    endpoint: string;
  };
  otlp?: {
    endpoint: string;
  };
};
