import { and, asc, eq } from "drizzle-orm";
import type {
  ReflectionInput,
  ReflectionCandidateLink,
  ReflectionFinding,
  ReflectionOutput,
  ReflectionRecord,
  ReflectionScope,
  ReflectionStatus,
  ContradictionReport,
  GapReport
} from "@krn/core";

import type { KrnDatabase } from "../database.js";
import {
  reflectionRecords
} from "../schema/index.js";
import {
  metadataOrEmpty,
  requireReturnedRow,
  toIsoTimestamp
} from "./common.js";

export interface CreateReflectionRecordInput {
  scope: ReflectionScope;
  status?: ReflectionStatus;
  summary: string;
  input: ReflectionInput;
  output: ReflectionOutput;
  metadata?: Record<string, unknown>;
}

export interface ReflectionRecordScopeQuery {
  projectId: string;
  executionRunId?: string;
  taskContractId?: string;
  status?: ReflectionStatus;
  limit?: number;
}

type ReflectionRecordRow = typeof reflectionRecords.$inferSelect;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const stringListOrEmpty = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
);

const reflectionScopeOrFallback = (
  value: unknown,
  row: ReflectionRecordRow
): ReflectionScope => {
  const record = isRecord(value) ? value : {};
  const scope: ReflectionScope = {
    projectId: row.projectId
  };

  if (typeof record.executionRunId === "string") {
    scope.executionRunId = record.executionRunId;
  } else if (row.executionRunId !== null) {
    scope.executionRunId = row.executionRunId;
  }

  if (typeof record.taskContractId === "string") {
    scope.taskContractId = record.taskContractId;
  } else if (row.taskContractId !== null) {
    scope.taskContractId = row.taskContractId;
  }

  const observationGroupIds = stringListOrEmpty(record.observationGroupIds);

  if (observationGroupIds.length > 0) {
    scope.observationGroupIds = observationGroupIds;
  }

  return scope;
};

const reflectionInputOrFallback = (
  value: unknown,
  scope: ReflectionScope,
  createdAt: string
): ReflectionInput => {
  const record = isRecord(value) ? value : {};

  return {
    scope,
    observationItemIds: stringListOrEmpty(record.observationItemIds),
    sourceClaimIds: stringListOrEmpty(record.sourceClaimIds),
    antiMemoryKeys: stringListOrEmpty(record.antiMemoryKeys),
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : createdAt,
    metadata: metadataOrEmpty(record.metadata)
  };
};

