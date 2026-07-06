import { describe, expect, it } from "vitest";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  EvidenceBundle,
  FeedbackDelta,
  MemoryCandidate,
  MemoryRecord,
  ReflectionCandidateEvidenceProvenance,
  ReflectionRecord,
  ReviewAssessment,
  SourceClaim,
  TaskContract
} from "@krn/core";

import {
  assembleContext,
  buildObserverInput,
  promoteMemoryCandidateThroughGate,
  retrieveActivationCandidates,
  writeReflectionCandidates
} from "../index.js";
import type {
  CreateMemoryCandidateInput,
  PromoteMemoryCandidateInput
} from "../repositories/index.js";

const now = "2026-07-01T12:00:00.000Z";
const projectId = "project-1";
const executionRunId = "execution-run-1";
const sourceClaimId = "source-claim-1";

const evidenceBundle = (): EvidenceBundle => ({
  id: "evidence-bundle-1",
  executionRunId,
  status: "verified",
  changedFiles: ["packages/harness/src/brain-loop-integration.test.ts"],
  commands: [{
    command: "pnpm --filter @krn/harness test -- brain-loop-integration.test.ts",
    status: "passed",
    provenance: "operator_reported",
    assertedBy: "test-fixture",
    doesNotProve: "This command does not prove product readiness or memory quality at scale."
  }],
  diffRisk: "low",
  reviewBurden: "low",
  rollbackPath: "Revert the integration test slice.",
  metadata: {
    sourceRefs: [sourceClaimId],
    doesNotProve: "Evidence capture does not promote Memory Core truth."
  },
  createdAt: now,
  updatedAt: now
});

const reviewAssessment = (): ReviewAssessment => ({
  id: "review-assessment-1",
  evidenceBundleId: "evidence-bundle-1",
  status: "accepted",
  reviewer: "operator",
  summary: "Evidence is sufficient to create a reviewable candidate.",
  findings: [],
  metadata: {
    outcome: "accepted",
    diffRisk: "low",
    reviewBurden: "low"
  },
  createdAt: now,
  updatedAt: now
});

const feedbackDelta = (): FeedbackDelta => ({
  id: "feedback-delta-1",
  reviewAssessmentId: "review-assessment-1",
  status: "candidate",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: {
    memoryRecordMutation: "none",
    doesNotProve: "Feedback delta does not mutate Memory Core without review."
  },
  createdAt: now,
  updatedAt: now
});

