import {
  assessCandidateReviewability,
  extractLocalSourceCandidates,
  parseSearchDocumentInput,
  parseSourceClaimInput
} from "@krn/core";
import type {
  ExtractionCandidatePreview,
  ExtractionClaimCandidate,
  SourceArtifactPreviewChunk,
  SourceClaimEdgeKind
} from "@krn/core";

export interface SourceArtifactPreviewViewCommand {
  claim?: string;
  mechanism?: string;
  krnImplication?: string;
  doesNotProve?: string;
  supportType?: string;
  sourceAuthority?: string;
  consumer?: string;
  falsifier?: string;
  reviewedExtractionClaimCandidateId?: string;
  extractCandidates?: boolean;
  graphEdgeToSourceClaimId?: string;
  graphEdgeKind?: SourceClaimEdgeKind;
  graphEdgeConsumer?: string;
  graphEdgeDoesNotProve?: string;
  graphEdgeEvidenceRef?: string;
  graphEdgeSourceDecisionRef?: string;
  graphEdgeScope?: string;
  graphEdgeValidFrom?: string;
  graphEdgeValidUntil?: string;
  graphEdgeInvalidatedAt?: string;
}

interface CandidateField {
  name: keyof Pick<
    SourceArtifactPreviewViewCommand,
    | "claim"
    | "mechanism"
    | "krnImplication"
    | "doesNotProve"
    | "supportType"
    | "sourceAuthority"
    | "consumer"
    | "falsifier"
  >;
  label: string;
}

interface GraphEdgeCandidateField {
  name: keyof Pick<
    SourceArtifactPreviewViewCommand,
    | "graphEdgeToSourceClaimId"
    | "graphEdgeKind"
    | "graphEdgeConsumer"
    | "graphEdgeDoesNotProve"
  >;
  label: string;
}

export interface CompleteGraphEdgeCommandInput {
  toSourceClaimId: string;
  kind: SourceClaimEdgeKind;
  consumer: string;
  doesNotProve: string;
  evidenceRef?: string;
  sourceDecisionRef?: string;
  scope?: string;
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
}

export interface ReviewedExtractionClaimSelection {
  candidate: ExtractionClaimCandidate;
}

export interface SourceArtifactPreviewPersistenceFlags {
  searchDocumentPersisted: boolean;
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
}

const sourceClaimCandidateFields: readonly CandidateField[] = [
  { name: "claim", label: "--claim" },
  { name: "mechanism", label: "--mechanism" },
  { name: "krnImplication", label: "--krn-implication" },
  { name: "doesNotProve", label: "--does-not-prove" },
  { name: "supportType", label: "--support-type" },
  { name: "sourceAuthority", label: "--source-authority" },
  { name: "consumer", label: "--consumer" },
  { name: "falsifier", label: "--falsifier" }
] as const;
const reviewedExtractionClaimCandidateFields: readonly CandidateField[] =
  sourceClaimCandidateFields.filter((field) => field.name !== "claim");

const graphEdgeCandidateFields: readonly GraphEdgeCandidateField[] = [
  { name: "graphEdgeToSourceClaimId", label: "--graph-edge-to-source-claim-id" },
  { name: "graphEdgeKind", label: "--graph-edge-kind" },
  { name: "graphEdgeConsumer", label: "--graph-edge-consumer" },
  { name: "graphEdgeDoesNotProve", label: "--graph-edge-does-not-prove" }
] as const;

const searchDocumentCandidateDoesNotProve =
  "This SearchDocument candidate does not prove source truth, claim correctness, DB persistence, embeddings, graph retrieval, or crawler readiness.";
const sourceClaimCandidateDoesNotProve =
  "This SourceClaim candidate does not prove the claim is true or should be accepted without review.";
const extractionCandidateDoesNotProve =
  "These deterministic extraction candidates do not prove entity identity, claim truth, relation correctness, graph retrieval quality, extraction quality, crawler readiness, or Memory Core mutation.";

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const formatReviewabilityReasons = (reasons: readonly string[]): string[] => [
  "  reviewability reasons:",
  ...reasons.map((reason) => `  - ${reason}`)
];

export const formatChunks = (chunks: readonly SourceArtifactPreviewChunk[]): string[] =>
  chunks.flatMap((chunk) => [
    `- chunk ${chunk.ordinal}`,
    `  sourceRange: lines ${chunk.startLine}-${chunk.endLine}`,
    `  contentHash: ${chunk.contentHash}`,
    `  preview: ${chunk.preview.replace(/\n/gu, "\\n")}`
  ]);

