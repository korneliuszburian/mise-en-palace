import type {
  ContextAssembly,
  SourceClaim,
  SourceClaimEdge,
  SourceRelationReviewFocus
} from "@krn/core";

export type RelationGroundedQaVerdict = "grounded" | "insufficient";
export type RelationGroundedQaUsefulness = "improved" | "weak";
export type RelationGroundedQaOutcome = "improved" | "unchanged" | "regressed";
export type RelationGroundedQaRelationReviewUsefulness = "used" | "not_used";

export interface RelationGroundedQaScenarioReadback {
  verdict: RelationGroundedQaVerdict;
  answer: string;
  reviewUsefulness: RelationGroundedQaUsefulness;
  includedSourceClaimIds: readonly SourceClaim["id"][];
  usedSourceClaimIds: readonly SourceClaim["id"][];
}

export interface RelationGroundedQaRelationReviewInput {
  sourceClaimEdgeId: SourceClaimEdge["id"];
  edgeKind: SourceClaimEdge["kind"];
  relationReviewFocus: SourceRelationReviewFocus;
  relationReviewQuestion: string;
}

export interface RelationGroundedQaRelationReviewReadback
  extends RelationGroundedQaRelationReviewInput {
  consumedBy: "relation_grounded_qa_readback";
  reviewUsefulness: RelationGroundedQaRelationReviewUsefulness;
  doesNotProve: string;
}

export interface RelationGroundedQaReadback {
  baseline: RelationGroundedQaScenarioReadback;
  edgeAware: RelationGroundedQaScenarioReadback;
  relationReview?: RelationGroundedQaRelationReviewReadback;
  outcome: RelationGroundedQaOutcome;
  proof: string;
  doesNotProve: string;
}

export interface BuildRelationGroundedQaReadbackInput {
  baselineContext: Pick<ContextAssembly, "inclusions">;
  edgeAwareContext: Pick<ContextAssembly, "inclusions">;
  sourceClaims: readonly Pick<SourceClaim, "id" | "claim">[];
  answerSourceClaimId: SourceClaim["id"];
  relationReview?: RelationGroundedQaRelationReviewInput;
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

const relationReviewReadback = (
  relationReview: RelationGroundedQaRelationReviewInput,
  edgeAware: RelationGroundedQaScenarioReadback
): RelationGroundedQaRelationReviewReadback => ({
  ...relationReview,
  consumedBy: "relation_grounded_qa_readback",
  reviewUsefulness: edgeAware.verdict === "grounded" ? "used" : "not_used",
  doesNotProve:
    "Relation review focus consumption does not prove source truth, edge correctness, contradiction resolution, duplicate consolidation, or production graph QA quality."
});

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
  const relationReview = input.relationReview === undefined
    ? undefined
    : relationReviewReadback(input.relationReview, edgeAware);

  return {
    baseline,
    edgeAware,
    ...(relationReview === undefined ? {} : { relationReview }),
    outcome: outcomeFor(baseline, edgeAware),
    proof: "Relation-grounded QA readback compares selected source context for a no-relation baseline and an edge-aware path.",
    doesNotProve: "Relation-grounded QA readback does not prove source truth, edge correctness, production graph retrieval quality, corpus-scale graph QA, or product readiness."
  };
};