const sourceClaim = (): SourceClaim => ({
  id: sourceClaimId,
  sourceArtifactId: "source-artifact-1",
  claim: "Observation-stage evidence can create a reviewed integration-loop memory candidate.",
  mechanism: "Evidence and review artifacts are observed before reflection proposes candidates.",
  krnImplication: "The brain loop must preserve evidence lineage until MemoryReviewGate accepts it.",
  doesNotProve: "This source claim does not prove autonomous reflection quality.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "brain-loop-integration-test",
  status: "accepted",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const taskContract = (): TaskContract => ({
  id: "task-contract-1",
  operatorIntentId: "operator-intent-1",
  projectId,
  title: "Use reviewed observation-stage integration memory",
  objective: "Use reviewed observation-stage integration memory in future harness work.",
  constraints: ["activate reviewed memory only"],
  nonGoals: ["do not auto-promote reflection output"],
  acceptance: ["reviewed memory is activated or weak evidence abstains"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const reflectionRecord = (
  evidenceProvenance: ReflectionCandidateEvidenceProvenance
): ReflectionRecord => ({
  id: "reflection-record-1",
  scope: {
    projectId,
    executionRunId,
    taskContractId: "task-contract-1"
  },
  status: "candidate",
  summary: "Reflection proposes one memory candidate from observed evidence.",
  input: {
    scope: {
      projectId,
      executionRunId,
      taskContractId: "task-contract-1"
    },
    observationItemIds: ["evidence-bundle-1", "review-assessment-1", "feedback-delta-1"],
    sourceClaimIds: [sourceClaimId],
    antiMemoryKeys: [],
    generatedAt: now,
    metadata: {
      observerInputItemCount: 3
    }
  },
  output: {
    id: "reflection-output-1",
    scope: {
      projectId,
      executionRunId,
      taskContractId: "task-contract-1"
    },
    status: "candidate",
    summary: "Reflection remains candidate-only.",
    findings: [],
    contradictions: [],
    gaps: [],
    candidateLinks: [{
      targetType: "memory_candidate",
      summary: "Observation-stage integration memory candidate",
      evidenceRefs: ["evidence-bundle-1", "review-assessment-1"]
    }],
    memoryCandidates: [{
      kind: "procedure",
      summary: "Use reviewed observation-stage integration memory.",
      body: "A KRN brain-loop proof must preserve evidence lineage through observation, reflection, review, memory, and next activation.",
      owner: "kernel",
      confidence: 88,
      applicationGuidance: "Use when adding or reviewing KRN brain-loop integration tests.",
      invalidationRule: "Revisit when a real DB-backed product loop supersedes this in-memory proof.",
      sourceClaimIds: [sourceClaimId],
      sourceLineage: [{ sourceId: sourceClaimId, note: "source-to-decision for E2E-01" }],
      isUserPreference: false,
      validFrom: now,
      evidence: {
        provenance: evidenceProvenance,
        evidenceRefs: ["evidence-bundle-1", "review-assessment-1"],
        doesNotProve: "This candidate is not Memory Core truth until MemoryReviewGate accepts it."
      },
      metadata: {
        integrationProof: "evidence_to_memory_activation"
      }
    }],
    sourceClaimCandidates: [],
    antiMemoryCandidates: [],
    policyCandidates: [],
    evalCandidates: [],
    metadata: {
      memoryRecordMutation: "none"
    },
    createdAt: now,
    updatedAt: now
  },
  metadata: {
    memoryRecordMutation: "none"
  },
  createdAt: now,
  updatedAt: now
});

const createMemoryCandidate = (
  input: CreateMemoryCandidateInput,
  id = "memory-candidate-1"
): MemoryCandidate => ({
  id,
  projectId: input.projectId,
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
  proposedBy: input.proposedBy,
  kind: input.kind,
  status: input.status ?? "candidate",
  summary: input.summary,
  body: input.body,
  owner: input.owner,
  confidence: input.confidence,
  applicationGuidance: input.applicationGuidance,
  ...(input.invalidationRule === undefined ? {} : { invalidationRule: input.invalidationRule }),
  sourceClaimIds: input.sourceClaimIds ?? [],
  sourceLineage: input.sourceLineage,
  isUserPreference: input.isUserPreference,
  validFrom: input.validFrom ?? now,
  ...(input.validUntil === undefined ? {} : { validUntil: input.validUntil }),
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

const promoteCandidate = (
  candidate: MemoryCandidate,
  input: PromoteMemoryCandidateInput
): MemoryRecord => ({
  id: "memory-record-1",
  projectId: candidate.projectId,
  currentVersionId: "memory-record-version-1",
  key: input.recordKey ?? `memory:${candidate.id}`,
  kind: candidate.kind,
  status: "active",
  summary: candidate.summary,
  body: candidate.body,
  owner: candidate.owner,
  confidence: candidate.confidence,
  applicationGuidance: candidate.applicationGuidance,
  ...(candidate.invalidationRule === undefined ? {} : { invalidationRule: candidate.invalidationRule }),
  sourceLineage: candidate.sourceLineage,
  isUserPreference: candidate.isUserPreference,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 0,
  metadata: input.metadata ?? {},
  validFrom: candidate.validFrom,
  ...(candidate.validUntil === undefined ? {} : { validUntil: candidate.validUntil }),
  createdAt: now,
  updatedAt: now
});

class BrainLoopMemoryRepository {
  readonly candidates = new Map<string, MemoryCandidate>();
  readonly activeRecords: MemoryRecord[] = [];

  async createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate> {
    const candidate = createMemoryCandidate(input);
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }

  async createAntiMemoryCandidate(): Promise<AntiMemoryCandidate> {
    throw new Error("anti-memory candidate should not be created by this integration fixture");
  }

  async getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined> {
    return this.candidates.get(id);
  }

  async promoteReviewedMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord> {
    const candidate = this.candidates.get(input.candidateId);

    if (candidate === undefined) {
      throw new Error(`MemoryCandidate not found: ${input.candidateId}`);
    }

    const record = promoteCandidate(candidate, input);
    this.activeRecords.push(record);
    this.candidates.set(input.candidateId, {
      ...candidate,
      status: "accepted",
      reviewer: input.reviewer,
      reviewedAt: now,
      updatedAt: now
    });
    return record;
  }

  async listActiveMemory(): Promise<MemoryRecord[]> {
    return [...this.activeRecords];
  }

  async listAntiMemoryForProject(): Promise<AntiMemoryRecord[]> {
    return [];
  }
}

const sourceRepository = {
  async getSourceClaimById(id: string): Promise<SourceClaim | undefined> {
    return id === sourceClaimId ? sourceClaim() : undefined;
  },
  async listClaimsForProject(): Promise<SourceClaim[]> {
    return [];
  },
  async listSourceClaimEdgesForClaim(): Promise<[]> {
    return [];
  }
};

const retrievalRepository = {
  async searchLexical(): Promise<[]> {
    return [];
  }
};

const activationContextFor = async (
  memoryRepository: BrainLoopMemoryRepository
) => {
  const retrieved = await retrieveActivationCandidates({
    taskContract: taskContract(),
    limits: {
      memory: 5,
      source: 0,
      search: 0,
      antiMemory: 5
    },
    repositories: {
      memoryRepository,
      sourceRepository,
      retrievalRepository
    }
  });

  return assembleContext({
    id: "context-assembly-1",
    harnessPlanId: "harness-plan-1",
    candidates: retrieved.candidates,
    createdAt: now,
    metadata: {
      integrationProof: "evidence_to_memory_activation",
      diagnosticCandidateCount: retrieved.diagnostics.mergedCandidateCount
    }
  });
};

describe("KRN brain loop integration", () => {
  it("carries reviewed evidence through candidate promotion into next activation", async () => {
    const observerInput = buildObserverInput({
      executionRunId,
      generatedAt: now,
      events: [],
      evidenceBundles: [evidenceBundle()],
      reviewAssessments: [reviewAssessment()],
      feedbackDeltas: [feedbackDelta()]
    });
    const memoryRepository = new BrainLoopMemoryRepository();
    const written = await writeReflectionCandidates({
      reflectionRecord: reflectionRecord("operator_reported"),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      memoryRepository
    });

    expect(observerInput.counts).toEqual({
      events: 0,
      evidenceBundles: 1,
      reviewAssessments: 1,
      feedbackDeltas: 1
    });
    expect(written.status).toBe("ready");
    expect(memoryRepository.activeRecords).toHaveLength(0);

    await promoteMemoryCandidateThroughGate({
      memoryRepository,
      sourceRepository,
      review: {
        candidateId: "memory-candidate-1",
        reviewer: "operator",
        evidenceReviewedRef: "evidence-bundle-1",
        recordKey: "brain-loop:observation-stage-integration"
      }
    });

    const context = await activationContextFor(memoryRepository);

    expect(context.status).toBe("assembled");
    expect(context.inclusions).toEqual([
      expect.objectContaining({
        subjectType: "memory_record",
        subjectId: "memory-record-1",
        expectedUse: "Use when adding or reviewing KRN brain-loop integration tests."
      })
    ]);
    expect(memoryRepository.activeRecords[0]?.metadata).toMatchObject({
      reviewGate: {
        evidenceReviewedRef: "evidence-bundle-1",
        candidateEvidence: {
          provenance: "operator_reported",
          evidenceRefs: ["evidence-bundle-1", "review-assessment-1"]
        },
        sourceClaimIds: [sourceClaimId],
        reviewedSourceClaimIds: [sourceClaimId]
      }
    });
  });

  it("blocks weak evidence before it can become activated memory", async () => {
    const memoryRepository = new BrainLoopMemoryRepository();
    const written = await writeReflectionCandidates({
      reflectionRecord: reflectionRecord("default_template"),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      memoryRepository
    });

    expect(written).toMatchObject({
      status: "blocked",
      blockedReasons: [
        "memoryCandidates.0.evidence:weak_command_evidence_high_confidence"
      ]
    });

    const context = await activationContextFor(memoryRepository);

    expect(memoryRepository.candidates.size).toBe(0);
    expect(memoryRepository.activeRecords).toHaveLength(0);
    expect(context.status).toBe("abstained");
    expect(context.activationAbstention).toMatchObject({
      reason: "no_candidates"
    });
  });
});
