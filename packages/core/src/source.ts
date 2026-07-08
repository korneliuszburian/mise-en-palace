import type {
  SourceClaimId,
  SourceDecisionId
} from "./ids.js";
import { readSourceRelationMetadataReadback } from "./source-metadata.js";
import {
  assessSourceClaimAuthority,
  assessSourceClaimOverride,
  assessSourceClaimTemporalValidity,
  type SourceClaimAuthorityAssessment,
  type SourceClaimTemporalValidity
} from "./source-authority.js";
import {
  isDecisionGradeSourceSupportType,
  rankSourceAuthority,
  type SourceAuthorityLabel,
  type SourceClaim,
  type SourceClaimEdge,
  type SourceClaimEdgeKind,
  type SourceClaimStatus,
  type SourceDecision,
  type SourceDecisionEdge,
  type SourceRejection
} from "./source-model.js";
import { hasSourceText } from "./source-text.js";
import type { IsoTimestamp } from "./time.js";

export * from "./source-authority.js";
export * from "./source-model.js";
export * from "./source-metadata.js";

export type SourceConsensusTimelineEntryState =
  | "current_authority"
  | "caveated_authority"
  | "historical"
  | "rejected";

export interface SourceConsensusTimelineEntry {
  sourceClaimId: SourceClaim["id"];
  claim: string;
  status: SourceClaimStatus;
  createdAt: IsoTimestamp;
  sourceAuthority: SourceAuthorityLabel;
  authorityRank: number;
  temporalValidity: SourceClaimTemporalValidity;
  state: SourceConsensusTimelineEntryState;
  blockedByCurrentSourceClaimId?: SourceClaim["id"];
  decisionSupportEdgeIds: readonly SourceDecisionEdge["id"][];
  evidenceRefs: readonly string[];
  rawEvidenceCitationRefs: readonly string[];
  sourceRanges: readonly string[];
  supportingSourceClaimIds: readonly SourceClaim["id"][];
  dissentingSourceClaimIds: readonly SourceClaim["id"][];
  supersededBySourceClaimIds: readonly SourceClaim["id"][];
  supersedesSourceClaimIds: readonly SourceClaim["id"][];
  rejectionIds: readonly SourceRejection["id"][];
  caveats: readonly string[];
}

export interface SourceConsensusTimelineReadback {
  currentSourceClaimIds: readonly SourceClaim["id"][];
  caveatedSourceClaimIds: readonly SourceClaim["id"][];
  historicalSourceClaimIds: readonly SourceClaim["id"][];
  staleSourceClaimIds: readonly SourceClaim["id"][];
  supersededSourceClaimIds: readonly SourceClaim["id"][];
  unknownSourceClaimIds: readonly SourceClaim["id"][];
  rejectedSourceClaimIds: readonly SourceClaim["id"][];
  entries: readonly SourceConsensusTimelineEntry[];
  doesNotProve: string;
}

const addGroupedValue = <TKey extends string, TValue>(
  groups: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue
): void => {
  groups.set(key, [...(groups.get(key) ?? []), value]);
};

const sourceClaimEdgesByTarget = (
  edges: readonly SourceClaimEdge[]
): ReadonlyMap<SourceClaim["id"], readonly SourceClaimEdge[]> => {
  const byTarget = new Map<SourceClaim["id"], SourceClaimEdge[]>();

  for (const edge of edges) {
    addGroupedValue(byTarget, edge.toSourceClaimId, edge);
  }

  return byTarget;
};

const sourceClaimEdgesBySource = (
  edges: readonly SourceClaimEdge[]
): ReadonlyMap<SourceClaim["id"], readonly SourceClaimEdge[]> => {
  const bySource = new Map<SourceClaim["id"], SourceClaimEdge[]>();

  for (const edge of edges) {
    addGroupedValue(bySource, edge.fromSourceClaimId, edge);
  }

  return bySource;
};

