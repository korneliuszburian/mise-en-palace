import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

import {
  enumChecks,
  sqliteEnum,
  sqliteNow,
  sqliteUuidDefault,
  timestamp,
  tsvector,
  uuid,
  vector
} from "./dialect.js";

import {
  contextExclusionReasons,
  embeddingModelStatuses,
  retrievalActivationDecisionStatuses,
  retrievalCandidateKinds,
  retrievalCandidateStatuses,
  retrievalRunModes,
  retrievalRunStatuses,
  retrievalSubjectTypes,
  retrievalValidityStatuses
} from "@krn/core";

import {
  antiMemoryRecords,
  memoryRecords
} from "./memory.js";
import {
  createdAtColumn,
  jsonObjectColumn,
  metadataColumn,
  updatedAtColumn
} from "./columns.js";
import {
  contextAssemblies,
  evidenceBundles,
  reviewAssessments,
} from "./harness.js";
import {
  executionRunIdColumn,
  nullableProjectIdColumn,
  taskContractIdColumn
} from "./reference-columns.js";
import { runEvents } from "./events.js";
import {
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisions,
  sourceAuthorityLabel
} from "./sources.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "../../sql/pgvector.js";

const embeddingDimensions = (column: import("drizzle-orm/sql").SQLWrapper) =>
  sql`json_array_length(${column}) = ${sql.raw(String(DEFAULT_EMBEDDING_DIMENSIONS))}`;

export const embeddingModelStatus = sqliteEnum("embedding_model_status", embeddingModelStatuses);

export const retrievalSubjectType = sqliteEnum("retrieval_subject_type", retrievalSubjectTypes);

export const retrievalValidityStatus = sqliteEnum(
  "retrieval_validity_status",
  retrievalValidityStatuses
);

export const retrievalRunStatus = sqliteEnum("retrieval_run_status", retrievalRunStatuses);

export const retrievalRunMode = sqliteEnum("retrieval_run_mode", retrievalRunModes);

export const retrievalCandidateKind = sqliteEnum("retrieval_candidate_kind", retrievalCandidateKinds);

export const retrievalCandidateStatus = sqliteEnum(
  "retrieval_candidate_status",
  retrievalCandidateStatuses
);

export const activationDecisionStatus = sqliteEnum(
  "activation_decision_status",
  retrievalActivationDecisionStatuses
);

export const contextExclusionReason = sqliteEnum("context_exclusion_reason", contextExclusionReasons);

const projectScopeColumn = () => ({
  projectId: nullableProjectIdColumn()
});

const retrievalSubjectColumns = () => ({
  subjectType: retrievalSubjectType("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull()
});

const retrievalSourceMemoryReferenceColumns = () => ({
  sourceArtifactId: uuid("source_artifact_id").references(() => sourceArtifacts.id, {
    onDelete: "set null"
  }),
  sourceChunkId: uuid("source_chunk_id").references(() => sourceChunks.id, {
    onDelete: "set null"
  }),
  sourceClaimId: uuid("source_claim_id").references(() => sourceClaims.id, {
    onDelete: "set null"
  }),
  memoryRecordId: uuid("memory_record_id").references(() => memoryRecords.id, {
    onDelete: "set null"
  }),
  antiMemoryRecordId: uuid("anti_memory_record_id").references(() => antiMemoryRecords.id, {
    onDelete: "set null"
  })
});

const retrievalTrustValidityColumns = () => ({
  sourceAuthority: sourceAuthorityLabel("trust_tier").notNull().default("medium"),
  validityStatus: retrievalValidityStatus("validity_status").notNull().default("active")
});

const retrievalValidityWindowColumns = () => ({
  metadataFilters: jsonObjectColumn("metadata_filters"),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull().default(sqliteNow),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
  metadata: metadataColumn()
});

const contextAssemblyReferenceColumn = () => ({
  contextAssemblyId: uuid("context_assembly_id")
    .notNull()
    .references(() => contextAssemblies.id, { onDelete: "cascade" })
});

const contextSubjectColumns = () => ({
  ...contextAssemblyReferenceColumn(),
  ...retrievalSubjectColumns()
});

export const embeddingModels = sqliteTable(
  "embedding_models",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    dimensions: integer("dimensions").notNull(),
    distanceMetric: text("distance_metric").notNull(),
    status: embeddingModelStatus("status").notNull().default("active"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("embedding_models", table),
    index("embedding_models_provider_model_idx").on(table.provider, table.model),
    index("embedding_models_status_idx").on(table.status)
  ]
);

export const embeddings = sqliteTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    ...projectScopeColumn(),
    embeddingModelId: uuid("embedding_model_id")
      .notNull()
      .references(() => embeddingModels.id, { onDelete: "restrict" }),
    ...retrievalSubjectColumns(),
    ...retrievalSourceMemoryReferenceColumns(),
    searchDocumentId: uuid("search_document_id").references(() => searchDocuments.id, {
      onDelete: "set null"
    }),
    embedding: vector("embedding", { dimensions: DEFAULT_EMBEDDING_DIMENSIONS }).notNull(),
    contentHash: text("content_hash").notNull(),
    ...retrievalTrustValidityColumns(),
    ...retrievalValidityWindowColumns(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("embeddings", table),
    check("embeddings_embedding_dimensions", embeddingDimensions(table.embedding)),
    index("embeddings_project_id_idx").on(table.projectId),
    index("embeddings_model_id_idx").on(table.embeddingModelId),
    index("embeddings_search_document_id_idx").on(table.searchDocumentId),
    index("embeddings_subject_idx").on(table.subjectType, table.subjectId),
    index("embeddings_validity_status_idx").on(table.validityStatus),
    index("embeddings_valid_until_idx").on(table.validUntil)
    // sqlite-vec attachment and embeddings_embedding_hnsw_idx are task 1.4 scope.
  ]
);

