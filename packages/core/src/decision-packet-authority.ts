import type {
  DecisionPacketActivationCandidateInput,
  DecisionPacketActivationDecisionInput,
  DecisionPacketActivationTraceInput,
  DecisionPacketReadModelInput,
  DecisionPacketTask
} from "./decision-packet.js";
import {
  buildDecisionPacketContractReadback
} from "./decision-packet.js";
import {
  decideEvidenceContractActivation
} from "./evidence-contract.js";
import {
  knowledgeUsefulnessOutcomesFromMetadata,
  sourceUsefulnessOutcomesFromMetadata
} from "./feedback-delta.js";
import type {
  KnowledgeUsefulnessOutcomeFeedback,
  SourceUsefulnessOutcomeFeedback
} from "./feedback-delta.js";
import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import type {
  HarnessRunAggregate
} from "./repositories/harness-run-repository.js";
import type {
  ActivationDecisionRecord,
  RetrievalCandidateRecord
} from "./repositories/types.js";
import type {
  ProjectStandardDecisionReadback
} from "./memory.js";
import type {
  SourceClaimAuthorityReason,
  SourceClaimAuthorityStatus
} from "./source-authority.js";
import {
  sourceClaimEdgeKinds,
  sourceDecisionTargetTypes
} from "./source-model.js";
import type {
  SourceClaimEdgeKind,
  SourceDecisionTargetType
} from "./source-model.js";
import type {
  IsoTimestamp
} from "./time.js";
import {
  isIsoTimestamp
} from "./time.js";

export const decisionPacketReadModelProves = [
  "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
  "persisted activation candidate scores and edge-influence metadata can be read without mutating state",
  "this readback surface exposes no write action"
] as const;

export const decisionPacketReadModelDoesNotProve = [
  "commands were executed by this readback command or that their selected set is sufficient",
  "activation scoring quality or production graph retrieval quality",
  "memory quality, source truth, review correctness, or product readiness",
  "Memory Core mutation"
] as const;

export type DecisionPacketUsefulnessSubjectKind =
  | "source_claim"
  | "source_decision"
  | "knowledge"
  | "memory_record";

export interface DecisionPacketUsefulnessSubject {
  kind: DecisionPacketUsefulnessSubjectKind;
  id: string;
  evidenceRefs?: readonly string[];
}

export interface DecisionPacketUsefulnessSubjectProjectionInput {
  readonly sourceUsefulnessOutcomes:
    | readonly SourceUsefulnessOutcomeFeedback[]
    | undefined;
  readonly knowledgeUsefulnessOutcomes:
    | readonly KnowledgeUsefulnessOutcomeFeedback[]
    | undefined;
}

export const projectDecisionPacketUsefulnessSubjects = (
  input: DecisionPacketUsefulnessSubjectProjectionInput
): DecisionPacketUsefulnessSubject[] => [
  ...(input.sourceUsefulnessOutcomes ?? []).flatMap((outcome) => {
    const id = outcome.sourceDecisionId ?? outcome.sourceClaimId;

    return id === undefined
      ? []
      : [{
          kind: outcome.sourceDecisionId === undefined
            ? "source_claim" as const
            : "source_decision" as const,
          id,
          evidenceRefs: [...outcome.evidenceRefs]
        }];
  }),
  ...(input.knowledgeUsefulnessOutcomes ?? []).map((outcome) => ({
    kind: "knowledge" as const,
    id: outcome.knowledgeId,
    evidenceRefs: [...outcome.evidenceRefs]
  }))
];

export interface DecisionPacketBinding {
  packetChecksum: string;
  packetEvidenceRef: string;
  packetGeneratedAt: IsoTimestamp;
  sourceRunLifecycleRevision: number;
}

export type DecisionPacketAuthorization =
  | (DecisionPacketBinding & {
      authorized: true;
      projectId: string;
    })
  | {
      authorized: false;
      reason: string;
      projectId?: string;
    };

