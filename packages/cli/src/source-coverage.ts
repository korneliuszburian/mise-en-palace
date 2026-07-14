import type {
  SourceDecisionEvidenceFreshness,
  SourceDecisionEvidenceProvenance,
  SourceDecisionEvidenceStatus
} from "@krn/core/repositories/internal";

export type SourceCoverageStatus =
  | "declared_scope_current_complete"
  | "incomplete"
  | "unknown";

export interface SourceCoverageDeclaredRow {
  readonly decisionId: string;
  readonly evidenceRefs: readonly string[];
}

export interface SourceCoverageScope {
  readonly declaredRows: readonly SourceCoverageDeclaredRow[];
}

export interface SourceCoverageEvidence {
  readonly decisionId: string;
  readonly evidenceRef: string;
  readonly status: SourceDecisionEvidenceStatus;
  readonly capturedAt?: string;
  readonly contentHash?: string;
  readonly freshness?: SourceDecisionEvidenceFreshness;
  readonly provenance?: SourceDecisionEvidenceProvenance;
  readonly reason?: string;
}

export interface SourceCoverageReport {
  readonly status: SourceCoverageStatus;
  readonly declaredRowCount: number;
  readonly capturedRowCount: number;
  readonly missingRowCount: number;
  readonly declaredEvidenceRefCount: number;
  readonly capturedEvidenceRefCount: number;
  readonly capturedCurrentEvidenceRefCount: number;
  readonly capturedStaleEvidenceRefCount: number;
  readonly capturedUnknownEvidenceRefCount: number;
  readonly missingEvidenceRefCount: number;
  readonly mismatchedEvidenceRefCount: number;
  readonly externallyUnverifiedEvidenceRefCount: number;
  readonly missingDecisionIds: readonly string[];
  readonly missingEvidenceRefs: readonly string[];
  readonly mismatchedEvidenceRefs: readonly string[];
  readonly evidence: readonly SourceCoverageEvidence[];
  readonly doesNotProve: readonly string[];
}

const doesNotProve = [
  "declared-scope completeness does not prove universal source completeness",
  "declared-scope completeness does not prove semantic truth, unbiased selection, or remote freshness",
  "missing or externally unverified evidence must remain an evidence gap or abstention input"
] as const;

const unknownReport = (
  evidence: readonly SourceCoverageEvidence[]
): SourceCoverageReport => ({
  status: "unknown",
  declaredRowCount: 0,
  capturedRowCount: 0,
  missingRowCount: 0,
  declaredEvidenceRefCount: 0,
  capturedEvidenceRefCount: 0,
  capturedCurrentEvidenceRefCount: 0,
  capturedStaleEvidenceRefCount: 0,
  capturedUnknownEvidenceRefCount: 0,
  missingEvidenceRefCount: 0,
  mismatchedEvidenceRefCount: 0,
  externallyUnverifiedEvidenceRefCount: 0,
  missingDecisionIds: [],
  missingEvidenceRefs: [],
  mismatchedEvidenceRefs: [],
  evidence,
  doesNotProve
});

type CoverageOutcome =
  | "captured_current"
  | "captured_stale"
  | "captured_unknown"
  | "missing"
  | "mismatched"
  | "externally_unverified";

interface CoverageDelta {
  readonly capturedRow: boolean;
  readonly capturedEvidenceRefCount: number;
  readonly capturedCurrentEvidenceRefCount: number;
  readonly capturedStaleEvidenceRefCount: number;
  readonly capturedUnknownEvidenceRefCount: number;
  readonly missingEvidenceRefCount: number;
  readonly mismatchedEvidenceRefCount: number;
  readonly externallyUnverifiedEvidenceRefCount: number;
  readonly missingDecisionId?: string;
  readonly missingEvidenceRefs: readonly string[];
  readonly mismatchedEvidenceRefs: readonly string[];
}

