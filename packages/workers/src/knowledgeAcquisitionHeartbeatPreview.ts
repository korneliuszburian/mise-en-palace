import {
  assessCandidateReviewability
} from "@krn/core";
import type {
  CandidateReviewability,
  IsoTimestamp
} from "@krn/core";

export type KnowledgeAcquisitionSource =
  | "source_search"
  | "brain_search"
  | "source_artifact_preview";

export type KnowledgeAcquisitionHeartbeatCandidateReason =
  | "missing_evidence";

export type KnowledgeAcquisitionHeartbeatAction =
  | "propose_knowledge_acquisition";

export interface KnowledgeAcquisitionLinkedDocumentEvidence {
  sourceClaimDocumentLinks: number;
  linkedSearchDocuments: number;
  caveats: readonly string[];
}

export type KnowledgeAcquisitionActivationUtilityStrength =
  | "useful"
  | "weak"
  | "missing";

export type KnowledgeAcquisitionActivationUtilityVerdict =
  | "linked_evidence_exploration_candidate"
  | "selected_knowledge_sufficient"
  | "insufficient_evidence";

export interface KnowledgeAcquisitionActivationUtilitySignalEvidence {
  signal: "selected_knowledge" | "source_link_graph";
  strength: KnowledgeAcquisitionActivationUtilityStrength;
  reasons: readonly string[];
}

export interface KnowledgeAcquisitionActivationUtilityEvidence {
  verdict: KnowledgeAcquisitionActivationUtilityVerdict;
  selectedKnowledge: KnowledgeAcquisitionActivationUtilitySignalEvidence;
  sourceLinkGraph: KnowledgeAcquisitionActivationUtilitySignalEvidence;
  recommendedNextAction: string;
  doesNotProve: string;
}

export type KnowledgeAcquisitionEscalationCost =
  | "low"
  | "medium"
  | "high";

export type KnowledgeAcquisitionEscalationSource =
  | "linked_document_review"
  | "source_search_review"
  | "bounded_external_research"
  | "human_review";

export interface KnowledgeAcquisitionEscalationStep {
  order: number;
  source: KnowledgeAcquisitionEscalationSource;
  cost: KnowledgeAcquisitionEscalationCost;
  action: string;
  when: string;
  doesNotProve: string;
}

export interface KnowledgeAcquisitionRequest {
  id: string;
  source: KnowledgeAcquisitionSource;
  query: string;
  missingEvidence: readonly string[];
  queryShapeDiagnostics?: readonly string[];
  recommendedFollowUp?: readonly string[];
  linkedDocumentEvidence?: KnowledgeAcquisitionLinkedDocumentEvidence;
  activationUtilityEvidence?: KnowledgeAcquisitionActivationUtilityEvidence;
  evidenceRefs: readonly string[];
  consumer: string;
  falsifier: string;
  doesNotProve: string;
}

export interface KnowledgeAcquisitionHeartbeatCandidate {
  id: string;
  kind: "knowledge_acquisition_candidate";
  action: KnowledgeAcquisitionHeartbeatAction;
  reason: KnowledgeAcquisitionHeartbeatCandidateReason;
  requestId: string;
  source: KnowledgeAcquisitionSource;
  query: string;
  missingEvidence: readonly string[];
  queryShapeDiagnostics: readonly string[];
  recommendedFollowUp: readonly string[];
  linkedDocumentEvidence?: KnowledgeAcquisitionLinkedDocumentEvidence;
  activationUtilityEvidence?: KnowledgeAcquisitionActivationUtilityEvidence;
  acquisitionEscalationPreview: readonly KnowledgeAcquisitionEscalationStep[];
  summary: string;
  applicationGuidance: string;
  acquisitionEvidenceRequest: string;
  consumer: string;
  falsifier: string;
  evidenceRefs: readonly string[];
  doesNotProve: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: readonly string[];
  mutation: "none";
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges",
    "eval_candidates",
    "worker_jobs"
  ];
}

export interface BuildKnowledgeAcquisitionHeartbeatPreviewInput {
  now: IsoTimestamp;
  requests: readonly KnowledgeAcquisitionRequest[];
  evidenceRef: string;
  maxCandidates?: number;
}

export interface KnowledgeAcquisitionHeartbeatPreview {
  generatedAt: IsoTimestamp;
  candidates: readonly KnowledgeAcquisitionHeartbeatCandidate[];
  skippedRequestCount: number;
  mutation: "none";
  proof: string;
  doesNotProve: string;
}

const forbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions",
  "source_claim_edges",
  "eval_candidates",
  "worker_jobs"
] as const;

const previewDoesNotProve =
  "Knowledge-acquisition heartbeat preview does not prove source truth, acquired knowledge quality, ranking quality, autonomous worker execution, crawler readiness, or Memory Core mutation.";

const previewProof =
  "Knowledge-acquisition heartbeat preview turns explicit missing-evidence readback into reviewable candidate-only acquisition work without mutating Memory Core, source truth, source decisions, eval candidates, worker jobs, or DB schema.";

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const nonEmptyStrings = (values: readonly string[]): readonly string[] =>
  values.filter(hasText);

const linkedDocumentEvidenceGuidance = (
  evidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined
): string => {
  if (evidence === undefined) {
    return "";
  }

  const caveat =
    evidence.caveats.length === 0
      ? ""
      : ` Caveats: ${evidence.caveats.join(" ")}`;

  return ` Review linked document evidence before opening new acquisition: ${evidence.sourceClaimDocumentLinks} source-claim document link(s), ${evidence.linkedSearchDocuments} linked SearchDocument(s).${caveat}`;
};

const activationUtilityEvidenceGuidance = (
  evidence: KnowledgeAcquisitionActivationUtilityEvidence | undefined
): string => {
  if (evidence === undefined) {
    return "";
  }

  return ` Activation utility readback: ${evidence.verdict}; selectedKnowledge=${evidence.selectedKnowledge.strength}; sourceLinkGraph=${evidence.sourceLinkGraph.strength}. Next action: ${evidence.recommendedNextAction}`;
};

const hasLinkedDocumentEvidence = (
  evidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined
): boolean =>
  evidence !== undefined &&
  (evidence.sourceClaimDocumentLinks > 0 || evidence.linkedSearchDocuments > 0);

const buildAcquisitionEscalationPreview = (
  input: {
    linkedDocumentEvidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined;
  }
): readonly KnowledgeAcquisitionEscalationStep[] => {
  const steps: KnowledgeAcquisitionEscalationStep[] = [];

  if (hasLinkedDocumentEvidence(input.linkedDocumentEvidence)) {
    steps.push({
      order: 1,
      source: "linked_document_review",
      cost: "low",
      action: "Review linked SearchDocuments already attached to supporting SourceClaims.",
      when: "Use before opening new acquisition when linkedDocumentEvidence exists.",
      doesNotProve: "Linked document review does not prove source truth or lexical retrieval inclusion."
    });
  }

  steps.push({
    order: steps.length + 1,
    source: "source_search_review",
    cost: "low",
    action: "Run or review a narrower store-backed source/brain search for the missing evidence.",
    when: "Use when linked evidence is absent, insufficient, stale, or contradictory.",
    doesNotProve: "Store-backed search review does not prove complete source coverage or ranking quality."
  });
  steps.push({
    order: steps.length + 1,
    source: "bounded_external_research",
    cost: "medium",
    action: "Open bounded external research only for unresolved missing evidence.",
    when: "Use after cheaper linked-document and store-backed search review cannot resolve the gap.",
    doesNotProve: "External research does not prove KRN product readiness or automatic retention safety."
  });
  steps.push({
    order: steps.length + 1,
    source: "human_review",
    cost: "high",
    action: "Ask an operator or domain reviewer to accept, reject, or supply evidence.",
    when: "Use only when cheaper evidence cannot produce a reviewable decision.",
    doesNotProve: "Human review does not bypass source-to-decision, falsifier, or Memory Core review gates."
  });

  return steps;
};

const buildAcquisitionEvidenceRequest = (
  input: {
    missingEvidence: readonly string[];
    queryShapeDiagnostics: readonly string[];
    recommendedFollowUp: readonly string[];
    linkedDocumentEvidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined;
    activationUtilityEvidence: KnowledgeAcquisitionActivationUtilityEvidence | undefined;
  }
): string => {
  const diagnosticGuidance =
    input.queryShapeDiagnostics.length === 0
      ? ""
      : ` Query diagnostics: ${input.queryShapeDiagnostics.join(" ")}`;
  const followUpGuidance =
    input.recommendedFollowUp.length === 0
      ? ""
      : ` Recommended follow-up: ${input.recommendedFollowUp.join(" ")}`;

  return `Find or reject evidence for: ${input.missingEvidence.join(", ")}.${diagnosticGuidance}${followUpGuidance}${linkedDocumentEvidenceGuidance(input.linkedDocumentEvidence)}${activationUtilityEvidenceGuidance(input.activationUtilityEvidence)} Preserve source, mechanism, KRN implication, consumer, falsifier, and doesNotProve before promotion.`;
};

