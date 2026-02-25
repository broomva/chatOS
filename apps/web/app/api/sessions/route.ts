import { AgentStateStore, LocalStorageBackend, VercelBlobBackend } from "@chatos/state";
import { NextResponse } from "next/server";

const AGENT_ID = "chatos-web";

function createStore(): AgentStateStore {
  const isVercel = !!process.env.VERCEL;
  const backend = isVercel
    ? new VercelBlobBackend(".agent/")
    : new LocalStorageBackend(process.env.AGENT_STATE_DIR ?? ".agent");
  return new AgentStateStore(backend);
}

const store = createStore();

export async function GET() {
  const sessions = await store.listSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const session = await store.createSession({
    agentId: AGENT_ID,
    userId: body.userId,
    platform: "web",
    title: body.title,
    mode: "active",
    visibility: body.visibility ?? "private",
  });
  return NextResponse.json(session, { status: 201 });
}