const classifyEvidenceRef = (
  evidenceRef: string,
  evidence: readonly SourceCoverageEvidence[]
): CoverageOutcome => {
  const matchingEvidence = evidence.find((candidate) => candidate.evidenceRef === evidenceRef);

  if (matchingEvidence === undefined) {
    return "mismatched";
  }

  switch (matchingEvidence.status) {
    case "captured": {
      switch (matchingEvidence.freshness) {
        case "current":
          return "captured_current";
        case "stale":
          return "captured_stale";
        default:
          return "captured_unknown";
      }
    }
    case "missing":
      return "missing";
    case "digest_mismatch":
      return "mismatched";
    case "externally_unverified":
      return "externally_unverified";
  }
};

const isCapturedOutcome = (outcome: CoverageOutcome): boolean =>
  outcome === "captured_current" ||
  outcome === "captured_stale" ||
  outcome === "captured_unknown";

const assessDeclaredRow = (
  declaredRow: SourceCoverageDeclaredRow,
  evidence: readonly SourceCoverageEvidence[]
): CoverageDelta => {
  if (evidence.length === 0) {
    return {
      capturedRow: false,
      capturedEvidenceRefCount: 0,
      capturedCurrentEvidenceRefCount: 0,
      capturedStaleEvidenceRefCount: 0,
      capturedUnknownEvidenceRefCount: 0,
      missingEvidenceRefCount: declaredRow.evidenceRefs.length,
      mismatchedEvidenceRefCount: 0,
      externallyUnverifiedEvidenceRefCount: 0,
      missingDecisionId: declaredRow.decisionId,
      missingEvidenceRefs: declaredRow.evidenceRefs,
      mismatchedEvidenceRefs: []
    };
  }

  const outcomes = declaredRow.evidenceRefs.map((evidenceRef) => ({
    evidenceRef,
    outcome: classifyEvidenceRef(evidenceRef, evidence)
  }));

  return {
    capturedRow: outcomes.length > 0 && outcomes.every(({ outcome }) => isCapturedOutcome(outcome)),
    capturedEvidenceRefCount: outcomes.filter(({ outcome }) => isCapturedOutcome(outcome)).length,
    capturedCurrentEvidenceRefCount: outcomes.filter(({ outcome }) => outcome === "captured_current").length,
    capturedStaleEvidenceRefCount: outcomes.filter(({ outcome }) => outcome === "captured_stale").length,
    capturedUnknownEvidenceRefCount: outcomes.filter(({ outcome }) => outcome === "captured_unknown").length,
    missingEvidenceRefCount: outcomes.filter(({ outcome }) => outcome === "missing").length,
    mismatchedEvidenceRefCount: outcomes.filter(({ outcome }) => outcome === "mismatched").length,
    externallyUnverifiedEvidenceRefCount: outcomes.filter(({ outcome }) => outcome === "externally_unverified").length,
    missingEvidenceRefs: outcomes
      .filter(({ outcome }) => outcome === "missing")
      .map(({ evidenceRef }) => evidenceRef),
    mismatchedEvidenceRefs: outcomes
      .filter(({ outcome }) => outcome === "mismatched")
      .map(({ evidenceRef }) => evidenceRef)
  };
};

const evidenceByDecisionId = (
  evidence: readonly SourceCoverageEvidence[]
): ReadonlyMap<string, readonly SourceCoverageEvidence[]> => {
  const grouped = new Map<string, SourceCoverageEvidence[]>();

  for (const item of evidence) {
    const group = grouped.get(item.decisionId) ?? [];
    group.push(item);
    grouped.set(item.decisionId, group);
  }

  return grouped;
};

