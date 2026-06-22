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

import { runEvents } from "./events.js";
import {
  evidenceBundles,
  executionRuns,
  feedbackDeltas,
  projects,
  reviewAssessments,
  taskContracts,
  workspaces
} from "./harness.js";
import {
  sourceChunks,
  sourceClaims
} from "./sources.js";

type JsonObject = Record<string, unknown>;

const emptyJsonObject = sql`'{}'::jsonb`;

export const observationKind = pgEnum("observation_kind", [
  "fact",
  "decision",
  "correction",
  "risk",
  "procedure",
  "conflict",
  "slang",
  "gap",
  "preference",
  "operator_note"
]);

export const observationPriority = pgEnum("observation_priority", [
  "low",
  "medium",
  "high",
  "critical"
]);

export const observationConfidence = pgEnum("observation_confidence", [
  "low",
  "medium",
  "high"
]);

export const observationStatus = pgEnum("observation_status", [
  "observed",
  "candidate",
  "accepted",
  "contested",
  "deprecated",
  "invalidated",
  "superseded"
]);

export const observationProvenanceKind = pgEnum("observation_provenance_kind", [
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note"
]);

export const observationSourceRangeType = pgEnum("observation_source_range_type", [
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "operator_input"
]);

export const observationEntityKind = pgEnum("observation_entity_kind", [
  "workspace",
  "project",
  "repo",
  "file",
  "package",
  "source",
  "memory",
  "policy",
  "eval"
]);

export const observationClaimRelation = pgEnum("observation_claim_relation", [
  "supports",
  "contradicts",
  "qualifies",
  "supersedes"
]);

export const observationFeedbackEventType = pgEnum("observation_feedback_event_type", [
  "used",
  "ignored",
  "helped",
  "hurt",
  "stale",
  "corrected"
]);

export const observationUsefulness = pgEnum("observation_usefulness", [
  "positive",
  "negative",
  "neutral",
  "unknown"
]);

export const observationGroups = pgTable(
  "observation_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    taskContractId: uuid("task_contract_id").references(() => taskContracts.id, {
      onDelete: "set null"
    }),
    targetRepoPath: text("target_repo_path"),
    scope: jsonb("scope").$type<JsonObject>().notNull().default(emptyJsonObject),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    source: text("source").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("observation_groups_workspace_id_idx").on(table.workspaceId),
    index("observation_groups_project_id_idx").on(table.projectId),
    index("observation_groups_execution_run_id_idx").on(table.executionRunId),
    index("observation_groups_task_contract_id_idx").on(table.taskContractId),
    index("observation_groups_created_at_idx").on(table.createdAt)
  ]
);

export const observationItems = pgTable(
  "observation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => observationGroups.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    taskContractId: uuid("task_contract_id").references(() => taskContracts.id, {
      onDelete: "set null"
    }),
    targetRepoPath: text("target_repo_path"),
    kind: observationKind("kind").notNull(),
    status: observationStatus("status").notNull().default("observed"),
    priority: observationPriority("priority").notNull().default("medium"),
    confidence: observationConfidence("confidence").notNull().default("medium"),
    provenanceKind: observationProvenanceKind("provenance_kind").notNull(),
    subject: text("subject").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    eventTime: timestamp("event_time", { withTimezone: true }),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
    referencedAt: timestamp("referenced_at", { withTimezone: true }),
    referenceTime: timestamp("reference_time", { withTimezone: true }),
    relativeTimeBase: timestamp("relative_time_base", { withTimezone: true }),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("observation_items_group_id_idx").on(table.groupId),
    index("observation_items_workspace_id_idx").on(table.workspaceId),
    index("observation_items_project_id_idx").on(table.projectId),
    index("observation_items_execution_run_id_idx").on(table.executionRunId),
    index("observation_items_task_contract_id_idx").on(table.taskContractId),
    index("observation_items_kind_idx").on(table.kind),
    index("observation_items_status_idx").on(table.status),
    index("observation_items_priority_idx").on(table.priority),
    index("observation_items_provenance_kind_idx").on(table.provenanceKind),
    index("observation_items_observed_at_idx").on(table.observedAt),
    index("observation_items_valid_until_idx").on(table.validUntil)
  ]
);

export const observationSourceRanges = pgTable(
  "observation_source_ranges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    observationItemId: uuid("observation_item_id")
      .notNull()
      .references(() => observationItems.id, { onDelete: "cascade" }),
    sourceType: observationSourceRangeType("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    runEventId: uuid("run_event_id").references(() => runEvents.id, { onDelete: "set null" }),
    sourceChunkId: uuid("source_chunk_id").references(() => sourceChunks.id, {
      onDelete: "set null"
    }),
    evidenceBundleId: uuid("evidence_bundle_id").references(() => evidenceBundles.id, {
      onDelete: "set null"
    }),
    reviewAssessmentId: uuid("review_assessment_id").references(() => reviewAssessments.id, {
      onDelete: "set null"
    }),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "set null"
    }),
    locator: text("locator").notNull(),
    excerpt: text("excerpt"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject)
  },
  (table) => [
    index("observation_source_ranges_item_id_idx").on(table.observationItemId),
    index("observation_source_ranges_source_type_idx").on(table.sourceType),
    index("observation_source_ranges_execution_run_id_idx").on(table.executionRunId),
    index("observation_source_ranges_run_event_id_idx").on(table.runEventId),
    index("observation_source_ranges_source_chunk_id_idx").on(table.sourceChunkId),
    index("observation_source_ranges_evidence_bundle_id_idx").on(table.evidenceBundleId),
    index("observation_source_ranges_review_assessment_id_idx").on(table.reviewAssessmentId),
    index("observation_source_ranges_feedback_delta_id_idx").on(table.feedbackDeltaId)
  ]
);

export const observationEntityEdges = pgTable(
  "observation_entity_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    observationItemId: uuid("observation_item_id")
      .notNull()
      .references(() => observationItems.id, { onDelete: "cascade" }),
    entityKind: observationEntityKind("entity_kind").notNull(),
    entityId: text("entity_id").notNull(),
    relation: text("relation").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("observation_entity_edges_item_id_idx").on(table.observationItemId),
    index("observation_entity_edges_entity_idx").on(table.entityKind, table.entityId),
    index("observation_entity_edges_relation_idx").on(table.relation)
  ]
);

export const observationClaimEdges = pgTable(
  "observation_claim_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    observationItemId: uuid("observation_item_id")
      .notNull()
      .references(() => observationItems.id, { onDelete: "cascade" }),
    sourceClaimId: uuid("source_claim_id")
      .notNull()
      .references(() => sourceClaims.id, { onDelete: "cascade" }),
    relation: observationClaimRelation("relation").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("observation_claim_edges_item_id_idx").on(table.observationItemId),
    index("observation_claim_edges_source_claim_id_idx").on(table.sourceClaimId),
    index("observation_claim_edges_relation_idx").on(table.relation)
  ]
);

export const observationFeedbackEvents = pgTable(
  "observation_feedback_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    observationItemId: uuid("observation_item_id")
      .notNull()
      .references(() => observationItems.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    eventType: observationFeedbackEventType("event_type").notNull(),
    usefulness: observationUsefulness("usefulness").notNull().default("unknown"),
    note: text("note"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("observation_feedback_events_item_id_idx").on(table.observationItemId),
    index("observation_feedback_events_project_id_idx").on(table.projectId),
    index("observation_feedback_events_execution_run_id_idx").on(table.executionRunId),
    index("observation_feedback_events_event_type_idx").on(table.eventType),
    index("observation_feedback_events_usefulness_idx").on(table.usefulness)
  ]
);
