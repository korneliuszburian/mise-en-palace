// fallow-ignore-file code-duplication -- SQLite deliberately mirrors the governed PostgreSQL domain schema while retaining dialect-bound builders and types
import { sql, type SQLWrapper } from "drizzle-orm/sql";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

import {
  boolean,
  enumChecks,
  sqliteEnum,
  sqliteNow,
  sqliteUuidDefault,
  timestamp,
  uuid
} from "./dialect.js";

import {
  memoryApplicationOutcomes,
  memoryCandidateStatuses,
  memoryFeedbackDirections,
  memoryFeedbackEventTypes,
  memoryRecordKinds,
  memoryRecordStatuses
} from "@krn/core";

import {
  createdAtColumn,
  jsonListColumn,
  metadataColumn,
  requiredJsonListColumn,
  updatedAtColumn
} from "./columns.js";
import {
  contextAssemblies,
  executionRuns,
  feedbackDeltas,
  reviewAssessments,
  usefulnessApplications
} from "./harness.js";
import {
  executionRunIdColumn,
  requiredProjectIdColumn,
  taskContractIdColumn
} from "./reference-columns.js";
import {
  sourceClaims
} from "./sources.js";

const confidenceRange = (
  column: SQLWrapper
) => sql`${column} >= 0 AND ${column} <= 100`;

const nonEmptyText = (
  column: SQLWrapper
) => sql`length(trim(${column})) > 0`;

const nonEmptyJsonArray = (
  column: SQLWrapper
) => sql`json_array_length(${column}) > 0`;

const memoryTemporalStrategy = (
  validFrom: SQLWrapper,
  validUntil: SQLWrapper,
  invalidationRule: SQLWrapper
) => sql`${validUntil} IS NULL OR (
  ${validUntil} > ${validFrom}
  AND ${invalidationRule} IS NOT NULL
  AND ${nonEmptyText(invalidationRule)}
)`;

const temporalWindow = (
  validFrom: SQLWrapper,
  validUntil: SQLWrapper
) => sql`${validUntil} IS NULL OR ${validUntil} > ${validFrom}`;

const antiMemorySourceEvidence = (
  invalidatedBySourceClaimId: SQLWrapper,
  invalidatedBySourceClaimIds: SQLWrapper,
  sourceLineage: SQLWrapper
) => sql`${invalidatedBySourceClaimId} IS NOT NULL
  OR ${nonEmptyJsonArray(invalidatedBySourceClaimIds)}
  OR ${nonEmptyJsonArray(sourceLineage)}`;

const memoryGuidanceColumns = () => ({
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  owner: text("owner").notNull(),
  confidence: integer("confidence").notNull(),
  applicationGuidance: text("application_guidance").notNull(),
  invalidationRule: text("invalidation_rule")
});

const memoryCandidateProposalColumns = () => ({
  id: uuid("id").primaryKey().default(sqliteUuidDefault),
  projectId: requiredProjectIdColumn(),
    executionRunId: executionRunIdColumn(),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "set null"
    }),
    proposedBy: text("proposed_by").notNull()
});

