import { and, asc, desc, eq, inArray, not, or, sql } from "drizzle-orm";
import type {
  ExecutionRunId,
  ProjectId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeKind,
  SourceClaimLifecycleStatus,
  SourceDecision,
  SourceDecisionEdge,
  SourceDecisionStatus,
  SourceSupportType,
  SourceRejection
} from "@krn/core";
import {
  assessSourceDecisionReviewSignals,
  decisionGradeSourceSupportTypes,
  isIsoTimestamp,
  isDecisionGradeSourceSupportType,
  rankSourceAuthority as rankCanonicalSourceAuthority
} from "@krn/core";
import type {
  CreateSourceArtifactInput,
  CreateSourceChunkInput,
  CreateSourceClaimEdgeInput,
  CreateSourceClaimInput,
  DeprecateSourceClaimInput,
  CreateSourceDecisionInput,
  CreateSourceDecisionEdgeInput,
  CreateSourceRejectionInput,
  RejectedSourceDecisionKnowledgeSource,
  SourceArtifactRecord,
  SourceChunkRecord,
  SourceDecisionKnowledgeSource,
  SourceClaimSelectionOptions,
  SourceRepository
} from "@krn/core/repositories/internal";

import type { KrnDatabase, KrnDatabaseTransaction } from "../database.js";
import {
  outboxEvents,
  sourceArtifacts,
  sourceChunks,
  sourceClaimEdges,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  sourceRejections
} from "../schema/index.js";
import { requireReturnedRow } from "./repository-value-readers.js";
import {
  mapSourceArtifact,
  mapSourceChunk,
  mapSourceClaim,
  mapSourceClaimEdge,
  mapSourceDecision,
  mapSourceDecisionEdge,
  mapSourceRejection
} from "./mappers.js";

export {
  assessSourceClaimOverride,
  isSourceClaimTemporallyValid,
  rankSourceAuthority
} from "@krn/core";
export type {
  SourceClaimOverrideAssessment,
  SourceClaimOverrideClaim
} from "@krn/core";

const smokePayload = (metadata: Record<string, unknown> | undefined): Record<string, string> => {
  const smokeId = metadata?.smokeId;

  return typeof smokeId === "string" ? { smokeId } : {};
};

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

const requireText = (value: string | undefined, message: string): void => {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(message);
  }
};

const sourceClaimProjection = {
  id: sourceClaims.id,
  sourceArtifactId: sourceClaims.sourceArtifactId,
  sourceChunkId: sourceClaims.sourceChunkId,
  executionRunId: sourceClaims.executionRunId,
  claim: sourceClaims.claim,
  mechanism: sourceClaims.mechanism,
  krnImplication: sourceClaims.krnImplication,
  doesNotProve: sourceClaims.doesNotProve,
  sourceAuthority: sourceClaims.sourceAuthority,
  supportType: sourceClaims.supportType,
  consumer: sourceClaims.consumer,
  falsifier: sourceClaims.falsifier,
  revisitWhen: sourceClaims.revisitWhen,
  status: sourceClaims.status,
  metadata: sourceClaims.metadata,
  createdAt: sourceClaims.createdAt,
  updatedAt: sourceClaims.updatedAt
} as const;

const selectionDate = (value: string | undefined): Date | undefined => {
  if (value === undefined) {
    return new Date();
  }

  if (!isIsoTimestamp(value)) {
    return undefined;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
};

const normalizedSelectionTerms = (terms: readonly string[] | undefined): string[] => [...new Set(
  (terms ?? [])
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 0)
)];

const sourceSearchableText = () => sql`lower(concat_ws(' ',
  ${sourceClaims.claim},
  ${sourceClaims.mechanism},
  ${sourceClaims.krnImplication},
  ${sourceClaims.doesNotProve},
  ${sourceClaims.consumer},
  ${sourceClaims.falsifier}
))`;

const sourceRelevanceFilter = (
  terms: readonly string[],
  searchableText: ReturnType<typeof sourceSearchableText>
) => terms.length === 0
  ? undefined
  : or(...terms.map((term) => sql`strpos(${searchableText}, ${term}) > 0`));

const sourceRelevanceScore = (
  terms: readonly string[],
  searchableText: ReturnType<typeof sourceSearchableText>
) => terms.length === 0
  ? undefined
  : sql<number>`(${sql.join(
      terms.map((term) => sql`CASE WHEN strpos(${searchableText}, ${term}) > 0 THEN 1 ELSE 0 END`),
      sql` + `
    )})`;

const sourceLifecycleFilter = () => inArray(sourceClaims.status, ["proposed", "accepted"]);

const isoTimestampSqlPattern =
  "^(0[1-9][0-9]{2}|[1-9][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T"
  + "([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?"
  + "(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])$";
const isoTimestampTimezoneSuffixSqlPattern = "(Z|[+-][0-9]{2}:[0-9]{2})$";
const isoTimestampFractionBeyondMillisecondsSqlPattern = "(\\.[0-9]{3})[0-9]+$";
const isoTimestampMillisecondReplacement = "\\1";
const ecmaScriptTrimCharacters =
  "\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680"
  + "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A"
  + "\u2028\u2029\u202F\u205F\u3000\uFEFF";

const sourceTimestampIsValid = (value: ReturnType<typeof sql<string>>) => sql`(
  ${value} ~ ${isoTimestampSqlPattern}
  AND pg_input_is_valid(
    regexp_replace(
      regexp_replace(${value}, ${isoTimestampTimezoneSuffixSqlPattern}, ''),
      ${isoTimestampFractionBeyondMillisecondsSqlPattern},
      ${isoTimestampMillisecondReplacement}
    ),
    'timestamp without time zone'
  )
)`;

const sourceTimestampUtc = (value: ReturnType<typeof sql<string>>) => sql`(
  regexp_replace(
    regexp_replace(${value}, ${isoTimestampTimezoneSuffixSqlPattern}, ''),
    ${isoTimestampFractionBeyondMillisecondsSqlPattern},
    ${isoTimestampMillisecondReplacement}
  )::timestamp without time zone
  - CASE
      WHEN right(${value}, 1) = 'Z' THEN interval '0 minutes'
      ELSE make_interval(
        hours => substring(right(${value}, 6) from 2 for 2)::integer,
        mins => substring(right(${value}, 6) from 5 for 2)::integer
      ) * CASE WHEN left(right(${value}, 6), 1) = '-' THEN -1 ELSE 1 END
    END
)`;

const selectionNowUtc = (nowIso: string) =>
  sql`(${nowIso}::timestamp with time zone AT TIME ZONE 'UTC')`;

const sourceMetadataTimestampText = (field: string) =>
  sql<string>`btrim(${sourceClaims.metadata} ->> ${field}, ${ecmaScriptTrimCharacters})`;

