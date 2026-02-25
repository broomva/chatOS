import { Text } from "@mariozechner/pi-tui";
import { colors } from "../theme";

/**
 * Status bar showing current model, message count, and keybindings.
 */
export class StatusBar extends Text {
  private model = "";
  private messageCount = 0;
  private streaming = false;

  constructor() {
    super("", 0, 0, colors.statusBar);
    this.refresh();
  }

  setModel(model: string): void {
    this.model = model;
    this.refresh();
  }

  setMessageCount(count: number): void {
    this.messageCount = count;
    this.refresh();
  }

  setStreaming(streaming: boolean): void {
    this.streaming = streaming;
    this.refresh();
  }

  private refresh(): void {
    const modelName = this.model.split("/").pop() ?? this.model;
    const streamIndicator = this.streaming ? " [streaming...]" : "";
    const bar = ` ${modelName} | ${this.messageCount} msgs${streamIndicator} | ^S:sessions  ^M:models  ^H:help  ^Q:quit `;
    this.setText(bar);
  }
}
