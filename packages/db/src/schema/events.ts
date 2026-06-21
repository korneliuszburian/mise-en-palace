import { sql } from "drizzle-orm/sql";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import { executionRuns } from "./harness.js";

type JsonObject = Record<string, unknown>;

const emptyJsonObject = sql`'{}'::jsonb`;

export const runEventSeverity = pgEnum("run_event_severity", [
  "debug",
  "info",
  "warning",
  "error"
]);

export const outboxEventStatus = pgEnum("outbox_event_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "dead_letter"
]);

export const workerJobStatus = pgEnum("worker_job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "dead_letter",
  "cancelled"
]);

export const runEvents = pgTable(
  "run_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    sequence: integer("sequence").notNull(),
    type: text("type").notNull(),
    severity: runEventSeverity("severity").notNull().default("info"),
    message: text("message").notNull(),
    payload: jsonb("payload").$type<JsonObject>().notNull().default(emptyJsonObject),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("run_events_execution_run_id_idx").on(table.executionRunId),
    index("run_events_type_idx").on(table.type),
    index("run_events_occurred_at_idx").on(table.occurredAt),
    uniqueIndex("run_events_execution_sequence_unique").on(table.executionRunId, table.sequence)
  ]
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topic: text("topic").notNull(),
    status: outboxEventStatus("status").notNull().default("pending"),
    payload: jsonb("payload").$type<JsonObject>().notNull().default(emptyJsonObject),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("outbox_events_topic_idx").on(table.topic),
    index("outbox_events_status_available_at_idx").on(table.status, table.availableAt)
  ]
);

export const workerJobs = pgTable(
  "worker_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    status: workerJobStatus("status").notNull().default("queued"),
    payload: jsonb("payload").$type<JsonObject>().notNull().default(emptyJsonObject),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("worker_jobs_type_idx").on(table.type),
    index("worker_jobs_status_available_at_idx").on(table.status, table.availableAt)
  ]
);
