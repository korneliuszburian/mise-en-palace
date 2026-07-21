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
  DecisionPacketContractReadback,
  EvidenceBundle,
  EvidenceCommand,
  ExecutionRun,
  ExecutionRunLifecycleTransitionedEventRecord,
  FeedbackDelta,
  ProjectId,
  HarnessPlan,
  ListPairedLiveEvalEvidenceInput,
  EvidenceCommandReadback,
  OperatorIntent,
  PairedLiveEvalEvidenceRecord,
  ReviewAssessment,
  RecordPairedLiveEvalEvidenceInput,
  RecordPairedLiveEvalEvidenceResult,
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
  authorizeIssuedDecisionPacketUsefulness,
  buildDecisionPacketIssuance,
  canonicalTargetRepoPath,
  contextInclusionUsefulnessSubjectId,
  collectTargetStateSnapshot,
  decideEvidenceContractActivation,
  decisionPacketAuthorityAdmissionCurrent,
  executionRunLifecycleCreatedEvent,
  executionRunLifecycleCreatedEventType,
  executionRunLifecycleTransitionedEvent,
  executionRunLifecycleTransitionedEventType,
  ExecutionRunLifecycleConflictError,
  feedbackTaskContractIdMetadataKey,
  feedbackTaskObjectiveMetadataKey,
  isAdmittedCurrentDecisionPacketAuthorityMetadata,
  isIsoTimestamp,
  isReviewableFeedbackOutcome,
  projectDecisionPacketUsefulnessSubjects,
  parseUsefulnessApplicationEvidenceIdentity,
  parseUsefulnessApplicationEvidenceForIdentity,
  parseDecisionPacketContractReadback,
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
  CreateReviewFeedbackOnceInput,
  CreateReviewFeedbackOnceResult,
  CreateTaskContractInput,
  HarnessRunAggregate,
  HarnessRunRepository,
  ListFeedbackDeltasForSubjectsInput,
  RecordUsefulnessApplicationOnceResult,
  UpdateExecutionRunStatusInput
} from "@krn/core/repositories/internal";
import {
  EvidenceFeedbackIdentityConflictError,
  ReviewFeedbackIdentityConflictError
} from "@krn/core/repositories/internal";

import type { KrnDatabase, KrnDatabaseTransaction } from "../database.js";
import {
  contextAssemblies,
  decisionPacketIssuances,
  evidenceCommandArtifacts,
  evidenceBundles,
  executionRuns,
  feedbackDeltas,
  harnessPlans,
  maintenanceQueues,
  memoryRecords,
  operatorIntents,
  outboxEvents,
  pairedLiveEvalEvidence,
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
  metadataOrEmpty,
  requireReturnedRow,
  stringListOrEmpty,
  toIsoTimestamp
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
  if (!isIsoTimestamp(value)) {
    throw new Error(`execution run lifecycle ${field} must be a valid ISO timestamp`);
  }

  return fromIsoTimestamp(value);
};

const validateExecutionRunCreation = (input: CreateExecutionRunInput): void => {
  const candidate = input as CreateExecutionRunInput & {
    readonly status?: unknown;
    readonly startedAt?: unknown;
  };

  if (
    (candidate.status !== undefined && candidate.status !== "planned")
    || candidate.startedAt !== undefined
  ) {
    throw new Error(
      "execution run lifecycle creation is planned-only; use the guarded status transition"
    );
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
const reviewAssessCaptureChannel = "review_assess_v1" as const;

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

export type HarnessFeedbackPersistenceStage =
  | "after_evidence_bundle"
  | "after_review_assessment"
  | "after_feedback_delta"
  | "after_maintenance_queue"
  | "after_review_feedback_assessment"
  | "after_review_feedback_delta"
  | "after_review_feedback_outbox";

export interface DrizzleHarnessRunRepositoryOptions {
  faultAfterStage?: (stage: HarnessFeedbackPersistenceStage) => void;
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
  if (
    evidenceFeedbackRequestFingerprintFromRow(evidenceBundleRow) !==
    evidenceFeedbackRequestFingerprint(input)
  ) {
    throw new EvidenceFeedbackIdentityConflictError(
      input.executionRunId,
      captureIdentity
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
    | "recordUsefulnessApplicationsOnce"
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
    | "recordUsefulnessApplicationOnce"
    | "recordUsefulnessApplicationsOnce",
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

const canonicalJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalJsonValue(entry)])
    );
  }

  return value;
};

const canonicalJson = (value: unknown): string =>
  JSON.stringify(canonicalJsonValue(value)) ?? "null";

const evidenceFeedbackSemanticInput = (
  input: CreateEvidenceFeedbackOnceInput
): CreateEvidenceFeedbackOnceInput => {
  if (input.semanticRequest === undefined) {
    return input;
  }

  const {
    decisionPacketClaim: _decisionPacketClaim,
    sourceUsefulnessOutcomes: _sourceUsefulnessOutcomes,
    knowledgeUsefulnessOutcomes: _knowledgeUsefulnessOutcomes,
    contextInclusionUsefulnessOutcomes: _contextInclusionUsefulnessOutcomes,
    maintenance: _maintenance,
    semanticRequest,
    ...identityInput
  } = input;

  return {
    ...identityInput,
    ...(semanticRequest.decisionPacketClaim === undefined
      ? {}
      : { decisionPacketClaim: semanticRequest.decisionPacketClaim }),
    ...(semanticRequest.sourceUsefulnessOutcomes === undefined
      ? {}
      : { sourceUsefulnessOutcomes: semanticRequest.sourceUsefulnessOutcomes }),
    ...(semanticRequest.knowledgeUsefulnessOutcomes === undefined
      ? {}
      : { knowledgeUsefulnessOutcomes: semanticRequest.knowledgeUsefulnessOutcomes }),
    ...(semanticRequest.contextInclusionUsefulnessOutcomes === undefined
      ? {}
      : { contextInclusionUsefulnessOutcomes: semanticRequest.contextInclusionUsefulnessOutcomes }),
    ...(semanticRequest.maintenance === undefined
      ? {}
      : { maintenance: semanticRequest.maintenance })
  };
};

