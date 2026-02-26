import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentSchema } from "@chatos/types";

/**
 * Resolve the shared `.agent/` state directory.
 *
 * Priority:
 * 1. `AGENT_STATE_DIR` env var (absolute or relative to cwd)
 * 2. `<monorepo-root>/.agent/` (walks up to find root package.json with workspaces)
 * 3. Falls back to `<cwd>/.agent/`
 */
export function resolveStateDir(): string {
  if (process.env.AGENT_STATE_DIR) {
    return path.resolve(process.env.AGENT_STATE_DIR);
  }

  // Walk up to find the monorepo root (package.json with "workspaces")
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) {
        return path.join(dir, ".agent");
      }
    } catch {
      // no package.json here, keep walking
    }
    dir = path.dirname(dir);
  }

  return path.resolve(".agent");
}

export const defaultAgentSchema: AgentSchema = {
  identity: {
    name: "chatOS",
    description:
      "An AI-powered assistant that can help with tasks, answer questions, and create documents.",
    version: "0.1.0",
  },
  capabilities: [
    {
      name: "weather",
      description: "Get current weather for any location",
    },
    {
      name: "createDocument",
      description: "Create text, code, image, or spreadsheet documents",
      platforms: ["web"],
    },
    {
      name: "updateDocument",
      description: "Update existing documents with targeted or full rewrites",
      platforms: ["web"],
    },
  ],
  defaultModel: "anthropic/claude-sonnet-4.5",
  systemPromptTemplate: `You are {{name}}, {{description}}

{{#capabilities}}
You have the following capabilities:
{{capabilities}}
{{/capabilities}}

{{#memory}}
Things you remember about this user:
{{memory}}
{{/memory}}

Keep your responses concise and helpful. When asked to write, create, or help with something, just do it directly.`,
};
