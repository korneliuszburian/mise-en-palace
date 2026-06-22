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

const antiMemoryTargetsMemory = (
  antiMemory: AntiMemoryRecord,
  candidate: RankedActivationCandidate
): boolean => {
  if (candidate.subjectType !== "memory_record") {
    return false;
  }

  const candidateKey = candidate.metadata.key;
  const appliesTo = antiMemory.appliesTo?.trim();

  return (
    antiMemory.key === candidate.subjectId ||
    appliesTo === candidate.subjectId ||
    (typeof candidateKey === "string" &&
      (antiMemory.key === candidateKey || appliesTo === candidateKey))
  );
};

const antiMemoryForMemoryCandidate = (
  antiMemoryRecords: readonly AntiMemoryRecord[],
  candidate: RankedActivationCandidate
): AntiMemoryRecord | undefined =>
  antiMemoryRecords.find((antiMemory) => antiMemoryTargetsMemory(antiMemory, candidate));

const antiMemoryTargetsSearch = (
  antiMemory: AntiMemoryRecord,
  candidate: RankedActivationCandidate,
  blockedSourceClaims: ReadonlyMap<string, AntiMemoryRecord>
): boolean => {
  if (candidate.subjectType !== "search_document") {
    return false;
  }

  const sourceClaimId = candidate.metadata.sourceClaimId;
  if (typeof sourceClaimId === "string" && blockedSourceClaims.get(sourceClaimId)?.id === antiMemory.id) {
    return true;
  }

  const memoryRecordId = candidate.metadata.memoryRecordId;
  const appliesTo = antiMemory.appliesTo?.trim();

  return (
    typeof memoryRecordId === "string" &&
    (antiMemory.key === memoryRecordId || appliesTo === memoryRecordId)
  );
};

const antiMemoryForSearchCandidate = (
  antiMemoryRecords: readonly AntiMemoryRecord[],
  candidate: RankedActivationCandidate,
  blockedSourceClaims: ReadonlyMap<string, AntiMemoryRecord>
): AntiMemoryRecord | undefined =>
  antiMemoryRecords.find((antiMemory) =>
    antiMemoryTargetsSearch(antiMemory, candidate, blockedSourceClaims)
  );

const blockCandidateWithAntiMemory = (
  candidate: RankedActivationCandidate,
  antiMemory: AntiMemoryRecord
): RankedActivationCandidate =>
  markExcluded(
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

export const detectConflicts = (
  candidates: readonly RankedActivationCandidate[],
  antiMemoryRecords: readonly AntiMemoryRecord[]
): ConflictDetectionResult => {
  const blockedSourceClaims = sourceClaimIdsBlockedByAntiMemory(antiMemoryRecords);
  const conflictSets: ConflictSet[] = [];

  const resolvedCandidates = candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    const antiMemory =
      candidate.subjectType === "source_claim"
        ? blockedSourceClaims.get(candidate.subjectId)
        : candidate.subjectType === "memory_record"
          ? antiMemoryForMemoryCandidate(antiMemoryRecords, candidate)
          : antiMemoryForSearchCandidate(antiMemoryRecords, candidate, blockedSourceClaims);

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

    return blockCandidateWithAntiMemory(candidate, antiMemory);
  });

  return {
    candidates: resolvedCandidates,
    conflictSets
  };
};
