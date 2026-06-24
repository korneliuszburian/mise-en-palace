import { describe, expect, it } from "vitest";
import type {
  EvidenceBundle,
  EvalCandidate,
  MemoryCandidate,
  SourceDecision
} from "@krn/core";

import {
  mapFeedbackDelta,
  mapSourceClaim
} from "./mappers.js";
import * as mapperExports from "./mappers.js";

const createdAt = new Date("2026-06-21T12:00:00.000Z");
const updatedAt = new Date("2026-06-21T12:30:00.000Z");

const mapper = (name: string): ((row: unknown) => unknown) => {
  const exportsByName = mapperExports as Record<string, unknown>;
  const value = exportsByName[name];

  expect(value).toBeTypeOf("function");

  return value as (row: unknown) => unknown;
};

const memoryCandidate: MemoryCandidate = {
  id: "memory-candidate-1",
  projectId: "project-1",
  proposedBy: "review",
  kind: "constraint",
  status: "candidate",
  summary: "Persist run identities",
  body: "Persisted evidence must link back to an execution run.",
  owner: "kernel",
  confidence: 90,
  applicationGuidance: "Use when implementing persisted evidence capture.",
  sourceClaimIds: [],
  sourceLineage: [{ sourceId: "source-1" }],
  isUserPreference: false,
  validFrom: createdAt.toISOString(),
  metadata: {},
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
};

const sourceDecision: SourceDecision = {
  id: "source-decision-1",
  projectId: "project-1",
  sourceClaimId: "source-claim-1",
  status: "adopt",
  decision: "Use the existing harness tables.",
  rationale: "The schema already has the primary run spine tables.",
  falsifier: "Readback cannot link evidence to a run.",
  consumer: "M21",
  metadata: {},
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
};

const evalCandidate: EvalCandidate = {
  id: "eval-candidate-1",
  projectId: "project-1",
  status: "candidate",
  title: "Persisted evidence readback",
  scenario: "Capture evidence for a persisted run.",
  expectedSignal: "Run aggregate includes evidence and feedback.",
  sourceEvidence: ["source-1"],
  metadata: {},
  createdAt: createdAt.toISOString()
};

describe("mapFeedbackDelta", () => {
  it("preserves persisted memory, source, and eval candidates", () => {
    const result = mapFeedbackDelta({
      id: "feedback-delta-1",
      reviewAssessmentId: "review-1",
      status: "candidate",
      memoryCandidates: [memoryCandidate],
      sourceDecisions: [sourceDecision],
      evalCandidates: [evalCandidate],
      metadata: { persisted: true },
      createdAt,
      updatedAt
    });

    expect(result.memoryCandidates).toEqual([memoryCandidate]);
    expect(result.sourceDecisions).toEqual([sourceDecision]);
    expect(result.evalCandidates).toEqual([evalCandidate]);
  });
});

describe("evidence bundle mappers", () => {
  it("normalizes legacy and rich command rows from persisted JSON", () => {
    const mapEvidenceBundle = mapper("mapEvidenceBundle") as (
      row: unknown
    ) => EvidenceBundle;

    const result = mapEvidenceBundle({
      id: "evidence-bundle-1",
      executionRunId: "execution-run-1",
      status: "captured",
      changedFiles: ["packages/cli/src/runEvidenceCaptureCommand.ts"],
      commands: [
        {
          command: "pnpm typecheck",
          status: "passed",
          exitCode: 0,
          outputPath: ".local-lab/typecheck.txt"
        },
        {
          command: "pnpm test",
          status: "skipped"
        },
        {
          command: "bad command",
          status: "maybe"
        }
      ],
      diffRisk: "medium",
      reviewBurden: "Review command provenance.",
      rollbackPath: "git revert <commit>",
      metadata: {},
      createdAt,
      updatedAt
    });

    expect(result.commands).toEqual([
      {
        kind: "captured_output_file",
        command: "pnpm typecheck",
        status: "passed",
        exitCode: 0,
        outputPath: ".local-lab/typecheck.txt",
        outputRef: ".local-lab/typecheck.txt",
        provenance: "captured_output_file",
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        kind: "default_template",
        command: "pnpm test",
        status: "skipped",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      }
    ]);
  });
});

