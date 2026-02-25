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

## Integrations

- **Langfuse** (optional): LLM tracing, cost tracking, prompt management
- **Vercel Analytics**: Web vitals, traffic, errors
- **OpenTelemetry**: Distributed tracing (via @vercel/otel)
