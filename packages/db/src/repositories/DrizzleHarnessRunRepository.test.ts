import { describe, expect, it } from "vitest";

import {
  DrizzleHarnessRunRepository,
  evidenceCommandsForPersistence,
  validateEvidenceBundleInputForPersistence
} from "./DrizzleHarnessRunRepository.js";

describe("DrizzleHarnessRunRepository", () => {
  it("exposes persisted run aggregate readback by execution run id", () => {
    expect(typeof DrizzleHarnessRunRepository.prototype.getHarnessRunByExecutionRunId).toBe(
      "function"
    );
  });

  it("normalizes evidence command provenance before persistence", () => {
    expect(evidenceCommandsForPersistence([
      {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "operator_reported",
        exitCode: 0
      },
      {
        command: "pnpm test",
        status: "passed",
        provenance: "operator_reported",
        assertedBy: "operator"
      },
      {
        command: "git diff --check",
        status: "not_run"
      }
    ])).toEqual([
      {
        kind: "operator_reported",
        command: "pnpm typecheck",
        status: "passed",
        provenance: "operator_reported",
        exitCode: 0,
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        kind: "operator_reported",
        command: "pnpm test",
        status: "passed",
        provenance: "operator_reported",
        assertedBy: "operator",
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        kind: "default_template",
        command: "git diff --check",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      }
    ]);
  });

  it("does not persist weak default rows as passed command proof", () => {
    expect(evidenceCommandsForPersistence([
      {
        command: "pnpm test",
        status: "passed",
        provenance: "default_template"
      }
    ])).toEqual([
      {
        kind: "default_template",
        command: "pnpm test",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      }
    ]);
  });

  it("validates evidence metadata before persistence", () => {
    expect(() =>
      validateEvidenceBundleInputForPersistence({
        executionRunId: "execution-run-1",
        status: "captured",
        changedFiles: ["packages/cli/src/runEvidenceCaptureCommand.ts"],
        commands: [],
        diffRisk: "low",
        reviewBurden: "Review evidence metadata shape.",
        rollbackPath: "git revert <commit>",
        event: {
          sequence: 1,
          type: "evidence.captured",
          message: "Evidence captured"
        },
        metadata: {
          changedFileClassification: {
            intended: "packages/cli/src/runEvidenceCaptureCommand.ts",
            unrelated: [],
            unknown: [],
            unmatchedIntendedFiles: []
          }
        }
      })
    ).toThrow("evidence metadata changedFileClassification must include");

    expect(validateEvidenceBundleInputForPersistence({
      executionRunId: "execution-run-1",
      status: "captured",
      changedFiles: [" packages/cli/src/runEvidenceCaptureCommand.ts "],
      commands: [],
      diffRisk: "low",
      reviewBurden: "Review evidence metadata shape.",
      rollbackPath: "git revert <commit>",
      event: {
        sequence: 1,
        type: "evidence.captured",
        message: "Evidence captured"
      },
      metadata: {
        intendedFiles: [" packages/cli/src/runEvidenceCaptureCommand.ts "],
        changedFileClassification: {
          intended: [" packages/cli/src/runEvidenceCaptureCommand.ts "],
          unrelated: [],
          unknown: [],
          unmatchedIntendedFiles: []
        },
        dirtyContext: {
          hasUnrelatedFiles: false,
          unrelatedFileCount: 0
        }
      }
    })).toMatchObject({
      changedFiles: ["packages/cli/src/runEvidenceCaptureCommand.ts"],
      metadata: {
        intendedFiles: ["packages/cli/src/runEvidenceCaptureCommand.ts"]
      }
    });
  });
});
