-- Migration: sandbox metadata tables (BRO-257)
-- Adds three tables to persist sandbox lifecycle events from SandboxService (BRO-253).

-- sandbox_instances: live state of each sandbox, keyed by provider sandbox_id
CREATE TABLE IF NOT EXISTS "sandbox_instances" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sandbox_id"      TEXT    NOT NULL UNIQUE,
    "agent_id"        TEXT    NOT NULL,
    "session_id"      TEXT    NOT NULL,
    "organization_id" TEXT    NOT NULL,
    "provider"        TEXT    NOT NULL,
    "status"          TEXT    NOT NULL,
    "image"           TEXT,
    "vcpus"           INTEGER NOT NULL DEFAULT 1,
    "memory_mb"       INTEGER NOT NULL DEFAULT 512,
    "persistence"     TEXT    NOT NULL DEFAULT 'ephemeral',
    "labels"          JSONB   NOT NULL DEFAULT '{}',
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "last_exec_at"    TIMESTAMPTZ,
    "destroyed_at"    TIMESTAMPTZ,
    "metadata"        JSONB   NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS "sandbox_instances_agent_id_idx"
    ON "sandbox_instances" ("agent_id");
CREATE INDEX IF NOT EXISTS "sandbox_instances_session_id_idx"
    ON "sandbox_instances" ("session_id");
CREATE INDEX IF NOT EXISTS "sandbox_instances_org_status_idx"
    ON "sandbox_instances" ("organization_id", "status");

-- sandbox_snapshots: immutable log of each snapshot taken
CREATE TABLE IF NOT EXISTS "sandbox_snapshots" (
    "id"          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    "sandbox_id"  TEXT    NOT NULL REFERENCES "sandbox_instances" ("sandbox_id"),
    "snapshot_id" TEXT    NOT NULL,
    "trigger"     TEXT    NOT NULL,
    "size_bytes"  BIGINT,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "sandbox_snapshots_sandbox_id_idx"
    ON "sandbox_snapshots" ("sandbox_id");

-- sandbox_events: full audit trail of lifecycle transitions
CREATE TABLE IF NOT EXISTS "sandbox_events" (
    "id"              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    "sandbox_id"      TEXT    NOT NULL,
    "agent_id"        TEXT    NOT NULL,
    "session_id"      TEXT    NOT NULL,
    "organization_id" TEXT    NOT NULL,
    "provider"        TEXT    NOT NULL,
    "event_kind"      TEXT    NOT NULL,
    "exit_code"       INTEGER,
    "duration_ms"     BIGINT,
    "snapshot_id"     TEXT,
    "error_message"   TEXT,
    "occurred_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "sandbox_events_agent_occurred_idx"
    ON "sandbox_events" ("agent_id", "occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "sandbox_events_session_id_idx"
    ON "sandbox_events" ("session_id");
CREATE INDEX IF NOT EXISTS "sandbox_events_org_occurred_idx"
    ON "sandbox_events" ("organization_id", "occurred_at" DESC);
