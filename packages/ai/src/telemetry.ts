/**
 * Shared telemetry module — OTel instrumentation for chatOS.
 *
 * Provides environment-driven, opt-in OpenTelemetry setup that integrates with:
 * - AI SDK v6 `experimental_telemetry`
 * - Langfuse (via @langfuse/otel OTLP exporter)
 * - LangSmith (via standard OTLP with API key header)
 * - Generic OTLP (Jaeger, Grafana Tempo, etc.)
 * - Console (for local development)
 *
 * Master switch: `TELEMETRY_ENABLED=true` — without it, everything no-ops.
 */

import type { Observation, TelemetryBackend, TelemetryConfig } from "@chatos/types";

// ─── Config Resolution ──────────────────────────────

/** Read environment variables and produce a resolved TelemetryConfig. */
export function resolveTelemetryConfig(): TelemetryConfig {
  const enabled = process.env.TELEMETRY_ENABLED === "true";
  const backends: TelemetryBackend[] = [];

  const langfusePublicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const langfuseSecretKey = process.env.LANGFUSE_SECRET_KEY;
  const langfuseBaseUrl = process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";

  const langsmithApiKey = process.env.LANGSMITH_API_KEY;
  const langsmithEndpoint = process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com";

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const consoleEnabled = process.env.TELEMETRY_CONSOLE === "true";

  if (consoleEnabled) backends.push("console");
  if (langfusePublicKey && langfuseSecretKey) backends.push("langfuse");
  if (langsmithApiKey) backends.push("langsmith");
  if (otlpEndpoint) backends.push("otlp");

  return {
    enabled,
    backends,
    console: consoleEnabled,
    recordInputs: process.env.TELEMETRY_RECORD_INPUTS !== "false",
    recordOutputs: process.env.TELEMETRY_RECORD_OUTPUTS !== "false",
    serviceName: process.env.OTEL_SERVICE_NAME || "chatos",
    ...(langfusePublicKey &&
      langfuseSecretKey && {
        langfuse: {
          publicKey: langfusePublicKey,
          secretKey: langfuseSecretKey,
          baseUrl: langfuseBaseUrl,
        },
      }),
    ...(langsmithApiKey && {
      langsmith: {
        apiKey: langsmithApiKey,
        endpoint: langsmithEndpoint,
      },
    }),
    ...(otlpEndpoint && {
      otlp: {
        endpoint: otlpEndpoint,
      },
    }),
  };
}

// ─── OTel SDK Bootstrap ─────────────────────────────

let _initialized = false;

/**
 * One-time OTel SDK bootstrap. Idempotent — safe to call multiple times.
 *
 * Uses SimpleSpanProcessor for Vercel serverless compatibility (synchronous flush).
 * Dynamic imports for backend-specific deps to avoid loading unused code.
 */
export async function initTelemetry(serviceName?: string): Promise<void> {
  if (_initialized) return;

  const config = resolveTelemetryConfig();
  if (!config.enabled || config.backends.length === 0) {
    _initialized = true;
    return;
  }

  // Dynamic imports — only load OTel SDK when telemetry is actually enabled
  const { NodeTracerProvider } = await import("@opentelemetry/sdk-trace-node");
  const { SimpleSpanProcessor, ConsoleSpanExporter } = await import(
    "@opentelemetry/sdk-trace-base"
  );
  const { resourceFromAttributes } = await import("@opentelemetry/resources");

  const resource = resourceFromAttributes({
    "service.name": serviceName || config.serviceName,
  });

  // Build span processors list based on configured backends
  const spanProcessors: InstanceType<typeof SimpleSpanProcessor>[] = [];

  // Console exporter
  if (config.console) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  // Langfuse — uses standard OTLP exporter pointed at Langfuse's OTel endpoint
  if (config.langfuse) {
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const langfuseExporter = new OTLPTraceExporter({
      url: `${config.langfuse.baseUrl}/api/public/otel/v1/traces`,
      headers: {
        Authorization: `Basic ${btoa(`${config.langfuse.publicKey}:${config.langfuse.secretKey}`)}`,
      },
    });
    spanProcessors.push(new SimpleSpanProcessor(langfuseExporter));
  }

  // LangSmith — standard OTLP with x-api-key header
  if (config.langsmith) {
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const langsmithExporter = new OTLPTraceExporter({
      url: `${config.langsmith.endpoint}/otel/v1/traces`,
      headers: {
        "x-api-key": config.langsmith.apiKey,
      },
    });
    spanProcessors.push(new SimpleSpanProcessor(langsmithExporter));
  }

  // Generic OTLP (Jaeger, Grafana Tempo, etc.)
  if (config.otlp) {
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const otlpExporter = new OTLPTraceExporter({
      url: `${config.otlp.endpoint}/v1/traces`,
    });
    spanProcessors.push(new SimpleSpanProcessor(otlpExporter));
  }

  const provider = new NodeTracerProvider({ resource, spanProcessors });
  provider.register();
  _initialized = true;
}

