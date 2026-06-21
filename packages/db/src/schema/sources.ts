import { sql } from "drizzle-orm/sql";
import {
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

import { projects } from "./harness.js";

type JsonObject = Record<string, unknown>;

const emptyJsonObject = sql`'{}'::jsonb`;

export const sourceArtifactKind = pgEnum("source_artifact_kind", [
  "doc",
  "file",
  "url",
  "paper",
  "run",
  "operator_input",
  "external_doc"
]);

export const sourceTrustTier = pgEnum("source_trust_tier", [
  "high",
  "medium",
  "low"
]);

export const sourceSupportType = pgEnum("source_support_type", [
  "supports",
  "contradicts",
  "qualifies",
  "background",
  "does_not_support"
]);

export const sourceClaimEdgeKind = pgEnum("source_claim_edge_kind", [
  "supports",
  "contradicts",
  "qualifies",
  "depends_on",
  "supersedes",
  "duplicates"
]);

export const sourceDecisionStatus = pgEnum("source_decision_status", [
  "adopt",
  "reject",
  "defer",
  "lab_test"
]);

export const sourceArtifacts = pgTable(
  "source_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    kind: sourceArtifactKind("kind").notNull(),
    trustTier: sourceTrustTier("trust_tier").notNull(),
    uri: text("uri").notNull(),
    title: text("title").notNull(),
    contentHash: text("content_hash").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("source_artifacts_uri_hash_unique").on(table.uri, table.contentHash),
    index("source_artifacts_project_id_idx").on(table.projectId),
    index("source_artifacts_kind_idx").on(table.kind),
    index("source_artifacts_trust_tier_idx").on(table.trustTier)
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
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
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
    claim: text("claim").notNull(),
    mechanism: text("mechanism").notNull(),
    krnImplication: text("krn_implication").notNull(),
    doesNotProve: text("does_not_prove").notNull(),
    trustTier: sourceTrustTier("trust_tier").notNull(),
    supportType: sourceSupportType("support_type").notNull(),
    consumer: text("consumer").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("source_claims_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_claims_source_chunk_id_idx").on(table.sourceChunkId),
    index("source_claims_trust_tier_idx").on(table.trustTier),
    index("source_claims_support_type_idx").on(table.supportType),
    index("source_claims_consumer_idx").on(table.consumer)
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
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
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
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    sourceClaimId: uuid("source_claim_id").references(() => sourceClaims.id, {
      onDelete: "set null"
    }),
    status: sourceDecisionStatus("status").notNull(),
    decision: text("decision").notNull(),
    rationale: text("rationale").notNull(),
    falsifier: text("falsifier").notNull(),
    consumer: text("consumer").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("source_decisions_project_id_idx").on(table.projectId),
    index("source_decisions_source_claim_id_idx").on(table.sourceClaimId),
    index("source_decisions_status_idx").on(table.status),
    index("source_decisions_consumer_idx").on(table.consumer)
  ]
);

export const sourceRejections = pgTable(
  "source_rejections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    sourceArtifactId: uuid("source_artifact_id").references(() => sourceArtifacts.id, {
      onDelete: "set null"
    }),
    sourceClaimId: uuid("source_claim_id").references(() => sourceClaims.id, {
      onDelete: "set null"
    }),
    reason: text("reason").notNull(),
    doesNotProve: text("does_not_prove").notNull(),
    consumer: text("consumer").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("source_rejections_project_id_idx").on(table.projectId),
    index("source_rejections_source_artifact_id_idx").on(table.sourceArtifactId),
    index("source_rejections_source_claim_id_idx").on(table.sourceClaimId),
    index("source_rejections_consumer_idx").on(table.consumer)
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
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("source_snapshots_artifact_hash_unique").on(
      table.sourceArtifactId,
      table.contentHash
    ),
    index("source_snapshots_source_artifact_id_idx").on(table.sourceArtifactId)
  ]
);
