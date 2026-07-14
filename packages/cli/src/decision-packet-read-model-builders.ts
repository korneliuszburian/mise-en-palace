import {
  knowledgeUsefulnessOutcomesFromMetadata,
  decisionPacketBindingReadbackFromMetadata,
  decideEvidenceContractActivation,
  buildFeedbackRecommendationReadback,
  readMetadataObjectList,
  readMetadataString,
  readMetadataStringList,
  sourceUsefulnessOutcomesFromMetadata,
  summarizeFeedbackCandidateProposals,
  targetEvidenceFromMetadata,
  toEvidenceCommandReadback
} from "@krn/core";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  EvidenceCommand,
  FeedbackCandidateProposalKind,
  FeedbackDelta
} from "@krn/core";
import { activationRetrievalDiagnosticsFromMetadata } from "@krn/harness";
import type {
  ActivationDecisionRecord,
  HarnessRunAggregate,
  RetrievalCandidateRecord
} from "@krn/core/repositories";

import {
  candidateReviewability,
  candidateReviewabilityReasons,
  changedFileClassification,
  projectResolutionFromMetadata,
  projectStandardDecisionFromMetadata,
  pendingAntiMemoryReviewFromMetadata,
  readMetadataFiniteNumber,
  sourceClaimAuthorityFromMetadata,
  sourceClaimEdgeInfluenceFromMetadata,
  sourceDecisionSupportBoostFromMetadata
} from "./decision-packet-read-model-decoders.js";
import {
  decisionPacketReadModelDoesNotProve,
  decisionPacketReadModelProves
} from "./decision-packet-read-model.js";
import type {
  DecisionPacketReadModelActivationCandidate,
  DecisionPacketReadModelActivationDecision,
  DecisionPacketReadModelActivationTrace,
  DecisionPacketReadModelCandidate,
  DecisionPacketReadModelCommand,
  DecisionPacketReadModelContextExclusion,
  DecisionPacketReadModelContextInclusion,
  DecisionPacketReadModelContext,
  DecisionPacketReadModelEvidenceBundle,
  DecisionPacketReadModelEvidenceFreshness,
  DecisionPacketReadModelFeedbackDelta,
  DecisionPacketReadModelKnowledgeUsefulnessOutcome,
  DecisionPacketReadModelProof,
  DecisionPacketReadModel,
  DecisionPacketReadModelReviewAssessment,
  DecisionPacketReadModelRun,
  DecisionPacketReadModelSourceUsefulnessOutcome,
  DecisionPacketReadModelTask
} from "./decision-packet-read-model.js";
import {
  knowledgeSelectionFromMetadata
} from "./knowledge-selection.js";
import type { ProjectResolution } from "./database-runtime.js";

const commandResource = (command: EvidenceCommand): DecisionPacketReadModelCommand => {
  const commandReadback = toEvidenceCommandReadback(command);

  return {
    command: commandReadback.command,
    status: commandReadback.status,
    provenance: commandReadback.provenance,
    ...(!('exitCode' in commandReadback) || commandReadback.exitCode === undefined
      ? {}
      : { exitCode: commandReadback.exitCode }),
    ...(!('outputRef' in commandReadback) || commandReadback.outputRef === undefined
      ? {}
      : { outputRef: commandReadback.outputRef }),
    ...(!('capturedAt' in commandReadback) || commandReadback.capturedAt === undefined
      ? {}
      : { capturedAt: commandReadback.capturedAt }),
    ...(!('assertedBy' in commandReadback) || commandReadback.assertedBy === undefined
      ? {}
      : { assertedBy: commandReadback.assertedBy }),
    doesNotProve: commandReadback.doesNotProve
  };
};

const contextInclusionResource = (
  inclusion: ContextInclusion
): DecisionPacketReadModelContextInclusion => ({
  subjectType: inclusion.subjectType,
  subjectId: inclusion.subjectId,
  reason: inclusion.reason,
  expectedUse: inclusion.expectedUse,
  sourceAuthority: inclusion.sourceAuthority,
  ...(inclusion.tokenEstimate === undefined ? {} : { tokenEstimate: inclusion.tokenEstimate })
});

