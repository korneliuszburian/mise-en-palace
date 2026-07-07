import { describe, expect, it } from "vitest";
import type { EvalCandidateProposal } from "@krn/core";

import type { KrnDatabase } from "../../database.js";
import {
  DrizzleHarnessRunRepository,
  evidenceCommandsForPersistence,
  validateEvidenceBundleInputForPersistence
} from "../drizzle-harness-run-repository.js";

const evalCandidate: EvalCandidateProposal = {
  id: "eval-candidate-1",
  projectId: "project-1",
  status: "candidate",
  title: "Feedback candidate",
  scenario: "Repository readback should come from the persisted row.",
  expectedSignal: "Mapped row wins over raw input.",
  sourceEvidence: ["source-1"],
  metadata: {},
  createdAt: "2026-07-07T00:00:00.000Z"
};

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
        changedFiles: ["packages/cli/src/run-evidence-capture-command.ts"],
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
            intended: "packages/cli/src/run-evidence-capture-command.ts",
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
      changedFiles: [" packages/cli/src/run-evidence-capture-command.ts "],
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
        intendedFiles: [" packages/cli/src/run-evidence-capture-command.ts "],
        changedFileClassification: {
          intended: [" packages/cli/src/run-evidence-capture-command.ts "],
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
      changedFiles: ["packages/cli/src/run-evidence-capture-command.ts"],
      metadata: {
        intendedFiles: ["packages/cli/src/run-evidence-capture-command.ts"]
      }
    });
  });

  it("returns feedback delta candidates from the mapped persisted row", async () => {
    const rowTimestamp = new Date("2026-07-07T00:00:00.000Z");
    const returnedFeedbackDeltaRow = {
      id: "feedback-delta-1",
      reviewAssessmentId: "review-1",
      status: "candidate" as const,
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [{
        ...evalCandidate,
        status: "accepted"
      }],
      metadata: {},
      createdAt: rowTimestamp,
      updatedAt: rowTimestamp
    };
    const insertedValues: unknown[] = [];
    const transactionClient = {
      insert: (_table: unknown) => ({
        values: (value: unknown) => {
          insertedValues.push(value);

          if (insertedValues.length === 1) {
            return {
              returning: async () => [returnedFeedbackDeltaRow]
            };
          }

          return Promise.resolve();
        }
      })
    };
    const db = {
      transaction: async <T>(callback: (tx: typeof transactionClient) => Promise<T>) =>
        callback(transactionClient)
    } as unknown as KrnDatabase;

    const repository = new DrizzleHarnessRunRepository(db);
    const result = await repository.createFeedbackDelta({
      reviewAssessmentId: "review-1",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [evalCandidate],
      metadata: {}
    });

    expect(result.evalCandidates).toEqual([]);
    expect(insertedValues).toHaveLength(2);
  });
});
