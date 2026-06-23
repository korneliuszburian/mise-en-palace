import type {
  GoldenTask
} from "@krn/core";
import {
  validateGoldenTaskContract
} from "@krn/core";

export type GoldenBehaviorProofStatus = "passed" | "failed";

export interface GoldenBehaviorProof {
  caseId: string;
  status: GoldenBehaviorProofStatus;
  summary: string;
  evidenceRefs: readonly string[];
}

export type GoldenCaseRunStatus = "passed" | "failed" | "missing";

export interface GoldenCaseRunResult {
  caseId: string;
  status: GoldenCaseRunStatus;
  summary: string;
  evidenceRefs: string[];
}

export interface GoldenRunReport {
  status: "passed" | "failed";
  taskCount: number;
  caseCount: number;
  protectedFailureModeCount: number;
  passedCaseCount: number;
  failedCaseCount: number;
  missingProofCaseIds: string[];
  failedProofCaseIds: string[];
  contractFindings: string[];
  caseResults: GoldenCaseRunResult[];
}

export interface RunGoldenTaskFixturesInput {
  tasks: readonly GoldenTask[];
  proofs: readonly GoldenBehaviorProof[];
}

const byId = <T extends { caseId: string }>(left: T, right: T): number =>
  left.caseId.localeCompare(right.caseId);

const proofIsPassing = (proof: GoldenBehaviorProof): boolean =>
  proof.status === "passed" &&
  proof.summary.trim().length > 0 &&
  proof.evidenceRefs.length > 0;

export const runGoldenTaskFixtures = (
  input: RunGoldenTaskFixturesInput
): GoldenRunReport => {
  const proofByCaseId = new Map(input.proofs.map((proof) => [proof.caseId, proof]));
  const contractFindings = input.tasks.flatMap((task) =>
    validateGoldenTaskContract(task).map((finding) => `${task.id}: ${finding}`)
  );
  const cases = input.tasks.flatMap((task) => task.cases);
  const caseResults = cases.map((goldenCase): GoldenCaseRunResult => {
    const proof = proofByCaseId.get(goldenCase.id);

    if (proof === undefined) {
      return {
        caseId: goldenCase.id,
        status: "missing",
        summary: "No behavior proof was provided for this golden case.",
        evidenceRefs: []
      };
    }

    if (!proofIsPassing(proof)) {
      return {
        caseId: goldenCase.id,
        status: "failed",
        summary: proof.summary,
        evidenceRefs: [...proof.evidenceRefs]
      };
    }

    return {
      caseId: goldenCase.id,
      status: "passed",
      summary: proof.summary,
      evidenceRefs: [...proof.evidenceRefs]
    };
  }).sort(byId);

  const missingProofCaseIds = caseResults
    .filter((result) => result.status === "missing")
    .map((result) => result.caseId);
  const failedProofCaseIds = caseResults
    .filter((result) => result.status === "failed")
    .map((result) => result.caseId);
  const passedCaseCount = caseResults.filter((result) => result.status === "passed").length;
  const failedCaseCount = caseResults.length - passedCaseCount;

  return {
    status:
      contractFindings.length === 0 &&
      missingProofCaseIds.length === 0 &&
      failedProofCaseIds.length === 0
        ? "passed"
        : "failed",
    taskCount: input.tasks.length,
    caseCount: cases.length,
    protectedFailureModeCount: cases.reduce(
      (count, goldenCase) => count + goldenCase.protectedFailureModes.length,
      0
    ),
    passedCaseCount,
    failedCaseCount,
    missingProofCaseIds,
    failedProofCaseIds,
    contractFindings,
    caseResults
  };
};