const memoryCandidateReviewColumns = () => ({
  reviewer: text("reviewer"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull().default(sqliteNow),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  metadata: metadataColumn(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn()
});

const antiMemoryEvidenceColumns = () => ({
  rejectedClaim: text("rejected_claim"),
  reason: text("reason"),
  invalidatedBySourceClaimIds: jsonListColumn("invalidated_by_source_claim_ids"),
  invalidatedBySourceClaimId: uuid("invalidated_by_source_claim_id").references(() => sourceClaims.id, {
    onDelete: "set null"
  }),
  appliesTo: text("applies_to"),
  mayRevisitWhen: text("may_revisit_when"),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  owner: text("owner").notNull(),
  confidence: integer("confidence").notNull(),
  sourceLineage: jsonListColumn("source_lineage")
});

const memoryRunAnchorColumns = () => ({
  id: uuid("id").primaryKey().default(sqliteUuidDefault),
  memoryRecordId: uuid("memory_record_id")
    .notNull()
    .references(() => memoryRecords.id, { onDelete: "cascade" }),
  executionRunId: executionRunIdColumn()
});

export const memoryRecordKind = sqliteEnum("memory_record_kind", memoryRecordKinds);

export const memoryRecordStatus = sqliteEnum("memory_record_status", memoryRecordStatuses);

export const memoryCandidateStatus = sqliteEnum("memory_candidate_status", memoryCandidateStatuses);

export const memoryFeedbackDirection = sqliteEnum("memory_feedback_direction", memoryFeedbackDirections);

export const memoryApplicationOutcome = sqliteEnum("memory_application_outcome", memoryApplicationOutcomes);

export const memoryFeedbackEventType = sqliteEnum("memory_feedback_event_type", memoryFeedbackEventTypes);

export const memoryRecords = sqliteTable(
  "memory_records",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    projectId: requiredProjectIdColumn(),
    currentVersionId: uuid("current_version_id"),
    key: text("key").notNull(),
    kind: memoryRecordKind("kind").notNull(),
    status: memoryRecordStatus("status").notNull().default("active"),
    ...memoryGuidanceColumns(),
    sourceLineage: requiredJsonListColumn("source_lineage"),
    isUserPreference: boolean("is_user_preference").notNull().default(false),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().default(sqliteNow),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    invalidationReason: text("invalidation_reason"),
    positiveFeedbackCount: integer("positive_feedback_count").notNull().default(0),
    negativeFeedbackCount: integer("negative_feedback_count").notNull().default(0),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("memory_records", table),
    uniqueIndex("memory_records_project_key_unique").on(table.projectId, table.key),
    index("memory_records_current_version_id_idx").on(table.currentVersionId),
    index("memory_records_project_id_idx").on(table.projectId),
    index("memory_records_kind_idx").on(table.kind),
    index("memory_records_status_idx").on(table.status),
    index("memory_records_valid_until_idx").on(table.validUntil),
    check("memory_records_confidence_range", confidenceRange(table.confidence)),
    check(
      "memory_records_application_guidance_non_empty",
      nonEmptyText(table.applicationGuidance)
    ),
    check("memory_records_source_lineage_non_empty", nonEmptyJsonArray(table.sourceLineage)),
    check(
      "memory_records_temporal_invalidation_strategy",
      memoryTemporalStrategy(table.validFrom, table.validUntil, table.invalidationRule)
    )
  ]
);

export const memoryRecordVersions = sqliteTable(
  "memory_record_versions",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    memoryRecordId: uuid("memory_record_id")
      .notNull()
      .references(() => memoryRecords.id, { onDelete: "cascade" }),
    createdFromCandidateId: uuid("created_from_candidate_id").references(() => memoryCandidates.id, {
      onDelete: "set null"
    }),
    version: integer("version").notNull(),
    ...memoryGuidanceColumns(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().default(sqliteNow),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    sourceLineage: requiredJsonListColumn("source_lineage"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("memory_record_versions", table),
    uniqueIndex("memory_record_versions_record_version_unique").on(
      table.memoryRecordId,
      table.version
    ),
    index("memory_record_versions_created_from_candidate_id_idx").on(
      table.createdFromCandidateId
    ),
    index("memory_record_versions_memory_record_id_idx").on(table.memoryRecordId),
    check("memory_record_versions_confidence_range", confidenceRange(table.confidence)),
    check(
      "memory_record_versions_application_guidance_non_empty",
      nonEmptyText(table.applicationGuidance)
    ),
    check(
      "memory_record_versions_source_lineage_non_empty",
      nonEmptyJsonArray(table.sourceLineage)
    ),
    check(
      "memory_record_versions_temporal_invalidation_strategy",
      memoryTemporalStrategy(table.validFrom, table.validUntil, table.invalidationRule)
    )
  ]
);

export const memoryCandidates = sqliteTable(
  "memory_candidates",
  {
    ...memoryCandidateProposalColumns(),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "restrict"
    }),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "restrict"
    }),
    reviewAssessmentId: uuid("review_assessment_id").references(() => reviewAssessments.id, {
      onDelete: "restrict"
    }),
    revisionReviewAssessmentId: uuid("revision_review_assessment_id").references(
      () => reviewAssessments.id,
      { onDelete: "restrict" }
    ),
    usefulnessApplicationId: text("usefulness_application_id").references(
      () => usefulnessApplications.applicationId,
      { onDelete: "restrict" }
    ),
    kind: memoryRecordKind("kind").notNull(),
    status: memoryCandidateStatus("status").notNull().default("candidate"),
    ...memoryGuidanceColumns(),
    sourceClaimIds: jsonListColumn("source_claim_ids"),
    sourceLineage: requiredJsonListColumn("source_lineage"),
    isUserPreference: boolean("is_user_preference").notNull().default(false),
    ...memoryCandidateReviewColumns()
  },
  (table) => [
    ...enumChecks("memory_candidates", table),
    index("memory_candidates_project_id_idx").on(table.projectId),
    index("memory_candidates_execution_run_id_idx").on(table.executionRunId),
    index("memory_candidates_feedback_delta_id_idx").on(table.feedbackDeltaId),
    index("memory_candidates_review_assessment_id_idx").on(table.reviewAssessmentId),
    index("memory_candidates_revision_review_assessment_id_idx").on(
      table.revisionReviewAssessmentId
    ),
    uniqueIndex("memory_candidates_usefulness_application_id_unique").on(
      table.usefulnessApplicationId
    ),
    index("memory_candidates_status_idx").on(table.status),
    index("memory_candidates_kind_idx").on(table.kind),
    index("memory_candidates_valid_until_idx").on(table.validUntil),
    check("memory_candidates_confidence_range", confidenceRange(table.confidence)),
    check(
      "memory_candidates_application_guidance_non_empty",
      nonEmptyText(table.applicationGuidance)
    ),
    check(
      "memory_candidates_source_lineage_non_empty",
      nonEmptyJsonArray(table.sourceLineage)
    ),
    check(
      "memory_candidates_temporal_invalidation_strategy",
      memoryTemporalStrategy(table.validFrom, table.validUntil, table.invalidationRule)
    )
  ]
);

