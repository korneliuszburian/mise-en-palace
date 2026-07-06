import { describe, expect, test } from "vitest";

import {
  toEvidenceCommandReadback,
  normalizeTargetEvidence,
  parseEvidenceBundleMetadataReadback,
  targetEvidenceFromMetadata,
  type EvidenceBundle
} from "../evidence-bundle.js";

const now = "2026-06-23T07:10:00.000Z";

const bundle = (overrides: Partial<EvidenceBundle>): EvidenceBundle => ({
  id: "evidence-bundle-1",
  executionRunId: "execution-run-1",
  status: "captured",
  changedFiles: ["packages/core/src/evidence-bundle.ts"],
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
    sourceRefs: ["KRN_ROADMAP.md#MM-52"]
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("evidence bundle completeness", () => {
  test("normalizes legacy command rows with weak default provenance", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm test",
      status: "skipped"
    })).toEqual({
      kind: "default_template",
      command: "pnpm test",
      status: "skipped",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes captured output command rows with explicit limits", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0,
      outputPath: ".local-lab/typecheck.txt"
    })).toEqual({
      kind: "captured_output_file",
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

  test("normalizes operator-reported command rows", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm test",
      status: "failed",
      provenance: "operator_reported",
      exitCode: 1,
      assertedBy: " codex ",
      doesNotProve: " Only proves the operator reported this command result. "
    })).toEqual({
      kind: "operator_reported",
      command: "pnpm test",
      status: "failed",
      provenance: "operator_reported",
      exitCode: 1,
      assertedBy: "codex",
      doesNotProve: "Only proves the operator reported this command result."
    });
  });

  test("normalizes external-log command rows with output refs", () => {
    expect(toEvidenceCommandReadback({
      command: "KRN CI",
      status: "passed",
      provenance: "external_log",
      outputRef: " gh-run-28524994922 ",
      exitCode: 0
    })).toEqual({
      kind: "external_log",
      command: "KRN CI",
      status: "passed",
      provenance: "external_log",
      outputRef: "gh-run-28524994922",
      exitCode: 0,
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    });
  });

  test("does not allow weak default provenance to become passed proof", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm test",
      status: "passed",
      provenance: "default_template"
    })).toEqual({
      kind: "default_template",
      command: "pnpm test",
      status: "not_run",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes command-runner rows only when runner proof fields exist", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: now
    })).toEqual({
      kind: "command_runner",
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: now,
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    });

    expect(toEvidenceCommandReadback({
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0
    })).toEqual({
      kind: "default_template",
      command: "pnpm typecheck",
      status: "not_run",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes target evidence without treating it as product proof", () => {
    const targetEvidence = normalizeTargetEvidence({
      targetRepo: " ../wilq-seo ",
      mode: "observation-only",
      dirtyBefore: "dirty",
      dirtyAfter: "dirty",
      ownedChanges: "external",
      targetStatusFreshness: "changed-since-selection",
      targetPatchLifecycle: "handed-off-unresolved",
      handoffArtifact: " docs/reviews/target/HANDOFF.md ",
      targetOwnerDecision: " stronger verification requested ",
      forbiddenWrites: [" wilq-seo/** "],
      changedFiles: [{
        status: "M",
        path: "apps/dashboard/src/App.tsx"
      }],
      commands: [" wilq-seo scripts/test.sh "]
    });

    expect(targetEvidence).toEqual({
      targetRepo: "../wilq-seo",
      mode: "observation_only",
      dirtyBefore: "dirty",
      dirtyAfter: "dirty",
      ownedChanges: "external",
      targetStatusFreshness: "changed_since_selection",
      targetPatchLifecycle: "handed_off_unresolved",
      handoffArtifact: "docs/reviews/target/HANDOFF.md",
      targetOwnerDecision: "stronger verification requested",
      allowedWrites: ["none"],
      forbiddenWrites: ["wilq-seo/**"],
      changedFiles: [{
        status: "M",
        path: "apps/dashboard/src/App.tsx",
        ownership: "external"
      }],
      commands: ["wilq-seo scripts/test.sh"],
      doesNotProve: [
        "Target evidence does not prove KRN source correctness.",
        "Target evidence does not prove full target verification unless every target gate is represented by command evidence.",
        "Target evidence does not prove product readiness or V02-01 second-operator usability."
      ]
    });
  });

  test("defaults observation-only target evidence write boundaries", () => {
    const targetEvidence = normalizeTargetEvidence({
      targetRepo: "../target",
      mode: "observation-only"
    });

    expect(targetEvidence.allowedWrites).toEqual(["none"]);
    expect(targetEvidence.forbiddenWrites).toEqual([
      "target source edits",
      "target commits",
      "target resets or cleans",
      "target production/runtime writes"
    ]);
  });

  test("reads target evidence back from metadata defensively", () => {
    expect(targetEvidenceFromMetadata({
      targetRepo: "../wilq-seo",
      mode: "real-second-operator",
      dirtyBefore: "clean",
      dirtyAfter: "dirty",
      ownedChanges: "partial",
      targetStatusFreshness: "fresh-current-task",
      targetPatchLifecycle: "accepted-by-target-owner",
      handoffArtifact: "docs/reviews/target/HANDOFF.md",
      targetOwnerDecision: "accepted after smoke proof",
      changedFiles: [{
        status: "M",
        path: "src/app.ts",
        ownership: "owned-by-current-krn-run"
      }],
      commands: ["target pnpm test"],
      doesNotProve: ["Target evidence does not prove product readiness."]
    })).toMatchObject({
      targetRepo: "../wilq-seo",
      mode: "real_second_operator",
      dirtyBefore: "clean",
      dirtyAfter: "dirty",
      ownedChanges: "partial",
      targetStatusFreshness: "fresh_current_task",
      targetPatchLifecycle: "accepted_by_target_owner",
      handoffArtifact: "docs/reviews/target/HANDOFF.md",
      targetOwnerDecision: "accepted after smoke proof",
      changedFiles: [{
        status: "M",
        path: "src/app.ts",
        ownership: "owned_by_current_krn_run"
      }],
      commands: ["target pnpm test"],
      doesNotProve: ["Target evidence does not prove product readiness."]
    });

    expect(targetEvidenceFromMetadata({
      mode: "observation-only"
    })).toBeUndefined();
  });

  test("parses evidence bundle metadata readback as an unknown-first boundary", () => {
    expect(parseEvidenceBundleMetadataReadback({
      diffSummary: " Changed evidence metadata parsing. ",
      sourceRefs: [" packages/core/src/evidence-bundle.ts ", "", 1, "KRN_ROADMAP.md"]
    })).toEqual({
      diffSummary: "Changed evidence metadata parsing.",
      sourceRefs: [
        "packages/core/src/evidence-bundle.ts",
        "KRN_ROADMAP.md"
      ]
    });

    expect(parseEvidenceBundleMetadataReadback({
      diffSummary: 42,
      sourceRefs: [" ", null]
    })).toEqual({
      sourceRefs: []
    });
    expect(parseEvidenceBundleMetadataReadback(null)).toEqual({
      sourceRefs: []
    });
  });

});
