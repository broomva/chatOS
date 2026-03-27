import type { InferSelectModel } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: varchar("name", { length: 128 }),
  image: text("image"),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  }),
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("kind", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  }),
);

export type Document = InferSelectModel<typeof document>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// ── Sandbox metadata (BRO-257) ───────────────────────────────────────────────

/** Live state of a sandbox instance, keyed by provider-assigned sandbox_id. */
export const sandboxInstance = pgTable(
  "sandbox_instances",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    /** Provider-assigned sandbox ID (opaque string). */
    sandboxId: text("sandbox_id").notNull().unique(),
    agentId: text("agent_id").notNull(),
    sessionId: text("session_id").notNull(),
    organizationId: text("organization_id").notNull(),
    /** Provider name: "vercel" | "e2b" | "local" | "bubblewrap" */
    provider: text("provider").notNull(),
    /** Lifecycle status: "starting" | "running" | "snapshotted" | "stopped" | "failed" */
    status: text("status").notNull(),
    image: text("image"),
    vcpus: integer("vcpus").notNull().default(1),
    memoryMb: integer("memory_mb").notNull().default(512),
    /** Persistence policy: "ephemeral" | "persistent" | "manual_snapshot" */
    persistence: text("persistence").notNull().default("ephemeral"),
    /** Arbitrary labels from SandboxSpec (JSON object). */
    labels: jsonb("labels").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastExecAt: timestamp("last_exec_at", { withTimezone: true }),
    destroyedAt: timestamp("destroyed_at", { withTimezone: true }),
    /** Provider-specific opaque metadata (JSON). */
    metadata: jsonb("metadata").notNull().default({}),
  },
  (table) => [
    index("sandbox_instances_agent_id_idx").on(table.agentId),
    index("sandbox_instances_session_id_idx").on(table.sessionId),
    index("sandbox_instances_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export type SandboxInstance = InferSelectModel<typeof sandboxInstance>;

/** Immutable append-only log of every snapshot taken. */
export const sandboxSnapshot = pgTable(
  "sandbox_snapshots",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    sandboxId: text("sandbox_id")
      .notNull()
      .references(() => sandboxInstance.sandboxId),
    /** Provider-assigned snapshot ID. */
    snapshotId: text("snapshot_id").notNull(),
    /** What triggered the snapshot: "idle_reaper" | "manual" | "session_end" */
    trigger: text("trigger").notNull(),
    /** Snapshot size in bytes (populated when provider returns it). */
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sandbox_snapshots_sandbox_id_idx").on(table.sandboxId)],
);

export type SandboxSnapshot = InferSelectModel<typeof sandboxSnapshot>;

/** Full audit trail of all sandbox lifecycle transitions. */
export const sandboxEvent = pgTable(
  "sandbox_events",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    sandboxId: text("sandbox_id").notNull(),
    agentId: text("agent_id").notNull(),
    sessionId: text("session_id").notNull(),
    organizationId: text("organization_id").notNull(),
    provider: text("provider").notNull(),
    /** SandboxEventKind variant: "created" | "started" | "exec_completed" | etc. */
    eventKind: text("event_kind").notNull(),
    /** Populated for ExecCompleted events. */
    exitCode: integer("exit_code"),
    /** Wall-clock ms for ExecCompleted events. */
    durationMs: bigint("duration_ms", { mode: "number" }),
    /** Populated for Snapshotted and Resumed events. */
    snapshotId: text("snapshot_id"),
    /** Populated for Failed events. */
    errorMessage: text("error_message"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sandbox_events_agent_occurred_idx").on(
      table.agentId,
      table.occurredAt,
    ),
    index("sandbox_events_session_id_idx").on(table.sessionId),
    index("sandbox_events_org_occurred_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
  ],
);

export type SandboxEvent = InferSelectModel<typeof sandboxEvent>;
