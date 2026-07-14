import {
  isReviewableFeedbackOutcome,
  type FeedbackCandidateProposalKind,
  type SourceUsefulnessOutcome
} from "./feedback-delta.js";
import { sourceClaimAuthorityStateFor } from "./source-authority.js";
import type {
  ContextSubjectType
} from "./context-assembly.js";
import type {
  ProjectStandardDecisionReadback
} from "./memory.js";
import type {
  EvidenceContract,
  EvidenceContractActivationDecision
} from "./evidence-contract.js";
import type {
  DiffRisk
} from "./evidence-bundle.js";
import type {
  ExecutionRunStatus
} from "./execution-run.js";
import type {
  SourceAuthorityLabel,
  SourceClaimEdgeKind,
  SourceClaimAuthorityReason,
  SourceClaimAuthorityState,
  SourceClaimAuthorityStatus,
  SourceDecisionTargetType
} from "./source.js";

export const decisionPacketFormatVersion = "krn.decisionPacket.v1" as const;

export const decisionPacketMissingActiveEvidenceContractGapId =
  "evidence-gap:missing-active-contract" as const;

export type DecisionPacketFormatVersion = typeof decisionPacketFormatVersion;

export interface DecisionPacketBriefSummary {
  includedContextCount: number;
  observationPrefixCount: number;
  explicitExclusionCount: number;
  sourceClaimUseCount: number;
  memoryRecordUseCount: number;
  includedSourceClaimIds: readonly string[];
  includedMemoryRecordIds: readonly string[];
  excludedSourceClaimIds: readonly string[];
  excludedMemoryRecordIds: readonly string[];
  excludedAntiMemoryRecordIds: readonly string[];
  evidenceGapIds: readonly string[];
}

export interface DecisionPacketEvidenceGap {
  id: string;
  reason: string;
  verificationRequired: string;
}

export interface DecisionPacketTaskStandard {
  memoryRecordId: string;
  key: string;
  sourceRefs: readonly string[];
  mechanism: string;
  krnImplication: string;
  decision: string;
  consumer: string;
  falsifier: string;
  validFrom: string;
  validUntil?: string;
  rejectedPath?: string;
  doesNotProve: string;
}

export interface DecisionPacketSourceConsensus {
  decisionLinkedSourceClaimIds: readonly string[];
  caveatedSourceClaimIds: readonly string[];
  unsupportedSourceClaimIds: readonly string[];
  conflictingSourceClaimIds: readonly string[];
  unknownSourceClaimIds: readonly string[];
  sourceDecisionEdgeIds: readonly string[];
  sourceDecisionTargets: readonly DecisionPacketSourceDecisionTarget[];
  staleDecisionIds: readonly string[];
  supersededPathIds: readonly string[];
  rejectedPathIds: readonly string[];
  sourceRejectionIds: readonly string[];
  conflictedDecisionIds: readonly string[];
  evidenceGapIds: readonly string[];
  doesNotProve: string;
}

export interface DecisionPacketSourceDecisionTarget {
  targetType: SourceDecisionTargetType;
  targetId: string;
  sourceDecisionEdgeIds: readonly string[];
}

export interface DecisionPacketTask {
  id: string;
  title: string;
  objective: string;
  constraints: readonly string[];
  nonGoals: readonly string[];
  acceptance: readonly string[];
}

export interface DecisionPacketContextInclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  sourceAuthority: SourceAuthorityLabel;
}

export interface DecisionPacketContextExclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  sourceAuthority: SourceAuthorityLabel;
}

export interface DecisionPacketEvidenceContract {
  commands: readonly {
    command: string;
    required: boolean;
  }[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
}

export type DecisionPacketAbstentionStatus =
  | "ready"
  | "weak_context"
  | "abstain";

export type DecisionPacketAbstentionReason =
  | "missing_governing_decision"
  | "missing_decision_linked_source"
  | "caveated_source_authority"
  | "caveated_memory_authority"
  | "stale_authority"
  | "missing_rejected_path_evidence"
  | "conflicting_authority"
  | "unresolved_accepted_source_dissent"
  | "evidence_gap";

export interface DecisionPacketAbstentionScore {
  status: DecisionPacketAbstentionStatus;
  score: number;
  reasons: readonly DecisionPacketAbstentionReason[];
  evidenceGapIds: readonly string[];
  doesNotProve: string;
}

const unique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)];

const contextSubjectIds = (
  items: readonly {
    subjectType: ContextSubjectType;
    subjectId: string;
  }[],
  subjectType: ContextSubjectType
): readonly string[] => unique(items
  .filter((item) => item.subjectType === subjectType)
  .map((item) => item.subjectId));

export const decisionPacketNegativePathsForContext = (input: {
  readonly contextInclusions: readonly DecisionPacketContextInclusion[];
  readonly contextExclusions: readonly DecisionPacketContextExclusion[];
}): {
  readonly rejectedPathIds: readonly string[];
  readonly supersededPathIds: readonly string[];
} => ({
  rejectedPathIds: unique([
    ...contextSubjectIds(input.contextInclusions, "anti_memory_record"),
    ...contextSubjectIds(input.contextExclusions, "anti_memory_record")
  ]),
  supersededPathIds: unique(input.contextExclusions
    .filter((item) => item.subjectType === "source_claim" && item.reason === "superseded")
    .map((item) => item.subjectId))
});

const decisionLinkedSourceClaimIdsFor = (input: {
  readonly sourceClaimIds: readonly string[];
  readonly caveatedSourceClaimIds: readonly string[];
  readonly conflictingSourceClaimIds: readonly string[];
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
}): string[] => {
  if (input.unresolvedAcceptedDissentSourceClaimIds.length > 0) {
    return [];
  }

  const nonGoverningSourceClaimIds = new Set([
    ...input.caveatedSourceClaimIds,
    ...input.conflictingSourceClaimIds
  ]);

  return unique(input.sourceClaimIds.filter((sourceClaimId) =>
    !nonGoverningSourceClaimIds.has(sourceClaimId)
  ));
};

