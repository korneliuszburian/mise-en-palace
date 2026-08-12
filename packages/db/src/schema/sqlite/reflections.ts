import {
  index,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";
import { reflectionStatuses } from "@krn/core";

import {
  enumChecks,
  sqliteEnum,
  sqliteUuidDefault,
  uuid
} from "./dialect.js";

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

export const reflectionStatus = sqliteEnum("reflection_status", reflectionStatuses);

export const reflectionRecords = sqliteTable(
  "reflection_records",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
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
    ...enumChecks("reflection_records", table),
    index("reflection_records_project_id_idx").on(table.projectId),
    index("reflection_records_execution_run_id_idx").on(table.executionRunId),
    index("reflection_records_task_contract_id_idx").on(table.taskContractId),
    index("reflection_records_status_idx").on(table.status),
    index("reflection_records_created_at_idx").on(table.createdAt)
  ]
);
