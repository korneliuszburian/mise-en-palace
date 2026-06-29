import type {
  ContextAssembly,
  SourceClaim
} from "@krn/core";

export type RelationGroundedQaVerdict = "grounded" | "insufficient";
export type RelationGroundedQaUsefulness = "improved" | "weak";
export type RelationGroundedQaOutcome = "improved" | "unchanged" | "regressed";

export interface RelationGroundedQaScenarioReadback {
  verdict: RelationGroundedQaVerdict;
  answer: string;
  reviewUsefulness: RelationGroundedQaUsefulness;
  includedSourceClaimIds: readonly SourceClaim["id"][];
  usedSourceClaimIds: readonly SourceClaim["id"][];
}

export interface RelationGroundedQaReadback {
  baseline: RelationGroundedQaScenarioReadback;
  edgeAware: RelationGroundedQaScenarioReadback;
  outcome: RelationGroundedQaOutcome;
  proof: string;
  doesNotProve: string;
}

export interface BuildRelationGroundedQaReadbackInput {
  baselineContext: Pick<ContextAssembly, "inclusions">;
  edgeAwareContext: Pick<ContextAssembly, "inclusions">;
  sourceClaims: readonly Pick<SourceClaim, "id" | "claim">[];
  answerSourceClaimId: SourceClaim["id"];
}

const insufficientAnswer = "Insufficient selected source context for relation-dependent graph QA.";

const includedSourceClaimIds = (
  context: Pick<ContextAssembly, "inclusions">
): SourceClaim["id"][] =>
  context.inclusions
    .filter((item) => item.subjectType === "source_claim")
    .map((item) => item.subjectId);

const scenarioReadback = (
  context: Pick<ContextAssembly, "inclusions">,
  sourceClaimsById: ReadonlyMap<SourceClaim["id"], Pick<SourceClaim, "id" | "claim">>,
  answerSourceClaimId: SourceClaim["id"]
): RelationGroundedQaScenarioReadback => {
  const included = includedSourceClaimIds(context);
  const answerClaim = included.includes(answerSourceClaimId)
    ? sourceClaimsById.get(answerSourceClaimId)
    : undefined;

  if (answerClaim === undefined) {
    return {
      verdict: "insufficient",
      answer: insufficientAnswer,
      reviewUsefulness: "weak",
      includedSourceClaimIds: included,
      usedSourceClaimIds: []
    };
  }

  return {
    verdict: "grounded",
    answer: answerClaim.claim,
    reviewUsefulness: "improved",
    includedSourceClaimIds: included,
    usedSourceClaimIds: [answerClaim.id]
  };
};

const outcomeFor = (
  baseline: RelationGroundedQaScenarioReadback,
  edgeAware: RelationGroundedQaScenarioReadback
): RelationGroundedQaOutcome => {
  if (baseline.verdict === "insufficient" && edgeAware.verdict === "grounded") {
    return "improved";
  }

  if (baseline.verdict === edgeAware.verdict) {
    return "unchanged";
  }

  return "regressed";
};

export const buildRelationGroundedQaReadback = (
  input: BuildRelationGroundedQaReadbackInput
): RelationGroundedQaReadback => {
  const sourceClaimsById = new Map(input.sourceClaims.map((claim) => [claim.id, claim]));
  const baseline = scenarioReadback(
    input.baselineContext,
    sourceClaimsById,
    input.answerSourceClaimId
  );
  const edgeAware = scenarioReadback(
    input.edgeAwareContext,
    sourceClaimsById,
    input.answerSourceClaimId
  );

  return {
    baseline,
    edgeAware,
    outcome: outcomeFor(baseline, edgeAware),
    proof: "Relation-grounded QA readback compares selected source context for a no-relation baseline and an edge-aware path.",
    doesNotProve: "Relation-grounded QA readback does not prove source truth, edge correctness, production graph retrieval quality, corpus-scale graph QA, or product readiness."
  };
};