// ─── AI SDK Telemetry Settings ──────────────────────

type AITelemetryOptions = {
  /** Agent identifier (e.g. "chatos-web"). */
  agentId: string;
  /** Chat session ID — mapped to LangSmith thread grouping. */
  sessionId?: string;
  /** Model ID being used. */
  model?: string;
  /** Platform (web, slack, tui, cli). */
  platform?: string;
};

/**
 * Returns the `experimental_telemetry` object for AI SDK `streamText` / `generateText`.
 *
 * When telemetry is disabled, returns `{ isEnabled: false }`.
 * When enabled, configures function ID, metadata, and recording settings.
 */
export function getAITelemetrySettings(opts: AITelemetryOptions): {
  isEnabled: boolean;
  functionId?: string;
  metadata?: Record<string, string>;
  recordInputs?: boolean;
  recordOutputs?: boolean;
} {
  const config = resolveTelemetryConfig();
  if (!config.enabled) {
    return { isEnabled: false };
  }

  const metadata: Record<string, string> = {
    "chatos.agent.id": opts.agentId,
    "chatos.platform": opts.platform ?? "unknown",
  };

  if (opts.sessionId) {
    metadata["chatos.session.id"] = opts.sessionId;
    // LangSmith thread grouping — maps sessionId to LangSmith's session concept
    metadata["langsmith.trace.session_id"] = opts.sessionId;
  }

  if (opts.model) {
    metadata["chatos.model"] = opts.model;
  }

  return {
    isEnabled: true,
    functionId: `chat.${opts.platform ?? "unknown"}`,
    metadata,
    recordInputs: config.recordInputs,
    recordOutputs: config.recordOutputs,
  };
}

// ─── FS Observation → OTel Span Bridge ──────────────

/**
 * Emit an OTel span from an existing filesystem Observation.
 *
 * This bridges the FS-based observation layer to OTel without replacing it.
 * No-ops when telemetry is disabled or OTel is not initialized.
 */
export function bridgeObservationToSpan(obs: Observation): void {
  const config = resolveTelemetryConfig();
  if (!config.enabled || !_initialized) return;

  try {
    // Dynamic import to avoid loading OTel API when not needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const api = require("@opentelemetry/api") as typeof import("@opentelemetry/api");
    const tracer = api.trace.getTracer("chatos-observations");

    const span = tracer.startSpan(`observation.${obs.name}`, {
      attributes: {
        "observation.id": obs.id,
        "observation.type": obs.type,
        "observation.name": obs.name,
        "chatos.agent.id": obs.agentId,
        ...(obs.sessionId && { "chatos.session.id": obs.sessionId }),
        // Flatten observation value into span attributes
        ...flattenAttributes("observation.value", obs.value),
      },
      startTime: new Date(obs.timestamp),
    });

    span.end(new Date(obs.timestamp));
  } catch {
    // Silently ignore — telemetry should never break the app
  }
}

/** Flatten a nested object into dot-separated OTel attributes. */
function flattenAttributes(
  prefix: string,
  obj: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(obj)) {
    const attrKey = `${prefix}.${key}`;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[attrKey] = value;
    }
  }
  return result;
}