const governingSourceClaimIdsFor = (input: {
  readonly sourceClaimIds: readonly string[];
  readonly conflictingSourceClaimIds: readonly string[];
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
}): string[] => {
  if (input.unresolvedAcceptedDissentSourceClaimIds.length > 0) {
    return [];
  }

  const conflictingSourceClaimIds = new Set(input.conflictingSourceClaimIds);

  return unique(input.sourceClaimIds.filter((sourceClaimId) =>
    !conflictingSourceClaimIds.has(sourceClaimId)
  ));
};

export const buildDecisionPacketSourceConsensus = (input: {
  readonly sourceClaimIds: readonly string[];
  readonly caveatedSourceClaimIds: readonly string[];
  readonly unsupportedSourceClaimIds: readonly string[];
  readonly conflictingSourceClaimIds: readonly string[];
  readonly unknownSourceClaimIds: readonly string[];
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
  readonly sourceDecisionEdgeIds: readonly string[];
  readonly sourceDecisionTargets: readonly DecisionPacketSourceDecisionTarget[];
  readonly staleDecisionIds: readonly string[];
  readonly supersededPathIds: readonly string[];
  readonly rejectedPathIds: readonly string[];
  readonly sourceRejectionIds: readonly string[];
  readonly conflictedDecisionIds: readonly string[];
  readonly evidenceGapIds: readonly string[];
}): DecisionPacketSourceConsensus => {
  return {
    decisionLinkedSourceClaimIds: decisionLinkedSourceClaimIdsFor(input),
    caveatedSourceClaimIds: unique(input.caveatedSourceClaimIds),
    unsupportedSourceClaimIds: unique(input.unsupportedSourceClaimIds),
    conflictingSourceClaimIds: unique(input.conflictingSourceClaimIds),
    unknownSourceClaimIds: unique(input.unknownSourceClaimIds),
    sourceDecisionEdgeIds: unique(input.sourceDecisionEdgeIds),
    sourceDecisionTargets: input.sourceDecisionTargets,
    staleDecisionIds: unique(input.staleDecisionIds),
    supersededPathIds: unique(input.supersededPathIds),
    rejectedPathIds: unique(input.rejectedPathIds),
    sourceRejectionIds: unique(input.sourceRejectionIds),
    conflictedDecisionIds: unique(input.conflictedDecisionIds),
    evidenceGapIds: unique(input.evidenceGapIds),
    doesNotProve:
      "DecisionPacket source consensus summarizes selected packet signals; it does not prove source truth, complete graph consensus, or repository-wide conflict resolution."
  };
};

const scoreFloor = (value: number): number => Math.max(0, value);

export const buildDecisionPacketAbstentionScore = (input: {
  readonly governingDecisionIds: readonly string[];
  readonly sourceConsensus: DecisionPacketSourceConsensus;
}): DecisionPacketAbstentionScore => {
  const reasons: DecisionPacketAbstentionReason[] = [];
  let score = 100;

  if (input.governingDecisionIds.length === 0) {
    reasons.push("missing_governing_decision");
    score -= 60;
  }

  if (input.sourceConsensus.evidenceGapIds.length > 0) {
    reasons.push("evidence_gap");
    score -= 40;
  }

  if (
    input.governingDecisionIds.length > 0 &&
    input.sourceConsensus.decisionLinkedSourceClaimIds.length === 0
  ) {
    reasons.push("missing_decision_linked_source");
    score -= 35;
  }

  if (input.sourceConsensus.caveatedSourceClaimIds.length > 0) {
    reasons.push("caveated_source_authority");
    score -= 20;
  }

  if (input.sourceConsensus.conflictingSourceClaimIds.length > 0) {
    reasons.push("conflicting_authority");
    score -= 35;
  }

  if (input.sourceConsensus.evidenceGapIds.some((id) =>
    id.includes(":unresolved-accepted-source-dissent:")
  )) {
    reasons.push("unresolved_accepted_source_dissent");
    score -= 60;
  }

  if (input.sourceConsensus.evidenceGapIds.some((id) =>
    id.includes(":caveated-memory-authority:")
  )) {
    reasons.push("caveated_memory_authority");
    score -= 20;
  }

  if (input.sourceConsensus.conflictedDecisionIds.length > 0) {
    reasons.push("stale_authority");
    score -= 35;
  }

  if (
    input.governingDecisionIds.length > 0 &&
    input.sourceConsensus.rejectedPathIds.length === 0 &&
    input.sourceConsensus.sourceRejectionIds.length === 0
  ) {
    reasons.push("missing_rejected_path_evidence");
    score -= 10;
  }

  const boundedScore = scoreFloor(score);
  const status: DecisionPacketAbstentionStatus =
    reasons.includes("missing_governing_decision") ||
    reasons.includes("evidence_gap") ||
    reasons.includes("missing_decision_linked_source") ||
    reasons.includes("unresolved_accepted_source_dissent")
      ? "abstain"
      : reasons.length > 0
        ? "weak_context"
        : "ready";

  return {
    status,
    score: boundedScore,
    reasons: unique(reasons),
    evidenceGapIds: input.sourceConsensus.evidenceGapIds,
    doesNotProve:
      "DecisionPacket abstention score is a deterministic packet-readiness signal; it does not prove source truth, live Codex obedience, or that missing rejected paths are required for every task."
  };
};

export interface DecisionPacket {
  formatVersion: DecisionPacketFormatVersion;
  task: DecisionPacketTask;
  contextInclusions: readonly DecisionPacketContextInclusion[];
  contextExclusions: readonly DecisionPacketContextExclusion[];
  toolBoundaries: readonly string[];
  evidenceContract?: DecisionPacketEvidenceContract;
  nextAction: string;
  governingDecisionIds: readonly string[];
  governingStatements: readonly string[];
  taskStandardDecisions: readonly DecisionPacketTaskStandard[];
  sourceClaimIds: readonly string[];
  caveatedSourceClaimIds: readonly string[];
  sourceDecisionEdgeIds: readonly string[];
  sourceDecisionTargets: readonly DecisionPacketSourceDecisionTarget[];
  sourceRejectionIds: readonly string[];
  memoryRefs: readonly string[];
  caveatedMemoryRefs: readonly string[];
  staleDecisionIds: readonly string[];
  staleKnowledgeIds: readonly string[];
  noiseKnowledgeIds: readonly string[];
  unknownKnowledgeIds: readonly string[];
  supersededPathIds: readonly string[];
  rejectedPathIds: readonly string[];
  falsifiers: readonly string[];
  verificationCommands: readonly string[];
  evidenceGaps: readonly DecisionPacketEvidenceGap[];
  sourceConsensus: DecisionPacketSourceConsensus;
  abstentionScore: DecisionPacketAbstentionScore;
  doesNotProve: readonly string[];
  nonProofs: readonly string[];
  noiseDecisionIds: readonly string[];
  severeStaleAuthorityIds: readonly string[];
  brief: DecisionPacketBriefSummary;
}

