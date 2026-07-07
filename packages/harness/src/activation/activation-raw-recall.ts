import type {
  ContextAssembly,
  SourceAuthorityLabel
} from "@krn/core";

import type {
  ActivationCandidateKind,
  RankedActivationCandidate
} from "./types.js";

export type ActivationRawRecallReason = "exact_proof_required" | "low_trust";

export interface ActivationRawRecallTrigger {
  subjectType: RankedActivationCandidate["subjectType"];
  subjectId: string;
  candidateId: string;
  reasons: readonly ActivationRawRecallReason[];
  sourceAuthority: SourceAuthorityLabel;
  evidenceHints: readonly string[];
}

export interface BuildActivationRawRecallTriggersInput {
  candidates: readonly RankedActivationCandidate[];
  contextAssembly: ContextAssembly;
  requireExactProof?: boolean;
  lowSourceAuthorities?: readonly SourceAuthorityLabel[];
  exactProofKinds?: readonly ActivationCandidateKind[];
}

const candidateKey = (subject: { subjectType: string; subjectId: string }): string =>
  `${subject.subjectType}:${subject.subjectId}`;

const evidenceHintsFor = (candidate: RankedActivationCandidate): string[] => [
  candidateKey(candidate),
  ...[
    candidate.sourceClaimId,
    candidate.memoryRecordId,
    candidate.searchDocumentId
  ].filter((value): value is string => value !== undefined),
  ...(candidate.searchDocumentIds ?? [])
];

export const buildActivationRawRecallTriggers = (
  input: BuildActivationRawRecallTriggersInput
): ActivationRawRecallTrigger[] => {
  const includedKeys = new Set(input.contextAssembly.inclusions.map(candidateKey));
  const lowSourceAuthorities = new Set(input.lowSourceAuthorities ?? ["low"]);
  const exactProofKinds = new Set(input.exactProofKinds ?? ["source", "search"]);

  return input.candidates.flatMap((candidate) => {
    if (!includedKeys.has(candidateKey(candidate))) {
      return [];
    }

    const reasons: ActivationRawRecallReason[] = [];

    if (input.requireExactProof === true && exactProofKinds.has(candidate.kind)) {
      reasons.push("exact_proof_required");
    }

    if (lowSourceAuthorities.has(candidate.sourceAuthority)) {
      reasons.push("low_trust");
    }

    if (reasons.length === 0) {
      return [];
    }

    return [{
      subjectType: candidate.subjectType,
      subjectId: candidate.subjectId,
      candidateId: candidate.id,
      reasons,
      sourceAuthority: candidate.sourceAuthority,
      evidenceHints: evidenceHintsFor(candidate)
    }];
  });
};
