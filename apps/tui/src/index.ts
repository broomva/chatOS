import { AgentStateStore, LocalStorageBackend } from "@chatos/state";
import { ProcessTerminal } from "@mariozechner/pi-tui";
import { ChatApp } from "./app";

const stateDir = process.env.AGENT_STATE_DIR ?? ".agent";
const sessionId = process.argv[2] ?? undefined;

const backend = new LocalStorageBackend(stateDir);
const store = new AgentStateStore(backend);

const terminal = new ProcessTerminal();
const app = new ChatApp(terminal, store);

// Clean shutdown on signals
function shutdown() {
  app.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.start(sessionId);
