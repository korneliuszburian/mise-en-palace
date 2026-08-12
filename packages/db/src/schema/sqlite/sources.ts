// fallow-ignore-file code-duplication -- SQLite deliberately mirrors the governed PostgreSQL domain schema while retaining dialect-bound builders and types
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  unique,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

import {
  enumChecks,
  sqliteEnum,
  sqliteNow,
  sqliteUuidDefault,
  timestamp,
  uuid
} from "./dialect.js";

import {
  sourceArtifactKinds,
  sourceAuthorityLabels,
  sourceClaimEdgeKinds,
  sourceClaimStatuses,
  sourceDecisionEdgeConfidences,
  sourceDecisionStatuses,
  sourceDecisionTargetTypes,
  sourceRejectionReasons,
  sourceSupportTypes
} from "@krn/core";

import {
  createdAtColumn,
  metadataColumn,
  updatedAtColumn
} from "./columns.js";
import {
  executionRunIdColumn,
  nullableProjectIdColumn
} from "./reference-columns.js";

const sha256Text = (column: import("drizzle-orm/sql").SQLWrapper) =>
  sql`length(${column}) = 64 AND ${column} NOT GLOB '*[^0-9a-f]*'`;

export const sourceArtifactKind = sqliteEnum("source_artifact_kind", sourceArtifactKinds);

export const sourceAuthorityLabel = sqliteEnum("source_trust_tier", sourceAuthorityLabels);

export const sourceSupportType = sqliteEnum("source_support_type", sourceSupportTypes);

export const sourceClaimStatus = sqliteEnum("source_claim_status", sourceClaimStatuses);

export const sourceClaimEdgeKind = sqliteEnum("source_claim_edge_kind", sourceClaimEdgeKinds);

export const sourceDecisionStatus = sqliteEnum("source_decision_status", sourceDecisionStatuses);

export const sourceDecisionTargetType = sqliteEnum(
  "source_decision_target_type",
  sourceDecisionTargetTypes
);

export const sourceDecisionEdgeConfidence = sqliteEnum(
  "source_decision_edge_confidence",
  sourceDecisionEdgeConfidences
);

export const sourceRejectionReason = sqliteEnum("source_rejection_reason", sourceRejectionReasons);

export const sourceArtifacts = sqliteTable(
  "source_artifacts",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    projectId: nullableProjectIdColumn(),
    importId: text("import_id"),
    importRowId: text("import_row_id"),
    kind: sourceArtifactKind("kind").notNull(),
    sourceAuthority: sourceAuthorityLabel("trust_tier").notNull(),
    uri: text("uri").notNull(),
    title: text("title").notNull(),
    contentHash: text("content_hash").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().default(sqliteNow),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("source_artifacts", table),
    check(
      "source_artifacts_import_tuple_complete",
      sql`(
        (${table.importId} IS NULL AND ${table.importRowId} IS NULL)
        OR (
          NULLIF(trim(${table.importId}), '') IS NOT NULL
          AND NULLIF(trim(${table.importRowId}), '') IS NOT NULL
        )
      )`
    ),
    check(
      "source_artifacts_import_content_hash_sha256",
      sql`${table.importId} IS NULL OR (${sha256Text(table.contentHash)})`
    ),
    uniqueIndex("source_artifacts_uri_hash_unique").on(table.uri, table.contentHash),
    uniqueIndex("source_artifacts_project_import_row_unique").on(
      table.projectId,
      table.importId,
      table.importRowId
    ),
    index("source_artifacts_project_id_idx").on(table.projectId),
    index("source_artifacts_kind_idx").on(table.kind),
    index("source_artifacts_trust_tier_idx").on(table.sourceAuthority)
  ]
);