export const antiMemoryCandidates = sqliteTable(
  "anti_memory_candidates",
  {
    ...memoryCandidateProposalColumns(),
    maintenanceIdentity: text("maintenance_identity"),
    key: text("key").notNull(),
    status: memoryCandidateStatus("status").notNull().default("candidate"),
    ...antiMemoryEvidenceColumns(),
    ...memoryCandidateReviewColumns()
  },
  (table) => [
    ...enumChecks("anti_memory_candidates", table),
    index("anti_memory_candidates_project_id_idx").on(table.projectId),
    index("anti_memory_candidates_execution_run_id_idx").on(table.executionRunId),
    index("anti_memory_candidates_feedback_delta_id_idx").on(table.feedbackDeltaId),
    uniqueIndex("anti_memory_candidates_project_maintenance_identity_unique").on(
      table.projectId,
      table.maintenanceIdentity
    ),
    index("anti_memory_candidates_status_idx").on(table.status),
    index("anti_memory_candidates_key_idx").on(table.key),
    index("anti_memory_candidates_valid_until_idx").on(table.validUntil),
    check("anti_memory_candidates_confidence_range", confidenceRange(table.confidence)),
    check(
      "anti_memory_candidates_source_evidence_non_empty",
      antiMemorySourceEvidence(
        table.invalidatedBySourceClaimId,
        table.invalidatedBySourceClaimIds,
        table.sourceLineage
      )
    ),
    check(
      "anti_memory_candidates_temporal_window",
      temporalWindow(table.validFrom, table.validUntil)
    )
  ]
);