export interface DecisionPacketReadModelInput {
  run: {
    id: string;
    status: ExecutionRunStatus;
    lifecycleRevision: number;
    updatedAt: string;
  };
  context: {
    inclusions: number;
    exclusions: number;
    inclusionDetails: readonly DecisionPacketContextInclusionInput[];
    exclusionDetails?: readonly DecisionPacketContextExclusionInput[];
    activationTrace?: DecisionPacketActivationTraceInput;
  };
  task?: DecisionPacketTask;
  toolBoundaries?: readonly string[];
  nextAction?: string;
  evidenceContractActivation: EvidenceContractActivationDecision;
  evidenceContract?: Pick<EvidenceContract, "commands" | "diffRisk" | "reviewBurden" | "rollbackPath">;
  evidenceBundles: readonly DecisionPacketEvidenceBundleInput[];
  feedbackDeltas: readonly DecisionPacketFeedbackDeltaInput[];
  proof: {
    doesNotProve: readonly string[];
  };
}

export interface DecisionPacketContextInclusionInput {
  subjectType: ContextSubjectType;
  subjectId: string;
  sourceAuthority: SourceAuthorityLabel;
  reason?: string;
  expectedUse?: string;
}

export interface DecisionPacketContextExclusionInput {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation?: string;
  sourceAuthority?: SourceAuthorityLabel;
}

export interface DecisionPacketActivationTraceInput {
  candidates: readonly DecisionPacketActivationCandidateInput[];
  decisions: readonly DecisionPacketActivationDecisionInput[];
}

export interface DecisionPacketActivationCandidateInput {
  subjectType: string;
  subjectId: string;
  sourceClaimAuthorityStatus?: SourceClaimAuthorityStatus;
  sourceClaimAuthorityReasons?: readonly SourceClaimAuthorityReason[];
  projectStandardDecision?: ProjectStandardDecisionReadback;
  sourceClaimEdgeInfluence?: {
    edgeIds: readonly string[];
    edgeKinds: readonly SourceClaimEdgeKind[];
    missingRelationSupportEdgeIds?: readonly string[];
    seedSourceClaimIds: readonly string[];
    doesNotProve: string;
  };
  sourceDecisionSupportBoost?: {
    sourceDecisionEdgeIds: readonly string[];
    sourceDecisionIds?: readonly string[];
    targets: readonly {
      sourceDecisionEdgeId: string;
      targetType: SourceDecisionTargetType;
      targetId: string;
    }[];
  };
  sourceRejectionIds?: readonly string[];
  pendingAntiMemoryReview?: {
    antiMemoryCandidateIds: readonly string[];
    feedbackDeltaIds: readonly string[];
    subjectRefs: readonly string[];
    doesNotProve: string;
  };
}

export interface DecisionPacketActivationDecisionInput {
  reason: string;
  antiMemoryRecordId?: string;
}

export interface DecisionPacketEvidenceBundleInput {
  commands: readonly {
    command: string;
  }[];
}

export interface DecisionPacketFeedbackDeltaInput {
  candidates: readonly {
    kind: FeedbackCandidateProposalKind;
    id: string;
    status: string;
  }[];
  sourceUsefulnessOutcomes: readonly {
    sourceClaimId?: string;
    sourceDecisionId?: string;
    outcome: SourceUsefulnessOutcome;
    reason: string;
  }[];
  knowledgeUsefulnessOutcomes: readonly {
    knowledgeId: string;
    outcome: SourceUsefulnessOutcome;
    reason: string;
  }[];
}

export interface DecisionPacketIdentity {
  packetId: string;
  checksumAlgorithm: "sha256";
  checksum: string;
  evidenceRef: string;
  generatedAt: string;
  sourceRunStatus: ExecutionRunStatus;
  sourceRunLifecycleRevision: number;
  sourceRunUpdatedAt: string;
  freshness: {
    status: "current_read_model_snapshot";
    doesNotProve: string;
  };
}

export interface DecisionPacketReturnChannels {
  evidence: {
    command: string;
    persistedCommand: string;
    doesNotProve: string;
  };
  feedback: {
    memoryRecordApplyExample: string;
    sourceUsefulnessExample: string;
    sourceDecisionUsefulnessExample: string;
    knowledgeUsefulnessExample: string;
    doesNotProve: string;
  };
}

export interface DecisionPacketContractReadback {
  kind: "krn.decisionPacketReadback.v1";
  access: "read_only";
  mutation: "none";
  surface: "headless_cli";
  request: {
    runId: string;
  };
  packetIdentity: DecisionPacketIdentity;
  packet: DecisionPacket;
  returnChannels: DecisionPacketReturnChannels;
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
}

export type DecisionPacketSha256Hex = (value: string) => string;

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

const sourceDecisionEdgeIdsFor = (
  readModel: DecisionPacketReadModelInput,
  sourceClaimIds: readonly string[]
): string[] => unique(includedActivationCandidatesFor(readModel).flatMap((candidate) =>
  candidate.subjectType === "source_claim" && sourceClaimIds.includes(candidate.subjectId)
    ? candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds ?? []
    : []
) ?? []);

