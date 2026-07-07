import { describe, expect, it } from "vitest";
import path from "node:path";
import type {
  FeedbackDelta,
  MemoryRecord
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

const storePatternMemory = (): MemoryRecord => ({
  id: "memory-record-1" as MemoryRecord["id"],
  projectId: "project-1" as MemoryRecord["projectId"],
  key: "pattern:store-backed-usefulness",
  kind: "pattern",
  status: "active",
  summary: "Store-backed usefulness pattern",
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

const patternFeedbackDelta = (
  brainKnowledgeId = "pattern:store-backed-usefulness"
): FeedbackDelta => ({
  id: "feedback-delta-1" as FeedbackDelta["id"],
  reviewAssessmentId: "review-assessment-1" as FeedbackDelta["reviewAssessmentId"],
  status: "accepted",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: {
    brainKnowledgeUsefulnessOutcomes: [{
      brainKnowledgeId,
      outcome: "helped",
      reason: "The pattern changed the implementation decision.",
      evidenceRefs: ["test:brain knowledge store-only"],
      doesNotProve: "One helped event does not prove broad usefulness."
    }]
  },
  createdAt: now,
  updatedAt: now
});

const createBrainKnowledgeDatabaseRuntime = (
  feedbackPatternId = "pattern:store-backed-usefulness"
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
    async listFeedbackDeltasForProject() {
      return [patternFeedbackDelta(feedbackPatternId)];
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
      return [storePatternMemory()];
    },
    async listActiveMemory() {
      return [storePatternMemory()];
    },
    async invalidateMemoryRecord() {
      throw new Error("invalidateMemoryRecord should not be called");
    },
    async recordMemoryApplication() {
      throw new Error("recordMemoryApplication should not be called");
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
  it("prints brain knowledge readback help", async () => {
    const result = await runCli(["brain", "knowledge", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn brain knowledge [--store-only|--card-file <path>|--knowledge-file <path>|--catalog-file <path>]");
    expect(result.stdout).toContain("Read-only preview commands:");
    expect(result.stdout).toContain("no file source defaults to DB-backed MemoryRecord cards plus feedback_delta usefulness outcomes and requires KRN_DATABASE_URL");
  });

  it("explains the store-backed default DB requirement without file sources", async () => {
    const result = await runCli([
      "brain",
      "knowledge",
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
      "KRN_DATABASE_URL is required for krn brain knowledge store-backed readback"
    );
    expect(result.stderr).toContain("No file source defaults to the store path");
    expect(result.stderr).toContain("--card-file");
  });

  it("renders brain knowledge through the preferred CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
      "--card-file",
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json",
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
    expect(result.stdout).toContain("KRN Brain Knowledge Readback");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("does not prove: KRN is product-ready");
  });

  it("renders brain knowledge decision files through the brain knowledge CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
      "--knowledge-file",
      "corpus/brain-knowledge/patterns/ts-boundary-unknown-first-result-state.json",
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
    expect(result.stdout).toContain("Knowledge files: corpus/brain-knowledge/patterns/ts-boundary-unknown-first-result-state.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("renders explicit catalog files through the brain knowledge CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
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
    expect(result.stdout).toContain("Catalog files: corpus/brain-knowledge/catalog.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("defaults brain knowledge readback to store-backed usefulness from feedback deltas", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
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
      createDatabaseRuntime: createBrainKnowledgeDatabaseRuntime()
    });
    const resource = JSON.parse(result.stdout) as {
      source: string;
      usefulnessSource: string;
      cards: Array<{
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
    expect(resource.cards).toHaveLength(1);
    expect(resource.cards[0]).toMatchObject({
      id: "pattern:store-backed-usefulness",
      usefulnessFeedback: {
        outcome: "helped",
        evidenceRefs: ["test:brain knowledge store-only"]
      }
    });
    expect(resource.proof.proves).toContain("usefulness feedback was read from store-backed feedback_delta records");
  });

  it("merges store-backed usefulness into explicit seed cards by brain knowledge id", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
      "--card-file",
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json",
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
      createDatabaseRuntime: createBrainKnowledgeDatabaseRuntime(
        "pattern:ts-boundary-unknown-first-result-state"
      )
    });
    const resource = JSON.parse(result.stdout) as {
      source: string;
      usefulnessSource: string;
      cards: Array<{
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
    expect(resource.cards).toEqual([
      expect.objectContaining({
        id: "pattern:ts-boundary-unknown-first-result-state",
        usefulnessFeedback: expect.objectContaining({
          outcome: "helped"
        })
      })
    ]);
  });

  it("renders brain knowledge as self-contained html", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
      "--catalog-file",
      "corpus/brain-knowledge/catalog.json",
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
    expect(result.stdout).toContain("KRN Brain Knowledge Readback");
    expect(result.stdout).toContain("type=\"search\"");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Proof Boundaries");
  });
});
