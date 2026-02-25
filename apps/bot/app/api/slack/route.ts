import { gateway } from "@ai-sdk/gateway";
import { DEFAULT_CHAT_MODEL, systemPrompt } from "@chatos/ai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

// Slack URL verification
async function handleUrlVerification(body: { challenge: string }) {
  return NextResponse.json({ challenge: body.challenge });
}

// Process incoming Slack events
async function handleEvent(event: {
  type: string;
  text?: string;
  channel?: string;
  user?: string;
  thread_ts?: string;
  ts?: string;
}) {
  if (event.type !== "message" && event.type !== "app_mention") {
    return;
  }

  const text = event.text?.replace(/<@[A-Z0-9]+>/g, "").trim();
  if (!text) return;

  const { text: response } = await generateText({
    model: gateway(DEFAULT_CHAT_MODEL),
    system: systemPrompt({ selectedChatModel: DEFAULT_CHAT_MODEL }),
    prompt: text,
  });

  // Post reply to Slack
  const slackToken = process.env.SLACK_BOT_TOKEN;
  if (!slackToken) {
    console.error("SLACK_BOT_TOKEN not configured");
    return;
  }

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${slackToken}`,
    },
    body: JSON.stringify({
      channel: event.channel,
      text: response,
      thread_ts: event.thread_ts || event.ts,
    }),
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return handleUrlVerification(body);
  }

  // Verify request is from Slack
  // TODO: Implement proper Slack signature verification with SLACK_SIGNING_SECRET

  // Handle event
  if (body.event) {
    // Process asynchronously to respond within 3s
    handleEvent(body.event).catch((err) => {
      console.error("Error handling Slack event:", err);
    });
  }

  return NextResponse.json({ ok: true });
}
