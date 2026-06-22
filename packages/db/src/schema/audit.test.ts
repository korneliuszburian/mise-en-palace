import { describe, expect, it } from "vitest";

import * as auditSchema from "./audit.js";

describe("audit bundle schema", () => {
  it("exposes audit bundle verdict and risk vocabulary", () => {
    expect(auditSchema.auditFindingSeverity.enumValues).toEqual(
      expect.arrayContaining(["info", "advisory", "warning", "blocking"])
    );
    expect(auditSchema.auditFinalVerdict.enumValues).toEqual(
      expect.arrayContaining(["pass", "advisory", "needs_review", "fail"])
    );
    expect(auditSchema.auditRiskEstimate.enumValues).toEqual(
      expect.arrayContaining(["low", "medium", "high"])
    );
  });

  it("exposes audit bundle stable query fields and JSON evidence fields", () => {
    expect("sliceId" in auditSchema.auditBundles).toBe(true);
    expect("finalVerdict" in auditSchema.auditBundles).toBe(true);
    expect("reviewBurdenEstimate" in auditSchema.auditBundles).toBe(true);
    expect("diffRiskEstimate" in auditSchema.auditBundles).toBe(true);
    expect("verificationCommands" in auditSchema.auditBundles).toBe(true);
    expect("candidateUpdates" in auditSchema.auditBundles).toBe(true);
  });

  it("exposes audit finding fields linked to audit bundles", () => {
    expect("auditBundleId" in auditSchema.auditFindings).toBe(true);
    expect("category" in auditSchema.auditFindings).toBe(true);
    expect("severity" in auditSchema.auditFindings).toBe(true);
    expect("status" in auditSchema.auditFindings).toBe(true);
    expect("evidenceRefs" in auditSchema.auditFindings).toBe(true);
  });
});
