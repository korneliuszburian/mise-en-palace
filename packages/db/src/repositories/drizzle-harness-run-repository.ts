import { createHash } from "node:crypto";

import {
  and,
  asc,
  eq,
  inArray,
  desc,
  isNull,
  sql
} from "drizzle-orm";
import type {
  SQL,
  SQLWrapper
} from "drizzle-orm";
import type {
  ContextAssembly,
  CommandOutputArtifact,
  EvidenceBundle,
  EvidenceCommand,
  ExecutionRun,
  ExecutionRunLifecycleTransitionedEventRecord,
  FeedbackDelta,
  ProjectId,
  HarnessPlan,
  EvidenceCommandReadback,
  OperatorIntent,
  ReviewAssessment,
  SourceUsefulnessOutcome,
  TaskContract,
  TargetStateSnapshot,
  UsefulnessApplicationEvidence,
  UsefulnessApplicationEvidenceIdentity,
  ExecutionRunStatus,
  UpdateExecutionRunStatusResult
} from "@krn/core";
import {
  assessCommandOutputArtifactIntegrity,
  assessCurrentDecisionPacketHelpedProof,
  authorizeDecisionPacketUsefulness,
  collectTargetStateSnapshot,
  decideEvidenceContractActivation,
  decisionPacketAuthorityAdmissionCurrent,
  executionRunLifecycleCreatedEvent,
  executionRunLifecycleCreatedEventType,
  executionRunLifecycleTransitionedEvent,
  executionRunLifecycleTransitionedEventType,
  ExecutionRunLifecycleConflictError,
  isAdmittedCurrentDecisionPacketAuthorityMetadata,
  isReviewableFeedbackOutcome,
  projectDecisionPacketUsefulnessSubjects,
  parseUsefulnessApplicationEvidenceIdentity,
  parseUsefulnessApplicationEvidenceForIdentity,
  stampCurrentDecisionPacketAuthorityMetadata,
  stampUnboundDecisionPacketAuthorityMetadata,
  targetEvidenceFromMetadata,
  targetEvidenceClaimsFreshOwnedPatch,
  toEvidenceCommandReadback,
  readMetadataString
} from "@krn/core";
import {
  maintenanceQueueRecordKeyForJob
} from "@krn/core";
import {
  parseEvidenceCaptureInput
} from "@krn/core";
import type {
  CreateContextAssemblyInput,
  CreateEvidenceBundleInput,
  CreateEvidenceFeedbackOnceInput,
  CreateEvidenceFeedbackOnceResult,
  CreateEvalFeedbackDeltaOnceInput,
  CreateEvalFeedbackDeltaOnceResult,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  FeedbackSubjectReference,
  FeedbackDeltaProjectLookup,
  CreateHarnessPlanInput,
  CreateOperatorIntentInput,
  CreateReviewAssessmentInput,
  CreateTaskContractInput,
  HarnessRunAggregate,
  HarnessRunRepository,
  ListFeedbackDeltasForSubjectsInput,
  RecordUsefulnessApplicationOnceResult,
  UpdateExecutionRunStatusInput
} from "@krn/core/repositories/internal";

import type { KrnDatabase, KrnDatabaseTransaction } from "../database.js";
import {
  contextAssemblies,
  evidenceCommandArtifacts,
  evidenceBundles,
  executionRuns,
  feedbackDeltas,
  harnessPlans,
  maintenanceQueues,
  memoryRecords,
  operatorIntents,
  outboxEvents,
  reviewAssessments,
  retrievalRuns,
  runEvents,
  sourceClaims,
  taskContracts,
  usefulnessApplications
} from "../schema/index.js";
import {
  activationDecisions,
  retrievalCandidates
} from "../schema/retrieval.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./repository-value-readers.js";
import {
  mapActivationDecision,
  mapContextAssembly,
  mapCommandOutputArtifact,
  mapEvidenceBundle,
  mapExecutionRun,
  mapFeedbackDelta,
  mapHarnessPlan,
  mapOperatorIntent,
  mapRetrievalCandidate,
  mapRunEvent,
  mapReviewAssessment,
  mapTaskContract
} from "./mappers.js";

const requireLinkedRow = <T>(row: T | undefined, operation: string): T => {
  if (row === undefined) {
    throw new Error(`${operation} did not find a linked row`);
  }

  return row;
};

interface CanonicalRevisionToken {
  readonly subjectType: "memory_record" | "source_claim";
  readonly subjectId: string;
  readonly updatedAt: string;
  readonly status: string;
  readonly currentVersionId?: string;
}

const terminalExecutionRunStatuses: readonly ExecutionRunStatus[] = [
  "succeeded",
  "failed",
  "blocked",
  "cancelled"
];

const isTerminalExecutionRunStatus = (status: ExecutionRunStatus): boolean =>
  terminalExecutionRunStatuses.includes(status);

const executionRunTransitionIsAllowed = (
  current: ExecutionRunStatus,
  next: ExecutionRunStatus
): boolean => {
  switch (current) {
    case "planned":
      return next === "running" || next === "blocked" || next === "cancelled";
    case "running":
      return isTerminalExecutionRunStatus(next);
    case "succeeded":
    case "failed":
    case "blocked":
    case "cancelled":
      return false;
  }
};

const requireValidTimestamp = (value: string, field: string): Date => {
  const timestamp = fromIsoTimestamp(value);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`execution run lifecycle ${field} must be a valid ISO timestamp`);
  }

  return timestamp;
};

const validateExecutionRunCreation = (input: CreateExecutionRunInput): void => {
  const status = input.status ?? "planned";

  if (isTerminalExecutionRunStatus(status)) {
    throw new Error(`execution run lifecycle cannot create terminal status ${status}`);
  }

  if (status === "planned" && input.startedAt !== undefined) {
    throw new Error("execution run lifecycle planned status cannot have startedAt");
  }

  if (status === "running" && input.startedAt === undefined) {
    throw new Error("execution run lifecycle running status requires startedAt");
  }

  if (input.startedAt !== undefined) {
    requireValidTimestamp(input.startedAt, "startedAt");
  }
}

// fallow-ignore-next-line complexity -- one explicit lifecycle matrix validates status and timestamp coherence
const validateExecutionRunTransition = (input: UpdateExecutionRunStatusInput, current: {
  readonly status: ExecutionRunStatus;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
}): boolean => {
  if (current.status !== input.expectedStatus) {
    throw new ExecutionRunLifecycleConflictError({
      kind: "status",
      executionRunId: input.executionRunId,
      expectedStatus: input.expectedStatus,
      actualStatus: current.status
    });
  }

  if (current.status === input.status) {
    if (input.startedAt !== undefined || input.completedAt !== undefined) {
      throw new Error(
        "execution run lifecycle same-state retry cannot change timestamps"
      );
    }

    return true;
  }

  if (!executionRunTransitionIsAllowed(current.status, input.status)) {
    throw new Error(
      `execution run lifecycle cannot transition from ${current.status} to ${input.status}`
    );
  }

  if (input.status === "running") {
    if (input.startedAt === undefined) {
      throw new Error("execution run lifecycle running transition requires startedAt");
    }

    requireValidTimestamp(input.startedAt, "startedAt");
    if (input.completedAt !== undefined) {
      throw new Error("execution run lifecycle running transition cannot have completedAt");
    }
    return false;
  }

  if (!isTerminalExecutionRunStatus(input.status)) {
    throw new Error("execution run lifecycle received an unsupported transition");
  }

  const startedAt = current.startedAt ?? (
    input.startedAt === undefined
      ? undefined
      : requireValidTimestamp(input.startedAt, "startedAt")
  );
  if (startedAt === undefined) {
    throw new Error("execution run lifecycle terminal transition requires startedAt");
  }

  if (input.completedAt === undefined) {
    throw new Error("execution run lifecycle terminal transition requires completedAt");
  }

  const completedAt = requireValidTimestamp(input.completedAt, "completedAt");
  if (completedAt.getTime() < startedAt.getTime()) {
    throw new Error("execution run lifecycle completedAt cannot precede startedAt");
  }

  return false;
};

const invalidCanonicalRevisionToken = (): never => {
  throw new Error("ContextAssembly canonicalRevisionTokens contain an invalid token");
};

const requiredRevisionString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];

  return typeof value === "string" ? value : invalidCanonicalRevisionToken();
};

const revisionSubjectType = (
  record: Record<string, unknown>
): "memory_record" | "source_claim" => {
  const value = record.subjectType;

  return value === "memory_record" || value === "source_claim"
    ? value
    : invalidCanonicalRevisionToken();
};

const optionalRevisionString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key];

  return value === undefined
    ? undefined
    : typeof value === "string"
      ? value
      : invalidCanonicalRevisionToken();
};

const canonicalRevisionTokenFrom = (item: unknown): CanonicalRevisionToken => {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return invalidCanonicalRevisionToken();
  }

  const record = item as Record<string, unknown>;
  const currentVersionId = optionalRevisionString(record, "currentVersionId");

  return {
    subjectType: revisionSubjectType(record),
    subjectId: requiredRevisionString(record, "subjectId"),
    updatedAt: requiredRevisionString(record, "updatedAt"),
    status: requiredRevisionString(record, "status"),
    ...(currentVersionId === undefined
      ? {}
      : { currentVersionId })
  };
};

const canonicalRevisionTokensFrom = (
  metadata: Record<string, unknown>
): CanonicalRevisionToken[] => {
  const value = metadata.canonicalRevisionTokens;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(canonicalRevisionTokenFrom);
};

const canonicalRevisionSubject = (
  subjectType: CanonicalRevisionToken["subjectType"],
  subjectId: string
): string => `${subjectType}:${subjectId}`;

const validateCanonicalRevisionCoverage = (
  inclusions: ContextAssembly["inclusions"],
  tokens: readonly CanonicalRevisionToken[]
): void => {
  const canonicalSubjects = new Set<string>();

  for (const inclusion of inclusions) {
    if (inclusion.subjectType !== "memory_record" && inclusion.subjectType !== "source_claim") {
      continue;
    }

    const subject = canonicalRevisionSubject(inclusion.subjectType, inclusion.subjectId);
    canonicalSubjects.add(subject);
    const matches = tokens.filter((token) => (
      canonicalRevisionSubject(token.subjectType, token.subjectId) === subject
    ));

    if (matches.length !== 1) {
      throw new Error(`createContextAssembly canonical revision coverage mismatch for ${subject}`);
    }
  }

  for (const token of tokens) {
    const subject = canonicalRevisionSubject(token.subjectType, token.subjectId);

    if (!canonicalSubjects.has(subject)) {
      throw new Error(`createContextAssembly canonical revision coverage has no inclusion for ${subject}`);
    }
  }
};

const validateMemoryRevisionToken = async (
  tx: KrnDatabaseTransaction,
  token: CanonicalRevisionToken
): Promise<void> => {
  const row = requireLinkedRow(
    (await tx
      .select({
        updatedAt: memoryRecords.updatedAt,
        status: memoryRecords.status,
        currentVersionId: memoryRecords.currentVersionId
      })
      .from(memoryRecords)
      .where(eq(memoryRecords.id, token.subjectId))
      .for("update"))[0],
    `createContextAssembly.memoryRecord.${token.subjectId}`
  );

  if (
    row.updatedAt.toISOString() !== token.updatedAt ||
    row.status !== token.status ||
    (token.currentVersionId !== undefined && row.currentVersionId !== token.currentVersionId)
  ) {
    throw new Error(`createContextAssembly canonical revision mismatch for memory record ${token.subjectId}`);
  }
};

