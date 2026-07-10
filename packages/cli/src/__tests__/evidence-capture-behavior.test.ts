import { readFileSync } from "node:fs";
import {
  describe,
  expect,
  it
} from "vitest";
import type {
  BehaviorFixture
} from "@krn/core";
import type {
  BehaviorFixtureProof
} from "@krn/harness";
import {
  runBehaviorFixtures
} from "@krn/harness";
import type {
  BehaviorFixtureInput
} from "@krn/core";
import {
  parseBehaviorFixtures
} from "@krn/core";

import {
  runCli
} from "../run-cli.js";

const now = "2026-06-25T09:20:00.000Z";
const fixturePath = "../../../../tests/fixtures/behavior-fixtures/evidence-capture-behavior.json";
const evidenceRefs = [
  "packages/cli/src/__tests__/evidence-capture-behavior.test.ts",
  "tests/fixtures/behavior-fixtures/evidence-capture-behavior.json"
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
): BehaviorFixtureProof => ({
  caseId,
  status: passed ? "passed" : "failed",
  provenance: "krn_behavior_execution",
  summary,
  evidenceRefs,
  doesNotProve:
    "This CLI behavior proof does not prove Memory Core product readiness, activation quality, DB persistence, or reflection quality."
});

const toBehaviorFixture = (task: BehaviorFixtureInput): BehaviorFixture => ({
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
    "- M packages/cli/src/run-evidence-capture-command.ts",
    "- M packages/core/src/candidate-reviewability.ts",
    "- ?? review-evidence/controlled-dogfood/run",
    "unrelated:\n- ?? docs/materials/raw-audit.md",
    "unknown:\n- none",
    "Dirty context: unrelated files present; review burden increased.",
    "pnpm typecheck: passed | provenance=operator_reported"
  ],
  excludes: [
    "- M core/src/candidate-reviewability.ts",
    "../../review-evidence/controlled-dogfood/run"
  ]
};

const unclassifiedExpectation: OutputExpectation = {
  includes: [
    "Changed files:\nunknown:",
    "- M packages/cli/src/run-evidence-capture-command.ts",
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
    "- handoffArtifact: review-evidence/target/HANDOFF.md",
    "- targetOwnerDecision: stronger verification requested",
    "- target source edits",
    "- target commits",
    "- M apps/dashboard/src/App.tsx | ownership=external",
    "Target evidence does not prove KRN source correctness.",
    "Target evidence does not prove product readiness or V02-01 second-operator usability."
  ]
};

const knowledgeUsefulnessExpectation: OutputExpectation = {
  includes: [
    "Changed files:\nintended:",
    "- M packages/cli/src/run-evidence-capture-command.ts",
    "pnpm typecheck: passed | provenance=operator_reported",
    "knowledgeUsefulnessOutcomes:",
    "outcome=helped knowledge=knowledge:ts-boundary-unknown-first-result-state",
    "reason: Memory selected the unknown-first parser shape",
    "evidenceRef: packages/cli/src/run-evidence-capture-command.ts",
    "doesNotProve: Does not prove future memory recall quality"
  ],
  excludes: [
    "Memory mutation: applied"
  ]
};

describe("evidence capture behavior fixture", () => {
  it("guards dirty-context capture behavior with real CLI execution", async () => {
    const tasks = parseBehaviorFixtures(readEvidenceCaptureFixture()).map(toBehaviorFixture);
    const classifiedResult = await runCli([
      "evidence",
      "capture",
      "--intended-file",
      "packages/cli/src/run-evidence-capture-command.ts",
      "--intended-file",
      "packages/core/src/candidate-reviewability.ts",
      "--intended-file",
      "review-evidence/controlled-dogfood/run/REPORT.md",
      "--verification",
      "pnpm typecheck=passed"
    ], {
      env: {},
      cwd: process.cwd(),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () =>
        " M src/run-evidence-capture-command.ts\n" +
        " M ../core/src/candidate-reviewability.ts\n" +
        "?? ../../review-evidence/controlled-dogfood/run/\n" +
        "?? ../../docs/materials/raw-audit.md\n"
    });
    const unclassifiedResult = await runCli(["evidence", "capture"], {
      env: {},
      cwd: process.cwd(),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => " M src/run-evidence-capture-command.ts\n"
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
      "review-evidence/target/HANDOFF.md",
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
    const knowledgeUsefulnessResult = await runCli([
      "evidence",
      "capture",
      "--intended-file",
      "packages/cli/src/run-evidence-capture-command.ts",
      "--verification",
      "pnpm typecheck=passed",
      "--memory-usefulness",
      "knowledge:ts-boundary-unknown-first-result-state=helped|Memory selected the unknown-first parser shape|packages/cli/src/run-evidence-capture-command.ts|Does not prove future memory recall quality"
    ], {
      env: {},
      cwd: process.cwd(),
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => " M src/run-evidence-capture-command.ts\n"
    });
    const classifiedOutput = classifiedResult.stdout;
    const unclassifiedOutput = unclassifiedResult.stdout;
    const targetEvidenceOutput = targetEvidenceResult.stdout;
    const knowledgeUsefulnessOutput = knowledgeUsefulnessResult.stdout;
    const classifiedPassed = cliOutputMatches(classifiedResult, classifiedExpectation);
    const unclassifiedPassed = cliOutputMatches(unclassifiedResult, unclassifiedExpectation);
    const targetEvidencePassed = cliOutputMatches(targetEvidenceResult, targetEvidenceExpectation);
    const knowledgeUsefulnessPassed = cliOutputMatches(
      knowledgeUsefulnessResult,
      knowledgeUsefulnessExpectation
    );
    const report = runBehaviorFixtures({
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
        ),
        proof(
          "golden-case-evidence-knowledge-usefulness-001-d",
          knowledgeUsefulnessPassed,
          knowledgeUsefulnessPassed
            ? "Real CLI evidence capture rendered retained knowledge usefulness with knowledge id, evidence ref, reason, and does-not-prove boundary."
            : knowledgeUsefulnessOutput
        )
      ]
    });

    expect(report.status).toBe("passed");
    expect(report.caseCount).toBe(4);
    expect(report.passedCaseCount).toBe(4);
    expect(report.failedCaseCount).toBe(0);
    expect(report.missingProofCaseIds).toEqual([]);
    expect(report.failedProofCaseIds).toEqual([]);
  }, 15_000);
});
