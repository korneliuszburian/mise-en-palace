import type {
  AntiMemoryRecord,
  ConflictSet
} from "@krn/core";

import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

export interface ConflictDetectionResult {
  candidates: readonly RankedActivationCandidate[];
  conflictSets: readonly ConflictSet[];
}

const sourceClaimIdsBlockedByAntiMemory = (
  antiMemoryRecords: readonly AntiMemoryRecord[]
): Map<string, AntiMemoryRecord> => {
  const blocked = new Map<string, AntiMemoryRecord>();

  for (const antiMemory of antiMemoryRecords) {
    for (const sourceClaimId of antiMemory.invalidatedBySourceClaimIds) {
      blocked.set(sourceClaimId, antiMemory);
    }

    if (antiMemory.invalidatedBySourceClaimId !== undefined) {
      blocked.set(antiMemory.invalidatedBySourceClaimId, antiMemory);
    }
  }

  return blocked;
};

export const detectConflicts = (
  candidates: readonly RankedActivationCandidate[],
  antiMemoryRecords: readonly AntiMemoryRecord[]
): ConflictDetectionResult => {
  const blockedSourceClaims = sourceClaimIdsBlockedByAntiMemory(antiMemoryRecords);
  const conflictSets: ConflictSet[] = [];

  const resolvedCandidates = candidates.map((candidate) => {
    if (candidate.exclusion !== undefined || candidate.subjectType !== "source_claim") {
      return candidate;
    }

    const antiMemory = blockedSourceClaims.get(candidate.subjectId);

    if (antiMemory === undefined) {
      return candidate;
    }

    conflictSets.push({
      id: `anti-memory:${antiMemory.id}:${candidate.subjectId}`,
      candidateIds: [candidate.subjectId, antiMemory.id],
      reason: "anti_memory_block",
      resolution: "defer",
      explanation: antiMemory.reason ?? antiMemory.summary
    });

    return markExcluded(
      {
        ...candidate,
        metadata: {
          ...candidate.metadata,
          conflictReason: "anti_memory_block",
          antiMemoryRecordId: antiMemory.id
        }
      },
      {
        reason: "unsafe",
        explanation: `Blocked by anti-memory ${antiMemory.id}: ${antiMemory.reason ?? antiMemory.summary}`
      }
    );
  });

  return {
    candidates: resolvedCandidates,
    conflictSets
  };
};
