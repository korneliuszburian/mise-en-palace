import { describe, expect, test } from "vitest";

import {
  getHighestAuditFindingSeverity,
  resolveAuditFinalVerdict,
  type AuditBundle,
  type AuditFinding
} from "./auditBundle.js";

const now = "2026-06-22T18:00:00.000Z";

const finding = (severity: AuditFinding["severity"]): AuditFinding => ({
  id: `finding-${severity}`,
  category: "boundary",
  severity,
  title: `${severity} boundary finding`,
  summary: "A reviewable boundary finding.",
  evidenceRefs: ["packages/core/src/index.ts"],
  recommendation: "Inspect the boundary before promotion.",
  status: "open",
  createdAt: now
});

const bundle = (findings: AuditFinding[]): AuditBundle => ({
  id: "audit-bundle-1",
  sliceId: "MM-03",
  commitCandidate: "feat(core): add audit bundle domain contract",
  changedFiles: ["packages/core/src/auditBundle.ts"],
  intendedFiles: ["packages/core/src/auditBundle.ts"],
  unexpectedFiles: [],
  verificationCommands: [
    { command: "pnpm typecheck", status: "passed" },
    { command: "pnpm test", status: "passed" }
  ],
  verificationResults: "Focused and full verification passed.",
  architecturalDelta: "Adds pure AuditBundle domain contract.",
  boundaryFindings: findings.filter((item) => item.category === "boundary"),
  typeSafetyFindings: findings.filter((item) => item.category === "type_safety"),
  memorySemanticsFindings: findings.filter((item) => item.category === "memory_semantics"),
  sourceGroundingFindings: findings.filter((item) => item.category === "source_grounding"),
  policyFindings: findings.filter((item) => item.category === "policy"),
  evalFindings: findings.filter((item) => item.category === "eval"),
  reviewBurdenEstimate: "low",
  diffRiskEstimate: "low",
  rollbackPath: "git restore packages/core/src/auditBundle.ts",
  candidateUpdates: [],
  selfCritiqueSummary: "Pure domain slice; no runtime behavior.",
  finalVerdict: "pass",
  createdAt: now,
  updatedAt: now
});

describe("audit bundle domain contract", () => {
  test("resolves final verdict conservatively from finding severity", () => {
    expect(resolveAuditFinalVerdict(bundle([]))).toBe("pass");
    expect(resolveAuditFinalVerdict(bundle([finding("info")]))).toBe("pass");
    expect(resolveAuditFinalVerdict(bundle([finding("advisory")]))).toBe("advisory");
    expect(resolveAuditFinalVerdict(bundle([finding("warning")]))).toBe("needs_review");
    expect(resolveAuditFinalVerdict(bundle([finding("blocking")]))).toBe("fail");
  });

  test("uses the highest audit finding severity across finding groups", () => {
    const findings: AuditFinding[] = [
      { ...finding("info"), category: "eval" },
      { ...finding("advisory"), category: "source_grounding" },
      { ...finding("warning"), category: "memory_semantics" }
    ];

    expect(getHighestAuditFindingSeverity(bundle(findings))).toBe("warning");
  });
});