const validateSourceRevisionToken = async (
  tx: KrnDatabaseTransaction,
  token: CanonicalRevisionToken
): Promise<void> => {
  const row = requireLinkedRow(
    (await tx
      .select({
        updatedAt: sourceClaims.updatedAt,
        status: sourceClaims.status
      })
      .from(sourceClaims)
      .where(eq(sourceClaims.id, token.subjectId))
      .for("update"))[0],
    `createContextAssembly.sourceClaim.${token.subjectId}`
  );

  if (row.updatedAt.toISOString() !== token.updatedAt || row.status !== token.status) {
    throw new Error(`createContextAssembly canonical revision mismatch for source claim ${token.subjectId}`);
  }
};

const validateCanonicalRevisionTokens = async (
  tx: KrnDatabaseTransaction,
  metadata: Record<string, unknown>
): Promise<void> => {
  for (const token of canonicalRevisionTokensFrom(metadata)) {
    if (token.subjectType === "memory_record") {
      await validateMemoryRevisionToken(tx, token);
    } else {
      await validateSourceRevisionToken(tx, token);
    }
  }
};

export const evidenceCommandsForPersistence = (
  commands: readonly EvidenceCommand[]
): EvidenceCommandReadback[] =>
  commands.map(toEvidenceCommandReadback);

interface CommandOutputArtifactPersistence {
  readonly artifact: CommandOutputArtifact;
  readonly commandOrdinal: number;
  readonly artifactSha256: string;
}

const commandOutputArtifactRefPrefix = "command-output:sha256:";

const copyCommandOutputArtifact = (
  artifact: CommandOutputArtifact
): CommandOutputArtifact => ({
  ...artifact,
  stdout: {
    ...artifact.stdout,
    bytes: Uint8Array.from(artifact.stdout.bytes)
  },
  stderr: {
    ...artifact.stderr,
    bytes: Uint8Array.from(artifact.stderr.bytes)
  }
});

type ArtifactBearingCommand = Extract<
  EvidenceCommandReadback,
  { kind: "command_runner" | "captured_output_file" }
>;

interface CommandArtifactBinding {
  readonly command: ArtifactBearingCommand;
  readonly commandOrdinal: number;
}

const commandBindsArtifact = (
  command: EvidenceCommandReadback,
  artifact: CommandOutputArtifact
): command is ArtifactBearingCommand => (
  command.kind === "command_runner" || command.kind === "captured_output_file"
) && command.outputRef === artifact.outputRef;

const commandArtifactBindings = (
  commands: readonly EvidenceCommandReadback[],
  artifact: CommandOutputArtifact
): CommandArtifactBinding[] => commands
  .flatMap((command, commandOrdinal) => commandBindsArtifact(command, artifact)
    ? [{ command, commandOrdinal }]
    : []);

const assertCommandArtifactBindingMatches = (
  binding: CommandArtifactBinding,
  artifact: CommandOutputArtifact
): void => {
  if (binding.command.command !== artifact.command) {
    throw new Error(`Command output artifact command does not match: ${artifact.outputRef}`);
  }
  if (binding.command.exitCode !== artifact.exitCode) {
    throw new Error(`Command output artifact exit code does not match: ${artifact.outputRef}`);
  }
  if (binding.command.capturedAt !== artifact.completedAt) {
    throw new Error(`Command output artifact completedAt does not match capturedAt: ${artifact.outputRef}`);
  }
  const expectedStatus = artifact.exitCode === 0 ? "passed" : "failed";
  if (binding.command.status !== expectedStatus) {
    throw new Error(`Command output artifact status does not match exit code: ${artifact.outputRef}`);
  }
};

const commandOutputArtifactsForPersistence = (
  commands: readonly EvidenceCommand[],
  artifacts: readonly CommandOutputArtifact[]
): CommandOutputArtifactPersistence[] => {
  const commandReadbacks = evidenceCommandsForPersistence(commands);
  const seenOutputRefs = new Set<string>();

  return artifacts.map((sourceArtifact) => {
    const integrity = assessCommandOutputArtifactIntegrity(sourceArtifact, sha256Hex);
    if (integrity.status === "invalid") {
      throw new Error(`Command output artifact failed integrity validation: ${integrity.reason}`);
    }

    const artifact = copyCommandOutputArtifact(sourceArtifact);
    if (seenOutputRefs.has(artifact.outputRef)) {
      throw new Error(`Command output artifact reference is duplicated: ${artifact.outputRef}`);
    }
    seenOutputRefs.add(artifact.outputRef);

    const matches = commandArtifactBindings(commandReadbacks, artifact);
    if (matches.length !== 1) {
      throw new Error(
        `Command output artifact must bind exactly one artifact-bearing command row: ${artifact.outputRef}`
      );
    }

    const match = matches[0];
    if (match === undefined) {
      throw new Error(`Command output artifact command binding is missing: ${artifact.outputRef}`);
    }
    assertCommandArtifactBindingMatches(match, artifact);

    return {
      artifact,
      commandOrdinal: match.commandOrdinal,
      artifactSha256: artifact.outputRef.slice(commandOutputArtifactRefPrefix.length)
    };
  });
};

const repositoryAuthorityMetadataKeys = new Set([
  "captureIdentity",
  "evalExecutionIdentity",
  "knowledgeUsefulnessOutcomes",
  "sourceUsefulnessOutcomes"
]);