const sourceArtifactPreviewChunkBody = (chunks: readonly SourceArtifactPreviewChunk[]): string =>
  chunks.map((chunk) =>
    [
      `chunk ${chunk.ordinal}`,
      `sourceRange: lines ${chunk.startLine}-${chunk.endLine}`,
      `contentHash: ${chunk.contentHash}`,
      `preview: ${chunk.preview}`
    ].join("\n")
  ).join("\n\n");

const searchDocumentCandidateView = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceAuthority: string
) => {
  const candidate = parseSearchDocumentInput({
    subjectType: "source_artifact",
    subjectId: artifactHash,
    sourceAuthority,
    language: "english",
    title: `Local source artifact: ${file}`,
    body: sourceArtifactPreviewChunkBody(chunks),
    metadataFilters: {
      source: "local_source_artifact_preview"
    },
    metadata: {
      file,
      contentHash: artifactHash,
      chunkCount: chunks.length,
      source: "krn source artifact preview"
    }
  });
  const reviewability = assessCandidateReviewability({
    summary: candidate.title,
    body: candidate.body,
    evidenceRefs: [
      file,
      artifactHash,
      ...chunks.map((chunk) => chunk.contentHash)
    ],
    applicationGuidance: "Use as a reviewable lexical/search document candidate for local source artifact ingestion.",
    doesNotProve: searchDocumentCandidateDoesNotProve
  });

  return {
    id: `search-document-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    candidate,
    reviewability,
    evidenceRefs: [
      file,
      artifactHash
    ],
    doesNotProve: searchDocumentCandidateDoesNotProve
  };
};

const formatSearchDocumentCandidate = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean,
  sourceAuthority: string
): string[] => {
  const view = searchDocumentCandidateView(file, artifactHash, chunks, sourceAuthority);

  return [
    "searchDocumentCandidate:",
    `- id: ${view.id}`,
    "  status: candidate",
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  subjectType: ${view.candidate.subjectType}`,
    `  subjectId: ${view.candidate.subjectId}`,
    `  sourceAuthority: ${view.candidate.sourceAuthority}`,
    `  title: ${view.candidate.title}`,
    `  evidenceRefs: ${view.evidenceRefs.join(", ")}`,
    `  doesNotProve: ${view.doesNotProve}`,
    persisted
      ? "  SearchDocument row created: see Persistence readback"
      : "  No SearchDocument row created"
  ];
};

const missingSourceClaimCandidateFields = (
  command: SourceArtifactPreviewViewCommand
): string[] =>
  sourceClaimCandidateFields
    .filter((field) => !hasText(command[field.name]))
    .map((field) => field.label);

export const missingReviewedExtractionClaimCandidateFields = (
  command: SourceArtifactPreviewViewCommand
): string[] =>
  reviewedExtractionClaimCandidateFields
    .filter((field) => !hasText(command[field.name]))
    .map((field) => field.label);

const hasAnyManualSourceClaimCandidateField = (
  command: SourceArtifactPreviewViewCommand
): boolean =>
  sourceClaimCandidateFields.some((field) => hasText(command[field.name]));

const hasReviewedExtractionClaimCandidate = (
  command: SourceArtifactPreviewViewCommand
): command is SourceArtifactPreviewViewCommand & { reviewedExtractionClaimCandidateId: string } =>
  hasText(command.reviewedExtractionClaimCandidateId);

export const selectReviewedExtractionClaimCandidate = (
  command: SourceArtifactPreviewViewCommand,
  extraction: ExtractionCandidatePreview
): ReviewedExtractionClaimSelection | undefined => {
  if (!hasReviewedExtractionClaimCandidate(command)) {
    return undefined;
  }

  const readyCandidate = extraction.claims.find((claim) =>
    claim.id === command.reviewedExtractionClaimCandidateId
  );

  if (readyCandidate !== undefined) {
    return {
      candidate: readyCandidate
    };
  }

  const deferredCandidate = extraction.deferredClaims.find((claim) =>
    claim.id === command.reviewedExtractionClaimCandidateId
  );

  if (deferredCandidate !== undefined) {
    throw new Error(
      `Cannot persist deferred extraction claim candidate: ${command.reviewedExtractionClaimCandidateId}`
    );
  }

  throw new Error(
    `Reviewed extraction claim candidate not found: ${command.reviewedExtractionClaimCandidateId}`
  );
};

export const hasCompleteSourceClaimCandidate = (
  command: SourceArtifactPreviewViewCommand,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): boolean =>
  (
    hasAnyManualSourceClaimCandidateField(command) &&
    missingSourceClaimCandidateFields(command).length === 0
  ) ||
  (
    reviewedExtractionClaimSelection !== undefined &&
    missingReviewedExtractionClaimCandidateFields(command).length === 0
  );

