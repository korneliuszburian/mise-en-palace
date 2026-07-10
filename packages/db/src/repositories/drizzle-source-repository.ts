import { and, desc, inArray, or, eq } from "drizzle-orm";
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
  isDecisionGradeSourceSupportType
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

interface SourceDecisionClaimContext {
  sourceClaim: SourceClaim;
  sourceArtifactProjectId: string | null;
}

const getSourceDecisionClaim = async (
  tx: KrnDatabaseTransaction,
  sourceClaimId: string | undefined
): Promise<SourceDecisionClaimContext | undefined> => {
  if (sourceClaimId === undefined) {
    return undefined;
  }

  const row = requireReturnedRow(
    await tx
      .select({
        sourceClaim: sourceClaims,
        sourceArtifactProjectId: sourceArtifacts.projectId
      })
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(eq(sourceClaims.id, sourceClaimId))
      .limit(1),
    "getSourceClaimForSourceDecision"
  );

  return {
    sourceClaim: mapSourceClaim(row.sourceClaim),
    sourceArtifactProjectId: row.sourceArtifactProjectId
  };
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

  return sourceArtifactProjectId ?? inputProjectId;
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

const canSourceDecisionSeedKnowledge = (
  projectId: ProjectId,
  source: SourceDecisionKnowledgeSource
): boolean =>
  source.sourceDecision.projectId === projectId &&
  source.sourceDecision.status === "adopt" &&
  source.sourceDecision.sourceClaimId === source.sourceClaim.id &&
  source.sourceClaim.status === "accepted" &&
  source.sourceDecisionEdge.sourceClaimId === source.sourceClaim.id &&
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
    "sourceClaimId" | "targetType" | "targetId" | "supportType" | "confidence" | "notes"
  >
): void => {
  requireText(input.sourceClaimId, "SourceDecisionEdge requires sourceClaimId");
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

  if (
    sourceClaimEdgeKindsRequiringSupportRef.has(input.kind) &&
    !hasText(input.metadata.evidenceRef) &&
    !hasText(input.metadata.sourceDecisionRef)
  ) {
    throw new Error(
      `SourceClaimEdge ${input.kind} requires metadata.evidenceRef or metadata.sourceDecisionRef`
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
          revisitWhen: row.revisitWhen
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

  async listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]> {
    const rows = await this.db
      .select(sourceClaimProjection)
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(eq(sourceArtifacts.projectId, projectId))
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
            metadata: input.metadata ?? {}
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
      .innerJoin(sourceDecisionEdges, eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id))
      .where(and(
        eq(sourceDecisions.projectId, projectId),
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
      .innerJoin(sourceRejections, eq(sourceRejections.sourceClaimId, sourceClaims.id))
      .where(and(
        eq(sourceDecisions.projectId, projectId),
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
      const fromSourceClaim = requireReturnedRow(
        await tx
          .select()
          .from(sourceClaims)
          .where(eq(sourceClaims.id, input.fromSourceClaimId))
          .limit(1),
        "getFromSourceClaimForSourceClaimEdge"
      );
      const toSourceClaim = requireReturnedRow(
        await tx
          .select()
          .from(sourceClaims)
          .where(eq(sourceClaims.id, input.toSourceClaimId))
          .limit(1),
        "getToSourceClaimForSourceClaimEdge"
      );

      assertSourceDecisionSourceClaimCanSupport(mapSourceClaim(fromSourceClaim));
      assertSourceDecisionSourceClaimCanSupport(mapSourceClaim(toSourceClaim));

      const row = requireReturnedRow(
        await tx
          .insert(sourceClaimEdges)
          .values({
            fromSourceClaimId: input.fromSourceClaimId,
            toSourceClaimId: input.toSourceClaimId,
            kind: input.kind,
            metadata: input.metadata
          })
          .returning(),
        "createSourceClaimEdge"
      );

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

  async createSourceDecisionEdge(
    input: CreateSourceDecisionEdgeInput
  ): Promise<SourceDecisionEdge> {
    assertSourceDecisionEdgeGovernance(input);

    return this.db.transaction(async (tx) => {
      const sourceClaim = requireReturnedRow(
        await tx
          .select()
          .from(sourceClaims)
          .where(eq(sourceClaims.id, input.sourceClaimId))
          .limit(1),
        "getSourceClaimForSourceDecisionEdge"
      );

      assertSourceDecisionSourceClaimCanSupport(mapSourceClaim(sourceClaim));

      const row = requireReturnedRow(
        await tx
          .insert(sourceDecisionEdges)
          .values({
            sourceClaimId: input.sourceClaimId,
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
      .select()
      .from(sourceDecisionEdges)
      .where(eq(sourceDecisionEdges.sourceClaimId, sourceClaimId));

    return rows.map(mapSourceDecisionEdge);
  }

  async listSourceDecisionEdgesForRun(
    executionRunId: ExecutionRunId
  ): Promise<SourceDecisionEdge[]> {
    const rows = await this.db
      .select({
        id: sourceDecisionEdges.id,
        sourceClaimId: sourceDecisionEdges.sourceClaimId,
        targetType: sourceDecisionEdges.targetType,
        targetId: sourceDecisionEdges.targetId,
        supportType: sourceDecisionEdges.supportType,
        confidence: sourceDecisionEdges.confidence,
        notes: sourceDecisionEdges.notes,
        metadata: sourceDecisionEdges.metadata,
        createdAt: sourceDecisionEdges.createdAt
      })
      .from(sourceDecisionEdges)
      .innerJoin(sourceClaims, eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id))
      .where(eq(sourceClaims.executionRunId, executionRunId));

    return rows.map(mapSourceDecisionEdge);
  }

  async createSourceRejection(input: CreateSourceRejectionInput): Promise<SourceRejection> {
    return this.db.transaction(async (tx) => {
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
