import {
  summarizeFeedbackCandidateProposals,
  targetEvidenceFromMetadata,
  toEvidenceCommandReadback
} from "@krn/core";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  EvidenceCommand,
  FeedbackDelta,
  TargetEvidence
} from "@krn/core";
import { formatActivationRetrievalDiagnostics } from "@krn/harness";
import type { ActivationRetrievalDiagnostics } from "@krn/harness";
import type { HarnessRunAggregate } from "@krn/harness/repositories";

import type { ProjectResolution } from "./database-runtime.js";
import { formatProjectResolutionKind } from "./project-resolution-format.js";
import { formatBrainKnowledgeSelectionLines } from "./brain-knowledge-selection.js";
import {
  metadataArrayLength,
  projectResolutionFromMetadata
} from "./decision-packet-read-model-decoders.js";
import {
  activationDiagnosticsResource,
  activationTraceResource,
  brainKnowledgeSelectionResource,
  decisionPacketReadModelCandidates,
  decisionPacketReadModelBrainKnowledgeUsefulnessOutcomes,
  decisionPacketReadModelSourceUsefulnessOutcomes
} from "./decision-packet-read-model-builders.js";
import {
  decisionPacketReadModelDoesNotProve,
  decisionPacketReadModelProves
} from "./decision-packet-read-model.js";

const renderCommand = (command: EvidenceCommand): string[] => {
  const commandReadback = toEvidenceCommandReadback(command);

  return [
    `- ${commandReadback.command}: ${commandReadback.status} | provenance=${commandReadback.provenance}`,
    `  doesNotProve: ${commandReadback.doesNotProve}`
  ];
};

const renderCommands = (commands: readonly EvidenceCommand[]): string[] =>
  commands.length === 0
    ? ["- none"]
    : commands.flatMap(renderCommand);

const contextSubjectRef = (item: { subjectType: string; subjectId: string }): string =>
  `${item.subjectType}:${item.subjectId}`;

const renderContextInclusion = (inclusion: ContextInclusion): string[] => [
  `  - ${contextSubjectRef(inclusion)}`,
  `    reason: ${inclusion.reason}`,
  `    expectedUse: ${inclusion.expectedUse}`,
  `    trustTier: ${inclusion.trustTier}`,
  ...(inclusion.tokenEstimate === undefined ? [] : [`    tokenEstimate: ${inclusion.tokenEstimate}`])
];

const renderContextExclusion = (exclusion: ContextExclusion): string[] => [
  `  - ${contextSubjectRef(exclusion)}`,
  `    reason: ${exclusion.reason}`,
  `    explanation: ${exclusion.explanation}`,
  `    trustTier: ${exclusion.trustTier}`,
  ...(exclusion.score === undefined ? [] : [`    score: ${exclusion.score}`])
];

const renderContextDetails = (
  contextAssembly: ContextAssembly | undefined
): string[] => {
  const inclusions = contextAssembly?.inclusions ?? [];
  const exclusions = contextAssembly?.exclusions ?? [];

  return [
    "Context inclusion details:",
    ...(inclusions.length === 0 ? ["  - none"] : inclusions.flatMap(renderContextInclusion)),
    "Context exclusion details:",
    ...(exclusions.length === 0 ? ["  - none"] : exclusions.flatMap(renderContextExclusion))
  ];
};

const renderList = (values: readonly string[]): string[] =>
  values.length === 0
    ? ["    - none"]
    : values.map((value) => `    - ${value}`);