const missingGraphEdgeCandidateFields = (
  command: SourceArtifactPreviewViewCommand
): string[] =>
  graphEdgeCandidateFields
    .filter((field) => !hasText(command[field.name]))
    .map((field) => field.label);

const hasAnyGraphEdgeCandidateField = (
  command: SourceArtifactPreviewViewCommand
): boolean =>
  graphEdgeCandidateFields.some((field) => hasText(command[field.name]));

const missingSourceClaimFieldsForGraphEdge = (
  command: SourceArtifactPreviewViewCommand
): string[] =>
  hasReviewedExtractionClaimCandidate(command)
    ? missingReviewedExtractionClaimCandidateFields(command).map((field) =>
        `${field} for reviewed extraction claim`
      )
    : missingSourceClaimCandidateFields(command).map((field) =>
        `${field} for edge source claim`
      );

const addOptionalGraphEdgeInputFields = (
  input: CompleteGraphEdgeCommandInput,
  command: SourceArtifactPreviewViewCommand
): void => {
  if (command.graphEdgeEvidenceRef !== undefined) {
    input.evidenceRef = command.graphEdgeEvidenceRef;
  }

  if (command.graphEdgeSourceDecisionRef !== undefined) {
    input.sourceDecisionRef = command.graphEdgeSourceDecisionRef;
  }

  if (command.graphEdgeScope !== undefined) {
    input.scope = command.graphEdgeScope;
  }

  if (command.graphEdgeValidFrom !== undefined) {
    input.validFrom = command.graphEdgeValidFrom;
  }

  if (command.graphEdgeValidUntil !== undefined) {
    input.validUntil = command.graphEdgeValidUntil;
  }

  if (command.graphEdgeInvalidatedAt !== undefined) {
    input.invalidatedAt = command.graphEdgeInvalidatedAt;
  }
};

export const completeGraphEdgeInput = (
  command: SourceArtifactPreviewViewCommand
): CompleteGraphEdgeCommandInput | undefined => {
  const toSourceClaimId = command.graphEdgeToSourceClaimId;
  const kind = command.graphEdgeKind;
  const consumer = command.graphEdgeConsumer;
  const doesNotProve = command.graphEdgeDoesNotProve;

  if (
    !hasText(toSourceClaimId) ||
    kind === undefined ||
    !hasText(consumer) ||
    !hasText(doesNotProve)
  ) {
    return undefined;
  }

  const input: CompleteGraphEdgeCommandInput = {
    toSourceClaimId,
    kind,
    consumer,
    doesNotProve
  };

  addOptionalGraphEdgeInputFields(input, command);

  return input;
};

const generatedGraphEvidenceRefs = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): string[] => [
  file,
  artifactHash,
  ...chunks.map((chunk) => `${file}:lines ${chunk.startLine}-${chunk.endLine}`),
  ...chunks.map((chunk) => chunk.contentHash)
];

const sourceClaimCandidateEvidenceRefs = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
): string[] => [
  file,
  artifactHash,
  ...chunks.map((chunk) => chunk.contentHash)
];

const sourceClaimCandidateMissingFields = (
  command: SourceArtifactPreviewViewCommand,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): string[] =>
  reviewedExtractionClaimSelection === undefined
    ? missingSourceClaimCandidateFields(command)
    : missingReviewedExtractionClaimCandidateFields(command);

const incompleteSourceClaimCandidateView = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}) => {
  const reviewability = assessCandidateReviewability({
    summary: input.reviewedExtractionClaimSelection?.candidate.text ??
      input.command.claim ??
      "SourceClaim candidate from local source artifact preview.",
    ...(hasText(input.command.mechanism)
      ? { body: input.command.mechanism }
      : {}),
    evidenceRefs: sourceClaimCandidateEvidenceRefs(input.file, input.artifactHash, input.chunks),
    ...(hasText(input.command.falsifier)
      ? { applicationGuidance: input.command.falsifier }
      : {}),
    ...(hasText(input.command.doesNotProve)
      ? { doesNotProve: input.command.doesNotProve }
      : {}),
    missingFields: input.missingFields
  });

  return {
    id: "source-claim-candidate:incomplete",
    status: "incomplete" as const,
    reviewability,
    missingFields: input.missingFields,
    persisted: false
  };
};