const coverageIsCurrentComplete = (input: {
  readonly capturedRowCount: number;
  readonly declaredRowCount: number;
  readonly missingDecisionIds: readonly string[];
  readonly missingEvidenceRefCount: number;
  readonly mismatchedEvidenceRefCount: number;
  readonly externallyUnverifiedEvidenceRefCount: number;
  readonly capturedCurrentEvidenceRefCount: number;
  readonly capturedStaleEvidenceRefCount: number;
  readonly capturedUnknownEvidenceRefCount: number;
  readonly declaredEvidenceRefCount: number;
}): boolean => input.capturedRowCount === input.declaredRowCount &&
  input.missingDecisionIds.length === 0 &&
  input.missingEvidenceRefCount === 0 &&
  input.mismatchedEvidenceRefCount === 0 &&
  input.externallyUnverifiedEvidenceRefCount === 0 &&
  input.capturedCurrentEvidenceRefCount === input.declaredEvidenceRefCount &&
  input.capturedStaleEvidenceRefCount === 0 &&
  input.capturedUnknownEvidenceRefCount === 0;

export const evaluateSourceCoverage = (input: {
  readonly scope?: SourceCoverageScope;
  readonly evidence: readonly SourceCoverageEvidence[];
}): SourceCoverageReport => {
  if (input.scope === undefined) {
    return unknownReport(input.evidence);
  }

  const evidenceGroups = evidenceByDecisionId(input.evidence);
  const missingDecisionIds: string[] = [];
  const missingEvidenceRefs: string[] = [];
  const mismatchedEvidenceRefs: string[] = [];
  let capturedRowCount = 0;
  let capturedEvidenceRefCount = 0;
  let capturedCurrentEvidenceRefCount = 0;
  let capturedStaleEvidenceRefCount = 0;
  let capturedUnknownEvidenceRefCount = 0;
  let missingEvidenceRefCount = 0;
  let mismatchedEvidenceRefCount = 0;
  let externallyUnverifiedEvidenceRefCount = 0;

  for (const declaredRow of input.scope.declaredRows) {
    const delta = assessDeclaredRow(
      declaredRow,
      evidenceGroups.get(declaredRow.decisionId) ?? []
    );

    if (delta.missingDecisionId !== undefined) {
      missingDecisionIds.push(delta.missingDecisionId);
    }

    if (delta.capturedRow) {
      capturedRowCount += 1;
    }
    capturedEvidenceRefCount += delta.capturedEvidenceRefCount;
    capturedCurrentEvidenceRefCount += delta.capturedCurrentEvidenceRefCount;
    capturedStaleEvidenceRefCount += delta.capturedStaleEvidenceRefCount;
    capturedUnknownEvidenceRefCount += delta.capturedUnknownEvidenceRefCount;
    missingEvidenceRefCount += delta.missingEvidenceRefCount;
    mismatchedEvidenceRefCount += delta.mismatchedEvidenceRefCount;
    externallyUnverifiedEvidenceRefCount += delta.externallyUnverifiedEvidenceRefCount;
    missingEvidenceRefs.push(...delta.missingEvidenceRefs);
    mismatchedEvidenceRefs.push(...delta.mismatchedEvidenceRefs);
  }

  const declaredEvidenceRefCount = input.scope.declaredRows.reduce(
    (count, row) => count + row.evidenceRefs.length,
    0
  );
  const status = coverageIsCurrentComplete({
    capturedRowCount,
    declaredRowCount: input.scope.declaredRows.length,
    missingDecisionIds,
    missingEvidenceRefCount,
    mismatchedEvidenceRefCount,
    externallyUnverifiedEvidenceRefCount,
    capturedCurrentEvidenceRefCount,
    capturedStaleEvidenceRefCount,
    capturedUnknownEvidenceRefCount,
    declaredEvidenceRefCount
  })
    ? "declared_scope_current_complete"
    : "incomplete";

  return {
    status,
    declaredRowCount: input.scope.declaredRows.length,
    capturedRowCount,
    missingRowCount: missingDecisionIds.length,
    declaredEvidenceRefCount,
    capturedEvidenceRefCount,
    capturedCurrentEvidenceRefCount,
    capturedStaleEvidenceRefCount,
    capturedUnknownEvidenceRefCount,
    missingEvidenceRefCount,
    mismatchedEvidenceRefCount,
    externallyUnverifiedEvidenceRefCount,
    missingDecisionIds,
    missingEvidenceRefs,
    mismatchedEvidenceRefs,
    evidence: input.evidence,
    doesNotProve
  };
};