const sourceMetadataTimestampIsValid = (field: string) => {
  const value = sourceMetadataTimestampText(field);

  return sql`CASE
    WHEN NOT (${sourceClaims.metadata} ? ${field}) THEN true
    WHEN jsonb_typeof(${sourceClaims.metadata} -> ${field}) <> 'string' THEN false
    ELSE ${sourceTimestampIsValid(value)}
  END`;
};

const sourceMetadataTimestampIsAfter = (field: string, nowIso: string) => {
  const value = sourceMetadataTimestampText(field);

  return sql`CASE
    WHEN NOT (${sourceClaims.metadata} ? ${field}) THEN false
    WHEN NOT (${sourceMetadataTimestampIsValid(field)}) THEN false
    ELSE ${sourceTimestampUtc(value)} > ${selectionNowUtc(nowIso)}
  END`;
};

const sourceMetadataTimestampIsAtOrBefore = (field: string, nowIso: string) => {
  const value = sourceMetadataTimestampText(field);

  return sql`CASE
    WHEN NOT (${sourceClaims.metadata} ? ${field}) THEN false
    WHEN NOT (${sourceMetadataTimestampIsValid(field)}) THEN false
    ELSE ${sourceTimestampUtc(value)} <= ${selectionNowUtc(nowIso)}
  END`;
};

const sourceRevisitTimestampIsValid = () => sql`CASE
  WHEN ${sourceClaims.revisitWhen} IS NULL THEN true
  ELSE ${sourceTimestampIsValid(sql<string>`${sourceClaims.revisitWhen}`)}
END`;

const sourceMetadataTemporalCurrent = (nowIso: string) => and(
  sourceMetadataTimestampIsValid("validFrom"),
  sourceMetadataTimestampIsValid("validUntil"),
  sourceMetadataTimestampIsValid("invalidatedAt"),
  not(sourceMetadataTimestampIsAfter("validFrom", nowIso)),
  not(sourceMetadataTimestampIsAtOrBefore("validUntil", nowIso)),
  not(sourceMetadataTimestampIsAtOrBefore("invalidatedAt", nowIso))
);

const sourceTemporalFilter = (nowIso: string) => and(
  sourceMetadataTemporalCurrent(nowIso),
  sql`CASE
    WHEN ${sourceClaims.revisitWhen} IS NULL THEN true
    WHEN NOT (${sourceRevisitTimestampIsValid()}) THEN false
    ELSE ${sourceTimestampUtc(sql<string>`${sourceClaims.revisitWhen}`)}
      > ${selectionNowUtc(nowIso)}
  END`
);

const sourceHistoricalWarningFilter = (nowIso: string) => {
  const metadataTimestampsValid = sql`(
    ${sourceMetadataTimestampIsValid("validFrom")}
    AND ${sourceMetadataTimestampIsValid("validUntil")}
    AND ${sourceMetadataTimestampIsValid("invalidatedAt")}
  )`;
  const metadataExpiredOrInvalidated = and(
    metadataTimestampsValid,
    not(sourceMetadataTimestampIsAfter("validFrom", nowIso)),
    or(
      sourceMetadataTimestampIsAtOrBefore("validUntil", nowIso),
      sourceMetadataTimestampIsAtOrBefore("invalidatedAt", nowIso)
    )
  );
  const revisitElapsedOrInvalid = and(
    sourceMetadataTemporalCurrent(nowIso),
    sql`${sourceClaims.revisitWhen} IS NOT NULL`,
    or(
      not(sourceRevisitTimestampIsValid()),
      sql`CASE
        WHEN NOT (${sourceRevisitTimestampIsValid()}) THEN false
        ELSE ${sourceTimestampUtc(sql<string>`${sourceClaims.revisitWhen}`)}
          <= ${selectionNowUtc(nowIso)}
      END`
    )
  );

  return or(
    inArray(sourceClaims.status, ["rejected", "deprecated"]),
    and(
      sourceLifecycleFilter(),
      or(
        not(metadataTimestampsValid),
        metadataExpiredOrInvalidated,
        revisitElapsedOrInvalid
      )
    )
  );
};

const sourceDecisionEdgeProjection = {
  id: sourceDecisionEdges.id,
  sourceClaimId: sourceDecisionEdges.sourceClaimId,
  sourceDecisionId: sourceDecisionEdges.sourceDecisionId,
  targetType: sourceDecisionEdges.targetType,
  targetId: sourceDecisionEdges.targetId,
  supportType: sourceDecisionEdges.supportType,
  confidence: sourceDecisionEdges.confidence,
  notes: sourceDecisionEdges.notes,
  metadata: sourceDecisionEdges.metadata,
  createdAt: sourceDecisionEdges.createdAt
} as const;

interface SourceDecisionClaimContext {
  sourceClaim: SourceClaim;
  sourceArtifactProjectId: string | null;
  sourceArtifactMetadata: Record<string, unknown>;
}

interface SourceClaimProjectContext extends SourceDecisionClaimContext {}

interface SourceDecisionEdgeContext {
  sourceClaim: SourceClaim;
  sourceDecision: SourceDecision;
  sourceArtifactProjectId: string | null;
  sourceArtifactMetadata: Record<string, unknown>;
}

const selectSourceClaimProjectRow = (
  tx: KrnDatabaseTransaction,
  sourceClaimId: string
) => tx
  .select({
    sourceClaim: sourceClaims,
    sourceArtifactProjectId: sourceArtifacts.projectId,
    sourceArtifactMetadata: sourceArtifacts.metadata
  })
  .from(sourceClaims)
  .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
  .where(eq(sourceClaims.id, sourceClaimId))
  .limit(1);

const getSourceDecisionClaim = async (
  tx: KrnDatabaseTransaction,
  sourceClaimId: string | undefined
): Promise<SourceDecisionClaimContext | undefined> => {
  if (sourceClaimId === undefined) {
    return undefined;
  }

  const row = requireReturnedRow(
    await selectSourceClaimProjectRow(tx, sourceClaimId).for("update"),
    "getSourceClaimForSourceDecision"
  );

  return {
    sourceClaim: mapSourceClaim(row.sourceClaim),
    sourceArtifactProjectId: row.sourceArtifactProjectId,
    sourceArtifactMetadata: row.sourceArtifactMetadata
  };
};

const getSourceClaimProjectContext = async (
  tx: KrnDatabaseTransaction,
  sourceClaimId: string,
  operation: string
): Promise<SourceClaimProjectContext> => {
  const row = requireReturnedRow(
    await selectSourceClaimProjectRow(tx, sourceClaimId),
    operation
  );

  return {
    sourceClaim: mapSourceClaim(row.sourceClaim),
    sourceArtifactProjectId: row.sourceArtifactProjectId,
    sourceArtifactMetadata: row.sourceArtifactMetadata
  };
};

