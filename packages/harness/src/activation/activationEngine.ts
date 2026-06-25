import type {
  AntiMemoryRecord,
  ContextAssembly,
  SourceTrustTier,
  TaskContract
} from "@krn/core";

import type {
  ActivationDecisionSourceSupportState,
  MemoryRepository,
  RetrievalRepository,
  SourceRepository
} from "../repositories/internal/index.js";
import type {
  RecordActivationDecisionInput
} from "../repositories/retrievalRepository.js";
import {
  buildMemoryQuery
} from "./memoryQuery.js";
import {
  buildOwnerFileRecallCandidates
} from "./ownerFileRecall.js";
import {
  mergeActivationCandidates,
  rankCandidates,
  toMemoryCandidate,
  toSearchCandidate,
  toSourceClaimCandidate
} from "./rankCandidates.js";
import {
  buildSourceQuery
} from "./sourceQuery.js";
import type {
  ActivationExclusionReason,
  ActivationCandidateKind,
  ActivationQuery,
  RankedActivationCandidate
} from "./types.js";
import {
  buildActivationRawRecallTriggers
} from "./activationRawRecall.js";

export interface ActivationRetrievalLimits {
  memory: number;
  source: number;
  search: number;
  antiMemory: number;
}

export interface ActivationCandidateRepositories {
  memoryRepository: Pick<MemoryRepository, "listActiveMemory" | "listAntiMemoryForProject">;
  sourceRepository: Pick<SourceRepository, "listClaimsForProject">;
  retrievalRepository: Pick<RetrievalRepository, "searchLexical">;
}

export interface RetrieveActivationCandidatesInput {
  taskContract: TaskContract;
  memoryQuery?: ActivationQuery;
  sourceQuery?: ActivationQuery;
  limits: ActivationRetrievalLimits;
  repositories: ActivationCandidateRepositories;
}

export interface RetrieveActivationCandidatesResult {
  memoryQuery: ActivationQuery;
  sourceQuery: ActivationQuery;
  candidates: readonly RankedActivationCandidate[];
  antiMemoryRecords: readonly AntiMemoryRecord[];
}

export interface PersistActivationTraceInput {
  retrievalRunId: string;
  candidates: readonly RankedActivationCandidate[];
  contextAssembly: ContextAssembly;
  completedAt: string;
  retrievalRepository: Pick<
    RetrievalRepository,
    "addCandidate" | "recordActivationDecision" | "storeContextSelection" | "completeRetrievalRun"
  >;
  metadata?: Record<string, unknown>;
  rawRecall?: {
    requireExactProof?: boolean;
    lowTrustTiers?: readonly SourceTrustTier[];
    exactProofKinds?: readonly ActivationCandidateKind[];
  };
}

const candidateKey = (candidate: { subjectType: string; subjectId: string }): string =>
  `${candidate.subjectType}:${candidate.subjectId}`;

type ExclusionActivationDecision = Extract<
  RecordActivationDecisionInput["decision"],
  "excluded" | "conflict" | "stale"
>;

const activationDecisionForExclusion = (
  candidate: RankedActivationCandidate | undefined
): ExclusionActivationDecision => {
  if (candidate?.conflictReason === "anti_memory_block") {
    return "conflict";
  }

  if (candidate?.exclusion?.reason === "stale") {
    return "stale";
  }

  return "excluded";
};

const exclusionCategoryFor = (
  candidate: RankedActivationCandidate | undefined,
  subjectId: string
): ActivationExclusionReason => {
  if (candidate?.exclusion?.reason !== undefined) {
    return candidate.exclusion.reason;
  }

  throw new Error(`Activation decision for ${subjectId} is missing exclusion category`);
};

const nonStaleExclusionCategory = (
  category: ActivationExclusionReason,
  subjectId: string
): Exclude<ActivationExclusionReason, "stale"> => {
  if (category === "stale") {
    throw new Error(`Excluded activation decision for ${subjectId} cannot use stale category`);
  }

  return category;
};

const antiMemoryRecordIdForConflict = (
  candidate: RankedActivationCandidate | undefined,
  subjectId: string
): string => {
  if (candidate?.antiMemoryRecordId !== undefined) {
    return candidate.antiMemoryRecordId;
  }

  throw new Error(`Conflict activation decision for ${subjectId} is missing antiMemoryRecordId`);
};