interface DecisionPacketAuthorityInput {
  aggregate: HarnessRunAggregate;
  runId: string;
  runtimeProjectId: string;
  callerPacketChecksum?: string;
  callerPacketGeneratedAt?: IsoTimestamp;
  sha256Hex(value: string): string;
}

export type DecisionPacketBindingAuthorizationInput = DecisionPacketAuthorityInput;

export interface DecisionPacketUsefulnessAuthorizationInput
  extends DecisionPacketAuthorityInput {
  subjects: readonly DecisionPacketUsefulnessSubject[];
}

interface DecisionPacketSourceClaimEdgeInfluence {
  edgeIds: string[];
  edgeKinds: SourceClaimEdgeKind[];
  missingRelationSupportEdgeIds?: string[];
  seedSourceClaimIds: string[];
  doesNotProve: string;
}

interface DecisionPacketSourceDecisionSupportTarget {
  sourceDecisionEdgeId: string;
  targetType: SourceDecisionTargetType;
  targetId: string;
}

interface DecisionPacketSourceDecisionSupportBoost {
  sourceDecisionEdgeIds: string[];
  sourceDecisionIds?: string[];
  targets: DecisionPacketSourceDecisionSupportTarget[];
  confidence: string[];
  supportTypes: string[];
  doesNotProve: string;
}

interface DecisionPacketPendingAntiMemoryReview {
  antiMemoryCandidateIds: string[];
  feedbackDeltaIds: string[];
  subjectRefs: string[];
  doesNotProve: string;
}

const sourceClaimAuthorityStatuses = [
  "accepted",
  "caveated",
  "blocked",
  "stale",
  "rejected",
  "evidence_gap"
] as const satisfies readonly SourceClaimAuthorityStatus[];

const sourceClaimAuthorityReasons = [
  "current_decision_linked_authority",
  "accepted_with_dissenting_source_claims",
  "candidate_not_accepted",
  "rejected_or_deprecated",
  "invalid_time",
  "stale",
  "missing_source_to_decision_fields",
  "decorative_support_type",
  "missing_source_decision_support",
  "superseded_by_current_claim",
  "weaker_than_current_valid_consensus",
  "rejected_by_source_rejection"
] as const satisfies readonly SourceClaimAuthorityReason[];

const isMetadataRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const metadataRecordValue = (value: unknown): Record<string, unknown> | undefined =>
  isMetadataRecord(value) ? value : undefined;

const includesValue = <TValue extends string>(
  values: readonly TValue[],
  value: string
): value is TValue => values.some((candidate) => candidate === value);

export const sourceClaimEdgeInfluenceFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketSourceClaimEdgeInfluence | undefined => {
  const value = metadataRecordValue(metadata.sourceClaimEdgeInfluence);

  if (value === undefined) {
    return undefined;
  }

  const edgeIds = readMetadataStringList(value, "edgeIds");
  const edgeKinds = readMetadataStringList(value, "edgeKinds")
    .filter((kind): kind is SourceClaimEdgeKind => includesValue(sourceClaimEdgeKinds, kind));
  const missingRelationSupportEdgeIds = readMetadataStringList(
    value,
    "missingRelationSupportEdgeIds"
  );
  const seedSourceClaimIds = readMetadataStringList(value, "seedSourceClaimIds");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    edgeIds.length === 0 ||
    edgeKinds.length === 0 ||
    seedSourceClaimIds.length === 0 ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    edgeIds,
    edgeKinds,
    ...(missingRelationSupportEdgeIds.length === 0 ? {} : { missingRelationSupportEdgeIds }),
    seedSourceClaimIds,
    doesNotProve
  };
};

