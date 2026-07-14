import { describe, expect, it } from "vitest";

import {
  evaluateSourceCoverage,
  type SourceCoverageEvidence
} from "../source-coverage.js";

const capturedEvidence = (
  decisionId: string,
  evidenceRef: string,
  freshness: SourceCoverageEvidence["freshness"] = "current"
): SourceCoverageEvidence => ({
  decisionId,
  evidenceRef,
  status: "captured",
  capturedAt: "2026-07-11T00:00:00.000Z",
  contentHash: "sha256:captured",
  freshness,
  provenance: {
    kind: "source_snapshot",
    uri: evidenceRef,
    sourceArtifactId: "artifact-1",
    sourceSnapshotId: "snapshot-1"
  }
});

describe("source coverage", () => {
  it("reports declared scope current-complete only when every declared evidence ref is captured and current", () => {
    const report = evaluateSourceCoverage({
      scope: {
        declaredRows: [
          { decisionId: "decision-1", evidenceRefs: ["https://example.test/one"] },
          { decisionId: "decision-2", evidenceRefs: ["https://example.test/two"] }
        ]
      },
      evidence: [
        capturedEvidence("decision-1", "https://example.test/one"),
        capturedEvidence("decision-2", "https://example.test/two")
      ]
    });

    expect(report).toMatchObject({
      status: "declared_scope_current_complete",
      declaredRowCount: 2,
      capturedRowCount: 2,
      missingRowCount: 0,
      declaredEvidenceRefCount: 2,
      capturedEvidenceRefCount: 2,
      capturedCurrentEvidenceRefCount: 2,
      capturedStaleEvidenceRefCount: 0,
      capturedUnknownEvidenceRefCount: 0,
      missingEvidenceRefCount: 0,
      mismatchedEvidenceRefCount: 0,
      externallyUnverifiedEvidenceRefCount: 0
    });
    expect(report.evidence).toEqual([
      expect.objectContaining({
        evidenceRef: "https://example.test/one",
        capturedAt: "2026-07-11T00:00:00.000Z",
        contentHash: "sha256:captured",
        freshness: "current"
      }),
      expect.objectContaining({ evidenceRef: "https://example.test/two" })
    ]);
  });

  it("reports missing, mismatched, and externally unverified evidence inside the declared scope", () => {
    const report = evaluateSourceCoverage({
      scope: {
        declaredRows: [
          { decisionId: "decision-1", evidenceRefs: ["https://example.test/one"] },
          { decisionId: "decision-2", evidenceRefs: ["https://example.test/two"] },
          { decisionId: "decision-3", evidenceRefs: ["https://example.test/three"] }
        ]
      },
      evidence: [
        { ...capturedEvidence("decision-1", "https://example.test/other"), status: "digest_mismatch" },
        { decisionId: "decision-2", evidenceRef: "https://example.test/two", status: "externally_unverified" }
      ]
    });

    expect(report).toMatchObject({
      status: "incomplete",
      declaredRowCount: 3,
      capturedRowCount: 0,
      missingRowCount: 1,
      declaredEvidenceRefCount: 3,
      capturedEvidenceRefCount: 0,
      capturedCurrentEvidenceRefCount: 0,
      capturedStaleEvidenceRefCount: 0,
      capturedUnknownEvidenceRefCount: 0,
      missingEvidenceRefCount: 1,
      mismatchedEvidenceRefCount: 1,
      externallyUnverifiedEvidenceRefCount: 1,
      missingDecisionIds: ["decision-3"],
      missingEvidenceRefs: ["https://example.test/three"],
      mismatchedEvidenceRefs: ["https://example.test/one"]
    });
  });

  it.each([
    {
      freshness: "stale" as const,
      capturedStaleEvidenceRefCount: 1,
      capturedUnknownEvidenceRefCount: 0
    },
    {
      freshness: "unknown" as const,
      capturedStaleEvidenceRefCount: 0,
      capturedUnknownEvidenceRefCount: 1
    }
  ])(
    "does not report a declared scope as current-complete for captured $freshness evidence",
    ({ freshness, capturedStaleEvidenceRefCount, capturedUnknownEvidenceRefCount }) => {
      const evidenceRef = `https://example.test/${freshness}`;
      const report = evaluateSourceCoverage({
        scope: {
          declaredRows: [{ decisionId: `decision-${freshness}`, evidenceRefs: [evidenceRef] }]
        },
        evidence: [capturedEvidence(`decision-${freshness}`, evidenceRef, freshness)]
      });

      expect(report).toMatchObject({
        status: "incomplete",
        declaredRowCount: 1,
        capturedRowCount: 1,
        missingRowCount: 0,
        declaredEvidenceRefCount: 1,
        capturedEvidenceRefCount: 1,
        capturedCurrentEvidenceRefCount: 0,
        capturedStaleEvidenceRefCount,
        capturedUnknownEvidenceRefCount,
        missingEvidenceRefCount: 0,
        mismatchedEvidenceRefCount: 0,
        externallyUnverifiedEvidenceRefCount: 0,
        missingDecisionIds: [],
        missingEvidenceRefs: [],
        mismatchedEvidenceRefs: []
      });
      expect(report.evidence).toEqual([
        expect.objectContaining({ evidenceRef, freshness })
      ]);
    }
  );

  it("keeps one mixed-freshness declared row incomplete", () => {
    const decisionId = "decision-mixed";
    const currentEvidenceRef = "https://example.test/mixed-current";
    const staleEvidenceRef = "https://example.test/mixed-stale";
    const unknownEvidenceRef = "https://example.test/mixed-unknown";
    const report = evaluateSourceCoverage({
      scope: {
        declaredRows: [{
          decisionId,
          evidenceRefs: [currentEvidenceRef, staleEvidenceRef, unknownEvidenceRef]
        }]
      },
      evidence: [
        capturedEvidence(decisionId, currentEvidenceRef),
        capturedEvidence(decisionId, staleEvidenceRef, "stale"),
        {
          decisionId,
          evidenceRef: unknownEvidenceRef,
          status: "captured"
        }
      ]
    });

    expect(report).toMatchObject({
      status: "incomplete",
      declaredRowCount: 1,
      capturedRowCount: 1,
      declaredEvidenceRefCount: 3,
      capturedEvidenceRefCount: 3,
      capturedCurrentEvidenceRefCount: 1,
      capturedStaleEvidenceRefCount: 1,
      capturedUnknownEvidenceRefCount: 1
    });
  });

  it("does not call an empty declared row current-complete", () => {
    expect(evaluateSourceCoverage({
      scope: {
        declaredRows: [{ decisionId: "decision-empty", evidenceRefs: [] }]
      },
      evidence: [capturedEvidence(
        "decision-empty",
        "https://example.test/not-declared",
        "stale"
      )]
    })).toMatchObject({
      status: "incomplete",
      declaredRowCount: 1,
      capturedRowCount: 0,
      declaredEvidenceRefCount: 0,
      capturedEvidenceRefCount: 0,
      capturedCurrentEvidenceRefCount: 0,
      capturedStaleEvidenceRefCount: 0,
      capturedUnknownEvidenceRefCount: 0,
      missingDecisionIds: []
    });
  });

  it("returns unknown when no declared scope exists", () => {
    expect(evaluateSourceCoverage({ evidence: [] })).toMatchObject({
      status: "unknown",
      declaredRowCount: 0,
      declaredEvidenceRefCount: 0,
      capturedCurrentEvidenceRefCount: 0,
      capturedStaleEvidenceRefCount: 0,
      capturedUnknownEvidenceRefCount: 0
    });
  });
});
