import {
  assessTemporalWindow,
  type TemporalWindowInvalidReason
} from "@krn/core";

import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

const invalidTimeExclusion = (
  candidate: RankedActivationCandidate,
  field: string
): RankedActivationCandidate => markExcluded(candidate, {
  reason: "stale",
  explanation: `Candidate has invalid ${field}; temporal eligibility fails closed.`
});

const statusExclusion = (
  candidate: RankedActivationCandidate
): RankedActivationCandidate | undefined => {
  if (candidate.status === "invalidated") {
    return markExcluded(candidate, {
      reason: "invalidated",
      explanation: candidate.invalidationReason ?? "Candidate is marked invalidated."
    });
  }

  if (candidate.status === "superseded") {
    return markExcluded(candidate, {
      reason: "superseded",
      explanation: "Candidate is marked superseded."
    });
  }

  if (candidate.status === "deprecated") {
    return markExcluded(candidate, {
      reason: "stale",
      explanation: "Candidate is marked deprecated and remains a non-governing warning."
    });
  }

  if (candidate.status === "stale") {
    return markExcluded(candidate, {
      reason: "stale",
      explanation: "Candidate is marked stale."
    });
  }

  return undefined;
};

const invalidTimeField = (reason: TemporalWindowInvalidReason): string => {
  switch (reason) {
    case "invalid_now":
      return "now";
    case "invalid_valid_from":
      return "validFrom";
    case "invalid_valid_until":
      return "validUntil";
    case "invalid_invalidated_at":
      return "invalidatedAt";
  }
};

const temporalExclusion = (
  candidate: RankedActivationCandidate,
  now: string
): RankedActivationCandidate | undefined => {
  const temporalValidity = assessTemporalWindow(candidate, now);

  if (temporalValidity.status === "current") {
    return undefined;
  }

  if (temporalValidity.status === "invalid") {
    return invalidTimeExclusion(candidate, invalidTimeField(temporalValidity.reason));
  }

  switch (temporalValidity.reason) {
    case "before_valid_from":
      return markExcluded(candidate, {
        reason: "stale",
        explanation: "Candidate validity window has not started."
      });
    case "invalidated":
      return markExcluded(candidate, {
        reason: "invalidated",
        explanation: candidate.invalidationReason ?? "Candidate invalidation time has passed."
      });
    case "valid_until_elapsed":
      return markExcluded(candidate, {
        reason: "stale",
        explanation: "Candidate validity window has expired."
      });
  }
};

export const applyTemporalFilter = (
  candidates: readonly RankedActivationCandidate[],
  now: string
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    return statusExclusion(candidate) ?? temporalExclusion(candidate, now) ?? candidate;
  });
