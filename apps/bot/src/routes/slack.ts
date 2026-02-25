import { Elysia } from "elysia";
import { getBot } from "../bot";

export const slackRoutes = new Elysia({ prefix: "/webhooks" }).post(
  "/slack",
  async (context) => {
    const bot = getBot();
    // Pass the raw request so the Chat SDK can verify Slack signatures
    const response = await bot.webhooks.slack(context.request, {
      waitUntil: (task) => {
        // Bun is long-running, fire-and-forget is fine
        task.catch((err) => console.error("[slack webhook]", err));
      },
    });
    return response;
  },
  {
    // Prevent Elysia from consuming the body — Chat SDK needs the raw stream
    // for HMAC signature verification
    type: "none",
    detail: {
      tags: ["Webhooks"],
      summary: "Slack event webhook",
      description:
        "Receives Slack events (messages, mentions, reactions) and processes them through the Chat SDK. Slack sends verification challenges and event payloads to this endpoint.",
      responses: {
        200: { description: "Event processed successfully" },
        401: { description: "Invalid Slack signature" },
      },
    },
  },
);