const reflectionFindingsOrEmpty = (value: unknown): ReflectionFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionFinding[] => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.kind !== "string" ||
      typeof item.severity !== "string" ||
      typeof item.summary !== "string"
    ) {
      return [];
    }

    if (
      item.kind !== "candidate_signal" &&
      item.kind !== "contradiction" &&
      item.kind !== "gap" &&
      item.kind !== "risk" &&
      item.kind !== "correction" &&
      item.kind !== "policy_signal"
    ) {
      return [];
    }

    if (
      item.severity !== "low" &&
      item.severity !== "medium" &&
      item.severity !== "high" &&
      item.severity !== "critical"
    ) {
      return [];
    }

    return [{
      id: item.id,
      kind: item.kind,
      severity: item.severity,
      summary: item.summary,
      observationItemIds: stringListOrEmpty(item.observationItemIds),
      evidenceRefs: stringListOrEmpty(item.evidenceRefs),
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const contradictionsOrEmpty = (value: unknown): ContradictionReport[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ContradictionReport[] => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.summary !== "string" ||
      typeof item.severity !== "string"
    ) {
      return [];
    }

    if (
      item.severity !== "low" &&
      item.severity !== "medium" &&
      item.severity !== "high" &&
      item.severity !== "critical"
    ) {
      return [];
    }

    return [{
      id: item.id,
      summary: item.summary,
      observationItemIds: stringListOrEmpty(item.observationItemIds),
      conflictingClaims: stringListOrEmpty(item.conflictingClaims),
      evidenceRefs: stringListOrEmpty(item.evidenceRefs),
      severity: item.severity,
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const gapsOrEmpty = (value: unknown): GapReport[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): GapReport[] => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.summary !== "string" ||
      typeof item.missingEvidence !== "string" ||
      typeof item.severity !== "string"
    ) {
      return [];
    }

    if (
      item.severity !== "low" &&
      item.severity !== "medium" &&
      item.severity !== "high" &&
      item.severity !== "critical"
    ) {
      return [];
    }

    return [{
      id: item.id,
      summary: item.summary,
      missingEvidence: item.missingEvidence,
      observationItemIds: stringListOrEmpty(item.observationItemIds),
      severity: item.severity,
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const candidateLinksOrEmpty = (value: unknown): ReflectionCandidateLink[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionCandidateLink[] => {
    if (
      !isRecord(item) ||
      typeof item.targetType !== "string" ||
      typeof item.summary !== "string"
    ) {
      return [];
    }

    if (
      item.targetType !== "memory_candidate" &&
      item.targetType !== "source_claim_candidate" &&
      item.targetType !== "anti_memory_candidate" &&
      item.targetType !== "policy_candidate" &&
      item.targetType !== "eval_candidate"
    ) {
      return [];
    }

    return [{
      targetType: item.targetType,
      ...(typeof item.targetId === "string" ? { targetId: item.targetId } : {}),
      summary: item.summary,
      evidenceRefs: stringListOrEmpty(item.evidenceRefs)
    }];
  });
};

const reflectionOutputOrFallback = (
  value: unknown,
  scope: ReflectionScope,
  row: ReflectionRecordRow
): ReflectionOutput => {
  const record = isRecord(value) ? value : {};
  const id = typeof record.id === "string" ? record.id : row.id;

  return {
    id,
    scope,
    status: row.status,
    summary: typeof record.summary === "string" ? record.summary : row.summary,
    findings: reflectionFindingsOrEmpty(record.findings),
    contradictions: contradictionsOrEmpty(record.contradictions),
    gaps: gapsOrEmpty(record.gaps),
    candidateLinks: candidateLinksOrEmpty(record.candidateLinks),
    memoryCandidates: [],
    sourceClaimCandidates: [],
    antiMemoryCandidates: [],
    policyCandidates: [],
    evalCandidates: [],
    metadata: metadataOrEmpty(record.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

const mapReflectionRecord = (row: ReflectionRecordRow): ReflectionRecord => {
  const scope = reflectionScopeOrFallback(row.scope, row);

  return {
    id: row.id,
    scope,
    status: row.status,
    summary: row.summary,
    input: reflectionInputOrFallback(row.input, scope, toIsoTimestamp(row.createdAt)),
    output: reflectionOutputOrFallback(row.output, scope, row),
    metadata: metadataOrEmpty(row.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

export class DrizzleReflectionRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createReflectionRecord(input: CreateReflectionRecordInput): Promise<ReflectionRecord> {
    const scopeJson: Record<string, unknown> = { ...input.scope };
    const inputJson: Record<string, unknown> = { ...input.input };
    const outputJson: Record<string, unknown> = { ...input.output };
    const row = requireReturnedRow(
      await this.db
        .insert(reflectionRecords)
        .values({
          projectId: input.scope.projectId,
          ...(input.scope.executionRunId === undefined
            ? {}
            : { executionRunId: input.scope.executionRunId }),
          ...(input.scope.taskContractId === undefined
            ? {}
            : { taskContractId: input.scope.taskContractId }),
          status: input.status ?? "candidate",
          summary: input.summary,
          scope: scopeJson,
          input: inputJson,
          output: outputJson,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createReflectionRecord"
    );

    return mapReflectionRecord(row);
  }

  async getReflectionRecordById(id: string): Promise<ReflectionRecord | undefined> {
    const row = await this.db.query.reflectionRecords.findFirst({
      where: eq(reflectionRecords.id, id)
    });

    return row === undefined ? undefined : mapReflectionRecord(row);
  }

  async listReflectionRecordsByScope(
    input: ReflectionRecordScopeQuery
  ): Promise<ReflectionRecord[]> {
    const predicates = [eq(reflectionRecords.projectId, input.projectId)];

    if (input.executionRunId !== undefined) {
      predicates.push(eq(reflectionRecords.executionRunId, input.executionRunId));
    }

    if (input.taskContractId !== undefined) {
      predicates.push(eq(reflectionRecords.taskContractId, input.taskContractId));
    }

    if (input.status !== undefined) {
      predicates.push(eq(reflectionRecords.status, input.status));
    }

    const rows = await this.db.query.reflectionRecords.findMany({
      where: and(...predicates),
      orderBy: asc(reflectionRecords.createdAt),
      ...(input.limit === undefined ? {} : { limit: input.limit })
    });

    return rows.map(mapReflectionRecord);
  }
}
