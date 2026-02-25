/**
 * Canonical path conventions for the agent filesystem.
 *
 * ```
 * .agent/
 *   schema.json
 *   sessions/{sessionId}/meta.json
 *   sessions/{sessionId}/messages/{messageId}.json
 *   memory/{id}.json
 *   observations/{id}.json
 * ```
 */
export const AgentPaths = {
  schema: "schema.json",

  sessionMeta: (sessionId: string) => `sessions/${sessionId}/meta.json`,
  sessionsPrefix: "sessions/",

  message: (sessionId: string, messageId: string) =>
    `sessions/${sessionId}/messages/${messageId}.json`,
  messagesPrefix: (sessionId: string) => `sessions/${sessionId}/messages/`,

  memory: (id: string) => `memory/${id}.json`,
  memoryPrefix: "memory/",

  observation: (id: string) => `observations/${id}.json`,
  observationsPrefix: "observations/",
} as const;