const sourceSupportStateFor = (
  candidate: RankedActivationCandidate | undefined
): ActivationDecisionSourceSupportState => {
  if (candidate?.subjectType !== "source_claim") {
    return "not_applicable";
  }

  if (candidate.hasMechanism === false) {
    return "source_claim_missing_mechanism";
  }

  if (candidate.doesNotProve === undefined || candidate.doesNotProve.trim().length === 0) {
    return "source_claim_missing_does_not_prove";
  }

  return "source_claim_supported";
};

export const retrieveActivationCandidates = async (
  input: RetrieveActivationCandidatesInput
): Promise<RetrieveActivationCandidatesResult> => {
  const memoryQuery = input.memoryQuery ?? buildMemoryQuery(input.taskContract);
  const sourceQuery = input.sourceQuery ?? buildSourceQuery(input.taskContract);

  if (input.taskContract.projectId === undefined) {
    return {
      memoryQuery,
      sourceQuery,
      candidates: [],
      antiMemoryRecords: []
    };
  }

  const memoryRecords = await input.repositories.memoryRepository.listActiveMemory(
    input.taskContract.projectId,
    input.limits.memory
  );
  const sourceClaims = await input.repositories.sourceRepository.listClaimsForProject(
    input.taskContract.projectId,
    input.limits.source
  );
  const searchResults = await input.repositories.retrievalRepository.searchLexical({
    projectId: input.taskContract.projectId,
    query: sourceQuery.text,
    limit: input.limits.search
  });
  const antiMemoryRecords = await input.repositories.memoryRepository.listAntiMemoryForProject(
    input.taskContract.projectId,
    input.limits.antiMemory
  );
  const memoryCandidates = rankCandidates(memoryRecords.map(toMemoryCandidate), memoryQuery);
  const sourceCandidates = rankCandidates(sourceClaims.map(toSourceClaimCandidate), sourceQuery);
  const searchCandidates = rankCandidates(searchResults.map(toSearchCandidate), sourceQuery);
  const ownerFileCandidates = rankCandidates(
    buildOwnerFileRecallCandidates(input.taskContract),
    sourceQuery
  );

  return {
    memoryQuery,
    sourceQuery,
    candidates: mergeActivationCandidates([
      ...memoryCandidates,
      ...sourceCandidates,
      ...searchCandidates,
      ...ownerFileCandidates
    ]),
    antiMemoryRecords
  };
};

