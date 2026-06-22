import { sql } from "drizzle-orm/sql";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

import {
  executionRuns,
  projects,
  taskContracts
} from "./harness.js";

type JsonObject = Record<string, unknown>;

const emptyJsonObject = sql`'{}'::jsonb`;

export const reflectionStatus = pgEnum("reflection_status", [
  "candidate",
  "reviewed",
  "rejected",
  "superseded"
]);

export const reflectionRecords = pgTable(
  "reflection_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    taskContractId: uuid("task_contract_id").references(() => taskContracts.id, {
      onDelete: "set null"
    }),
    status: reflectionStatus("status").notNull().default("candidate"),
    summary: text("summary").notNull(),
    scope: jsonb("scope").$type<JsonObject>().notNull().default(emptyJsonObject),
    input: jsonb("input").$type<JsonObject>().notNull().default(emptyJsonObject),
    output: jsonb("output").$type<JsonObject>().notNull().default(emptyJsonObject),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("reflection_records_project_id_idx").on(table.projectId),
    index("reflection_records_execution_run_id_idx").on(table.executionRunId),
    index("reflection_records_task_contract_id_idx").on(table.taskContractId),
    index("reflection_records_status_idx").on(table.status),
    index("reflection_records_created_at_idx").on(table.createdAt)
  ]
);
