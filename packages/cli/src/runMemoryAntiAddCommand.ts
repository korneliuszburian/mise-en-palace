import {
  parseAntiMemoryCandidateInput,
  parseAntiMemoryInput
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

type MemoryAntiAddCommand = Extract<CliCommand, { kind: "memoryAntiAdd" }>;

export interface MemoryAntiAddCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: MemoryAntiAddCommand;
  createDatabaseRuntime?: CreateMemoryAntiAddDatabaseRuntime;
}

export interface MemoryAntiAddCommandResult {
  stdout: string;
}

type CreateMemoryAntiAddDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultOwner = "operator";
const defaultConfidence = 90;
const defaultProposedBy = "cli";

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

const sourceLineage = (command: MemoryAntiAddCommand): { sourceId: string }[] => [
  ...(command.invalidatedBySourceClaimId === undefined
    ? []
    : [{ sourceId: command.invalidatedBySourceClaimId }]),
  ...command.sourceLineageIds.map((sourceId) => ({ sourceId }))
];

const toSourceLineageRefs = (
  sourceLineageItems: ReturnType<typeof parseAntiMemoryInput>["sourceLineage"]
): SourceLineageRef[] =>
  sourceLineageItems.map((item) => ({
    sourceId: item.sourceId,
    ...(item.note === undefined ? {} : { note: item.note })
  }));

const formatPreview = (
  antiMemory: ReturnType<typeof parseAntiMemoryInput>
): string =>
  [
    "KRN Memory Anti Add",
    "Persistence: disabled (no-store preview; use --persist to write)",
    "DB writes: none",
    "",
    "Anti-memory candidate preview:",
    `rejectedClaim: ${antiMemory.rejectedClaim}`,
    `reason: ${antiMemory.reason}`,
    `runId: ${antiMemory.executionRunId}`,
    ...(antiMemory.invalidatedBySourceClaimId === undefined
      ? []
      : [`invalidatedBySourceClaimId: ${antiMemory.invalidatedBySourceClaimId}`]),
    `confidence: ${antiMemory.confidence}`,
    "No AntiMemoryRecord created",
    "No MemoryRecord created",
    "Anti-memory is not positive memory"
  ].join("\n");

const formatPersisted = (
  antiMemoryCandidateId: string,
  antiMemory: ReturnType<typeof parseAntiMemoryCandidateInput>,
  evidence: ReflectionCandidateEvidence | undefined
): string =>
  [
    "KRN Memory Anti Add",
    "Persistence: enabled (Postgres, explicit --persist)",
    "",
    "Persisted IDs:",
    `antiMemoryCandidate: ${antiMemoryCandidateId}`,
    `runId: ${antiMemory.executionRunId}`,
    ...(antiMemory.invalidatedBySourceClaimId === undefined
      ? []
      : [`invalidatedBySourceClaimId: ${antiMemory.invalidatedBySourceClaimId}`]),
    `rejectedClaim: ${antiMemory.rejectedClaim}`,
    `status: ${antiMemory.status}`,
    ...(evidence === undefined
      ? ["candidateEvidence: missing (cannot pass AntiMemoryReviewGate until evidence is added)"]
      : [
          `candidateEvidenceProvenance: ${evidence.provenance}`,
          `candidateEvidenceRefs: ${evidence.evidenceRefs.join(",")}`
        ]),
    "No AntiMemoryRecord created",
    "No MemoryRecord created",
    "Anti-memory is not positive memory"
  ].join("\n");

const buildCandidateEvidence = (
  command: MemoryAntiAddCommand
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

const createRuntime = async (
  runtime: MemoryAntiAddCommandRuntime
): Promise<DatabaseRuntime> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn memory anti add --persist");
  }

  const createDatabase = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createDatabase({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });
};

