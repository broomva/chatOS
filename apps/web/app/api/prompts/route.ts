import {
  AgentStateStore,
  LocalStorageBackend,
  resolveStateDir,
  VercelBlobBackend,
} from "@chatos/state";
import { NextResponse } from "next/server";

function createStore(): AgentStateStore {
  const isVercel = !!process.env.VERCEL;
  const backend = isVercel
    ? new VercelBlobBackend(".agent/")
    : new LocalStorageBackend(resolveStateDir());
  return new AgentStateStore(backend);
}

const store = createStore();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const prompts = await store.listPrompts({ tag, userId });
  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = await store.createPrompt({
    userId: body.userId,
    title: body.title,
    content: body.content,
    description: body.description,
    tags: body.tags,
    visibility: body.visibility ?? "private",
  });
  return NextResponse.json(prompt, { status: 201 });
}
