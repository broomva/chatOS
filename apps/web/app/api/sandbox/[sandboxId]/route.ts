import {
  getSandboxById,
  getSandboxRecentEvents,
  getSandboxSnapshots,
  markSandboxDestroyed,
} from "@chatos/db";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ sandboxId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { sandboxId } = await params;
  try {
    const [sandbox, snapshots, recentEvents] = await Promise.all([
      getSandboxById(db, sandboxId),
      getSandboxSnapshots(db, sandboxId),
      getSandboxRecentEvents(db, sandboxId),
    ]);
    if (!sandbox) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ sandbox, snapshots, recentEvents });
  } catch (err) {
    console.error("[api/sandbox/:id] GET failed", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { sandboxId } = await params;
  try {
    const sandbox = await getSandboxById(db, sandboxId);
    if (!sandbox) return NextResponse.json({ error: "not found" }, { status: 404 });
    await markSandboxDestroyed(db, sandboxId);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[api/sandbox/:id] DELETE failed", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
