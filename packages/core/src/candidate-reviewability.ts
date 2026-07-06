import type {
  SourceLineageRef
} from "./memory.js";

export type CandidateReviewability =
  | "ready"
  | "needs_more_evidence"
  | "too_vague"
  | "duplicate"
  | "not_useful"
  | "unknown";

export interface CandidateReviewabilityInput {
  summary: string;
  body?: string;
  evidenceRefs?: readonly string[];
  sourceLineage?: readonly SourceLineageRef[];
  applicationGuidance?: string;
  doesNotProve?: string;
  missingFields?: readonly string[];
  duplicateOf?: string;
  notUsefulReason?: string;
}

export interface CandidateReviewabilityAssessment {
  reviewability: CandidateReviewability;
  reasons: string[];
}

const hasText = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

const hasItems = <T>(values: readonly T[] | undefined): boolean =>
  values !== undefined && values.length > 0;

const vaguePhrases = [
  "improve quality",
  "review files",
  "review changed files",
  "reusable memory",
  "clean up",
  "make better"
] as const;

const isVagueCandidate = (input: CandidateReviewabilityInput): boolean => {
  const text = `${input.summary} ${input.body ?? ""}`.toLowerCase();

  return vaguePhrases.some((phrase) => text.includes(phrase));
};

export const assessCandidateReviewability = (
  input: CandidateReviewabilityInput
): CandidateReviewabilityAssessment => {
  if (hasText(input.duplicateOf)) {
    return {
      reviewability: "duplicate",
      reasons: [`Candidate appears to duplicate ${input.duplicateOf?.trim()}.`]
    };
  }

  if (hasText(input.notUsefulReason)) {
    return {
      reviewability: "not_useful",
      reasons: [input.notUsefulReason?.trim() ?? "Candidate would not reduce future review burden."]
    };
  }

  if (isVagueCandidate(input)) {
    return {
      reviewability: "too_vague",
      reasons: ["Candidate does not name a concrete future use."]
    };
  }

  const reasons = [
    ...(input.missingFields === undefined || input.missingFields.length === 0
      ? []
      : [`Missing fields: ${input.missingFields.join(", ")}.`]),
    ...(hasItems(input.evidenceRefs) || hasItems(input.sourceLineage)
      ? []
      : ["Missing evidence refs or source lineage."]),
    ...(hasText(input.applicationGuidance)
      ? []
      : ["Missing application guidance."]),
    ...(hasText(input.doesNotProve)
      ? []
      : ["Missing doesNotProve boundary."])
  ];

  if (reasons.length > 0) {
    return {
      reviewability: "needs_more_evidence",
      reasons
    };
  }

  if (
    hasText(input.summary) &&
    (hasItems(input.evidenceRefs) || hasItems(input.sourceLineage)) &&
    hasText(input.applicationGuidance) &&
    hasText(input.doesNotProve)
  ) {
    return {
      reviewability: "ready",
      reasons: ["Candidate has review evidence, application guidance, and doesNotProve boundary."]
    };
  }

  return {
    reviewability: "unknown",
    reasons: ["Current candidate fields are insufficient to classify reviewability."]
  };
};