const getSourceDecisionEdgeContext = async (
  tx: KrnDatabaseTransaction,
  input: Pick<CreateSourceDecisionEdgeInput, "sourceClaimId" | "sourceDecisionId">
): Promise<SourceDecisionEdgeContext> => {
  const row = requireReturnedRow(
    await tx
      .select({
        sourceClaim: sourceClaims,
        sourceDecision: sourceDecisions,
        sourceArtifactProjectId: sourceArtifacts.projectId,
        sourceArtifactMetadata: sourceArtifacts.metadata
      })
      .from(sourceDecisions)
      .innerJoin(sourceClaims, eq(sourceDecisions.sourceClaimId, sourceClaims.id))
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(and(
        eq(sourceDecisions.id, input.sourceDecisionId),
        eq(sourceClaims.id, input.sourceClaimId)
      ))
      .limit(1)
      .for("update"),
    "getSourceDecisionEdgeContext"
  );

  return {
    sourceClaim: mapSourceClaim(row.sourceClaim),
    sourceDecision: mapSourceDecision(row.sourceDecision),
    sourceArtifactProjectId: row.sourceArtifactProjectId,
    sourceArtifactMetadata: row.sourceArtifactMetadata
  };
};

interface CapturedCurrentEvidenceIdentity {
  readonly evidenceStatus: "captured";
  readonly evidenceContentHash: string;
  readonly evidenceFreshness: "current";
}

type EvidenceMetadataKey = keyof CapturedCurrentEvidenceIdentity;

const evidenceMetadataValue = (
  metadata: Record<string, unknown>,
  key: EvidenceMetadataKey
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
};

const capturedCurrentEvidenceError = (
  operation: string,
  sourceClaimId: string,
  detail: string
): Error => new Error(
  `${operation} requires coherent captured-current evidence for SourceClaim ${sourceClaimId}: ${detail}`
);

const resolveCapturedCurrentEvidenceIdentity = async (
  tx: KrnDatabaseTransaction,
  context: SourceDecisionClaimContext,
  operation: string
): Promise<CapturedCurrentEvidenceIdentity> => {
  const sourceChunkId = context.sourceClaim.sourceChunkId;

  if (sourceChunkId === undefined) {
    throw capturedCurrentEvidenceError(
      operation,
      context.sourceClaim.id,
      "sourceChunkId is missing"
    );
  }

  const sourceChunk = requireReturnedRow(
    await tx
      .select({
        id: sourceChunks.id,
        sourceArtifactId: sourceChunks.sourceArtifactId,
        metadata: sourceChunks.metadata
      })
      .from(sourceChunks)
      .where(eq(sourceChunks.id, sourceChunkId))
      .limit(1)
      .for("update"),
    "getCapturedCurrentSourceChunk"
  );

  if (sourceChunk.sourceArtifactId !== context.sourceClaim.sourceArtifactId) {
    throw capturedCurrentEvidenceError(
      operation,
      context.sourceClaim.id,
      `sourceChunkId ${sourceChunk.id} belongs to sourceArtifactId ${sourceChunk.sourceArtifactId}`
    );
  }

  const metadataSources = [
    ["SourceArtifact", context.sourceArtifactMetadata],
    ["SourceClaim", context.sourceClaim.metadata],
    ["SourceChunk", sourceChunk.metadata]
  ] as const;
  const evidenceContentHash = evidenceMetadataValue(
    context.sourceArtifactMetadata,
    "evidenceContentHash"
  );

  if (evidenceContentHash === undefined) {
    throw capturedCurrentEvidenceError(
      operation,
      context.sourceClaim.id,
      "SourceArtifact evidenceContentHash is missing"
    );
  }

  for (const [label, metadata] of metadataSources) {
    if (evidenceMetadataValue(metadata, "evidenceStatus") !== "captured") {
      throw capturedCurrentEvidenceError(
        operation,
        context.sourceClaim.id,
        `${label} evidenceStatus is not captured`
      );
    }

    if (evidenceMetadataValue(metadata, "evidenceFreshness") !== "current") {
      throw capturedCurrentEvidenceError(
        operation,
        context.sourceClaim.id,
        `${label} evidenceFreshness is not current`
      );
    }

    if (evidenceMetadataValue(metadata, "evidenceContentHash") !== evidenceContentHash) {
      throw capturedCurrentEvidenceError(
        operation,
        context.sourceClaim.id,
        `${label} evidenceContentHash does not match SourceArtifact`
      );
    }
  }

  return {
    evidenceStatus: "captured",
    evidenceContentHash,
    evidenceFreshness: "current"
  };
};

const sourceDecisionMetadataWithEvidence = (
  metadata: Record<string, unknown> | undefined,
  evidence: CapturedCurrentEvidenceIdentity,
  sourceClaimId: string
): Record<string, unknown> => {
  const inputMetadata = metadata ?? {};

  for (const key of Object.keys(evidence) as EvidenceMetadataKey[]) {
    if (
      inputMetadata[key] !== undefined &&
      evidenceMetadataValue(inputMetadata, key) !== evidence[key]
    ) {
      throw capturedCurrentEvidenceError(
        "SourceDecision adopt",
        sourceClaimId,
        `input ${key} conflicts with persisted evidence identity`
      );
    }
  }

  return { ...inputMetadata, ...evidence };
};

const assertSourceDecisionCarriesEvidence = (
  sourceDecision: SourceDecision,
  evidence: CapturedCurrentEvidenceIdentity,
  sourceClaimId: string
): void => {
  for (const key of Object.keys(evidence) as EvidenceMetadataKey[]) {
    if (evidenceMetadataValue(sourceDecision.metadata, key) !== evidence[key]) {
      throw capturedCurrentEvidenceError(
        "SourceDecisionEdge",
        sourceClaimId,
        `SourceDecision ${key} does not match persisted evidence identity`
      );
    }
  }
};

const resolveSourceDecisionProjectId = (
  inputProjectId: CreateSourceDecisionInput["projectId"],
  sourceArtifactProjectId: string | null | undefined
): CreateSourceDecisionInput["projectId"] => {
  if (
    sourceArtifactProjectId !== undefined &&
    inputProjectId !== undefined &&
    inputProjectId !== sourceArtifactProjectId
  ) {
    throw new Error(
      "SourceDecision projectId must match the SourceClaim source artifact project"
    );
  }

  if (sourceArtifactProjectId === null && inputProjectId !== undefined) {
    throw new Error(
      "SourceDecision projectId cannot be caller-invented for a project-less SourceArtifact"
    );
  }

  return sourceArtifactProjectId ?? inputProjectId;
};

const assertSameSourceProject = (
  leftProjectId: string | null,
  rightProjectId: string | null,
  label: string
): void => {
  if (
    leftProjectId === null ||
    rightProjectId === null ||
    leftProjectId !== rightProjectId
  ) {
    throw new Error(`${label} requires source records from the same project`);
  }
};

