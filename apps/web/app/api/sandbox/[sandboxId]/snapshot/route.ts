import { getSandboxById, insertSandboxSnapshot } from "@chatos/db";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

type Params = { params: Promise<{ sandboxId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { sandboxId } = await params;
  try {
    const sandbox = await getSandboxById(db, sandboxId);
    if (!sandbox) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (sandbox.status !== "running") {
      return NextResponse.json({ error: "sandbox is not running" }, { status: 409 });
    }
    const snapshotId = `snap_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await insertSandboxSnapshot(db, { sandboxId, snapshotId, trigger: "manual" });
    return NextResponse.json({ snapshotId });
  } catch (err) {
    console.error("[api/sandbox/:id/snapshot] POST failed", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
