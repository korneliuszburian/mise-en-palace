import { describe, expect, it } from "vitest";

import {
  sourceAuthorityLabels,
  sourceSupportTypes
} from "@krn/core";

import * as sourceSchema from "../sources.js";

describe("source graph schema", () => {
  it("keeps DB source enums aligned with the core source model", () => {
    expect(sourceSchema.sourceAuthorityLabel.enumValues).toEqual(sourceAuthorityLabels);
    expect(sourceSchema.sourceSupportType.enumValues).toEqual(sourceSupportTypes);
    expect("sourceClaimStatus" in sourceSchema).toBe(true);
    expect("sourceDecisionTargetType" in sourceSchema).toBe(true);
    expect("sourceDecisionEdgeConfidence" in sourceSchema).toBe(true);
    expect("sourceDecisionEdges" in sourceSchema).toBe(true);
    expect("sourceRejectionReason" in sourceSchema).toBe(true);
  });
});