const sourceDecisionTargetsFor = (
  readModel: DecisionPacketReadModelInput,
  sourceClaimIds: readonly string[]
): DecisionPacketSourceDecisionTarget[] => {
  const allowedSourceClaimIds = new Set(sourceClaimIds);
  const targetByKey = new Map<string, {
    targetType: SourceDecisionTargetType;
    targetId: string;
    sourceDecisionEdgeIds: string[];
  }>();

  for (const target of includedActivationCandidatesFor(readModel).flatMap((candidate) =>
    candidate.subjectType === "source_claim" && allowedSourceClaimIds.has(candidate.subjectId)
      ? candidate.sourceDecisionSupportBoost?.targets ?? []
      : []
  ) ?? []) {
    const key = `${target.targetType}:${target.targetId}`;
    const existing = targetByKey.get(key);

    targetByKey.set(key, {
      targetType: target.targetType,
      targetId: target.targetId,
      sourceDecisionEdgeIds: unique([
        ...(existing?.sourceDecisionEdgeIds ?? []),
        target.sourceDecisionEdgeId
      ])
    });
  }

  return [...targetByKey.values()];
};

const architectureDecisionTargetIdsFor = (
  sourceDecisionTargets: readonly DecisionPacketSourceDecisionTarget[]
): string[] => unique(sourceDecisionTargets.flatMap((target) =>
  target.targetType === "architecture_decision" ? [target.targetId] : []
));

const sourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.inclusionDetails
  .filter((inclusion) => inclusion.subjectType === "source_claim")
  .map((inclusion) => inclusion.subjectId));

const includedActivationCandidatesFor = (
  readModel: DecisionPacketReadModelInput
): readonly DecisionPacketActivationCandidateInput[] => {
  const includedSubjectKeys = new Set(readModel.context.inclusionDetails.map((inclusion) =>
    `${inclusion.subjectType}:${inclusion.subjectId}`
  ));

  return readModel.context.activationTrace?.candidates.filter((candidate) =>
    includedSubjectKeys.has(`${candidate.subjectType}:${candidate.subjectId}`)
  ) ?? [];
};

const sourceDecisionIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(includedActivationCandidatesFor(readModel).flatMap((candidate) =>
  candidate.subjectType === "source_claim"
    ? candidate.sourceDecisionSupportBoost?.sourceDecisionIds ?? []
    : []
));

const sourceClaimAuthorityCandidateFor = (
  readModel: DecisionPacketReadModelInput,
  sourceClaimId: string
): DecisionPacketActivationCandidateInput | undefined =>
  includedActivationCandidatesFor(readModel).find((candidate) =>
    candidate.subjectType === "source_claim" && candidate.subjectId === sourceClaimId
  );

const sourceClaimIdsWithAuthorityState = (
  readModel: DecisionPacketReadModelInput,
  state: SourceClaimAuthorityState
): string[] => sourceClaimIdsFor(readModel).filter((sourceClaimId) => {
  const candidate = sourceClaimAuthorityCandidateFor(readModel, sourceClaimId);

  return candidate?.sourceClaimAuthorityStatus !== undefined &&
    sourceClaimAuthorityStateFor({
      status: candidate.sourceClaimAuthorityStatus,
      reasons: candidate.sourceClaimAuthorityReasons ?? []
    }) === state;
});

const unsupportedSourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => sourceClaimIdsWithAuthorityState(readModel, "unsupported");

const conflictingSourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique([
  ...sourceClaimIdsWithAuthorityState(readModel, "conflicting"),
  ...sourceClaimIdsFor(readModel).filter((sourceClaimId) =>
    sourceClaimAuthorityCandidateFor(readModel, sourceClaimId)?.sourceClaimEdgeInfluence?.edgeKinds.some((kind) =>
      kind === "contradicts" || kind === "invalidates"
    ) === true
  )
]);

const unresolvedAcceptedDissentSourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => sourceClaimIdsFor(readModel).filter((sourceClaimId) =>
  sourceClaimAuthorityCandidateFor(readModel, sourceClaimId)
    ?.sourceClaimAuthorityReasons?.includes("accepted_with_dissenting_source_claims") === true
);

const unknownSourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => sourceClaimIdsFor(readModel).filter((sourceClaimId) => {
  const candidate = sourceClaimAuthorityCandidateFor(readModel, sourceClaimId);
  return candidate === undefined || (
    candidate.sourceClaimAuthorityStatus === undefined &&
    candidate.sourceClaimAuthorityReasons === undefined &&
    candidate.sourceDecisionSupportBoost === undefined
  );
});

const sourceClaimIdsWithDecisionSupportFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(includedActivationCandidatesFor(readModel).flatMap((candidate) =>
  candidate.subjectType === "source_claim" &&
  (candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds.length ?? 0) > 0
    ? [candidate.subjectId]
    : []
) ?? []);

const sourceClaimIdsWithReviewableFeedback = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
    outcome.sourceClaimId !== undefined && isReviewableFeedbackOutcome(outcome.outcome)
      ? [outcome.sourceClaimId]
      : []
  )
));

const caveatedSourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => {
  const supportedSourceClaimIds = new Set(sourceClaimIdsWithDecisionSupportFor(readModel));
  const maintenanceFeedbackSourceClaimIds = new Set(sourceClaimIdsWithReviewableFeedback(readModel));
  const pendingAntiMemoryReviewSourceClaimIds = new Set(
    includedActivationCandidatesFor(readModel).flatMap((candidate) =>
      candidate.subjectType === "source_claim" &&
      candidate.pendingAntiMemoryReview !== undefined
        ? [candidate.subjectId]
        : []
    ) ?? []
  );

  return sourceClaimIdsFor(readModel).filter((sourceClaimId) =>
    !supportedSourceClaimIds.has(sourceClaimId) ||
    maintenanceFeedbackSourceClaimIds.has(sourceClaimId) ||
    pendingAntiMemoryReviewSourceClaimIds.has(sourceClaimId)
  );
};

const sourceDecisionIdsWithUsefulness = (
  readModel: DecisionPacketReadModelInput,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => {
  const selectedSourceDecisionIds = new Set(sourceDecisionIdsFor(readModel));

  return unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
    outcome.sourceDecisionId !== undefined &&
    selectedSourceDecisionIds.has(outcome.sourceDecisionId) &&
    outcomes.includes(outcome.outcome)
      ? [outcome.sourceDecisionId]
      : []
  )
  ));
};

const memoryRefsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.inclusionDetails
  .filter((inclusion) => inclusion.subjectType === "memory_record")
  .map((inclusion) => inclusion.subjectId));

const knowledgeIdsWithUsefulness = (
  readModel: DecisionPacketReadModelInput,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => {
  const selectedMemoryIds = new Set(memoryRefsFor(readModel));

  return unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.knowledgeUsefulnessOutcomes.flatMap((outcome) =>
    selectedMemoryIds.has(outcome.knowledgeId) && outcomes.includes(outcome.outcome)
      ? [outcome.knowledgeId]
      : []
  )
  ));
};

const memoryRefsWithReviewableKnowledgeFeedback = (
  readModel: DecisionPacketReadModelInput
): string[] => {
  const memoryRefs = new Set(memoryRefsFor(readModel));
  const knowledgeIds = unique(readModel.feedbackDeltas.flatMap((feedback) =>
    feedback.knowledgeUsefulnessOutcomes.flatMap((outcome) =>
      isReviewableFeedbackOutcome(outcome.outcome) ? [outcome.knowledgeId] : []
    )
  ));

  return knowledgeIds.filter((knowledgeId) => memoryRefs.has(knowledgeId));
};

const memoryRefsWithPendingAntiMemoryReview = (
  readModel: DecisionPacketReadModelInput
): string[] => {
  const memoryRefs = new Set(memoryRefsFor(readModel));

  return unique(includedActivationCandidatesFor(readModel).flatMap((candidate) =>
    candidate.subjectType === "memory_record" &&
    memoryRefs.has(candidate.subjectId) &&
    candidate.pendingAntiMemoryReview !== undefined
      ? [candidate.subjectId]
      : []
  ) ?? []);
};

const verificationCommandsFor = (
  evidenceContract: EvidenceContract | undefined
): string[] => unique(evidenceContract?.commands.map((command) => command.command) ?? []);

const inactiveEvidenceContractGapFor = (
  activation: EvidenceContractActivationDecision
): DecisionPacketEvidenceGap[] => activation.status === "active"
  ? []
  : [{
      id: decisionPacketMissingActiveEvidenceContractGapId,
      reason: [
        `EvidenceContract activation is inactive (${activation.reason})`,
        `for task ${activation.taskContractId}, harness plan ${activation.harnessPlanId},`,
        `and execution run ${activation.executionRunId}.`
      ].join(" "),
      verificationRequired:
        "Bind a current EvidenceContract before treating any command as required verification."
    }];

const governingGuidanceCandidatesFor = (input: {
  readonly readModel: DecisionPacketReadModelInput;
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
}): readonly DecisionPacketActivationCandidateInput[] =>
  input.unresolvedAcceptedDissentSourceClaimIds.length > 0
    ? []
    : includedActivationCandidatesFor(input.readModel);

const taskStandardDecisionsFor = (input: {
  readonly readModel: DecisionPacketReadModelInput;
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
}): DecisionPacketTaskStandard[] => {
  const decisions = governingGuidanceCandidatesFor(input).flatMap((candidate) =>
    candidate.projectStandardDecision === undefined
      ? []
      : [{
          memoryRecordId: candidate.projectStandardDecision.memoryRecordId,
          key: candidate.projectStandardDecision.key,
          sourceRefs: candidate.projectStandardDecision.sourceRefs,
          mechanism: candidate.projectStandardDecision.mechanism,
          krnImplication: candidate.projectStandardDecision.krnImplication,
          decision: candidate.projectStandardDecision.decision,
          consumer: candidate.projectStandardDecision.consumer,
          falsifier: candidate.projectStandardDecision.falsifier,
          validFrom: candidate.projectStandardDecision.validFrom,
          ...(candidate.projectStandardDecision.validUntil === undefined
            ? {}
            : { validUntil: candidate.projectStandardDecision.validUntil }),
          ...(candidate.projectStandardDecision.rejectedPath === undefined
            ? {}
            : { rejectedPath: candidate.projectStandardDecision.rejectedPath }),
          doesNotProve: candidate.projectStandardDecision.doesNotProve
        }]
  );
  const byKey = new Map<string, DecisionPacketTaskStandard>();

  for (const decision of decisions) {
    const key = `${decision.key}:${decision.validFrom}:${decision.decision}`;

    if (!byKey.has(key)) {
      byKey.set(key, decision);
    }
  }

  return [...byKey.values()];
};

const governingStatementsFor = (input: {
  readonly readModel: DecisionPacketReadModelInput;
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
}): string[] => unique(governingGuidanceCandidatesFor(input).flatMap((candidate) =>
  candidate.projectStandardDecision === undefined ? [] : [candidate.projectStandardDecision.decision]
));

const antiMemoryBlockedPathIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.activationTrace?.decisions.flatMap((decision) =>
  decision.reason === "anti_memory_block" && decision.antiMemoryRecordId !== undefined
    ? [decision.antiMemoryRecordId]
    : []
) ?? []);

const nonGoverningSourceClaimExclusionReasons = new Set([
  "invalidated",
  "stale",
  "superseded",
  "unsafe"
]);

const supersededSourceClaimExclusionReasons = new Set(["superseded"]);

const sourceClaimExclusionIdsFor = (
  readModel: DecisionPacketReadModelInput,
  reasons: ReadonlySet<string>
): string[] => unique(readModel.context.exclusionDetails
  ?.filter((exclusion) =>
    exclusion.subjectType === "source_claim" &&
    reasons.has(exclusion.reason)
  )
  .map((exclusion) => exclusion.subjectId) ?? []);

const sourceRejectionIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => {
  const sourceClaimIds = new Set([
    ...sourceClaimIdsFor(readModel),
    ...sourceClaimExclusionIdsFor(readModel, nonGoverningSourceClaimExclusionReasons)
  ]);

  return unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
    candidate.subjectType === "source_claim" && sourceClaimIds.has(candidate.subjectId)
      ? candidate.sourceRejectionIds ?? []
      : []
  ) ?? []);
};