const stripRepositoryAuthorityMetadata = (
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> => Object.fromEntries(
  Object.entries(metadata ?? {}).filter(([key]) =>
    !key.startsWith("decisionPacket") && !repositoryAuthorityMetadataKeys.has(key)
  )
);

const repositoryUnboundMetadata = (
  metadata: Record<string, unknown> | undefined,
  reason: string
): Record<string, unknown> => stampUnboundDecisionPacketAuthorityMetadata(
  stripRepositoryAuthorityMetadata(metadata),
  reason
);

const feedbackMetadataSubjectMatch = (
  field: "knowledgeId" | "sourceClaimId" | "sourceDecisionId",
  id: string
): SQL => {
  const admittedCurrentPacket = sql`(
    ${evidenceBundles.captureChannel} = ${evidenceFeedbackCaptureChannel}
    and ${feedbackDeltas.captureChannel} = ${evidenceFeedbackCaptureChannel}
    and ${feedbackDeltas.decisionPacketAuthorityAdmission} = ${decisionPacketAuthorityAdmissionCurrent}
    and ${feedbackDeltas.metadata}->>'decisionPacketAuthorityAdmission' = ${decisionPacketAuthorityAdmissionCurrent}
    and ${feedbackDeltas.metadata}->>'decisionPacketBindingState' = 'bound_current'
  )`;

  switch (field) {
    case "knowledgeId":
      return sql`${admittedCurrentPacket} and exists (
        select 1
        from jsonb_array_elements(
          coalesce(${feedbackDeltas.metadata}->'knowledgeUsefulnessOutcomes', '[]'::jsonb)
        ) as outcome
        where outcome->>'knowledgeId' = ${id}
      )`;
    case "sourceClaimId":
      return sql`${admittedCurrentPacket} and exists (
        select 1
        from jsonb_array_elements(
          coalesce(${feedbackDeltas.metadata}->'sourceUsefulnessOutcomes', '[]'::jsonb)
        ) as outcome
        where outcome->>'sourceClaimId' = ${id}
      )`;
    case "sourceDecisionId":
      return sql`${admittedCurrentPacket} and exists (
        select 1
        from jsonb_array_elements(
          coalesce(${feedbackDeltas.metadata}->'sourceUsefulnessOutcomes', '[]'::jsonb)
        ) as outcome
        where outcome->>'sourceDecisionId' = ${id}
      )`;
  }
};

const feedbackMetadataCandidateMatch = (
  field: "sourceClaimCandidates" | "sourceDecisionCandidates",
  id: string
): SQL => {
  const candidates = field === "sourceClaimCandidates"
    ? sql`coalesce(${feedbackDeltas.metadata}->'sourceClaimCandidates', '[]'::jsonb)`
    : sql`coalesce(${feedbackDeltas.metadata}->'sourceDecisionCandidates', '[]'::jsonb)`;

  return sql`exists (
    select 1
    from jsonb_array_elements(${candidates}) as candidate
    where candidate->>'id' = ${id}
  )`;
};

const feedbackMemorySourceClaimMatch = (id: string): SQL => sql`exists (
  select 1
  from jsonb_array_elements(coalesce(${feedbackDeltas.memoryCandidates}, '[]'::jsonb)) as candidate,
       jsonb_array_elements_text(coalesce(candidate->'sourceClaimIds', '[]'::jsonb)) as source_claim_id
  where source_claim_id = ${id}
)`;

const feedbackJsonCandidateSubjectMatch = (
  column: SQLWrapper,
  id: string
): SQL => sql`exists (
  select 1
  from jsonb_array_elements(coalesce(${column}, '[]'::jsonb)) as candidate
  where candidate->>'id' = ${id}
)`;

const feedbackSubjectMatch = (subject: FeedbackSubjectReference): SQL => {
  switch (subject.kind) {
    case "knowledge":
      return feedbackMetadataSubjectMatch("knowledgeId", subject.id);
    case "memory_record": {
      const knowledgeMatch = feedbackMetadataSubjectMatch("knowledgeId", subject.id);
      const candidateMatch = feedbackJsonCandidateSubjectMatch(
        feedbackDeltas.memoryCandidates,
        subject.id
      );

      return sql`(${knowledgeMatch}) or (${candidateMatch})`;
    }
    case "source_claim":
      return sql`(
        ${feedbackMetadataSubjectMatch("sourceClaimId", subject.id)}
      ) or (
        ${feedbackMetadataCandidateMatch("sourceClaimCandidates", subject.id)}
      ) or (
        ${feedbackMemorySourceClaimMatch(subject.id)}
      )`;
    case "source_decision": {
      const usefulnessMatch = feedbackMetadataSubjectMatch("sourceDecisionId", subject.id);
      const proposalMatch = feedbackMetadataCandidateMatch("sourceDecisionCandidates", subject.id);
      const candidateMatch = feedbackJsonCandidateSubjectMatch(
        feedbackDeltas.sourceDecisions,
        subject.id
      );

      return sql`(${usefulnessMatch}) or (${proposalMatch}) or (${candidateMatch})`;
    }
  }
};

const assertOrdinaryRunEventType = (
  event: CreateEvidenceBundleInput["event"]
): void => {
  if (
    event.type === executionRunLifecycleCreatedEventType ||
    event.type === executionRunLifecycleTransitionedEventType
  ) {
    throw new Error(`ordinary run event cannot use reserved lifecycle type ${event.type}`);
  }
};

export const validateEvidenceBundleInputForPersistence = (
  input: CreateEvidenceBundleInput
): CreateEvidenceBundleInput => {
  assertOrdinaryRunEventType(input.event);
  const parsed = parseEvidenceCaptureInput({
    changedFiles: input.changedFiles,
    commands: input.commands,
    diffRisk: input.diffRisk,
    reviewBurden: input.reviewBurden,
    rollbackPath: input.rollbackPath,
    metadata: input.metadata ?? {}
  });
  const commandOutputArtifacts = commandOutputArtifactsForPersistence(
    parsed.commands,
    input.commandOutputArtifacts ?? []
  ).map(({ artifact }) => artifact);

  return {
    ...input,
    changedFiles: parsed.changedFiles,
    commands: parsed.commands,
    ...(commandOutputArtifacts.length === 0 ? {} : { commandOutputArtifacts }),
    diffRisk: parsed.diffRisk,
    reviewBurden: parsed.reviewBurden,
    rollbackPath: parsed.rollbackPath,
    metadata: parsed.metadata
  };
};

const nextRunEventSequence = async (
  tx: KrnDatabaseTransaction,
  executionRunId: string,
  operation: string
): Promise<number> => {
  requireReturnedRow(
    await tx
      .select({ id: executionRuns.id })
      .from(executionRuns)
      .where(eq(executionRuns.id, executionRunId))
      .for("update"),
    `${operation}.executionRun`
  );
  const row = requireReturnedRow(
    await tx
      .select({
        sequence: sql<number>`(coalesce(max(${runEvents.sequence}), 0) + 1)::int`
      })
      .from(runEvents)
      .where(eq(runEvents.executionRunId, executionRunId)),
    `${operation}.runEventSequence`
  );

  return row.sequence;
};

const lockHarnessPlanAuthority = async (
  tx: KrnDatabaseTransaction,
  harnessPlanId: string,
  operation: string
): Promise<void> => {
  requireReturnedRow(
    await tx
      .select({ id: harnessPlans.id })
      .from(harnessPlans)
      .where(eq(harnessPlans.id, harnessPlanId))
      .for("update"),
    `${operation}.harnessPlan`
  );
};

const evidenceFeedbackCaptureChannel = "evidence_feedback_v1" as const;
const evalFeedbackCaptureChannel = "eval_feedback_v1" as const;

type EvidenceCommandArtifactRow = typeof evidenceCommandArtifacts.$inferSelect;

const findCommandOutputArtifactRows = async (
  db: KrnDatabase | KrnDatabaseTransaction,
  evidenceBundleIds: readonly string[]
): Promise<EvidenceCommandArtifactRow[]> => evidenceBundleIds.length === 0
  ? []
  : db.query.evidenceCommandArtifacts.findMany({
      where: inArray(evidenceCommandArtifacts.evidenceBundleId, [...evidenceBundleIds]),
      orderBy: [
        asc(evidenceCommandArtifacts.evidenceBundleId),
        asc(evidenceCommandArtifacts.commandOrdinal)
      ]
    });

const commandOutputArtifactRowsByBundleId = (
  rows: readonly EvidenceCommandArtifactRow[]
): ReadonlyMap<string, readonly EvidenceCommandArtifactRow[]> => {
  const grouped = new Map<string, EvidenceCommandArtifactRow[]>();

  for (const row of rows) {
    const bundleRows = grouped.get(row.evidenceBundleId) ?? [];
    bundleRows.push(row);
    grouped.set(row.evidenceBundleId, bundleRows);
  }

  return grouped;
};

const metadataForEvidenceAuthorityRead = (
  metadata: Record<string, unknown>,
  captureChannel: string | null
): Record<string, unknown> => captureChannel === evidenceFeedbackCaptureChannel
  ? metadata
  : repositoryUnboundMetadata(
      metadata,
      "The owning evidence capture channel does not admit DecisionPacket authority."
    );

const mapEvidenceBundleForAuthorityRead = (
  row: typeof evidenceBundles.$inferSelect,
  commandOutputArtifactRows: readonly EvidenceCommandArtifactRow[] = []
): EvidenceBundle => mapEvidenceBundle({
  ...row,
  metadata: metadataForEvidenceAuthorityRead(row.metadata, row.captureChannel)
}, commandOutputArtifactRows.map(mapCommandOutputArtifact));

const mapFeedbackDeltaForAuthorityRead = (
  row: typeof feedbackDeltas.$inferSelect,
  captureChannel: string | null
): FeedbackDelta => mapFeedbackDelta({
  ...row,
  metadata: captureChannel === evidenceFeedbackCaptureChannel &&
    row.captureChannel === evidenceFeedbackCaptureChannel &&
    row.decisionPacketAuthorityAdmission === decisionPacketAuthorityAdmissionCurrent
    ? row.metadata
    : repositoryUnboundMetadata(
        row.metadata,
        "The feedback row lacks structural DecisionPacket authority admission."
      )
});

interface EvidenceCaptureIdentity {
  readonly identity: string;
  readonly channel:
    | typeof evidenceFeedbackCaptureChannel
    | typeof evalFeedbackCaptureChannel;
}

const insertEvidenceBundleAndEvent = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceBundleInput,
  operation: string,
  capture?: EvidenceCaptureIdentity
) => {
  const commandArtifacts = commandOutputArtifactsForPersistence(
    input.commands,
    input.commandOutputArtifacts ?? []
  );
  const eventSequence = await nextRunEventSequence(
    tx,
    input.executionRunId,
    operation
  );
  const row = requireReturnedRow(
    await tx
      .insert(evidenceBundles)
      .values({
        executionRunId: input.executionRunId,
        ...(capture === undefined
          ? {}
          : {
              captureIdentity: capture.identity,
              captureChannel: capture.channel
            }),
        status: input.status ?? "captured",
        changedFiles: input.changedFiles,
        commands: evidenceCommandsForPersistence(input.commands),
        diffRisk: input.diffRisk,
        reviewBurden: input.reviewBurden,
        rollbackPath: input.rollbackPath,
        metadata: input.metadata ?? {}
      })
      .returning(),
    operation
  );

  const commandOutputArtifactRows = commandArtifacts.length === 0
    ? []
    : (await tx
      .insert(evidenceCommandArtifacts)
      .values(commandArtifacts.map(({ artifact, artifactSha256, commandOrdinal }) => ({
        evidenceBundleId: row.id,
        commandOrdinal,
        command: artifact.command,
        exitCode: artifact.exitCode,
        startedAt: fromIsoTimestamp(artifact.startedAt),
        completedAt: fromIsoTimestamp(artifact.completedAt),
        stdoutBytes: artifact.stdout.bytes,
        stderrBytes: artifact.stderr.bytes,
        stdoutTotalByteCount: artifact.stdout.totalByteCount,
        stderrTotalByteCount: artifact.stderr.totalByteCount,
        stdoutTruncated: artifact.stdout.truncated,
        stderrTruncated: artifact.stderr.truncated,
        stdoutSha256: artifact.stdout.sha256,
        stderrSha256: artifact.stderr.sha256,
        artifactSha256,
        outputRef: artifact.outputRef
      })))
      .returning())
      .sort((left, right) => left.commandOrdinal - right.commandOrdinal);

  await tx.insert(runEvents).values({
    executionRunId: input.executionRunId,
    sequence: eventSequence,
    type: input.event.type,
    severity: input.event.severity ?? "info",
    message: input.event.message,
    payload: input.event.payload ?? {}
  });

  return { commandOutputArtifactRows, evidenceBundleRow: row };
};

export type EvidenceFeedbackPersistenceStage =
  | "after_evidence_bundle"
  | "after_review_assessment"
  | "after_feedback_delta"
  | "after_maintenance_queue";

export interface DrizzleHarnessRunRepositoryOptions {
  faultAfterStage?: (stage: EvidenceFeedbackPersistenceStage) => void;
  readTargetStateSnapshot?: (targetRepo: string) => Promise<TargetStateSnapshot>;
}

const findCaptureEvidenceBundle = (
  tx: KrnDatabase,
  executionRunId: string,
  captureIdentity: string
) => tx.query.evidenceBundles.findFirst({
  where: and(
    eq(evidenceBundles.executionRunId, executionRunId),
    eq(evidenceBundles.captureIdentity, captureIdentity)
  )
});

const requireCaptureChainChildren = async (
  tx: KrnDatabase,
  input: {
    evidenceBundleId: string;
    captureChannel:
      | typeof evidenceFeedbackCaptureChannel
      | typeof evalFeedbackCaptureChannel;
    identity: string;
    label: "Evidence feedback" | "Eval feedback";
  }
) => {
  const reviewAssessmentRow = await tx.query.reviewAssessments.findFirst({
    where: and(
      eq(reviewAssessments.evidenceBundleId, input.evidenceBundleId),
      eq(reviewAssessments.captureChannel, input.captureChannel)
    )
  });

  if (reviewAssessmentRow === undefined) {
    throw new Error(
      `${input.label} persistence is incomplete for ${input.identity}: review assessment missing`
    );
  }

  const feedbackDeltaRow = await tx.query.feedbackDeltas.findFirst({
    where: and(
      eq(feedbackDeltas.reviewAssessmentId, reviewAssessmentRow.id),
      eq(feedbackDeltas.captureChannel, input.captureChannel)
    )
  });

  if (feedbackDeltaRow === undefined) {
    throw new Error(
      `${input.label} persistence is incomplete for ${input.identity}: feedback delta missing`
    );
  }

  return { feedbackDeltaRow, reviewAssessmentRow };
};

const existingEvidenceFeedbackOnceResult = async (
  tx: KrnDatabase,
  input: CreateEvidenceFeedbackOnceInput,
  captureIdentity: string
): Promise<CreateEvidenceFeedbackOnceResult | undefined> => {
  const evidenceBundleRow = await findCaptureEvidenceBundle(
    tx,
    input.executionRunId,
    captureIdentity
  );

  if (evidenceBundleRow === undefined) {
    return undefined;
  }

  if (evidenceBundleRow.captureChannel !== evidenceFeedbackCaptureChannel) {
    throw new Error(
      `createEvidenceFeedbackOnce rejected: capture identity collision for ${captureIdentity} is not repository-owned evidence feedback`
    );
  }

  const { feedbackDeltaRow, reviewAssessmentRow } = await requireCaptureChainChildren(
    tx,
    {
      evidenceBundleId: evidenceBundleRow.id,
      captureChannel: evidenceFeedbackCaptureChannel,
      identity: captureIdentity,
      label: "Evidence feedback"
    }
  );
  if (
    (feedbackDeltaRow.decisionPacketAuthorityAdmission ===
      decisionPacketAuthorityAdmissionCurrent) !==
    isAdmittedCurrentDecisionPacketAuthorityMetadata(feedbackDeltaRow.metadata)
  ) {
    throw new Error(
      `createEvidenceFeedbackOnce rejected: feedback authority provenance is inconsistent for ${captureIdentity}`
    );
  }

  const feedbackMaintenanceQueueRecordId = (await tx.query.maintenanceQueues.findFirst({
    where: and(
      eq(maintenanceQueues.jobType, "review_feedback_delta"),
      sql`${maintenanceQueues.payload}->>'feedbackDeltaId' = ${feedbackDeltaRow.id}`
    )
  }))?.id;
  const commandOutputArtifactRows = await findCommandOutputArtifactRows(
    tx,
    [evidenceBundleRow.id]
  );

  return {
    evidenceBundle: mapEvidenceBundle(
      evidenceBundleRow,
      commandOutputArtifactRows.map(mapCommandOutputArtifact)
    ),
    reviewAssessment: mapReviewAssessment(reviewAssessmentRow),
    feedbackDelta: mapFeedbackDelta(feedbackDeltaRow),
    ...(feedbackMaintenanceQueueRecordId === undefined
      ? {}
      : { feedbackMaintenanceQueueRecordId }),
    created: false
  };
};

