import { describe, expect, it } from "vitest";

import * as sourceSchema from "./sources.js";

describe("source graph schema", () => {
  it("exposes M22 source vocabulary and typed decision edges", () => {
    expect(sourceSchema.sourceTrustTier.enumValues).toEqual(
      expect.arrayContaining([
        "primary",
        "official",
        "project-decision",
        "source-code",
        "paper",
        "practitioner",
        "secondary",
        "hypothesis"
      ])
    );
    expect(sourceSchema.sourceSupportType.enumValues).toEqual(
      expect.arrayContaining([
        "mechanism",
        "decision",
        "risk",
        "rejection",
        "eval-design",
        "implementation-boundary"
      ])
    );
    expect("sourceClaimStatus" in sourceSchema).toBe(true);
    expect("sourceDecisionTargetType" in sourceSchema).toBe(true);
    expect("sourceDecisionEdgeConfidence" in sourceSchema).toBe(true);
    expect("sourceDecisionEdges" in sourceSchema).toBe(true);
    expect("sourceRejectionReason" in sourceSchema).toBe(true);
  });
});
