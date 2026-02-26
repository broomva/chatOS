import { AgentStateStore, LocalStorageBackend, resolveStateDir } from "@chatos/state";

const COMMANDS = new Set(["send", "sessions", "messages", "inspect", "help"]);

const backend = new LocalStorageBackend(resolveStateDir());
const store = new AgentStateStore(backend);

const command = process.argv[2];

if (!command || !COMMANDS.has(command)) {
  // TUI mode — dynamic import to avoid loading pi-tui for CLI commands
  const { ProcessTerminal } = await import("@mariozechner/pi-tui");
  const { ChatApp } = await import("./app");

  const sessionId = command; // treat unknown arg as session ID
  const terminal = new ProcessTerminal();
  const app = new ChatApp(terminal, store);

  function shutdown() {
    app.stop();
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    app.stop();
    console.error("Fatal error:", err);
    process.exit(1);
  });

  await app.start(sessionId);
} else {
  // CLI mode — no pi-tui dependency
  const { runCommand } = await import("./cli");
  const args = process.argv.slice(3);
  await runCommand(command, args, store);
}
