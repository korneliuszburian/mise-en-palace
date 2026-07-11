import { describe, expect, it } from "vitest";

import {
  evaluateSourceCoverage,
  type SourceCoverageEvidence
} from "../source-coverage.js";

const capturedEvidence = (
  decisionId: string,
  evidenceRef: string
): SourceCoverageEvidence => ({
  decisionId,
  evidenceRef,
  status: "captured",
  capturedAt: "2026-07-11T00:00:00.000Z",
  contentHash: "sha256:captured",
  freshness: "unknown",
  provenance: {
    kind: "source_snapshot",
    uri: evidenceRef,
    sourceArtifactId: "artifact-1",
    sourceSnapshotId: "snapshot-1"
  }
});

describe("source coverage", () => {
  it("reports declared scope complete only when every declared row and evidence ref is captured", () => {
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
      status: "declared_scope_complete",
      declaredRowCount: 2,
      capturedRowCount: 2,
      missingRowCount: 0,
      declaredEvidenceRefCount: 2,
      capturedEvidenceRefCount: 2,
      missingEvidenceRefCount: 0,
      mismatchedEvidenceRefCount: 0,
      externallyUnverifiedEvidenceRefCount: 0
    });
    expect(report.evidence).toEqual([
      expect.objectContaining({
        evidenceRef: "https://example.test/one",
        capturedAt: "2026-07-11T00:00:00.000Z",
        contentHash: "sha256:captured",
        freshness: "unknown"
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
      missingEvidenceRefCount: 1,
      mismatchedEvidenceRefCount: 1,
      externallyUnverifiedEvidenceRefCount: 1,
      missingDecisionIds: ["decision-3"],
      missingEvidenceRefs: ["https://example.test/three"],
      mismatchedEvidenceRefs: ["https://example.test/one"]
    });
  });

  it("returns unknown when no declared scope exists", () => {
    expect(evaluateSourceCoverage({ evidence: [] })).toMatchObject({
      status: "unknown",
      declaredRowCount: 0,
      declaredEvidenceRefCount: 0
    });
  });
});
