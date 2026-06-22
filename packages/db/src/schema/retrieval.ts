import { sql } from "drizzle-orm/sql";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core/columns/vector_extension/vector";

import {
  antiMemoryRecords,
  memoryRecords
} from "./memory.js";
import {
  contextAssemblies,
  evidenceBundles,
  executionRuns,
  projects,
  reviewAssessments,
  taskContracts
} from "./harness.js";
import { runEvents } from "./events.js";
import {
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisions,
  sourceTrustTier
} from "./sources.js";
import { tsvector } from "../sql/fullTextSearch.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "../sql/pgvector.js";

type JsonObject = Record<string, unknown>;

const emptyJsonObject = sql`'{}'::jsonb`;

export const embeddingModelStatus = pgEnum("embedding_model_status", [
  "active",
  "deprecated",
  "disabled"
]);

export const retrievalSubjectType = pgEnum("retrieval_subject_type", [
  "source_artifact",
  "source_chunk",
  "source_claim",
  "memory_record",
  "anti_memory_record",
  "task_contract",
  "search_document",
  "evidence_bundle",
  "review_assessment",
  "architecture_decision",
  "run_event"
]);

export const retrievalValidityStatus = pgEnum("retrieval_validity_status", [
  "active",
  "expired",
  "invalidated"
]);

export const retrievalRunStatus = pgEnum("retrieval_run_status", [
  "running",
  "completed",
  "abstained",
  "failed"
]);

export const retrievalRunMode = pgEnum("retrieval_run_mode", [
  "lexical",
  "vector",
  "hybrid",
  "graph",
  "mixed"
]);

export const retrievalCandidateKind = pgEnum("retrieval_candidate_kind", [
  "memory",
  "anti_memory",
  "source",
  "search"
]);

export const retrievalCandidateStatus = pgEnum("retrieval_candidate_status", [
  "candidate",
  "included",
  "excluded"
]);

export const activationDecisionStatus = pgEnum("activation_decision_status", [
  "included",
  "excluded",
  "abstained",
  "deferred",
  "conflict",
  "stale"
]);

export const contextExclusionReason = pgEnum("context_exclusion_reason", [
  "stale",
  "invalidated",
  "low_trust",
  "low_context_roi",
  "over_budget",
  "duplicate",
  "irrelevant",
  "unsafe",
  "superseded"
]);

export const embeddingModels = pgTable(
  "embedding_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    dimensions: integer("dimensions").notNull(),
    distanceMetric: text("distance_metric").notNull(),
    status: embeddingModelStatus("status").notNull().default("active"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("embedding_models_provider_model_idx").on(table.provider, table.model),
    index("embedding_models_status_idx").on(table.status)
  ]
);

export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    embeddingModelId: uuid("embedding_model_id")
      .notNull()
      .references(() => embeddingModels.id, { onDelete: "restrict" }),
    subjectType: retrievalSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
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
    }),
    searchDocumentId: uuid("search_document_id").references(() => searchDocuments.id, {
      onDelete: "set null"
    }),
    embedding: vector("embedding", { dimensions: DEFAULT_EMBEDDING_DIMENSIONS }).notNull(),
    contentHash: text("content_hash").notNull(),
    trustTier: sourceTrustTier("trust_tier").notNull().default("medium"),
    validityStatus: retrievalValidityStatus("validity_status").notNull().default("active"),
    metadataFilters: jsonb("metadata_filters").$type<JsonObject>().notNull().default(emptyJsonObject),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("embeddings_project_id_idx").on(table.projectId),
    index("embeddings_model_id_idx").on(table.embeddingModelId),
    index("embeddings_search_document_id_idx").on(table.searchDocumentId),
    index("embeddings_subject_idx").on(table.subjectType, table.subjectId),
    index("embeddings_validity_status_idx").on(table.validityStatus),
    index("embeddings_valid_until_idx").on(table.validUntil),
    index("embeddings_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    )
  ]
);