const sourceClaimAuthorityReasonIdsFor = (
  readModel: DecisionPacketReadModelInput,
  reason: SourceClaimAuthorityReason
): string[] => {
  const sourceClaimIds = new Set([
    ...sourceClaimIdsFor(readModel),
    ...sourceClaimExclusionIdsFor(readModel, nonGoverningSourceClaimExclusionReasons)
  ]);

  return unique(readModel.context.activationTrace?.candidates
  .filter((candidate) =>
    candidate.subjectType === "source_claim" &&
    sourceClaimIds.has(candidate.subjectId) &&
    candidate.sourceClaimAuthorityReasons?.includes(reason) === true
  )
  .map((candidate) => candidate.subjectId) ?? []);
};

const severeStaleAuthorityIdsFor = (input: {
  readonly governingDecisionIds: readonly string[];
  readonly staleDecisionIds: readonly string[];
}): string[] => {
  const staleDecisionIds = new Set(input.staleDecisionIds);

  return input.governingDecisionIds.filter((id) => staleDecisionIds.has(id));
};

const evidenceGapsFor = (input: {
  readonly runId: string;
  readonly governingDecisionIds: readonly string[];
  readonly caveatedSourceClaimIds: readonly string[];
  readonly unresolvedAcceptedDissentSourceClaimIds: readonly string[];
  readonly caveatedMemoryRefs: readonly string[];
  readonly severeStaleAuthorityIds: readonly string[];
}): DecisionPacketEvidenceGap[] => [
  ...(input.governingDecisionIds.length === 0
    ? [{
        id: `evidence-gap:${input.runId}:no-governing-decision`,
        reason: "No governed decision is present in this read-only packet.",
        verificationRequired:
          "Capture or promote source-backed decision evidence before treating this packet as task guidance."
      }]
    : []),
  ...input.caveatedSourceClaimIds.map((sourceClaimId): DecisionPacketEvidenceGap => ({
    id: `evidence-gap:${input.runId}:caveated-source-authority:${sourceClaimId}`,
    reason:
      `SourceClaim ${sourceClaimId} is included without current decision-linked authority or has maintenance feedback caveats.`,
    verificationRequired:
      "Link the claim to a current SourceDecisionEdge or refresh/review the source claim before treating it as governing authority."
  })),
  ...input.unresolvedAcceptedDissentSourceClaimIds.map((sourceClaimId): DecisionPacketEvidenceGap => ({
    id: `evidence-gap:${input.runId}:unresolved-accepted-source-dissent:${sourceClaimId}`,
    reason:
      `SourceClaim ${sourceClaimId} is selected with accepted dissent that has no reviewed canonical resolution.`,
    verificationRequired:
      "Record a reviewed canonical resolution that rejects, supersedes, or otherwise resolves the accepted dissent before treating either path as governing authority."
  })),
  ...input.caveatedMemoryRefs.map((memoryRef): DecisionPacketEvidenceGap => ({
    id: `evidence-gap:${input.runId}:caveated-memory-authority:${memoryRef}`,
    reason:
      `MemoryRef ${memoryRef} is included but has stale, noisy, harmful, rejected, or unknown knowledge usefulness feedback.`,
    verificationRequired:
      "Review the memory feedback, refresh or demote the memory, or capture stronger usefulness evidence before treating it as clean authority."
  })),
  ...input.severeStaleAuthorityIds.map((sourceDecisionId): DecisionPacketEvidenceGap => ({
    id: `evidence-gap:${input.runId}:stale-authority:${sourceDecisionId}`,
    reason:
      `SourceDecision ${sourceDecisionId} is both governing and stale, so the packet cannot treat it as clean current authority.`,
    verificationRequired:
      "Promote a replacement decision, demote the stale decision, or record explicit reviewed evidence explaining why it remains current."
  }))
];

const sourceRelationSupportEvidenceGapsFor = (input: {
  readonly runId: string;
  readonly readModel: DecisionPacketReadModelInput;
  readonly includedSourceClaimIds: readonly string[];
}): DecisionPacketEvidenceGap[] => {
  const includedSourceClaimIds = new Set(input.includedSourceClaimIds);

  return includedActivationCandidatesFor(input.readModel).flatMap((candidate) => {
    if (
      candidate.subjectType !== "source_claim" ||
      !includedSourceClaimIds.has(candidate.subjectId)
    ) {
      return [];
    }

    return candidate.sourceClaimEdgeInfluence?.missingRelationSupportEdgeIds?.map((edgeId) => ({
      id: `evidence-gap:${input.runId}:source-relation-support:${candidate.subjectId}:${edgeId}`,
      reason:
        `SourceClaim ${candidate.subjectId} was selected through SourceClaimEdge ${edgeId}, but that relation has no evidenceRef, evidenceRefs, or sourceDecisionRef support.`,
      verificationRequired:
        "Capture relation metadata evidenceRef/evidenceRefs/sourceDecisionRef, or demote/remove the relation before treating it as governing packet context."
    })) ?? [];
  }) ?? [];
};

const uniqueEvidenceGaps = (
  evidenceGaps: readonly DecisionPacketEvidenceGap[]
): DecisionPacketEvidenceGap[] => {
  const byId = new Map<string, DecisionPacketEvidenceGap>();

  for (const evidenceGap of evidenceGaps) {
    if (!byId.has(evidenceGap.id)) {
      byId.set(evidenceGap.id, evidenceGap);
    }
  }

  return [...byId.values()];
};