export const searchDocuments = sqliteTable(
  "search_documents",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    ...projectScopeColumn(),
    ...retrievalSubjectColumns(),
    ...retrievalSourceMemoryReferenceColumns(),
    evidenceBundleId: uuid("evidence_bundle_id").references(() => evidenceBundles.id, {
      onDelete: "set null"
    }),
    reviewAssessmentId: uuid("review_assessment_id").references(() => reviewAssessments.id, {
      onDelete: "set null"
    }),
    sourceDecisionId: uuid("source_decision_id").references(() => sourceDecisions.id, {
      onDelete: "set null"
    }),
    runEventId: uuid("run_event_id").references(() => runEvents.id, {
      onDelete: "set null"
    }),
    ...retrievalTrustValidityColumns(),
    language: text("language").notNull().default("english"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    searchText: text("search_text").notNull().default(""),
    searchVector: tsvector("search_vector"),
    ...retrievalValidityWindowColumns(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    ...enumChecks("search_documents", table),
    check(
      "search_documents_validity_window",
      sql`(${table.validUntil} IS NULL OR ${table.validUntil} > ${table.validFrom})
        AND (${table.invalidatedAt} IS NULL OR ${table.invalidatedAt} >= ${table.validFrom})`
    ),
    check(
      "search_documents_validity_status_timestamps",
      sql`(
        (${table.validityStatus} = 'invalidated' AND ${table.invalidatedAt} IS NOT NULL)
        OR (${table.validityStatus} IN ('active', 'expired') AND ${table.invalidatedAt} IS NULL)
      )`
    ),
    index("search_documents_project_id_idx").on(table.projectId),
    index("search_documents_subject_idx").on(table.subjectType, table.subjectId),
    index("search_documents_evidence_bundle_id_idx").on(table.evidenceBundleId),
    index("search_documents_review_assessment_id_idx").on(table.reviewAssessmentId),
    index("search_documents_source_decision_id_idx").on(table.sourceDecisionId),
    index("search_documents_run_event_id_idx").on(table.runEventId),
    index("search_documents_validity_status_idx").on(table.validityStatus),
    index("search_documents_valid_until_idx").on(table.validUntil)
    // PostgreSQL's GIN tsvector index has no truthful SQLite B-tree equivalent.
  ]
);

export const retrievalRuns = sqliteTable(
  "retrieval_runs",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    projectId: nullableProjectIdColumn(),
    executionRunId: executionRunIdColumn(),
    taskContractId: taskContractIdColumn(),
    status: retrievalRunStatus("status").notNull().default("running"),
    query: text("query").notNull(),
    mode: retrievalRunMode("mode").notNull().default("mixed"),
    budget: integer("budget"),
    tokenBudget: integer("token_budget"),
    metadataFilters: jsonObjectColumn("metadata_filters"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().default(sqliteNow),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("retrieval_runs", table),
    index("retrieval_runs_project_id_idx").on(table.projectId),
    index("retrieval_runs_execution_run_id_idx").on(table.executionRunId),
    index("retrieval_runs_task_contract_id_idx").on(table.taskContractId),
    index("retrieval_runs_status_idx").on(table.status)
  ]
);

export const retrievalCandidates = sqliteTable(
  "retrieval_candidates",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    retrievalRunId: uuid("retrieval_run_id")
      .notNull()
      .references(() => retrievalRuns.id, { onDelete: "cascade" }),
    kind: retrievalCandidateKind("kind").notNull(),
    status: retrievalCandidateStatus("status").notNull().default("candidate"),
    subjectType: retrievalSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    searchDocumentId: uuid("search_document_id").references(() => searchDocuments.id, {
      onDelete: "set null"
    }),
    sourceAuthority: sourceAuthorityLabel("trust_tier").notNull().default("medium"),
    lexicalScore: integer("lexical_score"),
    vectorScore: integer("vector_score"),
    graphScore: integer("graph_score"),
    temporalScore: integer("temporal_score"),
    contextRoiScore: integer("context_roi_score"),
    totalScore: integer("total_score"),
    score: integer("score"),
    reason: text("reason").notNull(),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("retrieval_candidates", table),
    index("retrieval_candidates_retrieval_run_id_idx").on(table.retrievalRunId),
    index("retrieval_candidates_status_idx").on(table.status),
    index("retrieval_candidates_subject_idx").on(table.subjectType, table.subjectId),
    index("retrieval_candidates_search_document_id_idx").on(table.searchDocumentId),
    index("retrieval_candidates_total_score_idx").on(table.totalScore)
  ]
);

