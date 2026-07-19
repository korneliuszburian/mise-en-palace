import {
  assessCommandOutputArtifactIntegrity,
  knowledgeUsefulnessOutcomesFromMetadata,
  decisionPacketBindingReadbackFromMetadata,
  decisionPacketReadModelDoesNotProve,
  decisionPacketReadModelProves,
  decisionPacketNextActionForHarnessRun,
  decisionPacketToolBoundariesForHarnessRun,
  decideEvidenceContractActivation,
  buildFeedbackRecommendationReadback,
  projectDecisionPacketActivationCandidate,
  projectDecisionPacketActivationDecision,
  projectDecisionPacketTask,
  readMetadataObjectList,
  readMetadataString,
  readMetadataStringList,
  sourceUsefulnessOutcomesFromMetadata,
  summarizeFeedbackCandidateProposals,
  targetEvidenceFromMetadata,
  toEvidenceCommandReadback
} from "@krn/core";
import type {
  CommandOutputArtifact,
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
  readMetadataFiniteNumber
} from "./decision-packet-read-model-decoders.js";
import type {
  DecisionPacketReadModelActivationCandidate,
  DecisionPacketReadModelActivationDecision,
  DecisionPacketReadModelActivationTrace,
  DecisionPacketReadModelCandidate,
  DecisionPacketReadModelCommand,
  DecisionPacketReadModelCommandOutputArtifact,
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
  commandOutputArtifactSha256Hex
} from "./command-output-artifact-hash.js";
import {
  knowledgeSelectionFromMetadata
} from "./knowledge-selection.js";
import type { ProjectResolution } from "./database-runtime.js";
import { isSourceConsensusTimelineReadback } from "./decision-packet-source-consensus-decoder.js";

const commandOutputIntegrityResource = (
  command: EvidenceCommand,
  commandReadback: ReturnType<typeof toEvidenceCommandReadback>,
  artifactsByRef: ReadonlyMap<string, CommandOutputArtifact>
): Pick<
  DecisionPacketReadModelCommand,
  "artifactIntegrity" | "artifactIntegrityReason"
> => {
  if (!("outputRef" in commandReadback) || commandReadback.outputRef === undefined) {
    return command.provenance === "command_runner" ||
      command.provenance === "captured_output_file" ||
      command.provenance === "external_log"
      ? { artifactIntegrity: "unresolved" }
      : {};
  }

  const artifact = artifactsByRef.get(commandReadback.outputRef);

  if (artifact === undefined) {
    return { artifactIntegrity: "unresolved" };
  }

  const integrity = assessCommandOutputArtifactIntegrity(
    artifact,
    commandOutputArtifactSha256Hex
  );

  return integrity.status === "valid"
    ? { artifactIntegrity: "valid" }
    : {
        artifactIntegrity: "invalid",
        artifactIntegrityReason: integrity.reason
      };
};

const commandResource = (
  command: EvidenceCommand,
  artifactsByRef: ReadonlyMap<string, CommandOutputArtifact>
): DecisionPacketReadModelCommand => {
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
    ...commandOutputIntegrityResource(command, commandReadback, artifactsByRef),
    ...(!('capturedAt' in commandReadback) || commandReadback.capturedAt === undefined
      ? {}
      : { capturedAt: commandReadback.capturedAt }),
    ...(!('assertedBy' in commandReadback) || commandReadback.assertedBy === undefined
      ? {}
      : { assertedBy: commandReadback.assertedBy }),
    doesNotProve: commandReadback.doesNotProve
  };
};

