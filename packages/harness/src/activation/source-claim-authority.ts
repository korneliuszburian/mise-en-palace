import type {
  ContextSubjectType,
  SourceClaimStatus
} from "@krn/core";

import type {
  ActivationExclusion
} from "./types.js";

export interface SourceClaimAuthorityCandidate {
  subjectType: ContextSubjectType;
  sourceClaimStatus?: SourceClaimStatus;
}

export const sourceClaimAuthorityExclusion = (
  candidate: SourceClaimAuthorityCandidate
): ActivationExclusion | undefined => {
  if (candidate.subjectType !== "source_claim") {
    return undefined;
  }

  if (candidate.sourceClaimStatus === "accepted") {
    return undefined;
  }

  return {
    reason: "unsafe",
    explanation:
      `Source claims require accepted status before activation; ${candidate.sourceClaimStatus ?? "unknown"} claims remain review candidates, not implementation authority.`
  };
};
