import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  runCli
} from "../runCli.js";
import {
  createNoStoreCompilerDependencies
} from "../noStoreRepositories.js";
import {
  commandResultDoesNotProve
} from "@krn/core";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  MemoryRecord,
  ObservationItem,
  SourceClaim
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate,
  SearchDocumentSearchResult
} from "@krn/harness/repositories/internal";
import type {
  DatabaseRuntimeInput
} from "../databaseRuntime.js";
import {
  deriveBrainStoreReadiness,
  deriveHarnessPersistenceReadiness,
  deriveActivationReadiness,
  deriveCodexAdapterReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness,
  deriveWorkerJobReadiness
} from "../doctorReadiness.js";

const now = "2026-06-21T12:00:00.000Z";

const unusedMemoryRepository = {
  async createMemoryCandidate(_input: CreateMemoryCandidateInput): Promise<never> {
    throw new Error("createMemoryCandidate should not be called");
  },
  async getMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getMemoryCandidateById should not be called");
  },
  async promoteReviewedMemoryCandidate(_input: PromoteMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedMemoryCandidate should not be called");
  },
  async rejectMemoryCandidate(_input: RejectMemoryCandidateInput): Promise<never> {
    throw new Error("rejectMemoryCandidate should not be called");
  },
  async invalidateMemoryRecord(_input: InvalidateMemoryRecordInput): Promise<never> {
    throw new Error("invalidateMemoryRecord should not be called");
  },
  async getMemoryRecordById(_id: string): Promise<never> {
    throw new Error("getMemoryRecordById should not be called");
  },
  async recordMemoryApplication(_input: RecordMemoryApplicationInput): Promise<never> {
    throw new Error("recordMemoryApplication should not be called");
  },
  async createMemoryFeedbackEvent(_input: CreateMemoryFeedbackEventInput): Promise<never> {
    throw new Error("createMemoryFeedbackEvent should not be called");
  },
  async createAntiMemoryCandidate(_input: CreateAntiMemoryCandidateInput): Promise<never> {
    throw new Error("createAntiMemoryCandidate should not be called");
  },
  async getAntiMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getAntiMemoryCandidateById should not be called");
  },
  async promoteReviewedAntiMemoryCandidate(_input: PromoteAntiMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedAntiMemoryCandidate should not be called");
  },
  async rejectAntiMemoryCandidate(_input: RejectAntiMemoryCandidateInput): Promise<never> {
    throw new Error("rejectAntiMemoryCandidate should not be called");
  }
};

const assignIfDefined = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K]
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};

const createPersistedAntiMemoryCandidate = (
  input: CreateAntiMemoryCandidateInput
): AntiMemoryCandidate => {
  const candidate: AntiMemoryCandidate = {
    id: "anti-memory-candidate-1",
    projectId: input.projectId,
    proposedBy: input.proposedBy,
    key: input.key,
    status: input.status ?? "candidate",
    invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
    summary: input.summary,
    body: input.body,
    owner: input.owner,
    confidence: input.confidence,
    sourceLineage: input.sourceLineage,
    metadata: input.metadata ?? {},
    validFrom: input.validFrom ?? now,
    createdAt: now,
    updatedAt: now
  };

  assignIfDefined(candidate, "executionRunId", input.executionRunId);
  assignIfDefined(candidate, "feedbackDeltaId", input.feedbackDeltaId);
  assignIfDefined(candidate, "rejectedClaim", input.rejectedClaim);
  assignIfDefined(candidate, "reason", input.reason);
  assignIfDefined(candidate, "appliesTo", input.appliesTo);
  assignIfDefined(candidate, "mayRevisitWhen", input.mayRevisitWhen);
  assignIfDefined(candidate, "validUntil", input.validUntil);

  return candidate;
};

