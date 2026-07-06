import type {
  BehaviorFixture
} from "@krn/core";
import {
  validateBehaviorFixture
} from "@krn/core";

export type BehaviorFixtureProofStatus = "passed" | "failed";

export type BehaviorFixtureProofProvenance =
  | "krn_behavior_execution"
  | "promptfoo_integration_smoke";

export interface BehaviorFixtureProof {
  caseId: string;
  status: BehaviorFixtureProofStatus;
  provenance: BehaviorFixtureProofProvenance;
  summary: string;
  evidenceRefs: readonly string[];
  doesNotProve: string;
}

export type BehaviorFixtureCaseRunStatus = "passed" | "failed" | "missing";

export interface BehaviorFixtureCaseRunResult {
  caseId: string;
  status: BehaviorFixtureCaseRunStatus;
  summary: string;
  evidenceRefs: string[];
}

export interface BehaviorFixtureRunReport {
  status: "passed" | "failed";
  taskCount: number;
  caseCount: number;
  protectedFailureModeCount: number;
  passedCaseCount: number;
  failedCaseCount: number;
  missingProofCaseIds: string[];
  failedProofCaseIds: string[];
  fixtureFindings: string[];
  caseResults: BehaviorFixtureCaseRunResult[];
}

export interface RunBehaviorFixturesInput {
  tasks: readonly BehaviorFixture[];
  proofs: readonly BehaviorFixtureProof[];
}

const byId = <T extends { caseId: string }>(left: T, right: T): number =>
  left.caseId.localeCompare(right.caseId);

const acceptableBehaviorProofProvenances = new Set<BehaviorFixtureProofProvenance>([
  "krn_behavior_execution"
]);

const proofHasAcceptedBehaviorProvenance = (proof: BehaviorFixtureProof): boolean =>
  acceptableBehaviorProofProvenances.has(proof.provenance);

const proofIsPassing = (proof: BehaviorFixtureProof): boolean =>
  proof.status === "passed" &&
  proofHasAcceptedBehaviorProvenance(proof) &&
  proof.summary.trim().length > 0 &&
  proof.evidenceRefs.length > 0 &&
  proof.doesNotProve.trim().length > 0;

const failedProofSummary = (proof: BehaviorFixtureProof): string => {
  if (!proofHasAcceptedBehaviorProvenance(proof)) {
    return `Proof provenance ${proof.provenance} is not accepted as BehaviorFixture proof: ${proof.doesNotProve}`;
  }

  return proof.summary;
};

export const runBehaviorFixtures = (
  input: RunBehaviorFixturesInput
): BehaviorFixtureRunReport => {
  const proofByCaseId = new Map(input.proofs.map((proof) => [proof.caseId, proof]));
  const fixtureFindings = input.tasks.flatMap((task) =>
    validateBehaviorFixture(task).map((finding) => `${task.id}: ${finding}`)
  );
  const cases = input.tasks.flatMap((task) => task.cases);
  const caseResults = cases.map((behaviorCase): BehaviorFixtureCaseRunResult => {
    const proof = proofByCaseId.get(behaviorCase.id);

    if (proof === undefined) {
      return {
        caseId: behaviorCase.id,
        status: "missing",
        summary: "No behavior proof was provided for this behavior fixture case.",
        evidenceRefs: []
      };
    }

    if (!proofIsPassing(proof)) {
      return {
        caseId: behaviorCase.id,
        status: "failed",
        summary: failedProofSummary(proof),
        evidenceRefs: [...proof.evidenceRefs]
      };
    }

    return {
      caseId: behaviorCase.id,
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
      fixtureFindings.length === 0 &&
      missingProofCaseIds.length === 0 &&
      failedProofCaseIds.length === 0
        ? "passed"
        : "failed",
    taskCount: input.tasks.length,
    caseCount: cases.length,
    protectedFailureModeCount: cases.reduce(
      (count, behaviorCase) => count + behaviorCase.protectedFailureModes.length,
      0
    ),
    passedCaseCount,
    failedCaseCount,
    missingProofCaseIds,
    failedProofCaseIds,
    fixtureFindings,
    caseResults
  };
};