export const buildDecisionPacketFromReadModel = (
  readModel: DecisionPacketReadModelInput
): DecisionPacket => {
  const activeEvidenceContract = readModel.evidenceContractActivation.status === "active"
    ? readModel.evidenceContractActivation.evidenceContract
    : undefined;
  const inclusions = readModel.context.inclusionDetails;
  const exclusions = readModel.context.exclusionDetails ?? [];
  const sourceClaimIds = sourceClaimIdsFor(readModel);
  const caveatedSourceClaimIds = caveatedSourceClaimIdsFor(readModel);
  const unsupportedSourceClaimIds = unsupportedSourceClaimIdsFor(readModel);
  const conflictingSourceClaimIds = conflictingSourceClaimIdsFor(readModel);
  const unresolvedAcceptedDissentSourceClaimIds = unresolvedAcceptedDissentSourceClaimIdsFor(readModel);
  const unknownSourceClaimIds = unknownSourceClaimIdsFor(readModel);
  const governingSourceClaimIds = governingSourceClaimIdsFor({
    sourceClaimIds,
    conflictingSourceClaimIds,
    unresolvedAcceptedDissentSourceClaimIds
  });
  const sourceDecisionEdgeIds = sourceDecisionEdgeIdsFor(
    readModel,
    governingSourceClaimIds
  );
  const sourceDecisionTargets = sourceDecisionTargetsFor(
    readModel,
    governingSourceClaimIds
  );
  const governingDecisionIds = architectureDecisionTargetIdsFor(sourceDecisionTargets);
  const staleDecisionIds = sourceDecisionIdsWithUsefulness(readModel, ["stale"]);
  const memoryRefs = memoryRefsFor(readModel);
  const staleKnowledgeIds = knowledgeIdsWithUsefulness(readModel, ["stale"]);
  const noiseKnowledgeIds = knowledgeIdsWithUsefulness(readModel, ["noise"]);
  const unknownKnowledgeIds = knowledgeIdsWithUsefulness(readModel, ["unknown"]);
  const caveatedMemoryRefs = unique([
    ...memoryRefsWithReviewableKnowledgeFeedback(readModel),
    ...memoryRefsWithPendingAntiMemoryReview(readModel)
  ]);
  const sourceRejectionIds = sourceRejectionIdsFor(readModel);
  const supersededPathIds = sourceClaimExclusionIdsFor(
    readModel,
    supersededSourceClaimExclusionReasons
  );
  const authoritySupersededPathIds = sourceClaimAuthorityReasonIdsFor(
    readModel,
    "superseded_by_current_claim"
  );
  const allSupersededPathIds = unique([
    ...supersededPathIds,
    ...authoritySupersededPathIds
  ]);
  const rejectedPathIds = unique([
    ...inclusions
      .filter((inclusion) => inclusion.subjectType === "anti_memory_record")
      .map((inclusion) => inclusion.subjectId),
    ...antiMemoryBlockedPathIdsFor(readModel)
  ]);
  const severeStaleAuthorityIds = severeStaleAuthorityIdsFor({
    governingDecisionIds,
    staleDecisionIds
  });
  const evidenceGaps = uniqueEvidenceGaps([
    ...inactiveEvidenceContractGapFor(readModel.evidenceContractActivation),
    ...evidenceGapsFor({
      runId: readModel.run.id,
      governingDecisionIds,
      caveatedSourceClaimIds,
      unresolvedAcceptedDissentSourceClaimIds,
      caveatedMemoryRefs,
      severeStaleAuthorityIds
    }),
    ...sourceRelationSupportEvidenceGapsFor({
      runId: readModel.run.id,
      readModel,
      includedSourceClaimIds: sourceClaimIds
    })
  ]);
  const sourceConsensus = buildDecisionPacketSourceConsensus({
    sourceClaimIds,
    caveatedSourceClaimIds,
    unsupportedSourceClaimIds,
    conflictingSourceClaimIds,
    unknownSourceClaimIds,
    unresolvedAcceptedDissentSourceClaimIds,
    sourceDecisionEdgeIds,
    sourceDecisionTargets,
    staleDecisionIds,
    supersededPathIds: allSupersededPathIds,
    rejectedPathIds,
    sourceRejectionIds,
    conflictedDecisionIds: severeStaleAuthorityIds,
    evidenceGapIds: evidenceGaps.map((gap) => gap.id)
  });
  const governingGuidanceInput = {
    readModel,
    unresolvedAcceptedDissentSourceClaimIds
  };
  const taskStandardDecisions = taskStandardDecisionsFor(governingGuidanceInput);
  const governingStatements = governingStatementsFor(governingGuidanceInput);

  return {
    formatVersion: decisionPacketFormatVersion,
    task: readModel.task ?? {
      id: readModel.run.id,
      title: "Task contract unavailable",
      objective: "The persisted task objective is unavailable in this packet.",
      constraints: [],
      nonGoals: ["Do not execute Codex without a task-bound packet."],
      acceptance: []
    },
    contextInclusions: inclusions.map((inclusion) => ({
      subjectType: inclusion.subjectType,
      subjectId: inclusion.subjectId,
      reason: inclusion.reason ?? "Selected by the current activation result.",
      expectedUse: inclusion.expectedUse ?? "Use only within the current task boundary.",
      sourceAuthority: inclusion.sourceAuthority
    })),
    contextExclusions: exclusions.map((exclusion) => ({
      subjectType: exclusion.subjectType,
      subjectId: exclusion.subjectId,
      reason: exclusion.reason,
      explanation: exclusion.explanation ?? "Excluded by the current activation result.",
      sourceAuthority: exclusion.sourceAuthority ?? "low"
    })),
    toolBoundaries: [...(readModel.toolBoundaries ?? [])],
    ...(activeEvidenceContract === undefined
      ? {}
      : {
          evidenceContract: {
            commands: activeEvidenceContract.commands.map((command) => ({
              command: command.command,
              required: command.required
            })),
            diffRisk: activeEvidenceContract.diffRisk,
            reviewBurden: activeEvidenceContract.reviewBurden,
            rollbackPath: activeEvidenceContract.rollbackPath
          }
        }),
    nextAction: readModel.nextAction ??
      "Review the DecisionPacket evidence gaps before taking an implementation action.",
    governingDecisionIds,
    governingStatements,
    taskStandardDecisions,
    sourceClaimIds,
    caveatedSourceClaimIds,
    sourceDecisionEdgeIds,
    sourceDecisionTargets,
    sourceRejectionIds,
    memoryRefs,
    caveatedMemoryRefs,
    staleDecisionIds,
    staleKnowledgeIds,
    noiseKnowledgeIds,
    unknownKnowledgeIds,
    supersededPathIds: allSupersededPathIds,
    rejectedPathIds,
    falsifiers: unique(taskStandardDecisions.map((decision) => decision.falsifier)),
    verificationCommands: verificationCommandsFor(activeEvidenceContract),
    evidenceGaps,
    sourceConsensus,
    abstentionScore: buildDecisionPacketAbstentionScore({
      governingDecisionIds,
      sourceConsensus
    }),
    doesNotProve: readModel.proof.doesNotProve,
    nonProofs: readModel.proof.doesNotProve,
    noiseDecisionIds: sourceDecisionIdsWithUsefulness(readModel, ["noise"]),
    severeStaleAuthorityIds,
    brief: {
      includedContextCount: readModel.context.inclusions,
      observationPrefixCount: 0,
      explicitExclusionCount: readModel.context.exclusions,
      sourceClaimUseCount: inclusions.filter((inclusion) =>
        inclusion.subjectType === "source_claim"
      ).length,
      memoryRecordUseCount: inclusions.filter((inclusion) =>
        inclusion.subjectType === "memory_record"
      ).length,
      includedSourceClaimIds: contextSubjectIds(inclusions, "source_claim"),
      includedMemoryRecordIds: contextSubjectIds(inclusions, "memory_record"),
      excludedSourceClaimIds: contextSubjectIds(exclusions, "source_claim"),
      excludedMemoryRecordIds: contextSubjectIds(exclusions, "memory_record"),
      excludedAntiMemoryRecordIds: contextSubjectIds(exclusions, "anti_memory_record"),
      evidenceGapIds: evidenceGaps.map((gap) => gap.id)
    }
  };
};

