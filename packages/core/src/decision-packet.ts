import type {
  FeedbackCandidateProposalKind,
  SourceUsefulnessOutcome
} from "./feedback-delta.js";
import type {
  ContextSubjectType
} from "./context-assembly.js";
import type {
  ProjectStandardDecisionReadback
} from "./memory.js";
import type {
  SourceAuthorityLabel,
  SourceClaimEdgeKind,
  SourceDecisionTargetType
} from "./source.js";

export const decisionPacketFormatVersion = "krn.decisionPacket.v1" as const;

export type DecisionPacketFormatVersion = typeof decisionPacketFormatVersion;

export interface DecisionPacketBriefSummary {
  includedContextCount: number;
  observationPrefixCount: number;
  explicitExclusionCount: number;
  sourceClaimUseCount: number;
  memoryRecordUseCount: number;
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
  sourceDecisionEdgeIds: readonly string[];
  sourceDecisionTargets: readonly DecisionPacketSourceDecisionTarget[];
  staleDecisionIds: readonly string[];
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
  | "evidence_gap";

export interface DecisionPacketAbstentionScore {
  status: DecisionPacketAbstentionStatus;
  score: number;
  reasons: readonly DecisionPacketAbstentionReason[];
  evidenceGapIds: readonly string[];
  doesNotProve: string;
}

const unique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)];

const usefulFeedbackOutcomes = [
  "selected",
  "used",
  "helped"
] as const satisfies readonly SourceUsefulnessOutcome[];

const maintenanceFeedbackOutcomes = [
  "noise",
  "stale",
  "unknown",
  "hurt",
  "rejected"
] as const satisfies readonly SourceUsefulnessOutcome[];

export const buildDecisionPacketSourceConsensus = (input: {
  readonly sourceClaimIds: readonly string[];
  readonly caveatedSourceClaimIds: readonly string[];
  readonly sourceDecisionEdgeIds: readonly string[];
  readonly sourceDecisionTargets: readonly DecisionPacketSourceDecisionTarget[];
  readonly staleDecisionIds: readonly string[];
  readonly rejectedPathIds: readonly string[];
  readonly sourceRejectionIds: readonly string[];
  readonly conflictedDecisionIds: readonly string[];
  readonly evidenceGapIds: readonly string[];
}): DecisionPacketSourceConsensus => {
  const caveatedSourceClaimIds = new Set(input.caveatedSourceClaimIds);

  return {
    decisionLinkedSourceClaimIds: unique(input.sourceClaimIds.filter((sourceClaimId) =>
      !caveatedSourceClaimIds.has(sourceClaimId)
    )),
    caveatedSourceClaimIds: unique(input.caveatedSourceClaimIds),
    sourceDecisionEdgeIds: unique(input.sourceDecisionEdgeIds),
    sourceDecisionTargets: input.sourceDecisionTargets,
    staleDecisionIds: unique(input.staleDecisionIds),
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
    reasons.includes("missing_decision_linked_source")
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
    updatedAt: string;
  };
  context: {
    inclusions: number;
    exclusions: number;
    inclusionDetails: readonly DecisionPacketContextInclusionInput[];
    activationTrace?: DecisionPacketActivationTraceInput;
  };
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
}

export interface DecisionPacketActivationTraceInput {
  candidates: readonly DecisionPacketActivationCandidateInput[];
  decisions: readonly DecisionPacketActivationDecisionInput[];
}

export interface DecisionPacketActivationCandidateInput {
  subjectType: string;
  subjectId: string;
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
    targets: readonly {
      sourceDecisionEdgeId: string;
      targetType: SourceDecisionTargetType;
      targetId: string;
    }[];
  };
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
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
  candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds ?? []
) ?? []);

const sourceDecisionTargetsFor = (
  readModel: DecisionPacketReadModelInput
): DecisionPacketSourceDecisionTarget[] => {
  const targetByKey = new Map<string, {
    targetType: SourceDecisionTargetType;
    targetId: string;
    sourceDecisionEdgeIds: string[];
  }>();

  for (const target of readModel.context.activationTrace?.candidates.flatMap((candidate) =>
    candidate.sourceDecisionSupportBoost?.targets ?? []
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

const sourceClaimIdsWithDecisionSupportFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
  candidate.subjectType === "source_claim" &&
  (candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds.length ?? 0) > 0
    ? [candidate.subjectId]
    : []
) ?? []);

const sourceClaimIdsWithUsefulness = (
  readModel: DecisionPacketReadModelInput,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
    outcome.sourceClaimId !== undefined && outcomes.includes(outcome.outcome)
      ? [outcome.sourceClaimId]
      : []
  )
));

const caveatedSourceClaimIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => {
  const supportedSourceClaimIds = new Set(sourceClaimIdsWithDecisionSupportFor(readModel));
  const maintenanceFeedbackSourceClaimIds = new Set(
    sourceClaimIdsWithUsefulness(readModel, maintenanceFeedbackOutcomes)
  );
  const pendingAntiMemoryReviewSourceClaimIds = new Set(
    readModel.context.activationTrace?.candidates.flatMap((candidate) =>
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
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
    outcome.sourceDecisionId !== undefined && outcomes.includes(outcome.outcome)
      ? [outcome.sourceDecisionId]
      : []
  )
));

const memoryRefsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.inclusionDetails
  .filter((inclusion) => inclusion.subjectType === "memory_record")
  .map((inclusion) => inclusion.subjectId));

const knowledgeIdsWithUsefulness = (
  readModel: DecisionPacketReadModelInput,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.knowledgeUsefulnessOutcomes.flatMap((outcome) =>
    outcomes.includes(outcome.outcome) ? [outcome.knowledgeId] : []
  )
));

const memoryRefsWithKnowledgeUsefulness = (
  readModel: DecisionPacketReadModelInput,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => {
  const memoryRefs = new Set(memoryRefsFor(readModel));
  const knowledgeIds = knowledgeIdsWithUsefulness(readModel, outcomes);

  return knowledgeIds.filter((knowledgeId) => memoryRefs.has(knowledgeId));
};

const memoryRefsWithPendingAntiMemoryReview = (
  readModel: DecisionPacketReadModelInput
): string[] => {
  const memoryRefs = new Set(memoryRefsFor(readModel));

  return unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
    candidate.subjectType === "memory_record" &&
    memoryRefs.has(candidate.subjectId) &&
    candidate.pendingAntiMemoryReview !== undefined
      ? [candidate.subjectId]
      : []
  ) ?? []);
};

const rejectedSourceDecisionIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.candidates.flatMap((candidate) =>
    candidate.kind === "source_decision_candidate" && candidate.status === "reject"
      ? [candidate.id]
      : []
  )
));

const verificationCommandsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.evidenceBundles.flatMap((bundle) =>
  bundle.commands.map((command) => command.command)
));

const taskStandardDecisionsFor = (
  readModel: DecisionPacketReadModelInput
): DecisionPacketTaskStandard[] => {
  const decisions = readModel.context.activationTrace?.candidates.flatMap((candidate) =>
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
  ) ?? [];
  const byKey = new Map<string, DecisionPacketTaskStandard>();

  for (const decision of decisions) {
    const key = `${decision.key}:${decision.validFrom}:${decision.decision}`;

    if (!byKey.has(key)) {
      byKey.set(key, decision);
    }
  }

  return [...byKey.values()];
};

const governingStatementsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique([
  ...readModel.context.activationTrace?.candidates.flatMap((candidate) =>
    candidate.projectStandardDecision === undefined ? [] : [candidate.projectStandardDecision.decision]
  ) ?? [],
  ...readModel.feedbackDeltas.flatMap((feedback) =>
    feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
      ["selected", "used", "helped"].includes(outcome.outcome) ? [outcome.reason] : []
    )
  )
]);

