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
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import {
  createdAtColumn,
  jsonObjectColumn,
  updatedAtColumn
} from "./columns.js";
import { executionRuns } from "./harness.js";

const attemptsColumn = () => integer("attempts").notNull().default(0);
const availableAtColumn = () =>
  timestamp("available_at", { withTimezone: true }).notNull().defaultNow();
const runAfterColumn = () =>
  timestamp("run_after", { withTimezone: true }).notNull().defaultNow();
const lockedAtColumn = () => timestamp("locked_at", { withTimezone: true });
const lockedByColumn = () => text("locked_by");
const lastErrorColumn = () => text("last_error");

export const runEventSeverity = pgEnum("run_event_severity", runEventSeverities);

export const outboxEventStatus = pgEnum("outbox_event_status", outboxEventStatuses);

export const maintenanceQueueStatus = pgEnum(
  "maintenance_queue_status",
  maintenanceQueueStatuses
);

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
    payload: jsonObjectColumn("payload"),
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
    index("outbox_events_topic_idx").on(table.topic),
    index("outbox_events_status_available_at_idx").on(table.status, table.availableAt)
  ]
);

export const maintenanceQueues = pgTable(
  "maintenance_queue_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    index("maintenance_queue_records_job_type_idx").on(table.jobType),
    uniqueIndex("maintenance_queue_records_queue_key_unique").on(table.queueKey),
    index("maintenance_queue_records_status_run_after_idx").on(table.status, table.runAfter),
    check(
      "maintenance_queue_records_queue_key_non_empty",
      sql`length(trim(${table.queueKey})) > 0`
    )
  ]
);
