import { sql } from "drizzle-orm/sql";
import {
  boolean,
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

import {
  contextAssemblies,
  executionRuns,
  feedbackDeltas,
  projects,
  taskContracts
} from "./harness.js";
import {
  sourceClaims
} from "./sources.js";

type JsonObject = Record<string, unknown>;
type JsonList = unknown[];

const emptyJsonObject = sql`'{}'::jsonb`;
const emptyJsonList = sql`'[]'::jsonb`;

export const memoryRecordKind = pgEnum("memory_record_kind", [
  "fact",
  "preference",
  "constraint",
  "procedure",
  "pattern",
  "risk"
]);

export const memoryRecordStatus = pgEnum("memory_record_status", [
  "active",
  "deprecated",
  "stale",
  "invalidated",
  "superseded"
]);

export const memoryCandidateStatus = pgEnum("memory_candidate_status", [
  "proposed",
  "candidate",
  "accepted",
  "rejected",
  "applied",
  "superseded"
]);

export const memoryEdgeKind = pgEnum("memory_edge_kind", [
  "supports",
  "contradicts",
  "supersedes",
  "depends_on",
  "duplicates",
  "qualifies"
]);

export const memoryFeedbackDirection = pgEnum("memory_feedback_direction", [
  "positive",
  "negative",
  "correction"
]);

export const memoryApplicationOutcome = pgEnum("memory_application_outcome", [
  "helped",
  "hurt",
  "neutral",
  "stale"
]);

export const memoryFeedbackEventType = pgEnum("memory_feedback_event_type", [
  "strengthened",
  "demoted",
  "invalidated",
  "corrected",
  "stale_detected"
]);

export const memoryActivationDecision = pgEnum("memory_activation_decision", [
  "included",
  "excluded",
  "abstained"
]);

export const memoryRecords = pgTable(
  "memory_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    currentVersionId: uuid("current_version_id"),
    key: text("key").notNull(),
    kind: memoryRecordKind("kind").notNull(),
    status: memoryRecordStatus("status").notNull().default("active"),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    owner: text("owner").notNull(),
    confidence: integer("confidence").notNull(),
    applicationGuidance: text("application_guidance").notNull(),
    invalidationRule: text("invalidation_rule"),
    sourceLineage: jsonb("source_lineage").$type<JsonList>().notNull().default(emptyJsonList),
    isUserPreference: boolean("is_user_preference").notNull().default(false),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    invalidationReason: text("invalidation_reason"),
    positiveFeedbackCount: integer("positive_feedback_count").notNull().default(0),
    negativeFeedbackCount: integer("negative_feedback_count").notNull().default(0),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("memory_records_project_key_unique").on(table.projectId, table.key),
    index("memory_records_current_version_id_idx").on(table.currentVersionId),
    index("memory_records_project_id_idx").on(table.projectId),
    index("memory_records_kind_idx").on(table.kind),
    index("memory_records_status_idx").on(table.status),
    index("memory_records_valid_until_idx").on(table.validUntil)
  ]
);

export const memoryRecordVersions = pgTable(
  "memory_record_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryRecordId: uuid("memory_record_id")
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    createdFromCandidateId: uuid("created_from_candidate_id").references(() => memoryCandidates.id, {
      onDelete: "set null"
    }),
    version: integer("version").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    owner: text("owner").notNull(),
    confidence: integer("confidence").notNull(),
    applicationGuidance: text("application_guidance").notNull(),
    invalidationRule: text("invalidation_rule"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    sourceLineage: jsonb("source_lineage").$type<JsonList>().notNull().default(emptyJsonList),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("memory_record_versions_record_version_unique").on(
      table.memoryRecordId,
      table.version
    ),
    index("memory_record_versions_created_from_candidate_id_idx").on(
      table.createdFromCandidateId
    ),
    index("memory_record_versions_memory_record_id_idx").on(table.memoryRecordId)
  ]
);

export const memoryEdges = pgTable(
  "memory_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromMemoryRecordId: uuid("from_memory_record_id")
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    toMemoryRecordId: uuid("to_memory_record_id")
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    kind: memoryEdgeKind("kind").notNull(),
    strength: integer("strength").notNull().default(0),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("memory_edges_from_idx").on(table.fromMemoryRecordId),
    index("memory_edges_to_idx").on(table.toMemoryRecordId),
    index("memory_edges_kind_idx").on(table.kind)
  ]
);

export const memoryCandidates = pgTable(
  "memory_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "set null"
    }),
    proposedBy: text("proposed_by").notNull(),
    kind: memoryRecordKind("kind").notNull(),
    status: memoryCandidateStatus("status").notNull().default("candidate"),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    owner: text("owner").notNull(),
    confidence: integer("confidence").notNull(),
    applicationGuidance: text("application_guidance").notNull(),
    invalidationRule: text("invalidation_rule"),
    sourceClaimIds: jsonb("source_claim_ids").$type<JsonList>().notNull().default(emptyJsonList),
    sourceLineage: jsonb("source_lineage").$type<JsonList>().notNull().default(emptyJsonList),
    isUserPreference: boolean("is_user_preference").notNull().default(false),
    reviewer: text("reviewer"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("memory_candidates_project_id_idx").on(table.projectId),
    index("memory_candidates_execution_run_id_idx").on(table.executionRunId),
    index("memory_candidates_feedback_delta_id_idx").on(table.feedbackDeltaId),
    index("memory_candidates_status_idx").on(table.status),
    index("memory_candidates_kind_idx").on(table.kind),
    index("memory_candidates_valid_until_idx").on(table.validUntil)
  ]
);

