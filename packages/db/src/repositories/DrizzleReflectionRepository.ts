import { and, asc, eq } from "drizzle-orm";
import type {
  ReflectionInput,
  ReflectionAntiMemoryCandidateProposal,
  ReflectionCandidateEvidence,
  ReflectionCandidateLink,
  ReflectionEvalCandidateProposal,
  ReflectionFinding,
  ReflectionMemoryCandidateProposal,
  ReflectionOutput,
  ReflectionPolicyCandidateProposal,
  ReflectionRecord,
  ReflectionScope,
  ReflectionSourceClaimCandidateProposal,
  ReflectionStatus,
  ContradictionReport,
  GapReport,
  SourceLineageRef
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

const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const numberOrUndefined = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const booleanOrUndefined = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const reflectionCandidateEvidenceProvenances = new Set<string>([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log",
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note",
  "source_claim"
]);

const memoryKinds = new Set<string>([
  "fact",
  "preference",
  "constraint",
  "procedure",
  "pattern",
  "risk"
]);

const sourceTrustTiers = new Set<string>([
  "high",
  "medium",
  "low",
  "primary",
  "official",
  "project-decision",
  "source-code",
  "paper",
  "practitioner",
  "secondary",
  "hypothesis"
]);

const sourceSupportTypes = new Set<string>([
  "supports",
  "contradicts",
  "qualifies",
  "background",
  "does_not_support",
  "mechanism",
  "decision",
  "risk",
  "rejection",
  "eval-design",
  "implementation-boundary"
]);

const sourceLineageOrEmpty = (value: unknown): SourceLineageRef[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): SourceLineageRef[] => {
    if (!isRecord(item) || typeof item.sourceId !== "string") {
      return [];
    }

    return [{
      sourceId: item.sourceId,
      ...(typeof item.note === "string" ? { note: item.note } : {})
    }];
  });
};

const reflectionCandidateEvidenceOrUndefined = (
  value: unknown
): ReflectionCandidateEvidence | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const provenance = stringOrUndefined(value.provenance);
  const doesNotProve = stringOrUndefined(value.doesNotProve);

  if (
    provenance === undefined ||
    !reflectionCandidateEvidenceProvenances.has(provenance) ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    provenance: provenance as ReflectionCandidateEvidence["provenance"],
    evidenceRefs: stringListOrEmpty(value.evidenceRefs),
    doesNotProve
  };
};

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

