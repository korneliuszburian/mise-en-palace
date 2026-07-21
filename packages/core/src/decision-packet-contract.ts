import { z } from "zod";

import { contextSubjectTypes } from "./context-assembly.js";
import type {
  DecisionPacket,
  DecisionPacketContractReadback,
  DecisionPacketTaskStandard
} from "./decision-packet.js";
import { memoryRecordStatuses } from "./memory.js";
import type {
  MemorySupersessionTimelineEntry,
  MemorySupersessionTimelineReadback
} from "./memory.js";
import type { SourceConsensusTimelineReadback } from "./source-consensus-timeline.js";
import {
  decisionPacketAbstentionReasons,
  decisionPacketChecksum
} from "./decision-packet.js";
import {
  SourceAuthorityLabelSchema,
  SourceDecisionTargetTypeSchema
} from "./parsing/source-claim.js";
import {
  sourceAuthorityLabels,
  sourceClaimEdgeKinds,
  sourceClaimStatuses
} from "./source-model.js";
import { isIsoTimestamp } from "./time.js";

export const decisionPacketSupportingEvidenceMaxCharacters = 2_400;

const stringArraySchema = z.array(z.string());
const isoTimestampSchema = z.string().refine(isIsoTimestamp);

const taskSchema = z.strictObject({
  id: z.string(),
  projectId: z.string().nullable(),
  title: z.string(),
  objective: z.string(),
  constraints: stringArraySchema,
  nonGoals: stringArraySchema,
  acceptance: stringArraySchema,
  status: z.enum(["draft", "active", "superseded", "closed"]).optional()
});

const supportingEvidenceSchema = z.strictObject({
  searchDocumentId: z.string(),
  sourceArtifactId: z.string(),
  sourceChunkId: z.string(),
  contentHash: z.string(),
  renderedContentHash: z.string(),
  sourceRange: z.string().optional(),
  content: z.string(),
  truncated: z.boolean()
});

const contextInclusionSchema = z.strictObject({
  subjectType: z.enum(contextSubjectTypes),
  subjectId: z.string(),
  reason: z.string(),
  expectedUse: z.string(),
  sourceAuthority: SourceAuthorityLabelSchema,
  supportingEvidence: supportingEvidenceSchema.optional()
});

const contextExclusionSchema = z.strictObject({
  subjectType: z.enum(contextSubjectTypes),
  subjectId: z.string(),
  reason: z.string(),
  explanation: z.string(),
  sourceAuthority: SourceAuthorityLabelSchema
});

const reviewOnlyUsefulnessCaveatSchema = z.strictObject({
  feedbackDeltaId: z.string().optional(),
  subjectType: z.enum(["source_claim", "source_decision", "knowledge"]),
  subjectId: z.string(),
  feedbackStatus: z.enum(["candidate", "accepted", "rejected", "applied"]),
  outcome: z.enum(["selected", "used", "helped", "neutral", "noise", "stale", "hurt", "rejected", "unknown"]),
  reason: z.string(),
  doesNotProve: z.string()
});

const taskStandardSchema = z.strictObject({
  memoryRecordId: z.string().optional(),
  sourceDecisionId: z.string().optional(),
  key: z.string(),
  sourceClaimIds: stringArraySchema.optional(),
  sourceRefs: stringArraySchema,
  mechanism: z.string(),
  krnImplication: z.string(),
  decision: z.string(),
  consumer: z.string(),
  falsifier: z.string(),
  validFrom: isoTimestampSchema,
  validUntil: isoTimestampSchema.optional(),
  rejectedPath: z.string().optional(),
  doesNotProve: z.string()
}).refine(
  (standard) => (standard.memoryRecordId === undefined) !== (standard.sourceDecisionId === undefined),
  { message: "task standard requires exactly one authority ID" }
);

const sourceDecisionTargetSchema = z.strictObject({
  targetType: SourceDecisionTargetTypeSchema,
  targetId: z.string(),
  sourceDecisionEdgeIds: stringArraySchema
});

