import { sql } from "drizzle-orm";
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

export const sourceArtifactKind = pgEnum("source_artifact_kind", [
  "doc",
  "file",
  "url",
  "paper",
  "run",
  "operator_input",
  "external_doc"
]);

export const sourceAuthorityLabel = pgEnum("source_trust_tier", sourceAuthorityLabels);

export const sourceSupportType = pgEnum("source_support_type", sourceSupportTypes);

export const sourceClaimStatus = pgEnum("source_claim_status", sourceClaimStatuses);

export const sourceClaimEdgeKind = pgEnum("source_claim_edge_kind", sourceClaimEdgeKinds);

export const sourceDecisionStatus = pgEnum("source_decision_status", sourceDecisionStatuses);

export const sourceDecisionTargetType = pgEnum(
  "source_decision_target_type",
  sourceDecisionTargetTypes
);

export const sourceDecisionEdgeConfidence = pgEnum(
  "source_decision_edge_confidence",
  sourceDecisionEdgeConfidences
);

export const sourceRejectionReason = pgEnum("source_rejection_reason", sourceRejectionReasons);

export const sourceArtifacts = pgTable(
  "source_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: nullableProjectIdColumn(),
    importId: text("import_id"),
    importRowId: text("import_row_id"),
    kind: sourceArtifactKind("kind").notNull(),
    sourceAuthority: sourceAuthorityLabel("trust_tier").notNull(),
    uri: text("uri").notNull(),
    title: text("title").notNull(),
    contentHash: text("content_hash").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
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

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    uniqueIndex("source_chunks_artifact_ordinal_unique").on(
      table.sourceArtifactId,
      table.ordinal
    ),
    index("source_chunks_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_chunks_content_hash_idx").on(table.contentHash)
  ]
);

export const sourceClaims = pgTable(
  "source_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    index("source_claims_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_claims_source_chunk_id_idx").on(table.sourceChunkId),
    index("source_claims_execution_run_id_idx").on(table.executionRunId),
    index("source_claims_trust_tier_idx").on(table.sourceAuthority),
    index("source_claims_support_type_idx").on(table.supportType),
    index("source_claims_consumer_idx").on(table.consumer),
    index("source_claims_status_idx").on(table.status)
  ]
);

export const sourceClaimEdges = pgTable(
  "source_claim_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    index("source_claim_edges_from_idx").on(table.fromSourceClaimId),
    index("source_claim_edges_to_idx").on(table.toSourceClaimId),
    index("source_claim_edges_kind_idx").on(table.kind)
  ]
);

export const sourceDecisions = pgTable(
  "source_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    index("source_decisions_project_id_idx").on(table.projectId),
    index("source_decisions_source_claim_id_idx").on(table.sourceClaimId),
    index("source_decisions_status_idx").on(table.status),
    index("source_decisions_consumer_idx").on(table.consumer),
    uniqueIndex("source_decisions_terminal_claim_unique")
      .on(table.sourceClaimId)
      .where(sql`${table.status} in ('adopt', 'reject')`)
  ]
);

export const sourceDecisionEdges = pgTable(
  "source_decision_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceClaimId: uuid("source_claim_id")
      .notNull()
      .references(() => sourceClaims.id, { onDelete: "cascade" }),
    sourceDecisionId: uuid("source_decision_id").references(() => sourceDecisions.id, {
      onDelete: "set null"
    }),
    targetType: sourceDecisionTargetType("target_type").notNull(),
    targetId: text("target_id").notNull(),
    supportType: sourceSupportType("support_type").notNull(),
    confidence: sourceDecisionEdgeConfidence("confidence").notNull(),
    notes: text("notes").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    index("source_decision_edges_source_claim_id_idx").on(table.sourceClaimId),
    index("source_decision_edges_source_decision_id_idx").on(table.sourceDecisionId),
    index("source_decision_edges_target_idx").on(table.targetType, table.targetId),
    index("source_decision_edges_support_type_idx").on(table.supportType),
    index("source_decision_edges_confidence_idx").on(table.confidence)
  ]
);

export const sourceRejections = pgTable(
  "source_rejections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    rejectedAt: timestamp("rejected_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("source_rejections_project_id_idx").on(table.projectId),
    index("source_rejections_execution_run_id_idx").on(table.executionRunId),
    index("source_rejections_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_rejections_source_claim_id_idx").on(table.sourceClaimId),
    index("source_rejections_consumer_idx").on(table.consumer),
    index("source_rejections_rejected_because_idx").on(table.rejectedBecause)
  ]
);

export const sourceSnapshots = pgTable(
  "source_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceArtifactId: uuid("source_artifact_id")
      .notNull()
      .references(() => sourceArtifacts.id, { onDelete: "cascade" }),
    snapshotUri: text("snapshot_uri").notNull(),
    contentHash: text("content_hash").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    uniqueIndex("source_snapshots_artifact_hash_unique").on(
      table.sourceArtifactId,
      table.contentHash
    ),
    index("source_snapshots_source_artifact_id_idx").on(table.sourceArtifactId)
  ]
);