const contextExclusionResource = (
  exclusion: ContextExclusion
): DecisionPacketReadModelContextExclusion => ({
  subjectType: exclusion.subjectType,
  subjectId: exclusion.subjectId,
  reason: exclusion.reason,
  explanation: exclusion.explanation,
  sourceAuthority: exclusion.sourceAuthority,
  ...(exclusion.score === undefined ? {} : { score: exclusion.score })
});

type ActivationCandidateScoreField =
  | "lexicalScore"
  | "vectorScore"
  | "graphScore"
  | "temporalScore"
  | "contextRoiScore"
  | "feedbackScore"
  | "totalScore"
  | "score";

const activationCandidateScoreFields = [
  "lexicalScore",
  "vectorScore",
  "graphScore",
  "temporalScore",
  "contextRoiScore",
  "feedbackScore",
  "totalScore",
  "score"
] as const satisfies readonly ActivationCandidateScoreField[];

const activationCandidateScores = (
  candidate: RetrievalCandidateRecord
): Partial<Pick<DecisionPacketReadModelActivationCandidate, ActivationCandidateScoreField>> =>
  Object.fromEntries(activationCandidateScoreFields.flatMap((field) => {
    const value = field === "feedbackScore"
      ? readMetadataFiniteNumber(candidate.metadata, "feedbackScore")
      : candidate[field];

    return value === undefined ? [] : [[field, value]];
  })) as Partial<Pick<DecisionPacketReadModelActivationCandidate, ActivationCandidateScoreField>>;

const activationCandidateResource = (
  candidate: RetrievalCandidateRecord
): DecisionPacketReadModelActivationCandidate => {
  const sourceClaimEdgeInfluence = sourceClaimEdgeInfluenceFromMetadata(candidate.metadata);
  const sourceDecisionSupportBoost = sourceDecisionSupportBoostFromMetadata(candidate.metadata);
  const sourceRejectionIds = readMetadataStringList(candidate.metadata, "sourceRejectionIds");
  const pendingAntiMemoryReview = pendingAntiMemoryReviewFromMetadata(candidate.metadata);
  const projectStandardDecision = projectStandardDecisionFromMetadata(candidate.metadata);
  const sourceClaimAuthority = sourceClaimAuthorityFromMetadata(candidate.metadata);

  return {
    id: candidate.id,
    kind: candidate.kind,
    status: candidate.status,
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    sourceAuthority: candidate.sourceAuthority,
    ...(sourceClaimAuthority === undefined
      ? {}
      : {
          sourceClaimAuthorityStatus: sourceClaimAuthority.status,
          sourceClaimAuthorityReasons: sourceClaimAuthority.reasons
        }),
    ...activationCandidateScores(candidate),
    reason: candidate.reason,
    ...(projectStandardDecision === undefined ? {} : { projectStandardDecision }),
    ...(sourceClaimEdgeInfluence === undefined ? {} : { sourceClaimEdgeInfluence }),
    ...(sourceDecisionSupportBoost === undefined ? {} : { sourceDecisionSupportBoost }),
    ...(sourceRejectionIds.length === 0 ? {} : { sourceRejectionIds }),
    ...(pendingAntiMemoryReview === undefined ? {} : { pendingAntiMemoryReview })
  };
};

const activationDecisionResource = (
  decision: ActivationDecisionRecord
): DecisionPacketReadModelActivationDecision => {
  const antiMemoryRecordId = readMetadataString(decision.metadata, "antiMemoryRecordId");

  return {
    id: decision.id,
    subjectType: decision.subjectType,
    subjectId: decision.subjectId,
    decision: decision.decision,
    reason: decision.reason,
    ...(decision.score === undefined ? {} : { score: decision.score }),
    ...(decision.expectedDecisionImpact === undefined
      ? {}
      : { expectedDecisionImpact: decision.expectedDecisionImpact }),
    ...(decision.retrievalCandidateId === undefined
      ? {}
      : { retrievalCandidateId: decision.retrievalCandidateId }),
    ...(antiMemoryRecordId === undefined ? {} : { antiMemoryRecordId })
  };
};

