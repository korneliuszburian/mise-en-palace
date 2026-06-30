import type {
  ReflectionCandidateEvidence,
  SourceClaim
} from "@krn/core";
import type {
  SourceRepository
} from "../repositories/sourceRepository.js";

interface CandidateWithMetadata {
  metadata: Record<string, unknown>;
}

interface ReviewGateIdentityInput {
  candidateId: string;
  reviewer: string;
  evidenceReviewedRef: string;
}

export interface ReviewGateIdentity {
  candidateId: string;
  reviewer: string;
}

const candidateEvidenceProvenances = new Set<ReflectionCandidateEvidence["provenance"]>([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log",
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note",
  "source_claim"
]);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const stringListOrEmpty = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
);

const isCandidateEvidenceProvenance = (
  value: string
): value is ReflectionCandidateEvidence["provenance"] =>
  candidateEvidenceProvenances.has(value as ReflectionCandidateEvidence["provenance"]);

export const requireReviewGateTrimmed = (value: string, field: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
};

export const readReviewGateIdentity = (
  input: ReviewGateIdentityInput
): ReviewGateIdentity => {
  const candidateId = requireReviewGateTrimmed(input.candidateId, "candidateId");
  const reviewer = requireReviewGateTrimmed(input.reviewer, "reviewer");
  requireReviewGateTrimmed(input.evidenceReviewedRef, "evidenceReviewedRef");

  return {
    candidateId,
    reviewer
  };
};

export const candidateEvidence = (
  candidate: CandidateWithMetadata
): ReflectionCandidateEvidence | undefined => {
  const value = candidate.metadata["reflectionCandidateEvidence"];

  if (!isRecord(value)) {
    return undefined;
  }

  const provenance = typeof value.provenance === "string" ? value.provenance.trim() : "";
  const doesNotProve = typeof value.doesNotProve === "string" ? value.doesNotProve.trim() : "";

  if (
    provenance.length === 0 ||
    !isCandidateEvidenceProvenance(provenance) ||
    doesNotProve.length === 0
  ) {
    return undefined;
  }

  return {
    provenance,
    evidenceRefs: stringListOrEmpty(value.evidenceRefs),
    doesNotProve
  };
};

export const assertReviewableCandidateEvidence = (
  candidateLabel: string,
  evidence: ReflectionCandidateEvidence | undefined
): void => {
  if (evidence === undefined) {
    throw new Error(`${candidateLabel} requires candidate evidence provenance before promotion`);
  }

  if (evidence.evidenceRefs.length === 0) {
    throw new Error(`${candidateLabel} requires candidate evidence refs before promotion`);
  }

  if (evidence.provenance === "default_template") {
    throw new Error(`${candidateLabel} cannot be promoted from weak default-template evidence`);
  }
};

export const assertReviewGateConfidence = (
  candidateLabel: string,
  confidence: number
): void => {
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    throw new Error(`${candidateLabel} confidence must be an integer between 0 and 100`);
  }
};

export const reviewedSourceClaims = async (
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">,
  sourceClaimIds: readonly string[]
): Promise<SourceClaim[]> => {
  const sourceClaims: SourceClaim[] = [];

  for (const sourceClaimId of sourceClaimIds) {
    const sourceClaim = await sourceRepository.getSourceClaimById(sourceClaimId);

    if (sourceClaim === undefined) {
      throw new Error(`SourceClaim not found: ${sourceClaimId}`);
    }

    sourceClaims.push(sourceClaim);
  }

  return sourceClaims;
};
