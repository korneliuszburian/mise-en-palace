import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

const isPastOrNow = (timestamp: string, now: string): boolean =>
  new Date(timestamp).getTime() <= new Date(now).getTime();

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

  if (candidate.status === "stale") {
    return markExcluded(candidate, {
      reason: "stale",
      explanation: "Candidate is marked stale."
    });
  }

  return undefined;
};

const invalidatedAtExclusion = (
  candidate: RankedActivationCandidate,
  now: string
): RankedActivationCandidate | undefined => {
  if (candidate.invalidatedAt === undefined || !isPastOrNow(candidate.invalidatedAt, now)) {
    return undefined;
  }

  return markExcluded(candidate, {
    reason: "invalidated",
    explanation: candidate.invalidationReason ?? "Candidate invalidation time has passed."
  });
};

const validUntilExclusion = (
  candidate: RankedActivationCandidate,
  now: string
): RankedActivationCandidate | undefined => {
  if (candidate.validUntil === undefined || !isPastOrNow(candidate.validUntil, now)) {
    return undefined;
  }

  return markExcluded(candidate, {
    reason: "stale",
    explanation: "Candidate validity window has expired."
  });
};

const temporalExclusion = (
  candidate: RankedActivationCandidate,
  now: string
): RankedActivationCandidate | undefined =>
  statusExclusion(candidate) ??
  invalidatedAtExclusion(candidate, now) ??
  validUntilExclusion(candidate, now);

export const applyTemporalFilter = (
  candidates: readonly RankedActivationCandidate[],
  now: string
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    return temporalExclusion(candidate, now) ?? candidate;
  });
