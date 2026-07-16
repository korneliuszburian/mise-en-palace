import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";

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

  it("owns the converged source authority constraints", () => {
    const claimConfig = getTableConfig(sourceSchema.sourceClaims);
    const decisionConfig = getTableConfig(sourceSchema.sourceDecisions);
    const edgeConfig = getTableConfig(sourceSchema.sourceDecisionEdges);

    expect(sourceSchema.sourceDecisionEdges.sourceDecisionId.notNull).toBe(true);
    expect(claimConfig.foreignKeys.map((key) => key.getName())).toContain(
      "source_claims_chunk_artifact_fk"
    );
    expect(decisionConfig.uniqueConstraints.map((constraint) => constraint.getName())).toContain(
      "source_decisions_id_claim_unique"
    );
    expect(edgeConfig.foreignKeys.map((key) => key.getName())).toContain(
      "source_decision_edges_decision_claim_fk"
    );
    expect(edgeConfig.indexes.map((index) => index.config.name)).toContain(
      "source_decision_edges_identity_unique"
    );
  });
});
