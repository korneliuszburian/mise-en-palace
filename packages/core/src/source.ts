import type {
  ProjectId,
  SourceArtifactId,
  SourceClaimEdgeId,
  SourceClaimId,
  SourceDecisionEdgeId,
  SourceDecisionId,
  SourceRejectionId
} from "./ids.js";
import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import {
  parseTimestampMs,
  type IsoTimestamp
} from "./time.js";

const sourceAuthorityRanks = [
  "high",
  "medium",
  "low"
] as const;

export type SourceAuthorityRank = typeof sourceAuthorityRanks[number];

const sourceRankedKinds = [
  "primary",
  "official",
  "project-decision",
  "source-code",
  "paper",
  "practitioner",
  "secondary",
  "hypothesis"
] as const;

const sourceKinds = [
  "unspecified",
  ...sourceRankedKinds
] as const;

export type SourceKind = typeof sourceKinds[number];

export const sourceAuthorityLabels = [
  ...sourceAuthorityRanks,
  ...sourceRankedKinds
] as const;

export type SourceAuthorityLabel = typeof sourceAuthorityLabels[number];

export type SourceSupportRelation =
  | "supports"
  | "contradicts"
  | "qualifies"
  | "does_not_support"
  | "not_applicable";

export type SourceUse =
  | "background"
  | "relation-only"
  | "mechanism"
  | "decision"
  | "risk"
  | "rejection"
  | "eval-design"
  | "implementation-boundary";

export interface SourceSupportAssessment {
  relation: SourceSupportRelation;
  use: SourceUse;
  decisionGrade: boolean;
}

// Canonical support taxonomy. Public source-claim inputs and reflection source
// candidates derive decision-grade support from this table instead of restating
// a separate allowlist.
const sourceSupportAssessmentByType = {
  supports: {
    relation: "supports",
    use: "relation-only",
    decisionGrade: false
  },
  contradicts: {
    relation: "contradicts",
    use: "rejection",
    decisionGrade: true
  },
  qualifies: {
    relation: "qualifies",
    use: "relation-only",
    decisionGrade: false
  },
  background: {
    relation: "not_applicable",
    use: "background",
    decisionGrade: false
  },
  does_not_support: {
    relation: "does_not_support",
    use: "relation-only",
    decisionGrade: false
  },
  mechanism: {
    relation: "not_applicable",
    use: "mechanism",
    decisionGrade: true
  },
  decision: {
    relation: "not_applicable",
    use: "decision",
    decisionGrade: true
  },
  risk: {
    relation: "not_applicable",
    use: "risk",
    decisionGrade: true
  },
  rejection: {
    relation: "not_applicable",
    use: "rejection",
    decisionGrade: true
  },
  "eval-design": {
    relation: "not_applicable",
    use: "eval-design",
    decisionGrade: true
  },
  "implementation-boundary": {
    relation: "not_applicable",
    use: "implementation-boundary",
    decisionGrade: true
  }
} as const satisfies Record<string, SourceSupportAssessment>;

export type SourceSupportType = keyof typeof sourceSupportAssessmentByType;

export const sourceSupportTypes = Object.keys(
  sourceSupportAssessmentByType
) as readonly SourceSupportType[];

export const decisionGradeSourceSupportTypes: readonly SourceSupportType[] =
  sourceSupportTypes.filter((supportType) =>
    sourceSupportAssessmentByType[supportType].decisionGrade);

export interface SourceAuthority {
  authorityRank: SourceAuthorityRank;
  sourceKind: SourceKind;
  rank: number;
}

export interface SourceClaimTaxonomy {
  authorityRank: SourceAuthorityRank;
  sourceKind: SourceKind;
  supportRelation: SourceSupportRelation;
  sourceUse: SourceUse;
  decisionGrade: boolean;
}

export interface SourceContextTaxonomy {
  sourceAuthorityRank?: SourceAuthorityRank;
  sourceKind?: SourceKind;
  sourceSupportRelation?: SourceSupportRelation;
  sourceUse?: SourceUse;
}

export type SourceClaimCreateStatus = "proposed";

export type SourceClaimLifecycleStatus = "accepted" | "rejected" | "deprecated";

export type SourceClaimStatus = SourceClaimCreateStatus | SourceClaimLifecycleStatus;

export type SourceDecisionStatus = "adopt" | "reject" | "defer" | "lab_test";

export type SourceDecisionTargetType =
  | "harness_run"
  | "task_contract"
  | "harness_plan"
  | "context_assembly"
  | "evidence_bundle"
  | "review_assessment"
  | "feedback_delta"
  | "architecture_decision"
  | "memory_record"
  | "eval_candidate";