const relationTemporalValiditySchema = z.union([
  z.strictObject({ status: z.literal("current") }),
  z.strictObject({
    status: z.literal("historical"),
    reason: z.enum(["before_valid_from", "valid_until_elapsed", "invalidated"])
  }),
  z.strictObject({
    status: z.literal("invalid"),
    reason: z.enum(["invalid_now", "invalid_valid_from", "invalid_valid_until", "invalid_invalidated_at"])
  })
]);

const temporalValiditySchema = z.union([
  relationTemporalValiditySchema,
  z.strictObject({ status: z.literal("historical"), reason: z.literal("revisit_when_elapsed") }),
  z.strictObject({ status: z.literal("invalid"), reason: z.literal("invalid_revisit_when") }),
  z.strictObject({ status: z.literal("inactive"), reason: z.literal("rejected_or_deprecated") })
]);

const sourceConsensusRelationEvidenceSchema = z.strictObject({
  sourceClaimEdgeId: z.string(),
  direction: z.enum(["incoming", "outgoing"]),
  kind: z.enum(sourceClaimEdgeKinds),
  relatedSourceClaimId: z.string(),
  metadataEvidenceRefs: stringArraySchema,
  metadataSourceDecisionRef: z.string().optional(),
  sourceRanges: stringArraySchema,
  evidenceGaps: z.array(z.literal("missing_relation_support_ref")),
  temporalValidity: relationTemporalValiditySchema
});

const sourceConsensusTimelineEntrySchema = z.strictObject({
  sourceClaimId: z.string(),
  claim: z.string(),
  status: z.enum(sourceClaimStatuses),
  createdAt: isoTimestampSchema,
  sourceAuthority: z.enum(sourceAuthorityLabels),
  authorityRank: z.number(),
  temporalValidity: temporalValiditySchema,
  authorityState: z.enum(["accepted", "stale", "superseded", "rejected", "unsupported", "conflicting", "unknown"]),
  state: z.enum(["current_authority", "caveated_authority", "historical", "rejected"]),
  blockedByCurrentSourceClaimId: z.string().optional(),
  decisionSupportEdgeIds: stringArraySchema,
  evidenceRefs: stringArraySchema,
  rawEvidenceCitationRefs: stringArraySchema,
  sourceRanges: stringArraySchema,
  relationEvidence: z.array(sourceConsensusRelationEvidenceSchema),
  supportingSourceClaimIds: stringArraySchema,
  dissentingSourceClaimIds: stringArraySchema,
  supersededBySourceClaimIds: stringArraySchema,
  supersedesSourceClaimIds: stringArraySchema,
  rejectionIds: stringArraySchema,
  caveats: stringArraySchema
});

const sourceConsensusTimelineSchema = z.strictObject({
  currentSourceClaimIds: stringArraySchema,
  caveatedSourceClaimIds: stringArraySchema,
  historicalSourceClaimIds: stringArraySchema,
  staleSourceClaimIds: stringArraySchema,
  supersededSourceClaimIds: stringArraySchema,
  unknownSourceClaimIds: stringArraySchema,
  rejectedSourceClaimIds: stringArraySchema,
  entries: z.array(sourceConsensusTimelineEntrySchema),
  doesNotProve: z.string()
});

const memorySupersessionTimelineSchema = z.strictObject({
  activeMemoryRecordIds: stringArraySchema,
  historicalMemoryRecordIds: stringArraySchema,
  entries: z.array(z.strictObject({
    predecessorMemoryRecordId: z.string(),
    predecessorStatus: z.literal("superseded"),
    replacementMemoryRecordId: z.string(),
    replacementStatus: z.union([
      z.enum(memoryRecordStatuses),
      z.literal("unknown")
    ]),
    transition: z.strictObject({
      reviewer: z.string(),
      reason: z.string(),
      supersededAt: isoTimestampSchema
    }),
    evidence: z.strictObject({
      sourceClaimIds: stringArraySchema,
      evidenceRefs: stringArraySchema,
      status: z.enum(["complete", "incomplete"])
    }).optional()
  })),
  doesNotProve: z.string()
});

