# Observability

## Structured Log Fields

All API routes and streaming handlers must include:

| Field | Type | Description |
|---|---|---|
| `run_id` | string | Unique per turbo/CI run |
| `trace_id` | string | Unique per request chain |
| `chat_id` | string | Chat session identifier |
| `user_id` | string | Authenticated user |
| `model_id` | string | AI model used |
| `timestamp` | ISO 8601 | Event time |

## Observable Events

| Event | Source | Purpose |
|---|---|---|
| `chat.created` | apps/web | New chat session |
| `message.sent` | apps/web | User message |
| `stream.started` | packages/ai | AI response begins |
| `stream.completed` | packages/ai | AI response ends |
| `tool.invoked` | packages/ai | Tool call executed |
| `build.completed` | turbo | Build pipeline done |
| `test.completed` | turbo | Test pipeline done |

## Runtime Observations (Agent State Layer)

The `@chatos/state` package records observations to the `.agent/observations/` directory. Each observation is a JSON file with:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique observation ID |
| `agentId` | string | Agent that produced the observation |
| `sessionId` | string? | Associated session (if any) |
| `type` | enum | `metric`, `event`, `error`, `decision` |
| `name` | string | Observation name (e.g. `chat.response`) |
| `value` | object | Arbitrary payload |
| `timestamp` | ISO 8601 | When the observation was recorded |

### Agent Metrics (via `collectMetrics`)

| Metric | Description |
|---|---|
| `totalSessions` | Total sessions across all platforms |
| `activeSessions` | Sessions in `active` mode |
| `totalMessages` | Total messages across all sessions |
| `errorCount` | Observations of type `error` |
| `platformBreakdown` | Session count per platform |

Collect metrics programmatically:
```ts
import { collectMetrics, AgentStateStore, LocalStorageBackend } from "@chatos/state";
const store = new AgentStateStore(new LocalStorageBackend(".agent"));
const metrics = await collectMetrics(store);
```

Or via shell:
```bash
bash scripts/control/agent-status.sh .agent
```

## OpenTelemetry Integration

chatOS uses the AI SDK v6 `experimental_telemetry` feature combined with a shared telemetry module (`@chatos/ai/telemetry`) to emit OTel spans from all LLM interactions.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  streamText({ experimental_telemetry: ... })        │
│  AI SDK auto-emits spans:                           │
│    ai.streamText → ai.streamText.doStream           │
│                  → ai.toolCall (per tool)            │
└──────────────┬──────────────────────────────────────┘
               │ OTel spans
               ▼
┌─────────────────────────────────────────────────────┐
│  NodeTracerProvider + SimpleSpanProcessor            │
│  (initialized once per process via initTelemetry)    │
├──────────────┬──────────┬──────────┬────────────────┤
│  Console     │ Langfuse │ LangSmith│ Generic OTLP   │
│  Exporter    │ (OTLP)   │ (OTLP)  │ (Jaeger, etc.) │
└──────────────┴──────────┴──────────┴────────────────┘

┌─────────────────────────────────────────────────────┐
│  FS Observation Bridge                               │
│  persistStreamResult() → store.record() → bridge     │
│  Emits observation.chat.response spans               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Event Emitter Bridge (optional)                     │
│  attachOtelBridge(emitter) → agent.turn, tool.*      │
└─────────────────────────────────────────────────────┘
```

### Initialization

Telemetry is bootstrapped once per process:

- **apps/web**: Via Next.js `instrumentation.ts` hook (`register()`)
- **apps/bot**: Via `import "./instrumentation"` at entry point
- **apps/tui**: OTel spans flow through AI SDK's `experimental_telemetry` (no explicit init needed for CLI)

### Configuration Matrix

All configuration is via environment variables. Set `TELEMETRY_ENABLED=true` as the master switch.

| Variable | Purpose | Default |
|---|---|---|
| `TELEMETRY_ENABLED` | Master switch | `false` (disabled) |
| `TELEMETRY_CONSOLE` | Log spans to stdout | `false` |
| `TELEMETRY_RECORD_INPUTS` | Include prompts in spans | `true` |
| `TELEMETRY_RECORD_OUTPUTS` | Include responses in spans | `true` |
| `OTEL_SERVICE_NAME` | Service name in traces | `"chatos"` |
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key | — |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key | — |
| `LANGFUSE_BASE_URL` | Langfuse API base URL | `https://cloud.langfuse.com` |
| `LANGSMITH_API_KEY` | LangSmith API key | — |
| `LANGSMITH_ENDPOINT` | LangSmith API endpoint | `https://api.smith.langchain.com` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Generic OTLP endpoint | — |
| `MLFLOW_TRACKING_URI` | MLflow tracking URI (future) | — |

Backend activation is automatic: if credentials are present, the backend is enabled.

### LangSmith Thread Grouping

chatOS maps its `sessionId` to LangSmith's session/thread concept via the `langsmith.trace.session_id` metadata key. This means:

- All AI SDK spans from the same chatOS session appear grouped in LangSmith
- Multi-turn conversations are visible as a single thread
- The metadata key is set in `getAITelemetrySettings()` and flows through AI SDK's `experimental_telemetry.metadata`

### AI SDK Auto-Captured Span Attributes

When `experimental_telemetry` is enabled, the AI SDK automatically emits these attributes:

| Attribute | Description |
|---|---|
| `ai.model.id` | Model identifier (e.g. `anthropic/claude-sonnet-4.5`) |
| `ai.model.provider` | Provider name |
| `ai.usage.promptTokens` | Input token count |
| `ai.usage.completionTokens` | Output token count |
| `ai.response.msToFirstChunk` | Latency to first streaming chunk |
| `ai.response.msToFinish` | Total response duration |
| `ai.response.avgCompletionTokensPerSecond` | Throughput metric |
| `ai.operationId` | AI SDK operation name (e.g. `ai.streamText`) |

Custom chatOS attributes added via metadata:

| Attribute | Description |
|---|---|
| `chatos.agent.id` | Agent identifier (e.g. `chatos-web`) |
| `chatos.session.id` | Chat session ID |
| `chatos.platform` | Platform (web, slack, tui, cli) |
| `chatos.model` | Model ID used |
| `langsmith.trace.session_id` | LangSmith thread grouping key |

### MLflow Integration (Future)

MLflow lacks a first-class TypeScript OTel SDK. Planned approach:

1. **Short term**: Point `OTEL_EXPORTER_OTLP_ENDPOINT` at an OTel Collector with MLflow exporter
2. **Medium term**: Build `MlflowSpanProcessor` that posts to MLflow REST API
3. **Long term**: Native TypeScript SDK when available

The `MLFLOW_TRACKING_URI` env var is reserved for future use.

## Integrations

- **Langfuse**: LLM tracing, cost tracking, prompt management (via OTLP)
- **LangSmith**: Agent tracing with thread grouping (via OTLP)
- **Vercel Analytics**: Web vitals, traffic, errors
- **OpenTelemetry**: Distributed tracing via `@opentelemetry/sdk-trace-node`
- **Generic OTLP**: Jaeger, Grafana Tempo, or any OTLP-compatible backend