export type SourceDecisionEdgeConfidence = "low" | "medium" | "high";

export type SourceClaimEdgeKind =
  | "supports"
  | "contradicts"
  | "qualifies"
  | "depends_on"
  | "supersedes"
  | "duplicates"
  | "narrows"
  | "invalidates"
  | "expires";

export type SourceRelationReviewFocus =
  | "contradiction"
  | "duplicate"
  | "supersession"
  | "invalidation"
  | "expiration"
  | "relation_evidence"
  | "stale_connected_claim";

export type SourceRejectionReason =
  | "no_mechanism"
  | "no_consumer"
  | "decorative"
  | "stale"
  | "conflicting"
  | "unsupported"
  | "duplicate";

export interface SourceClaim {
  id: SourceClaimId;
  sourceArtifactId: SourceArtifactId;
  sourceChunkId?: string;
  executionRunId?: string;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  sourceAuthority: SourceAuthorityLabel;
  supportType: SourceSupportType;
  consumer: string;
  falsifier?: string;
  revisitWhen?: string;
  status: SourceClaimStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceDecision {
  id: SourceDecisionId;
  projectId?: ProjectId;
  sourceClaimId?: SourceClaimId;
  status: SourceDecisionStatus;
  decision: string;
  rationale: string;
  falsifier: string;
  consumer: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceDecisionEdge {
  id: SourceDecisionEdgeId;
  sourceClaimId: SourceClaimId;
  targetType: SourceDecisionTargetType;
  targetId: string;
  supportType: SourceSupportType;
  confidence: SourceDecisionEdgeConfidence;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface SourceClaimEdge {
  id: SourceClaimEdgeId;
  fromSourceClaimId: SourceClaimId;
  toSourceClaimId: SourceClaimId;
  kind: SourceClaimEdgeKind;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export const relatedSourceClaimIdForEdge = (
  sourceClaimId: SourceClaimId,
  edge: Pick<SourceClaimEdge, "fromSourceClaimId" | "toSourceClaimId">
): SourceClaimId | undefined => {
  if (edge.fromSourceClaimId === sourceClaimId) {
    return edge.toSourceClaimId;
  }

  if (edge.toSourceClaimId === sourceClaimId) {
    return edge.fromSourceClaimId;
  }

  return undefined;
};

export interface SourceRelationMetadataReadback {
  consumer?: string;
  doesNotProve?: string;
  evidenceRef?: string;
  evidenceRefs: readonly string[];
  file?: string;
  contentHash?: string;
  missingProofBoundaryFields: readonly SourceRelationMetadataProofBoundaryField[];
  sourceDecisionRef?: string;
  scope?: string;
  sourceRanges: readonly string[];
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
}

export type SourceRelationMetadataProofBoundaryField = "consumer" | "doesNotProve";

export interface SourceRejection {
  id: SourceRejectionId;
  projectId?: ProjectId;
  executionRunId?: string;
  sourceArtifactId?: SourceArtifactId;
  sourceClaimId?: SourceClaimId;
  title: string;
  attemptedClaim: string;
  rejectedBecause: SourceRejectionReason;
  reason: string;
  doesNotProve: string;
  consumer: string;
  metadata: Record<string, unknown>;
  rejectedAt: IsoTimestamp;
}

// Canonical authority ranking. Activation, override policy, and persistence
// readback call through classifySourceAuthority/rankSourceAuthority instead of
// maintaining package-local trust ladders.
const sourceAuthorityByLabel: Record<SourceAuthorityLabel, SourceAuthority> = {
  high: { authorityRank: "high", sourceKind: "unspecified", rank: 85 },
  medium: { authorityRank: "medium", sourceKind: "unspecified", rank: 60 },
  low: { authorityRank: "low", sourceKind: "unspecified", rank: 25 },
  primary: { authorityRank: "high", sourceKind: "primary", rank: 100 },
  official: { authorityRank: "high", sourceKind: "official", rank: 100 },
  "project-decision": {
    authorityRank: "high",
    sourceKind: "project-decision",
    rank: 100
  },
  "source-code": { authorityRank: "high", sourceKind: "source-code", rank: 100 },
  paper: { authorityRank: "high", sourceKind: "paper", rank: 85 },
  practitioner: { authorityRank: "medium", sourceKind: "practitioner", rank: 60 },
  secondary: { authorityRank: "medium", sourceKind: "secondary", rank: 60 },
  hypothesis: { authorityRank: "low", sourceKind: "hypothesis", rank: 10 }
};

export const classifySourceAuthority = (
  sourceAuthority: SourceAuthorityLabel
): SourceAuthority => sourceAuthorityByLabel[sourceAuthority];

export const rankSourceAuthority = (sourceAuthority: SourceAuthorityLabel): number =>
  classifySourceAuthority(sourceAuthority).rank;

const readTrimmedMetadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => readMetadataString(metadata, key)?.trim();

const readTrimmedMetadataStringList = (
  metadata: Record<string, unknown>,
  key: string
): readonly string[] => readMetadataStringList(metadata, key).map((item) => item.trim());

const uniqueStrings = (values: readonly string[]): readonly string[] => [...new Set(values)];

export const readSourceRelationMetadataReadback = (
  metadata: Record<string, unknown>
): SourceRelationMetadataReadback => {
  const consumer = readTrimmedMetadataString(metadata, "consumer");
  const doesNotProve = readTrimmedMetadataString(metadata, "doesNotProve");
  const evidenceRef = readTrimmedMetadataString(metadata, "evidenceRef");
  const evidenceRefs = uniqueStrings([
    ...(evidenceRef === undefined ? [] : [evidenceRef]),
    ...readTrimmedMetadataStringList(metadata, "evidenceRefs")
  ]);
  const sourceDecisionRef = readTrimmedMetadataString(metadata, "sourceDecisionRef");
  const scope = readTrimmedMetadataString(metadata, "scope");
  const validFrom = readTrimmedMetadataString(metadata, "validFrom");
  const validUntil = readTrimmedMetadataString(metadata, "validUntil");
  const invalidatedAt = readTrimmedMetadataString(metadata, "invalidatedAt");
  const file = readTrimmedMetadataString(metadata, "file");
  const contentHash = readTrimmedMetadataString(metadata, "contentHash");
  const sourceRanges = uniqueStrings(readTrimmedMetadataStringList(metadata, "sourceRanges"));
  const missingProofBoundaryFields: SourceRelationMetadataProofBoundaryField[] = [
    ...(consumer === undefined ? ["consumer" as const] : []),
    ...(doesNotProve === undefined ? ["doesNotProve" as const] : [])
  ];

  return {
    ...(consumer === undefined ? {} : { consumer }),
    ...(doesNotProve === undefined ? {} : { doesNotProve }),
    ...(evidenceRef === undefined ? {} : { evidenceRef }),
    evidenceRefs,
    ...(file === undefined ? {} : { file }),
    ...(contentHash === undefined ? {} : { contentHash }),
    missingProofBoundaryFields,
    ...(sourceDecisionRef === undefined ? {} : { sourceDecisionRef }),
    ...(scope === undefined ? {} : { scope }),
    sourceRanges,
    ...(validFrom === undefined ? {} : { validFrom }),
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(invalidatedAt === undefined ? {} : { invalidatedAt })
  };
};

export const assessSourceSupportType = (
  supportType: SourceSupportType
): SourceSupportAssessment => sourceSupportAssessmentByType[supportType];

export const classifySourceClaimTaxonomy = (
  claim: Pick<SourceClaim, "sourceAuthority" | "supportType">
): SourceClaimTaxonomy => {
  const authority = classifySourceAuthority(claim.sourceAuthority);
  const support = assessSourceSupportType(claim.supportType);

  return {
    authorityRank: authority.authorityRank,
    sourceKind: authority.sourceKind,
    supportRelation: support.relation,
    sourceUse: support.use,
    decisionGrade: support.decisionGrade
  };
};

const decisionGradeSourceSupportTypeSet = new Set<SourceSupportType>(
  decisionGradeSourceSupportTypes
);

export const isDecisionGradeSourceSupportType = (
  supportType: SourceSupportType
): boolean => decisionGradeSourceSupportTypeSet.has(supportType);

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const hasMeaningfulOverrideReason = (value: string | undefined): boolean => {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length < 24) {
    return false;
  }

  return trimmed.split(/\s+/u).filter((word) => word.length >= 3).length >= 4;
};

export type SourceClaimTemporalValidity =
  | {
      readonly status: "valid";
    }
  | {
      readonly status: "stale";
      readonly reason: "revisit_when_elapsed";
    }
  | {
      readonly status: "invalid_time";
      readonly reason: "invalid_now" | "invalid_revisit_when";
    }
  | {
      readonly status: "inactive";
      readonly reason: "rejected_or_deprecated";
    };

export const assessSourceClaimTemporalValidity = (
  sourceClaim: Pick<SourceClaim, "status" | "revisitWhen">,
  now: string
): SourceClaimTemporalValidity => {
  if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
    return {
      status: "inactive",
      reason: "rejected_or_deprecated"
    };
  }

  const nowAt = parseTimestampMs(now);

  if (nowAt === undefined) {
    return {
      status: "invalid_time",
      reason: "invalid_now"
    };
  }

  if (sourceClaim.revisitWhen === undefined) {
    return {
      status: "valid"
    };
  }

  const revisitAt = parseTimestampMs(sourceClaim.revisitWhen);

  if (revisitAt === undefined) {
    return {
      status: "invalid_time",
      reason: "invalid_revisit_when"
    };
  }

  if (revisitAt < nowAt) {
    return {
      status: "stale",
      reason: "revisit_when_elapsed"
    };
  }

  return {
    status: "valid"
  };
};

export const isSourceClaimTemporallyValid = (
  sourceClaim: Pick<SourceClaim, "status" | "revisitWhen">,
  now: string
): boolean => {
  return assessSourceClaimTemporalValidity(sourceClaim, now).status === "valid";
};

export type SourceClaimOverrideClaim = Pick<
  SourceClaim,
  "id" | "status" | "sourceAuthority" | "revisitWhen" | "createdAt"
>;

export type SourceClaimOverrideAssessment =
  | {
      readonly allowed: true;
      readonly reason: "explicit_override_reason" | "no_stronger_valid_consensus";
    }
  | {
      readonly allowed: false;
      readonly reason: "weaker_than_current_valid_consensus";
      readonly blockedBySourceClaimId: SourceClaim["id"];
    }
  | {
      readonly allowed: false;
      readonly reason: "candidate_not_current_authority";
    };

export const assessSourceClaimOverride = (input: {
  readonly candidate: SourceClaimOverrideClaim;
  readonly currentConsensus: readonly SourceClaimOverrideClaim[];
  readonly now: string;
  readonly overrideReason?: string;
  readonly overrideProvenanceRef?: string;
}): SourceClaimOverrideAssessment => {
  if (assessSourceClaimTemporalValidity(input.candidate, input.now).status !== "valid") {
    return {
      allowed: false,
      reason: "candidate_not_current_authority"
    };
  }

  const candidateTrustRank = rankSourceAuthority(input.candidate.sourceAuthority);
  const strongerCurrentConsensus = input.currentConsensus.find((currentClaim) => {
    if (currentClaim.id === input.candidate.id || currentClaim.status !== "accepted") {
      return false;
    }

    if (!isSourceClaimTemporallyValid(currentClaim, input.now)) {
      return false;
    }

    return rankSourceAuthority(currentClaim.sourceAuthority) > candidateTrustRank;
  });

  if (strongerCurrentConsensus !== undefined) {
    if (
      hasMeaningfulOverrideReason(input.overrideReason) &&
      hasText(input.overrideProvenanceRef)
    ) {
      return {
        allowed: true,
        reason: "explicit_override_reason"
      };
    }

    return {
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: strongerCurrentConsensus.id
    };
  }

  return {
    allowed: true,
    reason: "no_stronger_valid_consensus"
  };
};

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

const sourceConsensusEntryState = (input: {
  readonly claim: SourceClaim;
  readonly temporalValidity: SourceClaimTemporalValidity;
  readonly decisionSupportEdgeIds: readonly SourceDecisionEdge["id"][];
  readonly supersededBySourceClaimIds: readonly SourceClaim["id"][];
  readonly rejectionIds: readonly SourceRejection["id"][];
  readonly blockedByCurrentSourceClaimId: SourceClaim["id"] | undefined;
}): SourceConsensusTimelineEntryState => {
  if (input.claim.status === "rejected" || input.rejectionIds.length > 0) {
    return "rejected";
  }

  if (
    input.claim.status !== "accepted" ||
    input.temporalValidity.status !== "valid" ||
    input.supersededBySourceClaimIds.length > 0 ||
    input.blockedByCurrentSourceClaimId !== undefined
  ) {
    return "historical";
  }

  return input.decisionSupportEdgeIds.length > 0
    ? "current_authority"
    : "caveated_authority";
};

const sourceConsensusCaveats = (input: {
  readonly temporalValidity: SourceClaimTemporalValidity;
  readonly decisionSupportEdgeIds: readonly SourceDecisionEdge["id"][];
  readonly supersededBySourceClaimIds: readonly SourceClaim["id"][];
  readonly rejectionIds: readonly SourceRejection["id"][];
  readonly blockedByCurrentSourceClaimId: SourceClaim["id"] | undefined;
}): readonly string[] => [
  ...(input.temporalValidity.status === "invalid_time"
    ? [`invalid_time:${input.temporalValidity.reason}`]
    : []),
  ...(input.temporalValidity.status === "stale" ? ["stale"] : []),
  ...(input.decisionSupportEdgeIds.length === 0
    ? ["missing_source_decision_support"]
    : []),
  ...(input.supersededBySourceClaimIds.length === 0
    ? []
    : [`superseded_by:${input.supersededBySourceClaimIds.join(",")}`]),
  ...(input.blockedByCurrentSourceClaimId === undefined
    ? []
    : [`weaker_than_current_valid_consensus:${input.blockedByCurrentSourceClaimId}`]),
  ...(input.rejectionIds.length === 0
    ? []
    : [`rejected_by:${input.rejectionIds.join(",")}`])
];

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
  const entries = input.sourceClaims
    .map((claim): SourceConsensusTimelineEntry => {
      const incomingEdges = incomingEdgesByClaim.get(claim.id) ?? [];
      const outgoingEdges = outgoingEdgesByClaim.get(claim.id) ?? [];
      const decisionSupportEdgeIds = (decisionEdgesByClaim.get(claim.id) ?? [])
        .map((edge) => edge.id);
      const temporalValidity = assessSourceClaimTemporalValidity(claim, input.now);
      const overrideAssessment = assessSourceClaimOverride({
        candidate: claim,
        currentConsensus: input.sourceClaims,
        now: input.now
      });
      const blockedByCurrentSourceClaimId =
        overrideAssessment.allowed ? undefined : (
          overrideAssessment.reason === "weaker_than_current_valid_consensus"
            ? overrideAssessment.blockedBySourceClaimId
            : undefined
        );
      const supersededBySourceClaimIds = sourceClaimEndpointIdsByKind(
        incomingEdges,
        supersedingEdgeKinds,
        "from"
      );
      const supersedesSourceClaimIds = sourceClaimEndpointIdsByKind(
        outgoingEdges,
        supersedingEdgeKinds,
        "to"
      );
      const rejectionIds = (rejectionsByClaim.get(claim.id) ?? [])
        .map((rejection) => rejection.id);
      const state = sourceConsensusEntryState({
        claim,
        temporalValidity,
        decisionSupportEdgeIds,
        supersededBySourceClaimIds,
        rejectionIds,
        blockedByCurrentSourceClaimId
      });
      const claimMetadata = readSourceRelationMetadataReadback(claim.metadata);
      const rawEvidenceCitationRef = readRawEvidenceCitationRef(claim.metadata);

      return {
        sourceClaimId: claim.id,
        claim: claim.claim,
        status: claim.status,
        createdAt: claim.createdAt,
        sourceAuthority: claim.sourceAuthority,
        authorityRank: rankSourceAuthority(claim.sourceAuthority),
        temporalValidity,
        state,
        ...(blockedByCurrentSourceClaimId === undefined
          ? {}
          : { blockedByCurrentSourceClaimId }),
        decisionSupportEdgeIds,
        evidenceRefs: claimMetadata.evidenceRefs,
        rawEvidenceCitationRefs: rawEvidenceCitationRef === undefined
          ? []
          : [rawEvidenceCitationRef],
        sourceRanges: claimMetadata.sourceRanges,
        supportingSourceClaimIds: sourceClaimEndpointIdsByKind(
          incomingEdges,
          supportEdgeKinds,
          "from"
        ),
        dissentingSourceClaimIds: sourceClaimEndpointIdsByKind(
          incomingEdges,
          dissentEdgeKinds,
          "from"
        ),
        supersededBySourceClaimIds,
        supersedesSourceClaimIds,
        rejectionIds,
        caveats: sourceConsensusCaveats({
          temporalValidity,
          decisionSupportEdgeIds,
          supersededBySourceClaimIds,
          rejectionIds,
          blockedByCurrentSourceClaimId
        })
      };
    })
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
    !hasText(claim.mechanism) ||
    !hasText(claim.krnImplication) ||
    !hasText(claim.doesNotProve) ||
    !hasText(claim.consumer) ||
    !hasText(claim.falsifier)
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
    hasText(claim.consumer) &&
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
    !hasText(decision.sourceClaimId)
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
    !hasText(decision.decision) ||
    !hasText(decision.rationale) ||
    !hasText(decision.falsifier) ||
    !hasText(decision.consumer)
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
