import { describe, expect, it } from "vitest";

import * as legacyAuditSchema from "./legacyAudit.js";

describe("legacy audit bundle schema", () => {
  it("retains legacy audit bundle verdict and risk vocabulary for migration compatibility", () => {
    expect(legacyAuditSchema.legacyAuditFindingSeverity.enumValues).toEqual(
      expect.arrayContaining(["info", "advisory", "warning", "blocking"])
    );
    expect(legacyAuditSchema.legacyAuditFinalVerdict.enumValues).toEqual(
      expect.arrayContaining(["pass", "advisory", "needs_review", "fail"])
    );
    expect(legacyAuditSchema.legacyAuditRiskEstimate.enumValues).toEqual(
      expect.arrayContaining(["low", "medium", "high"])
    );
  });

  it("keeps legacy table fields available without a domain write repository", () => {
    expect("sliceId" in legacyAuditSchema.legacyAuditBundles).toBe(true);
    expect("finalVerdict" in legacyAuditSchema.legacyAuditBundles).toBe(true);
    expect("reviewBurdenEstimate" in legacyAuditSchema.legacyAuditBundles).toBe(true);
    expect("diffRiskEstimate" in legacyAuditSchema.legacyAuditBundles).toBe(true);
    expect("verificationCommands" in legacyAuditSchema.legacyAuditBundles).toBe(true);
    expect("candidateUpdates" in legacyAuditSchema.legacyAuditBundles).toBe(true);
  });

  it("keeps legacy finding fields linked to legacy audit bundles", () => {
    expect("auditBundleId" in legacyAuditSchema.legacyAuditFindings).toBe(true);
    expect("category" in legacyAuditSchema.legacyAuditFindings).toBe(true);
    expect("severity" in legacyAuditSchema.legacyAuditFindings).toBe(true);
    expect("status" in legacyAuditSchema.legacyAuditFindings).toBe(true);
    expect("evidenceRefs" in legacyAuditSchema.legacyAuditFindings).toBe(true);
  });
});