const reflectionMemoryCandidatesOrEmpty = (
  value: unknown
): ReflectionMemoryCandidateProposal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionMemoryCandidateProposal[] => {
    if (!isRecord(item)) {
      return [];
    }

    const kind = stringOrUndefined(item.kind);
    const summary = stringOrUndefined(item.summary);
    const body = stringOrUndefined(item.body);
    const owner = stringOrUndefined(item.owner);
    const confidence = numberOrUndefined(item.confidence);
    const applicationGuidance = stringOrUndefined(item.applicationGuidance);
    const isUserPreference = booleanOrUndefined(item.isUserPreference);
    const validFrom = stringOrUndefined(item.validFrom);
    const evidence = reflectionCandidateEvidenceOrUndefined(item.evidence);

    if (
      kind === undefined ||
      !memoryKinds.has(kind) ||
      summary === undefined ||
      body === undefined ||
      owner === undefined ||
      confidence === undefined ||
      applicationGuidance === undefined ||
      isUserPreference === undefined ||
      validFrom === undefined ||
      evidence === undefined
    ) {
      return [];
    }

    return [{
      kind: kind as ReflectionMemoryCandidateProposal["kind"],
      summary,
      body,
      owner,
      confidence,
      applicationGuidance,
      ...(typeof item.invalidationRule === "string" ? { invalidationRule: item.invalidationRule } : {}),
      sourceClaimIds: stringListOrEmpty(item.sourceClaimIds),
      sourceLineage: sourceLineageOrEmpty(item.sourceLineage),
      isUserPreference,
      validFrom,
      ...(typeof item.validUntil === "string" ? { validUntil: item.validUntil } : {}),
      evidence,
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const reflectionSourceClaimCandidatesOrEmpty = (
  value: unknown
): ReflectionSourceClaimCandidateProposal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionSourceClaimCandidateProposal[] => {
    if (!isRecord(item)) {
      return [];
    }

    const claim = stringOrUndefined(item.claim);
    const mechanism = stringOrUndefined(item.mechanism);
    const krnImplication = stringOrUndefined(item.krnImplication);
    const doesNotProve = stringOrUndefined(item.doesNotProve);
    const trustTier = stringOrUndefined(item.trustTier);
    const supportType = stringOrUndefined(item.supportType);
    const consumer = stringOrUndefined(item.consumer);
    const evidence = reflectionCandidateEvidenceOrUndefined(item.evidence);

    if (
      claim === undefined ||
      mechanism === undefined ||
      krnImplication === undefined ||
      doesNotProve === undefined ||
      trustTier === undefined ||
      !sourceTrustTiers.has(trustTier) ||
      supportType === undefined ||
      !sourceSupportTypes.has(supportType) ||
      consumer === undefined ||
      evidence === undefined
    ) {
      return [];
    }

    return [{
      claim,
      mechanism,
      krnImplication,
      doesNotProve,
      trustTier: trustTier as ReflectionSourceClaimCandidateProposal["trustTier"],
      supportType: supportType as ReflectionSourceClaimCandidateProposal["supportType"],
      consumer,
      ...(typeof item.falsifier === "string" ? { falsifier: item.falsifier } : {}),
      ...(typeof item.revisitWhen === "string" ? { revisitWhen: item.revisitWhen } : {}),
      evidence,
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const reflectionAntiMemoryCandidatesOrEmpty = (
  value: unknown
): ReflectionAntiMemoryCandidateProposal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionAntiMemoryCandidateProposal[] => {
    if (!isRecord(item)) {
      return [];
    }

    const key = stringOrUndefined(item.key);
    const summary = stringOrUndefined(item.summary);
    const body = stringOrUndefined(item.body);
    const owner = stringOrUndefined(item.owner);
    const confidence = numberOrUndefined(item.confidence);
    const evidence = reflectionCandidateEvidenceOrUndefined(item.evidence);

    if (
      key === undefined ||
      summary === undefined ||
      body === undefined ||
      owner === undefined ||
      confidence === undefined ||
      evidence === undefined
    ) {
      return [];
    }

    return [{
      key,
      summary,
      body,
      owner,
      confidence,
      ...(typeof item.reason === "string" ? { reason: item.reason } : {}),
      invalidatedBySourceClaimIds: stringListOrEmpty(item.invalidatedBySourceClaimIds),
      ...(typeof item.appliesTo === "string" ? { appliesTo: item.appliesTo } : {}),
      ...(typeof item.mayRevisitWhen === "string" ? { mayRevisitWhen: item.mayRevisitWhen } : {}),
      sourceLineage: sourceLineageOrEmpty(item.sourceLineage),
      evidence,
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const reflectionPolicyCandidatesOrEmpty = (
  value: unknown
): ReflectionPolicyCandidateProposal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionPolicyCandidateProposal[] => {
    if (!isRecord(item)) {
      return [];
    }

    const key = stringOrUndefined(item.key);
    const summary = stringOrUndefined(item.summary);
    const rationale = stringOrUndefined(item.rationale);
    const evidence = reflectionCandidateEvidenceOrUndefined(item.evidence);

    if (
      key === undefined ||
      summary === undefined ||
      rationale === undefined ||
      evidence === undefined
    ) {
      return [];
    }

    return [{
      key,
      summary,
      rationale,
      evidenceRefs: stringListOrEmpty(item.evidenceRefs),
      evidence,
      metadata: metadataOrEmpty(item.metadata)
    }];
  });
};

const reflectionEvalCandidatesOrEmpty = (
  value: unknown
): ReflectionEvalCandidateProposal[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ReflectionEvalCandidateProposal[] => {
    if (!isRecord(item)) {
      return [];
    }

    const title = stringOrUndefined(item.title);
    const scenario = stringOrUndefined(item.scenario);
    const expectedSignal = stringOrUndefined(item.expectedSignal);
    const evidence = reflectionCandidateEvidenceOrUndefined(item.evidence);

    if (
      title === undefined ||
      scenario === undefined ||
      expectedSignal === undefined ||
      evidence === undefined
    ) {
      return [];
    }

    return [{
      title,
      scenario,
      expectedSignal,
      sourceEvidence: stringListOrEmpty(item.sourceEvidence),
      evidence,
      metadata: metadataOrEmpty(item.metadata)
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
    memoryCandidates: reflectionMemoryCandidatesOrEmpty(record.memoryCandidates),
    sourceClaimCandidates: reflectionSourceClaimCandidatesOrEmpty(record.sourceClaimCandidates),
    antiMemoryCandidates: reflectionAntiMemoryCandidatesOrEmpty(record.antiMemoryCandidates),
    policyCandidates: reflectionPolicyCandidatesOrEmpty(record.policyCandidates),
    evalCandidates: reflectionEvalCandidatesOrEmpty(record.evalCandidates),
    metadata: metadataOrEmpty(record.metadata),
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt)
  };
};

export const mapReflectionRecordForRead = (row: ReflectionRecordRow): ReflectionRecord => {
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

    return mapReflectionRecordForRead(row);
  }

  async getReflectionRecordById(id: string): Promise<ReflectionRecord | undefined> {
    const row = await this.db.query.reflectionRecords.findFirst({
      where: eq(reflectionRecords.id, id)
    });

    return row === undefined ? undefined : mapReflectionRecordForRead(row);
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

    return rows.map(mapReflectionRecordForRead);
  }
}