describe("source graph mappers", () => {
  it("maps M22 source claims with run linkage and review status", () => {
    const result = mapSourceClaim({
      id: "source-claim-1",
      sourceArtifactId: "artifact-1",
      sourceChunkId: null,
      executionRunId: "run-1",
      claim: "Source claims should link to runs.",
      mechanism: "Run linkage makes source decisions auditable.",
      krnImplication: "KRN can show why a run used a source pattern.",
      doesNotProve: "This does not prove retrieval quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M22",
      falsifier: null,
      revisitWhen: "Repository smoke fails",
      status: "proposed",
      metadata: {},
      createdAt,
      updatedAt
    });

    expect(result).toMatchObject({
      executionRunId: "run-1",
      status: "proposed",
      revisitWhen: "Repository smoke fails"
    });
  });

  it("maps typed source decision edges", () => {
    const mapSourceDecisionEdge = mapper("mapSourceDecisionEdge");

    const result = mapSourceDecisionEdge({
      id: "source-decision-edge-1",
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      targetId: "run-1",
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: "Used to justify Postgres-backed source graph edges.",
      metadata: { slice: "M22.04" },
      createdAt
    });

    expect(result).toMatchObject({
      id: "source-decision-edge-1",
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      supportType: "implementation-boundary",
      confidence: "medium"
    });
  });

  it("maps source rejections without promoting them to trusted claims", () => {
    const mapSourceRejection = mapper("mapSourceRejection");

    const result = mapSourceRejection({
      id: "source-rejection-1",
      projectId: null,
      executionRunId: "run-1",
      sourceArtifactId: null,
      sourceClaimId: null,
      title: "Decorative AI engineering link",
      attemptedClaim: "Interesting AI link should influence KRN.",
      rejectedBecause: "decorative",
      reason: "No mechanism, consumer, or decision support.",
      doesNotProve: "The link should change KRN behavior.",
      consumer: "M22",
      metadata: {},
      rejectedAt: createdAt
    });

    expect(result).toMatchObject({
      executionRunId: "run-1",
      rejectedBecause: "decorative",
      attemptedClaim: "Interesting AI link should influence KRN."
    });
  });
});

