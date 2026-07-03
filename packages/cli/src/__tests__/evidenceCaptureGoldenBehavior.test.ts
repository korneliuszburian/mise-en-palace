import { readFileSync } from "node:fs";
import {
  describe,
  expect,
  it
} from "vitest";
import type {
  GoldenTask
} from "@krn/core";
import type {
  GoldenBehaviorProof
} from "@krn/harness";
import {
  runGoldenTaskFixtures
} from "@krn/harness";
import type {
  GoldenTaskFixture
} from "@krn/schema";
import {
  parseGoldenTaskFixtures
} from "@krn/schema";

import {
  runCli
} from "../runCli.js";

const now = "2026-06-25T09:20:00.000Z";
const fixturePath = "../../../../tests/fixtures/golden-tasks/evidence-capture-behavior.json";
const evidenceRefs = [
  "packages/cli/src/__tests__/evidenceCaptureGoldenBehavior.test.ts",
  "tests/fixtures/golden-tasks/evidence-capture-behavior.json"
] as const;

const readEvidenceCaptureFixture = (): unknown => {
  const fixtureUrl = new URL(fixturePath, import.meta.url);
  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return parsed;
};

const proof = (
  caseId: string,
  passed: boolean,
  summary: string
): GoldenBehaviorProof => ({
  caseId,
  status: passed ? "passed" : "failed",
  provenance: "krn_behavior_execution",
  summary,
  evidenceRefs,
  doesNotProve:
    "This CLI behavior proof does not prove Memory Brain product readiness, activation quality, DB persistence, or reflection quality."
});

