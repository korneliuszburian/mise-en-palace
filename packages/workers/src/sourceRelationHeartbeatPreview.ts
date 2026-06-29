import {
  assessCandidateReviewability,
  isSourceClaimTemporallyValid
} from "@krn/core";
import type {
  CandidateReviewability,
  IsoTimestamp,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeKind,
  SourceClaimId
} from "@krn/core";

export type SourceRelationHeartbeatCandidateReason =
  | "relation_needs_review"
  | "relation_evidence_is_weak"
  | "connected_claim_is_stale";

export type SourceRelationHeartbeatAction =
  | "review_source_relation"
  | "review_relation_evidence"
  | "review_stale_connected_claim";

export interface SourceRelationHeartbeatCandidate {
  id: string;
  kind: "source_relation_maintenance_candidate";
  action: SourceRelationHeartbeatAction;
  reason: SourceRelationHeartbeatCandidateReason;
  sourceClaimEdgeId: SourceClaimEdge["id"];
  fromSourceClaimId: SourceClaimEdge["fromSourceClaimId"];
  toSourceClaimId: SourceClaimEdge["toSourceClaimId"];
  edgeKind: SourceClaimEdgeKind;
  summary: string;
  applicationGuidance: string;
  evidenceRefs: readonly string[];
  relationEvidenceRefs: readonly string[];
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

const readStringArrayMetadata = (
  metadata: Record<string, unknown>,
  key: string
): readonly string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const readStringMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

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
  const summary =
    `Review ${edge.kind} SourceClaimEdge ${edge.id} between ${edge.fromSourceClaimId} and ${edge.toSourceClaimId}.`;
  const applicationGuidance =
    "Route this candidate to human review before changing source truth, source relation edges, or Memory Core state.";
  const evidenceRefs = [input.evidenceRef, ...relationEvidenceRefs].filter(hasText);
  const reviewability = assessCandidateReviewability({
    summary,
    evidenceRefs,
    applicationGuidance,
    doesNotProve: previewDoesNotProve
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
    summary,
    applicationGuidance,
    evidenceRefs,
    relationEvidenceRefs,
    doesNotProve: previewDoesNotProve,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    mutation: "none",
    forbiddenWrites
  };
};

const relationEvidenceIsWeak = (edge: SourceClaimEdge): boolean => {
  const evidenceRefs = readStringArrayMetadata(edge.metadata, "evidenceRefs");
  const consumer = readStringMetadata(edge.metadata, "consumer");
  const doesNotProve = readStringMetadata(edge.metadata, "doesNotProve");

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
        readStringArrayMetadata(edge.metadata, "evidenceRefs")
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