const existingEvalFeedbackOnceResult = async (
  tx: KrnDatabase,
  input: CreateEvalFeedbackDeltaOnceInput,
  executionIdentity: string,
  captureIdentity: string
): Promise<CreateEvalFeedbackDeltaOnceResult | undefined> => {
  const evidenceBundleRow = await findCaptureEvidenceBundle(
    tx,
    input.executionRunId,
    captureIdentity
  );

  if (evidenceBundleRow === undefined) {
    return undefined;
  }

  if (
    evidenceBundleRow.captureChannel !== evalFeedbackCaptureChannel ||
    readMetadataString(evidenceBundleRow.metadata, "evalExecutionIdentity") !==
      executionIdentity
  ) {
    throw new Error(
      `createEvalFeedbackDeltaOnce rejected: reserved capture identity collision for ${executionIdentity}`
    );
  }

  const { feedbackDeltaRow, reviewAssessmentRow } = await requireCaptureChainChildren(
    tx,
    {
      evidenceBundleId: evidenceBundleRow.id,
      captureChannel: evalFeedbackCaptureChannel,
      identity: executionIdentity,
      label: "Eval feedback"
    }
  );
  const commandOutputArtifactRows = await findCommandOutputArtifactRows(
    tx,
    [evidenceBundleRow.id]
  );

  return {
    evidenceBundle: mapEvidenceBundle(
      evidenceBundleRow,
      commandOutputArtifactRows.map(mapCommandOutputArtifact)
    ),
    reviewAssessment: mapReviewAssessment(reviewAssessmentRow),
    feedbackDelta: mapFeedbackDelta(feedbackDeltaRow),
    created: false
  };
};

const assertNoLegacyEvalFeedbackIdentity = async (
  tx: KrnDatabase,
  input: CreateEvalFeedbackDeltaOnceInput,
  executionIdentity: string
): Promise<void> => {
  const legacyEvidenceBundleRow = await tx.query.evidenceBundles.findFirst({
    where: and(
      eq(evidenceBundles.executionRunId, input.executionRunId),
      isNull(evidenceBundles.captureIdentity),
      sql`${evidenceBundles.metadata}->>'evalExecutionIdentity' = ${executionIdentity}`
    )
  });

  if (legacyEvidenceBundleRow !== undefined) {
    throw new Error(
      `createEvalFeedbackDeltaOnce rejected: legacy eval identity ${executionIdentity} cannot be trusted as repository-owned capture identity`
    );
  }
};

interface LockedHarnessRunAuthority {
  projectId: ProjectId;
  lifecycleRevision: number;
}

const lockHarnessRunAuthority = async (
  tx: KrnDatabaseTransaction,
  input: {
    executionRunId: string;
    projectId: ProjectId;
  },
  operation:
    | "createEvidenceFeedbackOnce"
    | "createEvalFeedbackDeltaOnce"
    | "recordUsefulnessApplicationOnce"
): Promise<LockedHarnessRunAuthority> => {
  const linkedRun = await tx
    .select({
      projectId: taskContracts.projectId,
      lifecycleRevision: executionRuns.lifecycleRevision
    })
    .from(executionRuns)
    .innerJoin(harnessPlans, eq(executionRuns.harnessPlanId, harnessPlans.id))
    .innerJoin(taskContracts, eq(harnessPlans.taskContractId, taskContracts.id))
    .where(eq(executionRuns.id, input.executionRunId))
    .limit(1)
    .for("update", { of: executionRuns });
  const lockedRun = linkedRun[0];

  if (lockedRun === undefined || lockedRun.projectId !== input.projectId) {
    throw new Error(
      `${operation} rejected: execution run project does not match declared project`
    );
  }

  return {
    projectId: input.projectId,
    lifecycleRevision: lockedRun.lifecycleRevision
  };
};

const assertSourceRunLifecycleRevision = (
  operation:
    | "createEvidenceFeedbackOnce"
    | "createEvalFeedbackDeltaOnce"
    | "recordUsefulnessApplicationOnce",
  executionRunId: string,
  expectedLifecycleRevision: number,
  lockedRun: LockedHarnessRunAuthority
): void => {
  if (!Number.isSafeInteger(expectedLifecycleRevision) || expectedLifecycleRevision < 1) {
    throw new Error(`${operation} requires a positive lifecycle revision`);
  }

  if (lockedRun.lifecycleRevision !== expectedLifecycleRevision) {
    throw new ExecutionRunLifecycleConflictError({
      kind: "revision",
      executionRunId,
      expectedLifecycleRevision,
      actualLifecycleRevision: lockedRun.lifecycleRevision
    });
  }
};

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const snapshotRepositoryInput = <TInput>(input: TInput): TInput =>
  structuredClone(input);

const evidenceFeedbackAuthoritySnapshot = (
  input: CreateEvidenceFeedbackOnceInput
): CreateEvidenceFeedbackOnceInput => snapshotRepositoryInput(input);

type ApplicationBoundOutcome = {
  applicationId?: string;
  appliedAt?: string;
  outcome: string;
  reason: string;
};

interface UsefulnessSubjectIdentity {
  kind: UsefulnessApplicationEvidence["subjectKind"];
  id: string;
}

const downgradeUnprovedHelped = <TOutcome extends ApplicationBoundOutcome>(
  outcome: TOutcome,
  reason: string
): TOutcome => ({
  ...outcome,
  outcome: "unknown",
  reason: `${reason} Original reason: ${outcome.reason}`
});

const downgradeUnprovedApplication = <TOutcome extends ApplicationBoundOutcome>(
  outcome: TOutcome,
  reason: string
): TOutcome => ({
  ...outcome,
  outcome: outcome.outcome === "helped" ? "unknown" : "selected",
  reason: `${reason} Original reason: ${outcome.reason}`
});

const snapshotMatchesApplicationTarget = (
  snapshot: TargetStateSnapshot,
  target: NonNullable<UsefulnessApplicationEvidence["targetState"]>
): boolean => snapshot.treeIdentity === target.treeIdentity &&
  snapshot.patchIdentity === target.patchIdentity &&
  JSON.stringify([...snapshot.changedPaths].sort()) ===
    JSON.stringify([...target.changedFiles].sort());

const applicationTargetMatchesCapture = async (
  application: UsefulnessApplicationEvidence,
  capture: CreateEvidenceFeedbackOnceInput,
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>
): Promise<boolean> => {
  const target = targetEvidenceFromMetadata(capture.evidence.metadata?.["targetEvidence"]);
  const applicationTarget = application.targetState;

  if (applicationTarget === undefined || !targetEvidenceClaimsFreshOwnedPatch(target)) {
    return false;
  }
  const snapshot = await readTargetStateSnapshot(target.targetRepo);

  return snapshotMatchesApplicationTarget(snapshot, applicationTarget) &&
    target.targetRepo === applicationTarget.targetRepo &&
    target.treeIdentity === applicationTarget.treeIdentity &&
    target.patchIdentity === applicationTarget.patchIdentity &&
    JSON.stringify(target.changedFiles.map((file) => file.path).sort()) ===
      JSON.stringify([...applicationTarget.changedFiles].sort());
};

const verificationFollowsApplication = (input: {
  evidence: CreateEvidenceFeedbackOnceInput["evidence"];
  requiredCommands: ReadonlySet<string>;
  appliedAt: string;
}): boolean => {
  const artifactsByRef = new Map(
    (input.evidence.commandOutputArtifacts ?? []).map((artifact) => [artifact.outputRef, artifact])
  );

  return input.evidence.commands
  .map(toEvidenceCommandReadback)
  .filter((command): command is Extract<EvidenceCommandReadback, { kind: "command_runner" }> =>
    command.kind === "command_runner" && input.requiredCommands.has(command.command)
  )
  .every((command) => command.outputRef !== undefined &&
    Date.parse(artifactsByRef.get(command.outputRef)?.startedAt ?? "") >
      Date.parse(input.appliedAt) &&
    Date.parse(command.capturedAt) > Date.parse(input.appliedAt));
};

const applicationForBoundOutcome = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceFeedbackOnceInput,
  aggregate: HarnessRunAggregate,
  outcome: ApplicationBoundOutcome,
  subject: UsefulnessSubjectIdentity
): Promise<UsefulnessApplicationEvidence | undefined> => {
  if (outcome.applicationId === undefined || outcome.appliedAt === undefined) {
    return undefined;
  }
  if (subject.kind === "source_decision") {
    return undefined;
  }
  const row = await tx.query.usefulnessApplications.findFirst({
    where: eq(usefulnessApplications.applicationId, outcome.applicationId)
  });
  if (row === undefined || input.decisionPacketClaim === undefined) {
    return undefined;
  }
  const application = mapUsefulnessApplication(row);
  const parsed = parseUsefulnessApplicationEvidenceForIdentity(application, {
    applicationId: outcome.applicationId,
    subjectKind: subject.kind,
    subjectId: subject.id,
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    taskContractId: aggregate.taskContract.id,
    packetChecksum: input.decisionPacketClaim.checksum,
    packetGeneratedAt: input.decisionPacketClaim.generatedAt,
    sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
    ...(application.targetState === undefined
      ? {}
      : { targetState: application.targetState })
  });
  return parsed !== undefined &&
    Date.parse(parsed.appliedAt) === Date.parse(outcome.appliedAt)
    ? parsed
    : undefined;
};

const admitApplicationBoundOutcome = async <TOutcome extends ApplicationBoundOutcome>(input: {
  tx: KrnDatabaseTransaction;
  capture: CreateEvidenceFeedbackOnceInput;
  aggregate: HarnessRunAggregate;
  outcome: TOutcome;
  subject: UsefulnessSubjectIdentity;
  strictProofEligible: boolean;
  requiredCommands: ReadonlySet<string>;
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>;
}): Promise<TOutcome> => {
  if (input.outcome.outcome !== "used" && input.outcome.outcome !== "helped") {
    return { ...input.outcome };
  }
  const application = await applicationForBoundOutcome(
    input.tx,
    input.capture,
    input.aggregate,
    input.outcome,
    input.subject
  );
  if (application === undefined) {
    return downgradeUnprovedApplication(
      input.outcome,
      "Usefulness was downgraded because exact persisted application evidence is missing."
    );
  }
  if (!await applicationTargetMatchesCapture(
    application,
    input.capture,
    input.readTargetStateSnapshot
  )) {
    return downgradeUnprovedApplication(
      input.outcome,
      "Usefulness was downgraded because fresh subject-owned target state does not match the persisted application."
    );
  }
  if (input.outcome.outcome === "used") {
    return { ...input.outcome };
  }
  if (!input.strictProofEligible || !verificationFollowsApplication({
    evidence: input.capture.evidence,
    requiredCommands: input.requiredCommands,
    appliedAt: application.appliedAt
  })) {
    return downgradeUnprovedHelped(
      input.outcome,
      "Helped was downgraded because strict verification after application is missing."
    );
  }
  return { ...input.outcome };
};

const remainsMaintenanceEligible = (
  requested: { readonly outcome: string } | undefined,
  admitted: { readonly outcome: SourceUsefulnessOutcome }
): boolean => requested?.outcome === "helped"
  ? admitted.outcome === "helped"
  : isReviewableFeedbackOutcome(admitted.outcome);

