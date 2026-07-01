import {
  assessCandidateReviewability
} from "@krn/core";
import type {
  CandidateReviewability,
  IsoTimestamp
} from "@krn/core";

export type KnowledgeAcquisitionSource =
  | "source_search"
  | "brain_search";

export type KnowledgeAcquisitionHeartbeatCandidateReason =
  | "missing_evidence";

export type KnowledgeAcquisitionHeartbeatAction =
  | "propose_knowledge_acquisition";

export interface KnowledgeAcquisitionLinkedDocumentEvidence {
  sourceClaimDocumentLinks: number;
  linkedSearchDocuments: number;
  caveats: readonly string[];
}

export interface KnowledgeAcquisitionRequest {
  id: string;
  source: KnowledgeAcquisitionSource;
  query: string;
  missingEvidence: readonly string[];
  queryShapeDiagnostics?: readonly string[];
  recommendedFollowUp?: readonly string[];
  linkedDocumentEvidence?: KnowledgeAcquisitionLinkedDocumentEvidence;
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

const buildAcquisitionEvidenceRequest = (
  input: {
    missingEvidence: readonly string[];
    queryShapeDiagnostics: readonly string[];
    recommendedFollowUp: readonly string[];
    linkedDocumentEvidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined;
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

  return `Find or reject evidence for: ${input.missingEvidence.join(", ")}.${diagnosticGuidance}${followUpGuidance}${linkedDocumentEvidenceGuidance(input.linkedDocumentEvidence)} Preserve source, mechanism, KRN implication, consumer, falsifier, and doesNotProve before promotion.`;
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
  const evidenceRefs = nonEmptyStrings([input.evidenceRef, ...request.evidenceRefs]);
  const summary =
    `Acquire missing evidence for ${request.source} query "${request.query}": ${missingEvidence.join(", ")}.`;
  const applicationGuidance =
    "Route this candidate to source/research review before creating source claims, eval candidates, Memory Core updates, crawler work, or autonomous acquisition.";
  const acquisitionEvidenceRequest = buildAcquisitionEvidenceRequest({
    missingEvidence,
    queryShapeDiagnostics,
    recommendedFollowUp,
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
