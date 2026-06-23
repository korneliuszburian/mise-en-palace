import { eq } from "drizzle-orm";
import type {
  ExecutionRunId,
  ProjectId,
  SourceClaim,
  SourceDecision,
  SourceDecisionEdge,
  SourceDecisionStatus,
  SourceTrustTier,
  SourceSupportType,
  SourceRejection
} from "@krn/core";
import type {
  CreateSourceArtifactInput,
  CreateSourceChunkInput,
  CreateSourceClaimInput,
  CreateSourceDecisionInput,
  CreateSourceDecisionEdgeInput,
  CreateSourceRejectionInput,
  SourceArtifactRecord,
  SourceChunkRecord,
  SourceRepository
} from "@krn/harness/repositories/internal";

import type { KrnDatabase } from "../database.js";
import {
  outboxEvents,
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  sourceRejections
} from "../schema/index.js";
import { requireReturnedRow } from "./common.js";
import {
  mapSourceArtifact,
  mapSourceChunk,
  mapSourceClaim,
  mapSourceDecision,
  mapSourceDecisionEdge,
  mapSourceRejection
} from "./mappers.js";

const smokePayload = (metadata: Record<string, unknown> | undefined): Record<string, string> => {
  const smokeId = metadata?.smokeId;

  return typeof smokeId === "string" ? { smokeId } : {};
};

const decisionGradeSupportTypes = new Set<SourceSupportType>([
  "mechanism",
  "decision",
  "risk",
  "rejection",
  "eval-design",
  "implementation-boundary",
  "contradicts"
]);

const requireText = (value: string | undefined, message: string): void => {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(message);
  }
};

const sourceTrustTierRanks: Record<SourceTrustTier, number> = {
  official: 100,
  primary: 100,
  "project-decision": 100,
  "source-code": 100,
  paper: 85,
  high: 85,
  practitioner: 60,
  secondary: 60,
  medium: 60,
  low: 25,
  hypothesis: 10
};

type SourceClaimOverrideClaim = Pick<
  SourceClaim,
  "id" | "status" | "trustTier" | "revisitWhen" | "createdAt"
>;

export type SourceClaimOverrideAssessment =
  | {
      readonly allowed: true;
      readonly reason: "explicit_override_reason" | "no_stronger_valid_consensus";
    }
  | {
      readonly allowed: false;
      readonly reason: "weaker_than_current_valid_consensus";
      readonly blockedBySourceClaimId: SourceClaim["id"];
    };

export const rankSourceTrustTier = (trustTier: SourceTrustTier): number =>
  sourceTrustTierRanks[trustTier];

const parseTime = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const isSourceClaimTemporallyValid = (
  sourceClaim: Pick<SourceClaim, "status" | "revisitWhen">,
  now: string
): boolean => {
  if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
    return false;
  }

  const revisitAt = parseTime(sourceClaim.revisitWhen);
  const nowAt = parseTime(now);

  if (revisitAt === undefined || nowAt === undefined) {
    return true;
  }

  return revisitAt >= nowAt;
};

export const assessSourceClaimOverride = (input: {
  readonly candidate: SourceClaimOverrideClaim;
  readonly currentConsensus: readonly SourceClaimOverrideClaim[];
  readonly now: string;
  readonly overrideReason?: string;
}): SourceClaimOverrideAssessment => {
  const candidateCreatedAt = parseTime(input.candidate.createdAt);
  const overrideReason = input.overrideReason?.trim();

  if (overrideReason !== undefined && overrideReason.length > 0) {
    return {
      allowed: true,
      reason: "explicit_override_reason"
    };
  }

  const candidateTrustRank = rankSourceTrustTier(input.candidate.trustTier);
  const strongerCurrentConsensus = input.currentConsensus.find((currentClaim) => {
    if (!isSourceClaimTemporallyValid(currentClaim, input.now)) {
      return false;
    }

    const currentCreatedAt = parseTime(currentClaim.createdAt);
    const candidateIsNewer =
      candidateCreatedAt === undefined ||
      currentCreatedAt === undefined ||
      candidateCreatedAt > currentCreatedAt;

    return (
      candidateIsNewer &&
      rankSourceTrustTier(currentClaim.trustTier) > candidateTrustRank
    );
  });

  if (strongerCurrentConsensus !== undefined) {
    return {
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: strongerCurrentConsensus.id
    };
  }

  return {
    allowed: true,
    reason: "no_stronger_valid_consensus"
  };
};

const assertDecisionGradeSupportType = (
  supportType: SourceSupportType,
  label: string
): void => {
  if (!decisionGradeSupportTypes.has(supportType)) {
    throw new Error(`${label} supportType cannot be decorative`);
  }
};

export const assertSourceClaimGovernance = (
  input: Pick<
    CreateSourceClaimInput,
    | "claim"
    | "mechanism"
    | "krnImplication"
    | "doesNotProve"
    | "trustTier"
    | "supportType"
    | "consumer"
    | "falsifier"
  >
): void => {
  requireText(input.claim, "SourceClaim requires claim");
  requireText(input.mechanism, "SourceClaim requires mechanism");
  requireText(input.krnImplication, "SourceClaim requires krnImplication");
  requireText(input.doesNotProve, "SourceClaim requires doesNotProve");
  requireText(input.trustTier, "SourceClaim requires trustTier");
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
  if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
    throw new Error(`SourceDecisionEdge cannot use ${sourceClaim.status} SourceClaim`);
  }
};

export class DrizzleSourceRepository implements SourceRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createSourceArtifact(input: CreateSourceArtifactInput): Promise<SourceArtifactRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(sourceArtifacts)
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          kind: input.kind,
          trustTier: input.trustTier,
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
          trustTier: input.trustTier,
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

  async getSourceClaimById(id: SourceClaim["id"]): Promise<SourceClaim | undefined> {
    const [row] = await this.db
      .select()
      .from(sourceClaims)
      .where(eq(sourceClaims.id, id))
      .limit(1);

    return row === undefined ? undefined : mapSourceClaim(row);
  }

  async listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]> {
    const rows = await this.db
      .select({
        id: sourceClaims.id,
        sourceArtifactId: sourceClaims.sourceArtifactId,
        sourceChunkId: sourceClaims.sourceChunkId,
        executionRunId: sourceClaims.executionRunId,
        claim: sourceClaims.claim,
        mechanism: sourceClaims.mechanism,
        krnImplication: sourceClaims.krnImplication,
        doesNotProve: sourceClaims.doesNotProve,
        trustTier: sourceClaims.trustTier,
        supportType: sourceClaims.supportType,
        consumer: sourceClaims.consumer,
        falsifier: sourceClaims.falsifier,
        revisitWhen: sourceClaims.revisitWhen,
        status: sourceClaims.status,
        metadata: sourceClaims.metadata,
        createdAt: sourceClaims.createdAt,
        updatedAt: sourceClaims.updatedAt
      })
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
      const row = requireReturnedRow(
        await tx
          .insert(sourceDecisions)
          .values({
            ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
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

      await tx.insert(outboxEvents).values({
        topic: "source.decision.created",
        payload: {
          sourceDecisionId: row.id,
          projectId: row.projectId,
          sourceClaimId: row.sourceClaimId
        }
      });

      return mapSourceDecision(row);
    });
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
}