export const sourceClaimAuthorityFromMetadata = (
  metadata: Record<string, unknown>
): {
  status: SourceClaimAuthorityStatus;
  reasons: SourceClaimAuthorityReason[];
} | undefined => {
  const value = metadataRecordValue(metadata.sourceClaimAuthority);

  if (value === undefined) {
    return undefined;
  }

  const status = readMetadataString(value, "status");
  const reasons = readMetadataStringList(value, "reasons")
    .filter((reason): reason is SourceClaimAuthorityReason =>
      includesValue(sourceClaimAuthorityReasons, reason));

  if (
    status === undefined ||
    !includesValue(sourceClaimAuthorityStatuses, status) ||
    reasons.length === 0
  ) {
    return undefined;
  }

  return { status, reasons };
};

const sourceDecisionSupportTargetsFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketSourceDecisionSupportTarget[] => {
  const value = metadata.targets;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = metadataRecordValue(item);

    if (record === undefined) {
      return [];
    }

    const sourceDecisionEdgeId = readMetadataString(record, "sourceDecisionEdgeId");
    const targetType = readMetadataString(record, "targetType");
    const targetId = readMetadataString(record, "targetId");

    if (
      sourceDecisionEdgeId === undefined ||
      targetType === undefined ||
      !includesValue(sourceDecisionTargetTypes, targetType) ||
      targetId === undefined
    ) {
      return [];
    }

    return [{ sourceDecisionEdgeId, targetType, targetId }];
  });
};

export const sourceDecisionSupportBoostFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketSourceDecisionSupportBoost | undefined => {
  const value = metadataRecordValue(metadata.sourceDecisionSupportBoost);

  if (value === undefined) {
    return undefined;
  }

  const sourceDecisionEdgeIds = readMetadataStringList(value, "sourceDecisionEdgeIds");
  const sourceDecisionIds = readMetadataStringList(value, "sourceDecisionIds");
  const targets = sourceDecisionSupportTargetsFromMetadata(value);
  const confidence = readMetadataStringList(value, "confidence");
  const supportTypes = readMetadataStringList(value, "supportTypes");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    sourceDecisionEdgeIds.length === 0 ||
    targets.length === 0 ||
    confidence.length === 0 ||
    supportTypes.length === 0 ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    sourceDecisionEdgeIds,
    ...(sourceDecisionIds.length === 0 ? {} : { sourceDecisionIds }),
    targets,
    confidence,
    supportTypes,
    doesNotProve
  };
};

export const pendingAntiMemoryReviewFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketPendingAntiMemoryReview | undefined => {
  const value = metadataRecordValue(metadata.pendingAntiMemoryReview);

  if (value === undefined) {
    return undefined;
  }

  const antiMemoryCandidateIds = readMetadataStringList(value, "antiMemoryCandidateIds");
  const feedbackDeltaIds = readMetadataStringList(value, "feedbackDeltaIds");
  const subjectRefs = readMetadataStringList(value, "subjectRefs");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (antiMemoryCandidateIds.length === 0 || doesNotProve === undefined) {
    return undefined;
  }

  return {
    antiMemoryCandidateIds,
    feedbackDeltaIds,
    subjectRefs,
    doesNotProve
  };
};

export const projectStandardDecisionFromMetadata = (
  metadata: Record<string, unknown>
): ProjectStandardDecisionReadback | undefined => {
  const value = metadataRecordValue(metadata.projectStandardDecision);

  if (value === undefined) {
    return undefined;
  }

  const kind = readMetadataString(value, "kind");
  const memoryRecordId = readMetadataString(value, "memoryRecordId");
  const key = readMetadataString(value, "key");
  const sourceRefs = readMetadataStringList(value, "sourceRefs");
  const mechanism = readMetadataString(value, "mechanism");
  const krnImplication = readMetadataString(value, "krnImplication");
  const decision = readMetadataString(value, "decision");
  const consumer = readMetadataString(value, "consumer");
  const falsifier = readMetadataString(value, "falsifier");
  const validFrom = readMetadataString(value, "validFrom");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    kind !== "krn.projectStandardDecision.v1" ||
    memoryRecordId === undefined ||
    key === undefined ||
    sourceRefs.length === 0 ||
    mechanism === undefined ||
    krnImplication === undefined ||
    decision === undefined ||
    consumer === undefined ||
    falsifier === undefined ||
    validFrom === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  const validUntil = readMetadataString(value, "validUntil");
  const rejectedPath = readMetadataString(value, "rejectedPath");

  return {
    kind,
    memoryRecordId,
    key,
    sourceRefs,
    mechanism,
    krnImplication,
    decision,
    consumer,
    falsifier,
    validFrom,
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(rejectedPath === undefined ? {} : { rejectedPath }),
    doesNotProve
  };
};