const assertSourceDecisionEdgeContext = (
  context: SourceDecisionEdgeContext
): void => {
  assertSourceDecisionSourceClaimCanSupport(context.sourceClaim);

  if (context.sourceDecision.status !== "adopt") {
    throw new Error(
      `SourceDecisionEdge requires adopted SourceDecision; current status ${context.sourceDecision.status}`
    );
  }

  if (context.sourceDecision.sourceClaimId !== context.sourceClaim.id) {
    throw new Error("SourceDecisionEdge requires SourceDecision and SourceClaim to match");
  }

  if (
    context.sourceDecision.projectId === undefined ||
    context.sourceArtifactProjectId === null ||
    context.sourceDecision.projectId !== context.sourceArtifactProjectId
  ) {
    throw new Error("SourceDecisionEdge requires SourceDecision and SourceClaim project to match");
  }
};

const requireLinkedSourceRejectionProject = (
  input: CreateSourceRejectionInput
): void => {
  if (
    (input.sourceArtifactId !== undefined || input.sourceClaimId !== undefined) &&
    input.projectId === undefined
  ) {
    throw new Error("SourceRejection projectId is required for linked source records");
  }
};

const assertSourceRejectionArtifactProject = async (
  tx: KrnDatabaseTransaction,
  input: CreateSourceRejectionInput
): Promise<void> => {
  if (input.sourceArtifactId === undefined) {
    return;
  }

  const artifact = requireReturnedRow(
    await tx
      .select({ projectId: sourceArtifacts.projectId })
      .from(sourceArtifacts)
      .where(eq(sourceArtifacts.id, input.sourceArtifactId))
      .limit(1),
    "getSourceArtifactForSourceRejection"
  );

  if (artifact.projectId !== input.projectId) {
    throw new Error("SourceRejection source artifact project does not match projectId");
  }
};

const assertSourceRejectionClaimProject = async (
  tx: KrnDatabaseTransaction,
  input: CreateSourceRejectionInput
): Promise<void> => {
  if (input.sourceClaimId === undefined) {
    return;
  }

  const claim = await getSourceClaimProjectContext(
    tx,
    input.sourceClaimId,
    "getSourceClaimForSourceRejection"
  );

  if (claim.sourceArtifactProjectId !== input.projectId) {
    throw new Error("SourceRejection source claim project does not match projectId");
  }

  if (
    input.sourceArtifactId !== undefined &&
    input.sourceArtifactId !== claim.sourceClaim.sourceArtifactId
  ) {
    throw new Error("SourceRejection source claim and source artifact do not match");
  }
};

const validateSourceRejectionReferences = async (
  tx: KrnDatabaseTransaction,
  input: CreateSourceRejectionInput
): Promise<void> => {
  requireLinkedSourceRejectionProject(input);
  await assertSourceRejectionArtifactProject(tx, input);
  await assertSourceRejectionClaimProject(tx, input);
};

const arbitrateSourceClaimTerminalReview = async (
  tx: KrnDatabaseTransaction,
  sourceClaimId: string | undefined,
  sourceClaimStatus: SourceClaimLifecycleStatus | undefined
): Promise<void> => {
  if (sourceClaimId === undefined || sourceClaimStatus === undefined) {
    return;
  }

  requireReturnedRow(
    await tx
      .update(sourceClaims)
      .set({
        status: sourceClaimStatus,
        updatedAt: new Date()
      })
      .where(and(
        eq(sourceClaims.id, sourceClaimId),
        eq(sourceClaims.status, "proposed")
      ))
      .returning({ id: sourceClaims.id }),
    "arbitrateSourceClaimTerminalReview"
  );
};

const assertDecisionGradeSupportType = (
  supportType: SourceSupportType,
  label: string
): void => {
  if (!isDecisionGradeSourceSupportType(supportType)) {
    throw new Error(`${label} supportType cannot be decorative`);
  }
};

const sourceClaimEdgeKindsRequiringSupportRef = new Set<SourceClaimEdgeKind>([
  "contradicts",
  "expires",
  "invalidates",
  "supersedes"
]);

const hasText = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

const hasTextList = (value: unknown): boolean =>
  Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim().length > 0);

const canSourceDecisionSeedKnowledge = (
  projectId: ProjectId,
  source: SourceDecisionKnowledgeSource
): boolean =>
  source.sourceDecision.projectId === projectId &&
  source.sourceDecision.status === "adopt" &&
  source.sourceDecision.sourceClaimId === source.sourceClaim.id &&
  source.sourceClaim.status === "accepted" &&
  source.sourceDecisionEdge.sourceClaimId === source.sourceClaim.id &&
  source.sourceDecisionEdge.sourceDecisionId === source.sourceDecision.id &&
  isDecisionGradeSourceSupportType(source.sourceDecisionEdge.supportType);

const canRejectedSourceDecisionSeedAntiMemory = (
  projectId: ProjectId,
  source: RejectedSourceDecisionKnowledgeSource
): boolean =>
  source.sourceDecision.projectId === projectId &&
  source.sourceDecision.status === "reject" &&
  source.sourceDecision.sourceClaimId === source.sourceClaim.id &&
  source.sourceClaim.status === "rejected" &&
  source.sourceRejection.projectId === projectId &&
  source.sourceRejection.sourceClaimId === source.sourceClaim.id;

export const throwOnBlockingSourceDecisionSignals = (
  sourceDecision: SourceDecision,
  sourceClaimStatus: SourceClaim["status"]
): void => {
  const signals = assessSourceDecisionReviewSignals(sourceDecision, { sourceClaimStatus });
  const blockingSignals = signals.filter((signal) => signal.severity === "blocking");

  if (blockingSignals.length > 0) {
    const reasons = blockingSignals.map((signal) => signal.reason).join("; ");

    throw new Error(`SourceDecision blocked by review signals: ${reasons}`);
  }
};

export const assertSourceClaimGovernance = (
  input: Pick<
    CreateSourceClaimInput,
    | "claim"
    | "mechanism"
    | "krnImplication"
    | "doesNotProve"
    | "sourceAuthority"
    | "supportType"
    | "consumer"
    | "falsifier"
  >
): void => {
  requireText(input.claim, "SourceClaim requires claim");
  requireText(input.mechanism, "SourceClaim requires mechanism");
  requireText(input.krnImplication, "SourceClaim requires krnImplication");
  requireText(input.doesNotProve, "SourceClaim requires doesNotProve");
  requireText(input.sourceAuthority, "SourceClaim requires sourceAuthority");
  requireText(input.consumer, "SourceClaim requires consumer");
  requireText(input.falsifier, "SourceClaim requires falsifier");
  assertDecisionGradeSupportType(input.supportType, "SourceClaim");
};