export const activationDecisions = sqliteTable(
  "activation_decisions",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    retrievalRunId: uuid("retrieval_run_id")
      .notNull()
      .references(() => retrievalRuns.id, { onDelete: "cascade" }),
    retrievalCandidateId: uuid("retrieval_candidate_id").references(() => retrievalCandidates.id, {
      onDelete: "set null"
    }),
    contextAssemblyId: uuid("context_assembly_id").references(() => contextAssemblies.id, {
      onDelete: "set null"
    }),
    subjectType: retrievalSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    decision: activationDecisionStatus("decision").notNull(),
    reason: text("reason").notNull(),
    score: integer("score"),
    contextBudgetCost: integer("context_budget_cost"),
    expectedDecisionImpact: text("expected_decision_impact"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("activation_decisions", table),
    index("activation_decisions_retrieval_run_id_idx").on(table.retrievalRunId),
    index("activation_decisions_retrieval_candidate_id_idx").on(table.retrievalCandidateId),
    index("activation_decisions_context_assembly_id_idx").on(table.contextAssemblyId),
    index("activation_decisions_subject_idx").on(table.subjectType, table.subjectId),
    index("activation_decisions_decision_idx").on(table.decision)
  ]
);

export const contextItems = sqliteTable(
  "context_items",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    ...contextSubjectColumns(),
    position: integer("position").notNull(),
    reason: text("reason").notNull(),
    expectedUse: text("expected_use").notNull(),
    tokenEstimate: integer("token_estimate"),
    sourceAuthority: sourceAuthorityLabel("trust_tier").notNull().default("medium"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("context_items", table),
    index("context_items_context_assembly_id_idx").on(table.contextAssemblyId),
    index("context_items_subject_idx").on(table.subjectType, table.subjectId),
    index("context_items_position_idx").on(table.position)
  ]
);

export const contextExclusions = sqliteTable(
  "context_exclusions",
  {
    id: uuid("id").primaryKey().default(sqliteUuidDefault),
    ...contextSubjectColumns(),
    reason: contextExclusionReason("reason").notNull(),
    explanation: text("explanation").notNull(),
    score: integer("score"),
    sourceAuthority: sourceAuthorityLabel("trust_tier").notNull().default("medium"),
    metadata: metadataColumn(),
    createdAt: createdAtColumn()
  },
  (table) => [
    ...enumChecks("context_exclusions", table),
    index("context_exclusions_context_assembly_id_idx").on(table.contextAssemblyId),
    index("context_exclusions_subject_idx").on(table.subjectType, table.subjectId),
    index("context_exclusions_reason_idx").on(table.reason)
  ]
);
