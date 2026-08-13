import type {
  AntiMemoryCandidate,
  MemoryCandidate
} from "@krn/core";
import type {
  PromoteAntiMemoryCandidateInput
} from "@krn/core/repositories/internal";
import { createHash } from "node:crypto";
import type { RecordMemoryFeedbackWithPacketBindingInput } from "@krn/core/repositories/internal";

export const packetFeedbackIdempotencyKey = (
  input: RecordMemoryFeedbackWithPacketBindingInput
): string => createHash("sha256")
  .update(`${input.runId}\0${input.packetChecksum}\0${input.memoryRecordId}\0${input.outcome}`)
  .digest("hex");

export const requirePacketFeedbackNote = (
  input: RecordMemoryFeedbackWithPacketBindingInput
): string | undefined => {
  const note = input.note?.trim();
  if ((input.outcome === "hurt" || input.outcome === "stale") && (note === undefined || note.length === 0)) {
    throw new Error(`packet-bound ${input.outcome} feedback requires a note`);
  }
  return note;
};

interface MemoryCoreInvariantInput {
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceLineage: readonly { sourceId: string }[];
  validFrom?: string;
  validUntil?: string;
}

interface AntiMemoryCandidateInvariantInput {
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  invalidatedBySourceClaimIds?: readonly string[];
  sourceLineage: readonly { sourceId: string }[];
  validFrom?: string;
  validUntil?: string;
}

const hasText = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

const assertHasText = (
  value: string | undefined,
  message: string
): void => {
  if (!hasText(value)) {
    throw new Error(message);
  }
};

const assertConfidence = (
  confidence: number,
  subject: string
): void => {
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    throw new Error(`${subject} confidence must be an integer from 0 to 100`);
  }
};

const sourceLineageIsPresent = (
  sourceLineage: readonly { sourceId: string }[]
): boolean => (
  sourceLineage.length > 0 &&
  sourceLineage.every((lineage) => hasText(lineage.sourceId))
);

const assertSourceLineage = (
  sourceLineage: readonly { sourceId: string }[],
  subject: string
): void => {
  if (!sourceLineageIsPresent(sourceLineage)) {
    throw new Error(`${subject} requires source lineage`);
  }
};

const timestampValue = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const assertTemporalWindow = (
  validFrom: string | undefined,
  validUntil: string | undefined,
  subject: string
): void => {
  if (validUntil === undefined) {
    return;
  }

  if (!hasText(validFrom)) {
    throw new Error(`${subject} with validUntil requires validFrom`);
  }

  const validFromTime = timestampValue(validFrom);
  const validUntilTime = timestampValue(validUntil);

  if (validFromTime !== undefined && validUntilTime !== undefined && validUntilTime <= validFromTime) {
    throw new Error(`${subject} validUntil must be after validFrom`);
  }
};

const assertMemoryTemporalStrategy = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  if (input.validUntil === undefined) {
    return;
  }

  if (!hasText(input.validFrom)) {
    throw new Error(`${subject} with validUntil requires validFrom`);
  }

  if (!hasText(input.invalidationRule)) {
    throw new Error(`${subject} with validUntil requires invalidation rule`);
  }

  assertTemporalWindow(input.validFrom, input.validUntil, subject);
};

const hasAntiMemoryInvalidationEvidence = (
  input: AntiMemoryCandidateInvariantInput
): boolean => (
  (input.invalidatedBySourceClaimIds?.filter(hasText).length ?? 0) > 0 ||
  sourceLineageIsPresent(input.sourceLineage)
);

export const assertMemoryCoreInvariants = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  assertHasText(input.summary, `${subject} requires summary`);
  assertHasText(input.body, `${subject} requires body`);
  assertHasText(input.owner, `${subject} requires owner`);
  assertConfidence(input.confidence, subject);
  assertHasText(input.applicationGuidance, `${subject} requires application guidance`);
  assertSourceLineage(input.sourceLineage, subject);
  assertMemoryTemporalStrategy(input, subject);
};

export const assertAntiMemoryCandidateInvariants = (
  input: AntiMemoryCandidateInvariantInput,
  subject: string
): void => {
  assertHasText(input.key, `${subject} requires key`);
  assertHasText(input.summary, `${subject} requires summary`);
  assertHasText(input.body, `${subject} requires body`);
  assertHasText(input.owner, `${subject} requires owner`);
  assertConfidence(input.confidence, subject);

  if (!hasAntiMemoryInvalidationEvidence(input)) {
    throw new Error(`${subject} requires invalidating source claim or source lineage`);
  }

  assertTemporalWindow(input.validFrom, input.validUntil, subject);
};

export const ensurePromotableMemoryCandidate = (candidate: MemoryCandidate): void => {
  if (candidate.status !== "proposed" && candidate.status !== "candidate") {
    throw new Error(
      `Memory candidate ${candidate.id} cannot be promoted from ${candidate.status}`
    );
  }

  if (candidate.sourceClaimIds.length === 0) {
    throw new Error(
      `Memory candidate ${candidate.id} requires at least one reviewed SourceClaim before promotion`
    );
  }

  assertMemoryCoreInvariants(candidate, `Memory candidate ${candidate.id}`);
};

export const memoryPromotionMetadata = (
  candidate: MemoryCandidate,
  input: { metadata?: Record<string, unknown> }
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  sourceClaimIds: candidate.sourceClaimIds
});

export const antiMemoryPromotionMetadata = (
  candidate: AntiMemoryCandidate,
  input: PromoteAntiMemoryCandidateInput
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  invalidatedBySourceClaimIds: candidate.invalidatedBySourceClaimIds
});

export const memorySelectionDate = (value: string | undefined): Date | undefined => {
  const timestamp = value === undefined ? Date.now() : Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
};

// fallow-ignore-next-line code-duplication -- memory and source repositories retain distinct dialect-neutral selection policy owners
export const normalizedMemorySelectionTerms = (
  terms: readonly string[] | undefined
): string[] => [
  ...new Set((terms ?? [])
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 0))
];
