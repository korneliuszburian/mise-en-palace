import {
  assessCandidateReviewability
} from "@krn/core";
import type {
  CandidateReviewability,
  IsoTimestamp,
  SourceClaimEdge,
  SourceLineageRef,
  SourceRelationReviewFocus
} from "@krn/core";

export type ConsensusCandidateKind =
  | "memory_candidate"
  | "anti_memory_candidate"
  | "source_decision_candidate"
  | "source_claim_candidate"
  | "eval_candidate"
  | "policy_candidate"
  | "skill_candidate"
  | "unknown_candidate";

export type ConsensusEvidencePosition = "support" | "dissent" | "risk";

export type ConsensusDecisionOption =
  | "review_candidate"
  | "defer_candidate"
  | "reject_candidate"
  | "request_more_evidence";

export interface ConsensusEvaluationEvidence {
  id: string;
  position: ConsensusEvidencePosition;
  summary: string;
  evidenceRef: string;
  doesNotProve: string;
}

export type ConsensusRelationReviewUsefulness = "used" | "not_used";

export interface ConsensusRelationReviewInput {
  sourceClaimEdgeId: SourceClaimEdge["id"];
  edgeKind: SourceClaimEdge["kind"];
  relationReviewFocus: SourceRelationReviewFocus;
  relationReviewQuestion: string;
}

export interface ConsensusRelationReviewReadback
  extends ConsensusRelationReviewInput {
  consumedBy: "consensus_candidate_evaluation_preview";
  reviewUsefulness: ConsensusRelationReviewUsefulness;
  doesNotProve: string;
}

export interface ConsensusCandidateEvaluationInput {
  candidateId: string;
  candidateKind: ConsensusCandidateKind;
  summary: string;
  body?: string;
  applicationGuidance?: string;
  evidenceRefs?: readonly string[];
  sourceLineage?: readonly SourceLineageRef[];
  duplicateOf?: string;
  notUsefulReason?: string;
  relationReview?: ConsensusRelationReviewInput;
  evidence: readonly ConsensusEvaluationEvidence[];
}

export interface ConsensusCandidateEvaluation {
  id: string;
  kind: "consensus_candidate_evaluation_preview";
  candidateId: string;
  candidateKind: ConsensusCandidateKind;
  summary: string;
  applicationGuidance: string;
  decisionOptions: readonly ConsensusDecisionOption[];
  supportEvidenceRefs: readonly string[];
  dissentEvidenceRefs: readonly string[];
  riskEvidenceRefs: readonly string[];
  relationReview?: ConsensusRelationReviewReadback;
  preservedDissent: readonly ConsensusEvaluationEvidence[];
  evidenceRefs: readonly string[];
  doesNotProve: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: readonly string[];
  mutation: "none";
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "eval_candidates"
  ];
}

export interface BuildConsensusCandidateEvaluationPreviewInput {
  generatedAt: IsoTimestamp;
  candidates: readonly ConsensusCandidateEvaluationInput[];
  maxCandidates?: number;
}

export interface ConsensusCandidateEvaluationPreview {
  generatedAt: IsoTimestamp;
  evaluations: readonly ConsensusCandidateEvaluation[];
  skippedCandidateCount: number;
  mutation: "none";
  proof: string;
  doesNotProve: string;
}

const forbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions",
  "eval_candidates"
] as const;

const previewDoesNotProve =
  "Consensus candidate evaluation preview does not prove candidate truth, consensus correctness, promotion readiness, autonomous agent judgment, or Memory Core mutation.";

const defaultApplicationGuidance =
  "Route this consensus preview to human review before accepting, rejecting, promoting, or mutating any candidate truth.";

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const applicationGuidanceFor = (
  input: ConsensusCandidateEvaluationInput
): string => {
  const baseGuidance = input.applicationGuidance ?? defaultApplicationGuidance;

  if (input.relationReview === undefined) {
    return baseGuidance;
  }

  return `${baseGuidance} ${input.relationReview.relationReviewQuestion}`;
};

const evidenceRefsByPosition = (
  evidence: readonly ConsensusEvaluationEvidence[],
  position: ConsensusEvidencePosition
): readonly string[] =>
  evidence
    .filter((item) => item.position === position)
    .map((item) => item.evidenceRef)
    .filter(hasText);

const missingFields = (
  input: ConsensusCandidateEvaluationInput,
  supportEvidenceRefs: readonly string[]
): readonly string[] => [
  ...(supportEvidenceRefs.length > 0 ? [] : ["supportingEvidence"]),
  ...(hasText(input.applicationGuidance) ? [] : ["applicationGuidance"])
];

