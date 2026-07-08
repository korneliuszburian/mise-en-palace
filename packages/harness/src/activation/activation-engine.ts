import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  ActivationAbstentionReason,
  ContextAssembly,
  SourceAuthorityLabel,
  TaskContract
} from "@krn/core";
import {
  assessSourceClaimAuthority,
  assessSourceClaimReviewSignals,
  activationExclusionReasons
} from "@krn/core";

import type {
  ActivationDecisionSourceSupportState,
  MemoryRepository,
  RecordActivationDecisionInput,
  RetrievalRepository,
  SourceRepository
} from "@krn/core/repositories/internal";
import {
  buildMemoryQuery
} from "./memory-query.js";
import {
  buildActivationRetrievalDiagnostics
} from "./activation-diagnostics.js";
import {
  buildOwnerFileRecallCandidates
} from "./owner-file-recall.js";
import type {
  TargetActivationReadModel
} from "./owner-file-recall.js";
import {
  applySourceClaimEdgeInfluence,
  applySourceClaimEdgeRankDown,
  mergeActivationCandidates,
  rankCandidates,
  toMemoryCandidate,
  toSearchCandidate,
  toSourceClaimCandidate
} from "./rank-candidates.js";
import {
  applyPendingAntiMemoryReview
} from "./pending-anti-memory-review.js";
import {
  buildSourceQuery
} from "./source-query.js";
import type {
  ActivationExclusionReason,
  ActivationRetrievalDiagnostics,
  ActivationCandidateKind,
  ActivationQuery,
  RankedActivationCandidate
} from "./types.js";
import {
  buildActivationRawRecallTriggers
} from "./activation-raw-recall.js";

export interface ActivationRetrievalLimits {
  memory: number;
  source: number;
  search: number;
  antiMemory: number;
}

export interface ActivationCandidateRepositories {
  memoryRepository: Pick<
    MemoryRepository,
    "listActiveMemory" | "listAntiMemoryForProject"
  > & Partial<Pick<MemoryRepository, "listAntiMemoryCandidates">>;
  sourceRepository: Pick<
    SourceRepository,
    "listClaimsForProject" | "listSourceClaimEdgesForClaim" | "listSourceDecisionEdgesForClaim"
  >;
  retrievalRepository: Pick<RetrievalRepository, "searchLexical">;
}

export interface RetrieveActivationCandidatesInput {
  taskContract: TaskContract;
  memoryQuery?: ActivationQuery;
  sourceQuery?: ActivationQuery;
  targetReadModel?: TargetActivationReadModel;
  limits: ActivationRetrievalLimits;
  repositories: ActivationCandidateRepositories;
}

export interface RetrieveActivationCandidatesResult {
  memoryQuery: ActivationQuery;
  sourceQuery: ActivationQuery;
  candidates: readonly RankedActivationCandidate[];
  antiMemoryRecords: readonly AntiMemoryRecord[];
  antiMemoryCandidates: readonly AntiMemoryCandidate[];
  diagnostics: ActivationRetrievalDiagnostics;
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
    lowSourceAuthorities?: readonly SourceAuthorityLabel[];
    exactProofKinds?: readonly ActivationCandidateKind[];
  };
}

type ActivationTraceRetrievalRepository = PersistActivationTraceInput["retrievalRepository"];
type ActivationTraceInclusion = ContextAssembly["inclusions"][number];
type ActivationTraceExclusion = ContextAssembly["exclusions"][number];
type ActivationRawRecallTrigger =
  ReturnType<typeof buildActivationRawRecallTriggers>[number];

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

const isActivationExclusionReason = (
  reason: string
): reason is ActivationExclusionReason =>
  activationExclusionReasons.some((candidate) => candidate === reason);

