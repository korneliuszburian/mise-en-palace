import { describe, expect, it } from "vitest";

import type {
  SourceClaimStatus
} from "@krn/core";

import type {
  CreateAntiMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput
} from "@krn/harness/repositories/internal";

import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import { findRepoRoot } from "../cli-file-boundary.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "../database-runtime.js";
import { runCli } from "../run-cli.js";

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
  async listMemoryRecordsForProject(): Promise<never> {
    throw new Error("listMemoryRecordsForProject should not be called");
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

const unusedSourceRepository = {
  async createSourceArtifact(): Promise<never> {
    throw new Error("createSourceArtifact should not be called");
  },
  async createSourceClaim(): Promise<never> {
    throw new Error("createSourceClaim should not be called");
  },
  async getSourceClaimById(): Promise<never> {
    throw new Error("getSourceClaimById should not be called");
  },
  async listClaimsForProject(): Promise<never> {
    throw new Error("listClaimsForProject should not be called");
  },
  async createSourceClaimEdge(): Promise<never> {
    throw new Error("createSourceClaimEdge should not be called");
  },
  async listSourceClaimEdgesForClaim(): Promise<never> {
    throw new Error("listSourceClaimEdgesForClaim should not be called");
  },
  async createSourceDecisionEdge(): Promise<never> {
    throw new Error("createSourceDecisionEdge should not be called");
  },
  async getSourceDecisionEdgeById(): Promise<never> {
    throw new Error("getSourceDecisionEdgeById should not be called");
  },
  async createSourceRejection(): Promise<never> {
    throw new Error("createSourceRejection should not be called");
  }
} satisfies DatabaseRuntime["sourceRepository"];

type NoStoreCompilerDependencies = ReturnType<typeof createNoStoreCompilerDependencies>;
type SourceHarnessRunRepository =
  NoStoreCompilerDependencies["harnessRunRepository"] &
  DatabaseRuntime["harnessRunRepository"];

const createSourceHarnessRunRepository = (
  dependencies: NoStoreCompilerDependencies
): SourceHarnessRunRepository => ({
  ...dependencies.harnessRunRepository,
  async createExecutionRun(): Promise<never> {
    throw new Error("createExecutionRun should not be called");
  },
  async getHarnessRunByExecutionRunId(): Promise<never> {
    throw new Error("getHarnessRunByExecutionRunId should not be called");
  },
  async createEvidenceBundle(): Promise<never> {
    throw new Error("createEvidenceBundle should not be called");
  },
  async createReviewAssessment(): Promise<never> {
    throw new Error("createReviewAssessment should not be called");
  },
  async createFeedbackDelta(): Promise<never> {
    throw new Error("createFeedbackDelta should not be called");
  }
});

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
    const expectedRepoPathHint = await findRepoRoot(process.cwd());
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedRepoPathHint: string | undefined;
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
        createDatabaseRuntime: async (input) => {
          capturedRepoPathHint = input.repoPathHint;

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: dependencies,
            sourceRepository: {
              ...unusedSourceRepository,
              async createSourceArtifact(sourceArtifactInput) {
                return {
                  id: "source-artifact-1",
                  ...(sourceArtifactInput.projectId === undefined
                    ? {}
                    : { projectId: sourceArtifactInput.projectId }),
                  kind: sourceArtifactInput.kind,
                  trustTier: sourceArtifactInput.trustTier,
                  uri: sourceArtifactInput.uri,
                  title: sourceArtifactInput.title,
                  contentHash: sourceArtifactInput.contentHash,
                  capturedAt: now,
                  metadata: sourceArtifactInput.metadata ?? {},
                  createdAt: now,
                  updatedAt: now
                };
              },
              async createSourceClaim(sourceClaimInput) {
                return {
                  id: "source-claim-1",
                  sourceArtifactId: sourceClaimInput.sourceArtifactId,
                  ...(sourceClaimInput.executionRunId === undefined
                    ? {}
                    : { executionRunId: sourceClaimInput.executionRunId }),
                  claim: sourceClaimInput.claim,
                  mechanism: sourceClaimInput.mechanism,
                  krnImplication: sourceClaimInput.krnImplication,
                  doesNotProve: sourceClaimInput.doesNotProve,
                  trustTier: sourceClaimInput.trustTier,
                  supportType: sourceClaimInput.supportType,
                  consumer: sourceClaimInput.consumer,
                  status: sourceClaimInput.status ?? "proposed",
                  metadata: sourceClaimInput.metadata ?? {},
                  createdAt: now,
                  updatedAt: now
                };
              }
            },
            harnessRunRepository: createSourceHarnessRunRepository(dependencies),
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
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
    expect(capturedRepoPathHint).toBe(expectedRepoPathHint);
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

  it("prints source decision adopt help", async () => {
    const result = await runCli(["source", "decision", "adopt", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source decision adopt");
    expect(result.stdout).toContain("--source-claim-id");
    expect(result.stdout).toContain("--rationale");
  });

  it("previews source decision adoption without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt source claim for decision-linked readback.",
        "--rationale",
        "The claim has mechanism, consumer, falsifier, and doesNotProve.",
        "--falsifier",
        "Source search cannot read back the decision support.",
        "--consumer",
        "source decision link dogfood"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Decision Adopt");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(result.stdout).toContain("status: adopt");
  });

  it("prints source decision adopt usage when required fields are missing", async () => {
    const result = await runCli(["source", "decision", "adopt", "--source-claim-id", "source-claim-1"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage: krn source decision adopt");
    expect(result.stderr).toContain("--rationale");
  });

  it("requires database config for source decision adopt --persist", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt source claim for decision-linked readback.",
        "--rationale",
        "The claim has mechanism, consumer, falsifier, and doesNotProve.",
        "--falsifier",
        "Source search cannot read back the decision support.",
        "--consumer",
        "source decision link dogfood",
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
      "KRN_DATABASE_URL is required for krn source decision adopt --persist"
    );
  });

  it("persists source decision adoption and prints accepted claim readback", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt source claim for decision-linked readback.",
        "--rationale",
        "The claim has mechanism, consumer, falsifier, and doesNotProve.",
        "--falsifier",
        "Source search cannot read back the decision support.",
        "--consumer",
        "source decision link dogfood",
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
            ...unusedSourceRepository,
            async createSourceDecision(input) {
              return {
                id: "source-decision-1",
                ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
                ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
                status: input.status,
                decision: input.decision,
                rationale: input.rationale,
                falsifier: input.falsifier,
                consumer: input.consumer,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN source decisions should be operator-facing.",
                mechanism: "SourceDecision adoption updates claim lifecycle.",
                krnImplication: "SourceDecisionEdge link can use accepted claims.",
                doesNotProve: "This does not prove source truth.",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "source decision link dogfood",
                falsifier: "Accepted claim readback fails.",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
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
    expect(result.stdout).toContain("sourceDecision: source-decision-1");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(result.stdout).toContain("sourceClaimReadback: accepted");
    expect(result.stdout).toContain("status: adopt");
    expect(result.stdout).toContain("rationale: The claim has mechanism, consumer, falsifier, and doesNotProve.");
    expect(result.stdout).toContain("falsifier: Source search cannot read back the decision support.");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("doesNotProve: SourceDecision adoption does not prove source truth");
  });

  it("adopts and links a source decision in one command via --link", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt and link in one command.",
        "--rationale",
        "The --link path removes the two-command teach friction.",
        "--falsifier",
        "The edge is absent from decision-link readback.",
        "--consumer",
        "source decision adopt link dogfood",
        "--persist",
        "--link",
        "--link-target-type",
        "architecture_decision",
        "--link-target-id",
        "governing-bounded-loop",
        "--link-support-type",
        "implementation-boundary",
        "--link-confidence",
        "high",
        "--link-notes",
        "Combined adopt+link edge."
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
            ...unusedSourceRepository,
            async createSourceDecision(input) {
              return {
                id: "source-decision-1",
                ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
                ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
                status: input.status,
                decision: input.decision,
                rationale: input.rationale,
                falsifier: input.falsifier,
                consumer: input.consumer,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN source decisions should be operator-facing.",
                mechanism: "Combined adopt+link updates claim lifecycle.",
                krnImplication: "One command can adopt and decision-link.",
                doesNotProve: "This does not prove source truth.",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "source decision adopt link dogfood",
                falsifier: "Accepted claim readback fails.",
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
            }
          },
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("sourceDecision: source-decision-1");
    expect(result.stdout).toContain("sourceClaimReadback: accepted");
    expect(result.stdout).toContain("sourceDecisionEdge: source-decision-edge-1");
    expect(result.stdout).toContain("edgeTarget: architecture_decision/governing-bounded-loop");
    expect(result.stdout).toContain("edgeSupportType: implementation-boundary");
    expect(result.stdout).toContain("edgeConfidence: high");
  });

  it("rejects --link without --link-target-type and --link-target-id", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt with link but no target.",
        "--rationale",
        "The --link path requires a target.",
        "--falsifier",
        "The edge has no target.",
        "--consumer",
        "source decision adopt link dogfood",
        "--persist",
        "--link"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage: krn source decision adopt");
    expect(result.stderr).toContain("--link");
  });

  it("fails source decision adoption when accepted claim readback is missing", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt source claim for decision-linked readback.",
        "--rationale",
        "The claim has mechanism, consumer, falsifier, and doesNotProve.",
        "--falsifier",
        "Source search cannot read back the decision support.",
        "--consumer",
        "source decision link dogfood",
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
            ...unusedSourceRepository,
            async createSourceDecision(input) {
              return {
                id: "source-decision-1",
                ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
                ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
                status: input.status,
                decision: input.decision,
                rationale: input.rationale,
                falsifier: input.falsifier,
                consumer: input.consumer,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getSourceClaimById() {
              return undefined;
            }
          },
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("SourceClaim readback missing after adoption: source-claim-1");
  });

  it("fails source decision adoption when claim readback is not accepted", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt source claim for decision-linked readback.",
        "--rationale",
        "The claim has mechanism, consumer, falsifier, and doesNotProve.",
        "--falsifier",
        "Source search cannot read back the decision support.",
        "--consumer",
        "source decision link dogfood",
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
            ...unusedSourceRepository,
            async createSourceDecision(input) {
              return {
                id: "source-decision-1",
                ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
                ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
                status: input.status,
                decision: input.decision,
                rationale: input.rationale,
                falsifier: input.falsifier,
                consumer: input.consumer,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN source decisions should be operator-facing.",
                mechanism: "SourceDecision adoption updates claim lifecycle.",
                krnImplication: "SourceDecisionEdge link can use accepted claims.",
                doesNotProve: "This does not prove source truth.",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "source decision link dogfood",
                falsifier: "Accepted claim readback fails.",
                status: "proposed",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "SourceDecision adoption requires accepted SourceClaim readback; current status proposed"
    );
  });

  it("persists source decision adoption before linking a decision edge", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let sourceClaimStatus: SourceClaimStatus = "proposed";
    const createDatabaseRuntime = async (): Promise<DatabaseRuntime> => ({
      workspaceId: "workspace-1",
      projectId: "project-1",
      compilerDependencies: dependencies,
      sourceRepository: {
        ...unusedSourceRepository,
        async createSourceDecision(input) {
          sourceClaimStatus = "accepted";

          return {
            id: "source-decision-1",
            ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
            ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
            status: input.status,
            decision: input.decision,
            rationale: input.rationale,
            falsifier: input.falsifier,
            consumer: input.consumer,
            metadata: input.metadata ?? {},
            createdAt: now,
            updatedAt: now
          };
        },
        async getSourceClaimById(id) {
          return {
            id,
            sourceArtifactId: "source-artifact-1",
            claim: "KRN source decisions should be operator-facing.",
            mechanism: "SourceDecision adoption updates claim lifecycle.",
            krnImplication: "SourceDecisionEdge link can use accepted claims.",
            doesNotProve: "This does not prove source truth.",
            trustTier: "project-decision",
            supportType: "implementation-boundary",
            consumer: "source decision link dogfood",
            falsifier: "Accepted claim readback fails.",
            status: sourceClaimStatus,
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
            confidence: "high",
            notes: "Used to prove adoption before decision-edge link",
            metadata: {},
            createdAt: now
          };
        }
      },
      harnessRunRepository: createSourceHarnessRunRepository(dependencies),
      memoryRepository: unusedMemoryRepository,
      async close() {
        return undefined;
      }
    });
    const adoption = await runCli(
      [
        "source",
        "decision",
        "adopt",
        "--source-claim-id",
        "source-claim-1",
        "--decision",
        "Adopt source claim for decision-linked readback.",
        "--rationale",
        "The claim has mechanism, consumer, falsifier, and doesNotProve.",
        "--falsifier",
        "Source search cannot read back the decision support.",
        "--consumer",
        "source decision link dogfood",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime
      }
    );
    const link = await runCli(
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
        "high",
        "--notes",
        "Used to prove adoption before decision-edge link",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime
      }
    );

    expect(adoption.exitCode).toBe(0);
    expect(adoption.stdout).toContain("sourceClaimReadback: accepted");
    expect(link.exitCode).toBe(0);
    expect(link.stderr).toBe("");
    expect(link.stdout).toContain("sourceDecisionEdge: source-decision-edge-1");
    expect(link.stdout).toContain("sourceDecisionEdgeReadback: hit");
    expect(link.stdout).toContain("target: harness_run/execution-run-1");
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
            ...unusedSourceRepository,
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
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
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
            ...unusedSourceRepository,
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
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
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
            ...unusedSourceRepository,
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
          harnessRunRepository: createSourceHarnessRunRepository(dependencies),
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
    let runtimeInput: DatabaseRuntimeInput | undefined;
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
        cwd: "/repo",
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input) => {
          runtimeInput = input;

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: dependencies,
            sourceRepository: {
              ...unusedSourceRepository,
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
                  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
                  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
                  ...(input.sourceArtifactId === undefined ? {} : { sourceArtifactId: input.sourceArtifactId }),
                  ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
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
            harnessRunRepository: createSourceHarnessRunRepository(dependencies),
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("sourceRejection: source-rejection-1");
    expect(result.stdout).toContain("rejectedBecause: decorative");
    expect(result.stdout).toContain("No SourceClaim created");
    expect(runtimeInput?.repoPathHint).toBe("/repo");
  });
});