export const searchDocuments = pgTable(
  "search_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    subjectType: retrievalSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
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
    }),
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
    trustTier: sourceTrustTier("trust_tier").notNull().default("medium"),
    validityStatus: retrievalValidityStatus("validity_status").notNull().default("active"),
    language: text("language").notNull().default("english"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    searchText: text("search_text").notNull().default(""),
    searchVector: tsvector("search_vector"),
    metadataFilters: jsonb("metadata_filters").$type<JsonObject>().notNull().default(emptyJsonObject),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("search_documents_project_id_idx").on(table.projectId),
    index("search_documents_subject_idx").on(table.subjectType, table.subjectId),
    index("search_documents_evidence_bundle_id_idx").on(table.evidenceBundleId),
    index("search_documents_review_assessment_id_idx").on(table.reviewAssessmentId),
    index("search_documents_source_decision_id_idx").on(table.sourceDecisionId),
    index("search_documents_run_event_id_idx").on(table.runEventId),
    index("search_documents_validity_status_idx").on(table.validityStatus),
    index("search_documents_valid_until_idx").on(table.validUntil),
    index("search_documents_search_vector_idx").using("gin", table.searchVector)
  ]
);

export const retrievalRuns = pgTable(
  "retrieval_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    executionRunId: uuid("execution_run_id").references(() => executionRuns.id, {
      onDelete: "set null"
    }),
    taskContractId: uuid("task_contract_id").references(() => taskContracts.id, {
      onDelete: "set null"
    }),
    status: retrievalRunStatus("status").notNull().default("running"),
    query: text("query").notNull(),
    mode: retrievalRunMode("mode").notNull().default("mixed"),
    budget: integer("budget"),
    tokenBudget: integer("token_budget"),
    metadataFilters: jsonb("metadata_filters").$type<JsonObject>().notNull().default(emptyJsonObject),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("retrieval_runs_project_id_idx").on(table.projectId),
    index("retrieval_runs_execution_run_id_idx").on(table.executionRunId),
    index("retrieval_runs_task_contract_id_idx").on(table.taskContractId),
    index("retrieval_runs_status_idx").on(table.status)
  ]
);

export const retrievalCandidates = pgTable(
  "retrieval_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    trustTier: sourceTrustTier("trust_tier").notNull().default("medium"),
    lexicalScore: integer("lexical_score"),
    vectorScore: integer("vector_score"),
    graphScore: integer("graph_score"),
    temporalScore: integer("temporal_score"),
    contextRoiScore: integer("context_roi_score"),
    totalScore: integer("total_score"),
    score: integer("score"),
    reason: text("reason").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("retrieval_candidates_retrieval_run_id_idx").on(table.retrievalRunId),
    index("retrieval_candidates_status_idx").on(table.status),
    index("retrieval_candidates_subject_idx").on(table.subjectType, table.subjectId),
    index("retrieval_candidates_search_document_id_idx").on(table.searchDocumentId),
    index("retrieval_candidates_total_score_idx").on(table.totalScore)
  ]
);

export const activationDecisions = pgTable(
  "activation_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("activation_decisions_retrieval_run_id_idx").on(table.retrievalRunId),
    index("activation_decisions_retrieval_candidate_id_idx").on(table.retrievalCandidateId),
    index("activation_decisions_context_assembly_id_idx").on(table.contextAssemblyId),
    index("activation_decisions_subject_idx").on(table.subjectType, table.subjectId),
    index("activation_decisions_decision_idx").on(table.decision)
  ]
);

export const contextItems = pgTable(
  "context_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contextAssemblyId: uuid("context_assembly_id")
      .notNull()
      .references(() => contextAssemblies.id, { onDelete: "cascade" }),
    subjectType: retrievalSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    position: integer("position").notNull(),
    reason: text("reason").notNull(),
    expectedUse: text("expected_use").notNull(),
    tokenEstimate: integer("token_estimate"),
    trustTier: sourceTrustTier("trust_tier").notNull().default("medium"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("context_items_context_assembly_id_idx").on(table.contextAssemblyId),
    index("context_items_subject_idx").on(table.subjectType, table.subjectId),
    index("context_items_position_idx").on(table.position)
  ]
);

export const contextExclusions = pgTable(
  "context_exclusions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contextAssemblyId: uuid("context_assembly_id")
      .notNull()
      .references(() => contextAssemblies.id, { onDelete: "cascade" }),
    subjectType: retrievalSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    reason: contextExclusionReason("reason").notNull(),
    explanation: text("explanation").notNull(),
    score: integer("score"),
    trustTier: sourceTrustTier("trust_tier").notNull().default("medium"),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default(emptyJsonObject),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("context_exclusions_context_assembly_id_idx").on(table.contextAssemblyId),
    index("context_exclusions_subject_idx").on(table.subjectType, table.subjectId),
    index("context_exclusions_reason_idx").on(table.reason)
  ]
);