export const parseMemorySupersessionTimelineReadback = (
  value: unknown
): MemorySupersessionTimelineReadback | undefined => {
  const parsed = memorySupersessionTimelineSchema.safeParse(value);
  if (!parsed.success) return undefined;
  return {
    ...parsed.data,
    entries: parsed.data.entries.map(({ evidence, ...entry }): MemorySupersessionTimelineEntry => ({
      ...entry,
      evidence: evidence ?? {
        sourceClaimIds: [],
        evidenceRefs: [],
        status: "incomplete" as const
      }
    }))
  };
};

type ParsedSourceConsensusTimeline = z.infer<typeof sourceConsensusTimelineSchema>;

const normalizeSourceConsensusTimeline = (
  timeline: ParsedSourceConsensusTimeline
): SourceConsensusTimelineReadback => ({
  ...timeline,
  entries: timeline.entries.map((entry) => {
    const { blockedByCurrentSourceClaimId, relationEvidence, ...entryFields } = entry;
    return {
      ...entryFields,
      relationEvidence: relationEvidence.map((relation) => {
        const { metadataSourceDecisionRef, ...relationFields } = relation;
        return {
          ...relationFields,
          ...(metadataSourceDecisionRef === undefined ? {} : { metadataSourceDecisionRef })
        };
      }),
      ...(blockedByCurrentSourceClaimId === undefined ? {} : { blockedByCurrentSourceClaimId })
    };
  })
});

export const parseSourceConsensusTimelineReadback = (
  value: unknown
): SourceConsensusTimelineReadback | undefined => {
  const parsed = sourceConsensusTimelineSchema.safeParse(value);
  return parsed.success ? normalizeSourceConsensusTimeline(parsed.data) : undefined;
};

const evidenceGapSchema = z.strictObject({
  id: z.string(),
  reason: z.string(),
  verificationRequired: z.string()
});

const evidenceContractSchema = z.strictObject({
  commands: z.array(z.strictObject({
    command: z.string(),
    required: z.boolean()
  })),
  diffRisk: z.enum(["low", "medium", "high"]),
  reviewBurden: z.string(),
  rollbackPath: z.string()
});

const sourceConsensusSchema = z.strictObject({
  decisionLinkedSourceClaimIds: stringArraySchema,
  caveatedSourceClaimIds: stringArraySchema,
  unsupportedSourceClaimIds: stringArraySchema,
  conflictingSourceClaimIds: stringArraySchema,
  unknownSourceClaimIds: stringArraySchema,
  sourceDecisionEdgeIds: stringArraySchema,
  sourceDecisionTargets: z.array(sourceDecisionTargetSchema),
  staleDecisionIds: stringArraySchema,
  supersededPathIds: stringArraySchema,
  rejectedPathIds: stringArraySchema,
  sourceRejectionIds: stringArraySchema,
  conflictedDecisionIds: stringArraySchema,
  evidenceGapIds: stringArraySchema,
  timeline: sourceConsensusTimelineSchema.optional(),
  doesNotProve: z.string()
});

const abstentionScoreSchema = z.strictObject({
  status: z.enum(["ready", "weak_context", "abstain"]),
  score: z.number(),
  reasons: z.array(z.enum(decisionPacketAbstentionReasons)),
  evidenceGapIds: stringArraySchema,
  doesNotProve: z.string()
});

const briefSchema = z.strictObject({
  includedContextCount: z.number(),
  observationPrefixCount: z.number(),
  explicitExclusionCount: z.number(),
  sourceClaimUseCount: z.number(),
  memoryRecordUseCount: z.number(),
  includedSourceClaimIds: stringArraySchema,
  includedMemoryRecordIds: stringArraySchema,
  excludedSourceClaimIds: stringArraySchema,
  excludedMemoryRecordIds: stringArraySchema,
  excludedAntiMemoryRecordIds: stringArraySchema,
  evidenceGapIds: stringArraySchema
});

