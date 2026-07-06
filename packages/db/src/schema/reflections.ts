import {
  index,
  pgEnum,
  pgTable,
  text,
  uuid
} from "drizzle-orm/pg-core";

import {
  createdAtColumn,
  jsonObjectColumn,
  metadataColumn,
  updatedAtColumn
} from "./columns.js";
import {
  executionRunIdColumn,
  requiredProjectIdColumn,
  taskContractIdColumn
} from "./reference-columns.js";

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
    projectId: requiredProjectIdColumn(),
    executionRunId: executionRunIdColumn(),
    taskContractId: taskContractIdColumn(),
    status: reflectionStatus("status").notNull().default("candidate"),
    summary: text("summary").notNull(),
    scope: jsonObjectColumn("scope"),
    input: jsonObjectColumn("input"),
    output: jsonObjectColumn("output"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("reflection_records_project_id_idx").on(table.projectId),
    index("reflection_records_execution_run_id_idx").on(table.executionRunId),
    index("reflection_records_task_contract_id_idx").on(table.taskContractId),
    index("reflection_records_status_idx").on(table.status),
    index("reflection_records_created_at_idx").on(table.createdAt)
  ]
);
