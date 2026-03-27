import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { chat, document, message, sandboxEvent, sandboxInstance, sandboxSnapshot, stream, user, vote } from "./schema";

export type Database = PostgresJsDatabase;

// ─── Users ──────────────────────────────────────────
export async function getUserByEmail(db: Database, email: string) {
  const [result] = await db.select().from(user).where(eq(user.email, email));
  return result;
}

export async function createUser(db: Database, data: { email: string; password: string }) {
  const [result] = await db.insert(user).values(data).returning();
  return result;
}

// ─── Chats ──────────────────────────────────────────
export async function getChatsByUserId(db: Database, userId: string) {
  return db.select().from(chat).where(eq(chat.userId, userId)).orderBy(desc(chat.createdAt));
}

export async function getChatById(db: Database, chatId: string) {
  const [result] = await db.select().from(chat).where(eq(chat.id, chatId));
  return result;
}

export async function createChat(
  db: Database,
  data: { id: string; userId: string; title: string },
) {
  const [result] = await db
    .insert(chat)
    .values({ ...data, createdAt: new Date() })
    .returning();
  return result;
}

export async function updateChatTitle(db: Database, chatId: string, title: string) {
  await db.update(chat).set({ title }).where(eq(chat.id, chatId));
}

export async function updateChatVisibility(
  db: Database,
  chatId: string,
  visibility: "public" | "private",
) {
  await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
}

export async function deleteChat(db: Database, chatId: string) {
  await db.delete(vote).where(eq(vote.chatId, chatId));
  await db.delete(message).where(eq(message.chatId, chatId));
  await db.delete(stream).where(eq(stream.chatId, chatId));
  await db.delete(chat).where(eq(chat.id, chatId));
}

// ─── Messages ───────────────────────────────────────
export async function getMessagesByChatId(db: Database, chatId: string) {
  return db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));
}

export async function createMessage(
  db: Database,
  data: {
    id: string;
    chatId: string;
    role: string;
    parts: unknown;
    attachments: unknown;
  },
) {
  const [result] = await db
    .insert(message)
    .values({ ...data, createdAt: new Date() })
    .returning();
  return result;
}

// ─── Votes ──────────────────────────────────────────
export async function getVotesByChatId(db: Database, chatId: string) {
  return db.select().from(vote).where(eq(vote.chatId, chatId));
}

export async function upsertVote(
  db: Database,
  data: { chatId: string; messageId: string; isUpvoted: boolean },
) {
  const [existing] = await db
    .select()
    .from(vote)
    .where(and(eq(vote.chatId, data.chatId), eq(vote.messageId, data.messageId)));

  if (existing) {
    await db
      .update(vote)
      .set({ isUpvoted: data.isUpvoted })
      .where(and(eq(vote.chatId, data.chatId), eq(vote.messageId, data.messageId)));
  } else {
    await db.insert(vote).values(data);
  }
}

// ─── Documents ──────────────────────────────────────
export async function getDocumentById(db: Database, documentId: string) {
  const [result] = await db
    .select()
    .from(document)
    .where(eq(document.id, documentId))
    .orderBy(desc(document.createdAt))
    .limit(1);
  return result;
}

export async function createDocument(
  db: Database,
  data: { id: string; title: string; kind: string; userId: string; content?: string },
) {
  const [result] = await db
    .insert(document)
    .values({ ...data, createdAt: new Date() } as typeof document.$inferInsert)
    .returning();
  return result;
}

// ─── Streams ────────────────────────────────────────
export async function getStreamById(db: Database, streamId: string) {
  const [result] = await db.select().from(stream).where(eq(stream.id, streamId));
  return result;
}

export async function createStream(db: Database, data: { id: string; chatId: string }) {
  const [result] = await db
    .insert(stream)
    .values({ ...data, createdAt: new Date() })
    .returning();
  return result;
}

export async function deleteStream(db: Database, streamId: string) {
  await db.delete(stream).where(eq(stream.id, streamId));
}

// ─── Sandboxes ───────────────────────────────────────

export async function listSandboxesByOrg(db: Database, organizationId: string) {
  return db
    .select()
    .from(sandboxInstance)
    .where(eq(sandboxInstance.organizationId, organizationId))
    .orderBy(desc(sandboxInstance.createdAt));
}

export async function getSandboxById(db: Database, sandboxId: string) {
  const [instance] = await db
    .select()
    .from(sandboxInstance)
    .where(eq(sandboxInstance.sandboxId, sandboxId));
  return instance;
}

export async function getSandboxSnapshots(db: Database, sandboxId: string) {
  return db
    .select()
    .from(sandboxSnapshot)
    .where(eq(sandboxSnapshot.sandboxId, sandboxId))
    .orderBy(desc(sandboxSnapshot.createdAt));
}

export async function getSandboxRecentEvents(db: Database, sandboxId: string, limit = 20) {
  return db
    .select()
    .from(sandboxEvent)
    .where(eq(sandboxEvent.sandboxId, sandboxId))
    .orderBy(desc(sandboxEvent.occurredAt))
    .limit(limit);
}

export async function markSandboxDestroyed(db: Database, sandboxId: string) {
  await db
    .update(sandboxInstance)
    .set({ status: "stopped", destroyedAt: new Date() })
    .where(and(eq(sandboxInstance.sandboxId, sandboxId), isNull(sandboxInstance.destroyedAt)));
}

export async function insertSandboxSnapshot(
  db: Database,
  data: { sandboxId: string; snapshotId: string; trigger: string },
) {
  await db.update(sandboxInstance).set({ status: "snapshotted" }).where(eq(sandboxInstance.sandboxId, data.sandboxId));
  const [result] = await db
    .insert(sandboxSnapshot)
    .values({ ...data, createdAt: new Date() })
    .returning();
  return result;
}

export async function countActiveSandboxesByOrg(db: Database, organizationId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sandboxInstance)
    .where(and(eq(sandboxInstance.organizationId, organizationId), eq(sandboxInstance.status, "running")));
  return row?.count ?? 0;
}

export async function countSnapshottedSandboxesByOrg(db: Database, organizationId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sandboxInstance)
    .where(and(eq(sandboxInstance.organizationId, organizationId), eq(sandboxInstance.status, "snapshotted")));
  return row?.count ?? 0;
}
