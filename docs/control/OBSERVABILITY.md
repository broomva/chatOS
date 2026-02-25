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

## Integrations

- **Langfuse** (optional): LLM tracing, cost tracking, prompt management
- **Vercel Analytics**: Web vitals, traffic, errors
- **OpenTelemetry**: Distributed tracing (via @vercel/otel)
