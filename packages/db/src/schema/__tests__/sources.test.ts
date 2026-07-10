import { describe, expect, it } from "vitest";

import {
  sourceAuthorityLabels,
  sourceClaimEdgeKinds,
  sourceClaimStatuses,
  sourceDecisionEdgeConfidences,
  sourceDecisionTargetTypes,
  sourceRejectionReasons,
  sourceSupportTypes
} from "@krn/core";

import * as sourceSchema from "../sources.js";

describe("source graph schema", () => {
  it("keeps DB source enums aligned with the core source model", () => {
    expect(sourceSchema.sourceAuthorityLabel.enumValues).toEqual(sourceAuthorityLabels);
    expect(sourceSchema.sourceSupportType.enumValues).toEqual(sourceSupportTypes);
    expect(sourceSchema.sourceClaimStatus.enumValues).toEqual(sourceClaimStatuses);
    expect(sourceSchema.sourceClaimEdgeKind.enumValues).toEqual(sourceClaimEdgeKinds);
    expect(sourceSchema.sourceDecisionTargetType.enumValues).toEqual(sourceDecisionTargetTypes);
    expect(sourceSchema.sourceDecisionEdgeConfidence.enumValues).toEqual(sourceDecisionEdgeConfidences);
    expect(sourceSchema.sourceRejectionReason.enumValues).toEqual(sourceRejectionReasons);
    expect("sourceDecisionEdges" in sourceSchema).toBe(true);
    expect("sourceDecisionId" in sourceSchema.sourceDecisionEdges).toBe(true);
    expect("importId" in sourceSchema.sourceArtifacts).toBe(true);
    expect("importRowId" in sourceSchema.sourceArtifacts).toBe(true);
  });
});
