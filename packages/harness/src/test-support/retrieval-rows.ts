import type {
  AddRetrievalCandidateInput,
  StartRetrievalRunInput,
  RetrievalCandidateRecord,
  RetrievalRunRecord
} from "@krn/core/repositories/internal";

const assignIfDefined = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K]
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};

export const createRetrievalRunRecord = (
  input: StartRetrievalRunInput,
  options: {
    id?: string;
    now: string;
  }
): RetrievalRunRecord => {
  const record: RetrievalRunRecord = {
    id: options.id ?? "retrieval-1",
    status: "running",
    query: input.query,
    mode: input.mode ?? "mixed",
    metadataFilters: input.metadataFilters ?? {},
    startedAt: options.now,
    metadata: input.metadata ?? {},
    createdAt: options.now
  };

  assignIfDefined(record, "projectId", input.projectId);
  assignIfDefined(record, "executionRunId", input.executionRunId);
  assignIfDefined(record, "taskContractId", input.taskContractId);
  assignIfDefined(record, "budget", input.budget);
  assignIfDefined(record, "tokenBudget", input.tokenBudget);

  return record;
};

export const createRetrievalCandidateRecord = (
  input: AddRetrievalCandidateInput,
  options: {
    id: string;
    now: string;
  }
): RetrievalCandidateRecord => {
  const record: RetrievalCandidateRecord = {
    id: options.id,
    retrievalRunId: input.retrievalRunId,
    kind: input.kind,
    status: input.status ?? "candidate",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    sourceAuthority: input.sourceAuthority,
    reason: input.reason,
    metadata: input.metadata ?? {},
    createdAt: options.now
  };

  assignIfDefined(record, "searchDocumentId", input.searchDocumentId);
  assignIfDefined(record, "lexicalScore", input.lexicalScore);
  assignIfDefined(record, "vectorScore", input.vectorScore);
  assignIfDefined(record, "graphScore", input.graphScore);
  assignIfDefined(record, "temporalScore", input.temporalScore);
  assignIfDefined(record, "contextRoiScore", input.contextRoiScore);
  assignIfDefined(record, "totalScore", input.totalScore);
  assignIfDefined(record, "score", input.score);

  return record;
};