const antiMemoryBlockedPathIdsFor = (
  readModel: DecisionPacketReadModelInput
): string[] => unique(readModel.context.activationTrace?.decisions.flatMap((decision) =>
  decision.reason === "anti_memory_block" && decision.antiMemoryRecordId !== undefined
    ? [decision.antiMemoryRecordId]
    : []
) ?? []);

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

  return input.readModel.context.activationTrace?.candidates.flatMap((candidate) => {
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
  const inclusions = readModel.context.inclusionDetails;
  const sourceClaimIds = sourceClaimIdsFor(readModel);
  const caveatedSourceClaimIds = caveatedSourceClaimIdsFor(readModel);
  const sourceDecisionEdgeIds = sourceDecisionEdgeIdsFor(readModel);
  const sourceDecisionTargets = sourceDecisionTargetsFor(readModel);
  const governingDecisionIds = unique([
    ...architectureDecisionTargetIdsFor(sourceDecisionTargets),
    ...sourceDecisionIdsWithUsefulness(readModel, usefulFeedbackOutcomes)
  ]);
  const staleDecisionIds = sourceDecisionIdsWithUsefulness(readModel, ["stale"]);
  const memoryRefs = memoryRefsFor(readModel);
  const staleKnowledgeIds = knowledgeIdsWithUsefulness(readModel, ["stale"]);
  const noiseKnowledgeIds = knowledgeIdsWithUsefulness(readModel, ["noise"]);
  const unknownKnowledgeIds = knowledgeIdsWithUsefulness(readModel, ["unknown"]);
  const caveatedMemoryRefs = unique([
    ...memoryRefsWithKnowledgeUsefulness(readModel, maintenanceFeedbackOutcomes),
    ...memoryRefsWithPendingAntiMemoryReview(readModel)
  ]);
  const sourceRejectionIds = rejectedSourceDecisionIdsFor(readModel);
  const rejectedPathIds = unique([
    ...inclusions
      .filter((inclusion) => inclusion.subjectType === "anti_memory_record")
      .map((inclusion) => inclusion.subjectId),
    ...antiMemoryBlockedPathIdsFor(readModel),
    ...sourceRejectionIds,
    ...sourceDecisionIdsWithUsefulness(readModel, ["rejected"])
  ]);
  const severeStaleAuthorityIds = severeStaleAuthorityIdsFor({
    governingDecisionIds,
    staleDecisionIds
  });
  const evidenceGaps = uniqueEvidenceGaps([
    ...evidenceGapsFor({
      runId: readModel.run.id,
      governingDecisionIds,
      caveatedSourceClaimIds,
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
    sourceDecisionEdgeIds,
    sourceDecisionTargets,
    staleDecisionIds,
    rejectedPathIds,
    sourceRejectionIds,
    conflictedDecisionIds: severeStaleAuthorityIds,
    evidenceGapIds: evidenceGaps.map((gap) => gap.id)
  });

  return {
    formatVersion: decisionPacketFormatVersion,
    governingDecisionIds,
    governingStatements: governingStatementsFor(readModel),
    taskStandardDecisions: taskStandardDecisionsFor(readModel),
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
    rejectedPathIds,
    falsifiers: readModel.evidenceBundles.flatMap((bundle) =>
      bundle.commands.map((command) => command.command)
    ),
    verificationCommands: verificationCommandsFor(readModel),
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
      ).length
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
    packet: input.packet,
    request: {
      runId: input.runId
    },
    sourceRunUpdatedAt: input.readModel.run.updatedAt
  }));

  return {
    packetId: `decision-packet:${input.runId}:${checksum.slice(0, 16)}`,
    checksumAlgorithm: "sha256",
    checksum,
    evidenceRef: `packet:${checksum}`,
    generatedAt: input.generatedAt,
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
  const packetChecksumOption = `--decision-packet-checksum ${input.packetIdentity.checksum}`;

  return {
    evidence: {
      command:
        `krn evidence capture --run-id ${input.runId} ${packetChecksumOption} --verification "<command>=passed"`,
      persistedCommand:
        `krn evidence capture --run-id ${input.runId} ${packetChecksumOption} --verification "<command>=passed" --persist`,
      doesNotProve:
        "Evidence capture records supplied outcomes; it does not execute commands, prove Codex followed the packet, or prove the packet remained current after render time."
    },
    feedback: {
      memoryRecordApplyExample:
        `krn memory record apply --run-id ${input.runId} --memory-id <memory-id> --outcome helped --notes "packet=${input.packetIdentity.evidenceRef}; <why>" --persist`,
      sourceUsefulnessExample:
        `krn evidence capture --run-id ${input.runId} ${packetChecksumOption} --source-usefulness "claim:<id>=helped|<reason>|${input.packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
      sourceDecisionUsefulnessExample:
        `krn evidence capture --run-id ${input.runId} ${packetChecksumOption} --source-usefulness "decision:<id>=helped|<reason>|${input.packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
      knowledgeUsefulnessExample:
        `krn evidence capture --run-id ${input.runId} ${packetChecksumOption} --knowledge-usefulness "<knowledge-id>=helped|<reason>|${input.packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
      doesNotProve:
        "Feedback commands are return channels; they do not promote memory/source truth without the existing review gates. Packet checksum evidence only binds feedback to the rendered packet snapshot."
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
        "return-channel commands carry a packet checksum evidence ref for later freshness checks"
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
