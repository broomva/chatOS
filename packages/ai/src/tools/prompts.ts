import { tool } from "ai";
import { z } from "zod";

export const listPromptsTool = tool({
  description:
    "List the user's saved prompt templates. Use this when the user asks to see their prompts, find a prompt, or wants to use a saved prompt. Returns id, title, description, and tags for each prompt.",
  inputSchema: z.object({
    tag: z.string().optional().describe("Filter prompts by tag"),
    search: z.string().optional().describe("Search term to filter by title or description"),
  }),
});

export const getPromptTool = tool({
  description:
    "Get the full content of a saved prompt template by ID. Use this after listing prompts to retrieve the actual prompt text so you can apply it.",
  inputSchema: z.object({
    id: z.string().describe("The prompt template ID"),
  }),
});

export const savePromptTool = tool({
  description:
    "Save a new prompt template or update an existing one. Use this when the user wants to save a prompt for reuse, or when they say 'save this as a prompt' or 'remember this prompt'.",
  inputSchema: z.object({
    id: z.string().optional().describe("If updating an existing prompt, pass its ID"),
    title: z.string().describe("Short descriptive title for the prompt"),
    content: z.string().describe("The full prompt text"),
    description: z.string().optional().describe("Brief description of what this prompt does"),
    tags: z.array(z.string()).optional().describe("Tags for categorizing the prompt"),
  }),
});

export const deletePromptTool = tool({
  description:
    "Delete a saved prompt template by ID. Use when the user explicitly asks to remove a prompt.",
  inputSchema: z.object({
    id: z.string().describe("The prompt template ID to delete"),
  }),
});