const renderTargetEvidence = (targetEvidence: TargetEvidence | undefined): string[] => {
  if (targetEvidence === undefined) {
    return [
      "  targetEvidence:",
      "  - none"
    ];
  }

  return [
    "  targetEvidence:",
    `  - repo: ${targetEvidence.targetRepo}`,
    `  - mode: ${targetEvidence.mode}`,
    `  - dirtyBefore: ${targetEvidence.dirtyBefore}`,
    `  - dirtyAfter: ${targetEvidence.dirtyAfter}`,
    `  - ownedChanges: ${targetEvidence.ownedChanges}`,
    `  - targetStatusFreshness: ${targetEvidence.targetStatusFreshness}`,
    `  - targetPatchLifecycle: ${targetEvidence.targetPatchLifecycle}`,
    `  - handoffArtifact: ${targetEvidence.handoffArtifact ?? "none"}`,
    `  - targetOwnerDecision: ${targetEvidence.targetOwnerDecision ?? "none"}`,
    "  - allowedWrites:",
    ...renderList(targetEvidence.allowedWrites),
    "  - forbiddenWrites:",
    ...renderList(targetEvidence.forbiddenWrites),
    "  - changedFiles:",
    ...(targetEvidence.changedFiles.length === 0
      ? ["    - none"]
      : targetEvidence.changedFiles.map((file) =>
          `    - ${file.status} ${file.path} | ownership=${file.ownership}`
        )),
    "  - commands:",
    ...renderList(targetEvidence.commands),
    "  - doesNotProve:",
    ...renderList(targetEvidence.doesNotProve)
  ];
};

const renderActivationTrace = (
  aggregate: HarnessRunAggregate
): string[] => {
  const trace = activationTraceResource(aggregate);

  if (trace === undefined) {
    return [
      "Activation trace:",
      "- none"
    ];
  }

  return [
    "Activation trace:",
    `- retrievalRunId: ${trace.retrievalRunId}`,
    `- candidates: ${trace.candidates.length}`,
    ...trace.candidates.flatMap((candidate) => [
      `  - ${candidate.subjectType}:${candidate.subjectId} | status=${candidate.status} | kind=${candidate.kind}`,
      `    scores: lexical=${candidate.lexicalScore ?? 0} vector=${candidate.vectorScore ?? 0} graph=${candidate.graphScore ?? 0} temporal=${candidate.temporalScore ?? 0} contextRoi=${candidate.contextRoiScore ?? 0} total=${candidate.totalScore ?? "unknown"}`,
      `    reason: ${candidate.reason}`,
      ...(candidate.sourceClaimEdgeInfluence === undefined
        ? []
        : [
            "    sourceClaimEdgeInfluence:",
            `      edgeIds: ${candidate.sourceClaimEdgeInfluence.edgeIds.join(", ")}`,
            `      edgeKinds: ${candidate.sourceClaimEdgeInfluence.edgeKinds.join(", ")}`,
            `      seedSourceClaimIds: ${candidate.sourceClaimEdgeInfluence.seedSourceClaimIds.join(", ")}`,
            `      doesNotProve: ${candidate.sourceClaimEdgeInfluence.doesNotProve}`
          ]),
      ...(candidate.sourceDecisionSupportBoost === undefined
        ? []
        : [
            "    sourceDecisionSupportBoost:",
            `      sourceDecisionEdgeIds: ${candidate.sourceDecisionSupportBoost.sourceDecisionEdgeIds.join(", ")}`,
            `      confidence: ${candidate.sourceDecisionSupportBoost.confidence.join(", ")}`,
            `      supportTypes: ${candidate.sourceDecisionSupportBoost.supportTypes.join(", ")}`,
            `      doesNotProve: ${candidate.sourceDecisionSupportBoost.doesNotProve}`
          ])
    ]),
    `- decisions: ${trace.decisions.length}`,
    ...trace.decisions.map((decision) =>
      `  - ${decision.subjectType}:${decision.subjectId} | decision=${decision.decision} | reason=${decision.reason}`
    )
  ];
};