const parseOutputSourceClaimCandidate = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}) =>
  parseSourceClaimInput({
    claim: input.reviewedExtractionClaimSelection?.candidate.text ?? input.command.claim,
    mechanism: input.command.mechanism,
    krnImplication: input.command.krnImplication,
    doesNotProve: input.command.doesNotProve,
    supportType: input.command.supportType,
    sourceAuthority: input.command.sourceAuthority,
    consumer: input.command.consumer,
    falsifier: input.command.falsifier,
    metadata: {
      file: input.file,
      contentHash: input.artifactHash,
      chunkHashes: input.chunks.map((chunk) => chunk.contentHash),
      ...(input.reviewedExtractionClaimSelection === undefined
        ? {}
        : {
            extractionCandidateId: input.reviewedExtractionClaimSelection.candidate.id,
            extractionCandidateSourceRange: input.reviewedExtractionClaimSelection.candidate.sourceRange,
            reviewedExtractionBridge: true
          }),
      source: "krn source artifact preview"
    }
  });

const outputSourceClaimCandidateId = (
  artifactHash: string,
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined
): string =>
  reviewedExtractionClaimSelection === undefined
    ? `source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`
    : reviewedExtractionClaimSelection.candidate.id;

const completeSourceClaimCandidateView = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  persisted: boolean;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}) => {
  const candidate = parseOutputSourceClaimCandidate(input);
  const reviewability = assessCandidateReviewability({
    summary: candidate.claim,
    body: candidate.mechanism,
    evidenceRefs: sourceClaimCandidateEvidenceRefs(input.file, input.artifactHash, input.chunks),
    applicationGuidance: candidate.falsifier,
    doesNotProve: sourceClaimCandidateDoesNotProve
  });

  return {
    id: outputSourceClaimCandidateId(input.artifactHash, input.reviewedExtractionClaimSelection),
    status: candidate.status,
    reviewedExtractionClaimSelection: input.reviewedExtractionClaimSelection,
    reviewability,
    claim: candidate.claim,
    mechanism: candidate.mechanism,
    consumer: candidate.consumer,
    falsifier: candidate.falsifier,
    evidenceRefs: [
      input.file,
      input.artifactHash
    ],
    doesNotProve: sourceClaimCandidateDoesNotProve,
    persisted: input.persisted
  };
};

const formatNoSourceClaimCandidate = (): string[] => [
  "sourceClaimCandidate:",
  "- not generated",
  "  reason: explicit claim/mechanism/consumer/falsifier inputs were not supplied",
  "  No SourceClaim created"
];

const formatIncompleteSourceClaimCandidate = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): string[] => {
  const view = incompleteSourceClaimCandidateView(input);

  return [
    "sourceClaimCandidate:",
    `- id: ${view.id}`,
    `  status: ${view.status}`,
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  missing: ${view.missingFields.join(", ")}`,
    "  No SourceClaim created"
  ];
};

const formatCompleteSourceClaimCandidate = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  persisted: boolean;
  reviewedExtractionClaimSelection: ReviewedExtractionClaimSelection | undefined;
}): string[] => {
  const view = completeSourceClaimCandidateView(input);

  return [
    "sourceClaimCandidate:",
    `- id: ${view.id}`,
    `  status: ${view.status}`,
    ...(view.reviewedExtractionClaimSelection === undefined
      ? []
      : [
          "  source: reviewed_extraction_claim_candidate",
          `  extractionSourceRange: ${view.reviewedExtractionClaimSelection.candidate.sourceRange}`
        ]),
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  claim: ${view.claim}`,
    `  mechanism: ${view.mechanism}`,
    `  consumer: ${view.consumer}`,
    `  falsifier: ${view.falsifier}`,
    `  evidenceRefs: ${view.evidenceRefs.join(", ")}`,
    `  doesNotProve: ${view.doesNotProve}`,
    view.persisted
      ? "  SourceClaim row created: see Persistence readback"
      : "  No SourceClaim created"
  ];
};

const formatSourceClaimCandidate = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): string[] => {
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(
    command,
    extractLocalSourceCandidates(chunks)
  );

  if (!hasAnyManualSourceClaimCandidateField(command) && reviewedExtractionClaimSelection === undefined) {
    return formatNoSourceClaimCandidate();
  }

  const missingFields = sourceClaimCandidateMissingFields(command, reviewedExtractionClaimSelection);

  if (missingFields.length > 0) {
    return formatIncompleteSourceClaimCandidate({
      command,
      file,
      artifactHash,
      chunks,
      missingFields,
      reviewedExtractionClaimSelection
    });
  }

  return formatCompleteSourceClaimCandidate({
    command,
    file,
    artifactHash,
    chunks,
    persisted,
    reviewedExtractionClaimSelection
  });
};