const evidenceFeedbackRequestFingerprint = (
  input: CreateEvidenceFeedbackOnceInput
): string => {
  const semanticInput = evidenceFeedbackSemanticInput(input);

  return sha256Hex(canonicalJson({
    executionRunId: semanticInput.executionRunId,
    projectId: semanticInput.projectId,
    captureIdentity: semanticInput.captureIdentity,
    decisionPacketClaim: semanticInput.decisionPacketClaim ?? null,
    sourceUsefulnessOutcomes: semanticInput.sourceUsefulnessOutcomes ?? null,
    knowledgeUsefulnessOutcomes: semanticInput.knowledgeUsefulnessOutcomes ?? null,
    contextInclusionUsefulnessOutcomes:
      semanticInput.contextInclusionUsefulnessOutcomes ?? null,
    evidence: semanticInput.evidence,
    review: semanticInput.review,
    feedback: semanticInput.feedback,
    maintenance: semanticInput.maintenance ?? null,
    metadata: semanticInput.metadata ?? null
  }));
};

const evidenceFeedbackRequestFingerprintFromRow = (
  row: typeof evidenceBundles.$inferSelect
): string | undefined => {
  const fingerprint = row.metadata.evidenceFeedbackRequestFingerprint;

  return typeof fingerprint === "string" && fingerprint.length > 0
    ? fingerprint
    : undefined;
};

const reviewFeedbackRequestFingerprint = (
  input: CreateReviewFeedbackOnceInput
): string => sha256Hex(canonicalJson({
  evidenceBundleId: input.evidenceBundleId,
  requestIdentity: input.requestIdentity,
  review: input.review,
  feedback: input.feedback,
  metadata: input.metadata ?? null
}));

const reviewFeedbackRequestFingerprintFromRow = (
  row: typeof reviewAssessments.$inferSelect
): string | undefined => readMetadataString(
  row.metadata,
  "reviewFeedbackRequestFingerprint"
);


const snapshotRepositoryInput = <TInput>(input: TInput): TInput =>
  structuredClone(input);

type DecisionPacketIssuanceRow = typeof decisionPacketIssuances.$inferSelect;

export const mapDecisionPacketIssuance = (
  row: DecisionPacketIssuanceRow
): DecisionPacketContractReadback => {
  const readback = parseDecisionPacketContractReadback({
    value: row.readback,
    expectedRunId: row.executionRunId,
    sha256Hex
  });

  if (
    readback === undefined ||
    readback.packetIdentity.checksum !== row.packetChecksum ||
    readback.packetIdentity.generatedAt !== row.packetGeneratedAt.toISOString() ||
    readback.packetIdentity.sourceRunLifecycleRevision !== row.sourceRunLifecycleRevision
  ) {
    throw new Error(
      `DecisionPacket issuance is corrupt for execution run ${row.executionRunId}`
    );
  }

  return readback;
};

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
  const targetRepo = await canonicalTargetRepoPath(target.targetRepo);
  if (targetRepo !== applicationTarget.targetRepo) {
    return false;
  }
  const snapshot = await readTargetStateSnapshot(targetRepo);

  return snapshotMatchesApplicationTarget(snapshot, applicationTarget) &&
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
  .filter((command): command is Extract<EvidenceCommandReadback, { kind: "command_runner" | "captured_output_file" }> =>
    (command.kind === "command_runner" || command.kind === "captured_output_file") &&
    input.requiredCommands.has(command.command)
  )
  .every((command) => command.outputRef !== undefined &&
    command.capturedAt !== undefined &&
    Date.parse(artifactsByRef.get(command.outputRef)?.startedAt ?? "") >
      Date.parse(input.appliedAt) &&
    Date.parse(command.capturedAt) > Date.parse(input.appliedAt));
};

