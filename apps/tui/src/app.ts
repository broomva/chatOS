import { gateway } from "@ai-sdk/gateway";
import { DEFAULT_CHAT_MODEL, systemPrompt } from "@chatos/ai";
import { AgentEventEmitter, eventTimestamp } from "@chatos/ai/events";
import type { AgentStateStore } from "@chatos/state";
import type { AgentMessage, MessagePart } from "@chatos/types";
import { type OverlayHandle, type ProcessTerminal, Text, TUI } from "@mariozechner/pi-tui";
import { streamText } from "ai";
import { HelpOverlay } from "./components/help-overlay";
import { InputBar } from "./components/input-bar";
import { MessageList } from "./components/message-list";
import { ModelPicker } from "./components/model-picker";
import { SessionSelector } from "./components/session-selector";
import { StatusBar } from "./components/status-bar";
import { colors } from "./theme";

const AGENT_ID = "chatos-tui";

export class ChatApp {
  private tui: TUI;
  private store: AgentStateStore;
  private emitter: AgentEventEmitter;

  private header: Text;
  private messageList: MessageList;
  private inputBar: InputBar;
  private statusBar: StatusBar;

  private sessionId: string | null = null;
  private selectedModel = DEFAULT_CHAT_MODEL;
  private streaming = false;
  private overlay: OverlayHandle | null = null;

  constructor(terminal: ProcessTerminal, store: AgentStateStore) {
    this.store = store;
    this.emitter = new AgentEventEmitter();
    this.tui = new TUI(terminal);

    // Header
    this.header = new Text(colors.header(" chatOS ") + colors.headerDim("  No session"), 0, 0);
    this.tui.addChild(this.header);

    // Message list (scrollable area)
    this.messageList = new MessageList(this.tui);
    this.tui.addChild(this.messageList);

    // Input bar
    this.inputBar = new InputBar(this.tui);
    this.inputBar.onSubmit = (text: string) => {
      if (text.trim()) {
        this.sendMessage(text.trim());
      }
    };
    this.tui.addChild(this.inputBar);

    // Status bar
    this.statusBar = new StatusBar();
    this.statusBar.setModel(this.selectedModel);
    this.tui.addChild(this.statusBar);

    // Wire up event emitter for status updates
    this.emitter.on("turn_start", () => {
      this.statusBar.setStreaming(true);
      this.tui.requestRender();
    });
    this.emitter.on("turn_end", () => {
      this.statusBar.setStreaming(false);
      this.tui.requestRender();
    });
  }

  /** Start the TUI event loop. */
  async start(initialSessionId?: string): Promise<void> {
    // Intercept raw input for keybindings before the editor sees it
    this.tui.onDebug = () => this.toggleHelp();

    if (initialSessionId) {
      await this.switchSession(initialSessionId);
    } else {
      await this.showSessionSelector();
    }

    this.tui.start();
  }

  /** Stop the TUI cleanly. */
  stop(): void {
    this.tui.stop();
  }

  /** Handle global keybindings. Returns true if handled. */
  handleGlobalKey(data: string): boolean {
    // Ctrl+Q — quit
    if (data === "\x11") {
      this.stop();
      process.exit(0);
    }
    // Ctrl+S — session selector
    if (data === "\x13") {
      this.showSessionSelector();
      return true;
    }
    // Ctrl+P — model picker (Ctrl+M = \x0d conflicts with Enter)
    if (data === "\x10") {
      this.showModelPicker();
      return true;
    }
    // Ctrl+H — help
    if (data === "\x08") {
      this.toggleHelp();
      return true;
    }
    return false;
  }

  private async sendMessage(text: string): Promise<void> {
    if (this.streaming) return;

    // Auto-create session if needed
    if (!this.sessionId) {
      const session = await this.store.createSession({
        agentId: AGENT_ID,
        platform: "tui",
        mode: "active",
        visibility: "private",
        title: text.slice(0, 50),
      });
      this.sessionId = session.id;
      this.updateHeader();
    }

    // Persist user message
    await this.store.appendMessage(this.sessionId, {
      sessionId: this.sessionId,
      role: "user",
      parts: [{ type: "text", text }],
      platform: "tui",
    });

    // Reload and render messages
    const history = await this.store.getMessages(this.sessionId);
    this.messageList.setMessages(history);
    this.statusBar.setMessageCount(history.length);

    // Start streaming response
    this.streaming = true;
    this.messageList.startStreaming();

    this.emitter.emit({
      type: "turn_start",
      sessionId: this.sessionId,
      model: this.selectedModel,
      timestamp: eventTimestamp(),
    });

    const messages = history.map((m: AgentMessage) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.parts
        .filter((p: MessagePart): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n"),
    }));

