import {
  MemoryRecordKindSchema,
  parseMemoryCandidateInput
} from "@krn/schema";
import type {
  ReflectionCandidateEvidence,
  ReflectionCandidateEvidenceProvenance,
  SourceLineageRef
} from "@krn/core";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  parseMemoryConfidence
} from "./parseMemoryConfidence.js";

type MemoryCandidateAddCommand = Extract<CliCommand, { kind: "memoryCandidateAdd" }>;

export interface MemoryCandidateAddCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: MemoryCandidateAddCommand;
  createDatabaseRuntime?: CreateMemoryCandidateAddDatabaseRuntime;
}

export interface MemoryCandidateAddCommandResult {
  stdout: string;
}

type CreateMemoryCandidateAddDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const kindAliases = new Map<string, string>([
  ["architecture-boundary", "constraint"]
]);

const candidateEvidenceProvenances = new Set<ReflectionCandidateEvidenceProvenance>([
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

const isCandidateEvidenceProvenance = (
  value: string
): value is ReflectionCandidateEvidenceProvenance =>
  candidateEvidenceProvenances.has(value as ReflectionCandidateEvidenceProvenance);

const normalizeKind = (kind: string | undefined): string | undefined => {
  const candidate = kind?.trim();

  if (candidate === undefined || candidate.length === 0) {
    return undefined;
  }

  return kindAliases.get(candidate) ?? candidate;
};

const sourceLineage = (command: MemoryCandidateAddCommand): { sourceId: string }[] => [
  ...(command.sourceClaimId === undefined ? [] : [{ sourceId: command.sourceClaimId }]),
  ...command.sourceLineageIds.map((sourceId) => ({ sourceId }))
];

const toSourceLineageRefs = (
  sourceLineageItems: ReturnType<typeof parseMemoryCandidateInput>["sourceLineage"]
): SourceLineageRef[] =>
  sourceLineageItems.map((item) => ({
    sourceId: item.sourceId,
    ...(item.note === undefined ? {} : { note: item.note })
  }));

const buildCandidateEvidence = (
  command: MemoryCandidateAddCommand
): ReflectionCandidateEvidence | undefined => {
  const provenance = command.candidateEvidenceProvenance?.trim();
  const evidenceRefs = command.candidateEvidenceRefs
    .map((evidenceRef) => evidenceRef.trim())
    .filter((evidenceRef) => evidenceRef.length > 0);
  const doesNotProve = command.candidateEvidenceDoesNotProve?.trim();
  const evidenceInputProvided =
    provenance !== undefined ||
    command.candidateEvidenceRefs.length > 0 ||
    doesNotProve !== undefined;

  if (!evidenceInputProvided) {
    return undefined;
  }

  if (provenance === undefined || provenance.length === 0) {
    throw new Error("--candidate-evidence-provenance is required when candidate evidence is supplied");
  }

  if (!isCandidateEvidenceProvenance(provenance)) {
    throw new Error(`Unsupported candidate evidence provenance: ${provenance}`);
  }

  if (evidenceRefs.length === 0) {
    throw new Error("--candidate-evidence-ref is required when candidate evidence is supplied");
  }

  if (doesNotProve === undefined || doesNotProve.length === 0) {
    throw new Error("--candidate-evidence-does-not-prove is required when candidate evidence is supplied");
  }

  return {
    provenance,
    evidenceRefs,
    doesNotProve
  };
};

const formatPreview = (
  command: MemoryCandidateAddCommand,
  candidate: ReturnType<typeof parseMemoryCandidateInput>,
  normalizedKind: string
): string =>
  [
    "KRN Memory Candidate Add",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Memory candidate preview:",
    `kind: ${candidate.kind}`,
    ...(command.memoryKind === normalizedKind ? [] : [`inputKind: ${command.memoryKind}`]),
    `status: ${candidate.status}`,
    `summary: ${candidate.summary}`,
    `confidence: ${candidate.confidence}`,
    `applicationGuidance: ${candidate.applicationGuidance}`,
    ...(command.runId === undefined ? [] : [`runId: ${command.runId}`]),
    ...(command.feedbackDeltaId === undefined
      ? []
      : [`feedbackDeltaId: ${command.feedbackDeltaId}`]),
    ...(command.sourceClaimId === undefined
      ? []
      : [`sourceClaimId: ${command.sourceClaimId}`]),
    ...(command.candidateEvidenceProvenance === undefined
      ? []
      : [`candidateEvidenceProvenance: ${command.candidateEvidenceProvenance}`]),
    ...(command.candidateEvidenceRefs.length === 0
      ? []
      : [`candidateEvidenceRefs: ${command.candidateEvidenceRefs.join(",")}`]),
    `invalidationRule: ${candidate.invalidationRule ?? ""}`
  ].join("\n");

const formatPersisted = (
  memoryCandidateId: string,
  candidate: ReturnType<typeof parseMemoryCandidateInput>,
  evidence: ReflectionCandidateEvidence | undefined
): string =>
  [
    "KRN Memory Candidate Add",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `memoryCandidate: ${memoryCandidateId}`,
    ...(candidate.executionRunId === undefined ? [] : [`runId: ${candidate.executionRunId}`]),
    ...(candidate.feedbackDeltaId === undefined
      ? []
      : [`feedbackDeltaId: ${candidate.feedbackDeltaId}`]),
    `kind: ${candidate.kind}`,
    `status: ${candidate.status}`,
    `confidence: ${candidate.confidence}`,
    `sourceClaimIds: ${candidate.sourceClaimIds.join(",")}`,
    ...(evidence === undefined
      ? ["candidateEvidence: missing (cannot pass MemoryReviewGate until evidence is added)"]
      : [
          `candidateEvidenceProvenance: ${evidence.provenance}`,
          `candidateEvidenceRefs: ${evidence.evidenceRefs.join(",")}`
        ])
  ].join("\n");

export const runMemoryCandidateAddCommand = async (
  runtime: MemoryCandidateAddCommandRuntime
): Promise<MemoryCandidateAddCommandResult> => {
  const command = runtime.command;
  const normalizedKind = normalizeKind(command.memoryKind);

  if (normalizedKind !== undefined && !MemoryRecordKindSchema.safeParse(normalizedKind).success) {
    throw new Error(`Unsupported memory kind: ${command.memoryKind}`);
  }

  const evidence = buildCandidateEvidence(command);
  const candidateInput = parseMemoryCandidateInput({
    executionRunId: command.runId,
    feedbackDeltaId: command.feedbackDeltaId,
    proposedBy: command.proposedBy ?? "cli",
    kind: normalizedKind,
    summary: command.content,
    body: command.content,
    owner: command.owner ?? "operator",
    confidence: parseMemoryConfidence(command.confidence),
    applicationGuidance: command.applicationGuidance,
    invalidationRule: command.invalidationRule,
    sourceClaimIds: command.sourceClaimId === undefined ? [] : [command.sourceClaimId],
    sourceLineage: sourceLineage(command),
    isUserPreference: false,
    metadata: {
      ...command.metadata,
      ...(evidence === undefined ? {} : { reflectionCandidateEvidence: evidence }),
      ...(command.memoryKind === normalizedKind ? {} : { inputKind: command.memoryKind })
    }
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(command, candidateInput, normalizedKind ?? "")
    };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn memory candidate add --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    if (candidateInput.sourceClaimIds.length > 0) {
      const sourceClaimId = candidateInput.sourceClaimIds[0];

      if (sourceClaimId === undefined) {
        throw new Error("sourceClaimId is required");
      }

      const sourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(sourceClaimId);

      if (sourceClaim === undefined) {
        throw new Error(`SourceClaim not found: ${sourceClaimId}`);
      }
    }

    const memoryCandidate = await databaseRuntime.memoryRepository.createMemoryCandidate({
      projectId: databaseRuntime.projectId,
      ...(candidateInput.executionRunId === undefined
        ? {}
        : { executionRunId: candidateInput.executionRunId }),
      ...(candidateInput.feedbackDeltaId === undefined
        ? {}
        : { feedbackDeltaId: candidateInput.feedbackDeltaId }),
      proposedBy: candidateInput.proposedBy,
      kind: candidateInput.kind,
      status: candidateInput.status,
      summary: candidateInput.summary,
      body: candidateInput.body,
      owner: candidateInput.owner,
      confidence: candidateInput.confidence,
      applicationGuidance: candidateInput.applicationGuidance,
      ...(candidateInput.invalidationRule === undefined
        ? {}
        : { invalidationRule: candidateInput.invalidationRule }),
      sourceClaimIds: candidateInput.sourceClaimIds,
      sourceLineage: toSourceLineageRefs(candidateInput.sourceLineage),
      isUserPreference: candidateInput.isUserPreference,
      metadata: candidateInput.metadata
    });

    return {
      stdout: formatPersisted(memoryCandidate.id, candidateInput, evidence)
    };
  } finally {
    await databaseRuntime.close();
  }
};
