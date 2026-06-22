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
  projects
} from "./harness.js";

type JsonObject = Record<string, unknown>;
type JsonList = unknown[];

const emptyJsonObject = sql`'{}'::jsonb`;
const emptyJsonList = sql`'[]'::jsonb`;

export const auditFindingSeverity = pgEnum("audit_finding_severity", [
  "info",
  "advisory",
  "warning",
  "blocking"
]);

export const auditFindingCategory = pgEnum("audit_finding_category", [
  "architecture",
  "boundary",
  "type_safety",
  "memory_semantics",
  "source_grounding",
  "policy",
  "eval",
  "handoff",
  "verification"
]);

export const auditFindingStatus = pgEnum("audit_finding_status", [
  "open",
  "accepted",
  "resolved",
  "waived"
]);

export const auditFinalVerdict = pgEnum("audit_final_verdict", [
  "pass",
  "advisory",
  "needs_review",
  "fail"
]);

export const auditRiskEstimate = pgEnum("audit_risk_estimate", [
  "low",
  "medium",
  "high"
]);

export const auditBundles = pgTable(
  "audit_bundles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    sliceId: text("slice_id").notNull(),
    commitCandidate: text("commit_candidate"),
    changedFiles: jsonb("changed_files").$type<JsonList>().notNull().default(emptyJsonList),
    intendedFiles: jsonb("intended_files").$type<JsonList>().notNull().default(emptyJsonList),
    unexpectedFiles: jsonb("unexpected_files").$type<JsonList>().notNull().default(emptyJsonList),
    verificationCommands: jsonb("verification_commands")
      .$type<JsonList>()
      .notNull()
      .default(emptyJsonList),
    verificationResults: text("verification_results").notNull(),
    architecturalDelta: text("architectural_delta").notNull(),
    reviewBurdenEstimate: auditRiskEstimate("review_burden_estimate").notNull(),
    diffRiskEstimate: auditRiskEstimate("diff_risk_estimate").notNull(),
    rollbackPath: text("rollback_path").notNull(),
    candidateUpdates: jsonb("candidate_updates").$type<JsonList>().notNull().default(emptyJsonList),
    selfCritiqueSummary: text("self_critique_summary").notNull(),
    finalVerdict: auditFinalVerdict("final_verdict").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("audit_bundles_project_id_idx").on(table.projectId),
    index("audit_bundles_execution_run_id_idx").on(table.executionRunId),
    index("audit_bundles_slice_id_idx").on(table.sliceId),
    index("audit_bundles_final_verdict_idx").on(table.finalVerdict),
    index("audit_bundles_created_at_idx").on(table.createdAt)
  ]
);

export const auditFindings = pgTable(
  "audit_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditBundleId: uuid("audit_bundle_id")
      .notNull()
      .references(() => auditBundles.id, { onDelete: "cascade" }),
    category: auditFindingCategory("category").notNull(),
    severity: auditFindingSeverity("severity").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    evidenceRefs: jsonb("evidence_refs").$type<JsonList>().notNull().default(emptyJsonList),
    recommendation: text("recommendation").notNull(),
    status: auditFindingStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("audit_findings_bundle_id_idx").on(table.auditBundleId),
    index("audit_findings_category_idx").on(table.category),
    index("audit_findings_severity_idx").on(table.severity),
    index("audit_findings_status_idx").on(table.status)
  ]
);
