import type {
  SourceDecisionEvidenceProvenance,
  SourceDecisionEvidenceStatus
} from "@krn/core/repositories/internal";

export type SourceCoverageStatus =
  | "declared_scope_complete"
  | "incomplete"
  | "unknown";

export type SourceCoverageFreshness = "current" | "stale" | "unknown";

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
  readonly freshness?: SourceCoverageFreshness;
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
  missingEvidenceRefCount: 0,
  mismatchedEvidenceRefCount: 0,
  externallyUnverifiedEvidenceRefCount: 0,
  missingDecisionIds: [],
  missingEvidenceRefs: [],
  mismatchedEvidenceRefs: [],
  evidence,
  doesNotProve
});

export const evaluateSourceCoverage = (input: {
  readonly scope?: SourceCoverageScope;
  readonly evidence: readonly SourceCoverageEvidence[];
}): SourceCoverageReport => {
  if (input.scope === undefined) {
    return unknownReport(input.evidence);
  }

  const evidenceByDecisionId = new Map<string, readonly SourceCoverageEvidence[]>();

  for (const evidence of input.evidence) {
    evidenceByDecisionId.set(evidence.decisionId, [
      ...(evidenceByDecisionId.get(evidence.decisionId) ?? []),
      evidence
    ]);
  }

  const missingDecisionIds: string[] = [];
  const missingEvidenceRefs: string[] = [];
  const mismatchedEvidenceRefs: string[] = [];
  let capturedRowCount = 0;
  let capturedEvidenceRefCount = 0;
  let missingEvidenceRefCount = 0;
  let mismatchedEvidenceRefCount = 0;
  let externallyUnverifiedEvidenceRefCount = 0;

  for (const declaredRow of input.scope.declaredRows) {
    const evidence = evidenceByDecisionId.get(declaredRow.decisionId) ?? [];

    if (evidence.length === 0) {
      missingDecisionIds.push(declaredRow.decisionId);
      missingEvidenceRefs.push(...declaredRow.evidenceRefs);
      missingEvidenceRefCount += declaredRow.evidenceRefs.length;
      continue;
    }

    let rowCaptured = declaredRow.evidenceRefs.length > 0;

    for (const evidenceRef of declaredRow.evidenceRefs) {
      const matchingEvidence = evidence.find((candidate) => candidate.evidenceRef === evidenceRef);

      if (matchingEvidence === undefined) {
        mismatchedEvidenceRefs.push(evidenceRef);
        mismatchedEvidenceRefCount += 1;
        rowCaptured = false;
        continue;
      }

      if (matchingEvidence.status === "captured") {
        capturedEvidenceRefCount += 1;
        continue;
      }

      rowCaptured = false;

      if (matchingEvidence.status === "missing") {
        missingEvidenceRefCount += 1;
        missingEvidenceRefs.push(evidenceRef);
      } else if (matchingEvidence.status === "digest_mismatch") {
        mismatchedEvidenceRefCount += 1;
        mismatchedEvidenceRefs.push(evidenceRef);
      } else {
        externallyUnverifiedEvidenceRefCount += 1;
      }
    }

    if (rowCaptured) {
      capturedRowCount += 1;
    }
  }

  const declaredEvidenceRefCount = input.scope.declaredRows.reduce(
    (count, row) => count + row.evidenceRefs.length,
    0
  );
  const status = missingDecisionIds.length === 0 &&
    missingEvidenceRefCount === 0 &&
    mismatchedEvidenceRefCount === 0 &&
    externallyUnverifiedEvidenceRefCount === 0 &&
    capturedEvidenceRefCount === declaredEvidenceRefCount
    ? "declared_scope_complete"
    : "incomplete";

  return {
    status,
    declaredRowCount: input.scope.declaredRows.length,
    capturedRowCount,
    missingRowCount: missingDecisionIds.length,
    declaredEvidenceRefCount,
    capturedEvidenceRefCount,
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
