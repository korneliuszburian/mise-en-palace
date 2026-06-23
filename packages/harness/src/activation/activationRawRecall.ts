import type {
  ContextAssembly,
  SourceTrustTier
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
  trustTier: SourceTrustTier;
  evidenceHints: readonly string[];
}

export interface BuildActivationRawRecallTriggersInput {
  candidates: readonly RankedActivationCandidate[];
  contextAssembly: ContextAssembly;
  requireExactProof?: boolean;
  lowTrustTiers?: readonly SourceTrustTier[];
  exactProofKinds?: readonly ActivationCandidateKind[];
}

const candidateKey = (subject: { subjectType: string; subjectId: string }): string =>
  `${subject.subjectType}:${subject.subjectId}`;

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const metadataStringList = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
};

const evidenceHintsFor = (candidate: RankedActivationCandidate): string[] => [
  candidateKey(candidate),
  ...[
    metadataString(candidate.metadata, "sourceClaimId"),
    metadataString(candidate.metadata, "memoryRecordId"),
    metadataString(candidate.metadata, "searchDocumentId")
  ].filter((value): value is string => value !== undefined),
  ...metadataStringList(candidate.metadata, "searchDocumentIds")
];

export const buildActivationRawRecallTriggers = (
  input: BuildActivationRawRecallTriggersInput
): ActivationRawRecallTrigger[] => {
  const includedKeys = new Set(input.contextAssembly.inclusions.map(candidateKey));
  const lowTrustTiers = new Set(input.lowTrustTiers ?? ["low"]);
  const exactProofKinds = new Set(input.exactProofKinds ?? ["source", "search"]);

  return input.candidates.flatMap((candidate) => {
    if (!includedKeys.has(candidateKey(candidate))) {
      return [];
    }

    const reasons: ActivationRawRecallReason[] = [];

    if (input.requireExactProof === true && exactProofKinds.has(candidate.kind)) {
      reasons.push("exact_proof_required");
    }

    if (lowTrustTiers.has(candidate.trustTier)) {
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
      trustTier: candidate.trustTier,
      evidenceHints: evidenceHintsFor(candidate)
    }];
  });
};