const commandOutputArtifactResource = (
  artifact: CommandOutputArtifact
): DecisionPacketReadModelCommandOutputArtifact => {
  const integrity = assessCommandOutputArtifactIntegrity(
    artifact,
    commandOutputArtifactSha256Hex
  );
  const streamResource = (
    stream: CommandOutputArtifact["stdout"]
  ) => ({
    storedBytesSha256: stream.sha256,
    storedByteCount: stream.storedByteCount,
    totalByteCount: stream.totalByteCount,
    truncated: stream.truncated
  });

  return {
    outputRef: artifact.outputRef,
    integrity: integrity.status,
    ...(integrity.status === "valid" ? {} : { integrityReason: integrity.reason }),
    exitCode: artifact.exitCode,
    startedAt: artifact.startedAt,
    completedAt: artifact.completedAt,
    stdout: streamResource(artifact.stdout),
    stderr: streamResource(artifact.stderr)
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
  const authorityProjection = projectDecisionPacketActivationCandidate(candidate);

  return {
    id: candidate.id,
    kind: candidate.kind,
    status: candidate.status,
    ...authorityProjection,
    sourceAuthority: candidate.sourceAuthority,
    ...activationCandidateScores(candidate),
    reason: candidate.reason
  };
};

const activationDecisionResource = (
  decision: ActivationDecisionRecord
): DecisionPacketReadModelActivationDecision => {
  const { reason, ...authorityProjection } = projectDecisionPacketActivationDecision(decision);

  return {
    id: decision.id,
    subjectType: decision.subjectType,
    subjectId: decision.subjectId,
    decision: decision.decision,
    reason,
    ...(decision.score === undefined ? {} : { score: decision.score }),
    ...(decision.expectedDecisionImpact === undefined
      ? {}
      : { expectedDecisionImpact: decision.expectedDecisionImpact }),
    ...(decision.retrievalCandidateId === undefined
      ? {}
      : { retrievalCandidateId: decision.retrievalCandidateId }),
    ...authorityProjection
  };
};

export const activationTraceResource = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModelActivationTrace | undefined => {
  if (aggregate.activationTrace === undefined) return undefined;
  const metadata = aggregate.activationTrace.metadata;
  const candidate = metadata?.sourceConsensusTimeline;
  const sourceConsensusTimeline = isSourceConsensusTimelineReadback(candidate)
    ? candidate
    : undefined;
  return {
        retrievalRunId: aggregate.activationTrace.retrievalRunId,
        ...(sourceConsensusTimeline === undefined ? {} : { sourceConsensusTimeline }),
        candidates: aggregate.activationTrace.candidates.map(activationCandidateResource),
        decisions: aggregate.activationTrace.decisions.map(activationDecisionResource)
      };
};

const evalCandidateEvidenceFields = (
  sourceEvidence: readonly string[] | undefined,
  metadata: Record<string, unknown>
): Pick<
  DecisionPacketReadModelCandidate,
  "sourceEvidence" | "observedOutcome" | "usefulnessOutcome" | "artifactHash"
> => {
  if (sourceEvidence === undefined) return {};
  const observedOutcome = readMetadataString(metadata, "outcome");
  const usefulnessOutcome = readMetadataString(metadata, "usefulnessOutcome");
  const artifactHash = readMetadataString(metadata, "artifactHash") ??
    readMetadataStringList(metadata, "evidenceRefs")
      .find((reference) => reference.startsWith("artifact:sha256:"))?.slice("artifact:sha256:".length);

  return {
    sourceEvidence: [...sourceEvidence],
    ...(observedOutcome === undefined ? {} : { observedOutcome }),
    ...(usefulnessOutcome === undefined ? {} : { usefulnessOutcome }),
    ...(artifactHash === undefined ? {} : { artifactHash })
  };
};

const candidateResource = (input: {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string | undefined;
  summary: string;
  metadata: Record<string, unknown>;
  sourceEvidence?: readonly string[];
}): DecisionPacketReadModelCandidate => {
  const reviewability = candidateReviewability(input.metadata);
  const reviewabilityReasons = candidateReviewabilityReasons(input.metadata);

  return {
    kind: input.kind,
    id: input.id,
    status: input.status ?? "unknown",
    summary: input.summary,
    reviewability,
    ...evalCandidateEvidenceFields(input.sourceEvidence, input.metadata),
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
    metadata: candidate.metadata,
    sourceEvidence: candidate.sourceEvidence
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
      ...(outcome.applicationId === undefined ? {} : { applicationId: outcome.applicationId }),
      ...(outcome.appliedAt === undefined ? {} : { appliedAt: outcome.appliedAt }),
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
  lifecycleRevision: aggregate.executionRun.lifecycleRevision,
  adapter: aggregate.executionRun.adapter,
  createdAt: aggregate.executionRun.createdAt,
  updatedAt: aggregate.executionRun.updatedAt,
  ...(projectResolution === undefined ? {} : { projectResolution })
});

const taskResource = (
  aggregate: HarnessRunAggregate
): DecisionPacketReadModelTask => projectDecisionPacketTask(aggregate.taskContract);

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

export const decisionPacketEvidenceBundleResource = (
  bundle: HarnessRunAggregate["evidenceBundles"][number],
  referenceTime: string,
  currentExecutionRunLifecycleRevision: number
): DecisionPacketReadModelEvidenceBundle => {
  const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);
  const packetChecksum = readMetadataString(bundle.metadata, "decisionPacketChecksum");
  const storedPacketBinding = decisionPacketBindingReadbackFromMetadata(bundle.metadata);
  const lifecycleMismatch = storedPacketBinding.status === "bound_current" &&
    storedPacketBinding.sourceRunLifecycleRevision !== currentExecutionRunLifecycleRevision;
  const packetBinding = lifecycleMismatch
    ? {
        ...storedPacketBinding,
        status: "mismatch" as const,
        reason:
          `DecisionPacket binding lifecycle revision ${storedPacketBinding.sourceRunLifecycleRevision} ` +
          `does not match current ExecutionRun lifecycle revision ${currentExecutionRunLifecycleRevision}.`
      }
    : storedPacketBinding;
  const commandOutputArtifacts = bundle.commandOutputArtifacts ?? [];
  const commandOutputArtifactsByRef = new Map(
    commandOutputArtifacts.map((artifact) => [artifact.outputRef, artifact])
  );

  return {
    id: bundle.id,
    executionRunId: bundle.executionRunId,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
    status: bundle.status,
    freshness: lifecycleMismatch
      ? "stale_lifecycle"
      : evidenceBundleFreshness(bundle, referenceTime),
    ...(packetChecksum === undefined ? {} : { packetChecksum }),
    packetBinding,
    diffRisk: bundle.diffRisk,
    reviewBurden: bundle.reviewBurden,
    rollbackPath: bundle.rollbackPath,
    changedFiles: {
      all: bundle.changedFiles,
      classification: changedFileClassification(bundle)
    },
    commands: bundle.commands.map((command) =>
      commandResource(command, commandOutputArtifactsByRef)
    ),
    commandOutputArtifacts: commandOutputArtifacts.map(commandOutputArtifactResource),
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
  const nextAction = decisionPacketNextActionForHarnessRun(aggregate);

  return {
    kind: "krn.decisionPacket.readModel.v1",
    access: "read_only",
    mutation: "none",
    run: runResource(aggregate, projectResolution),
    task: taskResource(aggregate),
    ...(knowledgeSelection === undefined ? {} : { knowledgeSelection }),
    ...(nextAction === undefined
      ? {}
      : { nextAction }),
    toolBoundaries: decisionPacketToolBoundariesForHarnessRun(aggregate),
    context: contextResource(aggregate, activationTrace),
    evidenceContractActivation,
    ...(evidenceContract === undefined ? {} : { evidenceContract }),
    evidenceBundles: aggregate.evidenceBundles.map((bundle) =>
      decisionPacketEvidenceBundleResource(
        bundle,
        aggregate.executionRun.updatedAt,
        aggregate.executionRun.lifecycleRevision
      )
    ),
    reviewAssessments: aggregate.reviewAssessments.map(reviewAssessmentResource),
    feedbackDeltas: aggregate.feedbackDeltas.map(feedbackDeltaResource),
    proof: proofResource()
  };
};
