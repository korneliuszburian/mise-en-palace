import {
  brainKnowledgeUsefulnessOutcomesFromMetadata,
  readMetadataObjectList,
  readMetadataString,
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
} from "@krn/harness/repositories";

import {
  candidateReviewability,
  candidateReviewabilityReasons,
  changedFileClassification,
  projectResolutionFromMetadata,
  projectStandardDecisionFromMetadata,
  readMetadataFiniteNumber,
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
  DecisionPacketReadModelFeedbackDelta,
  DecisionPacketReadModelBrainKnowledgeUsefulnessOutcome,
  DecisionPacketReadModelProof,
  DecisionPacketReadModel,
  DecisionPacketReadModelReviewAssessment,
  DecisionPacketReadModelRun,
  DecisionPacketReadModelSourceUsefulnessOutcome,
  DecisionPacketReadModelTask
} from "./decision-packet-read-model.js";
import {
  brainKnowledgeSelectionFromMetadata
} from "./brain-knowledge-selection.js";
import type { ProjectResolution } from "./database-runtime.js";

const commandResource = (command: EvidenceCommand): DecisionPacketReadModelCommand => {
  const commandReadback = toEvidenceCommandReadback(command);

  return {
    command: commandReadback.command,
    status: commandReadback.status,
    provenance: commandReadback.provenance,
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
  const projectStandardDecision = projectStandardDecisionFromMetadata(candidate.metadata);

  return {
    id: candidate.id,
    kind: candidate.kind,
    status: candidate.status,
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    sourceAuthority: candidate.sourceAuthority,
    ...activationCandidateScores(candidate),
    reason: candidate.reason,
    ...(projectStandardDecision === undefined ? {} : { projectStandardDecision }),
    ...(sourceClaimEdgeInfluence === undefined ? {} : { sourceClaimEdgeInfluence }),
    ...(sourceDecisionSupportBoost === undefined ? {} : { sourceDecisionSupportBoost })
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
  sourceUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    ...(outcome.sourceClaimId === undefined ? {} : { sourceClaimId: outcome.sourceClaimId }),
    ...(outcome.sourceDecisionId === undefined ? {} : { sourceDecisionId: outcome.sourceDecisionId }),
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    doesNotProve: outcome.doesNotProve
  }));

export const decisionPacketReadModelBrainKnowledgeUsefulnessOutcomes = (
  feedback: FeedbackDelta
): DecisionPacketReadModelBrainKnowledgeUsefulnessOutcome[] =>
  brainKnowledgeUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    brainKnowledgeId: outcome.brainKnowledgeId,
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
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

const evidenceBundleResource = (
  bundle: HarnessRunAggregate["evidenceBundles"][number]
): DecisionPacketReadModelEvidenceBundle => {
  const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);

  return {
    id: bundle.id,
    status: bundle.status,
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
    brainKnowledgeUsefulnessOutcomes: decisionPacketReadModelBrainKnowledgeUsefulnessOutcomes(feedback)
  };
};

const proofResource = (): DecisionPacketReadModelProof => ({
  proves: [...decisionPacketReadModelProves],
  doesNotProve: [...decisionPacketReadModelDoesNotProve]
});

export const brainKnowledgeSelectionResource = (
  aggregate: HarnessRunAggregate
): ReturnType<typeof brainKnowledgeSelectionFromMetadata> =>
  brainKnowledgeSelectionFromMetadata(aggregate.harnessPlan.metadata) ??
  brainKnowledgeSelectionFromMetadata(aggregate.executionRun.metadata);

export const buildDecisionPacketReadModel = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModel => {
  const projectResolution = projectResolutionFromMetadata(aggregate.executionRun.metadata);
  const activationTrace = activationTraceResource(aggregate);
  const brainKnowledgeSelection = brainKnowledgeSelectionResource(aggregate);

  return {
    kind: "krn.decisionPacket.readModel.v1",
    access: "read_only",
    mutation: "none",
    run: runResource(aggregate, projectResolution),
    task: taskResource(aggregate),
    ...(brainKnowledgeSelection === undefined ? {} : { brainKnowledgeSelection }),
    context: contextResource(aggregate, activationTrace),
    evidenceBundles: aggregate.evidenceBundles.map(evidenceBundleResource),
    reviewAssessments: aggregate.reviewAssessments.map(reviewAssessmentResource),
    feedbackDeltas: aggregate.feedbackDeltas.map(feedbackDeltaResource),
    proof: proofResource()
  };
};