const returnChannelUsefulnessSubjectKinds = new Set<string>([
  "context_inclusion",
  "knowledge",
  "source_claim",
  "source_decision"
]);

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
  if (!returnChannelUsefulnessSubjectKinds.has(subject.kind)) {
    return undefined;
  }
  const subjectKind = subject.kind as UsefulnessApplicationEvidenceIdentity["subjectKind"];
  const row = await tx.query.usefulnessApplications.findFirst({
    where: eq(usefulnessApplications.applicationId, outcome.applicationId)
  });
  if (row === undefined || input.decisionPacketClaim === undefined) {
    return undefined;
  }
  const application = mapUsefulnessApplication(row);
  const parsed = parseUsefulnessApplicationEvidenceForIdentity(application, {
    applicationId: outcome.applicationId,
    subjectKind,
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

const admittedDecisionPacketIdentity = (
  authorization: Extract<
    ReturnType<typeof authorizeDecisionPacketUsefulness>,
    { authorized: true }
  >
): AdmittedDecisionPacketIdentity => ({
  checksum: authorization.packetChecksum,
  generatedAt: authorization.packetGeneratedAt,
  sourceRunLifecycleRevision: authorization.sourceRunLifecycleRevision
});

const admitDecisionPacketIdentity = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceFeedbackOnceInput & {
    decisionPacketClaim: NonNullable<CreateEvidenceFeedbackOnceInput["decisionPacketClaim"]>;
  },
  aggregate: HarnessRunAggregate,
  invalidClaim: "persist_unbound" | "reject"
): Promise<AdmittedDecisionPacketIdentity | undefined> => {
  const claim = input.decisionPacketClaim;
  const currentAuthorization = authorizeDecisionPacketUsefulness({
    aggregate,
    runId: input.executionRunId,
    runtimeProjectId: input.projectId,
    callerPacketChecksum: claim.checksum,
    callerPacketGeneratedAt: claim.generatedAt,
    subjects: projectDecisionPacketUsefulnessSubjects({
      contextInclusionUsefulnessOutcomes: input.contextInclusionUsefulnessOutcomes,
      sourceUsefulnessOutcomes: input.sourceUsefulnessOutcomes,
      knowledgeUsefulnessOutcomes: input.knowledgeUsefulnessOutcomes
    }),
    sha256Hex
  });

  if (currentAuthorization.authorized) {
    return admittedDecisionPacketIdentity(currentAuthorization);
  }

  const issuanceRow = await tx.query.decisionPacketIssuances.findFirst({
    where: eq(decisionPacketIssuances.executionRunId, input.executionRunId)
  });
  if (issuanceRow !== undefined) {
    const issuedAuthorization = authorizeIssuedDecisionPacketUsefulness({
      aggregate,
      issuance: mapDecisionPacketIssuance(issuanceRow),
      runId: input.executionRunId,
      runtimeProjectId: input.projectId,
      callerPacketChecksum: claim.checksum,
      callerPacketGeneratedAt: claim.generatedAt,
      callerSourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
      subjects: projectDecisionPacketUsefulnessSubjects({
        contextInclusionUsefulnessOutcomes: input.contextInclusionUsefulnessOutcomes,
        sourceUsefulnessOutcomes: input.sourceUsefulnessOutcomes,
        knowledgeUsefulnessOutcomes: input.knowledgeUsefulnessOutcomes
      })
    });

    if (issuedAuthorization.authorized) {
      return admittedDecisionPacketIdentity(issuedAuthorization);
    }
    if (invalidClaim === "reject") {
      throw new Error(`createEvidenceFeedbackOnce rejected: ${issuedAuthorization.reason}`);
    }
  }

  if (invalidClaim === "persist_unbound") {
    return undefined;
  }

  throw new Error(`createEvidenceFeedbackOnce rejected: ${currentAuthorization.reason}`);
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
  const contextInclusionUsefulnessOutcomes = await Promise.all(
    (input.contextInclusionUsefulnessOutcomes ?? []).map((outcome) =>
      admitApplicationBoundOutcome({
        tx,
        capture: input,
        aggregate,
        outcome,
        subject: {
          kind: "context_inclusion",
          id: contextInclusionUsefulnessSubjectId(outcome.subjectType, outcome.subjectId)
        },
        strictProofEligible: proof.eligible,
        requiredCommands: proof.requiredCommands,
        readTargetStateSnapshot
      })
    )
  );

  return {
    sourceUsefulnessOutcomes,
    knowledgeUsefulnessOutcomes,
    contextInclusionUsefulnessOutcomes
  };
};

const applicationBoundEvidenceFeedbackInput = (
  input: CreateEvidenceFeedbackOnceInput,
  authorityIdentity: AdmittedDecisionPacketIdentity,
  admitted: Awaited<ReturnType<typeof admitUsefulnessOutcomes>>
): CreateEvidenceFeedbackOnceInput => {
  const {
    sourceUsefulnessOutcomes,
    knowledgeUsefulnessOutcomes,
    contextInclusionUsefulnessOutcomes
  } = admitted;
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
          : { knowledgeUsefulnessOutcomes: [...knowledgeUsefulnessOutcomes] }),
        ...(contextInclusionUsefulnessOutcomes.length === 0
          ? {}
          : { contextInclusionUsefulnessOutcomes: [...contextInclusionUsefulnessOutcomes] })
      }
    }
  };
};

