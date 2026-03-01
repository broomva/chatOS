import { gateway } from "@ai-sdk/gateway";
import {
  chatModels,
  DEFAULT_CHAT_MODEL,
  persistStreamResult,
  systemPrompt,
  weatherTool,
} from "@chatos/ai";
import { getAITelemetrySettings } from "@chatos/ai/telemetry";
import type { AgentStateStore } from "@chatos/state";
import type { AgentMessage, MessagePart } from "@chatos/types";
import { stepCountIs, streamText } from "ai";
import chalk from "chalk";

const AGENT_ID = "chatos-cli";

// ── Arg helpers ──────────────────────────────────────────────

function extractFlag(flag: string, args: string[]): string | undefined {
  const idx = args.indexOf(`--${flag}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function hasFlag(flag: string, args: string[]): boolean {
  return args.includes(`--${flag}`);
}

function positionalArgs(args: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg?.startsWith("--")) {
      i += 2; // skip flag + value
    } else if (arg) {
      result.push(arg);
      i++;
    } else {
      i++;
    }
  }
  return result;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Command dispatch ─────────────────────────────────────────

export async function runCommand(
  command: string,
  args: string[],
  store: AgentStateStore,
): Promise<void> {
  switch (command) {
    case "send":
      return cmdSend(args, store);
    case "sessions":
      return cmdSessions(args, store);
    case "messages":
      return cmdMessages(args, store);
    case "inspect":
      return cmdInspect(args, store);
    case "help":
      return cmdHelp();
    default:
      console.error(`Unknown command: ${command}`);
      cmdHelp();
      process.exit(1);
  }
}

// ── send ─────────────────────────────────────────────────────

async function cmdSend(args: string[], store: AgentStateStore): Promise<void> {
  const positional = positionalArgs(args);
  const text = positional[0];
  if (!text) {
    console.error('Usage: chatos send "message" [--model id] [--session id]');
    process.exit(1);
  }

  const modelFlag = extractFlag("model", args);
  const model = modelFlag ?? DEFAULT_CHAT_MODEL;

  // Validate model
  if (modelFlag && !chatModels.some((m) => m.id === modelFlag)) {
    console.error(`Unknown model: ${modelFlag}`);
    console.error(`Available: ${chatModels.map((m) => m.id).join(", ")}`);
    process.exit(1);
  }

  // Resolve or create session
  let sessionId = extractFlag("session", args);
  if (!sessionId) {
    const session = await store.createSession({
      agentId: AGENT_ID,
      platform: "cli",
      mode: "active",
      visibility: "private",
      title: text.slice(0, 50),
    });
    sessionId = session.id;
  } else {
    const existing = await store.getSession(sessionId);
    if (!existing) {
      console.error(`Session not found: ${sessionId}`);
      process.exit(1);
    }
  }

  // Persist user message
  await store.appendMessage(sessionId, {
    sessionId,
    role: "user",
    parts: [{ type: "text", text }],
    platform: "cli",
  });

  // Build message history
  const history = await store.getMessages(sessionId);
  const messages = history.map((m: AgentMessage) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.parts
      .filter((p: MessagePart): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n"),
  }));

  // Stream response
  const result = streamText({
    model: gateway(model),
    system: systemPrompt({ selectedChatModel: model }),
    messages,
    tools: { getWeather: weatherTool },
    experimental_telemetry: getAITelemetrySettings({
      agentId: AGENT_ID,
      sessionId,
      model,
      platform: "cli",
    }),
    stopWhen: stepCountIs(5),
  });

  let fullText = "";
  for await (const chunk of result.textStream) {
    fullText += chunk;
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");

  // Persist assistant response
  await persistStreamResult(
    { store, sessionId, agentId: AGENT_ID, platform: "cli", model },
    {
      text: fullText,
      steps: await result.steps,
      finishReason: await result.finishReason,
      usage: await result.usage,
    },
  );

  // Print session ID to stderr so stdout stays pipeable
  process.stderr.write(`session: ${sessionId}\n`);
}

// ── sessions ─────────────────────────────────────────────────

async function cmdSessions(args: string[], store: AgentStateStore): Promise<void> {
  const sessions = await store.listSessions();
  const json = hasFlag("json", args);

  if (json) {
    console.log(JSON.stringify(sessions, null, 2));
    return;
  }

  if (sessions.length === 0) {
    console.log(chalk.dim("No sessions found."));
    return;
  }

  console.log(chalk.bold("Sessions\n"));
  for (const s of sessions) {
    const id = s.id.slice(0, 12);
    const title = s.title ?? chalk.dim("(untitled)");
    const time = relativeTime(s.updatedAt);
    const platform = chalk.dim(`[${s.platform}]`);
    console.log(`  ${chalk.cyan(id)}  ${title}  ${platform}  ${chalk.dim(time)}`);
  }
}

// ── messages ─────────────────────────────────────────────────

async function cmdMessages(args: string[], store: AgentStateStore): Promise<void> {
  const positional = positionalArgs(args);
  const sessionId = positional[0];
  if (!sessionId) {
    console.error("Usage: chatos messages <session-id> [--json]");
    process.exit(1);
  }

  const messages = await store.getMessages(sessionId);
  const json = hasFlag("json", args);

  if (json) {
    console.log(JSON.stringify(messages, null, 2));
    return;
  }

  if (messages.length === 0) {
    console.log(chalk.dim("No messages in this session."));
    return;
  }

  for (const m of messages) {
    const roleColor =
      m.role === "user" ? chalk.green : m.role === "assistant" ? chalk.blue : chalk.yellow;
    const time = chalk.dim(relativeTime(m.createdAt));
    const model = m.model ? chalk.dim(` (${m.model})`) : "";
    console.log(`\n${roleColor.bold(m.role)}${model}  ${time}`);

    for (const part of m.parts) {
      switch (part.type) {
        case "text":
          console.log(part.text);
          break;
        case "reasoning":
          console.log(
            chalk.dim.italic(
              `[reasoning] ${part.reasoning.slice(0, 200)}${part.reasoning.length > 200 ? "..." : ""}`,
            ),
          );
          break;
        case "tool-invocation":
          console.log(
            chalk.magenta(`[tool: ${part.toolInvocation.toolName}]`) +
              chalk.dim(` args=${JSON.stringify(part.toolInvocation.args)}`) +
              (part.toolInvocation.result !== undefined
                ? chalk.dim(` → ${JSON.stringify(part.toolInvocation.result)}`)
                : ""),
          );
          break;
        case "source":
          console.log(
            chalk.underline(part.source.url) + (part.source.title ? ` ${part.source.title}` : ""),
          );
          break;
        case "image":
          console.log(chalk.dim("[image]"));
          break;
      }
    }

    if (m.usage) {
      console.log(
        chalk.dim(`  tokens: ${m.usage.inputTokens ?? "?"}in / ${m.usage.outputTokens ?? "?"}out`),
      );
    }
  }
}

// ── inspect ──────────────────────────────────────────────────

async function cmdInspect(args: string[], store: AgentStateStore): Promise<void> {
  const positional = positionalArgs(args);
  const messageId = positional[0];
  if (!messageId) {
    console.error("Usage: chatos inspect <message-id> [--json]");
    process.exit(1);
  }

  const json = hasFlag("json", args);

  // Scan all sessions to find the message
  const sessions = await store.listSessions();
  let found: AgentMessage | null = null;
  let foundSessionId: string | null = null;

  for (const session of sessions) {
    const messages = await store.getMessages(session.id);
    const match = messages.find((m) => m.id === messageId);
    if (match) {
      found = match;
      foundSessionId = session.id;
      break;
    }
  }

  if (!found || !foundSessionId) {
    console.error(`Message not found: ${messageId}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify(found, null, 2));
    return;
  }

  console.log(chalk.bold("Message Details\n"));
  console.log(`  ${chalk.dim("id:")}           ${found.id}`);
  console.log(`  ${chalk.dim("session:")}      ${foundSessionId}`);
  console.log(`  ${chalk.dim("role:")}         ${found.role}`);
  console.log(`  ${chalk.dim("model:")}        ${found.model ?? "-"}`);
  console.log(`  ${chalk.dim("finishReason:")} ${found.finishReason ?? "-"}`);
  console.log(`  ${chalk.dim("platform:")}     ${found.platform ?? "-"}`);
  console.log(`  ${chalk.dim("createdAt:")}    ${found.createdAt}`);

  if (found.usage) {
    console.log(
      `  ${chalk.dim("usage:")}        ${found.usage.inputTokens ?? "?"}in / ${found.usage.outputTokens ?? "?"}out / ${found.usage.totalTokens ?? "?"}total${found.usage.reasoningTokens ? ` / ${found.usage.reasoningTokens}reasoning` : ""}`,
    );
  }

  console.log(`\n${chalk.bold("Parts")} (${found.parts.length})\n`);

  for (const [i, part] of found.parts.entries()) {
    console.log(`  ${chalk.dim(`[${i}]`)} ${chalk.cyan(part.type)}`);

    switch (part.type) {
      case "text":
        console.log(`      ${part.text.slice(0, 500)}${part.text.length > 500 ? "..." : ""}`);
        break;
      case "reasoning":
        console.log(
          `      ${part.reasoning.slice(0, 300)}${part.reasoning.length > 300 ? "..." : ""}`,
        );
        break;
      case "tool-invocation": {
        const ti = part.toolInvocation;
        console.log(`      tool:    ${ti.toolName}`);
        console.log(`      callId:  ${ti.toolCallId}`);
        console.log(`      state:   ${ti.state}`);
        console.log(`      args:    ${JSON.stringify(ti.args)}`);
        if (ti.result !== undefined) {
          console.log(`      result:  ${JSON.stringify(ti.result)}`);
        }
        break;
      }
      case "source":
        console.log(`      url:   ${part.source.url}`);
        if (part.source.title) console.log(`      title: ${part.source.title}`);
        break;
      case "image":
        console.log(`      mime: ${part.mimeType ?? "unknown"}`);
        break;
    }
  }
}

// ── help ─────────────────────────────────────────────────────

function cmdHelp(): void {
  const usage = `
${chalk.bold("chatOS")} — AI chat in your terminal

${chalk.bold("Usage:")}
  chatos                                    Interactive TUI
  chatos <session-id>                       TUI, resume session
  chatos send "message" [--model id] [--session id]
                                            Non-interactive chat
  chatos sessions [--json]                  List sessions
  chatos messages <session-id> [--json]     Show messages
  chatos inspect <message-id> [--json]      Show full message structure
  chatos help                               Print this help

${chalk.bold("Models:")}
${chatModels.map((m) => `  ${chalk.cyan(m.id.padEnd(42))} ${m.name}`).join("\n")}

  Default: ${chalk.cyan(DEFAULT_CHAT_MODEL)}

${chalk.bold("Examples:")}
  chatos send "What is the capital of France?"
  chatos send "Weather in Paris?" --model openai/gpt-4.1-mini
  chatos sessions
  chatos messages abc123def456 --json
`.trimStart();

  console.log(usage);
}