export const memoryApplications = sqliteTable(
  "memory_applications",
  {
    ...memoryRunAnchorColumns(),
    decisionPacketChecksum: text("decision_packet_checksum"),
    taskContractId: taskContractIdColumn(),
    contextAssemblyId: uuid("context_assembly_id").references(() => contextAssemblies.id, {
      onDelete: "set null"
    }),
    expectedUse: text("expected_use").notNull(),
    outcome: memoryApplicationOutcome("outcome"),
    notes: text("notes"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("memory_applications", table),
    index("memory_applications_memory_record_id_idx").on(table.memoryRecordId),
    index("memory_applications_execution_run_id_idx").on(table.executionRunId),
    uniqueIndex("memory_applications_packet_identity_unique").on(
      table.memoryRecordId,
      table.executionRunId,
      table.decisionPacketChecksum
    ),
    index("memory_applications_task_contract_id_idx").on(table.taskContractId),
    index("memory_applications_context_assembly_id_idx").on(table.contextAssemblyId),
    check(
      "memory_applications_packet_checksum_non_empty",
      sql`${table.decisionPacketChecksum} IS NULL OR length(trim(${table.decisionPacketChecksum})) > 0`
    )
  ]
);

export const memoryFeedbackEvents = sqliteTable(
  "memory_feedback_events",
  {
    ...memoryRunAnchorColumns(),
    feedbackDeltaId: uuid("feedback_delta_id").references(() => feedbackDeltas.id, {
      onDelete: "set null"
    }),
    eventType: memoryFeedbackEventType("event_type"),
    direction: memoryFeedbackDirection("direction").notNull(),
    note: text("note").notNull(),
    reason: text("reason"),
    evidenceRef: text("evidence_ref"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("memory_feedback_events", table),
    index("memory_feedback_events_memory_record_id_idx").on(table.memoryRecordId),
    index("memory_feedback_events_execution_run_id_idx").on(table.executionRunId),
    index("memory_feedback_events_feedback_delta_id_idx").on(table.feedbackDeltaId),
    index("memory_feedback_events_event_type_idx").on(table.eventType),
    index("memory_feedback_events_direction_idx").on(table.direction)
  ]
);

export const antiMemoryRecords = sqliteTable(
  "anti_memory_records",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    projectId: requiredProjectIdColumn(),
    executionRunId: executionRunIdColumn(),
    createdFromCandidateId: uuid("created_from_candidate_id").references(() => antiMemoryCandidates.id, {
      onDelete: "set null"
    }),
    key: text("key").notNull(),
    ...antiMemoryEvidenceColumns(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().default(sqliteNow),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    invalidationReason: text("invalidation_reason"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("anti_memory_records", table),
    uniqueIndex("anti_memory_records_project_key_unique").on(table.projectId, table.key),
    index("anti_memory_records_created_from_candidate_id_idx").on(
      table.createdFromCandidateId
    ),
    index("anti_memory_records_project_id_idx").on(table.projectId),
    index("anti_memory_records_execution_run_id_idx").on(table.executionRunId),
    index("anti_memory_records_invalidated_by_source_claim_id_idx").on(
      table.invalidatedBySourceClaimId
    ),
    index("anti_memory_records_valid_until_idx").on(table.validUntil),
    check("anti_memory_records_confidence_range", confidenceRange(table.confidence)),
    check(
      "anti_memory_records_source_evidence_non_empty",
      antiMemorySourceEvidence(
        table.invalidatedBySourceClaimId,
        table.invalidatedBySourceClaimIds,
        table.sourceLineage
      )
    ),
    check(
      "anti_memory_records_temporal_window",
      temporalWindow(table.validFrom, table.validUntil)
    )
  ]
);
