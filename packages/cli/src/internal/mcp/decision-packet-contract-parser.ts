import {
  createHash
} from "node:crypto";
import {
  decisionPacketChecksum,
  type DecisionPacket,
  type DecisionPacketIdentity
} from "@krn/core";
import {
  z
} from "zod";

export type DecisionPacketJsonValue =
  | string
  | number
  | boolean
  | null
  | DecisionPacketJsonValue[]
  | DecisionPacketJsonObject;

export type DecisionPacketJsonObject = {
  readonly [key: string]: DecisionPacketJsonValue;
};

const transportProof =
  "DecisionPacket was served through the read-only krn_decision_packet MCP tool";

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const stringArraySchema = z.array(z.string());

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

const contextInclusionSchema = z.strictObject({
  subjectType: z.string(),
  subjectId: z.string(),
  reason: z.string(),
  expectedUse: z.string(),
  sourceAuthority: z.string()
});

const contextExclusionSchema = z.strictObject({
  subjectType: z.string(),
  subjectId: z.string(),
  reason: z.string(),
  explanation: z.string(),
  sourceAuthority: z.string()
});

const taskStandardSchema = z.strictObject({
  memoryRecordId: z.string(),
  key: z.string(),
  sourceRefs: stringArraySchema,
  mechanism: z.string(),
  krnImplication: z.string(),
  decision: z.string(),
  consumer: z.string(),
  falsifier: z.string(),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  rejectedPath: z.string().optional(),
  doesNotProve: z.string()
});

const sourceDecisionTargetSchema = z.strictObject({
  targetType: z.string(),
  targetId: z.string(),
  sourceDecisionEdgeIds: stringArraySchema
});

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
  doesNotProve: z.string()
});

const abstentionScoreSchema = z.strictObject({
  status: z.enum(["ready", "weak_context", "abstain"]),
  score: z.number(),
  reasons: stringArraySchema,
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
  governingStatements: stringArraySchema,
  taskStandardDecisions: z.array(taskStandardSchema),
  sourceClaimIds: stringArraySchema,
  caveatedSourceClaimIds: stringArraySchema,
  sourceDecisionEdgeIds: stringArraySchema,
  sourceDecisionTargets: z.array(sourceDecisionTargetSchema),
  sourceRejectionIds: stringArraySchema,
  memoryRefs: stringArraySchema,
  caveatedMemoryRefs: stringArraySchema,
  staleDecisionIds: stringArraySchema,
  staleKnowledgeIds: stringArraySchema,
  noiseKnowledgeIds: stringArraySchema,
  unknownKnowledgeIds: stringArraySchema,
  supersededPathIds: stringArraySchema,
  rejectedPathIds: stringArraySchema,
  falsifiers: stringArraySchema,
  verificationCommands: stringArraySchema,
  evidenceGaps: z.array(evidenceGapSchema),
  sourceConsensus: sourceConsensusSchema,
  abstentionScore: abstentionScoreSchema,
  doesNotProve: stringArraySchema,
  nonProofs: stringArraySchema,
  noiseDecisionIds: stringArraySchema,
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
  generatedAt: z.string(),
  sourceRunStatus: z.enum(["planned", "running", "succeeded", "failed", "blocked", "cancelled"]),
  sourceRunLifecycleRevision: z.number().int(),
  sourceRunUpdatedAt: z.string(),
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

const boundedReadbackSchema = z.strictObject({
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

const commandReadbackSchema = boundedReadbackSchema.extend({
  readModel: z.unknown().optional()
});

const isJsonValue = (value: unknown): value is DecisionPacketJsonValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return typeof value === "object" &&
    value !== null &&
    Object.values(value).every(isJsonValue);
};

const isJsonObject = (value: unknown): value is DecisionPacketJsonObject =>
  isJsonValue(value) && typeof value === "object" && value !== null && !Array.isArray(value);

const outputSchema = z.toJSONSchema(boundedReadbackSchema);

if (!isJsonObject(outputSchema)) {
  throw new Error("DecisionPacket output schema is not a JSON object");
}

export const decisionPacketContractOutputSchema = outputSchema;

const hasExpectedRequestScope = (
  readback: z.infer<typeof commandReadbackSchema>,
  requestedRunId: string
): boolean => readback.request.runId === requestedRunId &&
  readback.request.taskId === readback.packet.task.id &&
  readback.request.projectId === readback.packet.task.projectId;

const hasExpectedIdentity = (
  readback: z.infer<typeof commandReadbackSchema>,
  requestedRunId: string
): boolean => readback.packetIdentity.packetId ===
    `decision-packet:${requestedRunId}:${readback.packetIdentity.checksum.slice(0, 16)}` &&
  readback.packetIdentity.evidenceRef === `packet:${readback.packetIdentity.checksum}`;

const hasExpectedChecksum = (
  readback: z.infer<typeof commandReadbackSchema>
): boolean => {
  const identity = readback.packetIdentity;
  const expected = decisionPacketChecksum({
    generatedAt: identity.generatedAt,
    packet: readback.packet as DecisionPacket,
    request: readback.request,
    sourceRunStatus: identity.sourceRunStatus as DecisionPacketIdentity["sourceRunStatus"],
    sourceRunLifecycleRevision: identity.sourceRunLifecycleRevision,
    sourceRunUpdatedAt: identity.sourceRunUpdatedAt
  }, sha256Hex);

  return identity.checksum === expected;
};

export const parseDecisionPacketContractReadback = (
  value: unknown,
  requestedRunId: string
): DecisionPacketJsonObject | undefined => {
  if (!isJsonObject(value)) {
    return undefined;
  }

  const parsed = commandReadbackSchema.safeParse(value);

  if (
    !parsed.success ||
    !hasExpectedRequestScope(parsed.data, requestedRunId) ||
    !hasExpectedIdentity(parsed.data, requestedRunId) ||
    !hasExpectedChecksum(parsed.data) ||
    parsed.data.proof.proves.includes(transportProof)
  ) {
    return undefined;
  }

  return value;
};
