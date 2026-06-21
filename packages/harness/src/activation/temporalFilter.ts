import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

const isPastOrNow = (timestamp: string, now: string): boolean =>
  new Date(timestamp).getTime() <= new Date(now).getTime();

export const applyTemporalFilter = (
  candidates: readonly RankedActivationCandidate[],
  now: string
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

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

    if (candidate.invalidatedAt !== undefined && isPastOrNow(candidate.invalidatedAt, now)) {
      return markExcluded(candidate, {
        reason: "invalidated",
        explanation: candidate.invalidationReason ?? "Candidate invalidation time has passed."
      });
    }

    if (candidate.validUntil !== undefined && isPastOrNow(candidate.validUntil, now)) {
      return markExcluded(candidate, {
        reason: "stale",
        explanation: "Candidate validity window has expired."
      });
    }

    return candidate;
  });
