import type {
  EvalCandidate
} from "../eval.js";
import type {
  ExecutionRunId,
  ObservationGroupId,
  ObservationItemId,
  ProjectId,
  SourceClaimId,
  TaskContractId
} from "../ids.js";
import type {
  SourceLineageRef
} from "../memory.js";
import type {
  SourceClaim
} from "../source.js";
import type {
  IsoTimestamp
} from "../time.js";
import type {
  ObservationItem
} from "../observations/index.js";
import {
  requiresObservationSourceRange
} from "../observations/index.js";

export type ReflectionStatus = "candidate" | "reviewed" | "rejected" | "superseded";
export type ReflectionFindingKind =
  | "candidate_signal"
  | "contradiction"
  | "gap"
  | "risk"
  | "correction"
  | "policy_signal";
export type ReflectionSeverity = "low" | "medium" | "high" | "critical";

export interface ReflectionScope {
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  observationGroupIds?: ObservationGroupId[];
}

export interface ReflectionInput {
  scope: ReflectionScope;
  observationItemIds: ObservationItemId[];
  sourceClaimIds: SourceClaimId[];
  antiMemoryKeys: string[];
  generatedAt: IsoTimestamp;
  metadata: Record<string, unknown>;
}

export interface ReflectionFinding {
  id: string;
  kind: ReflectionFindingKind;
  severity: ReflectionSeverity;
  summary: string;
  observationItemIds: ObservationItemId[];
  evidenceRefs: string[];
  metadata: Record<string, unknown>;
}

export interface ContradictionReport {
  id: string;
  summary: string;
  observationItemIds: ObservationItemId[];
  conflictingClaims: string[];
  evidenceRefs: string[];
  severity: ReflectionSeverity;
  metadata: Record<string, unknown>;
}

export interface GapReport {
  id: string;
  summary: string;
  missingEvidence: string;
  observationItemIds: ObservationItemId[];
  severity: ReflectionSeverity;
  metadata: Record<string, unknown>;
}

export const REFLECTION_CANDIDATE_OUTPUT_TARGETS = [
  "memory_candidate",
  "source_claim_candidate",
  "anti_memory_candidate",
  "policy_candidate",
  "eval_candidate"
] as const;

export type ReflectionCandidateOutputTarget =
  typeof REFLECTION_CANDIDATE_OUTPUT_TARGETS[number];

export interface ReflectionCandidateLink {
  targetType: ReflectionCandidateOutputTarget;
  targetId?: string;
  summary: string;
  evidenceRefs: string[];
}

export type ReflectionMemoryCandidateKind =
  | "fact"
  | "preference"
  | "constraint"
  | "procedure"
  | "pattern"
  | "risk";

export interface ReflectionMemoryCandidateProposal {
  kind: ReflectionMemoryCandidateKind;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceClaimIds?: SourceClaimId[];
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  metadata: Record<string, unknown>;
}

export type ReflectionSourceClaimCandidateProposal = Pick<
  SourceClaim,
  | "claim"
  | "mechanism"
  | "krnImplication"
  | "doesNotProve"
  | "trustTier"
  | "supportType"
  | "consumer"
  | "metadata"
> & {
  falsifier?: string;
  revisitWhen?: string;
};

export interface ReflectionAntiMemoryCandidateProposal {
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  reason?: string;
  invalidatedBySourceClaimIds: SourceClaimId[];
  appliesTo?: string;
  mayRevisitWhen?: string;
  sourceLineage: SourceLineageRef[];
  metadata: Record<string, unknown>;
}

export interface ReflectionPolicyCandidateProposal {
  key: string;
  summary: string;
  rationale: string;
  evidenceRefs: string[];
  metadata: Record<string, unknown>;
}

export type ReflectionEvalCandidateProposal = Pick<
  EvalCandidate,
  "title" | "scenario" | "expectedSignal" | "sourceEvidence" | "metadata"
>;

