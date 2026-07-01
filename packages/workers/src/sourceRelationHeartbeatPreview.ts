import {
  assessCandidateReviewability,
  isSourceClaimTemporallyValid,
  readMetadataString,
  readMetadataStringList
} from "@krn/core";
import type {
  CandidateReviewability,
  IsoTimestamp,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeKind,
  SourceClaimId,
  SourceRelationReviewFocus
} from "@krn/core";

export type SourceRelationHeartbeatCandidateReason =
  | "relation_needs_review"
  | "relation_evidence_is_weak"
  | "connected_claim_is_stale";

export type SourceRelationHeartbeatAction =
  | "review_source_relation"
  | "review_relation_evidence"
  | "review_stale_connected_claim";

export type SourceRelationHeartbeatReviewFocus = SourceRelationReviewFocus;

export interface SourceRelationHeartbeatCandidate {
  id: string;
  kind: "source_relation_maintenance_candidate";
  action: SourceRelationHeartbeatAction;
  reason: SourceRelationHeartbeatCandidateReason;
  sourceClaimEdgeId: SourceClaimEdge["id"];
  fromSourceClaimId: SourceClaimEdge["fromSourceClaimId"];
  toSourceClaimId: SourceClaimEdge["toSourceClaimId"];
  edgeKind: SourceClaimEdgeKind;
  relationReviewFocus: SourceRelationHeartbeatReviewFocus;
  relationReviewQuestion: string;
  summary: string;
  applicationGuidance: string;
  evidenceRefs: readonly string[];
  relationEvidenceRefs: readonly string[];
  relationEvidenceRequest: string;
  doesNotProve: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: readonly string[];
  mutation: "none";
  forbiddenWrites: readonly [
    "memory_records",
    "source_claims",
    "source_decisions",
    "source_claim_edges"
  ];
}

export interface BuildSourceRelationHeartbeatPreviewInput {
  now: IsoTimestamp;
  sourceClaims: readonly SourceClaim[];
  sourceClaimEdges: readonly SourceClaimEdge[];
  evidenceRef: string;
  maxCandidates?: number;
}

export interface SourceRelationHeartbeatPreview {
  generatedAt: IsoTimestamp;
  candidates: readonly SourceRelationHeartbeatCandidate[];
  skippedEdgeCount: number;
  mutation: "none";
  proof: string;
  doesNotProve: string;
}

const maintenanceEdgeKinds = new Set<SourceClaimEdgeKind>([
  "contradicts",
  "duplicates",
  "supersedes",
  "invalidates",
  "expires"
]);

const forbiddenWrites = [
  "memory_records",
  "source_claims",
  "source_decisions",
  "source_claim_edges"
] as const;

const previewDoesNotProve =
  "Source-relation heartbeat preview does not prove source truth, edge correctness, production graph retrieval quality, autonomous worker execution, or Memory Core mutation.";

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const relationReviewFocusByReason = {
  relation_needs_review: undefined,
  connected_claim_is_stale: "stale_connected_claim",
  relation_evidence_is_weak: "relation_evidence"
} as const satisfies Record<
  SourceRelationHeartbeatCandidateReason,
  SourceRelationHeartbeatReviewFocus | undefined
>;

const relationReviewFocusByEdgeKind = {
  supports: "relation_evidence",
  contradicts: "contradiction",
  qualifies: "relation_evidence",
  depends_on: "relation_evidence",
  supersedes: "supersession",
  duplicates: "duplicate",
  narrows: "relation_evidence",
  invalidates: "invalidation",
  expires: "expiration"
} as const satisfies Record<SourceClaimEdgeKind, SourceRelationHeartbeatReviewFocus>;

const relationReviewQuestionByFocus = {
  contradiction:
    "Review whether this edge represents a real contradiction before changing source truth or downstream activation.",
  duplicate:
    "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.",
  supersession:
    "Review whether one claim supersedes the other and what temporal boundary applies.",
  invalidation:
    "Review whether this edge invalidates a claim before changing source truth or Memory Core state.",
  expiration:
    "Review whether this edge marks a claim as expired and what validity window applies.",
  relation_evidence:
    "Review concrete SourceClaimEdge evidence before accepting relation maintenance.",
  stale_connected_claim:
    "Review connected SourceClaim validity before relying on this source relation."
} as const satisfies Record<SourceRelationHeartbeatReviewFocus, string>;

const relationReviewFocusFor = (
  reason: SourceRelationHeartbeatCandidateReason,
  edgeKind: SourceClaimEdgeKind
): SourceRelationHeartbeatReviewFocus =>
  relationReviewFocusByReason[reason] ?? relationReviewFocusByEdgeKind[edgeKind];

const relationReviewQuestionFor = (
  focus: SourceRelationHeartbeatReviewFocus
): string => relationReviewQuestionByFocus[focus];

const claimMapById = (
  claims: readonly SourceClaim[]
): ReadonlyMap<SourceClaimId, SourceClaim> =>
  new Map(claims.map((claim) => [claim.id, claim]));