export const activationTraceResource = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModelActivationTrace | undefined =>
  aggregate.activationTrace === undefined
    ? undefined
    : {
        retrievalRunId: aggregate.activationTrace.retrievalRunId,
        candidates: aggregate.activationTrace.candidates.map(activationCandidateResource),
        decisions: aggregate.activationTrace.decisions.map(activationDecisionResource)
      };

const candidateResource = (input: {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string | undefined;
  summary: string;
  metadata: Record<string, unknown>;
}): DecisionPacketReadModelCandidate => {
  const reviewability = candidateReviewability(input.metadata);
  const reviewabilityReasons = candidateReviewabilityReasons(input.metadata);

  return {
    kind: input.kind,
    id: input.id,
    status: input.status ?? "unknown",
    summary: input.summary,
    reviewability,
    reviewabilityReasons:
      reviewabilityReasons.length > 0
        ? reviewabilityReasons
        : ["Reviewability reasons were not present in candidate metadata."]
  };
};

const metadataCandidateResource = (
  item: Record<string, unknown>,
  kind: FeedbackCandidateProposalKind,
  summaryField: string
): DecisionPacketReadModelCandidate | undefined => {
  const id = readMetadataString(item, "id");
  const summary = readMetadataString(item, summaryField) ?? readMetadataString(item, "summary");

  if (id === undefined || summary === undefined) {
    return undefined;
  }

  return candidateResource({
    kind,
    id,
    status: readMetadataString(item, "status"),
    summary,
    metadata: item
  });
};

const metadataCandidateResources = (
  metadata: Record<string, unknown>,
  key: string,
  kind: FeedbackCandidateProposalKind,
  summaryField: string
): DecisionPacketReadModelCandidate[] =>
  readMetadataObjectList(metadata, key).flatMap((item) => {
    const resource = metadataCandidateResource(item, kind, summaryField);
    return resource === undefined ? [] : [resource];
  });