const formatNoSourceClaimEdgeCandidate = (): string[] => [
  "sourceClaimEdgeCandidate:",
  "- not generated",
  "  reason: explicit graph edge inputs were not supplied",
  "  No SourceClaimEdge created"
];

const sourceClaimEdgeMissingFields = (
  command: SourceArtifactPreviewViewCommand
): string[] => [
  ...missingGraphEdgeCandidateFields(command),
  ...missingSourceClaimFieldsForGraphEdge(command)
];

const formatIncompleteSourceClaimEdgeCandidate = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  missingFields: readonly string[];
}): string[] => {
  const reviewability = assessCandidateReviewability({
    summary: input.command.graphEdgeKind === undefined
      ? "SourceClaimEdge candidate from local source artifact preview."
      : `SourceClaimEdge ${input.command.graphEdgeKind} candidate from local source artifact preview.`,
    evidenceRefs: generatedGraphEvidenceRefs(input.file, input.artifactHash, input.chunks),
    ...(hasText(input.command.graphEdgeConsumer)
      ? { applicationGuidance: input.command.graphEdgeConsumer }
      : {}),
    ...(hasText(input.command.graphEdgeDoesNotProve)
      ? { doesNotProve: input.command.graphEdgeDoesNotProve }
      : {}),
    missingFields: input.missingFields
  });

  return [
    "sourceClaimEdgeCandidate:",
    "- id: source-claim-edge-candidate:incomplete",
    "  status: incomplete",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  missing: ${input.missingFields.join(", ")}`,
    "  No SourceClaimEdge created"
  ];
};

const formatUnknownSourceClaimEdgeCandidate = (): string[] => [
  "sourceClaimEdgeCandidate:",
  "- id: source-claim-edge-candidate:incomplete",
  "  status: incomplete",
  "  reviewability: unknown",
  "  reviewability reasons:",
  "  - Graph edge input could not be narrowed after missing-field checks.",
  "  No SourceClaimEdge created"
];

const sourceClaimEdgeSourceLabel = (
  command: SourceArtifactPreviewViewCommand,
  artifactHash: string
): string =>
  hasReviewedExtractionClaimCandidate(command)
    ? command.reviewedExtractionClaimCandidateId
    : `source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`;

const formatCompleteSourceClaimEdgeCandidate = (input: {
  command: SourceArtifactPreviewViewCommand;
  file: string;
  artifactHash: string;
  chunks: readonly SourceArtifactPreviewChunk[];
  sourceClaimPersisted: boolean;
  sourceClaimEdgePersisted: boolean;
  graphEdgeInput: CompleteGraphEdgeCommandInput;
}): string[] => {
  const reviewability = assessCandidateReviewability({
    summary: `SourceClaimEdge ${input.graphEdgeInput.kind} -> ${input.graphEdgeInput.toSourceClaimId}`,
    body: [
      `from: source-claim-candidate:${input.artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
      `to: ${input.graphEdgeInput.toSourceClaimId}`,
      `kind: ${input.graphEdgeInput.kind}`,
      ...(input.graphEdgeInput.scope === undefined ? [] : [`scope: ${input.graphEdgeInput.scope}`])
    ].join("\n"),
    evidenceRefs: [
      ...generatedGraphEvidenceRefs(input.file, input.artifactHash, input.chunks),
      ...(input.graphEdgeInput.evidenceRef === undefined ? [] : [input.graphEdgeInput.evidenceRef])
    ],
    applicationGuidance: input.graphEdgeInput.consumer,
    doesNotProve: input.graphEdgeInput.doesNotProve
  });

  return [
    "sourceClaimEdgeCandidate:",
    `- id: source-claim-edge-candidate:${input.artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    "  status: candidate",
    `  reviewability: ${reviewability.reviewability}`,
    ...formatReviewabilityReasons(reviewability.reasons),
    `  fromSourceClaim: ${sourceClaimEdgeSourceLabel(input.command, input.artifactHash)}`,
    `  toSourceClaimId: ${input.graphEdgeInput.toSourceClaimId}`,
    `  kind: ${input.graphEdgeInput.kind}`,
    `  consumer: ${input.graphEdgeInput.consumer}`,
    `  evidenceRefs: ${generatedGraphEvidenceRefs(input.file, input.artifactHash, input.chunks).join(", ")}`,
    `  doesNotProve: ${input.graphEdgeInput.doesNotProve}`,
    input.sourceClaimPersisted
      ? "  SourceClaim row available for edge source: see Persistence readback"
      : "  No SourceClaim row available for edge source",
    input.sourceClaimEdgePersisted
      ? "  SourceClaimEdge row created: see Persistence readback"
      : "  No SourceClaimEdge created"
  ];
};

const formatSourceClaimEdgeCandidate = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean,
  sourceClaimEdgePersisted: boolean
): string[] => {
  if (!hasAnyGraphEdgeCandidateField(command)) {
    return formatNoSourceClaimEdgeCandidate();
  }

  const missingFields = sourceClaimEdgeMissingFields(command);

  if (missingFields.length > 0) {
    return formatIncompleteSourceClaimEdgeCandidate({
      command,
      file,
      artifactHash,
      chunks,
      missingFields
    });
  }

  const graphEdgeInput = completeGraphEdgeInput(command);

  if (graphEdgeInput === undefined) {
    return formatUnknownSourceClaimEdgeCandidate();
  }

  return formatCompleteSourceClaimEdgeCandidate({
    command,
    file,
    artifactHash,
    chunks,
    sourceClaimPersisted,
    sourceClaimEdgePersisted,
    graphEdgeInput
  });
};

const extractionCandidatePreviewView = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[]
) => {
  if (command.extractCandidates !== true) {
    return {
      status: "not_generated" as const,
      reason: "--extract-candidates was not supplied"
    };
  }

  const extraction = extractLocalSourceCandidates(chunks);
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(command, extraction);
  const reviewability = assessCandidateReviewability({
    summary: "Deterministic local source extraction candidate preview.",
    body: [
      `entityCandidates: ${extraction.entities.length}`,
      `claimCandidates: ${extraction.claims.length}`,
      `deferredClaimCandidates: ${extraction.deferredClaims.length}`,
      `relationCandidates: ${extraction.relations.length}`
    ].join("\n"),
    evidenceRefs: [
      file,
      artifactHash,
      ...chunks.map((chunk) => `${file}:lines ${chunk.startLine}-${chunk.endLine}`),
      ...chunks.map((chunk) => chunk.contentHash)
    ],
    applicationGuidance: "Use only as reviewable extraction candidates before graph persistence, ranking, crawler, or Memory Core work.",
    doesNotProve: extractionCandidateDoesNotProve
  });

  return {
    status: "candidate" as const,
    mode: "deterministic_local_heuristic" as const,
    reviewability,
    evidenceRefs: [
      file,
      artifactHash
    ],
    doesNotProve: extractionCandidateDoesNotProve,
    extraction,
    reviewedExtractionClaimSelection
  };
};

const formatExtractionCandidatePreview = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean
): string[] => {
  const view = extractionCandidatePreviewView(command, file, artifactHash, chunks);

  if (view.status === "not_generated") {
    return [
      "extractionCandidatePreview:",
      "- not generated",
      `  reason: ${view.reason}`,
      "  No extracted entity, claim, or relation candidates created"
    ];
  }

  return [
    "extractionCandidatePreview:",
    "- status: candidate",
    "  mode: deterministic_local_heuristic",
    `  reviewability: ${view.reviewability.reviewability}`,
    ...formatReviewabilityReasons(view.reviewability.reasons),
    `  evidenceRefs: ${view.evidenceRefs.join(", ")}`,
    `  doesNotProve: ${view.doesNotProve}`,
    "  entityCandidates:",
    ...(view.extraction.entities.length === 0
      ? ["  - none"]
      : view.extraction.entities.map((entity) =>
          `  - id: ${entity.id} | kind: ${entity.kind} | label: ${entity.label} | sourceRange: ${entity.sourceRange}`
        )),
    "  claimCandidates:",
    ...(view.extraction.claims.length === 0
      ? ["  - none"]
      : view.extraction.claims.map((claim) =>
          `  - id: ${claim.id} | reviewability: ${claim.reviewability} | text: ${claim.text} | sourceRange: ${claim.sourceRange} | reason: ${claim.reviewabilityReason}`
        )),
    "  deferredClaimCandidates:",
    ...(view.extraction.deferredClaims.length === 0
      ? ["  - none"]
      : view.extraction.deferredClaims.map((claim) =>
          `  - id: ${claim.id} | reviewability: ${claim.reviewability} | text: ${claim.text} | sourceRange: ${claim.sourceRange} | reason: ${claim.reviewabilityReason}`
        )),
    "  relationCandidates:",
    ...(view.extraction.relations.length === 0
      ? ["  - none"]
      : view.extraction.relations.map((relation) =>
          `  - id: ${relation.id} | kind: ${relation.kind} | from: ${relation.fromCandidateId} | to: ${relation.toCandidateId} | sourceRange: ${relation.sourceRange}`
        )),
    ...(view.reviewedExtractionClaimSelection === undefined
      ? ["  No SourceClaim row created from extraction candidates"]
      : [
          `  reviewedExtractionClaimCandidate: ${view.reviewedExtractionClaimSelection.candidate.id}`,
          sourceClaimPersisted
            ? "  SourceClaim row created from reviewed extraction candidate: see Persistence readback"
            : "  No SourceClaim row created from reviewed extraction candidate"
        ]),
    "  No SourceClaimEdge row created from extraction candidates",
    "  Graph runtime: none",
    "  Memory mutation: none"
  ];
};

export const formatCandidateBridge = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  flags: SourceArtifactPreviewPersistenceFlags
): string[] => {
  const lines = [
    "Candidate bridge:",
    "Mutation: none"
  ];

  lines.push(...formatSearchDocumentCandidate(
    file,
    artifactHash,
    chunks,
    flags.searchDocumentPersisted,
    command.sourceAuthority ?? "source-code"
  ));
  lines.push(...formatSourceClaimCandidate(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted
  ));
  lines.push(...formatSourceClaimEdgeCandidate(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted,
    flags.sourceClaimEdgePersisted
  ));
  lines.push(...formatExtractionCandidatePreview(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted
  ));

  return lines;
};

const searchDocumentCandidateJson = (
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean,
  sourceAuthority: string
): Record<string, unknown> => {
  const view = searchDocumentCandidateView(file, artifactHash, chunks, sourceAuthority);

  return {
    id: view.id,
    status: "candidate",
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    subjectType: view.candidate.subjectType,
    subjectId: view.candidate.subjectId,
    sourceAuthority: view.candidate.sourceAuthority,
    title: view.candidate.title,
    evidenceRefs: view.evidenceRefs,
    doesNotProve: view.doesNotProve,
    persisted
  };
};

const sourceClaimCandidateJson = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  persisted: boolean
): Record<string, unknown> => {
  const reviewedExtractionClaimSelection = selectReviewedExtractionClaimCandidate(
    command,
    extractLocalSourceCandidates(chunks)
  );

  if (!hasAnyManualSourceClaimCandidateField(command) && reviewedExtractionClaimSelection === undefined) {
    return {
      status: "not_generated",
      reason: "explicit claim/mechanism/consumer/falsifier inputs were not supplied",
      persisted: false
    };
  }

  const missingFields = sourceClaimCandidateMissingFields(command, reviewedExtractionClaimSelection);

  if (missingFields.length > 0) {
    const view = incompleteSourceClaimCandidateView({
      command,
      file,
      artifactHash,
      chunks,
      missingFields,
      reviewedExtractionClaimSelection
    });

    return {
      id: view.id,
      status: view.status,
      reviewability: view.reviewability.reviewability,
      reviewabilityReasons: view.reviewability.reasons,
      missing: view.missingFields,
      persisted: view.persisted
    };
  }

  const view = completeSourceClaimCandidateView({
    command,
    file,
    artifactHash,
    chunks,
    reviewedExtractionClaimSelection,
    persisted
  });

  return {
    id: view.id,
    status: view.status,
    ...(view.reviewedExtractionClaimSelection === undefined
      ? {}
      : {
          source: "reviewed_extraction_claim_candidate",
          extractionSourceRange: view.reviewedExtractionClaimSelection.candidate.sourceRange
        }),
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    claim: view.claim,
    mechanism: view.mechanism,
    consumer: view.consumer,
    falsifier: view.falsifier,
    evidenceRefs: view.evidenceRefs,
    doesNotProve: view.doesNotProve,
    persisted: view.persisted
  };
};

const sourceClaimEdgeCandidateJson = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean,
  sourceClaimEdgePersisted: boolean
): Record<string, unknown> => {
  if (!hasAnyGraphEdgeCandidateField(command)) {
    return {
      status: "not_generated",
      reason: "explicit graph edge inputs were not supplied",
      persisted: false
    };
  }

  const missingFields = sourceClaimEdgeMissingFields(command);

  if (missingFields.length > 0) {
    const reviewability = assessCandidateReviewability({
      summary: command.graphEdgeKind === undefined
        ? "SourceClaimEdge candidate from local source artifact preview."
        : `SourceClaimEdge ${command.graphEdgeKind} candidate from local source artifact preview.`,
      evidenceRefs: generatedGraphEvidenceRefs(file, artifactHash, chunks),
      ...(hasText(command.graphEdgeConsumer)
        ? { applicationGuidance: command.graphEdgeConsumer }
        : {}),
      ...(hasText(command.graphEdgeDoesNotProve)
        ? { doesNotProve: command.graphEdgeDoesNotProve }
        : {}),
      missingFields
    });

    return {
      id: "source-claim-edge-candidate:incomplete",
      status: "incomplete",
      reviewability: reviewability.reviewability,
      reviewabilityReasons: reviewability.reasons,
      missing: missingFields,
      persisted: false
    };
  }

  const graphEdgeInput = completeGraphEdgeInput(command);

  if (graphEdgeInput === undefined) {
    return {
      id: "source-claim-edge-candidate:incomplete",
      status: "incomplete",
      reviewability: "unknown",
      reviewabilityReasons: [
        "Graph edge input could not be narrowed after missing-field checks."
      ],
      persisted: false
    };
  }

  const reviewability = assessCandidateReviewability({
    summary: `SourceClaimEdge ${graphEdgeInput.kind} -> ${graphEdgeInput.toSourceClaimId}`,
    body: [
      `from: source-claim-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
      `to: ${graphEdgeInput.toSourceClaimId}`,
      `kind: ${graphEdgeInput.kind}`,
      ...(graphEdgeInput.scope === undefined ? [] : [`scope: ${graphEdgeInput.scope}`])
    ].join("\n"),
    evidenceRefs: [
      ...generatedGraphEvidenceRefs(file, artifactHash, chunks),
      ...(graphEdgeInput.evidenceRef === undefined ? [] : [graphEdgeInput.evidenceRef])
    ],
    applicationGuidance: graphEdgeInput.consumer,
    doesNotProve: graphEdgeInput.doesNotProve
  });

  return {
    id: `source-claim-edge-candidate:${artifactHash.slice("sha256:".length, "sha256:".length + 12)}`,
    status: "candidate",
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    fromSourceClaim: sourceClaimEdgeSourceLabel(command, artifactHash),
    toSourceClaimId: graphEdgeInput.toSourceClaimId,
    kind: graphEdgeInput.kind,
    consumer: graphEdgeInput.consumer,
    evidenceRefs: generatedGraphEvidenceRefs(file, artifactHash, chunks),
    doesNotProve: graphEdgeInput.doesNotProve,
    sourceClaimPersisted,
    persisted: sourceClaimEdgePersisted
  };
};

