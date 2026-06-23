import { describe, expect, test } from "vitest";

import {
  assessEvidenceBundleCompleteness,
  type EvidenceBundle
} from "./evidenceBundle.js";

const now = "2026-06-23T07:10:00.000Z";

const bundle = (overrides: Partial<EvidenceBundle>): EvidenceBundle => ({
  id: "evidence-bundle-1",
  executionRunId: "execution-run-1",
  status: "captured",
  changedFiles: ["packages/core/src/evidenceBundle.ts"],
  commands: [
    {
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0
    },
    {
      command: "pnpm test",
      status: "passed",
      exitCode: 0
    },
    {
      command: "git diff --check",
      status: "passed",
      exitCode: 0
    }
  ],
  diffRisk: "medium",
  reviewBurden: "Review the pure EvidenceBundle domain contract.",
  rollbackPath: "git revert <commit>",
  metadata: {
    diffSummary: "Changed pure EvidenceBundle assessment helper and focused tests.",
    sourceRefs: ["docs/plans/memory-ideal-state/PLAN.md#MM-52"]
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("evidence bundle completeness", () => {
  test("accepts a complete implementation evidence bundle", () => {
    expect(assessEvidenceBundleCompleteness(bundle({}))).toEqual([]);
  });

  test("flags missing required slice evidence", () => {
    expect(assessEvidenceBundleCompleteness(bundle({
      executionRunId: "",
      changedFiles: [],
      commands: [
        {
          command: "git diff --check",
          status: "passed",
          exitCode: 0
        }
      ],
      reviewBurden: "",
      rollbackPath: "",
      metadata: {}
    }))).toEqual([
      "executionRunId is required",
      "changedFiles are required",
      "pnpm typecheck evidence is required",
      "pnpm test evidence is required",
      "diffSummary is required",
      "sourceRefs are required",
      "reviewBurden is required",
      "rollbackPath is required"
    ]);
  });

  test("flags failed required command evidence", () => {
    expect(assessEvidenceBundleCompleteness(bundle({
      commands: [
        {
          command: "pnpm typecheck",
          status: "failed",
          exitCode: 2
        },
        {
          command: "pnpm test",
          status: "passed",
          exitCode: 0
        },
        {
          command: "git diff --check",
          status: "passed",
          exitCode: 0
        }
      ]
    }))).toEqual(["pnpm typecheck evidence must pass"]);
  });
});