export const persistActivationTrace = async (
  input: PersistActivationTraceInput
): Promise<void> => {
  const rawEvidenceRecallTriggers = buildActivationRawRecallTriggers({
    candidates: input.candidates,
    contextAssembly: input.contextAssembly,
    ...(input.rawRecall?.requireExactProof === undefined
      ? {}
      : { requireExactProof: input.rawRecall.requireExactProof }),
    ...(input.rawRecall?.lowTrustTiers === undefined
      ? {}
      : { lowTrustTiers: input.rawRecall.lowTrustTiers }),
    ...(input.rawRecall?.exactProofKinds === undefined
      ? {}
      : { exactProofKinds: input.rawRecall.exactProofKinds })
  });
  const rawEvidenceRecallTriggersBySubject = new Map(
    rawEvidenceRecallTriggers.map((trigger) => [candidateKey(trigger), trigger])
  );
  const includedIds = new Set(
    input.contextAssembly.inclusions.map((inclusion) =>
      candidateKey(inclusion)
    )
  );
  const candidatesBySubject = new Map(
    input.candidates.map((candidate) => [candidateKey(candidate), candidate])
  );
  const candidateRecordIds = new Map<string, string>();

  for (const candidate of input.candidates) {
    const key = candidateKey(candidate);
    const included = includedIds.has(key);
    const searchDocumentId =
      candidate.searchDocumentId ??
      (candidate.searchDocumentIds?.length === 1 ? candidate.searchDocumentIds[0] : undefined);
    const record = await input.retrievalRepository.addCandidate({
      retrievalRunId: input.retrievalRunId,
      kind: candidate.kind,
      status: included ? "included" : "excluded",
      subjectType: candidate.subjectType,
      subjectId: candidate.subjectId,
      ...(searchDocumentId === undefined ? {} : { searchDocumentId }),
      trustTier: candidate.trustTier,
      lexicalScore: candidate.lexicalScore,
      vectorScore: candidate.vectorScore,
      graphScore: candidate.graphScore,
      temporalScore: candidate.temporalScore,
      contextRoiScore: candidate.contextRoiScore,
      totalScore: candidate.totalScore,
      score: candidate.totalScore,
      reason: candidate.exclusion?.explanation ?? candidate.reason,
      metadata: candidate.metadata
    });

    candidateRecordIds.set(key, record.id);
  }

  for (const inclusion of input.contextAssembly.inclusions) {
    const key = candidateKey(inclusion);
    const candidate = candidatesBySubject.get(key);
    const retrievalCandidateId = candidateRecordIds.get(key);
    const rawEvidenceRecallTrigger = rawEvidenceRecallTriggersBySubject.get(key);

    await input.retrievalRepository.recordActivationDecision({
      retrievalRunId: input.retrievalRunId,
      ...(retrievalCandidateId === undefined ? {} : { retrievalCandidateId }),
      contextAssemblyId: input.contextAssembly.id,
      subjectType: inclusion.subjectType,
      subjectId: inclusion.subjectId,
      decision: "included",
      reason: inclusion.reason,
      ...(candidate === undefined ? {} : { score: candidate.totalScore }),
      ...(inclusion.tokenEstimate === undefined
        ? {}
        : { contextBudgetCost: inclusion.tokenEstimate }),
      expectedDecisionImpact: inclusion.expectedUse,
      expectedUse: inclusion.expectedUse,
      ...(rawEvidenceRecallTrigger === undefined
        ? {}
        : {
            rawRecall: {
              required: true,
              reasons: rawEvidenceRecallTrigger.reasons,
              evidenceHints: rawEvidenceRecallTrigger.evidenceHints
            }
          }),
      sourceSupportState: sourceSupportStateFor(candidate),
      metadata: {
        ...(candidate?.searchDocumentIds === undefined
          ? {}
          : { mergedSearchDocumentIds: candidate.searchDocumentIds })
      }
    });
  }

  for (const exclusion of input.contextAssembly.exclusions) {
    const key = candidateKey(exclusion);
    const candidate = candidatesBySubject.get(key);
    const retrievalCandidateId = candidateRecordIds.get(key);
    const decision = activationDecisionForExclusion(candidate);
    const exclusionCategory = exclusionCategoryFor(candidate, exclusion.subjectId);
    const activationAbstentionReason = input.contextAssembly.activationAbstention?.reason;

    const commonInput = {
      retrievalRunId: input.retrievalRunId,
      ...(retrievalCandidateId === undefined ? {} : { retrievalCandidateId }),
      contextAssemblyId: input.contextAssembly.id,
      subjectType: exclusion.subjectType,
      subjectId: exclusion.subjectId,
      ...(exclusion.score === undefined ? {} : { score: exclusion.score }),
      sourceSupportState: sourceSupportStateFor(candidate),
      ...(activationAbstentionReason === undefined ? {} : { activationAbstentionReason }),
      metadata: {
        explanation: exclusion.explanation
      }
    };

    if (decision === "conflict") {
      await input.retrievalRepository.recordActivationDecision({
        ...commonInput,
        decision,
        reason: "anti_memory_block",
        antiMemoryRecordId: antiMemoryRecordIdForConflict(candidate, exclusion.subjectId),
        exclusionCategory
      });
    } else if (decision === "stale") {
      await input.retrievalRepository.recordActivationDecision({
        ...commonInput,
        decision,
        reason: exclusion.reason,
        exclusionCategory: "stale"
      });
    } else {
      await input.retrievalRepository.recordActivationDecision({
        ...commonInput,
        decision,
        reason: exclusion.reason,
        exclusionCategory: nonStaleExclusionCategory(exclusionCategory, exclusion.subjectId)
      });
    }
  }

  await input.retrievalRepository.storeContextSelection({
    contextAssemblyId: input.contextAssembly.id,
    inclusions: input.contextAssembly.inclusions,
    exclusions: input.contextAssembly.exclusions
  });
  await input.retrievalRepository.completeRetrievalRun({
    retrievalRunId: input.retrievalRunId,
    status: input.contextAssembly.status === "abstained" ? "abstained" : "completed",
    completedAt: input.completedAt,
    ...(input.contextAssembly.activationAbstention === undefined
      ? {}
      : { activationAbstentionReason: input.contextAssembly.activationAbstention.reason }),
    rawEvidenceRecallTriggerCount: rawEvidenceRecallTriggers.length,
    ...(rawEvidenceRecallTriggers.length === 0
      ? {}
      : { rawEvidenceRecallTriggers }),
    metadata: {
      ...(input.metadata ?? {}),
      inclusionCount: input.contextAssembly.inclusions.length,
      exclusionCount: input.contextAssembly.exclusions.length
    }
  });
};
