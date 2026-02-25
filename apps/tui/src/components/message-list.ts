import type { AgentMessage, MessagePart } from "@chatos/types";
import {
  type Component,
  Container,
  Loader,
  Markdown,
  Spacer,
  Text,
  type TUI,
} from "@mariozechner/pi-tui";
import { colors, markdownTheme } from "../theme";

/**
 * Scrollable chat history with Markdown rendering per message.
 * Renders all messages in a session, with auto-scroll on new content.
 *
 * Wraps a Container internally rather than extending it, so we can
 * track children and clear them reliably.
 */
export class MessageList implements Component {
  private tui: TUI;
  private container: Container;
  private tracked: Component[] = [];
  private loader: Loader | null = null;
  private streamingMarkdown: Markdown | null = null;

  constructor(tui: TUI) {
    this.tui = tui;
    this.container = new Container();
  }

  render(width: number): string[] {
    return this.container.render(width);
  }

  invalidate(): void {
    this.container.invalidate?.();
  }

  /** Render all messages from history, clearing previous content. */
  setMessages(messages: AgentMessage[]): void {
    this.clearAll();
    for (const msg of messages) {
      this.addMessageComponent(msg);
    }
    this.tui.requestRender();
  }

  /** Start a streaming response — shows a loader, then streams markdown. */
  startStreaming(): void {
    this.stopStreaming();

    const label = new Text(colors.assistantLabel("assistant"), 1, 0);
    this.addTracked(label);

    this.streamingMarkdown = new Markdown("", 1, 0, markdownTheme);
    this.addTracked(this.streamingMarkdown);

    this.loader = new Loader(this.tui, colors.info, colors.dim, "Thinking...");
    this.addTracked(this.loader);
    this.tui.requestRender();
  }

  /** Update the streaming markdown content with accumulated text. */
  updateStreamingContent(text: string): void {
    if (this.loader) {
      this.loader.stop();
      this.container.removeChild(this.loader);
      this.tracked = this.tracked.filter((c) => c !== this.loader);
      this.loader = null;
    }
    if (this.streamingMarkdown) {
      this.streamingMarkdown.setText(text);
      this.tui.requestRender();
    }
  }

  /** Finalize the streaming response. */
  stopStreaming(): void {
    if (this.loader) {
      this.loader.stop();
      this.container.removeChild(this.loader);
      this.tracked = this.tracked.filter((c) => c !== this.loader);
      this.loader = null;
    }
    this.streamingMarkdown = null;
  }

  private clearAll(): void {
    this.stopStreaming();
    for (const child of this.tracked) {
      this.container.removeChild(child);
    }
    this.tracked = [];
  }

  private addTracked(child: Component): void {
    this.tracked.push(child);
    this.container.addChild(child);
  }

  private addMessageComponent(msg: AgentMessage): void {
    const textContent = msg.parts
      .filter((p: MessagePart): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");

    if (!textContent) return;

    const roleLabel =
      msg.role === "user"
        ? colors.userLabel("user")
        : msg.role === "assistant"
          ? colors.assistantLabel("assistant")
          : colors.systemLabel(msg.role);

    const label = new Text(roleLabel, 1, 0);
    this.addTracked(label);

    if (msg.role === "assistant") {
      const md = new Markdown(textContent, 1, 0, markdownTheme);
      this.addTracked(md);
    } else {
      const text = new Text(textContent, 1, 0);
      this.addTracked(text);
    }

    this.addTracked(new Spacer(1));
  }
}