const buildCandidate = (
  input: BuildSourceRelationHeartbeatPreviewInput,
  edge: SourceClaimEdge,
  reason: SourceRelationHeartbeatCandidateReason,
  action: SourceRelationHeartbeatAction,
  relationEvidenceRefs: readonly string[]
): SourceRelationHeartbeatCandidate => {
  const relationEvidenceRequest = relationEvidenceRefs.length === 0
    ? "Capture concrete SourceClaimEdge evidenceRefs before accepting relation maintenance."
    : "Review listed SourceClaimEdge evidenceRefs before accepting relation maintenance.";
  const relationReviewFocus = relationReviewFocusFor(reason, edge.kind);
  const relationReviewQuestion = relationReviewQuestionFor(relationReviewFocus);
  const summary =
    `Review ${relationReviewFocus} SourceClaimEdge ${edge.id} between ${edge.fromSourceClaimId} and ${edge.toSourceClaimId}.`;
  const applicationGuidance =
    `${relationReviewQuestion} Route this candidate to human review before changing source truth, source relation edges, or Memory Core state.`;
  const evidenceRefs = [input.evidenceRef, ...relationEvidenceRefs].filter(hasText);
  const reviewability = assessCandidateReviewability({
    summary,
    evidenceRefs,
    applicationGuidance,
    doesNotProve: previewDoesNotProve,
    ...(relationEvidenceRefs.length === 0
      ? { missingFields: ["relationEvidenceRefs"] }
      : {})
  });

  return {
    id: `source-relation-heartbeat:${edge.id}:${reason}`,
    kind: "source_relation_maintenance_candidate",
    action,
    reason,
    sourceClaimEdgeId: edge.id,
    fromSourceClaimId: edge.fromSourceClaimId,
    toSourceClaimId: edge.toSourceClaimId,
    edgeKind: edge.kind,
    relationReviewFocus,
    relationReviewQuestion,
    summary,
    applicationGuidance,
    evidenceRefs,
    relationEvidenceRefs,
    relationEvidenceRequest,
    doesNotProve: previewDoesNotProve,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    mutation: "none",
    forbiddenWrites
  };
};

const relationEvidenceIsWeak = (edge: SourceClaimEdge): boolean => {
  const evidenceRefs = readMetadataStringList(edge.metadata, "evidenceRefs");
  const consumer = readMetadataString(edge.metadata, "consumer");
  const doesNotProve = readMetadataString(edge.metadata, "doesNotProve");

  return evidenceRefs.length === 0 || !hasText(consumer) || !hasText(doesNotProve);
};

const connectedClaimIsStale = (
  edge: SourceClaimEdge,
  claimsById: ReadonlyMap<SourceClaimId, SourceClaim>,
  now: IsoTimestamp
): boolean => {
  const from = claimsById.get(edge.fromSourceClaimId);
  const to = claimsById.get(edge.toSourceClaimId);

  return (
    from === undefined ||
    to === undefined ||
    !isSourceClaimTemporallyValid(from, now) ||
    !isSourceClaimTemporallyValid(to, now)
  );
};

const chooseCandidateKind = (
  input: BuildSourceRelationHeartbeatPreviewInput,
  edge: SourceClaimEdge,
  claimsById: ReadonlyMap<SourceClaimId, SourceClaim>
): Pick<SourceRelationHeartbeatCandidate, "action" | "reason"> | undefined => {
  if (connectedClaimIsStale(edge, claimsById, input.now)) {
    return {
      action: "review_stale_connected_claim",
      reason: "connected_claim_is_stale"
    };
  }

  if (relationEvidenceIsWeak(edge)) {
    return {
      action: "review_relation_evidence",
      reason: "relation_evidence_is_weak"
    };
  }

  if (maintenanceEdgeKinds.has(edge.kind)) {
    return {
      action: "review_source_relation",
      reason: "relation_needs_review"
    };
  }

  return undefined;
};

export const buildSourceRelationHeartbeatPreview = (
  input: BuildSourceRelationHeartbeatPreviewInput
): SourceRelationHeartbeatPreview => {
  const claimsById = claimMapById(input.sourceClaims);
  const maxCandidates = Math.max(0, input.maxCandidates ?? input.sourceClaimEdges.length);
  const candidates: SourceRelationHeartbeatCandidate[] = [];

  if (maxCandidates === 0) {
    return {
      generatedAt: input.now,
      candidates,
      skippedEdgeCount: input.sourceClaimEdges.length,
      mutation: "none",
      proof:
        "Source-relation heartbeat preview inspects SourceClaimEdge rows and connected SourceClaims to propose reviewable maintenance candidates only.",
      doesNotProve: previewDoesNotProve
    };
  }

  for (const edge of input.sourceClaimEdges) {
    const candidateKind = chooseCandidateKind(input, edge, claimsById);

    if (candidateKind === undefined) {
      continue;
    }

    candidates.push(
      buildCandidate(
        input,
        edge,
        candidateKind.reason,
        candidateKind.action,
        readMetadataStringList(edge.metadata, "evidenceRefs")
      )
    );

    if (candidates.length >= maxCandidates) {
      break;
    }
  }

  return {
    generatedAt: input.now,
    candidates,
    skippedEdgeCount: input.sourceClaimEdges.length - candidates.length,
    mutation: "none",
    proof:
      "Source-relation heartbeat preview inspects SourceClaimEdge rows and connected SourceClaims to propose reviewable maintenance candidates only.",
    doesNotProve: previewDoesNotProve
  };
};