const exclusionCategoryFor = (
  candidate: RankedActivationCandidate | undefined,
  exclusion: ActivationTraceExclusion
): ActivationExclusionReason => {
  if (candidate?.exclusion?.reason !== undefined) {
    return candidate.exclusion.reason;
  }

  if (isActivationExclusionReason(exclusion.reason)) {
    return exclusion.reason;
  }

  throw new Error(`Activation decision for ${exclusion.subjectId} has unknown exclusion category ${exclusion.reason}`);
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

const buildTraceRawRecallTriggers = (
  input: Pick<PersistActivationTraceInput, "candidates" | "contextAssembly" | "rawRecall">
) =>
  buildActivationRawRecallTriggers({
    candidates: input.candidates,
    contextAssembly: input.contextAssembly,
    ...(input.rawRecall?.requireExactProof === undefined
      ? {}
      : { requireExactProof: input.rawRecall.requireExactProof }),
    ...(input.rawRecall?.lowSourceAuthorities === undefined
      ? {}
      : { lowSourceAuthorities: input.rawRecall.lowSourceAuthorities }),
    ...(input.rawRecall?.exactProofKinds === undefined
      ? {}
      : { exactProofKinds: input.rawRecall.exactProofKinds })
  });

const searchDocumentIdFor = (
  candidate: RankedActivationCandidate
): string | undefined =>
  candidate.searchDocumentId ??
  (candidate.searchDocumentIds?.length === 1 ? candidate.searchDocumentIds[0] : undefined);

const persistRetrievalCandidates = async (
  input: Pick<PersistActivationTraceInput, "retrievalRunId" | "candidates"> & {
    readonly includedIds: ReadonlySet<string>;
    readonly retrievalRepository: ActivationTraceRetrievalRepository;
  }
): Promise<Map<string, string>> => {
  const candidateRecordIds = new Map<string, string>();

  for (const candidate of input.candidates) {
    const key = candidateKey(candidate);
    const searchDocumentId = searchDocumentIdFor(candidate);
    const record = await input.retrievalRepository.addCandidate({
      retrievalRunId: input.retrievalRunId,
      kind: candidate.kind,
      status: input.includedIds.has(key) ? "included" : "excluded",
      subjectType: candidate.subjectType,
      subjectId: candidate.subjectId,
      ...(searchDocumentId === undefined ? {} : { searchDocumentId }),
      sourceAuthority: candidate.sourceAuthority,
      lexicalScore: candidate.lexicalScore,
      vectorScore: candidate.vectorScore,
      graphScore: candidate.graphScore,
      temporalScore: candidate.temporalScore,
      contextRoiScore: candidate.contextRoiScore,
      totalScore: candidate.totalScore,
      score: candidate.totalScore,
      reason: candidate.exclusion?.explanation ?? candidate.reason,
      metadata: {
        ...candidate.metadata,
        ...(candidate.feedbackScore === 0 ? {} : { feedbackScore: candidate.feedbackScore })
      }
    });

    candidateRecordIds.set(key, record.id);
  }

  return candidateRecordIds;
};

const recordInclusionTraceDecision = async (
  input: Pick<PersistActivationTraceInput, "retrievalRunId"> & {
    readonly contextAssemblyId: string;
    readonly inclusion: ActivationTraceInclusion;
    readonly candidate: RankedActivationCandidate | undefined;
    readonly retrievalCandidateId: string | undefined;
    readonly rawEvidenceRecallTrigger: ActivationRawRecallTrigger | undefined;
    readonly retrievalRepository: ActivationTraceRetrievalRepository;
  }
): Promise<void> => {
  await input.retrievalRepository.recordActivationDecision({
    retrievalRunId: input.retrievalRunId,
    ...(input.retrievalCandidateId === undefined
      ? {}
      : { retrievalCandidateId: input.retrievalCandidateId }),
    contextAssemblyId: input.contextAssemblyId,
    subjectType: input.inclusion.subjectType,
    subjectId: input.inclusion.subjectId,
    decision: "included",
    reason: input.inclusion.reason,
    ...(input.candidate === undefined ? {} : { score: input.candidate.totalScore }),
    ...(input.inclusion.tokenEstimate === undefined
      ? {}
      : { contextBudgetCost: input.inclusion.tokenEstimate }),
    expectedDecisionImpact: input.inclusion.expectedUse,
    expectedUse: input.inclusion.expectedUse,
    ...(input.rawEvidenceRecallTrigger === undefined
      ? {}
      : {
          rawRecall: {
            required: true,
            reasons: input.rawEvidenceRecallTrigger.reasons,
            evidenceHints: input.rawEvidenceRecallTrigger.evidenceHints
          }
        }),
    sourceSupportState: sourceSupportStateFor(input.candidate),
    metadata: {
      ...(input.candidate?.searchDocumentIds === undefined
        ? {}
        : { mergedSearchDocumentIds: input.candidate.searchDocumentIds })
    }
  });
};

const recordExclusionTraceDecision = async (
  input: Pick<PersistActivationTraceInput, "retrievalRunId"> & {
    readonly contextAssemblyId: string;
    readonly exclusion: ActivationTraceExclusion;
    readonly candidate: RankedActivationCandidate | undefined;
    readonly retrievalCandidateId: string | undefined;
    readonly activationAbstentionReason: ActivationAbstentionReason | undefined;
    readonly retrievalRepository: ActivationTraceRetrievalRepository;
  }
): Promise<void> => {
  const decision = activationDecisionForExclusion(input.candidate);
  const exclusionCategory = exclusionCategoryFor(
    input.candidate,
    input.exclusion
  );
  const commonInput = {
    retrievalRunId: input.retrievalRunId,
    ...(input.retrievalCandidateId === undefined
      ? {}
      : { retrievalCandidateId: input.retrievalCandidateId }),
    contextAssemblyId: input.contextAssemblyId,
    subjectType: input.exclusion.subjectType,
    subjectId: input.exclusion.subjectId,
    ...(input.exclusion.score === undefined ? {} : { score: input.exclusion.score }),
    sourceSupportState: sourceSupportStateFor(input.candidate),
    ...(input.activationAbstentionReason === undefined
      ? {}
      : { activationAbstentionReason: input.activationAbstentionReason }),
    metadata: {
      explanation: input.exclusion.explanation
    }
  };

  if (decision === "conflict") {
    await input.retrievalRepository.recordActivationDecision({
      ...commonInput,
      decision,
      reason: "anti_memory_block",
      antiMemoryRecordId: antiMemoryRecordIdForConflict(
        input.candidate,
        input.exclusion.subjectId
      ),
      exclusionCategory
    });
    return;
  }

  if (decision === "stale") {
    await input.retrievalRepository.recordActivationDecision({
      ...commonInput,
      decision,
      reason: input.exclusion.reason,
      exclusionCategory: "stale"
    });
    return;
  }

  await input.retrievalRepository.recordActivationDecision({
    ...commonInput,
    decision,
    reason: input.exclusion.reason,
    exclusionCategory: nonStaleExclusionCategory(
      exclusionCategory,
      input.exclusion.subjectId
    )
  });
};

const completeActivationTraceRun = async (
  input: Pick<
    PersistActivationTraceInput,
    "retrievalRunId" | "contextAssembly" | "completedAt" | "metadata"
  > & {
    readonly rawEvidenceRecallTriggers: readonly ActivationRawRecallTrigger[];
    readonly retrievalRepository: ActivationTraceRetrievalRepository;
  }
): Promise<void> => {
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
    rawEvidenceRecallTriggerCount: input.rawEvidenceRecallTriggers.length,
    ...(input.rawEvidenceRecallTriggers.length === 0
      ? {}
      : { rawEvidenceRecallTriggers: input.rawEvidenceRecallTriggers }),
    metadata: {
      ...(input.metadata ?? {}),
      inclusionCount: input.contextAssembly.inclusions.length,
      exclusionCount: input.contextAssembly.exclusions.length
    }
  });
};

