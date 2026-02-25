/**
 * Message Queue — handles user messages sent during active streaming.
 *
 * Inspired by pi-agent-core's steering/follow-up pattern. When the assistant
 * is streaming a response, incoming user messages are classified:
 *
 * - **Steering** messages interrupt the current turn (e.g. "stop", "no, I meant...")
 * - **Follow-up** messages are queued for the next turn
 *
 * The consumer (agent loop) checks `hasSteering()` periodically during streaming
 * and calls `drain()` after a turn ends to pick up follow-ups.
 */

export type QueuedMessage = {
  text: string;
  timestamp: string;
};

export class MessageQueue {
  private steering: QueuedMessage[] = [];
  private followUp: QueuedMessage[] = [];

  /** Push a steering message (interrupts the current turn). */
  interrupt(text: string): void {
    this.steering.push({ text, timestamp: new Date().toISOString() });
  }

  /** Push a follow-up message (queued for next turn). */
  enqueue(text: string): void {
    this.followUp.push({ text, timestamp: new Date().toISOString() });
  }

  /** Check whether there are pending steering messages. */
  hasSteering(): boolean {
    return this.steering.length > 0;
  }

  /** Pop all steering messages (oldest first). */
  popSteering(): QueuedMessage[] {
    const messages = this.steering;
    this.steering = [];
    return messages;
  }

  /** Drain all follow-up messages after a turn ends (oldest first). */
  drain(): QueuedMessage[] {
    const messages = this.followUp;
    this.followUp = [];
    return messages;
  }

  /** Check whether the queue has any pending messages (steering or follow-up). */
  get pending(): boolean {
    return this.steering.length > 0 || this.followUp.length > 0;
  }

  /** Total number of queued messages across both queues. */
  get size(): number {
    return this.steering.length + this.followUp.length;
  }

  /** Clear all queues. */
  clear(): void {
    this.steering = [];
    this.followUp = [];
  }
}
