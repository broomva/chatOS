import type { AgentStateStore } from "@chatos/state";
import { Container, type SelectItem, SelectList, Text, type TUI } from "@mariozechner/pi-tui";
import { colors, selectListTheme } from "../theme";

/**
 * Session selector overlay — lists sessions from the agent store.
 * Shown as a TUI overlay when the user presses Ctrl+S.
 */
export class SessionSelector extends Container {
  private list: SelectList;
  onSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  onCancel?: () => void;

  constructor() {
    super();
    const title = new Text(colors.info(" Sessions (Enter to select, Esc to cancel)"), 1, 0);
    this.addChild(title);

    this.list = new SelectList([], 10, selectListTheme);
    this.list.onSelect = (item: SelectItem) => {
      if (item.value === "__new__") {
        this.onNewSession?.();
      } else {
        this.onSelect?.(item.value);
      }
    };
    this.list.onCancel = () => this.onCancel?.();
    this.addChild(this.list);
  }

  async loadSessions(store: AgentStateStore): Promise<void> {
    const sessions = await store.listSessions(20);
    const items: SelectItem[] = [
      { value: "__new__", label: "+ New Session", description: "Start a new conversation" },
      ...sessions.map((s) => ({
        value: s.id,
        label: s.title ?? s.id.slice(0, 12),
        description: `${s.platform} | ${new Date(s.updatedAt).toLocaleString()}`,
      })),
    ];
    this.list = new SelectList(items, 10, selectListTheme);
    this.list.onSelect = (item: SelectItem) => {
      if (item.value === "__new__") {
        this.onNewSession?.();
      } else {
        this.onSelect?.(item.value);
      }
    };
    this.list.onCancel = () => this.onCancel?.();
  }

  handleInput(data: string): void {
    this.list.handleInput(data);
  }
}
