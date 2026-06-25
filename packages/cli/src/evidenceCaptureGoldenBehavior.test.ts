import { readFileSync } from "node:fs";
import {
  describe,
  expect,
  it
} from "vitest";
import type {
  GoldenBehaviorProof
} from "@krn/harness";
import {
  runGoldenTaskFixtures
} from "@krn/harness";
import {
  parseGoldenTaskFixtures
} from "@krn/schema";

import {
  runCli
} from "./runCli.js";

const now = "2026-06-25T09:20:00.000Z";
const fixturePath = "../../../tests/fixtures/golden-tasks/evidence-capture-behavior.json";
const evidenceRefs = [
  "packages/cli/src/evidenceCaptureGoldenBehavior.test.ts",
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

describe("evidence capture golden behavior", () => {
  it("guards dirty-context capture behavior with real CLI execution", async () => {
    const tasks = parseGoldenTaskFixtures(readEvidenceCaptureFixture());
    const classifiedResult = await runCli([
      "evidence",
      "capture",
      "--intended-file",
      "packages/cli/src/runEvidenceCaptureCommand.ts",
      "--intended-file",
      "docs/reviews/controlled-dogfood/run/REPORT.md",
      "--verification",
      "pnpm typecheck=passed"
    ], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () =>
        " M src/runEvidenceCaptureCommand.ts\n" +
        "?? ../../docs/reviews/controlled-dogfood/run/\n" +
        "?? docs/materials/raw-audit.md\n"
    });
    const unclassifiedResult = await runCli(["evidence", "capture"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => " M src/runEvidenceCaptureCommand.ts\n"
    });
    const classifiedOutput = classifiedResult.stdout;
    const unclassifiedOutput = unclassifiedResult.stdout;
    const classifiedPassed =
      classifiedResult.exitCode === 0 &&
      classifiedOutput.includes("Changed files:\nintended:") &&
      classifiedOutput.includes("- M src/runEvidenceCaptureCommand.ts") &&
      classifiedOutput.includes("- ?? ../../docs/reviews/controlled-dogfood/run/") &&
      classifiedOutput.includes("unrelated:\n- ?? docs/materials/raw-audit.md") &&
      classifiedOutput.includes("unknown:\n- none") &&
      classifiedOutput.includes("Dirty context: unrelated files present; review burden increased.") &&
      classifiedOutput.includes("pnpm typecheck: passed | provenance=operator_reported");
    const unclassifiedPassed =
      unclassifiedResult.exitCode === 0 &&
      unclassifiedOutput.includes("Changed files:\nunknown:") &&
      unclassifiedOutput.includes("- M src/runEvidenceCaptureCommand.ts") &&
      unclassifiedOutput.includes("Dirty context: unclassified (no --intended-file provided).") &&
      unclassifiedOutput.includes("pnpm typecheck: not_run | provenance=default_template") &&
      unclassifiedOutput.includes(
        "Command provenance is weak: default_template rows are not proof that commands ran."
      );
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
        )
      ]
    });

    expect(report.status).toBe("passed");
    expect(report.caseCount).toBe(2);
    expect(report.passedCaseCount).toBe(2);
    expect(report.failedCaseCount).toBe(0);
    expect(report.missingProofCaseIds).toEqual([]);
    expect(report.failedProofCaseIds).toEqual([]);
  });
});
