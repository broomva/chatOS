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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = await store.getPrompt(id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prompt);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await store.updatePrompt(id, {
    title: body.title,
    content: body.content,
    description: body.description,
    tags: body.tags,
    visibility: body.visibility,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await store.deletePrompt(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
