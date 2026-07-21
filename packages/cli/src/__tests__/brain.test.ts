import { describe, expect, it } from "vitest";
import path from "node:path";
import type {
  FeedbackDelta,
  MemoryRecord
} from "@krn/core";
import {
  stampCurrentDecisionPacketAuthorityMetadata
} from "@krn/core";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  createNoStoreCompilerDependencies
} from "../no-store-repositories.js";

import { runCli } from "../run-cli.js";

const now = "2026-06-21T12:00:00.000Z";
const usefulnessPacketChecksum = "brain-usefulness-packet";

const storeKnowledgeMemory = (): MemoryRecord => ({
  id: "memory-record-1" as MemoryRecord["id"],
  projectId: "project-1" as MemoryRecord["projectId"],
  key: "knowledge:store-backed-usefulness",
  kind: "procedure",
  status: "active",
  summary: "Store-backed usefulness knowledge",
  body: "Use store-backed feedback_delta events for usefulness readback.",
  owner: "krn",
  confidence: 95,
  applicationGuidance: "Prefer store-backed usefulness over static JSON ledgers.",
  invalidationRule: "A static JSON usefulness ledger becomes the runtime source again.",
  sourceLineage: [{
    sourceId: "source:store-feedback",
    note: "feedback_delta metadata"
  }],
  isUserPreference: false,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 0,
  metadata: {
    knowledgeId: "store-backed-usefulness",
    doesNotProve: "This memory does not prove broad usefulness quality.",
    falsifier: "A runtime readback ignores feedback_delta usefulness outcomes."
  },
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const knowledgeFeedbackDelta = (
  knowledgeId = "knowledge:store-backed-usefulness",
  overrides: {
    id?: string;
    status?: FeedbackDelta["status"];
    outcome?: "helped" | "stale" | "hurt";
    createdAt?: string;
  } = {}
): FeedbackDelta => ({
  id: (overrides.id ?? "feedback-delta-1") as FeedbackDelta["id"],
  reviewAssessmentId: "review-assessment-1" as FeedbackDelta["reviewAssessmentId"],
  status: overrides.status ?? "accepted",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: stampCurrentDecisionPacketAuthorityMetadata({
    knowledgeUsefulnessOutcomes: [{
      knowledgeId,
      outcome: overrides.outcome ?? "helped",
      reason: "The knowledge changed the implementation decision.",
      evidenceRefs: [
        `packet:${usefulnessPacketChecksum}`,
        "test:memory recall store-backed"
      ],
      doesNotProve: "One helped event does not prove broad usefulness."
    }]
  }, {
    checksum: usefulnessPacketChecksum,
    generatedAt: now,
    sourceRunLifecycleRevision: 1
  }),
  createdAt: overrides.createdAt ?? now,
  updatedAt: overrides.createdAt ?? now
});

const createBrainRecallDatabaseRuntime = (
  feedbackKnowledgeId = "memory-record-1",
  feedbackDeltas?: readonly FeedbackDelta[]
) => async (_input: DatabaseRuntimeInput): Promise<DatabaseRuntime> => ({
  workspaceId: "workspace-1",
  projectId: "project-1",
  compilerDependencies: createNoStoreCompilerDependencies({
    now: () => now,
    createId: (prefix) => `${prefix}-1`
  }),
  harnessRunRepository: {
    async createExecutionRun() {
      throw new Error("createExecutionRun should not be called");
    },
    async getHarnessRunByExecutionRunId() {
      return undefined;
    },
    async createEvidenceBundle() {
      throw new Error("createEvidenceBundle should not be called");
    },
    async createReviewAssessment() {
      throw new Error("createReviewAssessment should not be called");
    },
    async createFeedbackDelta() {
      throw new Error("createFeedbackDelta should not be called");
    },
    async listFeedbackDeltasForSubjects(input) {
      expect(input.projectId).toBe("project-1");
      expect(input.limitPerSubject).toBe(100);
      expect(input.subjects).toEqual([{
        kind: "knowledge",
        id: feedbackKnowledgeId
      }]);

      return feedbackDeltas === undefined
        ? [knowledgeFeedbackDelta(feedbackKnowledgeId)]
        : [...feedbackDeltas];
    }
  },
  sourceRepository: {
    async createSourceArtifact() {
      throw new Error("createSourceArtifact should not be called");
    },
    async createSourceClaim() {
      throw new Error("createSourceClaim should not be called");
    },
    async getSourceClaimById() {
      return undefined;
    },
    async listClaimsForProject() {
      return [];
    },
    async createSourceClaimEdge() {
      throw new Error("createSourceClaimEdge should not be called");
    },
    async listSourceClaimEdgesForClaim() {
      return [];
    },
    async createSourceDecisionEdge() {
      throw new Error("createSourceDecisionEdge should not be called");
    },
    async getSourceDecisionEdgeById() {
      return undefined;
    },
    async listSourceDecisionEdgesForClaim() {
      return [];
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
      return undefined;
    },
    async promoteReviewedMemoryCandidate() {
      throw new Error("promoteReviewedMemoryCandidate should not be called");
    },
    async rejectMemoryCandidate() {
      throw new Error("rejectMemoryCandidate should not be called");
    },
    async getMemoryRecordById() {
      return undefined;
    },
    async listMemoryRecordsForProject() {
      return [storeKnowledgeMemory()];
    },
    async listActiveMemory() {
      return [storeKnowledgeMemory()];
    },
    async invalidateMemoryRecord() {
      throw new Error("invalidateMemoryRecord should not be called");
    },
    async recordMemoryApplicationWithEffectsOnce() {
      throw new Error("recordMemoryApplicationWithEffectsOnce should not be called");
    },
    async createMemoryFeedbackEvent() {
      throw new Error("createMemoryFeedbackEvent should not be called");
    },
    async createAntiMemoryCandidate() {
      throw new Error("createAntiMemoryCandidate should not be called");
    },
    async getAntiMemoryCandidateById() {
      return undefined;
    },
    async promoteReviewedAntiMemoryCandidate() {
      throw new Error("promoteReviewedAntiMemoryCandidate should not be called");
    },
    async rejectAntiMemoryCandidate() {
      throw new Error("rejectAntiMemoryCandidate should not be called");
    }
  },
  async close() {}
});

describe("runCli", () => {
  it("prints memory recall readback help", async () => {
    const result = await runCli(["memory", "recall", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn memory recall [--fixture-read-model-file <path>|--fixture-decision-file <path>|--fixture-catalog-file <path>]");
    expect(result.stdout).toContain("Read-only preview commands:");
    expect(result.stdout).toContain("no fixture source defaults to DB-backed MemoryRecord read models plus feedback_delta usefulness outcomes and requires KRN_DATABASE_URL");
  });

  it("explains the store-backed default DB requirement without file sources", async () => {
    const result = await runCli([
      "memory",
      "recall",
      "--text",
      "unknown-first"
    ], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory recall store-backed readback"
    );
    expect(result.stderr).toContain("No fixture source defaults to the store path");
    expect(result.stderr).toContain("--fixture-read-model-file");
  });

  it("renders memory recall through the preferred CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "memory",
      "recall",
      "--fixture-read-model-file",
      "tests/fixtures/brain-knowledge/read-models/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Recall");
    expect(result.stdout).toContain("knowledge:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("does not prove: KRN is product-ready");
  });

  it("renders knowledge decision files through the memory recall CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "memory",
      "recall",
      "--fixture-decision-file",
      "tests/fixtures/brain-knowledge/corpus/knowledge/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Decision files: tests/fixtures/brain-knowledge/corpus/knowledge/ts-boundary-unknown-first-result-state.json");
    expect(result.stdout).toContain("knowledge:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("renders explicit catalog files through the memory recall CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "memory",
      "recall",
      "--fixture-catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Catalog files: tests/fixtures/brain-knowledge/corpus/catalog.json");
    expect(result.stdout).toContain("knowledge:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("defaults memory recall readback to store-backed usefulness from feedback deltas", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "memory",
      "recall",
      "--usefulness-outcome",
      "helped",
      "--json"
    ], {
      cwd: repoRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: createBrainRecallDatabaseRuntime()
    });
    const resource = JSON.parse(result.stdout) as {
      source: string;
      usefulnessSource: string;
      readModels: Array<{
        id: string;
        usefulnessFeedback?: {
          outcome: string;
          evidenceRefs: string[];
        };
      }>;
      proof: {
        proves: string[];
      };
    };

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(resource.source).toBe("memory_store");
    expect(resource.usefulnessSource).toBe("store_backed");
    expect(resource.readModels).toHaveLength(1);
    expect(resource.readModels[0]).toMatchObject({
      id: "knowledge:store-backed-usefulness",
      usefulnessFeedback: {
        outcome: "helped",
        evidenceRefs: [
          `packet:${usefulnessPacketChecksum}`,
          "test:memory recall store-backed"
        ]
      }
    });
    expect(resource.proof.proves).toContain("usefulness feedback was read from store-backed feedback_delta records");
  });

  it("merges store-backed usefulness into explicit seed readModels by knowledge id", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "memory",
      "recall",
      "--fixture-read-model-file",
      "tests/fixtures/brain-knowledge/read-models/ts-boundary-unknown-first-result-state.json",
      "--usefulness-outcome",
      "helped",
      "--json"
    ], {
      cwd: repoRoot,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: createBrainRecallDatabaseRuntime(
        "knowledge:ts-boundary-unknown-first-result-state"
      )
    });
    const resource = JSON.parse(result.stdout) as {
      source: string;
      usefulnessSource: string;
      readModels: Array<{
        id: string;
        usefulnessFeedback?: {
          outcome: string;
        };
      }>;
    };

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(resource.source).toBe("explicit_files");
    expect(resource.usefulnessSource).toBe("store_backed");
    expect(resource.readModels).toEqual([
      expect.objectContaining({
        id: "knowledge:ts-boundary-unknown-first-result-state",
        usefulnessFeedback: expect.objectContaining({
          outcome: "helped"
        })
      })
    ]);
  });

  it("keeps rejected recall feedback non-governing and candidate feedback review-only", async () => {
    const knowledgeId = "knowledge:store-backed-usefulness";
    const result = await runCli([
      "memory",
      "recall",
      "--json"
    ], {
      cwd: path.resolve(process.cwd(), "../.."),
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: createBrainRecallDatabaseRuntime("memory-record-1", [
        knowledgeFeedbackDelta("memory-record-1", {
          id: "feedback-rejected-newer",
          status: "rejected",
          outcome: "hurt",
          createdAt: "2026-06-21T12:02:00.000Z"
        }),
        knowledgeFeedbackDelta("memory-record-1", {
          id: "feedback-candidate-older",
          status: "candidate",
          outcome: "stale",
          createdAt: "2026-06-21T12:01:00.000Z"
        })
      ])
    });
    const resource = JSON.parse(result.stdout) as {
      readModels: Array<{
        id: string;
        nextAction: string;
        usefulnessFeedback?: {
          outcome: string;
          feedbackLifecycleStatus?: string;
        };
      }>;
    };

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(resource.readModels).toEqual([
      expect.objectContaining({
        id: knowledgeId,
        nextAction: "review",
        usefulnessFeedback: expect.objectContaining({
          outcome: "stale",
          feedbackLifecycleStatus: "candidate"
        })
      })
    ]);
  });

  it("renders memory recall as self-contained html", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "memory",
      "recall",
      "--fixture-catalog-file",
      "tests/fixtures/brain-knowledge/corpus/catalog.json",
      "--text",
      "unknown-first",
      "--html"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("KRN Memory Recall");
    expect(result.stdout).toContain("type=\"search\"");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("knowledge:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Proof Boundaries");
  });
});
