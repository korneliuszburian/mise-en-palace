import type {
  AntiMemoryRecord,
  ContextAssembly,
  TaskContract
} from "@krn/core";

import type {
  MemoryRepository,
  RetrievalRepository,
  SourceRepository
} from "../repositories/index.js";
import type {
  RecordActivationDecisionInput
} from "../repositories/retrievalRepository.js";
import {
  buildMemoryQuery
} from "./memoryQuery.js";
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
  ActivationQuery,
  RankedActivationCandidate
} from "./types.js";

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
}

const candidateKey = (candidate: { subjectType: string; subjectId: string }): string =>
  `${candidate.subjectType}:${candidate.subjectId}`;

const metadataValue = (
  metadata: Record<string, unknown>,
  key: string
): unknown => metadata[key];

const activationDecisionForExclusion = (
  candidate: RankedActivationCandidate | undefined
): RecordActivationDecisionInput["decision"] => {
  if (candidate?.metadata.conflictReason === "anti_memory_block") {
    return "conflict";
  }

  if (candidate?.exclusion?.reason === "stale") {
    return "stale";
  }

  return "excluded";
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

  return {
    memoryQuery,
    sourceQuery,
    candidates: mergeActivationCandidates([
      ...memoryCandidates,
      ...sourceCandidates,
      ...searchCandidates
    ]),
    antiMemoryRecords
  };
};

export const persistActivationTrace = async (
  input: PersistActivationTraceInput
): Promise<void> => {
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
    const searchDocumentId = metadataValue(candidate.metadata, "searchDocumentId");
    const record = await input.retrievalRepository.addCandidate({
      retrievalRunId: input.retrievalRunId,
      kind: candidate.kind,
      status: included ? "included" : "excluded",
      subjectType: candidate.subjectType,
      subjectId: candidate.subjectId,
      ...(typeof searchDocumentId === "string" ? { searchDocumentId } : {}),
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
      metadata: {
        expectedUse: inclusion.expectedUse
      }
    });
  }

  for (const exclusion of input.contextAssembly.exclusions) {
    const key = candidateKey(exclusion);
    const candidate = candidatesBySubject.get(key);
    const retrievalCandidateId = candidateRecordIds.get(key);
    const decision = activationDecisionForExclusion(candidate);

    await input.retrievalRepository.recordActivationDecision({
      retrievalRunId: input.retrievalRunId,
      ...(retrievalCandidateId === undefined ? {} : { retrievalCandidateId }),
      contextAssemblyId: input.contextAssembly.id,
      subjectType: exclusion.subjectType,
      subjectId: exclusion.subjectId,
      decision,
      reason: decision === "conflict" ? "anti_memory_block" : exclusion.reason,
      ...(exclusion.score === undefined ? {} : { score: exclusion.score }),
      metadata: {
        explanation: exclusion.explanation,
        ...(candidate?.metadata.conflictReason === undefined
          ? {}
          : { conflictReason: candidate.metadata.conflictReason }),
        ...(candidate?.metadata.antiMemoryRecordId === undefined
          ? {}
          : { antiMemoryRecordId: candidate.metadata.antiMemoryRecordId })
      }
    });
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
    metadata: {
      ...(input.metadata ?? {}),
      inclusionCount: input.contextAssembly.inclusions.length,
      exclusionCount: input.contextAssembly.exclusions.length
    }
  });
};
