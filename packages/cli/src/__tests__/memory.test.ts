import { describe, expect, it } from "vitest";

import type {
  AntiMemoryCandidate,
  MemoryApplication,
  MemoryCandidate
} from "@krn/core";
import type { HarnessRunAggregate } from "@krn/core/repositories/internal";
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
} from "@krn/core/repositories/internal";

import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import type { DatabaseRuntime } from "../database-runtime.js";
import { runCli } from "../run-cli.js";
import { runMemoryRecordApplyCommand } from "../run-memory-record-apply-command.js";
import { currentDecisionPacketBindingForAggregate } from "../packet-usefulness-authorization.js";

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
  async getSourceClaimForProject(): Promise<never> {
    throw new Error("getSourceClaimForProject should not be called");
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
  async listSourceDecisionEdgesForClaim(): Promise<never> {
    throw new Error("listSourceDecisionEdgesForClaim should not be called");
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
type MemoryHarnessRunRepository =
  NoStoreCompilerDependencies["harnessRunRepository"] &
  DatabaseRuntime["harnessRunRepository"];

const memoryHarnessRunAggregate = (projectId: string): HarnessRunAggregate => ({
  operatorIntent: {
    id: "intent-1",
    workspaceId: "workspace-1",
    projectId,
    source: "cli",
    rawIntent: "memory candidate add",
    status: "received",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-1",
    operatorIntentId: "intent-1",
    projectId,
    title: "Capture memory candidate",
    objective: "Persist a reviewed memory candidate.",
    constraints: [],
    nonGoals: [],
    acceptance: [],
    status: "active",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  harnessPlan: {
    id: "harness-plan-1",
    taskContractId: "task-1",
    version: 1,
    status: "ready",
    summary: "Memory candidate plan",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  executionRun: {
    id: "execution-run-1",
    harnessPlanId: "harness-plan-1",
    adapter: "codex",
    status: "running",
    startedAt: now,
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  contextAssembly: {
    id: "context-assembly-1",
    harnessPlanId: "harness-plan-1",
    status: "assembled",
    inclusions: [{
      subjectType: "memory_record",
      subjectId: "memory-record-1",
      reason: "Selected retained memory.",
      expectedUse: "Use for current task.",
      sourceAuthority: "project-decision"
    }],
    exclusions: [],
    metadata: {},
    createdAt: now
  },
  evidenceBundles: [],
  reviewAssessments: [],
  feedbackDeltas: [],
  runEvents: []
});

const createMemoryHarnessRunRepository = (
  dependencies: NoStoreCompilerDependencies,
  runProjectId?: string
): MemoryHarnessRunRepository => ({
  ...dependencies.harnessRunRepository,
  async createExecutionRun(): Promise<never> {
    throw new Error("createExecutionRun should not be called");
  },
  async getHarnessRunByExecutionRunId() {
    return runProjectId === undefined ? undefined : memoryHarnessRunAggregate(runProjectId);
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

const createPersistedMemoryCandidate = (
  input: CreateMemoryCandidateInput
): MemoryCandidate => ({
  id: "memory-candidate-1",
  projectId: input.projectId,
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
  proposedBy: input.proposedBy,
  kind: input.kind,
  status: input.status ?? "proposed",
  summary: input.summary,
  body: input.body,
  owner: input.owner,
  confidence: input.confidence,
  applicationGuidance: input.applicationGuidance,
  ...(input.invalidationRule === undefined
    ? {}
    : { invalidationRule: input.invalidationRule }),
  sourceClaimIds: input.sourceClaimIds ?? [],
  sourceLineage: input.sourceLineage,
  isUserPreference: input.isUserPreference,
  validFrom: now,
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

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
                claim: "Source graph should use Postgres edge tables first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link memory to source claims",
                doesNotProve: "This does not prove graph retrieval quality",
                sourceAuthority: "project-decision",
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
            ...unusedMemoryRepository,
            async createMemoryCandidate(input) {
              capturedCandidate = input;

              return createPersistedMemoryCandidate(input);
            }
          },
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "run-project-1"),
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
      projectId: "run-project-1",
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

  it("falls back to runtime project when memory candidate add run lookup is unavailable", async () => {
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
        "execution-run-missing",
        "--kind",
        "constraint",
        "--content",
        "Use bounded Postgres memory project scope",
        "--source-lineage",
        "evidence-bundle-1",
        "--confidence",
        "high",
        "--application-guidance",
        "Use when a persisted run cannot be resolved during memory candidate capture",
        "--invalidation-rule",
        "Revisit when run lookup becomes mandatory",
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
          sourceRepository: unusedSourceRepository,
          memoryRepository: {
            ...unusedMemoryRepository,
            async createMemoryCandidate(input) {
              capturedCandidate = input;

              return createPersistedMemoryCandidate(input);
            }
          },
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(capturedCandidate).toMatchObject({
      projectId: "project-1",
      executionRunId: "execution-run-missing",
      sourceLineage: [{ sourceId: "evidence-bundle-1" }]
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

  it("fails closed before memory candidate promotion when scoped source lookup is unavailable", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const { getSourceClaimForProject: _getSourceClaimForProject, ...sourceRepository } =
      unusedSourceRepository;
    let getCandidateCalled = false;
    let closeCalled = false;

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
          sourceRepository,
          memoryRepository: {
            ...unusedMemoryRepository,
            async getMemoryCandidateById() {
              getCandidateCalled = true;
              throw new Error("getMemoryCandidateById should not be called");
            }
          },
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
          async close() {
            closeCalled = true;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      "Project-scoped SourceClaim lookup is required before promoting memory candidates"
    );
    expect(getCandidateCalled).toBe(false);
    expect(closeCalled).toBe(true);
  });

  it("persists memory candidate promote through MemoryReviewGate", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedPromotion: PromoteMemoryCandidateInput | undefined;
    const scopedSourceClaimReads: Array<{ projectId: string; sourceClaimId: string }> = [];
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
            ...unusedSourceRepository,
            async getSourceClaimById() {
              throw new Error("global source lookup must not be used by memory review");
            },
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimForProject(projectId, id) {
              scopedSourceClaimReads.push({ projectId, sourceClaimId: id });
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN should model source graph with relational edges first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link promoted memory to source claims",
                doesNotProve: "This does not prove graph retrieval quality",
                sourceAuthority: "paper",
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
            ...unusedMemoryRepository,
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
                validFrom: now,
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
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
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
    expect(scopedSourceClaimReads).toEqual([{
      projectId: "project-1",
      sourceClaimId: "source-claim-1"
    }]);
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
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
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
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
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
        "--decision-packet-checksum",
        "preview-checksum",
        "--decision-packet-generated-at",
        now,
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
    expect(result.stdout).toContain("recommendationOutcome: helped");
    expect(result.stdout).toContain("recommendation: retain | requiresReview=false");
    expect(result.stdout).toContain("recommendationMutation: none");
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
        "--decision-packet-checksum",
        "unresolved-without-database",
        "--decision-packet-generated-at",
        now,
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

  it("rejects helped memory record apply without fresh verification evidence", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const packetBinding = currentDecisionPacketBindingForAggregate(
      memoryHarnessRunAggregate("project-1"),
      now
    );
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
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--decision-packet-generated-at",
        packetBinding.packetGeneratedAt,
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
                validFrom: now,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async recordMemoryApplicationOnce(input) {
              capturedApplication = input;

              return {
                application: {
                  id: "memory-application-1",
                  memoryRecordId: input.memoryRecordId,
                  executionRunId: input.executionRunId,
                  packetChecksum: input.packetChecksum,
                  proofClass: "packet_bound",
                  expectedUse: input.expectedUse,
                  ...(input.outcome === undefined ? {} : { outcome: input.outcome }),
                  ...(input.notes === undefined ? {} : { notes: input.notes }),
                  metadata: input.metadata ?? {},
                  createdAt: now
                },
                created: true
              };
            },
            async createMemoryFeedbackEvent() {
              throw new Error("createMemoryFeedbackEvent should not be called");
            }
          },
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "helped memory application requires a fresh successful verification EvidenceBundle"
    );
    expect(capturedApplication).toBeUndefined();
  });

  it("rejects helped memory record apply with an unresolved output reference", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const aggregate = memoryHarnessRunAggregate("project-1");
    aggregate.harnessPlan.metadata = {
      evidenceContract: {
        taskContractId: "task-1",
        commands: [{ command: "pnpm typecheck", required: true }],
        diffRisk: "low",
        reviewBurden: "review",
        rollbackPath: "revert",
        metadata: {}
      }
    };
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate, now);
    aggregate.evidenceBundles = [{
      id: "evidence-bundle-unresolved-output",
      executionRunId: "execution-run-1",
      status: "captured",
      changedFiles: [],
      commands: [{
        command: "pnpm typecheck",
        status: "passed",
        provenance: "captured_output_file",
        exitCode: 0,
        capturedAt: "2026-06-21T12:00:01.000Z",
        outputRef: "missing-output.txt"
      }],
      diffRisk: "low",
      reviewBurden: "review",
      rollbackPath: "revert",
      metadata: {
        decisionPacketChecksum: packetBinding.packetChecksum,
        decisionPacketGeneratedAt: packetBinding.packetGeneratedAt
      },
      createdAt: now,
      updatedAt: now
    }];

    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--decision-packet-generated-at",
        packetBinding.packetGeneratedAt,
        "--evidence-bundle-id",
        "evidence-bundle-unresolved-output",
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
          sourceRepository: unusedSourceRepository,
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
                validFrom: now,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: {
            ...createMemoryHarnessRunRepository(dependencies, "project-1"),
            async getHarnessRunByExecutionRunId() {
              return aggregate;
            }
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "helped memory application requires a fresh successful verification EvidenceBundle"
    );
  });

  it.each([{
    label: "terminal execution run",
    taskStatus: "active" as const,
    runStatus: "succeeded" as const,
    bindingTaskContractId: "task-1"
  }, {
    label: "closed task contract",
    taskStatus: "closed" as const,
    runStatus: "running" as const,
    bindingTaskContractId: "task-1"
  }, {
    label: "mismatched task binding",
    taskStatus: "active" as const,
    runStatus: "running" as const,
    bindingTaskContractId: "task-other"
  }])("rejects helped memory evidence from an inactive $label contract", async (scenario) => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const aggregate = memoryHarnessRunAggregate("project-1");
    aggregate.taskContract.status = scenario.taskStatus;
    aggregate.executionRun.status = scenario.runStatus;
    aggregate.harnessPlan.metadata = {
      evidenceContract: {
        taskContractId: scenario.bindingTaskContractId,
        commands: [{ command: "pnpm typecheck", required: true }],
        diffRisk: "low",
        reviewBurden: "review",
        rollbackPath: "revert",
        metadata: {}
      }
    };
    const packetBinding = currentDecisionPacketBindingForAggregate(aggregate, now);
    aggregate.evidenceBundles = [{
      id: "evidence-bundle-inactive-contract",
      executionRunId: aggregate.executionRun.id,
      status: "captured",
      changedFiles: [],
      commands: [{
        command: "pnpm typecheck",
        status: "passed",
        provenance: "command_runner",
        exitCode: 0,
        capturedAt: now,
        outputRef: "smoke:inactive-contract"
      }],
      diffRisk: "low",
      reviewBurden: "review",
      rollbackPath: "revert",
      metadata: {
        decisionPacketChecksum: packetBinding.packetChecksum,
        decisionPacketGeneratedAt: packetBinding.packetGeneratedAt
      },
      createdAt: now,
      updatedAt: now
    }];

    await expect(runMemoryRecordApplyCommand({
      command: {
        kind: "memoryRecordApply",
        persist: true,
        runId: aggregate.executionRun.id,
        memoryId: "memory-record-1",
        evidenceBundleId: "evidence-bundle-inactive-contract",
        decisionPacketChecksum: packetBinding.packetChecksum,
        decisionPacketGeneratedAt: packetBinding.packetGeneratedAt,
        outcome: "helped",
        notes: "Inactive contracts cannot authorize helped feedback.",
        metadata: {}
      },
      env: { KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn" },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: dependencies,
        sourceRepository: unusedSourceRepository,
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
              applicationGuidance: "Use for this task.",
              invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
              sourceLineage: [{ sourceId: "source-claim-1" }],
              isUserPreference: false,
              validFrom: now,
              positiveFeedbackCount: 0,
              negativeFeedbackCount: 0,
              metadata: {},
              createdAt: now,
              updatedAt: now
            };
          },
          async recordMemoryApplicationWithEffectsOnce(): Promise<never> {
            throw new Error("inactive usefulness write reached repository");
          }
        },
        harnessRunRepository: {
          ...createMemoryHarnessRunRepository(dependencies, "project-1"),
          async getHarnessRunByExecutionRunId() {
            return aggregate;
          }
        },
        async close() {}
      })
    })).rejects.toThrow(
      "helped memory application requires a fresh successful verification EvidenceBundle"
    );
  });

  it("does not repeat the same packet-bound memory application", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const packetBinding = currentDecisionPacketBindingForAggregate(
      memoryHarnessRunAggregate("project-1"),
      now
    );
    let application: MemoryApplication | undefined;
    let recordCalls = 0;
    const command = {
      kind: "memoryRecordApply" as const,
      persist: true,
      runId: "execution-run-1",
      memoryId: "memory-record-1",
      decisionPacketChecksum: packetBinding.packetChecksum,
      decisionPacketGeneratedAt: packetBinding.packetGeneratedAt,
      outcome: "neutral" as const,
      notes: "Replay should not record this packet twice.",
      metadata: {}
    };
    const run = () => runMemoryRecordApplyCommand({
      command,
      env: { KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn" },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: dependencies,
        sourceRepository: unusedSourceRepository,
        harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
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
              validFrom: now,
              positiveFeedbackCount: 0,
              negativeFeedbackCount: 0,
              metadata: {},
              createdAt: now,
              updatedAt: now
            };
          },
          async recordMemoryApplicationWithEffectsOnce(input) {
            if (application === undefined) {
              recordCalls += 1;
              application = {
                id: "memory-application-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                packetChecksum: input.packetChecksum,
                proofClass: "packet_bound",
                expectedUse: input.expectedUse,
                outcome: input.outcome,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };

            return { application, created: true };
            }

            return { application, created: false };
          }
        },
        async close() {
          return undefined;
        }
      })
    });

    const first = await run();
    const replay = await run();

    expect(first.stdout).toContain("memoryApplication: memory-application-1");
    expect(replay.stdout).toContain("memoryApplication: memory-application-1");
    expect(recordCalls).toBe(1);
  });

  it.each([
    ["stale", "stale_detected", 70, ["refresh", "supersede"]],
    ["hurt", "demoted", 60, ["demote", "delete"]]
  ] as const)("persists %s memory record apply and creates feedback event", async (
    outcome,
    eventType,
    expectedConfidence,
    expectedRecommendationActions
  ) => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const packetBinding = currentDecisionPacketBindingForAggregate(
      memoryHarnessRunAggregate("project-1"),
      now
    );
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
        "--decision-packet-checksum",
        packetBinding.packetChecksum,
        "--decision-packet-generated-at",
        packetBinding.packetGeneratedAt,
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
                validFrom: now,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async recordMemoryApplicationWithEffectsOnce(input) {
              const feedbackInput = input.negativeEffects;
              if (feedbackInput === undefined) {
                throw new Error("negative effects are required in this test");
              }

              const feedbackEvent = {
                id: "memory-feedback-event-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                eventType: feedbackInput.eventType,
                direction: "negative" as const,
                note: feedbackInput.note,
                reason: feedbackInput.reason,
                ...(feedbackInput.evidenceRef === undefined
                  ? {}
                  : { evidenceRef: feedbackInput.evidenceRef }),
                metadata: feedbackInput.metadata ?? {},
                createdAt: now
              };
              capturedFeedbackEvent = {
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                eventType: feedbackInput.eventType,
                direction: "negative",
                note: feedbackInput.note,
                reason: feedbackInput.reason,
                ...(feedbackInput.evidenceRef === undefined
                  ? {}
                  : { evidenceRef: feedbackInput.evidenceRef }),
                metadata: feedbackInput.metadata ?? {}
              };
              const candidateInput = {
                projectId: "project-1",
                executionRunId: input.executionRunId,
                proposedBy: "krn-memory-feedback",
                maintenanceIdentity: "memory-application:test",
                ...feedbackInput.candidate,
                metadata: feedbackInput.metadata ?? {}
              };
              capturedAntiMemoryCandidate = candidateInput;

              return {
                application: {
                  id: "memory-application-1",
                  memoryRecordId: input.memoryRecordId,
                  executionRunId: input.executionRunId,
                  packetChecksum: input.packetChecksum,
                  proofClass: "packet_bound",
                  expectedUse: input.expectedUse,
                  outcome: input.outcome,
                  notes: input.notes,
                  metadata: input.metadata ?? {},
                  createdAt: now
                },
                created: true,
                feedbackEvent,
                antiMemoryCandidate: createPersistedAntiMemoryCandidate(candidateInput)
              };
            },
          },
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies, "project-1"),
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
    expect(result.stdout).toContain(`recommendationOutcome: ${outcome}`);
    expect(result.stdout).toContain("recommendationMutation: none");
    for (const action of expectedRecommendationActions) {
      expect(result.stdout).toContain(`recommendation: ${action} | requiresReview=true`);
    }
    expect(capturedFeedbackEvent).toMatchObject({
      memoryRecordId: "memory-record-1",
      executionRunId: "execution-run-1",
      eventType,
      direction: "negative",
      reason: "Graph traversal now exceeds Postgres edge-table performance",
      evidenceRef: `packet:${packetBinding.packetChecksum}`
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
      applicationOutcome: outcome
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
                claim: "Markdown files are audit artifacts, not runtime memory",
                mechanism: "KRN runtime memory is store-backed in Postgres",
                krnImplication: "Do not read markdown as Memory Core",
                doesNotProve: "No markdown can ever be source material",
                sourceAuthority: "project-decision",
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
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies),
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
    const scopedSourceClaimReads: Array<{ projectId: string; sourceClaimId: string }> = [];
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
            ...unusedSourceRepository,
            async getSourceClaimById() {
              throw new Error("global source lookup must not be used by anti-memory review");
            },
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimForProject(projectId, id) {
              scopedSourceClaimReads.push({ projectId, sourceClaimId: id });
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Markdown files are audit artifacts, not runtime memory",
                mechanism: "KRN runtime memory is store-backed in Postgres",
                krnImplication: "Do not read markdown as Memory Core",
                doesNotProve: "This does not prove markdown cannot be source material",
                sourceAuthority: "project-decision",
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
          harnessRunRepository: createMemoryHarnessRunRepository(dependencies),
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
    expect(scopedSourceClaimReads).toEqual([{
      projectId: "project-1",
      sourceClaimId: "source-claim-1"
    }]);
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