export const projectDecisionPacketActivationCandidate = (
  candidate: RetrievalCandidateRecord
) => {
  const sourceClaimAuthority = sourceClaimAuthorityFromMetadata(candidate.metadata);
  const projectStandardDecision = projectStandardDecisionFromMetadata(candidate.metadata);
  const sourceClaimEdgeInfluence = sourceClaimEdgeInfluenceFromMetadata(candidate.metadata);
  const sourceDecisionSupportBoost = sourceDecisionSupportBoostFromMetadata(candidate.metadata);
  const sourceRejectionIds = readMetadataStringList(candidate.metadata, "sourceRejectionIds");
  const pendingAntiMemoryReview = pendingAntiMemoryReviewFromMetadata(candidate.metadata);

  return {
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    ...(sourceClaimAuthority === undefined
      ? {}
      : {
          sourceClaimAuthorityStatus: sourceClaimAuthority.status,
          sourceClaimAuthorityReasons: sourceClaimAuthority.reasons
        }),
    ...(projectStandardDecision === undefined ? {} : { projectStandardDecision }),
    ...(sourceClaimEdgeInfluence === undefined ? {} : { sourceClaimEdgeInfluence }),
    ...(sourceDecisionSupportBoost === undefined ? {} : { sourceDecisionSupportBoost }),
    ...(sourceRejectionIds.length === 0 ? {} : { sourceRejectionIds }),
    ...(pendingAntiMemoryReview === undefined ? {} : { pendingAntiMemoryReview })
  } satisfies DecisionPacketActivationCandidateInput;
};

export const projectDecisionPacketActivationDecision = (
  decision: ActivationDecisionRecord
) => {
  const antiMemoryRecordId = readMetadataString(decision.metadata, "antiMemoryRecordId");

  return {
    reason: decision.reason,
    ...(antiMemoryRecordId === undefined ? {} : { antiMemoryRecordId })
  } satisfies DecisionPacketActivationDecisionInput;
};

export const projectDecisionPacketTask = (
  taskContract: HarnessRunAggregate["taskContract"]
) => ({
  id: taskContract.id,
  title: taskContract.title,
  objective: taskContract.objective,
  constraints: [...taskContract.constraints],
  nonGoals: [...taskContract.nonGoals],
  acceptance: [...taskContract.acceptance],
  status: taskContract.status
}) satisfies DecisionPacketTask;

const activationTraceForAuthority = (
  aggregate: HarnessRunAggregate
): DecisionPacketActivationTraceInput | undefined => aggregate.activationTrace === undefined
  ? undefined
  : {
      candidates: aggregate.activationTrace.candidates.map(
        projectDecisionPacketActivationCandidate
      ),
      decisions: aggregate.activationTrace.decisions.map(projectDecisionPacketActivationDecision)
    };

const feedbackDeltaForAuthority = (
  feedback: HarnessRunAggregate["feedbackDeltas"][number]
): DecisionPacketReadModelInput["feedbackDeltas"][number] => ({
  candidates: [],
  sourceUsefulnessOutcomes: sourceUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    ...(outcome.sourceClaimId === undefined ? {} : { sourceClaimId: outcome.sourceClaimId }),
    ...(outcome.sourceDecisionId === undefined
      ? {}
      : { sourceDecisionId: outcome.sourceDecisionId }),
    outcome: outcome.outcome,
    reason: outcome.reason
  })),
  knowledgeUsefulnessOutcomes: knowledgeUsefulnessOutcomesFromMetadata(feedback.metadata)
    .map((outcome) => ({
      knowledgeId: outcome.knowledgeId,
      outcome: outcome.outcome,
      reason: outcome.reason
    }))
});

