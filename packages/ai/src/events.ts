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
