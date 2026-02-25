/**
 * Builds the Elysia app without listening and exports the OpenAPI JSON spec.
 * Usage: bun src/openapi/spec-export.ts > openapi.json
 */

import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { healthRoutes } from "../routes/health";
import { slackRoutes } from "../routes/slack";

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
  .use(slackRoutes);

// Generate the spec by calling the routes handler directly
const response = await app.handle(new Request("http://localhost/openapi/json"));
const spec = await response.json();
console.log(JSON.stringify(spec, null, 2));