export const assertSourceDecisionGovernance = (
  input: Pick<
    CreateSourceDecisionInput,
    "status" | "decision" | "rationale" | "falsifier" | "consumer" | "sourceClaimId"
  >
): void => {
  requireText(input.decision, "SourceDecision requires decision");
  requireText(input.rationale, "SourceDecision requires rationale");
  requireText(input.falsifier, "SourceDecision requires falsifier");
  requireText(input.consumer, "SourceDecision requires consumer");

  const sourceClaimRequiredStatuses = new Set<SourceDecisionStatus>(["adopt", "reject"]);

  if (sourceClaimRequiredStatuses.has(input.status)) {
    requireText(input.sourceClaimId, `SourceDecision ${input.status} requires sourceClaimId`);
  }
};

export const assertSourceDecisionEdgeGovernance = (
  input: Pick<
    CreateSourceDecisionEdgeInput,
    | "sourceClaimId"
    | "sourceDecisionId"
    | "targetType"
    | "targetId"
    | "supportType"
    | "confidence"
    | "notes"
  >
): void => {
  requireText(input.sourceClaimId, "SourceDecisionEdge requires sourceClaimId");
  requireText(input.sourceDecisionId, "SourceDecisionEdge requires sourceDecisionId");
  requireText(input.targetType, "SourceDecisionEdge requires targetType");
  requireText(input.targetId, "SourceDecisionEdge requires targetId");
  requireText(input.confidence, "SourceDecisionEdge requires confidence");
  requireText(input.notes, "SourceDecisionEdge requires notes");
  assertDecisionGradeSupportType(input.supportType, "SourceDecisionEdge");
};

export const assertSourceDecisionSourceClaimCanSupport = (
  sourceClaim: Pick<SourceClaim, "id" | "status">
): void => {
  if (sourceClaim.status !== "accepted") {
    throw new Error(
      `SourceDecisionEdge requires accepted SourceClaim; current status ${sourceClaim.status}`
    );
  }
};

export const sourceClaimStatusForDecisionStatus = (
  status: SourceDecisionStatus
): SourceClaimLifecycleStatus | undefined => {
  switch (status) {
    case "adopt":
      return "accepted";
    case "reject":
      return "rejected";
    case "defer":
    case "lab_test":
      return undefined;
  }
};

export const assertSourceClaimEdgeGovernance = (
  input: Pick<
    CreateSourceClaimEdgeInput,
    "fromSourceClaimId" | "toSourceClaimId" | "kind" | "metadata"
  >
): void => {
  requireText(input.fromSourceClaimId, "SourceClaimEdge requires fromSourceClaimId");
  requireText(input.toSourceClaimId, "SourceClaimEdge requires toSourceClaimId");
  requireText(input.kind, "SourceClaimEdge requires kind");
  requireText(input.metadata.consumer, "SourceClaimEdge requires metadata.consumer");
  requireText(input.metadata.doesNotProve, "SourceClaimEdge requires metadata.doesNotProve");

  if (input.fromSourceClaimId === input.toSourceClaimId) {
    throw new Error("SourceClaimEdge requires distinct fromSourceClaimId and toSourceClaimId");
  }

  if (
    sourceClaimEdgeKindsRequiringSupportRef.has(input.kind) &&
    !hasText(input.metadata.evidenceRef) &&
    !hasText(input.metadata.sourceDecisionRef) &&
    !hasTextList(input.metadata.evidenceRefs)
  ) {
    throw new Error(
      `SourceClaimEdge ${input.kind} requires metadata.evidenceRef, metadata.evidenceRefs, or metadata.sourceDecisionRef`
    );
  }
};

const assertSourceClaimChunkOwnership = async (
  db: KrnDatabase | KrnDatabaseTransaction,
  input: Pick<CreateSourceClaimInput, "sourceArtifactId" | "sourceChunkId">
): Promise<void> => {
  if (input.sourceChunkId === undefined) {
    return;
  }

  const [sourceChunk] = await db
    .select({
      id: sourceChunks.id,
      sourceArtifactId: sourceChunks.sourceArtifactId
    })
    .from(sourceChunks)
    .where(eq(sourceChunks.id, input.sourceChunkId))
    .limit(1);

  if (sourceChunk === undefined) {
    throw new Error(`SourceClaim sourceChunkId ${input.sourceChunkId} was not found`);
  }

  if (sourceChunk.sourceArtifactId !== input.sourceArtifactId) {
    throw new Error(
      `SourceClaim sourceChunkId ${sourceChunk.id} belongs to sourceArtifactId `
      + `${sourceChunk.sourceArtifactId}; expected ${input.sourceArtifactId}`
    );
  }
};

const assertSourceClaimAuthorityWithinArtifact = async (
  db: KrnDatabase | KrnDatabaseTransaction,
  input: Pick<CreateSourceClaimInput, "sourceArtifactId" | "sourceAuthority">
): Promise<void> => {
  const [sourceArtifact] = await db
    .select({ sourceAuthority: sourceArtifacts.sourceAuthority })
    .from(sourceArtifacts)
    .where(eq(sourceArtifacts.id, input.sourceArtifactId))
    .limit(1);

  if (sourceArtifact === undefined) {
    throw new Error(`SourceClaim sourceArtifactId ${input.sourceArtifactId} was not found`);
  }

  if (
    rankCanonicalSourceAuthority(input.sourceAuthority) >
    rankCanonicalSourceAuthority(sourceArtifact.sourceAuthority)
  ) {
    throw new Error(
      `SourceClaim sourceAuthority ${input.sourceAuthority} exceeds SourceArtifact `
      + `sourceAuthority ${sourceArtifact.sourceAuthority}`
    );
  }
};

export class DrizzleSourceRepository implements SourceRepository {
  constructor(private readonly db: KrnDatabase | KrnDatabaseTransaction) {}