export const antiMemoryCandidates = pgTable(
  "anti_memory_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "set null"
    }),
    proposedBy: text("proposed_by").notNull(),
    key: text("key").notNull(),
    status: memoryCandidateStatus("status").notNull().default("candidate"),
    rejectedClaim: text("rejected_claim"),
    reason: text("reason"),
    invalidatedBySourceClaimIds: jsonb("invalidated_by_source_claim_ids")
      .$type<JsonList>()
      .notNull()
      .default(emptyJsonList),
    invalidatedBySourceClaimId: uuid("invalidated_by_source_claim_id").references(() => sourceClaims.id, {
      onDelete: "set null"
    }),
    appliesTo: text("applies_to"),
    mayRevisitWhen: text("may_revisit_when"),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    owner: text("owner").notNull(),
    confidence: integer("confidence").notNull(),
    sourceLineage: jsonb("source_lineage").$type<JsonList>().notNull().default(emptyJsonList),
    reviewer: text("reviewer"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("anti_memory_candidates_project_id_idx").on(table.projectId),
    index("anti_memory_candidates_execution_run_id_idx").on(table.executionRunId),
    index("anti_memory_candidates_feedback_delta_id_idx").on(table.feedbackDeltaId),
    index("anti_memory_candidates_status_idx").on(table.status),
    index("anti_memory_candidates_key_idx").on(table.key),
    index("anti_memory_candidates_valid_until_idx").on(table.validUntil)
  ]
);

export const memoryApplications = pgTable(
  "memory_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryRecordId: uuid("memory_record_id")
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    taskContractId: uuid("task_contract_id").references(() => taskContracts.id, {
      onDelete: "set null"
    }),
    contextAssemblyId: uuid("context_assembly_id").references(() => contextAssemblies.id, {
      onDelete: "set null"
    }),
    expectedUse: text("expected_use").notNull(),
    outcome: memoryApplicationOutcome("outcome"),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("memory_applications_memory_record_id_idx").on(table.memoryRecordId),
    index("memory_applications_execution_run_id_idx").on(table.executionRunId),
    index("memory_applications_task_contract_id_idx").on(table.taskContractId),
    index("memory_applications_context_assembly_id_idx").on(table.contextAssemblyId)
  ]
);

export const memoryFeedbackEvents = pgTable(
  "memory_feedback_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryRecordId: uuid("memory_record_id")
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "set null"
    }),
    eventType: memoryFeedbackEventType("event_type"),
    direction: memoryFeedbackDirection("direction").notNull(),
    note: text("note").notNull(),
    reason: text("reason"),
    evidenceRef: text("evidence_ref"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("memory_feedback_events_memory_record_id_idx").on(table.memoryRecordId),
    index("memory_feedback_events_execution_run_id_idx").on(table.executionRunId),
    index("memory_feedback_events_feedback_delta_id_idx").on(table.feedbackDeltaId),
    index("memory_feedback_events_event_type_idx").on(table.eventType),
    index("memory_feedback_events_direction_idx").on(table.direction)
  ]
);

export const antiMemoryRecords = pgTable(
  "anti_memory_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    createdFromCandidateId: uuid("created_from_candidate_id").references(() => antiMemoryCandidates.id, {
      onDelete: "set null"
    }),
    key: text("key").notNull(),
    rejectedClaim: text("rejected_claim"),
    reason: text("reason"),
    invalidatedBySourceClaimIds: jsonb("invalidated_by_source_claim_ids")
      .$type<JsonList>()
      .notNull()
      .default(emptyJsonList),
    invalidatedBySourceClaimId: uuid("invalidated_by_source_claim_id").references(() => sourceClaims.id, {
      onDelete: "set null"
    }),
    appliesTo: text("applies_to"),
    mayRevisitWhen: text("may_revisit_when"),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    owner: text("owner").notNull(),
    confidence: integer("confidence").notNull(),
    sourceLineage: jsonb("source_lineage").$type<JsonList>().notNull().default(emptyJsonList),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    invalidationReason: text("invalidation_reason"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("anti_memory_records_project_key_unique").on(table.projectId, table.key),
    index("anti_memory_records_created_from_candidate_id_idx").on(
      table.createdFromCandidateId
    ),
    index("anti_memory_records_project_id_idx").on(table.projectId),
    index("anti_memory_records_execution_run_id_idx").on(table.executionRunId),
    index("anti_memory_records_invalidated_by_source_claim_id_idx").on(
      table.invalidatedBySourceClaimId
    ),
    index("anti_memory_records_valid_until_idx").on(table.validUntil)
  ]
);

export const memoryActivationTraces = pgTable(
  "memory_activation_traces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contextAssemblyId: uuid("context_assembly_id")
      .notNull()
      .references(() => contextAssemblies.id, { onDelete: "cascade" }),
    memoryRecordId: uuid("memory_record_id").references(() => memoryRecords.id, {
      onDelete: "set null"
    }),
    antiMemoryRecordId: uuid("anti_memory_record_id").references(() => antiMemoryRecords.id, {
      onDelete: "set null"
    }),
    decision: memoryActivationDecision("decision").notNull(),
    reason: text("reason").notNull(),
    score: integer("score"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("memory_activation_traces_context_assembly_id_idx").on(table.contextAssemblyId),
    index("memory_activation_traces_memory_record_id_idx").on(table.memoryRecordId),
    index("memory_activation_traces_anti_memory_record_id_idx").on(table.antiMemoryRecordId),
    index("memory_activation_traces_decision_idx").on(table.decision)
  ]
);
