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

describe("runCli", () => {
  it("prints source claim add help", async () => {
    const result = await runCli(["source", "claim", "add", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source claim add");
    expect(result.stdout).toContain("--does-not-prove");
  });

  it("previews source claim add without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "add",
        "--title",
        "Postgres edge table decision",
        "--claim",
        "KRN should model source graph with relational edges first",
        "--mechanism",
        "Postgres already stores canonical harness state transactionally",
        "--does-not-prove",
        "This does not prove graph retrieval quality",
        "--falsifier",
        "Source graph smoke cannot link the claim to any decision support edge",
        "--support-type",
        "implementation-boundary",
        "--trust-tier",
        "project-decision",
        "--consumer",
        "M22 source graph persistence"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Claim Add");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("Source claim preview");
    expect(result.stdout).toContain("doesNotProve: This does not prove graph retrieval quality");
  });

  it("requires database config for source claim add --persist", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "add",
        "--title",
        "Postgres edge table decision",
        "--claim",
        "KRN should model source graph with relational edges first",
        "--mechanism",
        "Postgres already stores canonical harness state transactionally",
        "--does-not-prove",
        "This does not prove graph retrieval quality",
        "--falsifier",
        "Source graph smoke cannot link the claim to any decision support edge",
        "--support-type",
        "implementation-boundary",
        "--trust-tier",
        "project-decision",
        "--consumer",
        "M22 source graph persistence",
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
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn source claim add --persist");
  });

  it("persists source claim add and prints persisted IDs", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "claim",
        "add",
        "--run-id",
        "execution-run-1",
        "--title",
        "Postgres edge table decision",
        "--claim",
        "KRN should model source graph with relational edges first",
        "--mechanism",
        "Postgres already stores canonical harness state transactionally",
        "--does-not-prove",
        "This does not prove graph retrieval quality",
        "--falsifier",
        "Source graph smoke cannot link the claim to any decision support edge",
        "--support-type",
        "implementation-boundary",
        "--trust-tier",
        "project-decision",
        "--consumer",
        "M22 source graph persistence",
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
            async createSourceArtifact(input) {
              return {
                id: "source-artifact-1",
                projectId: input.projectId,
                kind: input.kind,
                trustTier: input.trustTier,
                uri: input.uri,
                title: input.title,
                contentHash: input.contentHash,
                capturedAt: now,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceClaim(input) {
              return {
                id: "source-claim-1",
                sourceArtifactId: input.sourceArtifactId,
                ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
                claim: input.claim,
                mechanism: input.mechanism,
                krnImplication: input.krnImplication,
                doesNotProve: input.doesNotProve,
                trustTier: input.trustTier,
                supportType: input.supportType,
                consumer: input.consumer,
                status: input.status ?? "proposed",
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Persisted IDs:");
    expect(result.stdout).toContain("sourceArtifact: source-artifact-1");
    expect(result.stdout).toContain("sourceClaim: source-claim-1");
    expect(result.stdout).toContain("runId: execution-run-1");
    expect(result.stdout).toContain("doesNotProve: This does not prove graph retrieval quality");
  });

  it("prints source decision link help", async () => {
    const result = await runCli(["source", "decision", "link", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source decision link");
    expect(result.stdout).toContain("--source-claim-id");
  });

  it("previews source decision link without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Used to justify M22 Postgres-backed source graph edge"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Decision Link");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(result.stdout).toContain("target: harness_run/execution-run-1");
  });

  it("requires database config for source decision link --persist", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Used to justify M22 Postgres-backed source graph edge",
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
      "KRN_DATABASE_URL is required for krn source decision link --persist"
    );
  });

  it("persists source decision link and prints edge details", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Used to justify M22 Postgres-backed source graph edge",
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
                krnImplication: "KRN can link source decisions to runs",
                doesNotProve: "This does not prove retrieval quality",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "M22",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge(input) {
              return {
                id: "source-decision-edge-1",
                sourceClaimId: input.sourceClaimId,
                targetType: input.targetType,
                targetId: input.targetId,
                supportType: input.supportType,
                confidence: input.confidence,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            },
            async getSourceDecisionEdgeById(id) {
              if (id !== "source-decision-edge-1") {
                return undefined;
              }

              return {
                id: "source-decision-edge-1",
                sourceClaimId: "source-claim-1",
                targetType: "harness_run",
                targetId: "execution-run-1",
                supportType: "implementation-boundary",
                confidence: "medium",
                notes: "Used to justify M22 Postgres-backed source graph edge",
                metadata: {},
                createdAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("sourceDecisionEdge: source-decision-edge-1");
    expect(result.stdout).toContain("sourceDecisionEdgeReadback: hit");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(result.stdout).toContain("target: harness_run/execution-run-1");
    expect(result.stdout).toContain("supportType: implementation-boundary");
    expect(result.stdout).toContain("confidence: medium");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("doesNotProve: SourceDecisionEdge readback does not prove source truth");
  });

  it("rejects source decision link when the source claim is rejected", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Rejected sources cannot support decisions",
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
                claim: "Decorative source should not support a decision",
                mechanism: "No usable mechanism",
                krnImplication: "KRN must reject this source.",
                doesNotProve: "This does not prove source rejection is enforced.",
                trustTier: "project-decision",
                supportType: "rejection",
                consumer: "MM-35",
                status: "rejected",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called for rejected claim");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("SourceDecisionEdge requires accepted SourceClaim; current status rejected");
  });

  it("rejects source decision link when the source claim is still proposed", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Proposed sources cannot support decisions",
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
                claim: "Proposed source needs review before decision support",
                mechanism: "No SourceDecision has adopted the claim yet.",
                krnImplication: "KRN must not turn proposed evidence into decision support.",
                doesNotProve: "This does not prove all source graph paths are authoritative.",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "source decision link",
                status: "proposed",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called for proposed claim");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("SourceDecisionEdge requires accepted SourceClaim; current status proposed");
  });

  it("prints source claim reject help", async () => {
    const result = await runCli(["source", "claim", "reject", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source claim reject");
    expect(result.stdout).toContain("--rejected-because");
  });

  it("previews source claim reject without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "reject",
        "--title",
        "Decorative source example",
        "--attempted-claim",
        "Interesting AI engineering link",
        "--rejected-because",
        "decorative",
        "--reason",
        "No mechanism, consumer, falsifier, or decision support"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Claim Reject");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("rejectedBecause: decorative");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("requires database config for source claim reject --persist", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "reject",
        "--title",
        "Decorative source example",
        "--attempted-claim",
        "Interesting AI engineering link",
        "--rejected-because",
        "decorative",
        "--reason",
        "No mechanism, consumer, falsifier, or decision support",
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
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn source claim reject --persist");
  });

  it("persists source claim rejection without creating a SourceClaim", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "claim",
        "reject",
        "--run-id",
        "execution-run-1",
        "--title",
        "Decorative source example",
        "--attempted-claim",
        "Interesting AI engineering link",
        "--rejected-because",
        "decorative",
        "--reason",
        "No mechanism, consumer, falsifier, or decision support",
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
            async createSourceRejection(input) {
              return {
                id: "source-rejection-1",
                projectId: input.projectId,
                executionRunId: input.executionRunId,
                sourceArtifactId: input.sourceArtifactId,
                sourceClaimId: input.sourceClaimId,
                title: input.title,
                attemptedClaim: input.attemptedClaim,
                rejectedBecause: input.rejectedBecause,
                reason: input.reason,
                doesNotProve: input.doesNotProve,
                consumer: input.consumer,
                metadata: input.metadata ?? {},
                rejectedAt: now
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
    expect(result.stdout).toContain("sourceRejection: source-rejection-1");
    expect(result.stdout).toContain("rejectedBecause: decorative");
    expect(result.stdout).toContain("No SourceClaim created");
  });
});