interface AdmittedDecisionPacketIdentity {
  checksum: string;
  generatedAt: string;
  sourceRunLifecycleRevision: number;
}

interface HelpedProofContext {
  eligible: boolean;
  requiredCommands: ReadonlySet<string>;
}

const unboundEvidenceFeedbackInput = (
  input: CreateEvidenceFeedbackOnceInput,
): CreateEvidenceFeedbackOnceInput => {
  const { maintenance: _maintenance, ...unboundInput } = input;

  return {
    ...unboundInput,
    evidence: {
      ...input.evidence,
      metadata: stampUnboundDecisionPacketAuthorityMetadata(
        stripRepositoryAuthorityMetadata(input.evidence.metadata),
        "No DecisionPacket claim was admitted by the repository."
      )
    },
    feedback: {
      ...input.feedback,
      metadata: stampUnboundDecisionPacketAuthorityMetadata(
        stripRepositoryAuthorityMetadata(input.feedback.metadata),
        "No DecisionPacket claim was admitted by the repository."
      )
    }
  };
};

const admitDecisionPacketIdentity = (
  input: CreateEvidenceFeedbackOnceInput & {
    decisionPacketClaim: NonNullable<CreateEvidenceFeedbackOnceInput["decisionPacketClaim"]>;
  },
  aggregate: HarnessRunAggregate
): AdmittedDecisionPacketIdentity => {
  const claim = input.decisionPacketClaim;
  const authorization = authorizeDecisionPacketUsefulness({
    aggregate,
    runId: input.executionRunId,
    runtimeProjectId: input.projectId,
    callerPacketChecksum: claim.checksum,
    callerPacketGeneratedAt: claim.generatedAt,
    subjects: projectDecisionPacketUsefulnessSubjects({
      sourceUsefulnessOutcomes: input.sourceUsefulnessOutcomes,
      knowledgeUsefulnessOutcomes: input.knowledgeUsefulnessOutcomes
    }),
    sha256Hex
  });

  if (!authorization.authorized) {
    throw new Error(`createEvidenceFeedbackOnce rejected: ${authorization.reason}`);
  }

  return {
    checksum: authorization.packetChecksum,
    generatedAt: authorization.packetGeneratedAt,
    sourceRunLifecycleRevision: authorization.sourceRunLifecycleRevision
  };
};

const helpedProofContext = (
  input: CreateEvidenceFeedbackOnceInput,
  aggregate: HarnessRunAggregate,
  authorityIdentity: AdmittedDecisionPacketIdentity
): HelpedProofContext => {
  const activation = decideEvidenceContractActivation({
    evidenceContract: aggregate.harnessPlan.metadata.evidenceContract,
    taskContract: aggregate.taskContract,
    harnessPlan: aggregate.harnessPlan,
    executionRun: aggregate.executionRun
  });
  const evidenceContract = activation.status === "active"
    ? activation.evidenceContract
    : undefined;
  const strictProof = assessCurrentDecisionPacketHelpedProof({
    evidence: input.evidence,
    evidenceContract,
    authority: authorityIdentity,
    createdAt: new Date().toISOString(),
    sha256Hex
  });

  return {
    eligible: strictProof.status === "eligible",
    requiredCommands: new Set(evidenceContract?.commands
      .filter((command) => command.required)
      .map((command) => command.command) ?? [])
  };
};

type SourceUsefulnessInput = NonNullable<
  CreateEvidenceFeedbackOnceInput["sourceUsefulnessOutcomes"]
>[number];

const sourceUsefulnessSubject = (
  outcome: SourceUsefulnessInput
): UsefulnessSubjectIdentity => {
  if (outcome.sourceDecisionId !== undefined) {
    return { kind: "source_decision", id: outcome.sourceDecisionId };
  }
  if (outcome.sourceClaimId !== undefined) {
    return { kind: "source_claim", id: outcome.sourceClaimId };
  }
  throw new Error("createEvidenceFeedbackOnce source outcome has no subject identity");
};

const admitUsefulnessOutcomes = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceFeedbackOnceInput,
  aggregate: HarnessRunAggregate,
  proof: HelpedProofContext,
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>
) => {
  const sourceUsefulnessOutcomes = await Promise.all(
    (input.sourceUsefulnessOutcomes ?? []).map((outcome) => admitApplicationBoundOutcome({
      tx,
      capture: input,
      aggregate,
      outcome,
      subject: sourceUsefulnessSubject(outcome),
      strictProofEligible: proof.eligible,
      requiredCommands: proof.requiredCommands,
      readTargetStateSnapshot
    }))
  );
  const knowledgeUsefulnessOutcomes = await Promise.all(
    (input.knowledgeUsefulnessOutcomes ?? []).map((outcome) => admitApplicationBoundOutcome({
      tx,
      capture: input,
      aggregate,
      outcome,
      subject: { kind: "knowledge", id: outcome.knowledgeId },
      strictProofEligible: proof.eligible,
      requiredCommands: proof.requiredCommands,
      readTargetStateSnapshot
    }))
  );

  return { sourceUsefulnessOutcomes, knowledgeUsefulnessOutcomes };
};

const applicationBoundEvidenceFeedbackInput = (
  input: CreateEvidenceFeedbackOnceInput,
  authorityIdentity: AdmittedDecisionPacketIdentity,
  admitted: Awaited<ReturnType<typeof admitUsefulnessOutcomes>>
): CreateEvidenceFeedbackOnceInput => {
  const { sourceUsefulnessOutcomes, knowledgeUsefulnessOutcomes } = admitted;
  const keepMaintenance = sourceUsefulnessOutcomes.some((outcome, index) =>
    remainsMaintenanceEligible(input.sourceUsefulnessOutcomes?.[index], outcome)
  ) || knowledgeUsefulnessOutcomes.some((outcome, index) =>
    remainsMaintenanceEligible(input.knowledgeUsefulnessOutcomes?.[index], outcome)
  );
  const { maintenance: _maintenance, ...applicationBoundInput } = input;

  return {
    ...applicationBoundInput,
    ...(keepMaintenance && input.maintenance !== undefined
      ? { maintenance: input.maintenance }
      : {}),
    evidence: {
      ...input.evidence,
      metadata: stampCurrentDecisionPacketAuthorityMetadata(
        stripRepositoryAuthorityMetadata(input.evidence.metadata),
        authorityIdentity
      )
    },
    feedback: {
      ...input.feedback,
      metadata: {
        ...stampCurrentDecisionPacketAuthorityMetadata(
          stripRepositoryAuthorityMetadata(input.feedback.metadata),
          authorityIdentity
        ),
        ...(sourceUsefulnessOutcomes.length === 0
          ? {}
          : { sourceUsefulnessOutcomes: [...sourceUsefulnessOutcomes] }),
        ...(knowledgeUsefulnessOutcomes.length === 0
          ? {}
          : { knowledgeUsefulnessOutcomes: [...knowledgeUsefulnessOutcomes] })
      }
    }
  };
};

const evidenceFeedbackInputWithRepositoryAuthority = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceFeedbackOnceInput,
  aggregate: HarnessRunAggregate,
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>
): Promise<CreateEvidenceFeedbackOnceInput> => {
  if (input.decisionPacketClaim === undefined) {
    return unboundEvidenceFeedbackInput(input);
  }
  const boundInput = {
    ...input,
    decisionPacketClaim: input.decisionPacketClaim
  };
  const authorityIdentity = admitDecisionPacketIdentity(boundInput, aggregate);
  const proof = helpedProofContext(input, aggregate, authorityIdentity);
  const admitted = await admitUsefulnessOutcomes(
    tx,
    input,
    aggregate,
    proof,
    readTargetStateSnapshot
  );

  return applicationBoundEvidenceFeedbackInput(input, authorityIdentity, admitted);
};

const insertEvidenceReviewAssessment = async (
  tx: KrnDatabase,
  input: CreateEvidenceFeedbackOnceInput,
  evidenceBundleId: string
) => requireReturnedRow(
  await tx
    .insert(reviewAssessments)
    .values({
      evidenceBundleId,
      captureChannel: evidenceFeedbackCaptureChannel,
      status: input.review.status ?? "pending",
      reviewer: input.review.reviewer,
      summary: input.review.summary,
      findings: input.review.findings,
      metadata: input.review.metadata ?? {}
    })
    .returning(),
  "createEvidenceFeedbackOnce.reviewAssessment"
);

const insertEvidenceFeedbackDelta = async (
  tx: KrnDatabase,
  input: CreateEvidenceFeedbackOnceInput,
  reviewAssessmentId: string,
  captureIdentity: string
) => requireReturnedRow(
  await tx
    .insert(feedbackDeltas)
    .values({
      reviewAssessmentId,
      captureChannel: evidenceFeedbackCaptureChannel,
      ...(isAdmittedCurrentDecisionPacketAuthorityMetadata(input.feedback.metadata ?? {})
        ? { decisionPacketAuthorityAdmission: decisionPacketAuthorityAdmissionCurrent }
        : {}),
      status: input.feedback.status ?? "candidate",
      memoryCandidates: input.feedback.memoryCandidates,
      sourceDecisions: input.feedback.sourceDecisions,
      evalCandidates: input.feedback.evalCandidates,
      metadata: {
        ...(input.feedback.metadata ?? {}),
        captureIdentity,
        projectId: input.projectId
      }
    })
    .returning(),
  "createEvidenceFeedbackOnce.feedbackDelta"
);

const insertEvidenceFeedbackMaintenanceQueue = async (
  tx: KrnDatabase,
  input: CreateEvidenceFeedbackOnceInput,
  feedbackDeltaId: string
): Promise<string | undefined> => input.maintenance === undefined
  ? undefined
  : requireReturnedRow(
      await tx
        .insert(maintenanceQueues)
        .values({
          jobType: "review_feedback_delta",
          queueKey: maintenanceQueueRecordKeyForJob({
            jobType: "review_feedback_delta",
            payload: {
              projectId: input.projectId,
              feedbackDeltaId,
              reason: input.maintenance.reason
            }
          }),
          payload: {
            projectId: input.projectId,
            feedbackDeltaId,
            reason: input.maintenance.reason
          }
        })
        .returning(),
      "createEvidenceFeedbackOnce.maintenanceQueue"
    ).id;

const insertEvidenceFeedbackChain = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceFeedbackOnceInput,
  captureIdentity: string,
  faultAfterStage?: (stage: EvidenceFeedbackPersistenceStage) => void
): Promise<CreateEvidenceFeedbackOnceResult> => {
  const evidenceInput = validateEvidenceBundleInputForPersistence({
    ...input.evidence,
    executionRunId: input.executionRunId,
    metadata: {
      ...(input.evidence.metadata ?? {}),
      captureIdentity,
      projectId: input.projectId
    }
  });
  const { commandOutputArtifactRows, evidenceBundleRow } = await insertEvidenceBundleAndEvent(
    tx,
    evidenceInput,
    "createEvidenceFeedbackOnce.evidenceBundle",
    {
      identity: captureIdentity,
      channel: evidenceFeedbackCaptureChannel
    }
  );
  faultAfterStage?.("after_evidence_bundle");
  const reviewAssessmentRow = await insertEvidenceReviewAssessment(
    tx,
    input,
    evidenceBundleRow.id
  );
  faultAfterStage?.("after_review_assessment");
  const feedbackDeltaRow = await insertEvidenceFeedbackDelta(
    tx,
    input,
    reviewAssessmentRow.id,
    captureIdentity
  );

  await tx.insert(outboxEvents).values({
    topic: "feedback.delta.created",
    payload: {
      feedbackDeltaId: feedbackDeltaRow.id,
      reviewAssessmentId: reviewAssessmentRow.id,
      captureIdentity,
      projectId: input.projectId
    }
  });
  faultAfterStage?.("after_feedback_delta");

  const feedbackMaintenanceQueueRecordId = await insertEvidenceFeedbackMaintenanceQueue(
    tx,
    input,
    feedbackDeltaRow.id
  );
  faultAfterStage?.("after_maintenance_queue");

  return {
    evidenceBundle: mapEvidenceBundle(
      evidenceBundleRow,
      commandOutputArtifactRows.map(mapCommandOutputArtifact)
    ),
    reviewAssessment: mapReviewAssessment(reviewAssessmentRow),
    feedbackDelta: mapFeedbackDelta(feedbackDeltaRow),
    ...(feedbackMaintenanceQueueRecordId === undefined
      ? {}
      : { feedbackMaintenanceQueueRecordId }),
    created: true
  };
};

