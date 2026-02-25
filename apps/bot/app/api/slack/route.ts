import { after } from "next/server";
import { getBot } from "@/lib/bot";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const bot = getBot();
  return bot.webhooks.slack(request, {
    waitUntil: (task) => after(() => task),
  });
}