const decisionOptionsFor = (
  reviewability: CandidateReviewability,
  supportEvidenceRefs: readonly string[],
  dissentEvidenceRefs: readonly string[],
  riskEvidenceRefs: readonly string[]
): readonly ConsensusDecisionOption[] => {
  if (reviewability === "duplicate" || reviewability === "not_useful") {
    return ["reject_candidate", "defer_candidate"];
  }

  if (reviewability === "too_vague" || supportEvidenceRefs.length === 0) {
    return ["request_more_evidence", "defer_candidate"];
  }

  if (dissentEvidenceRefs.length > 0 || riskEvidenceRefs.length > 0) {
    return ["review_candidate", "defer_candidate", "request_more_evidence"];
  }

  if (reviewability === "ready") {
    return ["review_candidate"];
  }

  return ["request_more_evidence", "defer_candidate"];
};

const relationReviewReadback = (
  relationReview: ConsensusRelationReviewInput,
  dissentEvidenceRefs: readonly string[],
  riskEvidenceRefs: readonly string[]
): ConsensusRelationReviewReadback => ({
  ...relationReview,
  consumedBy: "consensus_candidate_evaluation_preview",
  reviewUsefulness: dissentEvidenceRefs.length > 0 || riskEvidenceRefs.length > 0
    ? "used"
    : "not_used",
  doesNotProve:
    "Consensus relation review focus consumption does not prove source truth, edge correctness, contradiction resolution, duplicate consolidation, consensus correctness, or Memory Core mutation."
});

const buildEvaluation = (
  input: ConsensusCandidateEvaluationInput
): ConsensusCandidateEvaluation => {
  const supportEvidenceRefs = evidenceRefsByPosition(input.evidence, "support");
  const dissentEvidenceRefs = evidenceRefsByPosition(input.evidence, "dissent");
  const riskEvidenceRefs = evidenceRefsByPosition(input.evidence, "risk");
  const applicationGuidance = applicationGuidanceFor(input);
  const evidenceRefs = [
    ...(input.evidenceRefs ?? []),
    ...supportEvidenceRefs,
    ...dissentEvidenceRefs,
    ...riskEvidenceRefs
  ].filter(hasText);
  const reviewability = assessCandidateReviewability({
    summary: input.summary,
    ...(input.body === undefined ? {} : { body: input.body }),
    evidenceRefs,
    ...(input.sourceLineage === undefined ? {} : { sourceLineage: input.sourceLineage }),
    applicationGuidance,
    doesNotProve: previewDoesNotProve,
    missingFields: missingFields(input, supportEvidenceRefs),
    ...(input.duplicateOf === undefined ? {} : { duplicateOf: input.duplicateOf }),
    ...(input.notUsefulReason === undefined ? {} : { notUsefulReason: input.notUsefulReason })
  });
  const relationReview = input.relationReview === undefined
    ? undefined
    : relationReviewReadback(input.relationReview, dissentEvidenceRefs, riskEvidenceRefs);

  return {
    id: `consensus-candidate-evaluation:${input.candidateId}`,
    kind: "consensus_candidate_evaluation_preview",
    candidateId: input.candidateId,
    candidateKind: input.candidateKind,
    summary: input.summary,
    applicationGuidance,
    decisionOptions: decisionOptionsFor(
      reviewability.reviewability,
      supportEvidenceRefs,
      dissentEvidenceRefs,
      riskEvidenceRefs
    ),
    supportEvidenceRefs,
    dissentEvidenceRefs,
    riskEvidenceRefs,
    ...(relationReview === undefined ? {} : { relationReview }),
    preservedDissent: input.evidence.filter((item) => item.position === "dissent"),
    evidenceRefs,
    doesNotProve: previewDoesNotProve,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    mutation: "none",
    forbiddenWrites
  };
};

export const buildConsensusCandidateEvaluationPreview = (
  input: BuildConsensusCandidateEvaluationPreviewInput
): ConsensusCandidateEvaluationPreview => {
  const maxCandidates = Math.max(0, input.maxCandidates ?? input.candidates.length);

  if (maxCandidates === 0) {
    return {
      generatedAt: input.generatedAt,
      evaluations: [],
      skippedCandidateCount: input.candidates.length,
      mutation: "none",
      proof:
        "Consensus candidate evaluation preview inspects candidate evidence, relation review focus, and preserved dissent as candidate-only review input.",
      doesNotProve: previewDoesNotProve
    };
  }

  const evaluations = input.candidates.slice(0, maxCandidates).map(buildEvaluation);

  return {
    generatedAt: input.generatedAt,
    evaluations,
    skippedCandidateCount: input.candidates.length - evaluations.length,
    mutation: "none",
    proof:
      "Consensus candidate evaluation preview inspects candidate evidence, relation review focus, and preserved dissent as candidate-only review input.",
    doesNotProve: previewDoesNotProve
  };
};
