import type {
  ProjectResolution
} from "./database-runtime.js";
import {
  formatProjectResolutionKind
} from "./project-resolution-format.js";
import type {
  MaintenancePreviewCandidate,
  MaintenancePreview,
  KnowledgeAcquisitionActivationUtilityEvidence,
  KnowledgeAcquisitionActivationUtilitySignalEvidence,
  KnowledgeAcquisitionEscalationStep,
  KnowledgeAcquisitionLinkedDocumentEvidence,
  MaintenanceJobBoundaryReadback
} from "@krn/maintenance-preview";

interface MaintenancePreviewOutputInput {
  projectId: string;
  projectResolution: ProjectResolution | undefined;
  memoryRecordCount: number;
  sourceClaimCount: number;
  sourceClaimEdgeCount: number;
  candidateKinds: readonly string[];
  preview: MaintenancePreview;
}

const formatList = (values: readonly string[]): string[] =>
  values.length === 0 ? ["  - none"] : values.map((value) => `  - ${value}`);

const formatLinkedDocumentEvidence = (
  evidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined
): string[] => {
  if (evidence === undefined) {
    return [
      "  linkedDocumentEvidence:",
      "  - none"
    ];
  }

  return [
    "  linkedDocumentEvidence:",
    `  - sourceClaimDocumentLinks: ${evidence.sourceClaimDocumentLinks}`,
    `  - linkedSearchDocuments: ${evidence.linkedSearchDocuments}`,
    "  linkedDocumentEvidenceCaveats:",
    ...formatList(evidence.caveats)
  ];
};

const formatActivationUtilitySignalEvidence = (
  evidence: KnowledgeAcquisitionActivationUtilitySignalEvidence
): string[] => [
  `  - ${evidence.signal}: ${evidence.strength}`,
  ...evidence.reasons.map((reason) => `    - ${reason}`)
];

const formatActivationUtilityEvidence = (
  evidence: KnowledgeAcquisitionActivationUtilityEvidence | undefined
): string[] => {
  if (evidence === undefined) {
    return [];
  }

  return [
    "  activationUtilityEvidence:",
    `  - verdict: ${evidence.verdict}`,
    ...formatActivationUtilitySignalEvidence(evidence.selectedKnowledge),
    ...formatActivationUtilitySignalEvidence(evidence.sourceLinkGraph),
    `  - recommendedNextAction: ${evidence.recommendedNextAction}`,
    `  - doesNotProve: ${evidence.doesNotProve}`
  ];
};

const formatAcquisitionEscalationPreview = (
  steps: readonly KnowledgeAcquisitionEscalationStep[]
): string[] => [
  "  acquisitionEscalationPreview:",
  ...(steps.length === 0
    ? ["  - none"]
    : steps.map((step) =>
      `  - ${step.order}. ${step.source} | cost: ${step.cost} | action: ${step.action} | when: ${step.when} | doesNotProve: ${step.doesNotProve}`
    ))
];

const formatMaintenanceWriteBoundary = (
  writeBoundary: MaintenanceJobBoundaryReadback | undefined
): string[] => {
  if (writeBoundary === undefined) {
    return [];
  }

  return [
    "  maintenanceWriteBoundary:",
    `  - jobType: ${writeBoundary.jobType}`,
    `  - memoryCoreGate: ${writeBoundary.memoryCoreGate}`,
    `  - status: ${writeBoundary.status}`,
    `  - idempotencyKey: ${writeBoundary.idempotencyKey}`,
    "  - allowedWrites:",
    ...formatList(writeBoundary.allowedWrites),
    "  - forbiddenWrites:",
    ...formatList(writeBoundary.forbiddenWrites),
    `  - doesNotProve: ${writeBoundary.doesNotProve}`
  ];
};