const toGoldenTask = (task: GoldenTaskFixture): GoldenTask => ({
  id: task.id,
  ...(task.projectId === undefined ? {} : { projectId: task.projectId }),
  status: task.status,
  title: task.title,
  description: task.description,
  owner: task.owner,
  domains: task.domains,
  cases: task.cases,
  metadata: task.metadata,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

interface CliExecutionForTest {
  exitCode: number;
  stdout: string;
}

interface OutputExpectation {
  includes: readonly string[];
  excludes?: readonly string[];
}

const cliOutputMatches = (
  result: CliExecutionForTest,
  expectation: OutputExpectation
): boolean =>
  result.exitCode === 0 &&
  expectation.includes.every((expected) => result.stdout.includes(expected)) &&
  (expectation.excludes ?? []).every((excluded) => !result.stdout.includes(excluded));

const classifiedExpectation: OutputExpectation = {
  includes: [
    "Changed files:\nintended:",
    "- M packages/cli/src/runEvidenceCaptureCommand.ts",
    "- M packages/core/src/candidateReviewability.ts",
    "- ?? docs/reviews/controlled-dogfood/run",
    "unrelated:\n- ?? docs/materials/raw-audit.md",
    "unknown:\n- none",
    "Dirty context: unrelated files present; review burden increased.",
    "pnpm typecheck: passed | provenance=operator_reported"
  ],
  excludes: [
    "- M core/src/candidateReviewability.ts",
    "../../docs/reviews/controlled-dogfood/run"
  ]
};

const unclassifiedExpectation: OutputExpectation = {
  includes: [
    "Changed files:\nunknown:",
    "- M packages/cli/src/runEvidenceCaptureCommand.ts",
    "Dirty context: unclassified (no --intended-file provided).",
    "pnpm typecheck: not_run | provenance=default_template",
    "Command provenance is weak: default_template rows are not proof that commands ran."
  ]
};

const targetEvidenceExpectation: OutputExpectation = {
  includes: [
    "Changed files:\n- none",
    "wilq-seo scripts/test.sh: failed | provenance=operator_reported",
    "Target evidence:",
    "- repo: ../wilq-seo",
    "- mode: observation_only",
    "- dirtyBefore: dirty",
    "- dirtyAfter: dirty",
    "- ownedChanges: external",
    "- targetStatusFreshness: changed_since_selection",
    "- targetPatchLifecycle: handed_off_unresolved",
    "- handoffArtifact: docs/reviews/target/HANDOFF.md",
    "- targetOwnerDecision: stronger verification requested",
    "- target source edits",
    "- target commits",
    "- M apps/dashboard/src/App.tsx | ownership=external",
    "Target evidence does not prove KRN source correctness.",
    "Target evidence does not prove product readiness or V02-01 second-operator usability."
  ]
};

describe("evidence capture golden behavior", () => {
  it("guards dirty-context capture behavior with real CLI execution", async () => {
    const tasks = parseGoldenTaskFixtures(readEvidenceCaptureFixture()).map(toGoldenTask);
    const classifiedResult = await runCli([
      "evidence",
      "capture",
      "--intended-file",
      "packages/cli/src/runEvidenceCaptureCommand.ts",
      "--intended-file",
      "packages/core/src/candidateReviewability.ts",
      "--intended-file",
      "docs/reviews/controlled-dogfood/run/REPORT.md",
      "--verification",
      "pnpm typecheck=passed"
    ], {
      env: {},
      cwd: process.cwd(),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () =>
        " M src/runEvidenceCaptureCommand.ts\n" +
        " M ../core/src/candidateReviewability.ts\n" +
        "?? ../../docs/reviews/controlled-dogfood/run/\n" +
        "?? ../../docs/materials/raw-audit.md\n"
    });
    const unclassifiedResult = await runCli(["evidence", "capture"], {
      env: {},
      cwd: process.cwd(),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => " M src/runEvidenceCaptureCommand.ts\n"
    });
    const targetEvidenceResult = await runCli([
      "evidence",
      "capture",
      "--target-repo",
      "../wilq-seo",
      "--target-mode",
      "observation-only",
      "--target-dirty-before",
      "dirty",
      "--target-dirty-after",
      "dirty",
      "--target-owned-changes",
      "external",
      "--target-status-freshness",
      "changed-since-selection",
      "--target-patch-lifecycle",
      "handed-off-unresolved",
      "--target-handoff-artifact",
      "docs/reviews/target/HANDOFF.md",
      "--target-owner-decision",
      "stronger verification requested",
      "--target-changed-file",
      "M apps/dashboard/src/App.tsx",
      "--target-command",
      "wilq-seo scripts/test.sh",
      "--verification",
      "wilq-seo scripts/test.sh=failed"
    ], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => ""
    });
    const classifiedOutput = classifiedResult.stdout;
    const unclassifiedOutput = unclassifiedResult.stdout;
    const targetEvidenceOutput = targetEvidenceResult.stdout;
    const classifiedPassed = cliOutputMatches(classifiedResult, classifiedExpectation);
    const unclassifiedPassed = cliOutputMatches(unclassifiedResult, unclassifiedExpectation);
    const targetEvidencePassed = cliOutputMatches(targetEvidenceResult, targetEvidenceExpectation);
    const report = runGoldenTaskFixtures({
      tasks,
      proofs: [
        proof(
          "golden-case-evidence-dirty-context-001-a",
          classifiedPassed,
          classifiedPassed
            ? "Real CLI evidence capture separated intended, unrelated, and unknown files while preserving operator-reported command provenance."
            : classifiedOutput
        ),
        proof(
          "golden-case-evidence-dirty-context-001-b",
          unclassifiedPassed,
          unclassifiedPassed
            ? "Real CLI evidence capture kept missing intent as unknown and weak default command rows visibly weak."
            : unclassifiedOutput
        ),
        proof(
          "golden-case-evidence-target-001-c",
          targetEvidencePassed,
          targetEvidencePassed
            ? "Real CLI evidence capture rendered target repo mode, dirty state, ownership, target changed files, command proof, and target does-not-prove boundaries separately from KRN changed files."
            : targetEvidenceOutput
        )
      ]
    });

    expect(report.status).toBe("passed");
    expect(report.caseCount).toBe(3);
    expect(report.passedCaseCount).toBe(3);
    expect(report.failedCaseCount).toBe(0);
    expect(report.missingProofCaseIds).toEqual([]);
    expect(report.failedProofCaseIds).toEqual([]);
  });
});
