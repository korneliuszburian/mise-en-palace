import { describe, expect, it } from "vitest";
import type {
  ContextAssembly
} from "@krn/core";

import type {
  CompleteRetrievalRunInput,
  RecordActivationDecisionInput,
  RetrievalRepository
} from "../repositories/index.js";
import { persistActivationTrace } from "./activationEngine.js";
import type { RankedActivationCandidate } from "./types.js";

const now = "2026-06-23T10:00:00.000Z";

class TraceRepository implements Pick<
  RetrievalRepository,
  "addCandidate" | "recordActivationDecision" | "storeContextSelection" | "completeRetrievalRun"
> {
  readonly decisions: RecordActivationDecisionInput[] = [];
  readonly completedRuns: CompleteRetrievalRunInput[] = [];
  private candidateCount = 0;

  async addCandidate(input: Parameters<RetrievalRepository["addCandidate"]>[0]) {
    this.candidateCount += 1;

    return {
      id: `candidate-${this.candidateCount}`,
      retrievalRunId: input.retrievalRunId,
      kind: input.kind,
      status: input.status ?? "candidate",
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ...(input.searchDocumentId === undefined ? {} : { searchDocumentId: input.searchDocumentId }),
      trustTier: input.trustTier,
      ...(input.lexicalScore === undefined ? {} : { lexicalScore: input.lexicalScore }),
      ...(input.vectorScore === undefined ? {} : { vectorScore: input.vectorScore }),
      ...(input.graphScore === undefined ? {} : { graphScore: input.graphScore }),
      ...(input.temporalScore === undefined ? {} : { temporalScore: input.temporalScore }),
      ...(input.contextRoiScore === undefined ? {} : { contextRoiScore: input.contextRoiScore }),
      ...(input.totalScore === undefined ? {} : { totalScore: input.totalScore }),
      ...(input.score === undefined ? {} : { score: input.score }),
      reason: input.reason,
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }

  async recordActivationDecision(input: RecordActivationDecisionInput) {
    this.decisions.push(input);

    return {
      id: `decision-${this.decisions.length}`,
      retrievalRunId: input.retrievalRunId,
      ...(input.retrievalCandidateId === undefined
        ? {}
        : { retrievalCandidateId: input.retrievalCandidateId }),
      ...(input.contextAssemblyId === undefined
        ? {}
        : { contextAssemblyId: input.contextAssemblyId }),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      decision: input.decision,
      reason: input.reason,
      ...(input.score === undefined ? {} : { score: input.score }),
      ...(input.contextBudgetCost === undefined
        ? {}
        : { contextBudgetCost: input.contextBudgetCost }),
      ...(input.expectedDecisionImpact === undefined
        ? {}
        : { expectedDecisionImpact: input.expectedDecisionImpact }),
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }

  async storeContextSelection(): Promise<void> {}

  async completeRetrievalRun(input: CompleteRetrievalRunInput) {
    this.completedRuns.push(input);

    return {
      id: input.retrievalRunId,
      status: input.status,
      query: "activation trace decisions",
      mode: "mixed" as const,
      startedAt: now,
      completedAt: input.completedAt,
      metadataFilters: {},
      metadata: input.metadata ?? {},
      createdAt: now
    };
  }
}

const rankedCandidate = (
  overrides: Partial<RankedActivationCandidate>
): RankedActivationCandidate => ({
  id: "candidate-1",
  kind: "source",
  subjectType: "source_claim",
  subjectId: "claim-1",
  text: "KRN activation must source support decisions.",
  trustTier: "project-decision",
  reason: "Relevant source claim.",
  expectedUse: "Guide activation trace implementation.",
  tokenEstimate: 80,
  hasMechanism: true,
  doesNotProve: "This does not prove production activation quality.",
  lexicalScore: 12,
  vectorScore: 0,
  graphScore: 0,
  temporalScore: 0,
  contextRoiScore: 80,
  feedbackScore: 0,
  totalScore: 92,
  metadata: {},
  ...overrides
});

describe("persistActivationTrace", () => {
  it("records inclusion trace decisions as typed fields instead of metadata keys", async () => {
    const repository = new TraceRepository();
    const candidate = rankedCandidate({
      searchDocumentIds: ["doc-1", "doc-2"],
      sourceClaimId: "claim-1"
    });
    const contextAssembly: ContextAssembly = {
      id: "context-1",
      harnessPlanId: "plan-1",
      status: "assembled",
      inclusions: [{
        subjectType: "source_claim",
        subjectId: "claim-1",
        reason: "Use the grounded claim.",
        expectedUse: "Guide activation trace implementation.",
        tokenEstimate: 80,
        trustTier: "project-decision"
      }],
      exclusions: [],
      metadata: {},
      createdAt: now
    };

    await persistActivationTrace({
      retrievalRunId: "retrieval-1",
      candidates: [candidate],
      contextAssembly,
      completedAt: now,
      retrievalRepository: repository,
      rawRecall: {
        requireExactProof: true
      }
    });

    expect(repository.decisions[0]).toMatchObject({
      expectedUse: "Guide activation trace implementation.",
      expectedDecisionImpact: "Guide activation trace implementation.",
      rawRecall: {
        required: true,
        reasons: ["exact_proof_required"],
        evidenceHints: ["source_claim:claim-1", "claim-1", "doc-1", "doc-2"]
      },
      sourceSupportState: "source_claim_supported"
    });
    expect(repository.decisions[0]?.metadata).toEqual({
      mergedSearchDocumentIds: ["doc-1", "doc-2"]
    });
    expect(repository.completedRuns[0]).toMatchObject({
      rawEvidenceRecallTriggerCount: 1,
      rawEvidenceRecallTriggers: [{
        subjectType: "source_claim",
        subjectId: "claim-1",
        candidateId: "candidate-1",
        reasons: ["exact_proof_required"],
        trustTier: "project-decision",
        evidenceHints: ["source_claim:claim-1", "claim-1", "doc-1", "doc-2"]
      }]
    });
  });

  it("records exclusion trace decisions with typed anti-memory and abstention fields", async () => {
    const repository = new TraceRepository();
    const candidate = rankedCandidate({
      id: "candidate-2",
      kind: "memory",
      subjectType: "memory_record",
      subjectId: "memory-1",
      antiMemoryRecordId: "anti-memory-1",
      conflictReason: "anti_memory_block",
      exclusion: {
        reason: "unsafe",
        explanation: "Anti-memory blocks this context."
      }
    });
    const contextAssembly: ContextAssembly = {
      id: "context-1",
      harnessPlanId: "plan-1",
      status: "abstained",
      inclusions: [],
      exclusions: [{
        subjectType: "memory_record",
        subjectId: "memory-1",
        reason: "unsafe",
        explanation: "Anti-memory blocks this context.",
        score: 92,
        trustTier: "project-decision"
      }],
      activationAbstention: {
        reason: "unsafe_context",
        explanation: "All candidates were blocked by governance.",
        metadata: {}
      },
      metadata: {},
      createdAt: now
    };

    await persistActivationTrace({
      retrievalRunId: "retrieval-1",
      candidates: [candidate],
      contextAssembly,
      completedAt: now,
      retrievalRepository: repository
    });

    expect(repository.decisions[0]).toMatchObject({
      decision: "conflict",
      reason: "anti_memory_block",
      antiMemoryRecordId: "anti-memory-1",
      exclusionCategory: "unsafe",
      activationAbstentionReason: "unsafe_context",
      sourceSupportState: "not_applicable"
    });
    expect(repository.decisions[0]?.metadata).toEqual({
      explanation: "Anti-memory blocks this context."
    });
    expect(repository.completedRuns[0]).toMatchObject({
      status: "abstained",
      activationAbstentionReason: "unsafe_context",
      rawEvidenceRecallTriggerCount: 0
    });
  });
});