type UsefulnessApplicationRow = typeof usefulnessApplications.$inferSelect;

const mapUsefulnessApplication = (
  row: UsefulnessApplicationRow
): UsefulnessApplicationEvidence => ({
  applicationId: row.applicationId,
  subjectKind: row.subjectKind,
  subjectId: row.subjectId,
  projectId: row.projectId,
  executionRunId: row.executionRunId,
  taskContractId: row.taskContractId,
  packetChecksum: row.packetChecksum,
  packetGeneratedAt: row.packetGeneratedAt.toISOString(),
  sourceRunLifecycleRevision: row.sourceRunLifecycleRevision,
  ...(row.targetState === null ? {} : { targetState: row.targetState }),
  appliedAt: row.appliedAt.toISOString()
});

const sameUsefulnessApplication = (
  left: UsefulnessApplicationEvidence,
  right: UsefulnessApplicationEvidenceIdentity
): boolean => parseUsefulnessApplicationEvidenceForIdentity(left, right) !== undefined;

const requireCurrentApplicationTarget = async (
  application: UsefulnessApplicationEvidenceIdentity,
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>
): Promise<void> => {
  if (application.targetState === undefined) {
    return;
  }
  const snapshot = await readTargetStateSnapshot(application.targetState.targetRepo);
  if (!snapshotMatchesApplicationTarget(snapshot, application.targetState)) {
    throw new Error(
      "recordUsefulnessApplicationOnce rejected: target state does not match the current repository patch"
    );
  }
};

export class DrizzleHarnessRunRepository implements HarnessRunRepository {
  constructor(
    private readonly db: KrnDatabase,
    private readonly options: DrizzleHarnessRunRepositoryOptions = {}
  ) {}

  private async findHarnessRunSpineRows(
    db: KrnDatabase | KrnDatabaseTransaction,
    executionRunId: string
  ) {
    const executionRunRow = await db.query.executionRuns.findFirst({
      where: eq(executionRuns.id, executionRunId)
    });

    if (executionRunRow === undefined) {
      return undefined;
    }

    const harnessPlanRow = requireLinkedRow(
      await db.query.harnessPlans.findFirst({
        where: eq(harnessPlans.id, executionRunRow.harnessPlanId)
      }),
      "getHarnessRunByExecutionRunId.harnessPlan"
    );
    const taskContractRow = requireLinkedRow(
      await db.query.taskContracts.findFirst({
        where: eq(taskContracts.id, harnessPlanRow.taskContractId)
      }),
      "getHarnessRunByExecutionRunId.taskContract"
    );
    const operatorIntentRow = requireLinkedRow(
      await db.query.operatorIntents.findFirst({
        where: eq(operatorIntents.id, taskContractRow.operatorIntentId)
      }),
      "getHarnessRunByExecutionRunId.operatorIntent"
    );

    return {
      executionRunRow,
      harnessPlanRow,
      taskContractRow,
      operatorIntentRow
    };
  }

  private async findEvidenceReviewFeedbackRows(
    db: KrnDatabase | KrnDatabaseTransaction,
    executionRunId: string
  ) {
    const evidenceBundleRows = await db.query.evidenceBundles.findMany({
      where: eq(evidenceBundles.executionRunId, executionRunId),
      orderBy: [asc(evidenceBundles.createdAt), asc(evidenceBundles.id)]
    });
    const evidenceBundleIds = evidenceBundleRows.map((row) => row.id);
    const commandOutputArtifactRows = await findCommandOutputArtifactRows(db, evidenceBundleIds);
    const reviewAssessmentRows =
      evidenceBundleIds.length === 0
        ? []
        : await db.query.reviewAssessments.findMany({
            where: inArray(reviewAssessments.evidenceBundleId, evidenceBundleIds),
            orderBy: [asc(reviewAssessments.createdAt), asc(reviewAssessments.id)]
          });
    const reviewAssessmentIds = reviewAssessmentRows.map((row) => row.id);
    const feedbackDeltaRows =
      reviewAssessmentIds.length === 0
        ? []
        : await db.query.feedbackDeltas.findMany({
            where: inArray(feedbackDeltas.reviewAssessmentId, reviewAssessmentIds),
            orderBy: [asc(feedbackDeltas.createdAt), asc(feedbackDeltas.id)]
          });

    return {
      commandOutputArtifactRows,
      evidenceBundleRows,
      reviewAssessmentRows,
      feedbackDeltaRows
    };
  }

  private async findActivationTrace(
    db: KrnDatabase | KrnDatabaseTransaction,
    contextAssembly: ContextAssembly | undefined,
    taskContract: Pick<TaskContract, "id" | "projectId">,
    lockRetrievalRun: boolean
  ) {
    if (contextAssembly === undefined) {
      return undefined;
    }

    const retrievalRunId = readMetadataString(contextAssembly.metadata, "retrievalRunId");

    if (retrievalRunId === undefined) {
      return undefined;
    }

    const retrievalRunQuery = db
      .select({ id: retrievalRuns.id })
      .from(retrievalRuns)
      .where(and(
        eq(retrievalRuns.id, retrievalRunId),
        eq(retrievalRuns.taskContractId, taskContract.id),
        ...(taskContract.projectId === undefined
          ? []
          : [eq(retrievalRuns.projectId, taskContract.projectId)])
      ))
      .limit(1);
    const [ownedRetrievalRun] = lockRetrievalRun
      ? await retrievalRunQuery.for("update")
      : await retrievalRunQuery;

    if (ownedRetrievalRun === undefined) {
      return undefined;
    }

    const retrievalCandidateRows = await db.query.retrievalCandidates.findMany({
      where: eq(retrievalCandidates.retrievalRunId, retrievalRunId),
      orderBy: [asc(retrievalCandidates.createdAt), asc(retrievalCandidates.id)]
    });
    const activationDecisionRows = await db.query.activationDecisions.findMany({
      where: eq(activationDecisions.retrievalRunId, retrievalRunId),
      orderBy: [asc(activationDecisions.createdAt), asc(activationDecisions.id)]
    });

    return {
      retrievalRunId,
      candidates: retrievalCandidateRows.map(mapRetrievalCandidate),
      decisions: activationDecisionRows.map(mapActivationDecision)
    };
  }

  private async findHarnessRunAggregate(
    db: KrnDatabase | KrnDatabaseTransaction,
    executionRunId: string,
    lockRetrievalRun = false
  ): Promise<HarnessRunAggregate | undefined> {
    const spineRows = await this.findHarnessRunSpineRows(db, executionRunId);

    if (spineRows === undefined) {
      return undefined;
    }

    const contextAssemblyRow = await db.query.contextAssemblies.findFirst({
      where: eq(contextAssemblies.harnessPlanId, spineRows.harnessPlanRow.id),
      orderBy: [desc(contextAssemblies.createdAt), desc(contextAssemblies.id)]
    });
    const {
      commandOutputArtifactRows,
      evidenceBundleRows,
      reviewAssessmentRows,
      feedbackDeltaRows
    } = await this.findEvidenceReviewFeedbackRows(db, executionRunId);
    const commandArtifactRowsByBundleId = commandOutputArtifactRowsByBundleId(
      commandOutputArtifactRows
    );
    const runEventRows = await db.query.runEvents.findMany({
      where: eq(runEvents.executionRunId, executionRunId),
      orderBy: asc(runEvents.sequence)
    });
    const contextAssembly =
      contextAssemblyRow === undefined ? undefined : mapContextAssembly(contextAssemblyRow);
    const activationTrace = await this.findActivationTrace(
      db,
      contextAssembly,
      mapTaskContract(spineRows.taskContractRow),
      lockRetrievalRun
    );
    const evidenceCaptureChannelById = new Map(evidenceBundleRows.map((row) => [
      row.id,
      row.captureChannel
    ]));
    const feedbackCaptureChannelByReviewId = new Map(reviewAssessmentRows.map((row) => [
      row.id,
      evidenceCaptureChannelById.get(row.evidenceBundleId) ?? null
    ]));

    return {
      operatorIntent: mapOperatorIntent(spineRows.operatorIntentRow),
      taskContract: mapTaskContract(spineRows.taskContractRow),
      harnessPlan: mapHarnessPlan(spineRows.harnessPlanRow),
      ...(contextAssembly === undefined ? {} : { contextAssembly }),
      ...(activationTrace === undefined ? {} : { activationTrace }),
      executionRun: mapExecutionRun(spineRows.executionRunRow),
      evidenceBundles: evidenceBundleRows.map((row) => mapEvidenceBundleForAuthorityRead(
        row,
        commandArtifactRowsByBundleId.get(row.id) ?? []
      )),
      reviewAssessments: reviewAssessmentRows.map(mapReviewAssessment),
      feedbackDeltas: feedbackDeltaRows.map((row) => mapFeedbackDeltaForAuthorityRead(
        row,
        feedbackCaptureChannelByReviewId.get(row.reviewAssessmentId) ?? null
      )),
      runEvents: runEventRows.map(mapRunEvent)
    };
  }