const renderSourceUsefulnessOutcomes = (
  feedback: FeedbackDelta
): string[] => {
  const outcomes = decisionPacketReadModelSourceUsefulnessOutcomes(feedback);

  if (outcomes.length === 0) {
    return ["  source usefulness outcomes: none"];
  }

  return [
    "  source usefulness outcomes:",
    ...outcomes.flatMap((outcome) => [
      `  - outcome=${outcome.outcome} sourceClaim=${outcome.sourceClaimId ?? "none"} sourceDecision=${outcome.sourceDecisionId ?? "none"}`,
      `    reason: ${outcome.reason}`,
      ...(outcome.evidenceRefs.length === 0
        ? ["    evidenceRef: none"]
        : outcome.evidenceRefs.map((evidenceRef) => `    evidenceRef: ${evidenceRef}`)),
      `    doesNotProve: ${outcome.doesNotProve}`
    ])
  ];
};

const renderBrainKnowledgeUsefulnessOutcomes = (
  feedback: FeedbackDelta
): string[] => {
  const outcomes = decisionPacketReadModelBrainKnowledgeUsefulnessOutcomes(feedback);

  if (outcomes.length === 0) {
    return ["  knowledge usefulness outcomes: none"];
  }

  return [
    "  knowledge usefulness outcomes:",
    ...outcomes.flatMap((outcome) => [
      `  - outcome=${outcome.outcome} knowledge=${outcome.brainKnowledgeId}`,
      `    reason: ${outcome.reason}`,
      ...(outcome.evidenceRefs.length === 0
        ? ["    evidenceRef: none"]
        : outcome.evidenceRefs.map((evidenceRef) => `    evidenceRef: ${evidenceRef}`)),
      `    doesNotProve: ${outcome.doesNotProve}`
    ])
  ];
};

const renderFeedbackDelta = (feedback: FeedbackDelta): string[] => {
  const summary = summarizeFeedbackCandidateProposals(feedback);
  const candidateDetails = decisionPacketReadModelCandidates(feedback).flatMap((candidate) => [
    `  - ${candidate.kind}:${candidate.id} | status=${candidate.status} | ${candidate.summary}`,
    `    reviewability: ${candidate.reviewability}`,
    ...candidate.reviewabilityReasons.map((reason) => `    reviewabilityReason: ${reason}`)
  ]);

  return [
    `- ${feedback.id}: status=${feedback.status}`,
    `  memoryRecordMutation: ${summary.memoryRecordMutation}`,
    `  candidates: memory=${summary.counts.memoryCandidates}, source=${summary.counts.sourceClaimCandidates + summary.counts.sourceDecisionCandidates}, source_claim=${summary.counts.sourceClaimCandidates}, source_decision=${summary.counts.sourceDecisionCandidates}, anti_memory=${summary.counts.antiMemoryCandidates}, eval=${summary.counts.evalCandidates}, observation=${summary.counts.observationCandidates}`,
    ...renderSourceUsefulnessOutcomes(feedback),
    ...renderBrainKnowledgeUsefulnessOutcomes(feedback),
    ...(
      candidateDetails.length === 0
        ? ["  candidate details: none"]
        : candidateDetails
    )
  ];
};

const renderEvidenceBundle = (
  aggregate: HarnessRunAggregate
): string[] => {
  if (aggregate.evidenceBundles.length === 0) {
    return ["Evidence Bundles:", "- none"];
  }

  return [
    "Evidence Bundles:",
    ...aggregate.evidenceBundles.flatMap((bundle) => {
      const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);

      return [
        `- ${bundle.id}: status=${bundle.status} diffRisk=${bundle.diffRisk}`,
        `  changedFiles: ${bundle.changedFiles.length}`,
        "  changed file classification:",
        `  - intended=${metadataArrayLength(bundle.metadata, "changedFileClassification", "intended")}`,
        `  - unrelated=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unrelated")}`,
        `  - unknown=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unknown")}`,
        `  reviewBurden: ${bundle.reviewBurden}`,
        `  rollbackPath: ${bundle.rollbackPath}`,
        "  commands:",
        ...renderCommands(bundle.commands).map((line) => `  ${line}`),
        ...renderTargetEvidence(targetEvidence)
      ];
    })
  ];
};