export const runMemoryAntiAddCommand = async (
  runtime: MemoryAntiAddCommandRuntime
): Promise<MemoryAntiAddCommandResult> => {
  const command = runtime.command;
  const evidence = buildCandidateEvidence(command);
  const antiMemoryInput = parseAntiMemoryInput({
    executionRunId: command.runId,
    key: command.key ?? runtime.createId("anti-memory"),
    rejectedClaim: command.rejectedClaim,
    reason: command.reason,
    invalidatedBySourceClaimId: command.invalidatedBySourceClaimId,
    invalidatedBySourceClaimIds:
      command.invalidatedBySourceClaimId === undefined
        ? []
        : [command.invalidatedBySourceClaimId],
    appliesTo: command.appliesTo,
    mayRevisitWhen: command.mayRevisitWhen,
    owner: command.owner ?? defaultOwner,
    confidence: parseMemoryConfidence(command.confidence, { defaultValue: defaultConfidence }),
    sourceLineage: sourceLineage(command),
    metadata: command.metadata
  });
  const antiMemoryCandidateInput = parseAntiMemoryCandidateInput({
    executionRunId: antiMemoryInput.executionRunId,
    key: antiMemoryInput.key ?? runtime.createId("anti-memory-candidate"),
    proposedBy: command.proposedBy ?? defaultProposedBy,
    status: "candidate",
    rejectedClaim: antiMemoryInput.rejectedClaim,
    reason: antiMemoryInput.reason,
    invalidatedBySourceClaimId: antiMemoryInput.invalidatedBySourceClaimId,
    invalidatedBySourceClaimIds: antiMemoryInput.invalidatedBySourceClaimIds,
    appliesTo: antiMemoryInput.appliesTo,
    mayRevisitWhen: antiMemoryInput.mayRevisitWhen,
    summary: antiMemoryInput.rejectedClaim,
    body: antiMemoryInput.reason,
    owner: antiMemoryInput.owner,
    confidence: antiMemoryInput.confidence,
    sourceLineage: antiMemoryInput.sourceLineage,
    metadata: {
      ...antiMemoryInput.metadata,
      ...(evidence === undefined ? {} : { reflectionCandidateEvidence: evidence })
    }
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(antiMemoryInput)
    };
  }

  const databaseRuntime = await createRuntime(runtime);

  try {
    if (antiMemoryInput.invalidatedBySourceClaimId !== undefined) {
      const sourceClaim = await databaseRuntime.sourceRepository.getSourceClaimById(
        antiMemoryInput.invalidatedBySourceClaimId
      );

      if (sourceClaim === undefined) {
        throw new Error(`SourceClaim not found: ${antiMemoryInput.invalidatedBySourceClaimId}`);
      }
    }

    const antiMemoryCandidate = await databaseRuntime.memoryRepository.createAntiMemoryCandidate({
      projectId: databaseRuntime.projectId,
      ...(antiMemoryCandidateInput.executionRunId === undefined
        ? {}
        : { executionRunId: antiMemoryCandidateInput.executionRunId }),
      ...(antiMemoryCandidateInput.feedbackDeltaId === undefined
        ? {}
        : { feedbackDeltaId: antiMemoryCandidateInput.feedbackDeltaId }),
      proposedBy: antiMemoryCandidateInput.proposedBy,
      key: antiMemoryCandidateInput.key,
      status: antiMemoryCandidateInput.status,
      ...(antiMemoryCandidateInput.rejectedClaim === undefined
        ? {}
        : { rejectedClaim: antiMemoryCandidateInput.rejectedClaim }),
      ...(antiMemoryCandidateInput.reason === undefined
        ? {}
        : { reason: antiMemoryCandidateInput.reason }),
      invalidatedBySourceClaimIds: antiMemoryCandidateInput.invalidatedBySourceClaimIds,
      ...(antiMemoryCandidateInput.invalidatedBySourceClaimId === undefined
        ? {}
        : { invalidatedBySourceClaimId: antiMemoryCandidateInput.invalidatedBySourceClaimId }),
      ...(antiMemoryCandidateInput.appliesTo === undefined
        ? {}
        : { appliesTo: antiMemoryCandidateInput.appliesTo }),
      ...(antiMemoryCandidateInput.mayRevisitWhen === undefined
        ? {}
        : { mayRevisitWhen: antiMemoryCandidateInput.mayRevisitWhen }),
      summary: antiMemoryCandidateInput.summary,
      body: antiMemoryCandidateInput.body,
      owner: antiMemoryCandidateInput.owner,
      confidence: antiMemoryCandidateInput.confidence,
      sourceLineage: toSourceLineageRefs(antiMemoryCandidateInput.sourceLineage),
      metadata: antiMemoryCandidateInput.metadata
    });

    return {
      stdout: formatPersisted(antiMemoryCandidate.id, antiMemoryCandidateInput, evidence)
    };
  } finally {
    await databaseRuntime.close();
  }
};