const decisionPacketSchema = z.strictObject({
  formatVersion: z.literal("krn.decisionPacket.v1"),
  task: taskSchema,
  contextInclusions: z.array(contextInclusionSchema),
  contextExclusions: z.array(contextExclusionSchema),
  toolBoundaries: stringArraySchema,
  evidenceContract: evidenceContractSchema.optional(),
  nextAction: z.string(),
  governingDecisionIds: stringArraySchema,
  sourceDecisionIds: stringArraySchema,
  governingStatements: stringArraySchema,
  taskStandardDecisions: z.array(taskStandardSchema),
  sourceClaimIds: stringArraySchema,
  caveatedSourceClaimIds: stringArraySchema,
  sourceDecisionEdgeIds: stringArraySchema,
  sourceDecisionTargets: z.array(sourceDecisionTargetSchema),
  sourceRejectionIds: stringArraySchema,
  memoryRefs: stringArraySchema,
  caveatedMemoryRefs: stringArraySchema,
  reviewOnlyUsefulnessCaveats: z.array(reviewOnlyUsefulnessCaveatSchema).optional(),
  staleDecisionIds: stringArraySchema,
  staleKnowledgeIds: stringArraySchema,
  supersededPathIds: stringArraySchema,
  rejectedPathIds: stringArraySchema,
  falsifiers: stringArraySchema,
  verificationCommands: stringArraySchema,
  evidenceGaps: z.array(evidenceGapSchema),
  sourceConsensus: sourceConsensusSchema,
  memorySupersessionTimeline: memorySupersessionTimelineSchema.optional(),
  abstentionScore: abstentionScoreSchema,
  doesNotProve: stringArraySchema,
  nonProofs: stringArraySchema,
  severeStaleAuthorityIds: stringArraySchema,
  brief: briefSchema
});

const packetRequestSchema = z.strictObject({
  runId: z.string(),
  taskId: z.string(),
  projectId: z.string().nullable()
});

const packetIdentitySchema = z.strictObject({
  packetId: z.string(),
  checksumAlgorithm: z.literal("sha256"),
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
  evidenceRef: z.string(),
  generatedAt: isoTimestampSchema,
  sourceRunStatus: z.enum([
    "planned",
    "running",
    "succeeded",
    "failed",
    "blocked",
    "cancelled"
  ]),
  sourceRunLifecycleRevision: z.number().int().positive(),
  sourceRunUpdatedAt: isoTimestampSchema,
  freshness: z.strictObject({
    status: z.literal("current_read_model_snapshot"),
    doesNotProve: z.string()
  })
});

const returnChannelsSchema = z.strictObject({
  evidence: z.strictObject({
    command: z.string(),
    persistedCommand: z.string(),
    doesNotProve: z.string()
  }),
  feedback: z.strictObject({
    memoryRecordApplyExample: z.string(),
    sourceUsefulnessExample: z.string(),
    sourceDecisionUsefulnessExample: z.string(),
    knowledgeUsefulnessExample: z.string(),
    doesNotProve: z.string()
  })
});

const proofSchema = z.strictObject({
  proves: stringArraySchema,
  doesNotProve: stringArraySchema
});

export const decisionPacketContractReadbackSchema = z.strictObject({
  kind: z.literal("krn.decisionPacketReadback.v1"),
  access: z.literal("read_only"),
  mutation: z.literal("none"),
  surface: z.literal("headless_cli"),
  request: packetRequestSchema,
  packetIdentity: packetIdentitySchema,
  packet: decisionPacketSchema,
  returnChannels: returnChannelsSchema,
  proof: proofSchema
});

type ParsedDecisionPacketContractReadback =
  z.infer<typeof decisionPacketContractReadbackSchema>;

const normalizeTaskStandard = (
  standard: ParsedDecisionPacketContractReadback["packet"]["taskStandardDecisions"][number]
): DecisionPacketTaskStandard => {
  const fields = {
    key: standard.key,
    ...(standard.sourceClaimIds === undefined ? {} : { sourceClaimIds: standard.sourceClaimIds }),
    sourceRefs: standard.sourceRefs,
    mechanism: standard.mechanism,
    krnImplication: standard.krnImplication,
    decision: standard.decision,
    consumer: standard.consumer,
    falsifier: standard.falsifier,
    validFrom: standard.validFrom,
    ...(standard.validUntil === undefined ? {} : { validUntil: standard.validUntil }),
    ...(standard.rejectedPath === undefined ? {} : { rejectedPath: standard.rejectedPath }),
    doesNotProve: standard.doesNotProve
  };

  if (standard.memoryRecordId !== undefined) {
    return { ...fields, memoryRecordId: standard.memoryRecordId };
  }

  if (standard.sourceDecisionId === undefined) {
    throw new Error("Parsed task standard lost its authority ID");
  }

  return { ...fields, sourceDecisionId: standard.sourceDecisionId };
};