const candidateMaintenanceWriteBoundary = (
  candidate: MaintenancePreviewCandidate
): MaintenanceJobBoundaryReadback | undefined =>
  "maintenanceWriteBoundary" in candidate ? candidate.maintenanceWriteBoundary : undefined;

const formatProjectResolutionLines = (
  projectResolution: ProjectResolution | undefined
): string[] => {
  if (projectResolution === undefined) {
    return [
      "Project resolution: unavailable",
      "Project resolution doesNotProve: missing resolution metadata does not prove the wrong project was used."
    ];
  }

  return [
    `Project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
    `Project resolution reason: ${projectResolution.reason}`,
    ...(projectResolution.repoPathHint === undefined
      ? []
      : [`Project resolution repoPathHint: ${projectResolution.repoPathHint}`]),
    `Project resolution doesNotProve: ${projectResolution.doesNotProve}`
  ];
};

const candidateTargetLines = (candidate: MaintenancePreviewCandidate): string[] => {
  if (candidate.kind === "memory_staleness_maintenance_candidate") {
    return [
      `  memoryRecordId: ${candidate.memoryRecordId}`,
      `  memoryKey: ${candidate.memoryKey}`,
      `  memoryKind: ${candidate.memoryKind}`,
      `  memoryStatus: ${candidate.memoryStatus}`,
      `  invalidationIntent: ${candidate.invalidationIntent}`,
      "  sourceLineageRefs:",
      ...formatList(candidate.sourceLineageRefs)
    ];
  }

  if (candidate.kind === "source_relation_maintenance_candidate") {
    return [
      `  sourceClaimEdgeId: ${candidate.sourceClaimEdgeId}`,
      `  fromSourceClaimId: ${candidate.fromSourceClaimId}`,
      `  toSourceClaimId: ${candidate.toSourceClaimId}`,
      `  edgeKind: ${candidate.edgeKind}`,
      `  relationReviewFocus: ${candidate.relationReviewFocus}`,
      `  relationReviewQuestion: ${candidate.relationReviewQuestion}`,
      "  relationEvidenceRefs:",
      ...formatList(candidate.relationEvidenceRefs),
      `  relationEvidenceRequest: ${candidate.relationEvidenceRequest}`
    ];
  }

  if (candidate.kind === "consensus_candidate_evaluation_preview") {
    return [
      `  candidateId: ${candidate.candidateId}`,
      `  candidateKind: ${candidate.candidateKind}`,
      "  decisionOptions:",
      ...formatList(candidate.decisionOptions),
      "  supportEvidenceRefs:",
      ...formatList(candidate.supportEvidenceRefs),
      "  dissentEvidenceRefs:",
      ...formatList(candidate.dissentEvidenceRefs),
      "  riskEvidenceRefs:",
      ...formatList(candidate.riskEvidenceRefs),
      ...(candidate.relationReview === undefined
        ? [
            "  relationReview:",
            "  - none"
          ]
        : [
            "  relationReview:",
            `  - sourceClaimEdgeId: ${candidate.relationReview.sourceClaimEdgeId}`,
            `  - edgeKind: ${candidate.relationReview.edgeKind}`,
            `  - relationReviewFocus: ${candidate.relationReview.relationReviewFocus}`,
            `  - relationReviewQuestion: ${candidate.relationReview.relationReviewQuestion}`,
            `  - consumedBy: ${candidate.relationReview.consumedBy}`,
            `  - reviewUsefulness: ${candidate.relationReview.reviewUsefulness}`,
            `  - doesNotProve: ${candidate.relationReview.doesNotProve}`
          ]),
      "  preservedDissent:",
      ...(candidate.preservedDissent.length === 0
        ? ["  - none"]
        : candidate.preservedDissent.flatMap((item) => [
            `  - ${item.id}: ${item.summary}`,
            `    evidenceRef: ${item.evidenceRef}`,
            `    doesNotProve: ${item.doesNotProve}`
          ]))
    ];
  }

  return [
    `  requestId: ${candidate.requestId}`,
    `  source: ${candidate.source}`,
    `  query: ${candidate.query}`,
    "  missingEvidence:",
    ...formatList(candidate.missingEvidence),
    "  queryShapeDiagnostics:",
    ...formatList(candidate.queryShapeDiagnostics),
    "  recommendedFollowUp:",
    ...formatList(candidate.recommendedFollowUp),
    ...formatLinkedDocumentEvidence(candidate.linkedDocumentEvidence),
    ...formatActivationUtilityEvidence(candidate.activationUtilityEvidence),
    ...formatAcquisitionEscalationPreview(candidate.acquisitionEscalationPreview),
    `  acquisitionEvidenceRequest: ${candidate.acquisitionEvidenceRequest}`,
    `  consumer: ${candidate.consumer}`,
    `  falsifier: ${candidate.falsifier}`
  ];
};

const candidateAction = (candidate: MaintenancePreviewCandidate): string =>
  "action" in candidate
    ? candidate.action
    : candidate.decisionOptions.join(", ");

const candidateReason = (candidate: MaintenancePreviewCandidate): string =>
  "reason" in candidate
    ? candidate.reason
    : "Consensus preview preserves support, dissent, risk, and relation review focus for operator review.";

const formatCandidate = (candidate: MaintenancePreviewCandidate): string[] => {
  const action = candidateAction(candidate);

  return [
    `- candidate: ${candidate.id}`,
    `  kind: ${candidate.kind}`,
    `  action: ${action}`,
    `  nextAction: ${action}`,
    `  reason: ${candidateReason(candidate)}`,
    `  reviewability: ${candidate.reviewability}`,
    "  reviewabilityReasons:",
    ...formatList(candidate.reviewabilityReasons),
    `  summary: ${candidate.summary}`,
    `  applicationGuidance: ${candidate.applicationGuidance}`,
    ...candidateTargetLines(candidate),
    "  evidenceRefs:",
    ...formatList(candidate.evidenceRefs),
    `  doesNotProve: ${candidate.doesNotProve}`,
    `  mutation: ${candidate.mutation}`,
    ...formatMaintenanceWriteBoundary(candidateMaintenanceWriteBoundary(candidate)),
    "  forbiddenWrites:",
    ...formatList(candidate.forbiddenWrites)
  ];
};

const formatReviewEvalClosure = (preview: MaintenancePreview): string[] => [
  "Candidate review/eval closure:",
  `decision: ${preview.reviewEvalClosure.decision}`,
  `nextAction: ${preview.reviewEvalClosure.nextAction}`,
  `summary: ${preview.reviewEvalClosure.summary}`,
  "candidateIds:",
  ...formatList(preview.reviewEvalClosure.candidateIds),
  "evidenceRefs:",
  ...formatList(preview.reviewEvalClosure.evidenceRefs),
  `doesNotProve: ${preview.reviewEvalClosure.doesNotProve}`,
  `mutation: ${preview.reviewEvalClosure.mutation}`,
  "forbiddenWrites:",
  ...formatList(preview.reviewEvalClosure.forbiddenWrites)
];

const formatRuntimeLoop = (preview: MaintenancePreview): string[] => [
  "Candidate routing:",
  `mode: ${preview.manualCandidateLoop.mode}`,
  `status: ${preview.manualCandidateLoop.status}`,
  `nextAction: ${preview.manualCandidateLoop.nextAction}`,
  `summary: ${preview.manualCandidateLoop.summary}`,
  `inspectedCandidates: ${preview.manualCandidateLoop.inspectedCandidates}`,
  `reviewableCandidates: ${preview.manualCandidateLoop.reviewableCandidates}`,
  `doesNotProve: ${preview.manualCandidateLoop.doesNotProve}`,
  `mutation: ${preview.manualCandidateLoop.mutation}`,
  "forbiddenWrites:",
  ...formatList(preview.manualCandidateLoop.forbiddenWrites)
];

const formatCandidateReviewResult = (preview: MaintenancePreview): string[] => {
  if (preview.candidateReviewResult === undefined) {
    return [];
  }

  return [
    "Candidate review result:",
    `candidateId: ${preview.candidateReviewResult.candidateId}`,
    `candidateFound: ${preview.candidateReviewResult.candidateFound}`,
    `decision: ${preview.candidateReviewResult.decision}`,
    `nextAction: ${preview.candidateReviewResult.nextAction}`,
    `reason: ${preview.candidateReviewResult.reason}`,
    ...(preview.candidateReviewResult.reviewer === undefined
      ? []
      : [`reviewer: ${preview.candidateReviewResult.reviewer}`]),
    ...(preview.candidateReviewResult.candidateReviewability === undefined
      ? []
      : [`candidateReviewability: ${preview.candidateReviewResult.candidateReviewability}`]),
    "evidenceRefs:",
    ...formatList(preview.candidateReviewResult.evidenceRefs),
    `doesNotProve: ${preview.candidateReviewResult.doesNotProve}`,
    `mutation: ${preview.candidateReviewResult.mutation}`,
    "forbiddenWrites:",
    ...formatList(preview.candidateReviewResult.forbiddenWrites)
  ];
};

export const formatMaintenancePreview = (
  input: MaintenancePreviewOutputInput
): string =>
  [
    "KRN Maintenance Candidate Preview",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    `Project: ${input.projectId}`,
    ...formatProjectResolutionLines(input.projectResolution),
    `Candidate kinds: ${input.candidateKinds.join(", ")}`,
    `Generated at: ${input.preview.generatedAt}`,
    "",
    ...formatReviewEvalClosure(input.preview),
    "",
    ...formatRuntimeLoop(input.preview),
    ...(input.preview.candidateReviewResult === undefined
      ? []
      : ["", ...formatCandidateReviewResult(input.preview)]),
    "",
    "Input readback:",
    `memoryRecords: ${input.memoryRecordCount}`,
    `sourceClaims: ${input.sourceClaimCount}`,
    `sourceClaimEdges: ${input.sourceClaimEdgeCount}`,
    "",
    "Candidate counts:",
    `memoryStaleness: ${input.preview.candidateCounts.memoryStaleness}`,
    `sourceRelation: ${input.preview.candidateCounts.sourceRelation}`,
    `knowledgeAcquisition: ${input.preview.candidateCounts.knowledgeAcquisition}`,
    `consensusEvaluation: ${input.preview.candidateCounts.consensusEvaluation}`,
    `skippedMemoryRecords: ${input.preview.skippedCounts.memoryRecords}`,
    `skippedSourceClaimEdges: ${input.preview.skippedCounts.sourceClaimEdges}`,
    `skippedKnowledgeAcquisitionRequests: ${input.preview.skippedCounts.knowledgeAcquisitionRequests}`,
    `skippedConsensusCandidates: ${input.preview.skippedCounts.consensusCandidates}`,
    "",
    "Candidates:",
    ...(input.preview.candidates.length === 0
      ? ["- none"]
      : input.preview.candidates.flatMap(formatCandidate)),
    "",
    "Mutation boundary:",
    `mutation: ${input.preview.mutation}`,
    "forbiddenWrites:",
    ...formatList(input.preview.forbiddenWrites),
    "",
    "Proof:",
    `- proves: ${input.preview.proof}`,
    `- doesNotProve: ${input.preview.doesNotProve}`
  ].join("\n");

export const jsonMaintenancePreviewOutput = (
  input: MaintenancePreviewOutputInput
): string => JSON.stringify({
  ...input,
  preview: {
    ...input.preview,
    candidates: input.preview.candidates.map((candidate) => ({
      ...candidate,
      nextAction: candidateAction(candidate)
    }))
  }
}, null, 2);