const sourceDecisionEdgesByClaim = (
  edges: readonly SourceDecisionEdge[]
): ReadonlyMap<SourceClaim["id"], readonly SourceDecisionEdge[]> => {
  const byClaim = new Map<SourceClaim["id"], SourceDecisionEdge[]>();

  for (const edge of edges) {
    addGroupedValue(byClaim, edge.sourceClaimId, edge);
  }

  return byClaim;
};

const sourceRejectionsByClaim = (
  rejections: readonly SourceRejection[]
): ReadonlyMap<SourceClaim["id"], readonly SourceRejection[]> => {
  const byClaim = new Map<SourceClaim["id"], SourceRejection[]>();

  for (const rejection of rejections) {
    if (rejection.sourceClaimId !== undefined) {
      addGroupedValue(byClaim, rejection.sourceClaimId, rejection);
    }
  }

  return byClaim;
};

const supportEdgeKinds = new Set<SourceClaimEdgeKind>([
  "supports",
  "qualifies",
  "depends_on",
  "narrows"
]);

const dissentEdgeKinds = new Set<SourceClaimEdgeKind>([
  "contradicts",
  "invalidates",
  "expires"
]);

const supersedingEdgeKinds = new Set<SourceClaimEdgeKind>([
  "supersedes",
  "invalidates",
  "expires"
]);

const sourceClaimEndpointIdsByKind = (
  edges: readonly SourceClaimEdge[],
  kinds: ReadonlySet<SourceClaimEdgeKind>,
  endpoint: "from" | "to"
): readonly SourceClaim["id"][] => {
  const sourceClaimIds: SourceClaim["id"][] = [];

  for (const edge of edges) {
    if (kinds.has(edge.kind)) {
      sourceClaimIds.push(
        endpoint === "from" ? edge.fromSourceClaimId : edge.toSourceClaimId
      );
    }
  }

  return [...new Set(sourceClaimIds)];
};

const sourceClaimEndpointIdsByKindAndStatus = (
  edges: readonly SourceClaimEdge[],
  kinds: ReadonlySet<SourceClaimEdgeKind>,
  endpoint: "from" | "to",
  sourceClaimStatusById: ReadonlyMap<SourceClaim["id"], SourceClaimStatus>,
  status: SourceClaimStatus
): readonly SourceClaim["id"][] =>
  sourceClaimEndpointIdsByKind(edges, kinds, endpoint).filter((sourceClaimId) =>
    sourceClaimStatusById.get(sourceClaimId) === status
  );

const sourceConsensusEntryState = (input: {
  readonly authorityAssessment: SourceClaimAuthorityAssessment;
}): SourceConsensusTimelineEntryState => {
  switch (input.authorityAssessment.status) {
    case "accepted":
      return "current_authority";
    case "caveated":
    case "evidence_gap":
      return "caveated_authority";
    case "blocked":
    case "stale":
      return "historical";
    case "rejected":
      return "rejected";
  }
};

const sourceConsensusEntryStateRank = {
  current_authority: 0,
  caveated_authority: 1,
  historical: 2,
  rejected: 3
} as const satisfies Record<SourceConsensusTimelineEntryState, number>;

const compareSourceConsensusTimelineEntries = (
  left: SourceConsensusTimelineEntry,
  right: SourceConsensusTimelineEntry
): number => {
  const stateDifference =
    sourceConsensusEntryStateRank[left.state] - sourceConsensusEntryStateRank[right.state];

  if (stateDifference !== 0) {
    return stateDifference;
  }

  if (left.createdAt !== right.createdAt) {
    return right.createdAt.localeCompare(left.createdAt);
  }

  return left.sourceClaimId.localeCompare(right.sourceClaimId);
};

const isMetadataRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readRawEvidenceCitationRef = (
  metadata: Record<string, unknown>
): string | undefined => {
  const rawEvidence = metadata["rawEvidence"];

  if (!isMetadataRecord(rawEvidence)) {
    return undefined;
  }

  const citationRef = rawEvidence["citationRef"];

  return typeof citationRef === "string" && citationRef.trim().length > 0
    ? citationRef.trim()
    : undefined;
};