const renderFeedbackDeltas = (feedbackDeltas: readonly FeedbackDelta[]): string[] => [
  "Feedback Deltas:",
  ...(feedbackDeltas.length === 0
    ? ["- none"]
    : feedbackDeltas.flatMap(renderFeedbackDelta))
];

const renderProjectResolution = (
  projectResolution: ProjectResolution | undefined
): string[] => {
  if (projectResolution === undefined) {
    return [];
  }

  const lines = [
    `- project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
    `- project resolution reason: ${projectResolution.reason}`
  ];

  if (projectResolution.repoPathHint !== undefined) {
    lines.push(`- project resolution repoPathHint: ${projectResolution.repoPathHint}`);
  }

  lines.push(`- project resolution does not prove: ${projectResolution.doesNotProve}`);

  return lines;
};

const renderTaskSection = (
  aggregate: HarnessRunAggregate,
  projectResolution: ProjectResolution | undefined
): string[] => [
  "Task:",
  `- id: ${aggregate.taskContract.id}`,
  `- title: ${aggregate.taskContract.title}`,
  `- objective: ${aggregate.taskContract.objective}`,
  `- run status: ${aggregate.executionRun.status}`,
  `- adapter: ${aggregate.executionRun.adapter}`,
  ...renderProjectResolution(projectResolution)
];

const renderContextSection = (
  aggregate: HarnessRunAggregate,
  activationDiagnostics: ActivationRetrievalDiagnostics | undefined
): string[] => [
  "Context:",
  `- status: ${aggregate.contextAssembly?.status ?? "missing"}`,
  `- inclusions: ${aggregate.contextAssembly?.inclusions.length ?? 0}`,
  `- exclusions: ${aggregate.contextAssembly?.exclusions.length ?? 0}`,
  ...renderContextDetails(aggregate.contextAssembly),
  ...(activationDiagnostics === undefined
    ? []
    : formatActivationRetrievalDiagnostics(activationDiagnostics)),
  ...renderActivationTrace(aggregate)
];

const renderBrainKnowledgeSelection = (
  aggregate: HarnessRunAggregate
): string[] => [
  "Brain Knowledge Selection:",
  ...formatBrainKnowledgeSelectionLines(brainKnowledgeSelectionResource(aggregate))
];

const renderReviewAssessments = (
  aggregate: HarnessRunAggregate
): string[] => [
  "Review Assessments:",
  ...(aggregate.reviewAssessments.length === 0
    ? ["- none"]
    : aggregate.reviewAssessments.map((assessment) =>
        `- ${assessment.id}: status=${assessment.status} reviewer=${assessment.reviewer}`
      ))
];

const renderProofSections = (): string[] => [
  "What This Proves:",
  ...decisionPacketReadModelProves.map((proof) => `- ${proof}`),
  "",
  "What This Does Not Prove:",
  ...decisionPacketReadModelDoesNotProve.map((proof) => `- ${proof}`),
  ""
];

export const renderDecisionPacketReadModelText = (
  aggregate: HarnessRunAggregate
): string => {
  const activationDiagnostics = activationDiagnosticsResource(aggregate.contextAssembly);
  const projectResolution = projectResolutionFromMetadata(aggregate.executionRun.metadata);

  return [
    "KRN Decision Packet Read Model",
    `Run ID: ${aggregate.executionRun.id}`,
    "Persistence: read-only (Postgres)",
    "Mutation: none",
    "",
    ...renderTaskSection(aggregate, projectResolution),
    "",
    ...renderBrainKnowledgeSelection(aggregate),
    "",
    ...renderContextSection(aggregate, activationDiagnostics),
    "",
    ...renderEvidenceBundle(aggregate),
    "",
    ...renderReviewAssessments(aggregate),
    "",
    ...renderFeedbackDeltas(aggregate.feedbackDeltas),
    "",
    ...renderProofSections()
  ].join("\n");
};