export const sourceChunks = sqliteTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    sourceArtifactId: uuid("source_artifact_id")
      .notNull()
      .references(() => sourceArtifacts.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    heading: text("heading"),
    content: text("content").notNull(),
    tokenCount: integer("token_count"),
    contentHash: text("content_hash").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("source_chunks", table),
    uniqueIndex("source_chunks_id_artifact_unique").on(table.id, table.sourceArtifactId),
    uniqueIndex("source_chunks_artifact_ordinal_unique").on(
      table.sourceArtifactId,
      table.ordinal
    ),
    index("source_chunks_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_chunks_content_hash_idx").on(table.contentHash)
  ]
);

export const sourceClaims = sqliteTable(
  "source_claims",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    sourceArtifactId: uuid("source_artifact_id")
      .notNull()
      .references(() => sourceArtifacts.id, { onDelete: "cascade" }),
    sourceChunkId: uuid("source_chunk_id").references(() => sourceChunks.id, {
      onDelete: "set null"
    }),
    executionRunId: executionRunIdColumn(),
    claim: text("claim").notNull(),
    mechanism: text("mechanism").notNull(),
    krnImplication: text("krn_implication").notNull(),
    doesNotProve: text("does_not_prove").notNull(),
    sourceAuthority: sourceAuthorityLabel("trust_tier").notNull(),
    supportType: sourceSupportType("support_type").notNull(),
    consumer: text("consumer").notNull(),
    falsifier: text("falsifier"),
    revisitWhen: text("revisit_when"),
    status: sourceClaimStatus("status").notNull().default("proposed"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("source_claims", table),
    foreignKey({
      name: "source_claims_chunk_artifact_fk",
      columns: [table.sourceChunkId, table.sourceArtifactId],
      foreignColumns: [sourceChunks.id, sourceChunks.sourceArtifactId]
    }),
    index("source_claims_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_claims_source_chunk_id_idx").on(table.sourceChunkId),
    index("source_claims_execution_run_id_idx").on(table.executionRunId),
    index("source_claims_trust_tier_idx").on(table.sourceAuthority),
    index("source_claims_support_type_idx").on(table.supportType),
    index("source_claims_consumer_idx").on(table.consumer),
    index("source_claims_status_idx").on(table.status)
  ]
);

export const sourceClaimEdges = sqliteTable(
  "source_claim_edges",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    fromSourceClaimId: uuid("from_source_claim_id")
      .notNull()
      .references(() => sourceClaims.id, { onDelete: "cascade" }),
    toSourceClaimId: uuid("to_source_claim_id")
      .notNull()
      .references(() => sourceClaims.id, { onDelete: "cascade" }),
    kind: sourceClaimEdgeKind("kind").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("source_claim_edges", table),
    check(
      "source_claim_edges_distinct_claims",
      sql`${table.fromSourceClaimId} <> ${table.toSourceClaimId}`
    ),
    uniqueIndex("source_claim_edges_semantic_identity_unique").on(
      table.fromSourceClaimId,
      table.toSourceClaimId,
      table.kind
    ),
    index("source_claim_edges_from_idx").on(table.fromSourceClaimId),
    index("source_claim_edges_to_idx").on(table.toSourceClaimId),
    index("source_claim_edges_kind_idx").on(table.kind)
  ]
);

export const sourceDecisions = sqliteTable(
  "source_decisions",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    projectId: nullableProjectIdColumn(),
    sourceClaimId: uuid("source_claim_id").references(() => sourceClaims.id, {
      onDelete: "set null"
    }),
    status: sourceDecisionStatus("status").notNull(),
    decision: text("decision").notNull(),
    rationale: text("rationale").notNull(),
    falsifier: text("falsifier").notNull(),
    consumer: text("consumer").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("source_decisions", table),
    index("source_decisions_project_id_idx").on(table.projectId),
    index("source_decisions_source_claim_id_idx").on(table.sourceClaimId),
    index("source_decisions_status_idx").on(table.status),
    index("source_decisions_consumer_idx").on(table.consumer),
    uniqueIndex("source_decisions_terminal_claim_unique")
      .on(table.sourceClaimId)
      .where(sql`${table.status} in ('adopt', 'reject')`),
    unique("source_decisions_id_claim_unique").on(table.id, table.sourceClaimId)
  ]
);

