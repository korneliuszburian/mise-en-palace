import {
  parseAntiMemoryCandidateInput,
  parseAntiMemoryInput
} from "@krn/core";
import type {
  ReflectionCandidateEvidence
} from "@krn/core";
import {
  assertSourceClaimExists,
  buildReflectionCandidateEvidence,
  createMemoryCommandDatabaseRuntime,
  toSourceLineageRefs
} from "./memory-command-support.js";
import type {
  CreateMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type {
  CliCommand
} from "./parse-args.js";
import {
  parseMemoryConfidence
} from "./parse-memory-confidence.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";

type MemoryAntiAddCommand = Extract<CliCommand, { kind: "memoryAntiAdd" }>;

export interface MemoryAntiAddCommandRuntime extends BaseCommandRuntime {
  command: MemoryAntiAddCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryAntiAddCommandResult {
  stdout: string;
}

const defaultOwner = "operator";
const defaultConfidence = 90;
const defaultProposedBy = "cli";

type AntiAddDatabaseRuntime = Awaited<ReturnType<typeof createMemoryCommandDatabaseRuntime>>;

const persistedRunProjectId = async (
  databaseRuntime: AntiAddDatabaseRuntime,
  executionRunId: string | undefined
): Promise<string | undefined> => {
  if (executionRunId === undefined) return undefined;
  const aggregate = await databaseRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(executionRunId);
  return aggregate?.taskContract.projectId ?? aggregate?.operatorIntent.projectId;
};

const assertAntiAddProjectMatch = (
  requestedProjectId: string | undefined,
  runProjectId: string | undefined
): void => {
  if (requestedProjectId !== undefined && runProjectId !== undefined && requestedProjectId !== runProjectId) {
    throw new Error(`--project ${requestedProjectId} does not match persisted run project ${runProjectId}`);
  }
};

const createScopedAntiAddRuntime = async (
  runtime: MemoryAntiAddCommandRuntime,
  command: MemoryAntiAddCommand,
  executionRunId: string | undefined
): Promise<{ databaseRuntime: AntiAddDatabaseRuntime; requestedProjectId: string | undefined }> => {
  const requestedProjectId = command.projectId?.trim() || undefined;
  let databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory anti add --persist",
    requestedProjectId
  );
  const runProjectId = await persistedRunProjectId(databaseRuntime, executionRunId);
  assertAntiAddProjectMatch(requestedProjectId, runProjectId);
  if (requestedProjectId === undefined && runProjectId !== undefined && runProjectId !== databaseRuntime.projectId) {
    await databaseRuntime.close();
    databaseRuntime = await createMemoryCommandDatabaseRuntime(
      runtime,
      "KRN_DATABASE_URL is required for krn memory anti add --persist",
      runProjectId
    );
  }
  return { databaseRuntime, requestedProjectId };
};

const sourceLineage = (command: MemoryAntiAddCommand): { sourceId: string }[] => [
  ...(command.invalidatedBySourceClaimId === undefined
    ? []
    : [{ sourceId: command.invalidatedBySourceClaimId }]),
  ...command.sourceLineageIds.map((sourceId) => ({ sourceId }))
];

const formatSourceClaimIds = (sourceClaimIds: readonly string[]): string[] => (
  sourceClaimIds.length === 0
    ? []
    : [`invalidatedBySourceClaimIds: ${sourceClaimIds.join(",")}`]
);

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
    ...formatSourceClaimIds(antiMemory.invalidatedBySourceClaimIds),
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
    ...formatSourceClaimIds(antiMemory.invalidatedBySourceClaimIds),
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

export const runMemoryAntiAddCommand = async (
  runtime: MemoryAntiAddCommandRuntime
): Promise<MemoryAntiAddCommandResult> => {
  const command = runtime.command;
  const evidence = buildReflectionCandidateEvidence({
    provenance: command.candidateEvidenceProvenance,
    evidenceRefs: command.candidateEvidenceRefs,
    doesNotProve: command.candidateEvidenceDoesNotProve
  });
  const antiMemoryInput = parseAntiMemoryInput({
    executionRunId: command.runId,
    key: command.key ?? runtime.createId("anti-memory"),
    rejectedClaim: command.rejectedClaim,
    reason: command.reason,
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

  const scopedRuntime = await createScopedAntiAddRuntime(runtime, command, antiMemoryInput.executionRunId);
  const { requestedProjectId } = scopedRuntime;
  const databaseRuntime = scopedRuntime.databaseRuntime;

  try {
    for (const sourceClaimId of antiMemoryInput.invalidatedBySourceClaimIds) {
      await assertSourceClaimExists(databaseRuntime, sourceClaimId, requestedProjectId);
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
