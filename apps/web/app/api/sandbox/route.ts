import { countActiveSandboxesByOrg, countSnapshottedSandboxesByOrg, listSandboxesByOrg } from "@chatos/db";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// TODO(BRO-261): replace with real org from Better Auth session
const DEFAULT_ORG = process.env.DEFAULT_ORG_ID ?? "default";

export async function GET() {
  try {
    const [sandboxes, active, snapshotted] = await Promise.all([
      listSandboxesByOrg(db, DEFAULT_ORG),
      countActiveSandboxesByOrg(db, DEFAULT_ORG),
      countSnapshottedSandboxesByOrg(db, DEFAULT_ORG),
    ]);
    return NextResponse.json({ sandboxes, metrics: { active, snapshotted, total: sandboxes.length } });
  } catch (err) {
    console.error("[api/sandbox] GET failed", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