export const buildDecisionPacketAuthorityProjection = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModelInput => {
  const activationTrace = activationTraceForAuthority(aggregate);
  const evidenceContractActivation = decideEvidenceContractActivation({
    evidenceContract: aggregate.harnessPlan.metadata.evidenceContract,
    taskContract: aggregate.taskContract,
    harnessPlan: aggregate.harnessPlan,
    executionRun: aggregate.executionRun
  });

  return {
    run: {
      id: aggregate.executionRun.id,
      status: aggregate.executionRun.status,
      lifecycleRevision: aggregate.executionRun.lifecycleRevision,
      updatedAt: aggregate.executionRun.updatedAt
    },
    task: projectDecisionPacketTask(aggregate.taskContract),
    ...(aggregate.harnessPlan.nextAction === undefined
      ? {}
      : { nextAction: aggregate.harnessPlan.nextAction }),
    context: {
      inclusions: aggregate.contextAssembly?.inclusions.length ?? 0,
      exclusions: aggregate.contextAssembly?.exclusions.length ?? 0,
      inclusionDetails: aggregate.contextAssembly?.inclusions.map((inclusion) => ({
        subjectType: inclusion.subjectType,
        subjectId: inclusion.subjectId,
        reason: inclusion.reason,
        expectedUse: inclusion.expectedUse,
        sourceAuthority: inclusion.sourceAuthority
      })) ?? [],
      exclusionDetails: aggregate.contextAssembly?.exclusions.map((exclusion) => ({
        subjectType: exclusion.subjectType,
        subjectId: exclusion.subjectId,
        reason: exclusion.reason,
        explanation: exclusion.explanation,
        sourceAuthority: exclusion.sourceAuthority
      })) ?? [],
      ...(activationTrace === undefined ? {} : { activationTrace })
    },
    evidenceContractActivation,
    ...(evidenceContractActivation.evidenceContract === undefined
      ? {}
      : { evidenceContract: evidenceContractActivation.evidenceContract }),
    evidenceBundles: [],
    feedbackDeltas: aggregate.feedbackDeltas.map(feedbackDeltaForAuthority),
    proof: {
      doesNotProve: [...decisionPacketReadModelDoesNotProve]
    }
  };
};

const currentDecisionPacketReadback = (input: {
  aggregate: HarnessRunAggregate;
  packetGeneratedAt: IsoTimestamp;
  sha256Hex(value: string): string;
}) => buildDecisionPacketContractReadback({
  readModel: buildDecisionPacketAuthorityProjection(input.aggregate),
  generatedAt: input.packetGeneratedAt,
  sha256Hex: input.sha256Hex
});

export const currentDecisionPacketBindingForHarnessRun = (input: {
  aggregate: HarnessRunAggregate;
  packetGeneratedAt: IsoTimestamp;
  sha256Hex(value: string): string;
}): DecisionPacketBinding => {
  const packetIdentity = currentDecisionPacketReadback(input).packetIdentity;

  return {
    packetChecksum: packetIdentity.checksum,
    packetEvidenceRef: packetIdentity.evidenceRef,
    packetGeneratedAt: packetIdentity.generatedAt,
    sourceRunLifecycleRevision: packetIdentity.sourceRunLifecycleRevision
  };
};

const normalizePacketGeneratedAt = (
  packetGeneratedAt: IsoTimestamp | undefined
): IsoTimestamp | undefined => {
  const normalized = packetGeneratedAt?.trim();

  if (
    normalized === undefined ||
    normalized.length === 0 ||
    !isIsoTimestamp(normalized)
  ) {
    return undefined;
  }

  return normalized;
};

const rejectDecisionPacketAuthorization = (
  input: DecisionPacketBindingAuthorizationInput,
  reason: string
): DecisionPacketAuthorization => ({
  authorized: false,
  reason,
  ...(input.aggregate.taskContract.projectId === undefined
    ? {}
    : { projectId: input.aggregate.taskContract.projectId })
});