export const decisionPacketReadModelCandidates = (
  feedback: FeedbackDelta
): DecisionPacketReadModelCandidate[] => [
  ...feedback.memoryCandidates.map((candidate) => candidateResource({
    kind: "memory_candidate",
    id: candidate.id,
    status: candidate.status,
    summary: candidate.summary,
    metadata: candidate.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "sourceClaimCandidates",
    "source_claim_candidate",
    "claim"
  ),
  ...feedback.sourceDecisions.map((decision) => candidateResource({
    kind: "source_decision_candidate",
    id: decision.id,
    status: decision.status,
    summary: decision.decision,
    metadata: decision.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "antiMemoryCandidates",
    "anti_memory_candidate",
    "rejectedClaim"
  ),
  ...feedback.evalCandidates.map((candidate) => candidateResource({
    kind: "eval_candidate",
    id: candidate.id,
    status: candidate.status,
    summary: candidate.title,
    metadata: candidate.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "observationCandidates",
    "observation_candidate",
    "summary"
  )
];

export const decisionPacketReadModelSourceUsefulnessOutcomes = (
  feedback: FeedbackDelta
): DecisionPacketReadModelSourceUsefulnessOutcome[] =>
  sourceUsefulnessOutcomesFromMetadata(feedback.metadata).flatMap((outcome) => {
    const subject = outcome.sourceDecisionId === undefined
      ? outcome.sourceClaimId === undefined
        ? undefined
        : {
            subjectKind: "source_claim" as const,
            subjectId: outcome.sourceClaimId
          }
      : {
          subjectKind: "source_decision" as const,
          subjectId: outcome.sourceDecisionId
        };

    if (subject === undefined) {
      return [];
    }

    return [{
      ...(outcome.sourceClaimId === undefined ? {} : { sourceClaimId: outcome.sourceClaimId }),
      ...(outcome.sourceDecisionId === undefined ? {} : { sourceDecisionId: outcome.sourceDecisionId }),
      outcome: outcome.outcome,
      reason: outcome.reason,
      evidenceRefs: outcome.evidenceRefs,
      recommendation: buildFeedbackRecommendationReadback({
        subjectKind: subject.subjectKind,
        subjectId: subject.subjectId,
        outcome: outcome.outcome,
        reason: outcome.reason,
        evidenceRefs: outcome.evidenceRefs,
        doesNotProve: outcome.doesNotProve
      }),
      doesNotProve: outcome.doesNotProve
    }];
  });

export const decisionPacketReadModelKnowledgeUsefulnessOutcomes = (
  feedback: FeedbackDelta
): DecisionPacketReadModelKnowledgeUsefulnessOutcome[] =>
  knowledgeUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    knowledgeId: outcome.knowledgeId,
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    recommendation: buildFeedbackRecommendationReadback({
      subjectKind: "memory_record",
      subjectId: outcome.knowledgeId,
      outcome: outcome.outcome,
      reason: outcome.reason,
      evidenceRefs: outcome.evidenceRefs,
      doesNotProve: outcome.doesNotProve
    }),
    doesNotProve: outcome.doesNotProve
  }));

const runResource = (
  aggregate: HarnessRunAggregate,
  projectResolution: ProjectResolution | undefined
): DecisionPacketReadModelRun => ({
  id: aggregate.executionRun.id,
  status: aggregate.executionRun.status,
  adapter: aggregate.executionRun.adapter,
  createdAt: aggregate.executionRun.createdAt,
  updatedAt: aggregate.executionRun.updatedAt,
  ...(projectResolution === undefined ? {} : { projectResolution })
});

const taskResource = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModelTask => ({
  id: aggregate.taskContract.id,
  title: aggregate.taskContract.title,
  objective: aggregate.taskContract.objective,
  constraints: [...aggregate.taskContract.constraints],
  nonGoals: [...aggregate.taskContract.nonGoals],
  acceptance: [...aggregate.taskContract.acceptance],
  status: aggregate.taskContract.status
});

export const activationDiagnosticsResource = (
  contextAssembly: ContextAssembly | undefined
): ReturnType<typeof activationRetrievalDiagnosticsFromMetadata> | undefined =>
  contextAssembly === undefined
    ? undefined
    : activationRetrievalDiagnosticsFromMetadata(contextAssembly.metadata);

const contextResource = (
  aggregate: HarnessRunAggregate,
  activationTrace: DecisionPacketReadModelActivationTrace | undefined
): DecisionPacketReadModelContext => {
  const contextAssembly = aggregate.contextAssembly;
  const activationDiagnostics = activationDiagnosticsResource(contextAssembly);

  return {
    status: contextAssembly?.status ?? "missing",
    inclusions: contextAssembly?.inclusions.length ?? 0,
    exclusions: contextAssembly?.exclusions.length ?? 0,
    inclusionDetails: contextAssembly?.inclusions.map(contextInclusionResource) ?? [],
    exclusionDetails: contextAssembly?.exclusions.map(contextExclusionResource) ?? [],
    ...(activationDiagnostics === undefined ? {} : { activationDiagnostics }),
    ...(activationTrace === undefined ? {} : { activationTrace })
  };
};

export const evidenceBundleFreshness = (
  bundle: HarnessRunAggregate["evidenceBundles"][number],
  referenceTime: string
): DecisionPacketReadModelEvidenceFreshness => {
  const createdAt = Date.parse(bundle.createdAt);
  const reference = Date.parse(referenceTime);

  if (!Number.isFinite(createdAt) || !Number.isFinite(reference)) {
    return "unknown";
  }

  return createdAt >= reference ? "fresh_current" : "stale_historical";
};

const evidenceBundleResource = (
  bundle: HarnessRunAggregate["evidenceBundles"][number],
  referenceTime: string
): DecisionPacketReadModelEvidenceBundle => {
  const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);
  const packetChecksum = readMetadataString(bundle.metadata, "decisionPacketChecksum");
  const packetBinding = decisionPacketBindingReadbackFromMetadata(bundle.metadata);

  return {
    id: bundle.id,
    executionRunId: bundle.executionRunId,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
    status: bundle.status,
    freshness: evidenceBundleFreshness(bundle, referenceTime),
    ...(packetChecksum === undefined ? {} : { packetChecksum }),
    packetBinding,
    diffRisk: bundle.diffRisk,
    reviewBurden: bundle.reviewBurden,
    rollbackPath: bundle.rollbackPath,
    changedFiles: {
      all: bundle.changedFiles,
      classification: changedFileClassification(bundle)
    },
    commands: bundle.commands.map(commandResource),
    ...(targetEvidence === undefined ? {} : { targetEvidence })
  };
};

const reviewAssessmentResource = (
  assessment: HarnessRunAggregate["reviewAssessments"][number]
): DecisionPacketReadModelReviewAssessment => ({
  id: assessment.id,
  status: assessment.status,
  reviewer: assessment.reviewer
});

const feedbackDeltaResource = (
  feedback: FeedbackDelta
): DecisionPacketReadModelFeedbackDelta => {
  const summary = summarizeFeedbackCandidateProposals(feedback);

  return {
    id: feedback.id,
    status: feedback.status,
    memoryRecordMutation: summary.memoryRecordMutation,
    candidateCounts: {
      memory: summary.counts.memoryCandidates,
      source: summary.counts.sourceClaimCandidates + summary.counts.sourceDecisionCandidates,
      sourceClaim: summary.counts.sourceClaimCandidates,
      sourceDecision: summary.counts.sourceDecisionCandidates,
      antiMemory: summary.counts.antiMemoryCandidates,
      eval: summary.counts.evalCandidates,
      observation: summary.counts.observationCandidates
    },
    candidates: decisionPacketReadModelCandidates(feedback),
    sourceUsefulnessOutcomes: decisionPacketReadModelSourceUsefulnessOutcomes(feedback),
    knowledgeUsefulnessOutcomes: decisionPacketReadModelKnowledgeUsefulnessOutcomes(feedback)
  };
};

const proofResource = (): DecisionPacketReadModelProof => ({
  proves: [...decisionPacketReadModelProves],
  doesNotProve: [...decisionPacketReadModelDoesNotProve]
});

export const knowledgeSelectionResource = (
  aggregate: HarnessRunAggregate
): ReturnType<typeof knowledgeSelectionFromMetadata> =>
  knowledgeSelectionFromMetadata(aggregate.harnessPlan.metadata) ??
  knowledgeSelectionFromMetadata(aggregate.executionRun.metadata);

export const buildDecisionPacketReadModel = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModel => {
  const projectResolution = projectResolutionFromMetadata(aggregate.executionRun.metadata);
  const activationTrace = activationTraceResource(aggregate);
  const evidenceContractActivation = decideEvidenceContractActivation({
    evidenceContract: aggregate.harnessPlan.metadata.evidenceContract,
    taskContract: aggregate.taskContract,
    harnessPlan: aggregate.harnessPlan,
    executionRun: aggregate.executionRun
  });
  const evidenceContract = evidenceContractActivation.evidenceContract;
  const knowledgeSelection = knowledgeSelectionResource(aggregate);

  return {
    kind: "krn.decisionPacket.readModel.v1",
    access: "read_only",
    mutation: "none",
    run: runResource(aggregate, projectResolution),
    task: taskResource(aggregate),
    ...(knowledgeSelection === undefined ? {} : { knowledgeSelection }),
    ...(aggregate.harnessPlan.nextAction === undefined
      ? {}
      : { nextAction: aggregate.harnessPlan.nextAction }),
    context: contextResource(aggregate, activationTrace),
    evidenceContractActivation,
    ...(evidenceContract === undefined ? {} : { evidenceContract }),
    evidenceBundles: aggregate.evidenceBundles.map((bundle) =>
      evidenceBundleResource(bundle, aggregate.executionRun.updatedAt)
    ),
    reviewAssessments: aggregate.reviewAssessments.map(reviewAssessmentResource),
    feedbackDeltas: aggregate.feedbackDeltas.map(feedbackDeltaResource),
    proof: proofResource()
  };
};