  async createOperatorIntent(input: CreateOperatorIntentInput): Promise<OperatorIntent> {
    const row = requireReturnedRow(
      await this.db
        .insert(operatorIntents)
        .values({
          workspaceId: input.workspaceId,
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          source: input.source,
          rawIntent: input.rawIntent,
          ...(input.normalizedIntent === undefined
            ? {}
            : { normalizedIntent: input.normalizedIntent }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createOperatorIntent"
    );

    return mapOperatorIntent(row);
  }

  async createTaskContract(input: CreateTaskContractInput): Promise<TaskContract> {
    const row = requireReturnedRow(
      await this.db
        .insert(taskContracts)
        .values({
          operatorIntentId: input.operatorIntentId,
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          title: input.title,
          objective: input.objective,
          constraints: input.constraints,
          nonGoals: input.nonGoals,
          acceptance: input.acceptance,
          status: "active",
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createTaskContract"
    );

    return mapTaskContract(row);
  }

  async createHarnessPlan(input: CreateHarnessPlanInput): Promise<HarnessPlan> {
    const row = requireReturnedRow(
      await this.db
        .insert(harnessPlans)
        .values({
          taskContractId: input.taskContractId,
          version: input.version,
          status: input.status ?? "draft",
          summary: input.summary,
          ...(input.nextAction === undefined ? {} : { nextAction: input.nextAction }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createHarnessPlan"
    );

    return mapHarnessPlan(row);
  }

  async createContextAssembly(input: CreateContextAssemblyInput): Promise<ContextAssembly> {
    const authorityInput = snapshotRepositoryInput(input);
    const metadata = authorityInput.metadata ?? {};
    const tokens = canonicalRevisionTokensFrom(metadata);
    validateCanonicalRevisionCoverage(authorityInput.inclusions, tokens);

    return this.db.transaction(async (tx) => {
      await lockHarnessPlanAuthority(
        tx,
        authorityInput.harnessPlanId,
        "createContextAssembly"
      );
      await tx
        .select({ id: executionRuns.id })
        .from(executionRuns)
        .where(eq(executionRuns.harnessPlanId, authorityInput.harnessPlanId))
        .orderBy(asc(executionRuns.id))
        .for("update");
      await validateCanonicalRevisionTokens(tx, metadata);
      const row = requireReturnedRow(
        await tx
          .insert(contextAssemblies)
          .values({
            harnessPlanId: authorityInput.harnessPlanId,
            status: authorityInput.status ?? "assembled",
            ...(authorityInput.tokenBudget === undefined
              ? {}
              : { tokenBudget: authorityInput.tokenBudget }),
            inclusionCount: authorityInput.inclusions.length,
            exclusionCount: authorityInput.exclusions.length,
            selectedContext: {
              inclusions: authorityInput.inclusions
            },
            excludedContext: {
              exclusions: authorityInput.exclusions
            },
            metadata
          })
          .returning(),
        "createContextAssembly"
      );

      return mapContextAssembly(row);
    });
  }

  async createExecutionRun(input: CreateExecutionRunInput): Promise<ExecutionRun> {
    const authorityInput = snapshotRepositoryInput(input);
    validateExecutionRunCreation(authorityInput);

    return this.db.transaction(async (tx) => {
      await lockHarnessPlanAuthority(
        tx,
        authorityInput.harnessPlanId,
        "createExecutionRun"
      );
      const row = requireReturnedRow(
        await tx
          .insert(executionRuns)
          .values({
            harnessPlanId: authorityInput.harnessPlanId,
            adapter: authorityInput.adapter,
            status: authorityInput.status ?? "planned",
            ...(authorityInput.startedAt === undefined
              ? {}
              : { startedAt: fromIsoTimestamp(authorityInput.startedAt) }),
            metadata: authorityInput.metadata ?? {}
          })
          .returning(),
        "createExecutionRun"
      );

      const executionRun = mapExecutionRun(row);
      const lifecycleEvent = executionRunLifecycleCreatedEvent(executionRun);

      await tx.insert(runEvents).values({
        executionRunId: row.id,
        sequence: 1,
        ...lifecycleEvent,
        payload: { ...lifecycleEvent.payload }
      });

      return executionRun;
    });
  }

  async updateExecutionRunStatus(
    input: UpdateExecutionRunStatusInput
  ): Promise<UpdateExecutionRunStatusResult> {
    const authorityInput = snapshotRepositoryInput(input);

    return this.db.transaction(async (tx) => {
      const currentRow = requireReturnedRow(
        await tx
          .select()
          .from(executionRuns)
          .where(eq(executionRuns.id, authorityInput.executionRunId))
          .for("update"),
        "updateExecutionRunStatus"
      );
      const isAlreadyAtStatus = validateExecutionRunTransition(authorityInput, currentRow);

      if (isAlreadyAtStatus) {
        return {
          kind: "already_at_status",
          executionRun: mapExecutionRun(currentRow)
        };
      }

      const row = requireReturnedRow(
        await tx
          .update(executionRuns)
          .set({
            status: authorityInput.status,
            lifecycleRevision: sql`${executionRuns.lifecycleRevision} + 1`,
            ...(currentRow.startedAt === null && authorityInput.startedAt !== undefined
              ? { startedAt: fromIsoTimestamp(authorityInput.startedAt) }
              : {}),
            ...(authorityInput.completedAt === undefined
              ? {}
              : { completedAt: fromIsoTimestamp(authorityInput.completedAt) }),
            updatedAt: sql`now()`
          })
          .where(and(
            eq(executionRuns.id, authorityInput.executionRunId),
            eq(executionRuns.status, authorityInput.expectedStatus),
            eq(executionRuns.lifecycleRevision, currentRow.lifecycleRevision)
          ))
          .returning(),
        "updateExecutionRunStatus"
      );

      const executionRun = mapExecutionRun(row);
      const event = executionRunLifecycleTransitionedEvent(
        mapExecutionRun(currentRow),
        executionRun
      );
      const eventSequence = await nextRunEventSequence(
        tx,
        authorityInput.executionRunId,
        "updateExecutionRunStatus"
      );
      const eventRow = requireReturnedRow(
        await tx
          .insert(runEvents)
          .values({
            executionRunId: row.id,
            sequence: eventSequence,
            ...event,
            payload: { ...event.payload }
          })
          .returning(),
        "updateExecutionRunStatus.runEvent"
      );
      const persistedEvent = mapRunEvent(eventRow);
      if (persistedEvent.executionRunId === undefined) {
        throw new Error("updateExecutionRunStatus.runEvent lost its execution run identity");
      }
      const lifecycleEvent: ExecutionRunLifecycleTransitionedEventRecord = {
        id: persistedEvent.id,
        executionRunId: persistedEvent.executionRunId,
        sequence: persistedEvent.sequence,
        type: event.type,
        severity: event.severity,
        message: event.message,
        payload: event.payload,
        occurredAt: persistedEvent.occurredAt
      };

      return {
        kind: "transitioned",
        executionRun,
        lifecycleEvent
      };
    });
  }

  async recordUsefulnessApplicationOnce(
    input: UsefulnessApplicationEvidenceIdentity
  ): Promise<RecordUsefulnessApplicationOnceResult> {
    const authorityInput = parseUsefulnessApplicationEvidenceIdentity(
      snapshotRepositoryInput(input)
    );
    if (authorityInput === undefined) {
      throw new Error("recordUsefulnessApplicationOnce requires valid application evidence");
    }
    await requireCurrentApplicationTarget(
      authorityInput,
      this.options.readTargetStateSnapshot ?? collectTargetStateSnapshot
    );

    return this.db.transaction(async (tx) => {
      const lockedRun = await lockHarnessRunAuthority(
        tx,
        authorityInput,
        "recordUsefulnessApplicationOnce"
      );
      assertSourceRunLifecycleRevision(
        "recordUsefulnessApplicationOnce",
        authorityInput.executionRunId,
        authorityInput.sourceRunLifecycleRevision,
        lockedRun
      );
      const aggregate = requireLinkedRow(
        await this.findHarnessRunAggregate(tx, authorityInput.executionRunId, true),
        "recordUsefulnessApplicationOnce.harnessRunAggregate"
      );
      if (aggregate.taskContract.id !== authorityInput.taskContractId) {
        throw new Error(
          "recordUsefulnessApplicationOnce rejected: task contract does not match the execution run"
        );
      }

      const authorization = authorizeDecisionPacketUsefulness({
        aggregate,
        runId: authorityInput.executionRunId,
        runtimeProjectId: authorityInput.projectId,
        callerPacketChecksum: authorityInput.packetChecksum,
        callerPacketGeneratedAt: authorityInput.packetGeneratedAt,
        subjects: [{
          kind: authorityInput.subjectKind,
          id: authorityInput.subjectId,
          evidenceRefs: [`packet:${authorityInput.packetChecksum}`]
        }],
        sha256Hex
      });
      if (!authorization.authorized) {
        throw new Error(`recordUsefulnessApplicationOnce rejected: ${authorization.reason}`);
      }
      if (authorization.sourceRunLifecycleRevision !== authorityInput.sourceRunLifecycleRevision) {
        throw new Error(
          "recordUsefulnessApplicationOnce rejected: packet lifecycle revision mismatch"
        );
      }
      const [inserted] = await tx
        .insert(usefulnessApplications)
        .values({
          applicationId: authorityInput.applicationId,
          subjectKind: authorityInput.subjectKind,
          subjectId: authorityInput.subjectId,
          projectId: authorityInput.projectId,
          executionRunId: authorityInput.executionRunId,
          taskContractId: authorityInput.taskContractId,
          packetChecksum: authorityInput.packetChecksum,
          packetGeneratedAt: fromIsoTimestamp(authorityInput.packetGeneratedAt),
          sourceRunLifecycleRevision: authorityInput.sourceRunLifecycleRevision,
          ...(authorityInput.targetState === undefined
            ? {}
            : { targetState: authorityInput.targetState })
        })
        .onConflictDoNothing()
        .returning();
      if (inserted !== undefined) {
        return { application: mapUsefulnessApplication(inserted), created: true };
      }

      const existing = await tx.query.usefulnessApplications.findFirst({
        where: eq(usefulnessApplications.applicationId, authorityInput.applicationId)
      });
      if (existing === undefined) {
        throw new Error(
          "recordUsefulnessApplicationOnce rejected: packet subject already has another application identity"
        );
      }
      const application = mapUsefulnessApplication(existing);
      if (!sameUsefulnessApplication(application, authorityInput)) {
        throw new Error(
          "recordUsefulnessApplicationOnce rejected: application identity collision"
        );
      }

      return { application, created: false };
    });
  }

  async createEvidenceBundle(input: CreateEvidenceBundleInput): Promise<EvidenceBundle> {
    const evidenceInput = validateEvidenceBundleInputForPersistence({
      ...input,
      metadata: repositoryUnboundMetadata(
        input.metadata,
        "Generic evidence persistence does not admit DecisionPacket authority."
      )
    });

    return this.db.transaction(async (tx) => {
      const { commandOutputArtifactRows, evidenceBundleRow } =
        await insertEvidenceBundleAndEvent(tx, evidenceInput, "createEvidenceBundle");

      return mapEvidenceBundle(
        evidenceBundleRow,
        commandOutputArtifactRows.map(mapCommandOutputArtifact)
      );
    });
  }

  async createReviewAssessment(input: CreateReviewAssessmentInput): Promise<ReviewAssessment> {
    const row = requireReturnedRow(
      await this.db
        .insert(reviewAssessments)
        .values({
          evidenceBundleId: input.evidenceBundleId,
          status: input.status ?? "pending",
          reviewer: input.reviewer,
          summary: input.summary,
          findings: input.findings,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createReviewAssessment"
    );

    return mapReviewAssessment(row);
  }

  async createFeedbackDelta(input: CreateFeedbackDeltaInput): Promise<FeedbackDelta> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(feedbackDeltas)
          .values({
            reviewAssessmentId: input.reviewAssessmentId,
            status: input.status ?? "candidate",
            memoryCandidates: input.memoryCandidates,
            sourceDecisions: input.sourceDecisions,
            evalCandidates: input.evalCandidates,
            metadata: repositoryUnboundMetadata(
              input.metadata,
              "Generic feedback persistence does not admit DecisionPacket usefulness authority."
            )
          })
          .returning(),
        "createFeedbackDelta"
      );

      await tx.insert(outboxEvents).values({
        topic: "feedback.delta.created",
        payload: {
          feedbackDeltaId: row.id,
          reviewAssessmentId: row.reviewAssessmentId
        }
      });

      return mapFeedbackDelta(row);
    });
  }

  async createEvidenceFeedbackOnce(
    input: CreateEvidenceFeedbackOnceInput
  ): Promise<CreateEvidenceFeedbackOnceResult> {
    const authorityInput = evidenceFeedbackAuthoritySnapshot(input);
    const captureIdentity = authorityInput.captureIdentity.trim();

    if (captureIdentity.length === 0) {
      throw new Error("createEvidenceFeedbackOnce requires capture identity");
    }
    if (captureIdentity.startsWith("eval:")) {
      throw new Error("createEvidenceFeedbackOnce capture identity uses the reserved eval namespace");
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`${authorityInput.executionRunId}:${captureIdentity}`}, 0))`
      );

      const lockedRun = await lockHarnessRunAuthority(
        tx,
        authorityInput,
        "createEvidenceFeedbackOnce"
      );
      const existing = await existingEvidenceFeedbackOnceResult(
        tx,
        authorityInput,
        captureIdentity
      );
      if (existing !== undefined) {
        return existing;
      }

      assertSourceRunLifecycleRevision(
        "createEvidenceFeedbackOnce",
        authorityInput.executionRunId,
        authorityInput.sourceRunLifecycleRevision,
        lockedRun
      );
      const aggregate = requireLinkedRow(
        await this.findHarnessRunAggregate(
          tx,
          authorityInput.executionRunId,
          true
        ),
        "createEvidenceFeedbackOnce.harnessRunAggregate"
      );
      const admittedInput = await evidenceFeedbackInputWithRepositoryAuthority(
        tx,
        authorityInput,
        aggregate,
        this.options.readTargetStateSnapshot ?? collectTargetStateSnapshot
      );

      return insertEvidenceFeedbackChain(
        tx,
        admittedInput,
        captureIdentity,
        this.options.faultAfterStage
      );
    });
  }

  async createEvalFeedbackDeltaOnce(
    input: CreateEvalFeedbackDeltaOnceInput
  ): Promise<CreateEvalFeedbackDeltaOnceResult> {
    const authorityInput = snapshotRepositoryInput(input);
    const executionIdentity = authorityInput.executionIdentity.trim();
    const captureIdentity = `eval:${executionIdentity}`;

    if (executionIdentity.length === 0) {
      throw new Error("createEvalFeedbackDeltaOnce requires execution identity");
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`${authorityInput.executionRunId}:${captureIdentity}`}, 0))`
      );

      const lockedRun = await lockHarnessRunAuthority(
        tx,
        authorityInput,
        "createEvalFeedbackDeltaOnce"
      );
      const existing = await existingEvalFeedbackOnceResult(
        tx,
        authorityInput,
        executionIdentity,
        captureIdentity
      );

      if (existing !== undefined) {
        return existing;
      }

      await assertNoLegacyEvalFeedbackIdentity(tx, authorityInput, executionIdentity);

      assertSourceRunLifecycleRevision(
        "createEvalFeedbackDeltaOnce",
        authorityInput.executionRunId,
        authorityInput.sourceRunLifecycleRevision,
        lockedRun
      );

      const evidenceInput = validateEvidenceBundleInputForPersistence({
        ...authorityInput.evidence,
        executionRunId: authorityInput.executionRunId,
        metadata: {
          ...repositoryUnboundMetadata(
            authorityInput.evidence.metadata,
            "Eval evidence persistence does not admit DecisionPacket authority."
          ),
          evalExecutionIdentity: executionIdentity,
          projectId: authorityInput.projectId
        }
      });
      const { commandOutputArtifactRows, evidenceBundleRow } = await insertEvidenceBundleAndEvent(
        tx,
        evidenceInput,
        "createEvalFeedbackDeltaOnce.evidenceBundle",
        {
          identity: captureIdentity,
          channel: evalFeedbackCaptureChannel
        }
      );

      const reviewAssessmentRow = requireReturnedRow(
        await tx
          .insert(reviewAssessments)
          .values({
            evidenceBundleId: evidenceBundleRow.id,
            captureChannel: evalFeedbackCaptureChannel,
            status: authorityInput.review.status ?? "pending",
            reviewer: authorityInput.review.reviewer,
            summary: authorityInput.review.summary,
            findings: authorityInput.review.findings,
            metadata: authorityInput.review.metadata ?? {}
          })
          .returning(),
        "createEvalFeedbackDeltaOnce.reviewAssessment"
      );
      const feedbackDeltaRow = requireReturnedRow(
        await tx
          .insert(feedbackDeltas)
          .values({
            reviewAssessmentId: reviewAssessmentRow.id,
            captureChannel: evalFeedbackCaptureChannel,
            status: authorityInput.feedback.status ?? "candidate",
            memoryCandidates: authorityInput.feedback.memoryCandidates,
            sourceDecisions: authorityInput.feedback.sourceDecisions,
            evalCandidates: authorityInput.feedback.evalCandidates,
            metadata: {
              ...repositoryUnboundMetadata(
                authorityInput.feedback.metadata,
                "Eval feedback persistence does not admit DecisionPacket usefulness authority."
              ),
              evalExecutionIdentity: executionIdentity,
              projectId: authorityInput.projectId
            }
          })
          .returning(),
        "createEvalFeedbackDeltaOnce.feedbackDelta"
      );

      await tx.insert(outboxEvents).values({
        topic: "feedback.delta.created",
        payload: {
          feedbackDeltaId: feedbackDeltaRow.id,
          reviewAssessmentId: reviewAssessmentRow.id,
          evalExecutionIdentity: executionIdentity,
          projectId: authorityInput.projectId
        }
      });

      return {
        evidenceBundle: mapEvidenceBundle(
          evidenceBundleRow,
          commandOutputArtifactRows.map(mapCommandOutputArtifact)
        ),
        reviewAssessment: mapReviewAssessment(reviewAssessmentRow),
        feedbackDelta: mapFeedbackDelta(feedbackDeltaRow),
        created: true
      };
    });
  }

  async listFeedbackDeltasForProject(projectId: string, limit = 100): Promise<FeedbackDelta[]> {
    const rows = await this.db
      .select({
        feedbackDelta: feedbackDeltas,
        captureChannel: evidenceBundles.captureChannel
      })
      .from(feedbackDeltas)
      .innerJoin(
        reviewAssessments,
        eq(feedbackDeltas.reviewAssessmentId, reviewAssessments.id)
      )
      .innerJoin(
        evidenceBundles,
        eq(reviewAssessments.evidenceBundleId, evidenceBundles.id)
      )
      .innerJoin(
        executionRuns,
        eq(evidenceBundles.executionRunId, executionRuns.id)
      )
      .innerJoin(
        harnessPlans,
        eq(executionRuns.harnessPlanId, harnessPlans.id)
      )
      .innerJoin(
        taskContracts,
        eq(harnessPlans.taskContractId, taskContracts.id)
      )
      .where(eq(taskContracts.projectId, projectId))
      .orderBy(desc(feedbackDeltas.createdAt))
      .limit(limit);

    return rows.map((row) => mapFeedbackDeltaForAuthorityRead(
      row.feedbackDelta,
      row.captureChannel
    ));
  }

  async getFeedbackDeltaForProject(
    projectId: ProjectId,
    feedbackDeltaId: string
  ): Promise<FeedbackDeltaProjectLookup> {
    const rows = await this.db
      .select({
        feedbackDelta: feedbackDeltas,
        linkedProjectId: taskContracts.projectId,
        captureChannel: evidenceBundles.captureChannel
      })
      .from(feedbackDeltas)
      .innerJoin(
        reviewAssessments,
        eq(feedbackDeltas.reviewAssessmentId, reviewAssessments.id)
      )
      .innerJoin(
        evidenceBundles,
        eq(reviewAssessments.evidenceBundleId, evidenceBundles.id)
      )
      .innerJoin(
        executionRuns,
        eq(evidenceBundles.executionRunId, executionRuns.id)
      )
      .innerJoin(
        harnessPlans,
        eq(executionRuns.harnessPlanId, harnessPlans.id)
      )
      .innerJoin(
        taskContracts,
        eq(harnessPlans.taskContractId, taskContracts.id)
      )
      .where(eq(feedbackDeltas.id, feedbackDeltaId))
      .limit(1);
    const row = rows[0];

    if (row === undefined) {
      return { status: "missing" };
    }

    if (row.linkedProjectId !== projectId) {
      return { status: "wrong_project" };
    }

    return {
      status: "found",
      feedbackDelta: mapFeedbackDeltaForAuthorityRead(
        row.feedbackDelta,
        row.captureChannel
      )
    };
  }

  async listFeedbackDeltasForSubjects(
    input: ListFeedbackDeltasForSubjectsInput
  ): Promise<FeedbackDelta[]> {
    const limitPerSubject = input.limitPerSubject ?? 100;

    if (!Number.isInteger(limitPerSubject) || limitPerSubject <= 0) {
      return [];
    }

    const subjects = [...new Map(
      input.subjects
        .map((subject) => ({
          kind: subject.kind,
          id: subject.id.trim()
        }))
        .filter((subject) => subject.id.length > 0)
        .map((subject) => [`${subject.kind}:${subject.id}`, subject] as const)
    ).values()];

    if (subjects.length === 0) {
      return [];
    }

    const rowsBySubject = await Promise.all(subjects.map((subject) =>
      this.db
        .select({
          feedbackDelta: feedbackDeltas,
          captureChannel: evidenceBundles.captureChannel
        })
        .from(feedbackDeltas)
        .innerJoin(
          reviewAssessments,
          eq(feedbackDeltas.reviewAssessmentId, reviewAssessments.id)
        )
        .innerJoin(
          evidenceBundles,
          eq(reviewAssessments.evidenceBundleId, evidenceBundles.id)
        )
        .innerJoin(
          executionRuns,
          eq(evidenceBundles.executionRunId, executionRuns.id)
        )
        .innerJoin(
          harnessPlans,
          eq(executionRuns.harnessPlanId, harnessPlans.id)
        )
        .innerJoin(
          taskContracts,
          eq(harnessPlans.taskContractId, taskContracts.id)
        )
        .where(and(
          eq(taskContracts.projectId, input.projectId),
          feedbackSubjectMatch(subject)
        ))
        .orderBy(desc(feedbackDeltas.createdAt), desc(feedbackDeltas.id))
        .limit(limitPerSubject)
    ));
    const uniqueRows = new Map<string, (typeof rowsBySubject)[number][number]>();

    for (const rows of rowsBySubject) {
      for (const row of rows) {
        uniqueRows.set(row.feedbackDelta.id, row);
      }
    }

    return [...uniqueRows.values()]
      .sort((left, right) => {
        const createdAtDifference = right.feedbackDelta.createdAt.getTime() -
          left.feedbackDelta.createdAt.getTime();

        return createdAtDifference === 0
          ? right.feedbackDelta.id.localeCompare(left.feedbackDelta.id)
          : createdAtDifference;
      })
      .map((row) => mapFeedbackDeltaForAuthorityRead(
        row.feedbackDelta,
        row.captureChannel
      ));
  }

  async getHarnessRunByExecutionRunId(
    executionRunId: string
  ): Promise<HarnessRunAggregate | undefined> {
    return this.db.transaction(
      (tx) => this.findHarnessRunAggregate(tx, executionRunId),
      { isolationLevel: "repeatable read", accessMode: "read only" }
    );
  }
}