const isExplicitMarkerTerm = (term: string): boolean =>
  term.length >= 8 && /[0-9]/u.test(term) && /^[a-z0-9]+$/u.test(term);

const fallbackLexicalSearchQuery = (sourceQuery: ActivationQuery): string | undefined => {
  const terms = sourceQuery.terms.filter(isExplicitMarkerTerm).slice(0, 5);

  return terms.length === 0 ? undefined : terms.join(" OR ");
};

const searchLexicalWithMarkerFallback = async (
  input: Pick<RetrieveActivationCandidatesInput, "taskContract" | "limits" | "repositories">,
  sourceQuery: ActivationQuery
) => {
  const primaryResults = await input.repositories.retrievalRepository.searchLexical({
    ...(input.taskContract.projectId === undefined ? {} : { projectId: input.taskContract.projectId }),
    query: sourceQuery.text,
    limit: input.limits.search
  });

  if (primaryResults.length > 0) {
    return primaryResults;
  }

  const fallbackQuery = fallbackLexicalSearchQuery(sourceQuery);

  if (fallbackQuery === undefined) {
    return primaryResults;
  }

  return input.repositories.retrievalRepository.searchLexical({
    ...(input.taskContract.projectId === undefined ? {} : { projectId: input.taskContract.projectId }),
    query: fallbackQuery,
    limit: input.limits.search
  });
};

