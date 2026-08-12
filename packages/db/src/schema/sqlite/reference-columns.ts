// fallow-ignore-file code-duplication -- SQLite deliberately mirrors the governed PostgreSQL domain schema while retaining dialect-bound builders and types
import { uuid } from "./dialect.js";

import {
  executionRuns,
  projects,
  taskContracts,
  workspaces
} from "./harness.js";

export const requiredProjectIdColumn = () =>
  uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" });

export const nullableProjectIdColumn = () =>
  uuid("project_id").references(() => projects.id, { onDelete: "set null" });

export const nullableCascadeProjectIdColumn = () =>
  uuid("project_id").references(() => projects.id, { onDelete: "cascade" });

export const executionRunIdColumn = () =>
  uuid("execution_run_id").references(() => executionRuns.id, {
    onDelete: "set null"
  });

export const taskContractIdColumn = () =>
  uuid("task_contract_id").references(() => taskContracts.id, {
    onDelete: "set null"
  });

export const workspaceIdColumn = () =>
  uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" });
