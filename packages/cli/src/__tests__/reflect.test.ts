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

describe("runCli", () => {
  it("routes reflect scope commands through the CLI parser", async () => {
    const result = await runCli(["reflect", "--scope", "run:run-1"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn reflect");
  });

  it("guards self-hosting evidence provenance through reflect", async () => {
  const dependencies = createNoStoreCompilerDependencies({
    now: () => now,
    createId: (prefix) => `${prefix}-1`
  });
  const aggregate: HarnessRunAggregate = {
    operatorIntent: {
      id: "operator-intent-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      source: "cli",
      rawIntent: "self-hosting evidence provenance",
      metadata: {},
      createdAt: now
    },
    taskContract: {
      id: "task-contract-1",
      operatorIntentId: "operator-intent-1",
      projectId: "project-1",
      title: "self-hosting evidence provenance",
      objective: "Represent plan/evidence/observe/reflect without false command proof.",
      constraints: ["no MemoryRecord mutation"],
      nonGoals: ["no automatic candidate rows"],
      acceptance: ["explicit command provenance is preserved"],
      status: "active",
      metadata: {},
      createdAt: now,
      updatedAt: now
    },
    harnessPlan: {
      id: "harness-plan-1",
      taskContractId: "task-contract-1",
      version: 1,
      status: "ready",
      summary: "self-hosting provenance plan",
      metadata: {},
      createdAt: now,
      updatedAt: now
    },
    executionRun: {
      id: "execution-run-1",
      harnessPlanId: "harness-plan-1",
      adapter: "codex",
      status: "succeeded",
      metadata: {},
      createdAt: now,
      updatedAt: now
    },
    evidenceBundles: [{
      id: "evidence-bundle-1",
      executionRunId: "execution-run-1",
      status: "captured",
      changedFiles: ["packages/cli/src/parseEvidenceArgs.ts"],
      commands: [
        {
          command: "pnpm typecheck",
          status: "passed",
          provenance: "operator_reported",
          assertedBy: "operator",
          doesNotProve: commandResultDoesNotProve
        },
        {
          command: "pnpm test",
          status: "passed",
          provenance: "captured_output_file",
          outputRef: ".local-lab/p7-self-hosting/03-test.txt",
          doesNotProve: commandResultDoesNotProve
        }
      ],
      diffRisk: "medium",
      reviewBurden: "Review persisted command provenance only.",
      rollbackPath: "git revert <commit>",
      metadata: {},
      createdAt: now,
      updatedAt: now
    }],
    reviewAssessments: [],
    feedbackDeltas: [],
    runEvents: [{
      id: "run-event-1",
      executionRunId: "execution-run-1",
      sequence: 1,
      type: "krn.plan.persisted",
      severity: "info",
      message: "Self-hosting plan persisted",
      payload: {},
      occurredAt: now
    }]
  };
  const observedBodies: string[] = [];
  const observationItem: ObservationItem = {
    id: "observation-item-1",
    groupId: "observation-group-1",
    scope: {
      projectId: "project-1",
      executionRunId: "execution-run-1",
      taskContractId: "task-contract-1"
    },
    kind: "fact",
    status: "candidate",
    priority: "medium",
    confidence: "medium",
    provenanceKind: "evidence_bundle",
    subject: "evidence_bundle",
    summary: "Evidence bundle contains explicit command provenance.",
    body:
      "{\"commands\":[{\"command\":\"pnpm typecheck\",\"provenance\":\"operator_reported\"},{\"command\":\"pnpm test\",\"provenance\":\"captured_output_file\"}]}",
    temporalScope: {
      observedAt: now,
      eventTime: now,
      ingestedAt: now
    },
    sourceRanges: [{
      id: "observation-source-range-1",
      sourceType: "evidence_bundle",
      sourceId: "evidence-bundle-1",
      locator: "evidence_bundles.id:evidence-bundle-1",
      capturedAt: now
    }],
    entityLinks: [],
    claimLinks: [],
    metadata: {},
    createdAt: now,
    updatedAt: now
  };

  let reflectedOutputMemoryCandidateCount: number | undefined;
  const reflectResult = await runCli(
    ["reflect", "--scope", "run:execution-run-1", "--persist"],
    {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createReflectDatabaseRuntime: async () => ({
        async getRunSnapshot(runId: string) {
          expect(runId).toBe("execution-run-1");

          return {
            executionRunId: runId,
            projectId: "project-1",
            taskContractId: "task-contract-1"
          };
        },
        async projectExists() {
          return true;
        },
        observationRepository: {
          async findByRun() {
            return [observationItem];
          },
          async findByScope() {
            return [observationItem];
          }
        },
        sourceRepository: {
          async listClaimsForProject() {
            return [];
          },
          async listSourceClaimsForRun() {
            return [];
          }
        },
        memoryRepository: {
          async listAntiMemoryForProject() {
            return [];
          },
          async listAntiMemoryForRun() {
            return [];
          }
        },
        reflectionRepository: {
          async createReflectionRecord(input) {
            reflectedOutputMemoryCandidateCount = input.output.memoryCandidates.length;

            return {
              id: "reflection-record-1",
              scope: input.scope,
              status: input.status,
              summary: input.summary,
              input: input.input,
              output: input.output,
              metadata: input.metadata ?? {},
              createdAt: now,
              updatedAt: now
            };
          }
        },
        async close() {
          return undefined;
        }
      })
    }
  );

  expect(reflectResult.exitCode).toBe(0);
  expect(reflectResult.stderr).toBe("");
  expect(reflectResult.stdout).toContain("Candidate rows written: no");
  expect(reflectResult.stdout).toContain("MemoryRecord created: no");
  expect(reflectedOutputMemoryCandidateCount).toBe(0);
  });
});