describe("runCli", () => {
  it("previews memory candidate add without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "architecture-boundary",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Candidate Add");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("kind: constraint");
    expect(result.stdout).toContain("inputKind: architecture-boundary");
    expect(result.stdout).toContain("confidence: 70");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
  });

  it("requires database config for memory candidate add --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "constraint",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory candidate add --persist"
    );
  });

  it("uses the memory candidate add fallback for non-error failures", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "constraint",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => {
          throw "not-an-error";
        }
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unknown memory candidate add error");
    expect(result.stderr).not.toContain("not-an-error");
  });

  it("persists memory candidate add and prints persisted ID", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedCandidate: CreateMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "architecture-boundary",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--candidate-evidence-provenance",
        "operator_reported",
        "--candidate-evidence-ref",
        "raw-evidence:run-event-1",
        "--candidate-evidence-does-not-prove",
        "This does not prove the candidate is approved Memory Core truth.",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Source graph should use Postgres edge tables first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link memory to source claims",
                doesNotProve: "This does not prove graph retrieval quality",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "M23",
                status: "proposed",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            async createMemoryCandidate(input) {
              capturedCandidate = input;

              return {
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
                invalidationRule: input.invalidationRule,
                sourceClaimIds: input.sourceClaimIds ?? [],
                sourceLineage: input.sourceLineage,
                isUserPreference: input.isUserPreference,
                validFrom: now,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("memoryCandidate: memory-candidate-1");
    expect(result.stdout).toContain("candidateEvidenceProvenance: operator_reported");
    expect(result.stdout).toContain("candidateEvidenceRefs: raw-evidence:run-event-1");
    expect(capturedCandidate).toMatchObject({
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "cli",
      kind: "constraint",
      confidence: 70,
      sourceClaimIds: ["source-claim-1"],
      metadata: {
        reflectionCandidateEvidence: {
          provenance: "operator_reported",
          evidenceRefs: ["raw-evidence:run-event-1"],
          doesNotProve: "This does not prove the candidate is approved Memory Core truth."
        }
      }
    });
  });

  it("previews memory candidate promote without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--untrusted-source-review-ref",
        "security-review:source-lineage-1"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Candidate Promote");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("candidateId: memory-candidate-1");
    expect(result.stdout).toContain("reviewer: operator");
    expect(result.stdout).toContain("decision: accepted");
    expect(result.stdout).toContain("untrustedSourceReviewRef: security-review:source-lineage-1");
    expect(result.stdout).toContain("No MemoryRecord created");
    expect(result.stdout).toContain("No memory application recorded");
  });

  it("requires evidence review reference before memory candidate promote --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("evidenceReviewedRef is required before promoting memory candidates");
    expect(result.stderr).toContain("No MemoryRecord created");
  });

  it("requires evidence review reference before opening DB runtime for memory candidate promote", async () => {
    let createRuntimeCalled = false;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => {
          createRuntimeCalled = true;
          throw new Error("createDatabaseRuntime should not be called");
        }
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("evidenceReviewedRef is required before promoting memory candidates");
    expect(result.stderr).toContain("No MemoryRecord created");
    expect(createRuntimeCalled).toBe(false);
  });

  it("persists memory candidate promote through MemoryReviewGate", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedPromotion: PromoteMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--evidence-reviewed-ref",
        "raw-evidence:run-event-1",
        "--untrusted-source-review-ref",
        "security-review:source-lineage-1",
        "--metadata",
        "reviewNote=inspected raw run event",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN should model source graph with relational edges first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link promoted memory to source claims",
                doesNotProve: "This does not prove graph retrieval quality",
                trustTier: "paper",
                supportType: "implementation-boundary",
                consumer: "MM-27",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            async createMemoryCandidate() {
              throw new Error("createMemoryCandidate should not be called");
            },
            async getMemoryCandidateById(id) {
              return {
                id,
                projectId: "project-1",
                executionRunId: "execution-run-1",
                proposedBy: "cli",
                kind: "constraint",
                status: "candidate",
                summary: "Source graph should use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceClaimIds: ["source-claim-1"],
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                validFrom: now,
                metadata: {
                  reflectionCandidateEvidence: {
                    provenance: "operator_reported",
                    evidenceRefs: ["raw-evidence:run-event-1"],
                    doesNotProve: "This does not prove the candidate is approved Memory Core truth."
                  }
                },
                createdAt: now,
                updatedAt: now
              };
            },
            async promoteReviewedMemoryCandidate(input) {
              capturedPromotion = input;

              return {
                id: "memory-record-1",
                projectId: "project-1",
                currentVersionId: "memory-record-version-1",
                key: "memory:memory-candidate-1",
                kind: "constraint",
                status: "active",
                summary: "Source graph should use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async rejectMemoryCandidate() {
              throw new Error("rejectMemoryCandidate should not be called");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Review gate: passed");
    expect(result.stdout).toContain("memoryRecord: memory-record-1");
    expect(result.stdout).toContain("evidenceReviewedRef: raw-evidence:run-event-1");
    expect(result.stdout).toContain("untrustedSourceReviewRef: security-review:source-lineage-1");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(capturedPromotion).toMatchObject({
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewNote: "inspected raw run event",
        reviewGate: {
          candidateEvidence: {
            provenance: "operator_reported",
            evidenceRefs: ["raw-evidence:run-event-1"],
            doesNotProve: "This does not prove the candidate is approved Memory Core truth."
          },
          evidenceReviewedRef: "raw-evidence:run-event-1",
          sourceClaimIds: ["source-claim-1"],
          reviewedSourceClaimIds: ["source-claim-1"],
          untrustedSourceClaimIds: ["source-claim-1"],
          untrustedSourceReviewRef: "security-review:source-lineage-1"
        }
      }
    });
  });

  it("persists memory candidate reject and stores reason", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedRejection: RejectMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "reject",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--reason",
        "No source mechanism tied the claim to a KRN decision",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            async createMemoryCandidate() {
              throw new Error("createMemoryCandidate should not be called");
            },
            async getMemoryCandidateById() {
              throw new Error("getMemoryCandidateById should not be called");
            },
            async promoteReviewedMemoryCandidate() {
              throw new Error("promoteReviewedMemoryCandidate should not be called");
            },
            async rejectMemoryCandidate(input) {
              capturedRejection = input;

              return {
                id: input.candidateId,
                projectId: "project-1",
                executionRunId: "execution-run-1",
                proposedBy: "cli",
                kind: "constraint",
                status: "rejected",
                summary: "Source graph should use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceClaimIds: ["source-claim-1"],
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                reviewer: input.reviewer,
                reviewedAt: now,
                rejectionReason: input.reason,
                validFrom: now,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("memoryCandidate: memory-candidate-1");
    expect(result.stdout).toContain("status: rejected");
    expect(result.stdout).toContain(
      "reason: No source mechanism tied the claim to a KRN decision"
    );
    expect(result.stdout).toContain("No MemoryRecord created");
    expect(capturedRejection).toMatchObject({
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      reason: "No source mechanism tied the claim to a KRN decision"
    });
  });

  it("previews memory record apply without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "helped",
        "--notes",
        "Guided M23 decision to avoid a separate graph DB"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Record Apply");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("memoryRecordId: memory-record-1");
    expect(result.stdout).toContain("runId: execution-run-1");
    expect(result.stdout).toContain("outcome: helped");
    expect(result.stdout).toContain("Memory Core mutation: none");
    expect(result.stdout).toContain("Feedback event: none");
    expect(result.stdout).toContain("Follow-up candidate: none");
  });

  it("requires database config for memory record apply --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "helped",
        "--notes",
        "Guided M23 decision to avoid a separate graph DB",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory record apply --persist"
    );
  });

  it("persists helped memory record apply without feedback event", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedApplication: RecordMemoryApplicationInput | undefined;
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "helped",
        "--notes",
        "Guided M23 decision to avoid a separate graph DB",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async getMemoryRecordById(id) {
              return {
                id,
                projectId: "project-1",
                currentVersionId: "memory-record-version-1",
                key: "memory:memory-candidate-1",
                kind: "constraint",
                status: "active",
                summary: "Use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async recordMemoryApplication(input) {
              capturedApplication = input;

              return {
                id: "memory-application-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                expectedUse: input.expectedUse,
                outcome: input.outcome,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            },
            async createMemoryFeedbackEvent() {
              throw new Error("createMemoryFeedbackEvent should not be called");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("memoryApplication: memory-application-1");
    expect(result.stdout).toContain("memoryRecord: memory-record-1");
    expect(result.stdout).toContain("outcome: helped");
    expect(result.stdout).toContain("Memory Core mutation: none");
    expect(result.stdout).toContain("Feedback event: none");
    expect(result.stdout).toContain("Follow-up candidate: none");
    expect(capturedApplication).toMatchObject({
      memoryRecordId: "memory-record-1",
      executionRunId: "execution-run-1",
      outcome: "helped",
      notes: "Guided M23 decision to avoid a separate graph DB"
    });
  });

  it.each([
    ["stale", "stale_detected", 70],
    ["hurt", "demoted", 60]
  ] as const)("persists %s memory record apply and creates feedback event", async (
    outcome,
    eventType,
    expectedConfidence
  ) => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedFeedbackEvent: CreateMemoryFeedbackEventInput | undefined;
    let capturedAntiMemoryCandidate:
      | Parameters<typeof unusedMemoryRepository.createAntiMemoryCandidate>[0]
      | undefined;
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        outcome,
        "--notes",
        "Graph traversal now exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async getMemoryRecordById(id) {
              return {
                id,
                projectId: "project-1",
                currentVersionId: "memory-record-version-1",
                key: "memory:memory-candidate-1",
                kind: "constraint",
                status: "active",
                summary: "Use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async recordMemoryApplication(input) {
              return {
                id: "memory-application-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                expectedUse: input.expectedUse,
                outcome: input.outcome,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            },
            async createMemoryFeedbackEvent(input) {
              capturedFeedbackEvent = input;

              return {
                id: "memory-feedback-event-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                eventType: input.eventType,
                direction: input.direction,
                note: input.note,
                reason: input.reason,
                evidenceRef: input.evidenceRef,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            },
            async createAntiMemoryCandidate(input) {
              capturedAntiMemoryCandidate = input;

              return createPersistedAntiMemoryCandidate(input);
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("memoryApplication: memory-application-1");
    expect(result.stdout).toContain("memoryFeedbackEvent: memory-feedback-event-1");
    expect(result.stdout).toContain("antiMemoryCandidate: anti-memory-candidate-1");
    expect(result.stdout).toContain("Candidate reviewability: review");
    expect(result.stdout).toContain("Memory Core mutation: none");
    expect(result.stdout).toContain(`outcome: ${outcome}`);
    expect(capturedFeedbackEvent).toMatchObject({
      memoryRecordId: "memory-record-1",
      executionRunId: "execution-run-1",
      eventType,
      direction: "negative",
      reason: "Graph traversal now exceeds Postgres edge-table performance",
      evidenceRef: "memory-application:memory-application-1"
    });
    expect(capturedAntiMemoryCandidate).toMatchObject({
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "krn-memory-feedback",
      rejectedClaim: "Use Postgres edge tables first",
      reason: "Graph traversal now exceeds Postgres edge-table performance",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      appliesTo: "memory:memory-candidate-1",
      confidence: expectedConfidence
    });
    expect(capturedAntiMemoryCandidate?.metadata).toMatchObject({
      applicationOutcome: outcome,
      doesNotProve: "This candidate does not prove the memory should be invalidated or demoted without review.",
      reflectionCandidateEvidence: {
        provenance: "local_operator_note",
        evidenceRefs: [
          "memory-application:memory-application-1",
          "memory-feedback-event:memory-feedback-event-1"
        ],
        doesNotProve:
          "Operator feedback does not prove the anti-memory candidate should be promoted without review."
      }
    });
  });

  it("previews anti-memory add without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--reason",
        "Files can be export/audit/seed/source bank, not Memory Core",
        "--invalidated-by-source-claim-id",
        "source-claim-1"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Anti Add");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("rejectedClaim: Markdown files are KRN runtime memory");
    expect(result.stdout).toContain(
      "reason: Files can be export/audit/seed/source bank, not Memory Core"
    );
    expect(result.stdout).toContain("invalidatedBySourceClaimIds: source-claim-1");
    expect(result.stdout).toContain("No MemoryRecord created");
  });

  it("requires reason for anti-memory add", async () => {
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--invalidated-by-source-claim-id",
        "source-claim-1"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("reason");
  });

  it("requires database config for anti-memory add --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--reason",
        "Files can be export/audit/seed/source bank, not Memory Core",
        "--invalidated-by-source-claim-id",
        "source-claim-1",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory anti add --persist"
    );
  });

  it("persists anti-memory add as a reviewed candidate and validates invalidating source claim", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedAntiMemoryCandidate: CreateAntiMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--reason",
        "Files can be export/audit/seed/source bank, not Memory Core",
        "--invalidated-by-source-claim-id",
        "source-claim-1",
        "--candidate-evidence-provenance",
        "source_claim",
        "--candidate-evidence-ref",
        "source-claim-1",
        "--candidate-evidence-does-not-prove",
        "This does not prove the anti-memory candidate is reviewed.",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Markdown files are audit artifacts, not runtime memory",
                mechanism: "KRN runtime memory is store-backed in Postgres",
                krnImplication: "Do not read markdown as Memory Core",
                doesNotProve: "No markdown can ever be source material",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "M23",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async createAntiMemoryCandidate(input) {
              capturedAntiMemoryCandidate = input;

              return createPersistedAntiMemoryCandidate(input);
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("antiMemoryCandidate: anti-memory-candidate-1");
    expect(result.stdout).toContain("No AntiMemoryRecord created");
    expect(result.stdout).toContain("No MemoryRecord created");
    expect(capturedAntiMemoryCandidate).toMatchObject({
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "cli",
      rejectedClaim: "Markdown files are KRN runtime memory",
      reason: "Files can be export/audit/seed/source bank, not Memory Core",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      owner: "operator",
      confidence: 90,
      metadata: {
        reflectionCandidateEvidence: {
          provenance: "source_claim",
          evidenceRefs: ["source-claim-1"],
          doesNotProve: "This does not prove the anti-memory candidate is reviewed."
        }
      }
    });
  });

  it("promotes anti-memory candidates through the review gate", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedPromotion: PromoteAntiMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "anti",
        "promote",
        "--candidate-id",
        "anti-memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--evidence-reviewed-ref",
        "source-claim-1",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Markdown files are audit artifacts, not runtime memory",
                mechanism: "KRN runtime memory is store-backed in Postgres",
                krnImplication: "Do not read markdown as Memory Core",
                doesNotProve: "This does not prove markdown cannot be source material",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "C2-00",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async getAntiMemoryCandidateById(id): Promise<AntiMemoryCandidate> {
              return {
                id,
                projectId: "project-1",
                executionRunId: "execution-run-1",
                proposedBy: "cli",
                key: "anti-markdown-runtime-memory",
                status: "candidate",
                rejectedClaim: "Markdown files are KRN runtime memory",
                reason: "Files can be export/audit/seed/source bank, not Memory Core",
                invalidatedBySourceClaimIds: ["source-claim-1"],
                sourceLineage: [{ sourceId: "source-claim-1" }],
                summary: "Markdown files are KRN runtime memory",
                body: "Files can be export/audit/seed/source bank, not Memory Core",
                owner: "operator",
                confidence: 90,
                validFrom: now,
                metadata: {
                  reflectionCandidateEvidence: {
                    provenance: "source_claim",
                    evidenceRefs: ["source-claim-1"],
                    doesNotProve: "This does not prove the anti-memory candidate is reviewed."
                  }
                },
                createdAt: now,
                updatedAt: now
              };
            },
            async promoteReviewedAntiMemoryCandidate(input) {
              capturedPromotion = input;

              return {
                id: "anti-memory-1",
                projectId: "project-1",
                executionRunId: "execution-run-1",
                createdFromCandidateId: input.candidateId,
                key: "anti-markdown-runtime-memory",
                rejectedClaim: "Markdown files are KRN runtime memory",
                reason: "Files can be export/audit/seed/source bank, not Memory Core",
                invalidatedBySourceClaimIds: ["source-claim-1"],
                summary: "Markdown files are KRN runtime memory",
                body: "Files can be export/audit/seed/source bank, not Memory Core",
                owner: "operator",
                confidence: 90,
                sourceLineage: [{ sourceId: "source-claim-1" }],
                validFrom: now,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Review gate: passed");
    expect(result.stdout).toContain("antiMemoryRecord: anti-memory-1");
    expect(capturedPromotion).toMatchObject({
      candidateId: "anti-memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "source-claim-1",
          invalidatedSourceClaimIds: ["source-claim-1"]
        }
      }
    });
  });
});