export const buildDecisionPacketIdentity = (input: {
  readonly runId: string;
  readonly readModel: DecisionPacketReadModelInput;
  readonly packet: DecisionPacket;
  readonly generatedAt: string;
  readonly sha256Hex: DecisionPacketSha256Hex;
}): DecisionPacketIdentity => {
  const checksum = input.sha256Hex(canonicalJson({
    generatedAt: input.generatedAt,
    packet: input.packet,
    request: {
      runId: input.runId
    },
    sourceRunStatus: input.readModel.run.status,
    sourceRunLifecycleRevision: input.readModel.run.lifecycleRevision,
    sourceRunUpdatedAt: input.readModel.run.updatedAt
  }));

  return {
    packetId: `decision-packet:${input.runId}:${checksum.slice(0, 16)}`,
    checksumAlgorithm: "sha256",
    checksum,
    evidenceRef: `packet:${checksum}`,
    generatedAt: input.generatedAt,
    sourceRunStatus: input.readModel.run.status,
    sourceRunLifecycleRevision: input.readModel.run.lifecycleRevision,
    sourceRunUpdatedAt: input.readModel.run.updatedAt,
    freshness: {
      status: "current_read_model_snapshot",
      doesNotProve:
        "Packet checksum binds feedback to this readback snapshot; it does not prove the DB state stayed unchanged after the packet was rendered."
    }
  };
};

export const buildDecisionPacketReturnChannels = (input: {
  readonly runId: string;
  readonly packetIdentity: DecisionPacketIdentity;
}): DecisionPacketReturnChannels => {
  const packetBindingOptions = [
    `--decision-packet-checksum ${input.packetIdentity.checksum}`,
    `--decision-packet-generated-at ${input.packetIdentity.generatedAt}`
  ].join(" ");

  return {
    evidence: {
      command:
        `krn evidence capture --run-id ${input.runId} ${packetBindingOptions} --verification "<command>=passed"`,
      persistedCommand:
        `krn evidence capture --run-id ${input.runId} ${packetBindingOptions} --verification "<command>=passed" --persist`,
      doesNotProve:
        "Evidence capture records supplied outcomes; it does not execute commands, prove Codex followed the packet, or prove the packet remained current after render time."
    },
    feedback: {
      memoryRecordApplyExample:
        `krn memory record apply --run-id ${input.runId} --memory-id <memory-id> ${packetBindingOptions} --outcome helped --evidence-bundle-id <evidence-bundle-id> --notes "<why>" --persist`,
      sourceUsefulnessExample:
        `krn evidence capture --run-id ${input.runId} ${packetBindingOptions} --source-usefulness "claim:<id>=helped|<reason>|${input.packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
      sourceDecisionUsefulnessExample:
        "Unavailable: the DecisionPacket does not expose canonical selected SourceDecision ids; use claim-scoped feedback.",
      knowledgeUsefulnessExample:
        `krn evidence capture --run-id ${input.runId} ${packetBindingOptions} --knowledge-usefulness "<knowledge-id>=helped|<reason>|${input.packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
      doesNotProve:
        "Feedback commands are return channels; they do not promote memory/source truth without the existing review gates. Packet checksum and generatedAt bind the rendered packet issuance; helped additionally requires a later successful verifier from the active EvidenceContract."
    }
  };
};

export const buildDecisionPacketContractReadback = (input: {
  readonly readModel: DecisionPacketReadModelInput;
  readonly generatedAt: string;
  readonly sha256Hex: DecisionPacketSha256Hex;
}): DecisionPacketContractReadback => {
  const runId = input.readModel.run.id;
  const packet = buildDecisionPacketFromReadModel(input.readModel);
  const packetIdentity = buildDecisionPacketIdentity({
    runId,
    readModel: input.readModel,
    packet,
    generatedAt: input.generatedAt,
    sha256Hex: input.sha256Hex
  });

  return {
    kind: "krn.decisionPacketReadback.v1",
    access: "read_only",
    mutation: "none",
    surface: "headless_cli",
    request: {
      runId
    },
    packetIdentity,
    packet,
    returnChannels: buildDecisionPacketReturnChannels({
      runId,
      packetIdentity
    }),
    proof: {
      proves: [
        "a headless consumer can request a read-only DecisionPacket contract through CLI JSON",
        "the response names evidence and feedback return channels without invoking Codex or mutating memory",
        "the DecisionPacket command exposes the compact DecisionPacket separately from the diagnostic read model",
        "return-channel commands carry the packet checksum and exact generatedAt for later freshness checks"
      ],
      doesNotProve: [
        "MCP integration",
        "live Codex obedience",
        "that returned evidence commands were executed",
        "memory/source promotion",
        "product readiness",
        "that the persisted run state stayed unchanged after this packet was rendered"
      ]
    }
  };
};