const sourceClaimEdgesForClaims = async (
  sourceRepository: Pick<SourceRepository, "listSourceClaimEdgesForClaim">,
  sourceClaims: readonly { id: string }[]
) => {
  const edges = await Promise.all(
    sourceClaims.map((claim) => sourceRepository.listSourceClaimEdgesForClaim(claim.id))
  );
  const uniqueEdgesById = new Map(edges.flat().map((edge) => [edge.id, edge]));

  return [...uniqueEdgesById.values()];
};

const sourceDecisionCountsForClaims = async (
  sourceRepository: Pick<SourceRepository, "listSourceDecisionEdgesForClaim">,
  sourceClaims: readonly { id: string }[]
): Promise<ReadonlyMap<string, number>> => {
  const countsBySourceClaimId = new Map<string, number>();

  await Promise.all(sourceClaims.map(async (claim) => {
    const edges = await sourceRepository.listSourceDecisionEdgesForClaim(claim.id);

    countsBySourceClaimId.set(claim.id, edges.length);
  }));

  return countsBySourceClaimId;
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
      antiMemoryRecords: [],
      antiMemoryCandidates: [],
      diagnostics: buildActivationRetrievalDiagnostics({
        projectScoped: false,
        memoryRecordCount: 0,
        sourceClaimCount: 0,
        searchResultCount: 0,
        ownerFileCandidateCount: 0,
        antiMemoryRecordCount: 0,
        mergedCandidateCount: 0,
        targetReadModelStatus: input.targetReadModel === undefined ? "not_provided" : "provided",
        sourceSeedCount: input.targetReadModel?.sourceSeeds.length ?? 0,
        targetOwnerFileCount: input.targetReadModel?.ownerFiles?.length ?? 0,
        trustExclusionCount: input.targetReadModel?.trustExclusions.length ?? 0
      })
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
  const sourceClaimEdges = await sourceClaimEdgesForClaims(
    input.repositories.sourceRepository,
    sourceClaims
  );
  const sourceDecisionCountsByClaimId = await sourceDecisionCountsForClaims(
    input.repositories.sourceRepository,
    sourceClaims
  );
  const searchResults = await searchLexicalWithMarkerFallback(input, sourceQuery);
  const antiMemoryRecords = await input.repositories.memoryRepository.listAntiMemoryForProject(
    input.taskContract.projectId,
    input.limits.antiMemory
  );
  const antiMemoryCandidates =
    input.repositories.memoryRepository.listAntiMemoryCandidates === undefined
      ? []
      : await input.repositories.memoryRepository.listAntiMemoryCandidates(
          input.taskContract.projectId,
          input.limits.antiMemory
        );
  const memoryCandidates = rankCandidates(memoryRecords.map(toMemoryCandidate), memoryQuery);
  const sourceCandidates = rankCandidates(
    applySourceClaimEdgeRankDown(
      applySourceClaimEdgeInfluence(sourceClaims.map((claim) => {
        const sourceDecisionSupportCount = sourceDecisionCountsByClaimId.get(claim.id) ?? 0;
        const authorityAssessment = assessSourceClaimAuthority({
          claim,
          now: input.taskContract.updatedAt,
          sourceDecisionSupportCount
        });
        const sourceClaimReviewSignals = assessSourceClaimReviewSignals(claim, {
          now: input.taskContract.updatedAt,
          sourceDecisionCount: sourceDecisionSupportCount
        });
        const candidate = toSourceClaimCandidate(claim);

        return {
          ...candidate,
          sourceClaimAuthorityStatus: authorityAssessment.status,
          sourceClaimAuthorityReasons: authorityAssessment.reasons,
          sourceClaimReviewSignals,
          metadata: {
            ...candidate.metadata,
            sourceClaimAuthority: {
              status: authorityAssessment.status,
              reasons: authorityAssessment.reasons,
              caveats: authorityAssessment.caveats
            }
          }
        };
      }), {
        edges: sourceClaimEdges,
        seedSourceClaimIds: sourceClaims.map((claim) => claim.id)
      }),
      {
        edges: sourceClaimEdges,
        sourceClaims
      }
    ),
    sourceQuery
  );
  const searchCandidates = rankCandidates(searchResults.map(toSearchCandidate), sourceQuery);
  const ownerFileCandidates = rankCandidates(
    buildOwnerFileRecallCandidates(input.taskContract, {
      ...(input.targetReadModel === undefined ? {} : { targetReadModel: input.targetReadModel })
    }),
    sourceQuery
  );
  const candidates = applyPendingAntiMemoryReview(mergeActivationCandidates([
    ...memoryCandidates,
    ...sourceCandidates,
    ...searchCandidates,
    ...ownerFileCandidates
  ]), antiMemoryCandidates);

  return {
    memoryQuery,
    sourceQuery,
    candidates,
    antiMemoryRecords,
    antiMemoryCandidates,
    diagnostics: buildActivationRetrievalDiagnostics({
      projectScoped: true,
      memoryRecordCount: memoryRecords.length,
      sourceClaimCount: sourceClaims.length,
      searchResultCount: searchResults.length,
      ownerFileCandidateCount: ownerFileCandidates.length,
      antiMemoryRecordCount: antiMemoryRecords.length,
      mergedCandidateCount: candidates.length,
      targetReadModelStatus: input.targetReadModel === undefined ? "not_provided" : "provided",
      sourceSeedCount: input.targetReadModel?.sourceSeeds.length ?? 0,
      targetOwnerFileCount: input.targetReadModel?.ownerFiles?.length ?? 0,
      trustExclusionCount: input.targetReadModel?.trustExclusions.length ?? 0
    })
  };
};

