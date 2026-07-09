import { describe, expect, it } from "vitest";

import {
  sourceClaimAuthorityExclusion
} from "../source-claim-authority.js";

describe("source claim authority guard", () => {
  it("does not activate source authority evidence gaps", () => {
    expect(sourceClaimAuthorityExclusion({
      subjectType: "source_claim",
      sourceClaimStatus: "accepted",
      sourceClaimAuthorityStatus: "accepted",
      sourceClaimAuthorityReasons: ["current_decision_linked_authority"]
    })).toBeUndefined();
    expect(sourceClaimAuthorityExclusion({
      subjectType: "source_claim",
      sourceClaimStatus: "accepted",
      sourceClaimAuthorityStatus: "caveated",
      sourceClaimAuthorityReasons: ["accepted_with_dissenting_source_claims"]
    })).toBeUndefined();

    expect(sourceClaimAuthorityExclusion({
      subjectType: "source_claim",
      sourceClaimStatus: "accepted",
      sourceClaimAuthorityStatus: "evidence_gap",
      sourceClaimAuthorityReasons: ["missing_source_decision_support"]
    })).toEqual({
      reason: "unsafe",
      explanation:
        "SourceClaim authority state unsupported: missing_source_decision_support."
    });

    expect(sourceClaimAuthorityExclusion({
      subjectType: "source_claim",
      sourceClaimStatus: "accepted",
      sourceClaimAuthorityStatus: "blocked",
      sourceClaimAuthorityReasons: ["invalid_time"]
    })).toEqual({
      reason: "unsafe",
      explanation: "SourceClaim authority state unknown: invalid_time."
    });
  });
});
