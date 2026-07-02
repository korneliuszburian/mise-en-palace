import {
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
  jsonListColumn,
  jsonObjectColumn,
  metadataColumn,
  updatedAtColumn
} from "./columns.js";

export const operatorIntentStatus = pgEnum("operator_intent_status", [
  "received",
  "contracted",
  "planned",
  "executed",
  "reviewed",
  "closed"
]);

export const taskContractStatus = pgEnum("task_contract_status", [
  "draft",
  "active",
  "superseded",
  "closed"
]);

export const harnessPlanStatus = pgEnum("harness_plan_status", [
  "draft",
  "ready",
  "running",
  "completed",
  "blocked"
]);

export const contextAssemblyStatus = pgEnum("context_assembly_status", [
  "assembled",
  "abstained",
  "stale",
  "superseded"
]);

export const executionRunStatus = pgEnum("execution_run_status", [
  "planned",
  "running",
  "succeeded",
  "failed",
  "blocked",
  "cancelled"
]);

export const evidenceBundleStatus = pgEnum("evidence_bundle_status", [
  "draft",
  "captured",
  "verified",
  "rejected"
]);

export const reviewAssessmentStatus = pgEnum("review_assessment_status", [
  "pending",
  "accepted",
  "changes_requested",
  "rejected"
]);

export const feedbackDeltaStatus = pgEnum("feedback_delta_status", [
  "candidate",
  "accepted",
  "rejected",
  "applied"
]);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique").on(table.slug)
  ]
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    uniqueIndex("projects_workspace_slug_unique").on(table.workspaceId, table.slug),
    index("projects_workspace_id_idx").on(table.workspaceId)
  ]
);

export const repoInstallations = pgTable(
  "repo_installations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    repoUrl: text("repo_url").notNull(),
    defaultBranch: text("default_branch").notNull(),
    repoFingerprint: text("repo_fingerprint"),
    localPathHint: text("local_path_hint"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("repo_installations_project_id_idx").on(table.projectId),
    index("repo_installations_local_path_hint_idx").on(table.localPathHint),
    uniqueIndex("repo_installations_repo_fingerprint_unique").on(table.repoFingerprint),
    uniqueIndex("repo_installations_project_repo_unique").on(table.projectId, table.repoUrl)
  ]
);

export const projectKernels = pgTable(
  "project_kernels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    summary: text("summary").notNull(),
    activeContextRule: text("active_context_rule").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("project_kernels_project_id_idx").on(table.projectId),
    uniqueIndex("project_kernels_project_version_unique").on(table.projectId, table.version)
  ]
);

export const operatorIntents = pgTable(
  "operator_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    source: text("source").notNull(),
    rawIntent: text("raw_intent").notNull(),
    normalizedIntent: text("normalized_intent"),
    status: operatorIntentStatus("status").notNull().default("received"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("operator_intents_workspace_id_idx").on(table.workspaceId),
    index("operator_intents_project_id_idx").on(table.projectId),
    index("operator_intents_status_idx").on(table.status)
  ]
);

export const taskContracts = pgTable(
  "task_contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorIntentId: uuid("operator_intent_id")
      .notNull()
      .references(() => operatorIntents.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    constraints: jsonListColumn("constraints"),
    nonGoals: jsonListColumn("non_goals"),
    acceptance: jsonListColumn("acceptance"),
    status: taskContractStatus("status").notNull().default("draft"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("task_contracts_operator_intent_id_idx").on(table.operatorIntentId),
    index("task_contracts_project_id_idx").on(table.projectId),
    index("task_contracts_status_idx").on(table.status)
  ]
);

export const harnessPlans = pgTable(
  "harness_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskContractId: uuid("task_contract_id")
      .notNull()
      .references(() => taskContracts.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    status: harnessPlanStatus("status").notNull().default("draft"),
    summary: text("summary").notNull(),
    nextAction: text("next_action"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("harness_plans_task_contract_id_idx").on(table.taskContractId),
    index("harness_plans_status_idx").on(table.status),
    uniqueIndex("harness_plans_contract_version_unique").on(table.taskContractId, table.version)
  ]
);

export const contextAssemblies = pgTable(
  "context_assemblies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    harnessPlanId: uuid("harness_plan_id")
      .notNull()
      .references(() => harnessPlans.id, { onDelete: "cascade" }),
    status: contextAssemblyStatus("status").notNull().default("assembled"),
    tokenBudget: integer("token_budget"),
    inclusionCount: integer("inclusion_count").notNull().default(0),
    exclusionCount: integer("exclusion_count").notNull().default(0),
    selectedContext: jsonObjectColumn("selected_context"),
    excludedContext: jsonObjectColumn("excluded_context"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    index("context_assemblies_harness_plan_id_idx").on(table.harnessPlanId),
    index("context_assemblies_status_idx").on(table.status)
  ]
);

export const executionRuns = pgTable(
  "execution_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    harnessPlanId: uuid("harness_plan_id")
      .notNull()
      .references(() => harnessPlans.id, { onDelete: "cascade" }),
    adapter: text("adapter").notNull(),
    status: executionRunStatus("status").notNull().default("planned"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("execution_runs_harness_plan_id_idx").on(table.harnessPlanId),
    index("execution_runs_status_idx").on(table.status),
    index("execution_runs_adapter_idx").on(table.adapter)
  ]
);

export const evidenceBundles = pgTable(
  "evidence_bundles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionRunId: uuid("execution_run_id")
      .notNull()
      .references(() => executionRuns.id, { onDelete: "cascade" }),
    status: evidenceBundleStatus("status").notNull().default("draft"),
    changedFiles: jsonListColumn("changed_files"),
    commands: jsonListColumn("commands"),
    diffRisk: text("diff_risk").notNull(),
    reviewBurden: text("review_burden").notNull(),
    rollbackPath: text("rollback_path").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("evidence_bundles_execution_run_id_idx").on(table.executionRunId),
    index("evidence_bundles_status_idx").on(table.status)
  ]
);

export const reviewAssessments = pgTable(
  "review_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evidenceBundleId: uuid("evidence_bundle_id")
      .notNull()
      .references(() => evidenceBundles.id, { onDelete: "cascade" }),
    status: reviewAssessmentStatus("status").notNull().default("pending"),
    reviewer: text("reviewer").notNull(),
    summary: text("summary").notNull(),
    findings: jsonListColumn("findings"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("review_assessments_evidence_bundle_id_idx").on(table.evidenceBundleId),
    index("review_assessments_status_idx").on(table.status)
  ]
);

export const feedbackDeltas = pgTable(
  "feedback_deltas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewAssessmentId: uuid("review_assessment_id")
      .notNull()
      .references(() => reviewAssessments.id, { onDelete: "cascade" }),
    status: feedbackDeltaStatus("status").notNull().default("candidate"),
    memoryCandidates: jsonListColumn("memory_candidates"),
    sourceDecisions: jsonListColumn("source_decisions"),
    evalCandidates: jsonListColumn("eval_candidates"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index("feedback_deltas_review_assessment_id_idx").on(table.reviewAssessmentId),
    index("feedback_deltas_status_idx").on(table.status)
  ]
);