export const sourceDecisionEdges = sqliteTable(
  "source_decision_edges",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    sourceClaimId: uuid("source_claim_id")
      .notNull()
      .references(() => sourceClaims.id, { onDelete: "cascade" }),
    sourceDecisionId: uuid("source_decision_id")
      .notNull()
      .references(() => sourceDecisions.id),
    targetType: sourceDecisionTargetType("target_type").notNull(),
    targetId: text("target_id").notNull(),
    supportType: sourceSupportType("support_type").notNull(),
    confidence: sourceDecisionEdgeConfidence("confidence").notNull(),
    notes: text("notes").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("source_decision_edges", table),
    foreignKey({
      name: "source_decision_edges_decision_claim_fk",
      columns: [table.sourceDecisionId, table.sourceClaimId],
      foreignColumns: [sourceDecisions.id, sourceDecisions.sourceClaimId]
    }),
    uniqueIndex("source_decision_edges_identity_unique").on(
      table.sourceClaimId,
      table.sourceDecisionId,
      table.targetType,
      table.targetId,
      table.supportType
    ),
    index("source_decision_edges_source_claim_id_idx").on(table.sourceClaimId),
    index("source_decision_edges_source_decision_id_idx").on(table.sourceDecisionId),
    index("source_decision_edges_target_idx").on(table.targetType, table.targetId),
    index("source_decision_edges_support_type_idx").on(table.supportType),
    index("source_decision_edges_confidence_idx").on(table.confidence)
  ]
);

export const sourceRejections = sqliteTable(
  "source_rejections",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    projectId: nullableProjectIdColumn(),
    executionRunId: executionRunIdColumn(),
    sourceArtifactId: uuid("source_artifact_id").references(() => sourceArtifacts.id, {
      onDelete: "set null"
    }),
    sourceClaimId: uuid("source_claim_id").references(() => sourceClaims.id, {
      onDelete: "set null"
    }),
    title: text("title").notNull().default("untitled source rejection"),
    attemptedClaim: text("attempted_claim").notNull().default("unspecified attempted claim"),
    rejectedBecause: sourceRejectionReason("rejected_because").notNull().default("unsupported"),
    reason: text("reason").notNull(),
    doesNotProve: text("does_not_prove").notNull(),
    consumer: text("consumer").notNull(),
    metadata: metadataColumn(),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }).notNull().default(sqliteNow)
  },
  (table) => [
    ...enumChecks("source_rejections", table),
    index("source_rejections_project_id_idx").on(table.projectId),
    index("source_rejections_execution_run_id_idx").on(table.executionRunId),
    index("source_rejections_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_rejections_source_claim_id_idx").on(table.sourceClaimId),
    index("source_rejections_consumer_idx").on(table.consumer),
    index("source_rejections_rejected_because_idx").on(table.rejectedBecause)
  ]
);

export const sourceAuthorityQuarantines = sqliteTable(
  "source_authority_quarantines",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    reason: text("reason").notNull(),
    metadata: metadataColumn(),
    quarantinedAt: timestamp("quarantined_at", { withTimezone: true }).notNull().default(sqliteNow)
  },
  (table) => [
    ...enumChecks("source_authority_quarantines", table),
    uniqueIndex("source_authority_quarantines_entity_reason_unique").on(
      table.entityType,
      table.entityId,
      table.reason
    ),
    index("source_authority_quarantines_entity_idx").on(table.entityType, table.entityId)
  ]
);

export const sourceSnapshots = sqliteTable(
  "source_snapshots",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    sourceArtifactId: uuid("source_artifact_id")
      .notNull()
      .references(() => sourceArtifacts.id, { onDelete: "cascade" }),
    snapshotUri: text("snapshot_uri").notNull(),
    contentHash: text("content_hash").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().default(sqliteNow),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("source_snapshots", table),
    uniqueIndex("source_snapshots_artifact_hash_unique").on(
      table.sourceArtifactId,
      table.contentHash
    ),
    index("source_snapshots_source_artifact_id_idx").on(table.sourceArtifactId)
  ]
);
