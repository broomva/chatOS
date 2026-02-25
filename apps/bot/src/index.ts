import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health";
import { slackRoutes } from "./routes/slack";

const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          title: "chatOS Bot API",
          version: "0.1.0",
          description:
            "Multi-platform AI bot service. Receives webhook events from messaging platforms and responds using AI models via the Vercel AI Gateway.",
        },
        tags: [
          { name: "Webhooks", description: "Platform webhook endpoints" },
          { name: "Health", description: "Service health and status" },
        ],
      },
    }),
  )
  .use(healthRoutes)
  .use(slackRoutes)
  .listen(3001);

console.log(`chatOS Bot running at http://localhost:${app.server?.port}`);

export type App = typeof app;