const normalizeReviewOnlyUsefulnessCaveat = (
  caveat: NonNullable<ParsedDecisionPacketContractReadback["packet"]["reviewOnlyUsefulnessCaveats"]>[number]
) => {
  const { feedbackDeltaId, ...fields } = caveat;
  return {
    ...fields,
    ...(feedbackDeltaId === undefined ? {} : { feedbackDeltaId })
  };
};

const normalizePacket = (
  packet: ParsedDecisionPacketContractReadback["packet"]
): DecisionPacket => {
  const {
    evidenceContract,
    task,
    taskStandardDecisions,
    sourceConsensus,
    memorySupersessionTimeline,
    reviewOnlyUsefulnessCaveats,
    ...packetFields
  } = packet;
  const { timeline, ...sourceConsensusFields } = sourceConsensus;
  const normalizedMemorySupersessionTimeline = memorySupersessionTimeline === undefined
    ? undefined
    : parseMemorySupersessionTimelineReadback(memorySupersessionTimeline);

  return {
    ...packetFields,
    task: {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      objective: task.objective,
      constraints: task.constraints,
      nonGoals: task.nonGoals,
      acceptance: task.acceptance,
      ...(task.status === undefined ? {} : { status: task.status })
    },
    ...(evidenceContract === undefined ? {} : { evidenceContract }),
    ...(reviewOnlyUsefulnessCaveats === undefined
      ? {}
      : {
          reviewOnlyUsefulnessCaveats:
            reviewOnlyUsefulnessCaveats.map(normalizeReviewOnlyUsefulnessCaveat)
        }),
    taskStandardDecisions: taskStandardDecisions.map(normalizeTaskStandard),
    sourceConsensus: {
      ...sourceConsensusFields,
      ...(timeline === undefined ? {} : { timeline: normalizeSourceConsensusTimeline(timeline) })
    },
    ...(normalizedMemorySupersessionTimeline === undefined
      ? {}
      : { memorySupersessionTimeline: normalizedMemorySupersessionTimeline })
  };
};

const normalizeReadback = (
  readback: ParsedDecisionPacketContractReadback
): DecisionPacketContractReadback => ({
  ...readback,
  packet: normalizePacket(readback.packet)
});

const decisionPacketContractMatchesScope = (
  readback: ParsedDecisionPacketContractReadback,
  expectedRunId: string
): boolean => readback.request.runId === expectedRunId &&
  readback.request.taskId === readback.packet.task.id &&
  readback.request.projectId === readback.packet.task.projectId &&
  readback.packetIdentity.packetId ===
    `decision-packet:${expectedRunId}:${readback.packetIdentity.checksum.slice(0, 16)}` &&
  readback.packetIdentity.evidenceRef === `packet:${readback.packetIdentity.checksum}`;

export const parseDecisionPacketContractReadback = (input: {
  value: unknown;
  expectedRunId: string;
  sha256Hex(value: string): string;
}): DecisionPacketContractReadback | undefined => {
  const parsed = decisionPacketContractReadbackSchema.safeParse(input.value);

  if (!parsed.success || !decisionPacketContractMatchesScope(parsed.data, input.expectedRunId)) {
    return undefined;
  }

  const readback = normalizeReadback(parsed.data);
  const identity = readback.packetIdentity;
  const checksum = decisionPacketChecksum({
    generatedAt: identity.generatedAt,
    packet: readback.packet,
    request: readback.request,
    sourceRunStatus: identity.sourceRunStatus,
    sourceRunLifecycleRevision: identity.sourceRunLifecycleRevision,
    sourceRunUpdatedAt: identity.sourceRunUpdatedAt
  }, input.sha256Hex);

  return checksum === identity.checksum ? readback : undefined;
};
