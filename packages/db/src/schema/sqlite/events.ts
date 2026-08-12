// fallow-ignore-file code-duplication -- SQLite deliberately mirrors the governed PostgreSQL domain schema while retaining dialect-bound builders and types
import { sql } from "drizzle-orm/sql";
import {
  maintenanceQueueStatuses
} from "@krn/core";
import {
  outboxEventStatuses,
  runEventSeverities
} from "@krn/core/repositories";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

import {
  enumChecks,
  sqliteEnum,
  sqliteNow,
  sqliteUuidDefault,
  timestamp,
  uuid
} from "./dialect.js";

import {
  createdAtColumn,
  jsonObjectColumn,
  updatedAtColumn
} from "./columns.js";
import { executionRuns } from "./harness.js";

const attemptsColumn = () => integer("attempts").notNull().default(0);
const availableAtColumn = () =>
  timestamp("available_at", { withTimezone: true }).notNull().default(sqliteNow);
const runAfterColumn = () =>
  timestamp("run_after", { withTimezone: true }).notNull().default(sqliteNow);
const lockedAtColumn = () => timestamp("locked_at", { withTimezone: true });
const lockedByColumn = () => text("locked_by");
const lastErrorColumn = () => text("last_error");

export const runEventSeverity = sqliteEnum("run_event_severity", runEventSeverities);

export const outboxEventStatus = sqliteEnum("outbox_event_status", outboxEventStatuses);

export const maintenanceQueueStatus = sqliteEnum(
  "maintenance_queue_status",
  maintenanceQueueStatuses
);

export const runEvents = sqliteTable(
  "run_events",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    sequence: integer("sequence").notNull(),
    type: text("type").notNull(),
    severity: runEventSeverity("severity").notNull().default("info"),
    message: text("message").notNull(),
    payload: jsonObjectColumn("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().default(sqliteNow)
  },
  (table) => [
    ...enumChecks("run_events", table),
    index("run_events_execution_run_id_idx").on(table.executionRunId),
    index("run_events_type_idx").on(table.type),
    index("run_events_occurred_at_idx").on(table.occurredAt),
    uniqueIndex("run_events_execution_sequence_unique").on(table.executionRunId, table.sequence)
  ]
);

export const outboxEvents = sqliteTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    topic: text("topic").notNull(),
    status: outboxEventStatus("status").notNull().default("pending"),
    payload: jsonObjectColumn("payload"),
    attempts: attemptsColumn(),
    availableAt: availableAtColumn(),
    lockedAt: lockedAtColumn(),
    lockedBy: lockedByColumn(),
    lastError: lastErrorColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("outbox_events", table),
    index("outbox_events_topic_idx").on(table.topic),
    index("outbox_events_status_available_at_idx").on(table.status, table.availableAt)
  ]
);

export const maintenanceQueues = sqliteTable(
  "maintenance_queue_records",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    jobType: text("job_type").notNull(),
    queueKey: text("queue_key").notNull(),
    status: maintenanceQueueStatus("status").notNull().default("queued"),
    payload: jsonObjectColumn("payload"),
    attempts: attemptsColumn(),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAfter: runAfterColumn(),
    lockedAt: lockedAtColumn(),
    lockedBy: lockedByColumn(),
    lastError: lastErrorColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("maintenance_queue_records", table),
    index("maintenance_queue_records_job_type_idx").on(table.jobType),
    uniqueIndex("maintenance_queue_records_queue_key_unique").on(table.queueKey),
    index("maintenance_queue_records_status_run_after_idx").on(table.status, table.runAfter),
    check(
      "maintenance_queue_records_queue_key_non_empty",
      sql`length(trim(${table.queueKey})) > 0`
    )
  ]
);
