import type { AgentSchema, MemoryItem } from "@chatos/types";

/**
 * Compile a system prompt from an AgentSchema, optionally enriched
 * with memory items and filtered by platform.
 */
export function compileSystemPrompt(
  schema: AgentSchema,
  memory?: MemoryItem[],
  platform?: string,
): string {
  // If there's a custom template, use it with interpolation
  if (schema.systemPromptTemplate) {
    return interpolateTemplate(schema, memory, platform);
  }

  // Otherwise build a structured prompt
  const lines: string[] = [];

  lines.push(`You are ${schema.identity.name}, ${schema.identity.description}`);
  lines.push("");

  // Filter capabilities by platform
  const caps = schema.capabilities.filter(
    (c) => !c.platforms || !platform || c.platforms.includes(platform),
  );

  if (caps.length > 0) {
    lines.push("You have the following capabilities:");
    for (const cap of caps) {
      lines.push(`- ${cap.name}: ${cap.description}`);
    }
    lines.push("");
  }

  if (memory && memory.length > 0) {
    lines.push("Things you remember about this user:");
    for (const item of memory) {
      lines.push(`- [${item.type}] ${item.content}`);
    }
    lines.push("");
  }

  lines.push(
    "Keep your responses concise and helpful. When asked to write, create, or help with something, just do it directly.",
  );

  return lines.join("\n");
}

function interpolateTemplate(
  schema: AgentSchema,
  memory?: MemoryItem[],
  platform?: string,
): string {
  let result = schema.systemPromptTemplate ?? "";

  // Simple interpolation
  result = result.replace(/\{\{name\}\}/g, schema.identity.name);
  result = result.replace(/\{\{description\}\}/g, schema.identity.description);
  result = result.replace(/\{\{version\}\}/g, schema.identity.version);

  // Capabilities block
  const caps = schema.capabilities.filter(
    (c) => !c.platforms || !platform || c.platforms.includes(platform),
  );
  const capsText = caps.map((c) => `- ${c.name}: ${c.description}`).join("\n");

  if (caps.length > 0) {
    result = result.replace(/\{\{#capabilities\}\}([\s\S]*?)\{\{\/capabilities\}\}/g, "$1");
    result = result.replace(/\{\{capabilities\}\}/g, capsText);
  } else {
    result = result.replace(/\{\{#capabilities\}\}[\s\S]*?\{\{\/capabilities\}\}/g, "");
  }

  // Memory block
  const memText = memory?.map((m) => `- [${m.type}] ${m.content}`).join("\n") ?? "";

  if (memory && memory.length > 0) {
    result = result.replace(/\{\{#memory\}\}([\s\S]*?)\{\{\/memory\}\}/g, "$1");
    result = result.replace(/\{\{memory\}\}/g, memText);
  } else {
    result = result.replace(/\{\{#memory\}\}[\s\S]*?\{\{\/memory\}\}/g, "");
  }

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  return result;
}
