import { describe, expect, test } from "vitest";

import {
  assessEvidenceBundleCompleteness,
  assessEvidenceBundleRollbackPath,
  normalizeEvidenceCommand,
  scoreEvidenceBundleReviewRisk,
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
  test("normalizes legacy command rows with weak default provenance", () => {
    expect(normalizeEvidenceCommand({
      command: "pnpm test",
      status: "skipped"
    })).toEqual({
      command: "pnpm test",
      status: "skipped",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes captured output command rows with explicit limits", () => {
    expect(normalizeEvidenceCommand({
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0,
      outputPath: ".local-lab/typecheck.txt"
    })).toEqual({
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0,
      outputPath: ".local-lab/typecheck.txt",
      outputRef: ".local-lab/typecheck.txt",
      provenance: "captured_output_file",
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    });
  });

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

describe("evidence bundle review risk scoring", () => {
  test("scores risky broad runtime diffs higher than narrow tested diffs", () => {
    const narrow = scoreEvidenceBundleReviewRisk(bundle({
      changedFiles: ["docs/handoff/verification.md"],
      diffRisk: "high",
      reviewBurden: "Prior estimate should not override deterministic scoring."
    }));

    const broad = scoreEvidenceBundleReviewRisk(bundle({
      changedFiles: [
        "packages/core/src/evidenceBundle.ts",
        "packages/schema/src/evidence.ts",
        "packages/db/src/schema/harness.ts",
        "packages/db/src/migrations/0012_review_scoring.sql",
        "packages/cli/src/runEvidenceCaptureCommand.ts",
        "docs/plans/memory-ideal-state/PLAN.md"
      ],
      commands: [
        {
          command: "pnpm typecheck",
          status: "passed",
          exitCode: 0
        },
        {
          command: "pnpm test",
          status: "failed",
          exitCode: 1
        }
      ],
      diffRisk: "low",
      reviewBurden: "Prior estimate should not hide broad runtime risk."
    }));

    expect(narrow).toEqual({
      diffRisk: "low",
      reviewBurden: "low",
      reasons: ["docs-only diff", "required commands passed"]
    });
    expect(broad.diffRisk).toBe("high");
    expect(broad.reviewBurden).toBe("high");
    expect(broad.reasons).toContain("broad diff touches 6 files");
    expect(broad.reasons).toContain("database or migration files changed");
    expect(broad.reasons).toContain("required command failed: pnpm test");
  });

  test("scores narrow tested core diffs as medium review burden", () => {
    expect(scoreEvidenceBundleReviewRisk(bundle({
      changedFiles: ["packages/core/src/reviewAssessment.ts"]
    }))).toEqual({
      diffRisk: "medium",
      reviewBurden: "medium",
      reasons: ["core domain files changed", "required commands passed"]
    });
  });
});

describe("evidence bundle rollback path enforcement", () => {
  test("does not require rollback path for docs-only evidence bundles", () => {
    expect(assessEvidenceBundleRollbackPath(bundle({
      changedFiles: ["docs/handoff/verification.md"],
      rollbackPath: ""
    }))).toEqual([]);
  });

  test("requires a concrete rollback path for runtime and database changes", () => {
    expect(assessEvidenceBundleRollbackPath(bundle({
      changedFiles: [
        "packages/core/src/evidenceBundle.ts",
        "packages/db/src/schema/harness.ts"
      ],
      rollbackPath: ""
    }))).toEqual([
      "rollbackPath is required for non-doc changes"
    ]);

    expect(assessEvidenceBundleRollbackPath(bundle({
      changedFiles: ["packages/cli/src/runEvidenceCaptureCommand.ts"],
      rollbackPath: "manual cleanup"
    }))).toEqual([
      "rollbackPath must include a concrete revert or recovery command"
    ]);
  });
});