    try {
      const result = streamText({
        model: gateway(this.selectedModel),
        system: systemPrompt({ selectedChatModel: this.selectedModel }),
        messages,
      });

      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
        this.emitter.emit({
          type: "message_delta",
          delta: chunk,
          timestamp: eventTimestamp(),
        });
        this.messageList.updateStreamingContent(fullText);
      }

      this.emitter.emit({
        type: "message_end",
        fullText,
        timestamp: eventTimestamp(),
      });

      // Persist assistant message
      await this.store.appendMessage(this.sessionId, {
        sessionId: this.sessionId,
        role: "assistant",
        parts: [{ type: "text", text: fullText }],
        platform: "tui",
      });

      // Record observation
      await this.store.record({
        agentId: AGENT_ID,
        sessionId: this.sessionId,
        type: "event",
        name: "chat.response",
        value: {
          platform: "tui",
          model: this.selectedModel,
          responseLength: fullText.length,
        },
      });

      this.emitter.emit({
        type: "turn_end",
        reason: "stop",
        timestamp: eventTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emitter.emit({ type: "error", error, timestamp: eventTimestamp() });
      this.emitter.emit({
        type: "turn_end",
        reason: "error",
        timestamp: eventTimestamp(),
      });
    } finally {
      this.streaming = false;
      this.messageList.stopStreaming();

      // Refresh message list from store
      const updated = await this.store.getMessages(this.sessionId!);
      this.messageList.setMessages(updated);
      this.statusBar.setMessageCount(updated.length);
      this.tui.requestRender();
    }
  }

  async switchSession(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    const messages = await this.store.getMessages(sessionId);
    this.messageList.setMessages(messages);
    this.statusBar.setMessageCount(messages.length);
    this.updateHeader();
    this.tui.requestRender();
  }

  private updateHeader(): void {
    const sessionLabel = this.sessionId ? `Session: ${this.sessionId.slice(0, 12)}` : "No session";
    this.header.setText(colors.header(" chatOS ") + colors.headerDim(`  ${sessionLabel}`));
  }

  private async showSessionSelector(): Promise<void> {
    if (this.overlay) {
      this.tui.hideOverlay();
      this.overlay = null;
    }
    const selector = new SessionSelector();
    await selector.loadSessions(this.store);
    selector.onSelect = (sessionId: string) => {
      this.tui.hideOverlay();
      this.overlay = null;
      this.switchSession(sessionId);
    };
    selector.onNewSession = async () => {
      this.tui.hideOverlay();
      this.overlay = null;
      const session = await this.store.createSession({
        agentId: AGENT_ID,
        platform: "tui",
        mode: "active",
        visibility: "private",
      });
      await this.switchSession(session.id);
    };
    selector.onCancel = () => {
      this.tui.hideOverlay();
      this.overlay = null;
    };
    this.overlay = this.tui.showOverlay(selector, { width: "80%", anchor: "center" });
  }

  private showModelPicker(): void {
    if (this.overlay) {
      this.tui.hideOverlay();
      this.overlay = null;
    }
    const picker = new ModelPicker();
    picker.onSelect = (modelId: string) => {
      this.selectedModel = modelId;
      this.statusBar.setModel(modelId);
      this.tui.hideOverlay();
      this.overlay = null;
      this.tui.requestRender();
    };
    picker.onCancel = () => {
      this.tui.hideOverlay();
      this.overlay = null;
    };
    this.overlay = this.tui.showOverlay(picker, { width: "80%", anchor: "center" });
  }

  private toggleHelp(): void {
    if (this.overlay) {
      this.tui.hideOverlay();
      this.overlay = null;
      return;
    }
    const help = new HelpOverlay();
    this.overlay = this.tui.showOverlay(help, { width: 60, anchor: "center" });
  }
}
