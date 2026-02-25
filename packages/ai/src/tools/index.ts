import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the current weather at a location",
  inputSchema: z.object({
    latitude: z.number().describe("Latitude"),
    longitude: z.number().describe("Longitude"),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=celsius`,
    );
    const data = await response.json();
    return {
      temperature: data.current?.temperature_2m,
      unit: "celsius",
    };
  },
});

export const createDocumentTool = tool({
  description: "Create a new document artifact",
  inputSchema: z.object({
    title: z.string().describe("Title of the document"),
    kind: z.enum(["text", "code", "image", "sheet"]).describe("Type of document"),
  }),
});

export const updateDocumentTool = tool({
  description: "Update an existing document artifact",
  inputSchema: z.object({
    id: z.string().describe("ID of the document to update"),
    description: z.string().describe("Description of changes to make"),
  }),
});

export const requestSuggestionsTool = tool({
  description: "Request suggestions for improving a document",
  inputSchema: z.object({
    documentId: z.string().describe("ID of the document"),
  }),
});
