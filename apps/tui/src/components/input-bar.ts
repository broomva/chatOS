import { Editor, type TUI } from "@mariozechner/pi-tui";
import { editorTheme } from "../theme";

/**
 * Input bar wrapping pi-tui's Editor.
 * Enter submits, Shift+Enter / Ctrl+Enter inserts a newline.
 */
export class InputBar extends Editor {
  constructor(tui: TUI) {
    super(tui, editorTheme, { paddingX: 1 });
  }
}