  async createSourceArtifact(input: CreateSourceArtifactInput): Promise<SourceArtifactRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(sourceArtifacts)
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          ...(input.importId === undefined ? {} : { importId: input.importId }),
          ...(input.importRowId === undefined ? {} : { importRowId: input.importRowId }),
          kind: input.kind,
          sourceAuthority: input.sourceAuthority,
          uri: input.uri,
          title: input.title,
          contentHash: input.contentHash,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createSourceArtifact"
    );

    return mapSourceArtifact(row);
  }

  async createSourceChunk(input: CreateSourceChunkInput): Promise<SourceChunkRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(sourceChunks)
        .values({
          sourceArtifactId: input.sourceArtifactId,
          ordinal: input.ordinal,
          ...(input.heading === undefined ? {} : { heading: input.heading }),
          content: input.content,
          ...(input.tokenCount === undefined ? {} : { tokenCount: input.tokenCount }),
          contentHash: input.contentHash,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createSourceChunk"
    );

    return mapSourceChunk(row);
  }

  async createSourceClaim(input: CreateSourceClaimInput): Promise<SourceClaim> {
    assertSourceClaimGovernance(input);
    await assertSourceClaimAuthorityWithinArtifact(this.db, input);
    await assertSourceClaimChunkOwnership(this.db, input);

    const row = requireReturnedRow(
      await this.db
        .insert(sourceClaims)
        .values({
          sourceArtifactId: input.sourceArtifactId,
          ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
          ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
          claim: input.claim,
          mechanism: input.mechanism,
          krnImplication: input.krnImplication,
          doesNotProve: input.doesNotProve,
          sourceAuthority: input.sourceAuthority,
          supportType: input.supportType,
          consumer: input.consumer,
          ...(input.falsifier === undefined ? {} : { falsifier: input.falsifier }),
          ...(input.revisitWhen === undefined ? {} : { revisitWhen: input.revisitWhen }),
          ...(input.status === undefined ? {} : { status: input.status }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createSourceClaim"
    );

    return mapSourceClaim(row);
  }

  async deprecateSourceClaim(input: DeprecateSourceClaimInput): Promise<SourceClaim> {
    requireText(input.revisitWhen, "DeprecateSourceClaim requires revisitWhen");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .update(sourceClaims)
          .set({
            status: "deprecated",
            revisitWhen: input.revisitWhen,
            updatedAt: new Date()
          })
          .where(and(
            eq(sourceClaims.id, input.sourceClaimId),
            inArray(sourceClaims.status, ["proposed", "accepted"])
          ))
          .returning(),
        "deprecateSourceClaim"
      );

      await tx.insert(outboxEvents).values({
        topic: "source.claim.deprecated",
        payload: {
          sourceClaimId: row.id,
          revisitWhen: row.revisitWhen,
          ...smokePayload(input.metadata)
        }
      });

      return mapSourceClaim(row);
    });
  }

  async getSourceClaimById(id: SourceClaim["id"]): Promise<SourceClaim | undefined> {
    const [row] = await this.db
      .select()
      .from(sourceClaims)
      .where(eq(sourceClaims.id, id))
      .limit(1);

    return row === undefined ? undefined : mapSourceClaim(row);
  }

  async getSourceClaimForProject(
    projectId: ProjectId,
    id: SourceClaim["id"]
  ): Promise<SourceClaim | undefined> {
    const [row] = await this.db
      .select(sourceClaimProjection)
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(and(eq(sourceClaims.id, id), eq(sourceArtifacts.projectId, projectId)))
      .limit(1);

    return row === undefined ? undefined : mapSourceClaim(row);
  }

  async listClaimsForProject(
    projectId: ProjectId,
    limit: number,
    options?: SourceClaimSelectionOptions
  ): Promise<SourceClaim[]> {
    const now = selectionDate(options?.now);
    if (now === undefined) {
      return [];
    }
    const nowIso = now.toISOString();

    const terms = normalizedSelectionTerms(options?.terms);
    const searchableText = sourceSearchableText();
    const relevanceFilter = sourceRelevanceFilter(terms, searchableText);
    const relevanceScore = sourceRelevanceScore(terms, searchableText);
    const rows = await this.db
      .select(sourceClaimProjection)
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(and(
        eq(sourceArtifacts.projectId, projectId),
        sourceLifecycleFilter(),
        relevanceFilter,
        sourceTemporalFilter(nowIso)
      ))
      .orderBy(
        ...(relevanceScore === undefined ? [] : [desc(relevanceScore)]),
        desc(sourceClaims.updatedAt),
        asc(sourceClaims.id)
      )
      .limit(limit);

    return rows.map(mapSourceClaim);
  }

  async listHistoricalClaimWarningsForProject(
    projectId: ProjectId,
    limit: number,
    options?: SourceClaimSelectionOptions
  ): Promise<SourceClaim[]> {
    const now = selectionDate(options?.now);
    if (now === undefined) {
      return [];
    }
    const nowIso = now.toISOString();
    const terms = normalizedSelectionTerms(options?.terms);
    const searchableText = sourceSearchableText();
    const relevanceFilter = sourceRelevanceFilter(terms, searchableText);
    const relevanceScore = sourceRelevanceScore(terms, searchableText);
    const rows = await this.db
      .select(sourceClaimProjection)
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(and(
        eq(sourceArtifacts.projectId, projectId),
        relevanceFilter,
        sourceHistoricalWarningFilter(nowIso)
      ))
      .orderBy(
        ...(relevanceScore === undefined ? [] : [desc(relevanceScore)]),
        desc(sourceClaims.updatedAt),
        asc(sourceClaims.id)
      )
      .limit(limit);

    return rows.map(mapSourceClaim);
  }

  async listSourceClaimsForRun(executionRunId: ExecutionRunId): Promise<SourceClaim[]> {
    const rows = await this.db
      .select()
      .from(sourceClaims)
      .where(eq(sourceClaims.executionRunId, executionRunId));

    return rows.map(mapSourceClaim);
  }

  async createSourceDecision(input: CreateSourceDecisionInput): Promise<SourceDecision> {
    assertSourceDecisionGovernance(input);

    return this.db.transaction(async (tx) => {
      const sourceClaimContext = await getSourceDecisionClaim(tx, input.sourceClaimId);
      const sourceClaimStatus = sourceClaimStatusForDecisionStatus(input.status);
      const projectId = resolveSourceDecisionProjectId(
        input.projectId,
        sourceClaimContext?.sourceArtifactProjectId
      );
      const decisionMetadata = input.status === "adopt" && sourceClaimContext !== undefined
        ? sourceDecisionMetadataWithEvidence(
            input.metadata,
            await resolveCapturedCurrentEvidenceIdentity(
              tx,
              sourceClaimContext,
              "SourceDecision adopt"
            ),
            sourceClaimContext.sourceClaim.id
          )
        : input.metadata ?? {};

      await arbitrateSourceClaimTerminalReview(tx, input.sourceClaimId, sourceClaimStatus);

      const row = requireReturnedRow(
        await tx
          .insert(sourceDecisions)
          .values({
            ...(projectId === undefined ? {} : { projectId }),
            ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
            status: input.status,
            decision: input.decision,
            rationale: input.rationale,
            falsifier: input.falsifier,
            consumer: input.consumer,
            metadata: decisionMetadata
          })
          .returning(),
        "createSourceDecision"
      );
      const sourceDecision = mapSourceDecision(row);

      if (sourceClaimContext !== undefined) {
        throwOnBlockingSourceDecisionSignals(
          sourceDecision,
          sourceClaimContext.sourceClaim.status
        );
      }

      await tx.insert(outboxEvents).values({
        topic: "source.decision.created",
        payload: {
          ...smokePayload(input.metadata),
          sourceDecisionId: row.id,
          projectId: row.projectId,
          sourceClaimId: row.sourceClaimId
        }
      });

      return mapSourceDecision(row);
    });
  }

  async getSourceDecisionById(id: SourceDecision["id"]): Promise<SourceDecision | undefined> {
    const [row] = await this.db
      .select()
      .from(sourceDecisions)
      .where(eq(sourceDecisions.id, id))
      .limit(1);

    return row === undefined ? undefined : mapSourceDecision(row);
  }

  async getSourceDecisionForProject(
    projectId: ProjectId,
    id: SourceDecision["id"]
  ): Promise<SourceDecision | undefined> {
    const [row] = await this.db
      .select()
      .from(sourceDecisions)
      .where(and(eq(sourceDecisions.id, id), eq(sourceDecisions.projectId, projectId)))
      .limit(1);

    return row === undefined ? undefined : mapSourceDecision(row);
  }

  async listSourceDecisionKnowledgeSources(
    projectId: ProjectId,
    limit: number
  ): Promise<SourceDecisionKnowledgeSource[]> {
    const rows = await this.db
      .select({
        sourceDecision: sourceDecisions,
        sourceClaim: sourceClaims,
        sourceDecisionEdge: sourceDecisionEdges
      })
      .from(sourceDecisions)
      .innerJoin(sourceClaims, eq(sourceDecisions.sourceClaimId, sourceClaims.id))
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .innerJoin(sourceDecisionEdges, and(
        eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id),
        eq(sourceDecisionEdges.sourceDecisionId, sourceDecisions.id)
      ))
      .where(and(
        eq(sourceDecisions.projectId, projectId),
        eq(sourceDecisions.projectId, sourceArtifacts.projectId),
        eq(sourceDecisions.status, "adopt"),
        eq(sourceClaims.status, "accepted"),
        inArray(sourceDecisionEdges.supportType, decisionGradeSourceSupportTypes)
      ))
      .orderBy(desc(sourceDecisions.createdAt), desc(sourceDecisionEdges.createdAt))
      .limit(limit);

    return rows
      .map((row) => ({
        sourceDecision: mapSourceDecision(row.sourceDecision),
        sourceClaim: mapSourceClaim(row.sourceClaim),
        sourceDecisionEdge: mapSourceDecisionEdge(row.sourceDecisionEdge)
      }))
      .filter((source) => canSourceDecisionSeedKnowledge(projectId, source));
  }

  async listRejectedSourceDecisionKnowledgeSources(
    projectId: ProjectId,
    limit: number
  ): Promise<RejectedSourceDecisionKnowledgeSource[]> {
    const rows = await this.db
      .select({
        sourceDecision: sourceDecisions,
        sourceClaim: sourceClaims,
        sourceRejection: sourceRejections
      })
      .from(sourceDecisions)
      .innerJoin(sourceClaims, eq(sourceDecisions.sourceClaimId, sourceClaims.id))
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .innerJoin(sourceRejections, eq(sourceRejections.sourceClaimId, sourceClaims.id))
      .where(and(
        eq(sourceDecisions.projectId, projectId),
        eq(sourceDecisions.projectId, sourceArtifacts.projectId),
        eq(sourceDecisions.status, "reject"),
        eq(sourceClaims.status, "rejected"),
        eq(sourceRejections.projectId, projectId)
      ))
      .orderBy(desc(sourceDecisions.createdAt), desc(sourceRejections.rejectedAt))
      .limit(limit);

    return rows
      .map((row) => ({
        sourceDecision: mapSourceDecision(row.sourceDecision),
        sourceClaim: mapSourceClaim(row.sourceClaim),
        sourceRejection: mapSourceRejection(row.sourceRejection)
      }))
      .filter((source) => canRejectedSourceDecisionSeedAntiMemory(projectId, source));
  }

  async createSourceClaimEdge(input: CreateSourceClaimEdgeInput): Promise<SourceClaimEdge> {
    assertSourceClaimEdgeGovernance(input);

    return this.db.transaction(async (tx) => {
      const fromSourceClaim = await getSourceClaimProjectContext(
        tx,
        input.fromSourceClaimId,
        "getFromSourceClaimForSourceClaimEdge"
      );
      const toSourceClaim = await getSourceClaimProjectContext(
        tx,
        input.toSourceClaimId,
        "getToSourceClaimForSourceClaimEdge"
      );

      assertSourceDecisionSourceClaimCanSupport(fromSourceClaim.sourceClaim);
      assertSourceDecisionSourceClaimCanSupport(toSourceClaim.sourceClaim);
      assertSameSourceProject(
        fromSourceClaim.sourceArtifactProjectId,
        toSourceClaim.sourceArtifactProjectId,
        "SourceClaimEdge"
      );

      const matchingEdges = await tx
        .select()
        .from(sourceClaimEdges)
        .where(and(
          eq(sourceClaimEdges.fromSourceClaimId, input.fromSourceClaimId),
          eq(sourceClaimEdges.toSourceClaimId, input.toSourceClaimId),
          eq(sourceClaimEdges.kind, input.kind)
        ))
        .orderBy(asc(sourceClaimEdges.createdAt), asc(sourceClaimEdges.id))
        .limit(2);

      if (matchingEdges.length > 1) {
        throw new Error("SourceClaimEdge semantic identity is ambiguous");
      }

      const existingEdge = matchingEdges[0];

      if (existingEdge !== undefined) {
        if (canonicalJson(existingEdge.metadata) !== canonicalJson(input.metadata)) {
          throw new Error("SourceClaimEdge semantic identity has conflicting metadata");
        }

        return mapSourceClaimEdge(existingEdge);
      }

      const [row] = await tx
        .insert(sourceClaimEdges)
        .values({
          fromSourceClaimId: input.fromSourceClaimId,
          toSourceClaimId: input.toSourceClaimId,
          kind: input.kind,
          metadata: input.metadata
        })
        .onConflictDoNothing({
          target: [
            sourceClaimEdges.fromSourceClaimId,
            sourceClaimEdges.toSourceClaimId,
            sourceClaimEdges.kind
          ]
        })
        .returning();

      if (row === undefined) {
        const [concurrentEdge] = await tx
          .select()
          .from(sourceClaimEdges)
          .where(and(
            eq(sourceClaimEdges.fromSourceClaimId, input.fromSourceClaimId),
            eq(sourceClaimEdges.toSourceClaimId, input.toSourceClaimId),
            eq(sourceClaimEdges.kind, input.kind)
          ))
          .limit(1);

        if (concurrentEdge === undefined) {
          throw new Error("SourceClaimEdge concurrent semantic identity was not found");
        }
        if (canonicalJson(concurrentEdge.metadata) !== canonicalJson(input.metadata)) {
          throw new Error("SourceClaimEdge semantic identity has conflicting metadata");
        }

        return mapSourceClaimEdge(concurrentEdge);
      }

      await tx.insert(outboxEvents).values({
        topic: "source.claim_edge.created",
        payload: {
          ...smokePayload(input.metadata),
          sourceClaimEdgeId: row.id,
          fromSourceClaimId: row.fromSourceClaimId,
          toSourceClaimId: row.toSourceClaimId,
          kind: row.kind
        }
      });

      return mapSourceClaimEdge(row);
    });
  }

  async listSourceClaimEdgesForClaim(sourceClaimId: SourceClaim["id"]): Promise<SourceClaimEdge[]> {
    const rows = await this.db
      .select()
      .from(sourceClaimEdges)
      .where(or(
        eq(sourceClaimEdges.fromSourceClaimId, sourceClaimId),
        eq(sourceClaimEdges.toSourceClaimId, sourceClaimId)
      ));

    return rows.map(mapSourceClaimEdge);
  }

  async listSourceClaimEdgesForProject(
    projectId: ProjectId,
    sourceClaimId: SourceClaim["id"]
  ): Promise<SourceClaimEdge[]> {
    const sourceClaimsForProject = this.db
      .select({ id: sourceClaims.id })
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(eq(sourceArtifacts.projectId, projectId));
    const rows = await this.db
      .select()
      .from(sourceClaimEdges)
      .where(and(
        or(
          eq(sourceClaimEdges.fromSourceClaimId, sourceClaimId),
          eq(sourceClaimEdges.toSourceClaimId, sourceClaimId)
        ),
        inArray(sourceClaimEdges.fromSourceClaimId, sourceClaimsForProject),
        inArray(sourceClaimEdges.toSourceClaimId, sourceClaimsForProject)
      ));

    return rows.map(mapSourceClaimEdge);
  }

  async createSourceDecisionEdge(
    input: CreateSourceDecisionEdgeInput
  ): Promise<SourceDecisionEdge> {
    assertSourceDecisionEdgeGovernance(input);

    return this.db.transaction(async (tx) => {
      const context = await getSourceDecisionEdgeContext(tx, input);
      assertSourceDecisionEdgeContext(context);
      const evidence = await resolveCapturedCurrentEvidenceIdentity(
        tx,
        context,
        "SourceDecisionEdge"
      );
      assertSourceDecisionCarriesEvidence(
        context.sourceDecision,
        evidence,
        context.sourceClaim.id
      );

      const row = requireReturnedRow(
        await tx
          .insert(sourceDecisionEdges)
          .values({
            sourceClaimId: input.sourceClaimId,
            sourceDecisionId: input.sourceDecisionId,
            targetType: input.targetType,
            targetId: input.targetId,
            supportType: input.supportType,
            confidence: input.confidence,
            notes: input.notes,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createSourceDecisionEdge"
      );

      await tx.insert(outboxEvents).values({
        topic: "source.decision_edge.created",
        payload: {
          ...smokePayload(input.metadata),
          sourceDecisionEdgeId: row.id,
          sourceClaimId: row.sourceClaimId,
          sourceDecisionId: row.sourceDecisionId,
          targetType: row.targetType,
          targetId: row.targetId
        }
      });

      return mapSourceDecisionEdge(row);
    });
  }

  async getSourceDecisionEdgeById(
    id: SourceDecisionEdge["id"]
  ): Promise<SourceDecisionEdge | undefined> {
    const [row] = await this.db
      .select()
      .from(sourceDecisionEdges)
      .where(eq(sourceDecisionEdges.id, id))
      .limit(1);

    return row === undefined ? undefined : mapSourceDecisionEdge(row);
  }

  async listSourceDecisionEdgesForClaim(
    sourceClaimId: SourceDecisionEdge["sourceClaimId"]
  ): Promise<SourceDecisionEdge[]> {
    const rows = await this.db
      .select(sourceDecisionEdgeProjection)
      .from(sourceDecisionEdges)
      .innerJoin(sourceDecisions, eq(sourceDecisionEdges.sourceDecisionId, sourceDecisions.id))
      .innerJoin(sourceClaims, eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id))
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(and(
        eq(sourceDecisionEdges.sourceClaimId, sourceClaimId),
        eq(sourceDecisionEdges.sourceDecisionId, sourceDecisions.id),
        eq(sourceDecisions.sourceClaimId, sourceClaims.id),
        eq(sourceDecisions.status, "adopt"),
        eq(sourceClaims.status, "accepted"),
        eq(sourceDecisions.projectId, sourceArtifacts.projectId)
      ));

    return rows.map(mapSourceDecisionEdge);
  }

  async listSourceDecisionsForClaim(
    sourceClaimId: SourceDecisionEdge["sourceClaimId"]
  ): Promise<SourceDecision[]> {
    const rows = await this.db
      .select()
      .from(sourceDecisions)
      .where(eq(sourceDecisions.sourceClaimId, sourceClaimId));

    return rows.map(mapSourceDecision);
  }

  async listSourceDecisionEdgesForRun(
    executionRunId: ExecutionRunId
  ): Promise<SourceDecisionEdge[]> {
    const rows = await this.db
      .select(sourceDecisionEdgeProjection)
      .from(sourceDecisionEdges)
      .innerJoin(sourceClaims, eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id))
      .where(eq(sourceClaims.executionRunId, executionRunId));

    return rows.map(mapSourceDecisionEdge);
  }

  async createSourceRejection(input: CreateSourceRejectionInput): Promise<SourceRejection> {
    return this.db.transaction(async (tx) => {
      await validateSourceRejectionReferences(tx, input);

      const row = requireReturnedRow(
        await tx
          .insert(sourceRejections)
          .values({
            ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
            ...(input.executionRunId === undefined
              ? {}
              : { executionRunId: input.executionRunId }),
            ...(input.sourceArtifactId === undefined
              ? {}
              : { sourceArtifactId: input.sourceArtifactId }),
            ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
            title: input.title,
            attemptedClaim: input.attemptedClaim,
            rejectedBecause: input.rejectedBecause,
            reason: input.reason,
            doesNotProve: input.doesNotProve,
            consumer: input.consumer,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createSourceRejection"
      );

      await tx.insert(outboxEvents).values({
        topic: "source.rejection.created",
        payload: {
          ...smokePayload(input.metadata),
          sourceRejectionId: row.id,
          projectId: row.projectId,
          executionRunId: row.executionRunId,
          rejectedBecause: row.rejectedBecause
        }
      });

      return mapSourceRejection(row);
    });
  }

  async listSourceRejectionsForClaim(sourceClaimId: SourceClaim["id"]): Promise<SourceRejection[]> {
    const rows = await this.db
      .select()
      .from(sourceRejections)
      .where(eq(sourceRejections.sourceClaimId, sourceClaimId));

    return rows.map(mapSourceRejection);
  }
}