const missingReviewFields = (
  input: {
    missingEvidence: readonly string[];
    evidenceRefs: readonly string[];
    consumer: string;
    falsifier: string;
  }
): readonly string[] => [
  ...(input.missingEvidence.length === 0 ? ["missingEvidence"] : []),
  ...(input.evidenceRefs.length === 0 ? ["evidenceRefs"] : []),
  ...(hasText(input.consumer) ? [] : ["consumer"]),
  ...(hasText(input.falsifier) ? [] : ["falsifier"])
];

const buildCandidate = (
  input: BuildKnowledgeAcquisitionHeartbeatPreviewInput,
  request: KnowledgeAcquisitionRequest
): KnowledgeAcquisitionHeartbeatCandidate => {
  const missingEvidence = nonEmptyStrings(request.missingEvidence);
  const queryShapeDiagnostics = nonEmptyStrings(request.queryShapeDiagnostics ?? []);
  const recommendedFollowUp = nonEmptyStrings(request.recommendedFollowUp ?? []);
  const linkedDocumentEvidence = request.linkedDocumentEvidence;
  const activationUtilityEvidence = request.activationUtilityEvidence;
  const evidenceRefs = nonEmptyStrings([input.evidenceRef, ...request.evidenceRefs]);
  const summary =
    `Acquire missing evidence for ${request.source} query "${request.query}": ${missingEvidence.join(", ")}.`;
  const applicationGuidance =
    "Route this candidate to source/research review before creating source claims, eval candidates, Memory Core updates, crawler work, or autonomous acquisition.";
  const acquisitionEvidenceRequest = buildAcquisitionEvidenceRequest({
    missingEvidence,
    queryShapeDiagnostics,
    recommendedFollowUp,
    linkedDocumentEvidence,
    activationUtilityEvidence
  });
  const acquisitionEscalationPreview = buildAcquisitionEscalationPreview({
    linkedDocumentEvidence
  });
  const missingFields = missingReviewFields({
    missingEvidence,
    evidenceRefs,
    consumer: request.consumer,
    falsifier: request.falsifier
  });
  const reviewability = assessCandidateReviewability({
    summary,
    evidenceRefs,
    applicationGuidance,
    doesNotProve: request.doesNotProve,
    missingFields
  });

  return {
    id: `knowledge-acquisition-heartbeat:${request.id}:missing_evidence`,
    kind: "knowledge_acquisition_candidate",
    action: "propose_knowledge_acquisition",
    reason: "missing_evidence",
    requestId: request.id,
    source: request.source,
    query: request.query,
    missingEvidence,
    queryShapeDiagnostics,
    recommendedFollowUp,
    ...(linkedDocumentEvidence === undefined ? {} : { linkedDocumentEvidence }),
    ...(activationUtilityEvidence === undefined ? {} : { activationUtilityEvidence }),
    acquisitionEscalationPreview,
    summary,
    applicationGuidance,
    acquisitionEvidenceRequest,
    consumer: request.consumer,
    falsifier: request.falsifier,
    evidenceRefs,
    doesNotProve: request.doesNotProve,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    mutation: "none",
    forbiddenWrites
  };
};

const isActionableRequest = (request: KnowledgeAcquisitionRequest): boolean =>
  nonEmptyStrings(request.missingEvidence).length > 0;

export const buildKnowledgeAcquisitionHeartbeatPreview = (
  input: BuildKnowledgeAcquisitionHeartbeatPreviewInput
): KnowledgeAcquisitionHeartbeatPreview => {
  const maxCandidates = Math.max(0, input.maxCandidates ?? input.requests.length);
  const candidates: KnowledgeAcquisitionHeartbeatCandidate[] = [];

  if (maxCandidates === 0) {
    return {
      generatedAt: input.now,
      candidates,
      skippedRequestCount: input.requests.length,
      mutation: "none",
      proof: previewProof,
      doesNotProve: previewDoesNotProve
    };
  }

  for (const request of input.requests) {
    if (!isActionableRequest(request)) {
      continue;
    }

    candidates.push(buildCandidate(input, request));

    if (candidates.length >= maxCandidates) {
      break;
    }
  }

  return {
    generatedAt: input.now,
    candidates,
    skippedRequestCount: input.requests.length - candidates.length,
    mutation: "none",
    proof: previewProof,
    doesNotProve: previewDoesNotProve
  };
};
