import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceRecord
} from "@krn/core";

export type PairedLiveEvalEvidenceFilters = Pick<
  ListPairedLiveEvalEvidenceInput,
  "runId" | "scenario" | "outcome" | "usefulnessOutcome"
>;

export type PairedLiveEvalEvidenceReadbackCandidate =
  PairedLiveEvalEvidenceRecord & {
    readonly allEvidenceRefs: readonly string[];
  };

export interface PairedLiveEvalEvidenceReadback {
  readonly kind: "krn.pairedLiveEvalEvidenceReadback.v1";
  readonly access: "read_only";
  readonly mutation: "none";
  readonly projectId: string;
  readonly storeScope: "paired_live_eval_evidence";
  readonly storedCandidateCount: number;
  readonly returnedCandidateCount: number;
  readonly filters: PairedLiveEvalEvidenceFilters;
  readonly candidates: readonly PairedLiveEvalEvidenceReadbackCandidate[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const unique = (values: readonly string[]): readonly string[] =>
  Array.from(new Set(values));

const readbackCandidateFor = (
  record: PairedLiveEvalEvidenceRecord
): PairedLiveEvalEvidenceReadbackCandidate => ({
  ...record,
  allEvidenceRefs: unique([
    ...record.sourceEvidence,
    ...record.evidenceRefs,
    record.packetEvidenceRef,
    record.artifactRef,
    record.manifestRef,
    record.checkerEvidenceRef,
    record.environmentEvidenceRef
  ])
});

const matchesFilters = (
  candidate: PairedLiveEvalEvidenceReadbackCandidate,
  filters: PairedLiveEvalEvidenceFilters
): boolean => (
  (filters.runId === undefined || candidate.runId === filters.runId) &&
  (filters.scenario === undefined || candidate.scenario === filters.scenario) &&
  (filters.outcome === undefined || candidate.outcome === filters.outcome) &&
  (
    filters.usefulnessOutcome === undefined ||
    candidate.usefulnessOutcome === filters.usefulnessOutcome
  )
);

export const buildPairedLiveEvalEvidenceReadback = (input: {
  readonly projectId: string;
  readonly records: readonly PairedLiveEvalEvidenceRecord[];
  readonly filters?: PairedLiveEvalEvidenceFilters;
}): PairedLiveEvalEvidenceReadback => {
  const filters = input.filters ?? {};
  const projectCandidates = input.records
    .filter((record) => record.projectId === input.projectId)
    .map(readbackCandidateFor);
  const returnedCandidates = projectCandidates.filter((candidate) =>
    matchesFilters(candidate, filters)
  );

  return {
    kind: "krn.pairedLiveEvalEvidenceReadback.v1",
    access: "read_only",
    mutation: "none",
    projectId: input.projectId,
    storeScope: "paired_live_eval_evidence",
    storedCandidateCount: projectCandidates.length,
    returnedCandidateCount: returnedCandidates.length,
    filters,
    candidates: returnedCandidates,
    proof: {
      proves: [
        "paired-live eval evidence was read from durable paired_live_eval_evidence rows for the selected project identity",
        "exact packet, artifact, manifest, checker, and environment evidence refs are first-class readback fields",
        "readback does not read .local-lab artifacts and does not require live retained project, run, feedback, MemoryRecord, or SourceClaim rows"
      ],
      doesNotProve: [
        "the paired-live trial caused a better target repair, arbitrary-repository portability, or product readiness",
        "promotion of an EvalCandidate into MemoryRecord, SourceClaim, or SourceDecision authority",
        "that retained fixture cleanup was guarded before deleting disposable rows"
      ]
    }
  };
};

export const renderPairedLiveEvalEvidenceReadbackText = (
  readback: PairedLiveEvalEvidenceReadback
): string => [
  "Paired-live eval evidence:",
  `- projectId: ${readback.projectId}`,
  `- storeScope: ${readback.storeScope}`,
  `- storedCandidates: ${readback.storedCandidateCount}`,
  `- returnedCandidates: ${readback.returnedCandidateCount}`,
  ...(
    readback.candidates.length === 0
      ? ["- candidates: none"]
      : readback.candidates.flatMap((candidate) => [
          `- ${candidate.candidateId}`,
          `  runId: ${candidate.runId}`,
          `  feedbackDeltaId: ${candidate.feedbackDeltaId ?? "unknown"}`,
          `  scenario: ${candidate.scenario}`,
          `  family: ${candidate.family}`,
          `  artifactStatus: ${candidate.artifactStatus}`,
          `  outcome: ${candidate.outcome}`,
          `  usefulnessOutcome: ${candidate.usefulnessOutcome}`,
          `  checkerRevision: ${candidate.checkerRevision}`,
          `  packetRef: ${candidate.packetEvidenceRef}`,
          `  artifactRef: ${candidate.artifactRef}`,
          `  manifestRef: ${candidate.manifestRef}`,
          `  environmentRef: ${candidate.environmentEvidenceRef}`
        ])
  ),
  "Proof:",
  ...readback.proof.proves.map((proof) => `- proves: ${proof}`),
  ...readback.proof.doesNotProve.map((nonProof) => `- doesNotProve: ${nonProof}`)
].join("\n");
