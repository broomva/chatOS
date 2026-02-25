import { Elysia, t } from "elysia";

export const healthRoutes = new Elysia()
  .get("/health", () => ({ status: "ok" as const }), {
    response: t.Object({ status: t.Literal("ok") }),
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns 200 if the bot service is running.",
    },
  })
  .get(
    "/status",
    () => ({
      service: "chatos-bot",
      version: "0.1.0",
      uptime: process.uptime(),
      platforms: ["slack"],
    }),
    {
      response: t.Object({
        service: t.String(),
        version: t.String(),
        uptime: t.Number(),
        platforms: t.Array(t.String()),
      }),
      detail: {
        tags: ["Health"],
        summary: "Service status",
        description: "Returns detailed service status including uptime and supported platforms.",
      },
    },
  );