describe("retrieval substrate mappers", () => {
  it("maps M24 search document and embedding read models", () => {
    const mapSearchDocument = mapper("mapSearchDocument");
    const mapEmbeddingModel = mapper("mapEmbeddingModel");
    const mapEmbedding = mapper("mapEmbedding");

    expect(
      mapSearchDocument({
        id: "search-document-1",
        projectId: "project-1",
        subjectType: "source_claim",
        subjectId: "source-claim-1",
        sourceArtifactId: null,
        sourceChunkId: null,
        sourceClaimId: "source-claim-1",
        memoryRecordId: null,
        antiMemoryRecordId: null,
        evidenceBundleId: null,
        reviewAssessmentId: null,
        sourceDecisionId: null,
        runEventId: null,
        trustTier: "project-decision",
        validityStatus: "active",
        language: "english",
        title: "Source graph Postgres edge tables",
        body: "Use Postgres source decision edges before adding a separate graph DB.",
        searchText:
          "Source graph Postgres edge tables\nUse Postgres source decision edges before adding a separate graph DB.",
        searchVector: null,
        metadataFilters: { consumer: "M24" },
        validFrom: createdAt,
        validUntil: null,
        invalidatedAt: null,
        metadata: { smokeId: "retrieval-smoke" },
        createdAt,
        updatedAt
      })
    ).toMatchObject({
      sourceClaimId: "source-claim-1",
      searchText:
        "Source graph Postgres edge tables\nUse Postgres source decision edges before adding a separate graph DB.",
      metadataFilters: { consumer: "M24" }
    });

    expect(
      mapEmbeddingModel({
        id: "embedding-model-1",
        provider: "local-smoke",
        model: "smoke-1536",
        dimensions: 1536,
        distanceMetric: "cosine",
        status: "active",
        metadata: {},
        createdAt,
        updatedAt
      })
    ).toMatchObject({
      provider: "local-smoke",
      dimensions: 1536
    });

    expect(
      mapEmbedding({
        id: "embedding-1",
        projectId: "project-1",
        embeddingModelId: "embedding-model-1",
        subjectType: "search_document",
        subjectId: "search-document-1",
        sourceArtifactId: null,
        sourceChunkId: null,
        sourceClaimId: null,
        memoryRecordId: null,
        antiMemoryRecordId: null,
        searchDocumentId: "search-document-1",
        embedding: [0, 1, 0],
        contentHash: "smoke-hash",
        trustTier: "project-decision",
        validityStatus: "active",
        metadataFilters: {},
        validFrom: createdAt,
        validUntil: null,
        invalidatedAt: null,
        metadata: {},
        createdAt,
        updatedAt
      })
    ).toMatchObject({
      searchDocumentId: "search-document-1",
      embedding: [0, 1, 0],
      contentHash: "smoke-hash"
    });
  });

  it("maps M24 retrieval run, candidate, and activation fields", () => {
    const mapRetrievalRun = mapper("mapRetrievalRun");
    const mapRetrievalCandidate = mapper("mapRetrievalCandidate");
    const mapActivationDecision = mapper("mapActivationDecision");

    expect(
      mapRetrievalRun({
        id: "retrieval-run-1",
        projectId: "project-1",
        executionRunId: "execution-run-1",
        taskContractId: null,
        status: "running",
        query: "source graph postgres edge tables",
        mode: "hybrid",
        budget: 4000,
        tokenBudget: null,
        metadataFilters: {},
        startedAt: createdAt,
        completedAt: null,
        metadata: {},
        createdAt
      })
    ).toMatchObject({
      executionRunId: "execution-run-1",
      mode: "hybrid",
      budget: 4000,
      createdAt: createdAt.toISOString()
    });

    expect(
      mapRetrievalCandidate({
        id: "candidate-1",
        retrievalRunId: "retrieval-run-1",
        kind: "search",
        status: "candidate",
        subjectType: "search_document",
        subjectId: "search-document-1",
        searchDocumentId: "search-document-1",
        trustTier: "project-decision",
        lexicalScore: 90,
        vectorScore: null,
        graphScore: null,
        temporalScore: null,
        contextRoiScore: null,
        totalScore: null,
        score: 95,
        reason: "Lexical match plus trusted source metadata.",
        metadata: {},
        createdAt
      })
    ).toMatchObject({
      searchDocumentId: "search-document-1",
      score: 95
    });

    expect(
      mapActivationDecision({
        id: "activation-decision-1",
        retrievalRunId: "retrieval-run-1",
        retrievalCandidateId: "candidate-1",
        contextAssemblyId: null,
        subjectType: "search_document",
        subjectId: "search-document-1",
        decision: "included",
        reason: "High trust and directly relevant.",
        score: 95,
        contextBudgetCost: 240,
        expectedDecisionImpact: "Supports choosing Postgres edge tables.",
        metadata: {},
        createdAt
      })
    ).toMatchObject({
      retrievalCandidateId: "candidate-1",
      contextBudgetCost: 240,
      expectedDecisionImpact: "Supports choosing Postgres edge tables."
    });
  });
});

