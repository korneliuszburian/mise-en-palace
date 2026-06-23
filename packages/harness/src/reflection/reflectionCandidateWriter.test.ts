import { describe, expect, it } from "vitest";
import type {
  EvalCandidate,
  MemoryCandidate,
  ReflectionRecord,
  SourceClaim
} from "@krn/core";

import {
  writeReflectionCandidates
} from "./reflectionCandidateWriter.js";

const now = "2026-06-23T12:00:00.000Z";

const reflectionRecord = (overrides: Partial<ReflectionRecord> = {}): ReflectionRecord => ({
  id: "reflection-record-1",
  scope: {
    projectId: "project-1",
    executionRunId: "execution-run-1",
    taskContractId: "task-contract-1"
  },
  status: "candidate",
  summary: "Reflection produced reviewed candidates.",
  input: {
    scope: {
      projectId: "project-1",
      executionRunId: "execution-run-1",
      taskContractId: "task-contract-1"
    },
    observationItemIds: ["observation-1"],
    sourceClaimIds: ["source-claim-1"],
    antiMemoryKeys: [],
    generatedAt: now,
    metadata: {}
  },
  output: {
    id: "reflection-output-1",
    scope: {
      projectId: "project-1",
      executionRunId: "execution-run-1",
      taskContractId: "task-contract-1"
    },
    status: "candidate",
    summary: "Reflection output proposes candidates only.",
    findings: [],
    contradictions: [],
    gaps: [],
    candidateLinks: [],
    memoryCandidates: [{
      kind: "constraint",
      summary: "Observation staging must stay source-ranged.",
      body: "Create a reviewed MemoryCandidate, not a MemoryRecord.",
      owner: "kernel",
      confidence: 88,
      applicationGuidance: "Use when observe/reflect behavior is modified.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1", note: "reflection proposal" }],
      isUserPreference: false,
      validFrom: now,
      metadata: {
        sourceRangeIds: ["range-1"]
      }
    }],
    sourceClaimCandidates: [{
      claim: "Reflection candidate writer preserves source grounding.",
      mechanism: "It passes source artifact and source claim proposal fields to SourceRepository.",
      krnImplication: "Source candidates remain reviewable SourceClaim records.",
      doesNotProve: "The source decision is approved.",
      trustTier: "high",
      supportType: "supports",
      consumer: "reflection-candidate-writer-test",
      falsifier: "Source candidates are promoted to SourceDecision directly.",
      metadata: {
        sourceRangeIds: ["range-1"]
      }
    }],
    antiMemoryCandidates: [{
      key: "anti-reflection-autopromote",
      summary: "Do not auto-promote reflection outputs.",
      body: "Anti-memory has no candidate writer in this slice.",
      owner: "kernel",
      confidence: 90,
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      metadata: {}
    }],
    policyCandidates: [{
      key: "policy-reflection-candidate-only",
      summary: "Reflection remains candidate-only.",
      rationale: "Policy candidates have no writer in this slice.",
      evidenceRefs: ["observation-1"],
      metadata: {}
    }],
    evalCandidates: [{
      title: "Reflection candidate-only regression",
      scenario: "A reflection output contains a tempting final memory claim.",
      expectedSignal: "Writer creates candidates only.",
      sourceEvidence: ["observation-1"],
      metadata: {}
    }],
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("reflection candidate writer", () => {
  it("writes reviewed memory and source candidates while preserving lineage", async () => {
    const memoryCandidates: MemoryCandidate[] = [];
    const sourceClaims: SourceClaim[] = [];
    const result = await writeReflectionCandidates({
      reflectionRecord: reflectionRecord(),
      sourceArtifactId: "source-artifact-1",
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      memoryRepository: {
        async createMemoryCandidate(input) {
          const candidate: MemoryCandidate = {
            id: "memory-candidate-1",
            projectId: input.projectId,
            executionRunId: input.executionRunId,
            proposedBy: input.proposedBy,
            kind: input.kind,
            status: input.status ?? "proposed",
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            sourceClaimIds: input.sourceClaimIds ?? [],
            sourceLineage: input.sourceLineage,
            isUserPreference: input.isUserPreference,
            validFrom: input.validFrom ?? now,
            metadata: input.metadata ?? {},
            createdAt: now,
            updatedAt: now
          };
          memoryCandidates.push(candidate);
          return candidate;
        }
      },
      sourceRepository: {
        async createSourceClaim(input) {
          const claim: SourceClaim = {
            id: "source-claim-created-1",
            sourceArtifactId: input.sourceArtifactId,
            ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
            claim: input.claim,
            mechanism: input.mechanism,
            krnImplication: input.krnImplication,
            doesNotProve: input.doesNotProve,
            trustTier: input.trustTier,
            supportType: input.supportType,
            consumer: input.consumer,
            ...(input.falsifier === undefined ? {} : { falsifier: input.falsifier }),
            ...(input.revisitWhen === undefined ? {} : { revisitWhen: input.revisitWhen }),
            status: input.status ?? "candidate",
            metadata: input.metadata ?? {},
            createdAt: now,
            updatedAt: now
          };
          sourceClaims.push(claim);
          return claim;
        }
      }
    });

    expect(result.status).toBe("ready");
    expect(memoryCandidates[0]).toMatchObject({
      proposedBy: "reflection",
      sourceClaimIds: ["source-claim-1"],
      metadata: {
        reflectionRecordId: "reflection-record-1",
        sourceRangeIds: ["range-1"]
      }
    });
    expect(sourceClaims[0]).toMatchObject({
      sourceArtifactId: "source-artifact-1",
      status: "proposed",
      metadata: {
        reflectionRecordId: "reflection-record-1",
        sourceRangeIds: ["range-1"]
      }
    });
    expect(result.evalCandidates[0]).toMatchObject<Partial<EvalCandidate>>({
      id: "eval-candidate-reflection-record-1-1",
      projectId: "project-1",
      status: "candidate",
      title: "Reflection candidate-only regression",
      sourceEvidence: ["observation-1"]
    });
    expect(result.unsupportedCandidates).toEqual([
      expect.objectContaining({ kind: "anti_memory_candidate" }),
      expect.objectContaining({ kind: "policy_candidate" })
    ]);
  });

  it("blocks final-truth reflection outputs without writing candidates", async () => {
    let createMemoryCandidateCalled = false;
    const result = await writeReflectionCandidates({
      reflectionRecord: reflectionRecord({
        output: {
          ...reflectionRecord().output,
          candidateLinks: [{
            targetType: "memory_record",
            targetId: "memory-record-1",
            summary: "Final truth should block writer.",
            evidenceRefs: []
          }]
        }
      }),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      memoryRepository: {
        async createMemoryCandidate() {
          createMemoryCandidateCalled = true;
          throw new Error("createMemoryCandidate should not be called");
        }
      }
    });

    expect(result).toMatchObject({
      status: "blocked",
      blockedReasons: ["candidateLinks.0.targetType:final_truth_target"],
      memoryCandidates: [],
      sourceClaims: [],
      evalCandidates: []
    });
    expect(createMemoryCandidateCalled).toBe(false);
  });
});
