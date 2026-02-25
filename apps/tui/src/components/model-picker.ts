import { chatModels } from "@chatos/ai/models";
import { Container, type SelectItem, SelectList, Text } from "@mariozechner/pi-tui";
import { colors, selectListTheme } from "../theme";

/**
 * Model picker overlay — lists available chat models.
 * Shown as a TUI overlay when the user presses Ctrl+M.
 */
export class ModelPicker extends Container {
  private list: SelectList;
  onSelect?: (modelId: string) => void;
  onCancel?: () => void;

  constructor() {
    super();
    const title = new Text(colors.info(" Models (Enter to select, Esc to cancel)"), 1, 0);
    this.addChild(title);

    const items: SelectItem[] = chatModels.map((m) => ({
      value: m.id,
      label: m.name,
      description: `${m.provider} — ${m.description}`,
    }));

    this.list = new SelectList(items, 12, selectListTheme);
    this.list.onSelect = (item: SelectItem) => this.onSelect?.(item.value);
    this.list.onCancel = () => this.onCancel?.();
    this.addChild(this.list);
  }

  handleInput(data: string): void {
    this.list.handleInput(data);
  }
}