const isUnknownSourceConsensusEntry = (
  entry: SourceConsensusTimelineEntry
): boolean => {
  if (entry.state === "caveated_authority" || entry.temporalValidity.status === "invalid_time") {
    return true;
  }

  return (
    entry.state === "historical" &&
    entry.temporalValidity.status === "valid" &&
    entry.supersededBySourceClaimIds.length === 0 &&
    entry.rejectionIds.length === 0 &&
    entry.blockedByCurrentSourceClaimId === undefined
  );
};

const blockedByCurrentSourceClaimIdFor = (input: {
  readonly claim: SourceClaim;
  readonly sourceClaims: readonly SourceClaim[];
  readonly now: IsoTimestamp;
}): SourceClaim["id"] | undefined => {
  const overrideAssessment = assessSourceClaimOverride({
    candidate: input.claim,
    currentConsensus: input.sourceClaims,
    now: input.now
  });

  return !overrideAssessment.allowed &&
    overrideAssessment.reason === "weaker_than_current_valid_consensus"
    ? overrideAssessment.blockedBySourceClaimId
    : undefined;
};

const sourceConsensusTimelineEntryForClaim = (input: {
  readonly claim: SourceClaim;
  readonly sourceClaims: readonly SourceClaim[];
  readonly incomingEdges: readonly SourceClaimEdge[];
  readonly outgoingEdges: readonly SourceClaimEdge[];
  readonly decisionSupportEdgeIds: readonly SourceDecisionEdge["id"][];
  readonly rejectionIds: readonly SourceRejection["id"][];
  readonly sourceClaimStatusById: ReadonlyMap<SourceClaim["id"], SourceClaimStatus>;
  readonly now: IsoTimestamp;
}): SourceConsensusTimelineEntry => {
  const blockedByCurrentSourceClaimId = blockedByCurrentSourceClaimIdFor(input);
  const supersededBySourceClaimIds = sourceClaimEndpointIdsByKind(
    input.incomingEdges,
    supersedingEdgeKinds,
    "from"
  );
  const acceptedDissentingSourceClaimIds = sourceClaimEndpointIdsByKindAndStatus(
    input.incomingEdges,
    dissentEdgeKinds,
    "from",
    input.sourceClaimStatusById,
    "accepted"
  );
  const authorityAssessment = assessSourceClaimAuthority({
    claim: input.claim,
    now: input.now,
    decisionSupportEdgeIds: input.decisionSupportEdgeIds,
    supersededBySourceClaimIds,
    acceptedDissentingSourceClaimIds,
    rejectionIds: input.rejectionIds,
    ...(blockedByCurrentSourceClaimId === undefined
      ? {}
      : { blockedByCurrentSourceClaimId })
  });
  const claimMetadata = readSourceRelationMetadataReadback(input.claim.metadata);
  const rawEvidenceCitationRef = readRawEvidenceCitationRef(input.claim.metadata);

  return {
    sourceClaimId: input.claim.id,
    claim: input.claim.claim,
    status: input.claim.status,
    createdAt: input.claim.createdAt,
    sourceAuthority: input.claim.sourceAuthority,
    authorityRank: rankSourceAuthority(input.claim.sourceAuthority),
    temporalValidity: authorityAssessment.temporalValidity,
    state: sourceConsensusEntryState({ authorityAssessment }),
    ...(blockedByCurrentSourceClaimId === undefined
      ? {}
      : { blockedByCurrentSourceClaimId }),
    decisionSupportEdgeIds: input.decisionSupportEdgeIds,
    evidenceRefs: claimMetadata.evidenceRefs,
    rawEvidenceCitationRefs: rawEvidenceCitationRef === undefined
      ? []
      : [rawEvidenceCitationRef],
    sourceRanges: claimMetadata.sourceRanges,
    supportingSourceClaimIds: sourceClaimEndpointIdsByKind(
      input.incomingEdges,
      supportEdgeKinds,
      "from"
    ),
    dissentingSourceClaimIds: sourceClaimEndpointIdsByKind(
      input.incomingEdges,
      dissentEdgeKinds,
      "from"
    ),
    supersededBySourceClaimIds,
    supersedesSourceClaimIds: sourceClaimEndpointIdsByKind(
      input.outgoingEdges,
      supersedingEdgeKinds,
      "to"
    ),
    rejectionIds: input.rejectionIds,
    caveats: authorityAssessment.caveats
  };
};

