import {
  patternUsefulnessOutcomesFromMetadata,
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
  sourceClaimEdgeInfluenceFromMetadata
} from "./run-readback-decoders.js";
import {
  runReadbackDoesNotProve,
  runReadbackProves
} from "./run-readback-resource.js";
import type {
  RunReadbackActivationCandidateResource,
  RunReadbackActivationDecisionResource,
  RunReadbackActivationTraceResource,
  RunReadbackCandidateResource,
  RunReadbackCommandResource,
  RunReadbackContextExclusionResource,
  RunReadbackContextInclusionResource,
  RunReadbackContextResource,
  RunReadbackEvidenceBundleResource,
  RunReadbackFeedbackDeltaResource,
  RunReadbackPatternUsefulnessOutcomeResource,
  RunReadbackProofResource,
  RunReadbackResource,
  RunReadbackReviewAssessmentResource,
  RunReadbackRunResource,
  RunReadbackSourceUsefulnessOutcomeResource,
  RunReadbackTaskResource
} from "./run-readback-resource.js";
import {
  retainedPatternSelectionFromMetadata
} from "./retained-pattern-selection.js";
import type { ProjectResolution } from "./database-runtime.js";

const commandResource = (command: EvidenceCommand): RunReadbackCommandResource => {
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
): RunReadbackContextInclusionResource => ({
  subjectType: inclusion.subjectType,
  subjectId: inclusion.subjectId,
  reason: inclusion.reason,
  expectedUse: inclusion.expectedUse,
  trustTier: inclusion.trustTier,
  ...(inclusion.tokenEstimate === undefined ? {} : { tokenEstimate: inclusion.tokenEstimate })
});

const contextExclusionResource = (
  exclusion: ContextExclusion
): RunReadbackContextExclusionResource => ({
  subjectType: exclusion.subjectType,
  subjectId: exclusion.subjectId,
  reason: exclusion.reason,
  explanation: exclusion.explanation,
  trustTier: exclusion.trustTier,
  ...(exclusion.score === undefined ? {} : { score: exclusion.score })
});

const activationCandidateResource = (
  candidate: RetrievalCandidateRecord
): RunReadbackActivationCandidateResource => {
  const sourceClaimEdgeInfluence = sourceClaimEdgeInfluenceFromMetadata(candidate.metadata);

  return {
    id: candidate.id,
    kind: candidate.kind,
    status: candidate.status,
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    trustTier: candidate.trustTier,
    ...(candidate.lexicalScore === undefined ? {} : { lexicalScore: candidate.lexicalScore }),
    ...(candidate.vectorScore === undefined ? {} : { vectorScore: candidate.vectorScore }),
    ...(candidate.graphScore === undefined ? {} : { graphScore: candidate.graphScore }),
    ...(candidate.temporalScore === undefined ? {} : { temporalScore: candidate.temporalScore }),
    ...(candidate.contextRoiScore === undefined ? {} : { contextRoiScore: candidate.contextRoiScore }),
    ...(candidate.totalScore === undefined ? {} : { totalScore: candidate.totalScore }),
    ...(candidate.score === undefined ? {} : { score: candidate.score }),
    reason: candidate.reason,
    ...(sourceClaimEdgeInfluence === undefined ? {} : { sourceClaimEdgeInfluence })
  };
};

const activationDecisionResource = (
  decision: ActivationDecisionRecord
): RunReadbackActivationDecisionResource => ({
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
    : { retrievalCandidateId: decision.retrievalCandidateId })
});

export const activationTraceResource = (
  aggregate: HarnessRunAggregate
): RunReadbackActivationTraceResource | undefined =>
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
}): RunReadbackCandidateResource => {
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
): RunReadbackCandidateResource | undefined => {
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
): RunReadbackCandidateResource[] =>
  readMetadataObjectList(metadata, key).flatMap((item) => {
    const resource = metadataCandidateResource(item, kind, summaryField);
    return resource === undefined ? [] : [resource];
  });

export const runReadbackCandidateResources = (
  feedback: FeedbackDelta
): RunReadbackCandidateResource[] => [
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

export const runReadbackSourceUsefulnessOutcomes = (
  feedback: FeedbackDelta
): RunReadbackSourceUsefulnessOutcomeResource[] =>
  sourceUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    ...(outcome.sourceClaimId === undefined ? {} : { sourceClaimId: outcome.sourceClaimId }),
    ...(outcome.sourceDecisionId === undefined ? {} : { sourceDecisionId: outcome.sourceDecisionId }),
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    doesNotProve: outcome.doesNotProve
  }));

export const runReadbackPatternUsefulnessOutcomes = (
  feedback: FeedbackDelta
): RunReadbackPatternUsefulnessOutcomeResource[] =>
  patternUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    patternId: outcome.patternId,
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    doesNotProve: outcome.doesNotProve
  }));

const runResource = (
  aggregate: HarnessRunAggregate,
  projectResolution: ProjectResolution | undefined
): RunReadbackRunResource => ({
  id: aggregate.executionRun.id,
  status: aggregate.executionRun.status,
  adapter: aggregate.executionRun.adapter,
  createdAt: aggregate.executionRun.createdAt,
  updatedAt: aggregate.executionRun.updatedAt,
  ...(projectResolution === undefined ? {} : { projectResolution })
});

const taskResource = (
  aggregate: HarnessRunAggregate
): RunReadbackTaskResource => ({
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
  activationTrace: RunReadbackActivationTraceResource | undefined
): RunReadbackContextResource => {
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
): RunReadbackEvidenceBundleResource => {
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
): RunReadbackReviewAssessmentResource => ({
  id: assessment.id,
  status: assessment.status,
  reviewer: assessment.reviewer
});

const feedbackDeltaResource = (
  feedback: FeedbackDelta
): RunReadbackFeedbackDeltaResource => {
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
    candidates: runReadbackCandidateResources(feedback),
    sourceUsefulnessOutcomes: runReadbackSourceUsefulnessOutcomes(feedback),
    patternUsefulnessOutcomes: runReadbackPatternUsefulnessOutcomes(feedback)
  };
};

const proofResource = (): RunReadbackProofResource => ({
  proves: [...runReadbackProves],
  doesNotProve: [...runReadbackDoesNotProve]
});

export const retainedPatternSelectionResource = (
  aggregate: HarnessRunAggregate
): ReturnType<typeof retainedPatternSelectionFromMetadata> =>
  retainedPatternSelectionFromMetadata(aggregate.harnessPlan.metadata) ??
  retainedPatternSelectionFromMetadata(aggregate.executionRun.metadata);

export const buildRunReadbackResource = (
  aggregate: HarnessRunAggregate
): RunReadbackResource => {
  const projectResolution = projectResolutionFromMetadata(aggregate.executionRun.metadata);
  const activationTrace = activationTraceResource(aggregate);
  const retainedPatternSelection = retainedPatternSelectionResource(aggregate);

  return {
    kind: "krn.run.readback.v1",
    access: "read_only",
    mutation: "none",
    run: runResource(aggregate, projectResolution),
    task: taskResource(aggregate),
    ...(retainedPatternSelection === undefined ? {} : { retainedPatternSelection }),
    context: contextResource(aggregate, activationTrace),
    evidenceBundles: aggregate.evidenceBundles.map(evidenceBundleResource),
    reviewAssessments: aggregate.reviewAssessments.map(reviewAssessmentResource),
    feedbackDeltas: aggregate.feedbackDeltas.map(feedbackDeltaResource),
    proof: proofResource()
  };
};