describe("memory governance mappers", () => {
  it("maps M23 memory candidate review and lineage fields", () => {
    const mapMemoryCandidate = mapper("mapMemoryCandidate");

    const result = mapMemoryCandidate({
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "run-1",
      feedbackDeltaId: null,
      proposedBy: "codex",
      kind: "constraint",
      status: "accepted",
      summary: "Keep memory store-backed",
      body: "Runtime Memory Core must be backed by the brain store.",
      owner: "kernel",
      confidence: 94,
      applicationGuidance: "Apply when adding memory governance behavior.",
      invalidationRule: "Revisit when runtime memory stops using Postgres.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-1" }],
      isUserPreference: false,
      reviewer: "operator",
      reviewedAt: createdAt,
      rejectionReason: null,
      validFrom: createdAt,
      validUntil: updatedAt,
      metadata: { slice: "M23.03" },
      createdAt,
      updatedAt
    });

    expect(result).toMatchObject({
      executionRunId: "run-1",
      sourceClaimIds: ["source-claim-1"],
      invalidationRule: "Revisit when runtime memory stops using Postgres.",
      reviewer: "operator",
      reviewedAt: createdAt.toISOString(),
      validUntil: updatedAt.toISOString()
    });
  });

  it("maps M23 memory records with current version and invalidation rule", () => {
    const mapMemoryRecord = mapper("mapMemoryRecord");

    const result = mapMemoryRecord({
      id: "memory-record-1",
      projectId: "project-1",
      currentVersionId: "memory-version-1",
      key: "memory:store-backed",
      kind: "constraint",
      status: "active",
      summary: "Keep memory store-backed",
      body: "Runtime Memory Core must be backed by the brain store.",
      owner: "kernel",
      confidence: 94,
      applicationGuidance: "Apply when adding memory governance behavior.",
      invalidationRule: "Revisit when runtime memory stops using Postgres.",
      sourceLineage: [{ sourceId: "source-1" }],
      isUserPreference: false,
      validFrom: createdAt,
      validUntil: null,
      invalidatedAt: null,
      invalidationReason: null,
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
      metadata: {},
      createdAt,
      updatedAt
    });

    expect(result).toMatchObject({
      currentVersionId: "memory-version-1",
      invalidationRule: "Revisit when runtime memory stops using Postgres.",
      positiveFeedbackCount: 1
    });
  });

  it("maps M23 memory applications as typed read models", () => {
    const mapMemoryApplication = mapper("mapMemoryApplication");

    const result = mapMemoryApplication({
      id: "memory-application-1",
      memoryRecordId: "memory-record-1",
      executionRunId: "run-1",
      taskContractId: null,
      contextAssemblyId: null,
      expectedUse: "Guide storage decisions.",
      outcome: "helped",
      notes: "Prevented adding a separate memory store.",
      metadata: {},
      createdAt
    });

    expect(result).toMatchObject({
      id: "memory-application-1",
      memoryRecordId: "memory-record-1",
      executionRunId: "run-1",
      outcome: "helped"
    });
  });

  it("maps M23 anti-memory source and run linkage", () => {
    const mapAntiMemoryRecord = mapper("mapAntiMemoryRecord");

    const result = mapAntiMemoryRecord({
      id: "anti-memory-1",
      projectId: "project-1",
      executionRunId: "run-1",
      createdFromCandidateId: null,
      key: "anti:markdown-runtime-memory",
      rejectedClaim: "Markdown files are runtime memory.",
      reason: "Markdown may be audit/source/export, not Memory Core.",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      invalidatedBySourceClaimId: "source-claim-1",
      appliesTo: "memory governance",
      mayRevisitWhen: "Brain store is removed.",
      summary: "Markdown is not runtime memory",
      body: "Do not treat markdown files as Memory Core.",
      owner: "kernel",
      confidence: 99,
      sourceLineage: [{ sourceId: "source-1" }],
      validFrom: createdAt,
      validUntil: null,
      invalidatedAt: null,
      invalidationReason: null,
      metadata: {},
      createdAt,
      updatedAt
    });

    expect(result).toMatchObject({
      executionRunId: "run-1",
      rejectedClaim: "Markdown files are runtime memory.",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      invalidatedBySourceClaimId: "source-claim-1",
      appliesTo: "memory governance"
    });
  });
});
