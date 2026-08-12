import {
  MemoryRecordKindSchema,
  parseMemoryCandidateInput
} from "@krn/core";
import type {
  ReflectionCandidateEvidence
} from "@krn/core";
import {
  buildReflectionCandidateEvidence,
  createMemoryLifecycleCommandRuntime,
  toSourceLineageRefs
} from "./memory-command-support.js";
import {
  noStorePreviewLabel,
  persistenceLine
} from "./command-runtime-support.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import type {
  CreateMemoryCommandDatabaseRuntime,
  MemoryLifecycleCommandRuntime
} from "./memory-command-support.js";
import type {
  CliCommand
} from "./parse-args.js";
import {
  parseMemoryConfidence
} from "./parse-memory-confidence.js";

type MemoryCandidateAddCommand = Extract<CliCommand, { kind: "memoryCandidateAdd" }>;

export interface MemoryCandidateAddCommandRuntime extends BaseCommandRuntime {
  cwd?: string;
  command: MemoryCandidateAddCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryCandidateAddCommandResult {
  stdout: string;
}

const kindAliases = new Map<string, string>([
  ["architecture-boundary", "constraint"]
]);

const memoryKindFromCli = (kind: string | undefined): string | undefined => {
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

const formatPreview = (
  command: MemoryCandidateAddCommand,
  candidate: ReturnType<typeof parseMemoryCandidateInput>,
  canonicalMemoryKind: string
): string =>
  [
    "KRN Memory Candidate Add",
    persistenceLine(noStorePreviewLabel),
    "DB writes: none",
    "",
    "Memory candidate preview:",
    `kind: ${candidate.kind}`,
    ...(command.memoryKind === canonicalMemoryKind ? [] : [`inputKind: ${command.memoryKind}`]),
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
  evidence: ReflectionCandidateEvidence | undefined,
  persistenceLabel: string
): string =>
  [
    "KRN Memory Candidate Add",
    persistenceLine(`enabled (${persistenceLabel}, explicit --persist)`),
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

const projectIdForMemoryCandidate = async (
  databaseRuntime: MemoryLifecycleCommandRuntime,
  executionRunId: string | undefined
): Promise<string> => {
  const connectedProjectId = databaseRuntime.projectId;

  if (connectedProjectId === undefined) {
    throw new Error("Connected target project is required for memory candidate creation");
  }

  if (executionRunId === undefined) {
    return connectedProjectId;
  }

  const runProjectId = await databaseRuntime.resolveExecutionRunProjectId(executionRunId);
  if (runProjectId === undefined) {
    return connectedProjectId;
  }
  if (databaseRuntime.backend === "sqlite" && runProjectId !== connectedProjectId) {
    throw new Error(
      `ExecutionRun ${executionRunId} belongs to project ${runProjectId}, not connected target project ${connectedProjectId}`
    );
  }

  return runProjectId;
};

export const runMemoryCandidateAddCommand = async (
  runtime: MemoryCandidateAddCommandRuntime
): Promise<MemoryCandidateAddCommandResult> => {
  const command = runtime.command;
  const canonicalMemoryKind = memoryKindFromCli(command.memoryKind);

  if (canonicalMemoryKind !== undefined && !MemoryRecordKindSchema.safeParse(canonicalMemoryKind).success) {
    throw new Error(`Unsupported memory kind: ${command.memoryKind}`);
  }

  const evidence = buildReflectionCandidateEvidence({
    provenance: command.candidateEvidenceProvenance,
    evidenceRefs: command.candidateEvidenceRefs,
    doesNotProve: command.candidateEvidenceDoesNotProve
  });
  const candidateInput = parseMemoryCandidateInput({
    executionRunId: command.runId,
    feedbackDeltaId: command.feedbackDeltaId,
    proposedBy: command.proposedBy ?? "cli",
    kind: canonicalMemoryKind,
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
      ...(command.memoryKind === canonicalMemoryKind ? {} : { inputKind: command.memoryKind })
    }
  });

  if (!command.persist) {
    return {
      stdout: formatPreview(command, candidateInput, canonicalMemoryKind ?? "")
    };
  }

  const databaseRuntime = await createMemoryLifecycleCommandRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory candidate add --persist",
    { requireConnectedProject: true }
  );

  try {
    const projectId = await projectIdForMemoryCandidate(
      databaseRuntime,
      candidateInput.executionRunId
    );

    if (candidateInput.sourceClaimIds.length > 0) {
      const sourceClaimId = candidateInput.sourceClaimIds[0];

      if (sourceClaimId === undefined) {
        throw new Error("sourceClaimId is required");
      }

      const sourceClaim = databaseRuntime.backend === "sqlite" &&
        databaseRuntime.sourceRepository.getSourceClaimForProject !== undefined
        ? await databaseRuntime.sourceRepository.getSourceClaimForProject(projectId, sourceClaimId)
        : await databaseRuntime.sourceRepository.getSourceClaimById(sourceClaimId);
      if (sourceClaim === undefined) {
        throw new Error(`SourceClaim not found: ${sourceClaimId}`);
      }
    }

    const memoryCandidate = await databaseRuntime.memoryRepository.createMemoryCandidate({
      projectId,
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
      stdout: formatPersisted(
        memoryCandidate.id,
        candidateInput,
        evidence,
        databaseRuntime.persistenceLabel
      )
    };
  } finally {
    await databaseRuntime.close();
  }
};