export const persistActivationTrace = async (
  input: PersistActivationTraceInput
): Promise<void> => {
  const rawEvidenceRecallTriggers = buildTraceRawRecallTriggers(input);
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
  const candidateRecordIds = await persistRetrievalCandidates({
    retrievalRunId: input.retrievalRunId,
    candidates: input.candidates,
    includedIds,
    retrievalRepository: input.retrievalRepository
  });

  for (const inclusion of input.contextAssembly.inclusions) {
    const key = candidateKey(inclusion);
    await recordInclusionTraceDecision({
      retrievalRunId: input.retrievalRunId,
      contextAssemblyId: input.contextAssembly.id,
      inclusion,
      candidate: candidatesBySubject.get(key),
      retrievalCandidateId: candidateRecordIds.get(key),
      rawEvidenceRecallTrigger: rawEvidenceRecallTriggersBySubject.get(key),
      retrievalRepository: input.retrievalRepository
    });
  }

  for (const exclusion of input.contextAssembly.exclusions) {
    const key = candidateKey(exclusion);
    await recordExclusionTraceDecision({
      retrievalRunId: input.retrievalRunId,
      contextAssemblyId: input.contextAssembly.id,
      exclusion,
      candidate: candidatesBySubject.get(key),
      retrievalCandidateId: candidateRecordIds.get(key),
      activationAbstentionReason: input.contextAssembly.activationAbstention?.reason,
      retrievalRepository: input.retrievalRepository
    });
  }

  await completeActivationTraceRun({
    retrievalRunId: input.retrievalRunId,
    contextAssembly: input.contextAssembly,
    completedAt: input.completedAt,
    ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
    rawEvidenceRecallTriggers,
    retrievalRepository: input.retrievalRepository
  });
};
