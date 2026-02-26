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
  const session = await store.getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = await store.getMessages(id);
  return NextResponse.json({ session, messages });
}
