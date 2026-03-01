/**
 * Agent Event System — typed lifecycle events emitted during streaming.
 *
 * Inspired by pi-agent-core's event-driven lifecycle pattern. Instead of
 * recording observations only after-the-fact, events are emitted in real-time
 * so that consumers (TUI, web, bot) can react immediately.
 */

export type AgentEvent =
  | { type: "turn_start"; sessionId: string; model: string; timestamp: string }
  | { type: "message_delta"; delta: string; timestamp: string }
  | { type: "message_end"; fullText: string; timestamp: string }
  | { type: "tool_start"; tool: string; args: unknown; timestamp: string }
  | { type: "tool_end"; tool: string; result: unknown; timestamp: string }
  | {
      type: "turn_end";
      reason: "stop" | "error" | "length";
      timestamp: string;
    }
  | { type: "error"; error: Error; timestamp: string };

export type AgentEventType = AgentEvent["type"];

type EventHandler<T extends AgentEventType> = (event: Extract<AgentEvent, { type: T }>) => void;

type AnyEventHandler = (event: AgentEvent) => void;

/**
 * Typed event emitter for agent lifecycle events.
 *
 * Usage:
 * ```ts
 * const emitter = new AgentEventEmitter();
 * emitter.on("message_delta", (e) => console.log(e.delta));
 * emitter.on("*", (e) => logEvent(e));
 * emitter.emit({ type: "message_delta", delta: "Hello", timestamp: now() });
 * ```
 */
export class AgentEventEmitter {
  private handlers = new Map<string, Set<EventHandler<AgentEventType>>>();
  private wildcardHandlers = new Set<AnyEventHandler>();

  /** Subscribe to a specific event type. */
  on<T extends AgentEventType>(type: T, handler: EventHandler<T>): () => void;
  /** Subscribe to all events. */
  on(type: "*", handler: AnyEventHandler): () => void;
  on(type: string, handler: AnyEventHandler): () => void {
    if (type === "*") {
      this.wildcardHandlers.add(handler);
      return () => {
        this.wildcardHandlers.delete(handler);
      };
    }
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as EventHandler<AgentEventType>);
    return () => {
      set!.delete(handler as EventHandler<AgentEventType>);
    };
  }

  /** Emit an event to all matching subscribers. */
  emit(event: AgentEvent): void {
    const set = this.handlers.get(event.type);
    if (set) {
      for (const handler of set) {
        handler(event as Extract<AgentEvent, { type: AgentEventType }>);
      }
    }
    for (const handler of this.wildcardHandlers) {
      handler(event);
    }
  }

  /** Remove all handlers. */
  clear(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }
}

/** Helper to create a timestamp string for events. */
export function eventTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Attach an OTel bridge to an AgentEventEmitter.
 *
 * Subscribes to lifecycle events and creates corresponding OTel spans.
 * No-ops when telemetry is disabled. Returns an unsubscribe function.
 */
export function attachOtelBridge(emitter: AgentEventEmitter): () => void {
  let telemetryEnabled = false;
  try {
    telemetryEnabled = process.env.TELEMETRY_ENABLED === "true";
  } catch {
    return () => {};
  }

  if (!telemetryEnabled) return () => {};

  let api: typeof import("@opentelemetry/api") | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    api = require("@opentelemetry/api") as typeof import("@opentelemetry/api");
  } catch {
    return () => {};
  }

  const otel = api;
  const tracer = otel.trace.getTracer("chatos-events");
  const activeSpans = new Map<string, ReturnType<typeof tracer.startSpan>>();
  let currentTurnKey: string | null = null;

  const unsub = emitter.on("*", (event) => {
    switch (event.type) {
      case "turn_start": {
        const span = tracer.startSpan("agent.turn", {
          attributes: {
            "chatos.session.id": event.sessionId,
            "chatos.model": event.model,
          },
        });
        currentTurnKey = `turn:${event.sessionId}`;
        activeSpans.set(currentTurnKey, span);
        break;
      }
      case "turn_end": {
        if (currentTurnKey) {
          const span = activeSpans.get(currentTurnKey);
          if (span) {
            span.setAttribute("agent.turn.reason", event.reason);
            span.end();
            activeSpans.delete(currentTurnKey);
          }
          currentTurnKey = null;
        }
        break;
      }
      case "tool_start": {
        const span = tracer.startSpan(`tool.${event.tool}`, {
          attributes: {
            "tool.name": event.tool,
          },
        });
        activeSpans.set(`tool:${event.tool}`, span);
        break;
      }
      case "tool_end": {
        const span = activeSpans.get(`tool:${event.tool}`);
        if (span) {
          span.end();
          activeSpans.delete(`tool:${event.tool}`);
        }
        break;
      }
      case "error": {
        const span = tracer.startSpan("agent.error");
        span.setAttribute("error", true);
        span.setAttribute("error.message", event.error.message);
        span.end();
        break;
      }
    }
  });

  return unsub;
}
