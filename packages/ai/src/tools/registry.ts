/**
 * Tool Registry — structured tool registration with Zod validation.
 *
 * Inspired by pi-mono's tool system. Provides a central registry where tools
 * are registered with typed schemas, then converted to AI SDK format for use
 * with `streamText()` / `generateText()`.
 *
 * Benefits over inline tool definitions:
 * - Discoverable: `registry.list()` returns all registered tools
 * - Validated: Zod schemas enforce argument types at registration time
 * - Convertible: `toAISDKTools()` bridges to the AI SDK `tool()` format
 * - Extensible: new tools can be registered at runtime (plugins, user-defined)
 */

import { tool } from "ai";
import type { z } from "zod";

export type ToolContext = {
  sessionId: string;
  agentId: string;
  platform: string;
};

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export interface AgentTool<T = unknown> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  execute: (args: T, ctx: ToolContext) => Promise<ToolResult>;
}

export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  /** Register a tool. Throws if a tool with the same name already exists. */
  register<T>(agentTool: AgentTool<T>): void {
    if (this.tools.has(agentTool.name)) {
      throw new Error(`Tool "${agentTool.name}" is already registered`);
    }
    this.tools.set(agentTool.name, agentTool as AgentTool);
  }

  /** Unregister a tool by name. Returns true if removed, false if not found. */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /** Get a tool by name. */
  get<T = unknown>(name: string): AgentTool<T> | undefined {
    return this.tools.get(name) as AgentTool<T> | undefined;
  }

  /** List all registered tools. */
  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /** Check if a tool is registered. */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Number of registered tools. */
  get size(): number {
    return this.tools.size;
  }

  /**
   * Convert all registered tools to AI SDK `tool()` format.
   *
   * Returns an object suitable for passing as `tools` to `streamText()`:
   * ```ts
   * const result = streamText({
   *   model: gateway(modelId),
   *   tools: registry.toAISDKTools(ctx),
   * });
   * ```
   */
  toAISDKTools(ctx: ToolContext): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, agentTool] of this.tools) {
      const wrappedExecute = async (args: unknown) => {
        const toolResult = await agentTool.execute(args, ctx);
        if (!toolResult.success && toolResult.error) {
          return { error: toolResult.error };
        }
        return toolResult.data ?? { success: true };
      };

      result[name] = tool({
        description: agentTool.description,
        inputSchema: agentTool.schema,
        execute: wrappedExecute as never,
      });
    }
    return result;
  }
}