export interface ReflectionOutput {
  id: string;
  scope: ReflectionScope;
  status: ReflectionStatus;
  summary: string;
  findings: ReflectionFinding[];
  contradictions: ContradictionReport[];
  gaps: GapReport[];
  candidateLinks: ReflectionCandidateLink[];
  memoryCandidates: ReflectionMemoryCandidateProposal[];
  sourceClaimCandidates: ReflectionSourceClaimCandidateProposal[];
  antiMemoryCandidates: ReflectionAntiMemoryCandidateProposal[];
  policyCandidates: ReflectionPolicyCandidateProposal[];
  evalCandidates: ReflectionEvalCandidateProposal[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ReflectionRecord {
  id: string;
  scope: ReflectionScope;
  status: ReflectionStatus;
  summary: string;
  input: ReflectionInput;
  output: ReflectionOutput;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

const candidateTargetSet = new Set<string>(REFLECTION_CANDIDATE_OUTPUT_TARGETS);
const forbiddenMetadataKeys = new Set([
  "memory_record",
  "memory_record_id",
  "source_decision",
  "source_decision_id",
  "promote_memory_candidate",
  "create_active_memory"
]);

export type ReflectionOutputContractViolationReason =
  | "final_truth_target"
  | "final_truth_metadata";

export interface ReflectionOutputContractViolation {
  path: string;
  reason: ReflectionOutputContractViolationReason;
  value: string;
}

export interface ReflectionOutputContractAssessment {
  candidateOnly: boolean;
  violations: ReflectionOutputContractViolation[];
}

export type ReflectionCandidateGenerationStatus = "ready" | "blocked";

export interface ReflectionCandidateGenerationCounts {
  memoryCandidates: number;
  sourceClaimCandidates: number;
  antiMemoryCandidates: number;
  policyCandidates: number;
  evalCandidates: number;
}

export interface ReflectionCandidateGenerationPlan {
  status: ReflectionCandidateGenerationStatus;
  counts: ReflectionCandidateGenerationCounts;
  candidateLinks: ReflectionCandidateLink[];
  blockedReasons: string[];
}

export interface ReflectionDecisionSnapshot {
  id: string;
  sourceClaimId?: SourceClaimId;
  status: "adopt" | "reject" | "defer" | "lab_test";
  decision: string;
}

export interface ReflectionIssueReportInput {
  observations: readonly ObservationItem[];
  decisions?: readonly ReflectionDecisionSnapshot[];
  now: IsoTimestamp;
}

export interface ReflectionIssueReports {
  findings: ReflectionFinding[];
  contradictions: ContradictionReport[];
  gaps: GapReport[];
}

const normalizedKey = (key: string): string => (
  key
    .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
    .replace(/[-\s]+/gu, "_")
    .toLowerCase()
);

const collectForbiddenMetadata = (
  value: unknown,
  path: string[],
  violations: ReflectionOutputContractViolation[]
): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenMetadata(item, [...path, String(index)], violations));
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = [...path, key];

    if (forbiddenMetadataKeys.has(normalizedKey(key))) {
      violations.push({
        path: nextPath.join("."),
        reason: "final_truth_metadata",
        value: key
      });
    }

    collectForbiddenMetadata(child, nextPath, violations);
  }
};

const normalizeReportText = (value: string): string => (
  value.trim().replace(/\s+/gu, " ").toLowerCase()
);

const evidenceRefsForObservation = (observation: ObservationItem): string[] => (
  observation.sourceRanges.map((range) => `${observation.id}:${range.id}`)
);

const parseTimestamp = (value: IsoTimestamp): number | undefined => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const findingFromContradiction = (report: ContradictionReport): ReflectionFinding => ({
  id: `finding-${report.id}`,
  kind: "contradiction",
  severity: report.severity,
  summary: report.summary,
  observationItemIds: report.observationItemIds,
  evidenceRefs: report.evidenceRefs,
  metadata: report.metadata
});

const findingFromGap = (report: GapReport): ReflectionFinding => ({
  id: `finding-${report.id}`,
  kind: "gap",
  severity: report.severity,
  summary: report.summary,
  observationItemIds: report.observationItemIds,
  evidenceRefs: [],
  metadata: report.metadata
});

