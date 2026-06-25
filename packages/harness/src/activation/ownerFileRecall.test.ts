import { describe, expect, it } from "vitest";

import type {
  TaskContract
} from "@krn/core";

import {
  buildOwnerFileRecallCandidates
} from "./ownerFileRecall.js";
import type {
  TargetActivationReadModel
} from "./ownerFileRecall.js";

const taskContract = (objective: string): TaskContract => ({
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: objective,
  objective,
  constraints: [],
  nonGoals: [],
  acceptance: [],
  status: "active",
  metadata: {},
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z"
});

describe("owner-file recall", () => {
  it("surfaces DB readiness owner files as typed search candidates", () => {
    const candidates = buildOwnerFileRecallCandidates(
      taskContract("Improve DB readiness reporting for checked Postgres endpoint output")
    );

    expect(candidates.map((candidate) => candidate.metadata.ownerFilePath)).toEqual(
      expect.arrayContaining([
        "packages/cli/src/runDbReadinessCommand.ts",
        "packages/cli/src/runDbReadinessCommand.test.ts"
      ])
    );
    expect(candidates[0]).toMatchObject({
      kind: "search",
      subjectType: "search_document",
      subjectId: "11111111-1111-4111-8111-111111111001",
      trustTier: "project-decision"
    });
    expect(candidates[0]?.searchDocumentId).toBeUndefined();
  });

  it("does not add owner files for weak generic readiness matches", () => {
    const candidates = buildOwnerFileRecallCandidates(
      taskContract("Improve doctor readiness wording")
    );

    expect(candidates).toEqual([]);
  });

  it("uses target read-model seeds instead of KRN static owner files for target projects", () => {
    const targetReadModel: TargetActivationReadModel = {
      projectKernelId: "kernel-1",
      repoInstallationIds: ["repo-installation-1"],
      localPathHints: ["/tmp/muke-v2"],
      sourceSeeds: [
        {
          path: "evals",
          kind: "eval_workspace",
          reason: "seed eval, acceptance report, and test owner-file recall"
        },
        {
          path: "mcp",
          kind: "mcp_workspace",
          reason: "seed MCP package and tool owner-file recall"
        }
      ],
      trustExclusions: [
        {
          pathPattern: ".env*",
          reason: "secret-shaped environment files must not enter planning context"
        },
        {
          pathPattern: ".muke/",
          reason: "generated target state is not source truth by default"
        }
      ]
    };
    const candidates = buildOwnerFileRecallCandidates(
      taskContract("Repair muke-v2 eval tests and keep target trust exclusions explicit"),
      { targetReadModel }
    );

    expect(candidates.map((candidate) => candidate.reason)).toEqual(
      expect.arrayContaining([
        "Target source seed: evals",
        "Target trust exclusions for project-scoped planning"
      ])
    );
    expect(candidates).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadata: expect.objectContaining({
            ownerFilePath: "packages/cli/src/runDbReadinessCommand.ts"
          })
        })
      ])
    );
    const evalsCandidate = candidates.find((candidate) =>
      candidate.reason === "Target source seed: evals"
    );

    expect(evalsCandidate?.metadata).toMatchObject({
      source: "target_project_read_model",
      targetReadModelKind: "source_seed",
      targetPath: "evals",
      seedKind: "eval_workspace"
    });
    expect(evalsCandidate?.subjectId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