export const buildSourceConsensusTimelineReadback = (input: {
  readonly sourceClaims: readonly SourceClaim[];
  readonly sourceClaimEdges: readonly SourceClaimEdge[];
  readonly sourceDecisionEdges: readonly SourceDecisionEdge[];
  readonly sourceRejections?: readonly SourceRejection[];
  readonly now: IsoTimestamp;
}): SourceConsensusTimelineReadback => {
  const incomingEdgesByClaim = sourceClaimEdgesByTarget(input.sourceClaimEdges);
  const outgoingEdgesByClaim = sourceClaimEdgesBySource(input.sourceClaimEdges);
  const decisionEdgesByClaim = sourceDecisionEdgesByClaim(input.sourceDecisionEdges);
  const rejectionsByClaim = sourceRejectionsByClaim(input.sourceRejections ?? []);
  const sourceClaimStatusById = new Map(input.sourceClaims.map((claim) => [
    claim.id,
    claim.status
  ]));
  const entries = input.sourceClaims
    .map((claim): SourceConsensusTimelineEntry => sourceConsensusTimelineEntryForClaim({
      claim,
      sourceClaims: input.sourceClaims,
      incomingEdges: incomingEdgesByClaim.get(claim.id) ?? [],
      outgoingEdges: outgoingEdgesByClaim.get(claim.id) ?? [],
      decisionSupportEdgeIds: (decisionEdgesByClaim.get(claim.id) ?? [])
        .map((edge) => edge.id),
      rejectionIds: (rejectionsByClaim.get(claim.id) ?? [])
        .map((rejection) => rejection.id),
      sourceClaimStatusById,
      now: input.now
    }))
    .sort(compareSourceConsensusTimelineEntries);

  return {
    currentSourceClaimIds: entries
      .filter((entry) => entry.state === "current_authority")
      .map((entry) => entry.sourceClaimId),
    caveatedSourceClaimIds: entries
      .filter((entry) => entry.state === "caveated_authority")
      .map((entry) => entry.sourceClaimId),
    historicalSourceClaimIds: entries
      .filter((entry) => entry.state === "historical")
      .map((entry) => entry.sourceClaimId),
    staleSourceClaimIds: entries
      .filter((entry) => entry.temporalValidity.status === "stale")
      .map((entry) => entry.sourceClaimId),
    supersededSourceClaimIds: entries
      .filter((entry) => entry.supersededBySourceClaimIds.length > 0)
      .map((entry) => entry.sourceClaimId),
    unknownSourceClaimIds: entries
      .filter(isUnknownSourceConsensusEntry)
      .map((entry) => entry.sourceClaimId),
    rejectedSourceClaimIds: entries
      .filter((entry) => entry.state === "rejected")
      .map((entry) => entry.sourceClaimId),
    entries,
    doesNotProve:
      "Source consensus timeline readback does not prove source truth, corpus completeness, author expertise, or large-scale temporal consensus quality."
  };
};

export type SourceClaimReviewSignalKind =
  | "missing_source_to_decision_fields"
  | "decorative_support_type"
  | "invalid_source_claim_time"
  | "stale_accepted_claim"
  | "accepted_claim_without_decision";

export interface SourceClaimReviewSignal {
  kind: SourceClaimReviewSignalKind;
  severity: "warning" | "blocking";
  sourceClaimId: SourceClaimId;
  reason: string;
}

export interface AssessSourceClaimReviewSignalsInput {
  now?: IsoTimestamp;
  sourceDecisionCount?: number;
}