const extractionCandidatePreviewJson = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  sourceClaimPersisted: boolean
): Record<string, unknown> => {
  const view = extractionCandidatePreviewView(command, file, artifactHash, chunks);

  if (view.status === "not_generated") {
    return {
      status: "not_generated",
      reason: view.reason,
      entityCandidates: [],
      claimCandidates: [],
      deferredClaimCandidates: [],
      relationCandidates: []
    };
  }

  return {
    status: view.status,
    mode: view.mode,
    reviewability: view.reviewability.reviewability,
    reviewabilityReasons: view.reviewability.reasons,
    evidenceRefs: view.evidenceRefs,
    doesNotProve: view.doesNotProve,
    entityCandidates: view.extraction.entities,
    claimCandidates: view.extraction.claims,
    deferredClaimCandidates: view.extraction.deferredClaims,
    relationCandidates: view.extraction.relations,
    ...(view.reviewedExtractionClaimSelection === undefined
      ? {}
      : {
          reviewedExtractionClaimCandidate: view.reviewedExtractionClaimSelection.candidate.id,
          sourceClaimPersisted
        }),
    graphRuntime: "none",
    memoryMutation: "none"
  };
};

export const candidateBridgeJson = (
  command: SourceArtifactPreviewViewCommand,
  file: string,
  artifactHash: string,
  chunks: readonly SourceArtifactPreviewChunk[],
  flags: SourceArtifactPreviewPersistenceFlags
): Record<string, unknown> => ({
  mutation: "none",
  searchDocumentCandidate: searchDocumentCandidateJson(
    file,
    artifactHash,
    chunks,
    flags.searchDocumentPersisted,
    command.sourceAuthority ?? "source-code"
  ),
  sourceClaimCandidate: sourceClaimCandidateJson(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted
  ),
  sourceClaimEdgeCandidate: sourceClaimEdgeCandidateJson(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted,
    flags.sourceClaimEdgePersisted
  ),
  extractionCandidatePreview: extractionCandidatePreviewJson(
    command,
    file,
    artifactHash,
    chunks,
    flags.sourceClaimPersisted
  )
});