export const buildReflectionIssueReports = (
  input: ReflectionIssueReportInput
): ReflectionIssueReports => {
  const contradictions: ContradictionReport[] = [];
  const gaps: GapReport[] = [];
  const now = parseTimestamp(input.now);

  for (const observation of input.observations) {
    const evidenceRefs = evidenceRefsForObservation(observation);

    if (observation.status === "contested" || observation.kind === "conflict") {
      contradictions.push({
        id: `contradiction-${observation.id}`,
        summary: `Observation ${observation.id} is contested or conflict-marked.`,
        observationItemIds: [observation.id],
        conflictingClaims: [observation.summary],
        evidenceRefs,
        severity: observation.priority === "critical" ? "critical" : "high",
        metadata: {
          reason: observation.status === "contested" ? "contested_observation" : "conflict_observation",
          observationKind: observation.kind,
          observationStatus: observation.status
        }
      });
    }

    if (
      requiresObservationSourceRange(observation.kind, observation.provenanceKind) &&
      observation.sourceRanges.length === 0
    ) {
      gaps.push({
        id: `gap-missing-source-range-${observation.id}`,
        summary: `Observation ${observation.id} requires a source range but has none.`,
        missingEvidence: "source range",
        observationItemIds: [observation.id],
        severity: "high",
        metadata: {
          reason: "missing_source_range",
          observationKind: observation.kind,
          provenanceKind: observation.provenanceKind
        }
      });
    }

    const validUntil = observation.temporalScope.validUntil === undefined
      ? undefined
      : parseTimestamp(observation.temporalScope.validUntil);

    if (now !== undefined && validUntil !== undefined && validUntil < now) {
      gaps.push({
        id: `gap-stale-observation-${observation.id}`,
        summary: `Observation ${observation.id} is stale for the reflection timestamp.`,
        missingEvidence: "fresh observation or invalidation review",
        observationItemIds: [observation.id],
        severity: "medium",
        metadata: {
          reason: "stale_observation",
          validUntil: observation.temporalScope.validUntil
        }
      });
    }
  }

  const duplicateGroups = new Map<string, ObservationItem[]>();
  for (const observation of input.observations) {
    const duplicateKey = normalizeReportText(`${observation.subject}\n${observation.summary}`);
    const group = duplicateGroups.get(duplicateKey) ?? [];
    group.push(observation);
    duplicateGroups.set(duplicateKey, group);
  }

  for (const group of duplicateGroups.values()) {
    if (group.length < 2) {
      continue;
    }

    const sortedGroup = [...group].sort((left, right) => left.id.localeCompare(right.id));
    gaps.push({
      id: `gap-duplicate-observations-${sortedGroup.map((item) => item.id).join("-")}`,
      summary: "Duplicate observations require consolidation before reflection promotion.",
      missingEvidence: "deduplicated observation or reviewer consolidation note",
      observationItemIds: sortedGroup.map((item) => item.id),
      severity: "low",
      metadata: {
        reason: "duplicate_observations",
        duplicateKey: normalizeReportText(sortedGroup[0]?.summary ?? "")
      }
    });
  }

  for (const decision of input.decisions ?? []) {
    if (decision.sourceClaimId !== undefined) {
      continue;
    }

    gaps.push({
      id: `gap-unsupported-decision-${decision.id}`,
      summary: `Decision ${decision.id} has no source claim link.`,
      missingEvidence: "source claim link",
      observationItemIds: [],
      severity: decision.status === "adopt" ? "high" : "medium",
      metadata: {
        reason: "unsupported_decision",
        decisionId: decision.id,
        decisionStatus: decision.status
      }
    });
  }

  const sortedContradictions = contradictions.sort((left, right) => left.id.localeCompare(right.id));
  const sortedGaps = gaps.sort((left, right) => left.id.localeCompare(right.id));

  return {
    findings: [
      ...sortedContradictions.map(findingFromContradiction),
      ...sortedGaps.map(findingFromGap)
    ].sort((left, right) => left.id.localeCompare(right.id)),
    contradictions: sortedContradictions,
    gaps: sortedGaps
  };
};

export const assessReflectionOutputContract = (output: {
  candidateLinks: readonly { targetType: string }[];
  metadata?: Record<string, unknown>;
}): ReflectionOutputContractAssessment => {
  const violations: ReflectionOutputContractViolation[] = [];

  output.candidateLinks.forEach((link, index) => {
    if (!candidateTargetSet.has(link.targetType)) {
      violations.push({
        path: `candidateLinks.${index}.targetType`,
        reason: "final_truth_target",
        value: link.targetType
      });
    }
  });

  if (output.metadata !== undefined) {
    collectForbiddenMetadata(output.metadata, ["metadata"], violations);
  }

  return {
    candidateOnly: violations.length === 0,
    violations
  };
};

export const isReflectionOutputCandidateOnly = (output: {
  candidateLinks: readonly { targetType: string }[];
  metadata?: Record<string, unknown>;
}): boolean => (
  assessReflectionOutputContract(output).candidateOnly
);

export const buildReflectionCandidateGenerationPlan = (
  output: ReflectionOutput
): ReflectionCandidateGenerationPlan => {
  const assessment = assessReflectionOutputContract(output);

  return {
    status: assessment.candidateOnly ? "ready" : "blocked",
    counts: {
      memoryCandidates: output.memoryCandidates.length,
      sourceClaimCandidates: output.sourceClaimCandidates.length,
      antiMemoryCandidates: output.antiMemoryCandidates.length,
      policyCandidates: output.policyCandidates.length,
      evalCandidates: output.evalCandidates.length
    },
    candidateLinks: [...output.candidateLinks].sort((left, right) => (
      left.targetType.localeCompare(right.targetType) ||
      (left.targetId ?? "").localeCompare(right.targetId ?? "") ||
      left.summary.localeCompare(right.summary)
    )),
    blockedReasons: assessment.violations.map((violation) =>
      `${violation.path}:${violation.reason}`)
  };
};
