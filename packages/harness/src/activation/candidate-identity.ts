import type {
  RankedActivationCandidate
} from "./types.js";

export const canonicalCandidateKey = (candidate: RankedActivationCandidate): string => {
  if (candidate.sourceClaimId !== undefined) {
    return `source_claim:${candidate.sourceClaimId}`;
  }

  if (candidate.memoryRecordId !== undefined) {
    return `memory_record:${candidate.memoryRecordId}`;
  }

  return `${candidate.subjectType}:${candidate.subjectId}`;
};