const evidenceFeedbackInputWithRepositoryAuthority = async (
  tx: KrnDatabaseTransaction,
  input: CreateEvidenceFeedbackOnceInput,
  aggregate: HarnessRunAggregate,
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>,
  invalidClaim: "persist_unbound" | "reject"
): Promise<CreateEvidenceFeedbackOnceInput> => {
  if (input.decisionPacketClaim === undefined) {
    return unboundEvidenceFeedbackInput(input);
  }
  const boundInput = {
    ...input,
    decisionPacketClaim: input.decisionPacketClaim
  };
  const authorityIdentity = await admitDecisionPacketIdentity(
    tx,
    boundInput,
    aggregate,
    invalidClaim
  );
  if (authorityIdentity === undefined) {
    return unboundEvidenceFeedbackInput(input);
  }
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
  captureIdentity: string,
  firstPersistedAt: string
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
      memoryCandidates: input.feedback.memoryCandidates.map((candidate) => ({
        ...candidate,
        validFrom: firstPersistedAt,
        createdAt: firstPersistedAt,
        updatedAt: firstPersistedAt
      })),
      sourceDecisions: input.feedback.sourceDecisions.map((candidate) => ({
        ...candidate,
        createdAt: firstPersistedAt,
        updatedAt: firstPersistedAt
      })),
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
  faultAfterStage?: (stage: HarnessFeedbackPersistenceStage) => void,
  requestFingerprint = evidenceFeedbackRequestFingerprint(input)
): Promise<CreateEvidenceFeedbackOnceResult> => {
  const evidenceInput = validateEvidenceBundleInputForPersistence({
    ...input.evidence,
    executionRunId: input.executionRunId,
    metadata: {
      ...(input.evidence.metadata ?? {}),
      captureIdentity,
      projectId: input.projectId,
      evidenceFeedbackRequestFingerprint: requestFingerprint
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
    captureIdentity,
    evidenceBundleRow.createdAt.toISOString()
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

const normalizeUsefulnessApplicationIdentity = async (
  input: UsefulnessApplicationEvidenceIdentity,
  readTargetStateSnapshot: (targetRepo: string) => Promise<TargetStateSnapshot>
): Promise<UsefulnessApplicationEvidenceIdentity> => {
  const parsedInput = parseUsefulnessApplicationEvidenceIdentity(
    snapshotRepositoryInput(input)
  );
  if (parsedInput === undefined) {
    throw new Error("recordUsefulnessApplicationOnce requires valid application evidence");
  }
  const authorityInput = parsedInput.targetState === undefined
    ? parsedInput
    : {
        ...parsedInput,
        targetState: {
          ...parsedInput.targetState,
          targetRepo: await canonicalTargetRepoPath(parsedInput.targetState.targetRepo)
        }
      };
  await requireCurrentApplicationTarget(authorityInput, readTargetStateSnapshot);
  return authorityInput;
};

const insertUsefulnessApplicationOnce = async (
  tx: KrnDatabaseTransaction,
  input: UsefulnessApplicationEvidenceIdentity
): Promise<RecordUsefulnessApplicationOnceResult> => {
  const [inserted] = await tx
    .insert(usefulnessApplications)
    .values({
      applicationId: input.applicationId,
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      projectId: input.projectId,
      executionRunId: input.executionRunId,
      taskContractId: input.taskContractId,
      packetChecksum: input.packetChecksum,
      packetGeneratedAt: fromIsoTimestamp(input.packetGeneratedAt),
      sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
      ...(input.targetState === undefined ? {} : { targetState: input.targetState })
    })
    .onConflictDoNothing()
    .returning();
  if (inserted !== undefined) {
    return { application: mapUsefulnessApplication(inserted), created: true };
  }

  const existing = await tx.query.usefulnessApplications.findFirst({
    where: eq(usefulnessApplications.applicationId, input.applicationId)
  });
  if (existing === undefined) {
    throw new Error(
      "recordUsefulnessApplicationOnce rejected: packet subject already has another application identity"
    );
  }
  const application = mapUsefulnessApplication(existing);
  if (!sameUsefulnessApplication(application, input)) {
    throw new Error("recordUsefulnessApplicationOnce rejected: application identity collision");
  }

  return { application, created: false };
};

const existingReviewFeedbackOnceResult = async (
  tx: KrnDatabaseTransaction,
  input: CreateReviewFeedbackOnceInput,
  requestIdentity: string,
  requestFingerprint: string
): Promise<CreateReviewFeedbackOnceResult | undefined> => {
  const existingReview = await tx.query.reviewAssessments.findFirst({
    where: and(
      eq(reviewAssessments.evidenceBundleId, input.evidenceBundleId),
      eq(reviewAssessments.captureChannel, reviewAssessCaptureChannel)
    )
  });

  if (existingReview === undefined) {
    return undefined;
  }
  if (
    readMetadataString(existingReview.metadata, "reviewFeedbackRequestIdentity") !==
      requestIdentity ||
    reviewFeedbackRequestFingerprintFromRow(existingReview) !== requestFingerprint
  ) {
    throw new ReviewFeedbackIdentityConflictError(
      input.evidenceBundleId,
      requestIdentity
    );
  }

  const existingFeedback = await tx.query.feedbackDeltas.findFirst({
    where: and(
      eq(feedbackDeltas.reviewAssessmentId, existingReview.id),
      eq(feedbackDeltas.captureChannel, reviewAssessCaptureChannel)
    )
  });
  if (existingFeedback === undefined) {
    throw new Error(
      `Review feedback persistence is incomplete for ${requestIdentity}: feedback delta missing`
    );
  }

  const existingOutbox = await tx.query.outboxEvents.findFirst({
    where: and(
      eq(outboxEvents.topic, "feedback.delta.created"),
      sql`${outboxEvents.payload}->>'reviewRequestIdentity' = ${requestIdentity}`,
      sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${existingFeedback.id}`
    )
  });
  if (existingOutbox === undefined) {
    throw new Error(
      `Review feedback persistence is incomplete for ${requestIdentity}: outbox event missing`
    );
  }

  return {
    reviewAssessment: mapReviewAssessment(existingReview),
    feedbackDelta: mapFeedbackDelta(existingFeedback),
    created: false
  };
};

const assertNoLegacyReviewFeedback = async (
  tx: KrnDatabaseTransaction,
  evidenceBundleId: string
): Promise<void> => {
  const legacyReview = await tx.query.reviewAssessments.findFirst({
    where: and(
      eq(reviewAssessments.evidenceBundleId, evidenceBundleId),
      isNull(reviewAssessments.captureChannel)
    )
  });

  if (legacyReview === undefined) {
    return;
  }

  const legacyFeedback = await tx.query.feedbackDeltas.findFirst({
    where: eq(feedbackDeltas.reviewAssessmentId, legacyReview.id)
  });
  const missingPart = legacyFeedback === undefined
    ? "feedback delta missing"
    : "repository-owned request identity missing";

  throw new Error(
    `Review feedback persistence is blocked by legacy assessment ${legacyReview.id}: ${missingPart}`
  );
};

const insertReviewFeedbackChain = async (
  tx: KrnDatabaseTransaction,
  input: CreateReviewFeedbackOnceInput,
  requestIdentity: string,
  requestFingerprint: string,
  faultAfterStage?: (stage: HarnessFeedbackPersistenceStage) => void
): Promise<CreateReviewFeedbackOnceResult> => {
  const reviewAssessmentRow = requireReturnedRow(
    await tx
      .insert(reviewAssessments)
      .values({
        evidenceBundleId: input.evidenceBundleId,
        captureChannel: reviewAssessCaptureChannel,
        status: input.review.status ?? "pending",
        reviewer: input.review.reviewer,
        summary: input.review.summary,
        findings: input.review.findings,
        metadata: {
          ...(input.review.metadata ?? {}),
          reviewFeedbackRequestIdentity: requestIdentity,
          reviewFeedbackRequestFingerprint: requestFingerprint
        }
      })
      .returning(),
    "createReviewFeedbackOnce.reviewAssessment"
  );
  faultAfterStage?.("after_review_feedback_assessment");

  const feedbackDeltaRow = requireReturnedRow(
    await tx
      .insert(feedbackDeltas)
      .values({
        reviewAssessmentId: reviewAssessmentRow.id,
        captureChannel: reviewAssessCaptureChannel,
        status: input.feedback.status ?? "candidate",
        memoryCandidates: input.feedback.memoryCandidates,
        sourceDecisions: input.feedback.sourceDecisions,
        evalCandidates: input.feedback.evalCandidates,
        metadata: {
          ...repositoryUnboundMetadata(
            input.feedback.metadata,
            "Operator review feedback persistence does not admit DecisionPacket usefulness authority."
          ),
          reviewFeedbackRequestIdentity: requestIdentity,
          reviewFeedbackRequestFingerprint: requestFingerprint
        }
      })
      .returning(),
    "createReviewFeedbackOnce.feedbackDelta"
  );
  faultAfterStage?.("after_review_feedback_delta");

  await tx.insert(outboxEvents).values({
    topic: "feedback.delta.created",
    payload: {
      feedbackDeltaId: feedbackDeltaRow.id,
      reviewAssessmentId: reviewAssessmentRow.id,
      reviewRequestIdentity: requestIdentity
    }
  });
  faultAfterStage?.("after_review_feedback_outbox");

  return {
    reviewAssessment: mapReviewAssessment(reviewAssessmentRow),
    feedbackDelta: mapFeedbackDelta(feedbackDeltaRow),
    created: true
  };
};

type PairedLiveEvalEvidenceRow = typeof pairedLiveEvalEvidence.$inferSelect;

const pairedLiveEvalEvidenceArtifactStatuses = new Set([
  "passed",
  "invalid",
  "blocked",
  "unverified"
]);
const pairedLiveEvalEvidenceOutcomes = new Set([
  "win",
  "tie",
  "loss",
  "invalid",
  "unknown"
]);
const pairedLiveEvalEvidenceUsefulnessOutcomes = new Set([
  "helped",
  "neutral",
  "hurt",
  "unknown"
]);

const asPairedLiveEvalEvidenceArtifactStatus = (
  value: string
): PairedLiveEvalEvidenceRecord["artifactStatus"] => {
  if (pairedLiveEvalEvidenceArtifactStatuses.has(value)) {
    return value as PairedLiveEvalEvidenceRecord["artifactStatus"];
  }

  throw new Error(`Unknown paired-live eval artifact status: ${value}`);
};

const asPairedLiveEvalEvidenceOutcome = (
  value: string
): PairedLiveEvalEvidenceRecord["outcome"] => {
  if (pairedLiveEvalEvidenceOutcomes.has(value)) {
    return value as PairedLiveEvalEvidenceRecord["outcome"];
  }

  throw new Error(`Unknown paired-live eval outcome: ${value}`);
};

const asPairedLiveEvalEvidenceUsefulnessOutcome = (
  value: string
): PairedLiveEvalEvidenceRecord["usefulnessOutcome"] => {
  if (pairedLiveEvalEvidenceUsefulnessOutcomes.has(value)) {
    return value as PairedLiveEvalEvidenceRecord["usefulnessOutcome"];
  }

  throw new Error(`Unknown paired-live eval usefulness outcome: ${value}`);
};

const asPairedLiveEvalEvidenceCandidateStatus = (
  value: string
): PairedLiveEvalEvidenceRecord["candidateStatus"] => {
  if (value === "candidate") {
    return value;
  }

  throw new Error(`Unknown paired-live eval candidate status: ${value}`);
};

const mapPairedLiveEvalEvidence = (
  row: PairedLiveEvalEvidenceRow
): PairedLiveEvalEvidenceRecord => ({
  id: row.id,
  projectId: row.projectId,
  runId: row.runId,
  ...(row.feedbackDeltaId === null ? {} : { feedbackDeltaId: row.feedbackDeltaId }),
  candidateId: row.candidateId,
  candidateStatus: asPairedLiveEvalEvidenceCandidateStatus(row.candidateStatus),
  title: row.title,
  scenario: row.scenario,
  family: row.family,
  expectedSignal: row.expectedSignal,
  artifactStatus: asPairedLiveEvalEvidenceArtifactStatus(row.artifactStatus),
  outcome: asPairedLiveEvalEvidenceOutcome(row.outcome),
  usefulnessOutcome: asPairedLiveEvalEvidenceUsefulnessOutcome(row.usefulnessOutcome),
  packetChecksum: row.packetChecksum,
  packetEvidenceRef: row.packetEvidenceRef,
  artifactHash: row.artifactHash,
  artifactRef: row.artifactRef,
  manifestHash: row.manifestHash,
  manifestRef: row.manifestRef,
  checkerRevision: row.checkerRevision,
  checkerEvidenceRef: row.checkerEvidenceRef,
  environmentProfileHash: row.environmentProfileHash,
  environmentEvidenceRef: row.environmentEvidenceRef,
  sourceEvidence: stringListOrEmpty(row.sourceEvidence),
  evidenceRefs: stringListOrEmpty(row.evidenceRefs),
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

const requiredTrimmedText = (value: string, field: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`recordPairedLiveEvalEvidenceOnce requires ${field}`);
  }

  return trimmed;
};

const validationFailure = (
  failed: boolean,
  message: string
): string | undefined => failed ? message : undefined;

const pairedLiveEvalEvidenceValidationFailure = (
  input: RecordPairedLiveEvalEvidenceInput
): string | undefined => {
  const allEvidenceRefs = new Set([...input.sourceEvidence, ...input.evidenceRefs]);
  const requiredRefs = [
    input.packetEvidenceRef,
    input.artifactRef,
    input.manifestRef,
    input.checkerEvidenceRef,
    input.environmentEvidenceRef
  ];

  return [
    validationFailure(
      !input.candidateId.startsWith("paired-target-repair:"),
      "recordPairedLiveEvalEvidenceOnce requires a paired-target-repair candidate id"
    ),
    validationFailure(
      input.candidateStatus !== "candidate",
      "recordPairedLiveEvalEvidenceOnce stores proposal-only candidates"
    ),
    validationFailure(
      input.artifactStatus !== "passed" && input.usefulnessOutcome === "helped",
      "recordPairedLiveEvalEvidenceOnce cannot mark non-passed artifacts helped"
    ),
    validationFailure(
      input.outcome === "invalid" && input.usefulnessOutcome === "helped",
      "recordPairedLiveEvalEvidenceOnce cannot mark invalid outcomes helped"
    ),
    validationFailure(
      input.packetEvidenceRef !== `packet:${input.packetChecksum}`,
      "recordPairedLiveEvalEvidenceOnce packet evidence ref mismatch"
    ),
    validationFailure(
      input.artifactRef !== `artifact:sha256:${input.artifactHash}`,
      "recordPairedLiveEvalEvidenceOnce artifact evidence ref mismatch"
    ),
    validationFailure(
      input.manifestRef !== `manifest:sha256:${input.manifestHash}`,
      "recordPairedLiveEvalEvidenceOnce manifest evidence ref mismatch"
    ),
    validationFailure(
      input.checkerEvidenceRef !== `checker:${input.checkerRevision}`,
      "recordPairedLiveEvalEvidenceOnce checker evidence ref mismatch"
    ),
    validationFailure(
      input.environmentEvidenceRef !== `environment:sha256:${input.environmentProfileHash}`,
      "recordPairedLiveEvalEvidenceOnce environment evidence ref mismatch"
    ),
    ...requiredRefs.map((ref) =>
      validationFailure(
        !allEvidenceRefs.has(ref),
        `recordPairedLiveEvalEvidenceOnce missing exact evidence ref ${ref}`
      )
    )
  ].find((failure) => failure !== undefined);
};

const normalizePairedLiveEvalEvidenceInput = (
  input: RecordPairedLiveEvalEvidenceInput
): RecordPairedLiveEvalEvidenceInput => {
  const normalized = {
    projectId: requiredTrimmedText(input.projectId, "project id"),
    runId: requiredTrimmedText(input.runId, "run id"),
    ...(input.feedbackDeltaId === undefined
      ? {}
      : { feedbackDeltaId: requiredTrimmedText(input.feedbackDeltaId, "feedback delta id") }),
    candidateId: requiredTrimmedText(input.candidateId, "candidate id"),
    candidateStatus: input.candidateStatus,
    title: requiredTrimmedText(input.title, "title"),
    scenario: requiredTrimmedText(input.scenario, "scenario"),
    family: requiredTrimmedText(input.family, "family"),
    expectedSignal: requiredTrimmedText(input.expectedSignal, "expected signal"),
    artifactStatus: input.artifactStatus,
    outcome: input.outcome,
    usefulnessOutcome: input.usefulnessOutcome,
    packetChecksum: requiredTrimmedText(input.packetChecksum, "packet checksum"),
    packetEvidenceRef: requiredTrimmedText(input.packetEvidenceRef, "packet evidence ref"),
    artifactHash: requiredTrimmedText(input.artifactHash, "artifact hash"),
    artifactRef: requiredTrimmedText(input.artifactRef, "artifact ref"),
    manifestHash: requiredTrimmedText(input.manifestHash, "manifest hash"),
    manifestRef: requiredTrimmedText(input.manifestRef, "manifest ref"),
    checkerRevision: requiredTrimmedText(input.checkerRevision, "checker revision"),
    checkerEvidenceRef: requiredTrimmedText(input.checkerEvidenceRef, "checker evidence ref"),
    environmentProfileHash: requiredTrimmedText(
      input.environmentProfileHash,
      "environment profile hash"
    ),
    environmentEvidenceRef: requiredTrimmedText(
      input.environmentEvidenceRef,
      "environment evidence ref"
    ),
    sourceEvidence: [...input.sourceEvidence],
    evidenceRefs: [...input.evidenceRefs],
    metadata: input.metadata ?? {}
  };

  const validationError = pairedLiveEvalEvidenceValidationFailure(normalized);
  if (validationError !== undefined) {
    throw new Error(validationError);
  }

  return normalized;
};

const pairedLiveEvalEvidenceComparable = (
  evidence: PairedLiveEvalEvidenceRecord | RecordPairedLiveEvalEvidenceInput
) => ({
  projectId: evidence.projectId,
  runId: evidence.runId,
  feedbackDeltaId: evidence.feedbackDeltaId ?? null,
  candidateId: evidence.candidateId,
  candidateStatus: evidence.candidateStatus,
  title: evidence.title,
  scenario: evidence.scenario,
  family: evidence.family,
  expectedSignal: evidence.expectedSignal,
  artifactStatus: evidence.artifactStatus,
  outcome: evidence.outcome,
  usefulnessOutcome: evidence.usefulnessOutcome,
  packetChecksum: evidence.packetChecksum,
  packetEvidenceRef: evidence.packetEvidenceRef,
  artifactHash: evidence.artifactHash,
  artifactRef: evidence.artifactRef,
  manifestHash: evidence.manifestHash,
  manifestRef: evidence.manifestRef,
  checkerRevision: evidence.checkerRevision,
  checkerEvidenceRef: evidence.checkerEvidenceRef,
  environmentProfileHash: evidence.environmentProfileHash,
  environmentEvidenceRef: evidence.environmentEvidenceRef,
  sourceEvidence: [...evidence.sourceEvidence],
  evidenceRefs: [...evidence.evidenceRefs],
  metadata: evidence.metadata ?? {}
});

const samePairedLiveEvalEvidence = (
  existing: PairedLiveEvalEvidenceRecord,
  input: RecordPairedLiveEvalEvidenceInput
): boolean =>
  JSON.stringify(canonicalJsonValue(pairedLiveEvalEvidenceComparable(existing))) ===
  JSON.stringify(canonicalJsonValue(pairedLiveEvalEvidenceComparable(input)));

const listPairedLiveEvalEvidenceLimit = (limit: number | undefined): number =>
  limit === undefined || !Number.isInteger(limit) || limit <= 0
    ? 100
    : Math.min(limit, 500);

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
      .select({ id: retrievalRuns.id, metadata: retrievalRuns.metadata })
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
      metadata: ownedRetrievalRun.metadata,
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

  async readHarnessRunAuthority(
    tx: KrnDatabaseTransaction,
    executionRunId: string
  ): Promise<HarnessRunAggregate | undefined> {
    const [lockedRun] = await tx
      .select({ id: executionRuns.id })
      .from(executionRuns)
      .where(eq(executionRuns.id, executionRunId))
      .limit(1)
      .for("update", { of: executionRuns });

    return lockedRun === undefined
      ? undefined
      : this.findHarnessRunAggregate(tx, executionRunId, true);
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
            status: "planned",
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

  async issueDecisionPacketForExecutionRun(
    executionRunId: string
  ): Promise<DecisionPacketContractReadback> {
    return this.db.transaction(async (tx) => {
      const aggregate = await this.readHarnessRunAuthority(tx, executionRunId);
      if (aggregate === undefined) {
        throw new Error(`Cannot issue DecisionPacket for missing execution run ${executionRunId}`);
      }
      if (aggregate.contextAssembly === undefined) {
        throw new Error(
          `Cannot issue DecisionPacket before context assembly exists for execution run ${executionRunId}`
        );
      }

      const existing = await tx.query.decisionPacketIssuances.findFirst({
        where: eq(decisionPacketIssuances.executionRunId, executionRunId)
      });
      if (existing !== undefined) {
        return mapDecisionPacketIssuance(existing);
      }

      const issuedAt = fromIsoTimestamp(aggregate.executionRun.updatedAt);
      const readback = buildDecisionPacketIssuance({
        aggregate,
        packetGeneratedAt: issuedAt.toISOString(),
        sha256Hex
      });
      const row = requireReturnedRow(
        await tx
          .insert(decisionPacketIssuances)
          .values({
            executionRunId,
            packetChecksum: readback.packetIdentity.checksum,
            packetGeneratedAt: issuedAt,
            sourceRunLifecycleRevision:
              readback.packetIdentity.sourceRunLifecycleRevision,
            readback
          })
          .returning(),
        "issueDecisionPacketForExecutionRun"
      );

      return mapDecisionPacketIssuance(row);
    });
  }

  async getIssuedDecisionPacketForExecutionRun(
    executionRunId: string
  ): Promise<DecisionPacketContractReadback | undefined> {
    const row = await this.db.query.decisionPacketIssuances.findFirst({
      where: eq(decisionPacketIssuances.executionRunId, executionRunId)
    });

    return row === undefined ? undefined : mapDecisionPacketIssuance(row);
  }

  async recordUsefulnessApplicationOnce(
    input: UsefulnessApplicationEvidenceIdentity
  ): Promise<RecordUsefulnessApplicationOnceResult> {
    const authorityInput = await normalizeUsefulnessApplicationIdentity(
      input,
      this.options.readTargetStateSnapshot ?? collectTargetStateSnapshot
    );

    return this.db.transaction(async (tx) => {
      await lockHarnessRunAuthority(
        tx,
        authorityInput,
        "recordUsefulnessApplicationOnce"
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

      const issuanceRow = requireLinkedRow(
        await tx.query.decisionPacketIssuances.findFirst({
          where: eq(decisionPacketIssuances.executionRunId, authorityInput.executionRunId)
        }),
        "recordUsefulnessApplicationOnce.decisionPacketIssuance"
      );
      const authorization = authorizeIssuedDecisionPacketUsefulness({
        aggregate,
        issuance: mapDecisionPacketIssuance(issuanceRow),
        runId: authorityInput.executionRunId,
        runtimeProjectId: authorityInput.projectId,
        callerPacketChecksum: authorityInput.packetChecksum,
        callerPacketGeneratedAt: authorityInput.packetGeneratedAt,
        callerSourceRunLifecycleRevision: authorityInput.sourceRunLifecycleRevision,
        subjects: [{
          kind: authorityInput.subjectKind,
          id: authorityInput.subjectId,
          evidenceRefs: [`packet:${authorityInput.packetChecksum}`]
        }]
      });
      if (!authorization.authorized) {
        throw new Error(`recordUsefulnessApplicationOnce rejected: ${authorization.reason}`);
      }
      if (authorization.sourceRunLifecycleRevision !== authorityInput.sourceRunLifecycleRevision) {
        throw new Error(
          "recordUsefulnessApplicationOnce rejected: packet lifecycle revision mismatch"
        );
      }
      return insertUsefulnessApplicationOnce(tx, authorityInput);
    });
  }

  async recordUsefulnessApplicationsOnce(
    input: readonly UsefulnessApplicationEvidenceIdentity[]
  ): Promise<readonly RecordUsefulnessApplicationOnceResult[]> {
    if (input.length === 0) {
      return [];
    }
    const authorityInputs = await Promise.all(input.map((application) =>
      normalizeUsefulnessApplicationIdentity(
        application,
        this.options.readTargetStateSnapshot ?? collectTargetStateSnapshot
      )
    ));
    const first = authorityInputs[0]!;

    return this.db.transaction(async (tx) => {
      await lockHarnessRunAuthority(tx, first, "recordUsefulnessApplicationsOnce");
      const aggregate = requireLinkedRow(
        await this.findHarnessRunAggregate(tx, first.executionRunId, true),
        "recordUsefulnessApplicationsOnce.harnessRunAggregate"
      );
      if (authorityInputs.some((application) =>
        application.executionRunId !== first.executionRunId ||
        application.projectId !== first.projectId ||
        application.taskContractId !== aggregate.taskContract.id ||
        application.packetChecksum !== first.packetChecksum ||
        application.packetGeneratedAt !== first.packetGeneratedAt ||
        application.sourceRunLifecycleRevision !== first.sourceRunLifecycleRevision
      )) {
        throw new Error(
          "recordUsefulnessApplicationsOnce rejected: batch does not share one issued packet identity"
        );
      }

      const issuanceRow = requireLinkedRow(
        await tx.query.decisionPacketIssuances.findFirst({
          where: eq(decisionPacketIssuances.executionRunId, first.executionRunId)
        }),
        "recordUsefulnessApplicationsOnce.decisionPacketIssuance"
      );
      const authorization = authorizeIssuedDecisionPacketUsefulness({
        aggregate,
        issuance: mapDecisionPacketIssuance(issuanceRow),
        runId: first.executionRunId,
        runtimeProjectId: first.projectId,
        callerPacketChecksum: first.packetChecksum,
        callerPacketGeneratedAt: first.packetGeneratedAt,
        callerSourceRunLifecycleRevision: first.sourceRunLifecycleRevision,
        subjects: authorityInputs.map((application) => ({
          kind: application.subjectKind,
          id: application.subjectId,
          evidenceRefs: [`packet:${application.packetChecksum}`]
        }))
      });
      if (!authorization.authorized) {
        const rejectedIndex = authorityInputs.findIndex((application) =>
          authorization.reason.includes(`${application.subjectKind}:${application.subjectId}`)
        );
        throw new Error(
          `recordUsefulnessApplicationsOnce rejected item ${rejectedIndex}: ${authorization.reason}`
        );
      }

      const results: RecordUsefulnessApplicationOnceResult[] = [];
      for (const [index, application] of authorityInputs.entries()) {
        try {
          results.push(await insertUsefulnessApplicationOnce(tx, application));
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(
            `recordUsefulnessApplicationsOnce rejected item ${index} ${application.subjectKind}:${application.subjectId}: ${reason}`
          );
        }
      }
      return results;
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

  async createReviewFeedbackOnce(
    input: CreateReviewFeedbackOnceInput
  ): Promise<CreateReviewFeedbackOnceResult> {
    const authorityInput = snapshotRepositoryInput(input);
    const requestIdentity = authorityInput.requestIdentity.trim();

    if (requestIdentity.length === 0) {
      throw new Error("createReviewFeedbackOnce requires request identity");
    }

    const requestFingerprint = reviewFeedbackRequestFingerprint({
      ...authorityInput,
      requestIdentity
    });

    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`review:${authorityInput.evidenceBundleId}`}, 0))`
      );

      requireReturnedRow(
        await tx
          .select({ id: evidenceBundles.id })
          .from(evidenceBundles)
          .where(eq(evidenceBundles.id, authorityInput.evidenceBundleId))
          .for("update"),
        "createReviewFeedbackOnce.evidenceBundle"
      );

      const existing = await existingReviewFeedbackOnceResult(
        tx,
        authorityInput,
        requestIdentity,
        requestFingerprint
      );
      if (existing !== undefined) {
        return existing;
      }

      await assertNoLegacyReviewFeedback(tx, authorityInput.evidenceBundleId);

      return insertReviewFeedbackChain(
        tx,
        authorityInput,
        requestIdentity,
        requestFingerprint,
        this.options.faultAfterStage
      );
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
      ).catch((error: unknown) => {
        if (
          error instanceof Error &&
          error.message.includes("execution run project does not match declared project")
        ) {
          throw new EvidenceFeedbackIdentityConflictError(
            authorityInput.executionRunId,
            captureIdentity
          );
        }

        throw error;
      });
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
        evidenceFeedbackSemanticInput(authorityInput),
        aggregate,
        this.options.readTargetStateSnapshot ?? collectTargetStateSnapshot,
        authorityInput.semanticRequest === undefined ? "reject" : "persist_unbound"
      );

      return insertEvidenceFeedbackChain(
        tx,
        admittedInput,
        captureIdentity,
        this.options.faultAfterStage,
        evidenceFeedbackRequestFingerprint(authorityInput)
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

  async recordPairedLiveEvalEvidenceOnce(
    input: RecordPairedLiveEvalEvidenceInput
  ): Promise<RecordPairedLiveEvalEvidenceResult> {
    const authorityInput = normalizePairedLiveEvalEvidenceInput(
      snapshotRepositoryInput(input)
    );

    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`paired-live-eval:${authorityInput.candidateId}`}, 0))`
      );

      const [inserted] = await tx
        .insert(pairedLiveEvalEvidence)
        .values({
          projectId: authorityInput.projectId,
          runId: authorityInput.runId,
          ...(authorityInput.feedbackDeltaId === undefined
            ? {}
            : { feedbackDeltaId: authorityInput.feedbackDeltaId }),
          candidateId: authorityInput.candidateId,
          candidateStatus: authorityInput.candidateStatus,
          title: authorityInput.title,
          scenario: authorityInput.scenario,
          family: authorityInput.family,
          expectedSignal: authorityInput.expectedSignal,
          artifactStatus: authorityInput.artifactStatus,
          outcome: authorityInput.outcome,
          usefulnessOutcome: authorityInput.usefulnessOutcome,
          packetChecksum: authorityInput.packetChecksum,
          packetEvidenceRef: authorityInput.packetEvidenceRef,
          artifactHash: authorityInput.artifactHash,
          artifactRef: authorityInput.artifactRef,
          manifestHash: authorityInput.manifestHash,
          manifestRef: authorityInput.manifestRef,
          checkerRevision: authorityInput.checkerRevision,
          checkerEvidenceRef: authorityInput.checkerEvidenceRef,
          environmentProfileHash: authorityInput.environmentProfileHash,
          environmentEvidenceRef: authorityInput.environmentEvidenceRef,
          sourceEvidence: authorityInput.sourceEvidence,
          evidenceRefs: authorityInput.evidenceRefs,
          metadata: authorityInput.metadata ?? {}
        })
        .onConflictDoNothing()
        .returning();
      if (inserted !== undefined) {
        return {
          evidence: mapPairedLiveEvalEvidence(inserted),
          created: true
        };
      }

      const existing = await tx.query.pairedLiveEvalEvidence.findFirst({
        where: eq(pairedLiveEvalEvidence.candidateId, authorityInput.candidateId)
      });
      if (existing === undefined) {
        throw new Error(
          `paired-live eval evidence identity conflict for artifact ${authorityInput.artifactRef}`
        );
      }

      const evidence = mapPairedLiveEvalEvidence(existing);
      if (!samePairedLiveEvalEvidence(evidence, authorityInput)) {
        throw new Error(
          `paired-live eval evidence identity conflict for candidate ${authorityInput.candidateId}`
        );
      }

      return {
        evidence,
        created: false
      };
    });
  }

  async listPairedLiveEvalEvidence(
    input: ListPairedLiveEvalEvidenceInput
  ): Promise<PairedLiveEvalEvidenceRecord[]> {
    const conditions: SQL[] = [
      eq(pairedLiveEvalEvidence.projectId, input.projectId)
    ];
    if (input.runId !== undefined) {
      conditions.push(eq(pairedLiveEvalEvidence.runId, input.runId));
    }
    if (input.candidateId !== undefined) {
      conditions.push(eq(pairedLiveEvalEvidence.candidateId, input.candidateId));
    }
    if (input.scenario !== undefined) {
      conditions.push(eq(pairedLiveEvalEvidence.scenario, input.scenario));
    }
    if (input.outcome !== undefined) {
      conditions.push(eq(pairedLiveEvalEvidence.outcome, input.outcome));
    }
    if (input.usefulnessOutcome !== undefined) {
      conditions.push(eq(pairedLiveEvalEvidence.usefulnessOutcome, input.usefulnessOutcome));
    }

    const rows = await this.db
      .select()
      .from(pairedLiveEvalEvidence)
      .where(conditions.length === 0 ? undefined : and(...conditions))
      .orderBy(desc(pairedLiveEvalEvidence.createdAt), desc(pairedLiveEvalEvidence.id))
      .limit(listPairedLiveEvalEvidenceLimit(input.limit));

    return rows.map(mapPairedLiveEvalEvidence);
  }

  async listFeedbackDeltasForProject(projectId: string, limit = 100): Promise<FeedbackDelta[]> {
    const rows = await this.db
      .select({
        feedbackDelta: feedbackDeltas,
        captureChannel: evidenceBundles.captureChannel,
        taskContractId: taskContracts.id,
        taskObjective: taskContracts.objective
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

    return rows.map((row) => {
      const feedbackDelta = mapFeedbackDeltaForAuthorityRead(
        row.feedbackDelta,
        row.captureChannel
      );

      return {
        ...feedbackDelta,
        metadata: {
          ...feedbackDelta.metadata,
          [feedbackTaskContractIdMetadataKey]: row.taskContractId,
          [feedbackTaskObjectiveMetadataKey]: row.taskObjective
        }
      };
    });
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
