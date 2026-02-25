import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import { colors } from "../theme";

const HELP_TEXT = `
  Keyboard Shortcuts

  Enter          Send message
  Shift+Enter    New line in editor
  Ctrl+S         Switch session
  Ctrl+M         Change model
  Ctrl+H         Toggle this help
  Ctrl+Q         Quit

  Esc            Close overlay

  Editor Keys
  Ctrl+A / Ctrl+E    Start / end of line
  Ctrl+W             Delete word backward
  Ctrl+K             Delete to end of line
  Ctrl+U             Delete to start of line
  Ctrl+Z             Undo
  Ctrl+Shift+Z       Redo
`;

/**
 * Static help overlay showing keyboard shortcuts.
 */
export class HelpOverlay extends Container {
  constructor() {
    super();
    const title = new Text(colors.info(" Help (Esc to close)"), 1, 0);
    this.addChild(title);
    this.addChild(new Spacer(1));

    for (const line of HELP_TEXT.trim().split("\n")) {
      this.addChild(new Text(line, 1, 0));
    }
  }
}