export const authorizeDecisionPacketBinding = (
  input: DecisionPacketBindingAuthorizationInput
): DecisionPacketAuthorization => {
  const reject = (reason: string): DecisionPacketAuthorization =>
    rejectDecisionPacketAuthorization(input, reason);

  if (input.runId !== input.aggregate.executionRun.id) {
    return reject("DecisionPacket binding rejected: run id does not match the fetched harness run");
  }

  const taskProjectId = input.aggregate.taskContract.projectId;

  if (taskProjectId === undefined) {
    return reject("DecisionPacket binding rejected: run task has no project identity");
  }

  if (input.runtimeProjectId !== taskProjectId) {
    return reject("DecisionPacket binding rejected: runtime project does not match the run task project");
  }

  const packetGeneratedAt = normalizePacketGeneratedAt(input.callerPacketGeneratedAt);

  if (packetGeneratedAt === undefined) {
    return reject("DecisionPacket binding rejected: exact DecisionPacket generatedAt is required");
  }

  const currentBinding = currentDecisionPacketBindingForHarnessRun({
    aggregate: input.aggregate,
    packetGeneratedAt,
    sha256Hex: input.sha256Hex
  });

  if (input.callerPacketChecksum !== currentBinding.packetChecksum) {
    return reject(
      "DecisionPacket binding rejected: packet checksum is not the current reconstructed packet checksum"
    );
  }

  return {
    authorized: true,
    ...currentBinding,
    projectId: taskProjectId
  };
};

const selectedSubjectIds = (input: {
  aggregate: HarnessRunAggregate;
  packetGeneratedAt: IsoTimestamp;
  sha256Hex(value: string): string;
}): ReadonlyMap<DecisionPacketUsefulnessSubjectKind, ReadonlySet<string>> => {
  const packet = currentDecisionPacketReadback(input).packet;

  return new Map([
    ["source_claim", new Set([
      ...packet.sourceClaimIds,
      ...packet.brief.includedSourceClaimIds
    ])],
    ["source_decision", new Set<string>()],
    ["knowledge", new Set([
      ...packet.memoryRefs,
      ...packet.taskStandardDecisions.map((decision) => decision.memoryRecordId),
      ...packet.brief.includedMemoryRecordIds
    ])],
    ["memory_record", new Set([
      ...packet.memoryRefs,
      ...packet.taskStandardDecisions.map((decision) => decision.memoryRecordId),
      ...packet.brief.includedMemoryRecordIds
    ])]
  ]);
};

export const authorizeDecisionPacketUsefulness = (
  input: DecisionPacketUsefulnessAuthorizationInput
): DecisionPacketAuthorization => {
  const authorization = authorizeDecisionPacketBinding(input);

  if (!authorization.authorized) {
    return authorization;
  }

  const subjects = selectedSubjectIds({
    aggregate: input.aggregate,
    packetGeneratedAt: authorization.packetGeneratedAt,
    sha256Hex: input.sha256Hex
  });

  for (const subject of input.subjects) {
    if (!subjects.get(subject.kind)?.has(subject.id)) {
      return rejectDecisionPacketAuthorization(
        input,
        `usefulness write rejected: ${subject.kind}:${subject.id} is not selected by the current packet`
      );
    }

    if (
      subject.evidenceRefs !== undefined &&
      !subject.evidenceRefs.includes(authorization.packetEvidenceRef)
    ) {
      return rejectDecisionPacketAuthorization(
        input,
        `usefulness write rejected: ${subject.kind}:${subject.id} lacks the current packet evidence ref`
      );
    }
  }

  return authorization;
};

export const decisionPacketUsefulnessAuthorizationDowngradeReason = (
  authorization: DecisionPacketAuthorization
): string => authorization.authorized
  ? "Downgraded: usefulness write was not authorized by the current packet."
  : authorization.reason;