export const assessSourceClaimReviewSignals = (
  claim: SourceClaim,
  input: AssessSourceClaimReviewSignalsInput = {}
): SourceClaimReviewSignal[] => {
  const signals: SourceClaimReviewSignal[] = [];

  if (
    !hasSourceText(claim.mechanism) ||
    !hasSourceText(claim.krnImplication) ||
    !hasSourceText(claim.doesNotProve) ||
    !hasSourceText(claim.consumer) ||
    !hasSourceText(claim.falsifier)
  ) {
    signals.push({
      kind: "missing_source_to_decision_fields",
      severity: "blocking",
      sourceClaimId: claim.id,
      reason:
        "SourceClaim requires mechanism, KRN implication, doesNotProve, consumer, and falsifier before it can guide KRN decisions."
    });
  }

  if (!isDecisionGradeSourceSupportType(claim.supportType)) {
    signals.push({
      kind: "decorative_support_type",
      severity: "blocking",
      sourceClaimId: claim.id,
      reason:
        "SourceClaim support must be decision-grade; decorative/background sources should be rejected instead of retained as authority."
    });
  }

  if (claim.status === "accepted" && input.now !== undefined) {
    const temporalValidity = assessSourceClaimTemporalValidity(claim, input.now);

    if (temporalValidity.status === "invalid_time") {
      signals.push({
        kind: "invalid_source_claim_time",
        severity: "blocking",
        sourceClaimId: claim.id,
        reason:
          "Accepted SourceClaim has invalid temporal metadata and cannot be used as current authority."
      });
    }

    if (temporalValidity.status === "stale") {
      signals.push({
        kind: "stale_accepted_claim",
        severity: "warning",
        sourceClaimId: claim.id,
        reason:
          "Accepted SourceClaim is past revisitWhen and needs refresh, deprecation, or replacement before continued use."
      });
    }
  }

  if (
    claim.status === "accepted" &&
    hasSourceText(claim.consumer) &&
    input.sourceDecisionCount === 0
  ) {
    signals.push({
      kind: "accepted_claim_without_decision",
      severity: "blocking",
      sourceClaimId: claim.id,
      reason:
        "Accepted SourceClaim has a consumer but no linked SourceDecision, which risks source hoarding instead of source-to-decision evidence."
    });
  }

  return signals;
};

export type SourceDecisionReviewSignalKind =
  | "missing_source_claim"
  | "missing_decision_fields"
  | "unsupported_source_claim";

export interface SourceDecisionReviewSignal {
  kind: SourceDecisionReviewSignalKind;
  severity: "warning" | "blocking";
  sourceDecisionId: SourceDecisionId;
  reason: string;
}

export interface AssessSourceDecisionReviewSignalsInput {
  sourceClaimStatus?: SourceClaimStatus;
}

export const assessSourceDecisionReviewSignals = (
  decision: SourceDecision,
  input: AssessSourceDecisionReviewSignalsInput = {}
): SourceDecisionReviewSignal[] => {
  const signals: SourceDecisionReviewSignal[] = [];

  if (
    (decision.status === "adopt" || decision.status === "reject") &&
    !hasSourceText(decision.sourceClaimId)
  ) {
    signals.push({
      kind: "missing_source_claim",
      severity: "blocking",
      sourceDecisionId: decision.id,
      reason:
        "Adopt/reject SourceDecision records require a SourceClaim link before they can be treated as source-grounded decisions."
    });
  }

  if (
    !hasSourceText(decision.decision) ||
    !hasSourceText(decision.rationale) ||
    !hasSourceText(decision.falsifier) ||
    !hasSourceText(decision.consumer)
  ) {
    signals.push({
      kind: "missing_decision_fields",
      severity: "blocking",
      sourceDecisionId: decision.id,
      reason:
        "SourceDecision needs decision, rationale, consumer, and falsifier to avoid decorative source retention."
    });
  }

  if (
    input.sourceClaimStatus === "rejected" ||
    input.sourceClaimStatus === "deprecated"
  ) {
    signals.push({
      kind: "unsupported_source_claim",
      severity: "blocking",
      sourceDecisionId: decision.id,
      reason:
        "SourceDecision must not rely on a rejected or deprecated SourceClaim."
    });
  }

  return signals;
};
