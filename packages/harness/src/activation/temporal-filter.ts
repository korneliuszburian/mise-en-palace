import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

const parseTimestamp = (timestamp: string): number => {
  const parsed = Date.parse(timestamp);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

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
  nowAt: number
): RankedActivationCandidate | undefined => {
  if (candidate.invalidatedAt === undefined) {
    return undefined;
  }

  const invalidatedAt = parseTimestamp(candidate.invalidatedAt);
  if (!Number.isFinite(invalidatedAt)) {
    return invalidTimeExclusion(candidate, "invalidatedAt");
  }

  if (invalidatedAt > nowAt) {
    return undefined;
  }

  return markExcluded(candidate, {
    reason: "invalidated",
    explanation: candidate.invalidationReason ?? "Candidate invalidation time has passed."
  });
};

const validUntilExclusion = (
  candidate: RankedActivationCandidate,
  nowAt: number
): RankedActivationCandidate | undefined => {
  if (candidate.validUntil === undefined) {
    return undefined;
  }

  const validUntil = parseTimestamp(candidate.validUntil);
  if (!Number.isFinite(validUntil)) {
    return invalidTimeExclusion(candidate, "validUntil");
  }

  if (validUntil > nowAt) {
    return undefined;
  }

  return markExcluded(candidate, {
    reason: "stale",
    explanation: "Candidate validity window has expired."
  });
};

const validFromExclusion = (
  candidate: RankedActivationCandidate,
  nowAt: number
): RankedActivationCandidate | undefined => {
  if (candidate.validFrom === undefined) {
    return undefined;
  }

  const validFrom = parseTimestamp(candidate.validFrom);
  if (!Number.isFinite(validFrom)) {
    return invalidTimeExclusion(candidate, "validFrom");
  }

  if (validFrom <= nowAt) {
    return undefined;
  }

  return markExcluded(candidate, {
    reason: "stale",
    explanation: "Candidate validity window has not started."
  });
};

const temporalExclusion = (
  candidate: RankedActivationCandidate,
  now: string
): RankedActivationCandidate | undefined => {
  const nowAt = parseTimestamp(now);
  if (!Number.isFinite(nowAt)) {
    return invalidTimeExclusion(candidate, "now");
  }

  return statusExclusion(candidate) ??
    validFromExclusion(candidate, nowAt) ??
    invalidatedAtExclusion(candidate, nowAt) ??
    validUntilExclusion(candidate, nowAt);
};

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
