import { describe, expect, it } from "vitest";

import type {
  TaskContract
} from "@krn/core";

import {
  buildOwnerFileRecallCandidates
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
});
