import { createHash } from "node:crypto";

import {
  createCommandOutputArtifact,
  currentDecisionPacketBindingForHarnessRun,
  decisionPacketBindingReadbackFromMetadata
} from "@krn/core";
import type {
  CommandOutputArtifact,
  EvidenceCommand,
  IsoTimestamp
} from "@krn/core";
import type {
  CreateEvidenceFeedbackOnceInput
} from "@krn/core/repositories";
import { MemoryApplicationIdentityConflictError } from "@krn/core/repositories/internal";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";

import {
  assertSmokeReadbackChecks,
  cleanupMemoryGovernanceSmokeRows,
  countMemoryGovernanceSmokeMarkerRows,
  createCompiledSmokeExecution,
  createSmokeRuntime,
  requireSmokeReadbackValue
} from "./db-smoke-support.js";
import { createKrnDatabase } from "../../database.js";
import {
  DrizzleMemoryRepository,
  DrizzleProjectRepository
} from "../../repositories/index.js";
import {
  antiMemoryRecords,
  antiMemoryCandidates,
  harnessPlans,
  memoryApplications,
  memoryFeedbackEvents,
  memoryRecords,
  memoryRecordVersions,
  outboxEvents,
  usefulnessApplications
} from "../../schema/index.js";

const memoryGovernanceCheckpointCommand =
  "memory-governance checkpoint: current harness aggregate readback";
const packetBoundApplicationExpectedUse = "Guide memory governance smoke.";

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

type MemoryGovernanceVerificationMode =
  | "successful"
  | "failed"
  | "missing_required"
  | "unresolved_output";

const memoryGovernanceArtifactVerificationModes = new Set<MemoryGovernanceVerificationMode>([
  "successful",
  "failed"
]);

const memoryGovernanceCheckpointMatches = (input: {
  executionRunId: string;
  expectedExecutionRunId: string;
  expectedHarnessPlanId: string;
  expectedLifecycleRevision: number;
  harnessPlanId: string;
  lifecycleRevision: number;
}): boolean =>
  input.executionRunId === input.expectedExecutionRunId &&
  input.harnessPlanId === input.expectedHarnessPlanId &&
  input.lifecycleRevision === input.expectedLifecycleRevision;

const canonicalVerificationReadbackMatches = (input: {
  admittedBinding: ReturnType<typeof decisionPacketBindingReadbackFromMetadata>;
  expectedArtifactCount: number;
  packetBinding: ReturnType<typeof currentDecisionPacketBindingForHarnessRun>;
  persistedArtifactCount: number;
}): boolean =>
  input.admittedBinding.status === "bound_current" &&
  input.admittedBinding.checksum === input.packetBinding.packetChecksum &&
  input.admittedBinding.generatedAt === input.packetBinding.packetGeneratedAt &&
  input.admittedBinding.sourceRunLifecycleRevision ===
    input.packetBinding.sourceRunLifecycleRevision &&
  input.persistedArtifactCount === input.expectedArtifactCount;

const unresolvedOutputCommand = (
  command: string,
  outputRef: string,
  capturedAt: IsoTimestamp
): EvidenceCommand => ({
  command,
  status: "passed",
  provenance: "captured_output_file",
  exitCode: 0,
  capturedAt,
  outputRef
});

const memoryGovernanceCheckpointArtifacts = (input: {
  commands: readonly { command: string }[];
  completedAt: IsoTimestamp;
  executionRunId: string;
  expectedExecutionRunId: string;
  expectedHarnessPlanId: string;
  expectedLifecycleRevision: number;
  harnessPlanId: string;
  lifecycleRevision: number;
  passed: boolean;
  startedAt: IsoTimestamp;
}): CommandOutputArtifact[] => input.commands.map((command) =>
  createCommandOutputArtifact({
    command: command.command,
    exitCode: input.passed ? 0 : 7,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    stdout: new TextEncoder().encode(JSON.stringify({
      checkpoint: "current_harness_aggregate_readback",
      executionRunId: input.executionRunId,
      expectedExecutionRunId: input.expectedExecutionRunId,
      harnessPlanId: input.harnessPlanId,
      expectedHarnessPlanId: input.expectedHarnessPlanId,
      lifecycleRevision: input.lifecycleRevision,
      expectedLifecycleRevision: input.expectedLifecycleRevision
    })),
    stderr: input.passed
      ? new Uint8Array()
      : new TextEncoder().encode(JSON.stringify({
          checkpoint: "current_harness_aggregate_readback",
          lifecycleRevision: input.lifecycleRevision,
          expectedLifecycleRevision: input.expectedLifecycleRevision
        }))
  }, sha256Hex)
);

const memoryGovernanceVerificationCommands = (input: {
  artifacts: readonly CommandOutputArtifact[];
  capturedAt: IsoTimestamp;
  commands: readonly { command: string }[];
  marker: string;
  mode: MemoryGovernanceVerificationMode;
}): EvidenceCommand[] => {
  if (input.mode === "missing_required") {
    return [];
  }

  if (input.mode === "unresolved_output") {
    return input.commands.map((command, index) => unresolvedOutputCommand(
      command.command,
      `smoke:${input.marker}:memory-governance-unresolved-output:${index}`,
      input.capturedAt
    ));
  }

  return input.artifacts.map((artifact) => ({
    command: artifact.command,
    status: artifact.exitCode === 0 ? "passed" : "failed",
    provenance: "command_runner",
    exitCode: artifact.exitCode,
    capturedAt: artifact.completedAt,
    outputRef: artifact.outputRef
  }));
};

const assertRejected = async (
  operation: Promise<unknown>,
  expectedError: string,
  message: string
): Promise<void> => {
  try {
    await operation;
  } catch (error) {
    if (error instanceof Error && error.message.includes(expectedError)) {
      return;
    }

    throw new Error(
      `${message}: unexpected rejection ${error instanceof Error ? error.message : "unknown error"}`
    );
  }

  throw new Error(message);
};

const assertMemoryApplicationIdentityConflict = async (input: {
  executionRunId: string;
  memoryRecordId: string;
  operation: Promise<unknown>;
  packetChecksum: string;
  message: string;
}): Promise<void> => {
  try {
    await input.operation;
  } catch (error) {
    if (
      error instanceof MemoryApplicationIdentityConflictError &&
      error.executionRunId === input.executionRunId &&
      error.memoryRecordId === input.memoryRecordId &&
      error.packetChecksum === input.packetChecksum
    ) {
      return;
    }

    throw new Error(
      `${input.message}: unexpected rejection ${error instanceof Error ? error.message : "unknown error"}`
    );
  }

  throw new Error(input.message);
};

const fulfilledCount = <Value>(
  results: readonly PromiseSettledResult<Value>[]
): number => results.filter((result) => result.status === "fulfilled").length;

export interface MemoryGovernanceSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface MemoryGovernanceSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  sourceClaimId: string;
  memoryCandidateId: string;
  readBackMemoryCandidateId: string;
  reviewedMemoryCandidateStatus: string;
  memoryRecordId: string;
  readBackMemoryRecordId: string;
  memoryRecordVersionId: string;
  invalidatedMemoryRecordStatus: string;
  activeMemoryAfterInvalidationCount: number;
  memoryApplicationId: string;
  antiMemoryCandidateId: string;
  reviewedAntiMemoryCandidateStatus: string;
  antiMemoryRecordId: string;
  runAntiMemoryCount: number;
  projectMemoryRecordCount: number;
  outboxEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

// fallow-ignore-next-line complexity -- this DB smoke intentionally sequences lifecycle, independent-connection, and exact readback falsifiers
export const runMemoryGovernanceSmokeCheck = async (
  input: MemoryGovernanceSmokeInput
): Promise<MemoryGovernanceSmokeReport> => {
  const runtime = await createSmokeRuntime({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    projectSlug: "memory-governance",
    smokeId: input.smokeId,
    smokeName: "memory governance smoke",
    workspacePrefix: "krn-memory-governance-smoke"
  });
  const { client, db, marker, projectSlug, workspaceSlug } = runtime;
  const task = `memory governance smoke ${marker}`;
  let retrievalRunId: string | undefined;
  let failedCommandEvidenceRejected = false;
  let missingRequiredCommandEvidenceRejected = false;
  let unresolvedOutputReferenceEvidenceRejected = false;
  let mismatchedPacketIssuanceRejected = false;
  let staleLifecycleRevisionRejected = false;
  let fabricatedApplicationAuthorityRejected = false;
  let crossRunTaskContextRejected = false;
  let crossProjectMemoryApplicationRejected = false;
  let unselectedMemoryApplicationRejected = false;
  let conflictingRetryRejected = false;
  let conflictRaceApplicationCount = 0;
  let conflictRaceEffectCount = 0;
  let conflictRaceOutboxExact = false;
  let conflictRaceCounterUnchanged = false;
  let conflictRaceWinnerApplicationId: string | undefined;
  let historicalExactRetryPreserved = false;

  const cleanup = async (): Promise<number> => {
    await cleanupMemoryGovernanceSmokeRows({
      db,
      marker,
      retrievalRunId,
      workspaceSlug
    });

    return countMemoryGovernanceSmokeMarkerRows({
      db,
      marker,
      retrievalRunId,
      workspaceSlug
    });
  };

  try {
    await cleanup();

    const {
      executionRun,
      harnessRunRepository,
      memoryRepository,
      project,
      result,
      retrievalRunId: compiledRetrievalRunId,
      sourceRepository,
      workspace
    } = await createCompiledSmokeExecution({
      acceptance: "read back memory records and clean smoke rows",
      command: "db:smoke:memory-governance",
      constraints: ["persist reviewed memory candidates and anti-memory"],
      db,
      includeEvidenceContract: true,
      marker,
      nonGoals: ["do not mutate runtime markdown memory"],
      projectSlug,
      task,
      workspaceSlug
    });
    // This smoke executes an in-process readback checkpoint, not the compiler's pnpm defaults.
    const memoryGovernanceEvidenceContract = {
      ...result.evidenceContract,
      commands: [{ command: memoryGovernanceCheckpointCommand, required: true }]
    };
    await db
      .update(harnessPlans)
      .set({
        metadata: {
          ...result.harnessPlan.metadata,
          evidenceContract: memoryGovernanceEvidenceContract
        }
      })
      .where(eq(harnessPlans.id, result.harnessPlan.id));
    retrievalRunId = compiledRetrievalRunId;
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://memory-governance-smoke/${marker}`,
      title: "Memory governance smoke source",
      contentHash: `memory-governance-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "KRN Memory Core must promote candidates through reviewed records.",
      mechanism: "Postgres stores candidates, records, versions, applications, and anti-memory.",
      krnImplication: "KRN can audit how memory becomes active context.",
      doesNotProve: "This does not prove activation ranking quality.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M23 memory governance smoke",
      falsifier: "Memory governance smoke readback or cleanup fails.",
      revisitWhen: "Memory governance repository contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const readBackSourceClaim = await sourceRepository.getSourceClaimById(sourceClaim.id);
    const memoryCandidate = await memoryRepository.createMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      proposedBy: "memory-governance-smoke",
      kind: "constraint",
      status: "proposed",
      summary: "Promote memory through reviewed candidates",
      body: "Memory records must originate from explicit candidate review.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use before accepting new runtime memory.",
      invalidationRule: "Revisit if memory promotion becomes automatic.",
      sourceClaimIds: [sourceClaim.id],
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker
      }
    });
    const readBackCandidate = await memoryRepository.getMemoryCandidateById(memoryCandidate.id);
    const concurrentMemoryCandidate = await memoryRepository.createMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      proposedBy: "memory-governance-concurrency-smoke",
      kind: "constraint",
      status: "proposed",
      summary: "Concurrent memory promotion must have one winner",
      body: "A candidate may create at most one accepted memory record.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use only after explicit concurrent review arbitration.",
      invalidationRule: "Revisit when candidate promotion concurrency changes.",
      sourceClaimIds: [sourceClaim.id],
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "concurrent-memory-promotion"
      }
    });
    const concurrentMemoryClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];

    try {
      const concurrentMemoryRepositories = concurrentMemoryClients.map(
        (concurrentClient) => new DrizzleMemoryRepository(createKrnDatabase(concurrentClient))
      );
      const [firstConcurrentMemoryRepository, secondConcurrentMemoryRepository] =
        concurrentMemoryRepositories;

      if (firstConcurrentMemoryRepository === undefined || secondConcurrentMemoryRepository === undefined) {
        throw new Error("Memory governance concurrency smoke did not create two memory repositories");
      }

      const concurrentMemoryPromotionResults = await Promise.allSettled([
        firstConcurrentMemoryRepository.promoteReviewedMemoryCandidate({
          candidateId: concurrentMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-a",
          decision: "accepted",
          recordKey: `memory-governance-concurrent-a:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-memory-promotion"
          }
        }),
        secondConcurrentMemoryRepository.promoteReviewedMemoryCandidate({
          candidateId: concurrentMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-b",
          decision: "accepted",
          recordKey: `memory-governance-concurrent-b:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-memory-promotion"
          }
        })
      ]);
      const concurrentMemoryRows = await db
        .select()
        .from(memoryRecords)
        .where(sql`${memoryRecords.metadata}->>'lifecycleProbe' = 'concurrent-memory-promotion'
          AND ${memoryRecords.metadata}->>'smokeId' = ${marker}`);
      const concurrentMemoryCandidateReadback = await memoryRepository.getMemoryCandidateById(
        concurrentMemoryCandidate.id
      );

      assertSmokeReadbackChecks([
        {
          label: "concurrent memory promotion has one winner",
          passed: fulfilledCount(concurrentMemoryPromotionResults) === 1
        },
        {
          label: "concurrent memory promotion creates one record",
          passed: concurrentMemoryRows.length === 1
        },
        {
          label: "concurrent memory candidate is accepted once",
          passed: concurrentMemoryCandidateReadback?.status === "accepted"
        }
      ], "Memory governance concurrency falsifier failed");
    } finally {
      await Promise.all(concurrentMemoryClients.map((concurrentClient) => concurrentClient.end()));
    }

    const memoryRecord = await memoryRepository.promoteMemoryCandidate({
      candidateId: memoryCandidate.id,
      reviewer: "memory-governance-smoke",
      decision: "accepted",
      recordKey: `memory-governance-smoke:${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const applicationContextAssembly = await harnessRunRepository.createContextAssembly({
      harnessPlanId: result.harnessPlan.id,
      status: "assembled",
      tokenBudget: 256,
      inclusions: [{
        subjectType: "memory_record",
        subjectId: memoryRecord.id,
        reason: "Select the governed memory before recording its application.",
        expectedUse: packetBoundApplicationExpectedUse,
        sourceAuthority: "project-decision"
      }],
      exclusions: [],
      metadata: {
        smokeId: marker,
        canonicalRevisionTokens: [{
          subjectType: "memory_record",
          subjectId: memoryRecord.id,
          updatedAt: memoryRecord.updatedAt,
          status: memoryRecord.status,
          currentVersionId: memoryRecord.currentVersionId
        }]
      }
    });
    const issueDecisionPacket = harnessRunRepository.issueDecisionPacketForExecutionRun;
    if (issueDecisionPacket === undefined) {
      throw new Error("Memory governance smoke requires persisted DecisionPacket issuance");
    }
    const issuedDecisionPacket = await issueDecisionPacket.call(
      harnessRunRepository,
      executionRun.id
    );
    const issuedPacketBinding = {
      packetChecksum: issuedDecisionPacket.packetIdentity.checksum,
      packetEvidenceRef: issuedDecisionPacket.packetIdentity.evidenceRef,
      packetGeneratedAt: issuedDecisionPacket.packetIdentity.generatedAt,
      sourceRunLifecycleRevision:
        issuedDecisionPacket.packetIdentity.sourceRunLifecycleRevision
    };
    const createIssuedMemoryApplicationRun = async (
      suffix: string,
      selectedMemoryRecordId: string
    ) => {
      const selectedMemory = await memoryRepository.getMemoryRecordById(
        selectedMemoryRecordId
      );
      if (selectedMemory === undefined) {
        throw new Error(`Memory governance lost selected memory for ${suffix}`);
      }
      const intent = await harnessRunRepository.createOperatorIntent({
        workspaceId: workspace.id,
        projectId: project.id,
        source: "cli",
        rawIntent: `${task} ${suffix}`,
        metadata: { smokeId: marker }
      });
      const contract = await harnessRunRepository.createTaskContract({
        operatorIntentId: intent.id,
        projectId: project.id,
        title: `${task} ${suffix}`,
        objective: `Exercise ${suffix} with its own immutable issued packet.`,
        constraints: [],
        nonGoals: [],
        acceptance: [`${suffix} remains packet-bound.`],
        metadata: { smokeId: marker }
      });
      const plan = await harnessRunRepository.createHarnessPlan({
        taskContractId: contract.id,
        version: 1,
        status: "running",
        summary: `${suffix} memory application authority`,
        nextAction: `Apply only ${selectedMemoryRecordId}.`,
        metadata: {
          smokeId: marker,
          evidenceContract: {
            ...memoryGovernanceEvidenceContract,
            taskContractId: contract.id
          }
        }
      });
      await harnessRunRepository.createContextAssembly({
        harnessPlanId: plan.id,
        status: "assembled",
        tokenBudget: 128,
        inclusions: [{
          subjectType: "memory_record",
          subjectId: selectedMemoryRecordId,
          reason: `Select memory for ${suffix}.`,
          expectedUse: `Exercise ${suffix}.`,
          sourceAuthority: "project-decision"
        }],
        exclusions: [],
        metadata: {
          smokeId: marker,
          canonicalRevisionTokens: [{
            subjectType: "memory_record",
            subjectId: selectedMemory.id,
            updatedAt: selectedMemory.updatedAt,
            status: selectedMemory.status,
            currentVersionId: selectedMemory.currentVersionId
          }]
        }
      });
      const run = await harnessRunRepository.createExecutionRun({
        harnessPlanId: plan.id,
        adapter: "codex",
        metadata: { smokeId: marker }
      });
      const issuance = await issueDecisionPacket.call(harnessRunRepository, run.id);

      return {
        executionRunId: run.id,
        harnessPlanId: plan.id,
        packetBinding: {
          packetChecksum: issuance.packetIdentity.checksum,
          packetEvidenceRef: issuance.packetIdentity.evidenceRef,
          packetGeneratedAt: issuance.packetIdentity.generatedAt,
          sourceRunLifecycleRevision: issuance.packetIdentity.sourceRunLifecycleRevision
        }
      };
    };

    const revisionSourceRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-revision-source:${marker}`,
      kind: "constraint",
      status: "active",
      summary: "Atomic revision source",
      body: "The source record remains active until the reviewed revision commits.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for the atomic revision smoke.",
      invalidationRule: "Revisit after the revision probe.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: { smokeId: marker, lifecycleProbe: "atomic-memory-revision-source" }
    });
    const revisionCandidate = await memoryRepository.createMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      proposedBy: "memory-governance-revision-smoke",
      kind: "constraint",
      status: "candidate",
      summary: "Atomic reviewed memory replacement",
      body: "Replacement must commit with source supersession.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use after reviewed atomic revision.",
      invalidationRule: "Revisit when the revision is superseded.",
      sourceClaimIds: [sourceClaim.id],
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "atomic-memory-revision"
      }
    });
    const faultClient = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });
    try {
      const faultRepository = new DrizzleMemoryRepository(createKrnDatabase(faultClient), {
        faultAfterRevisionStage: (stage) => {
          if (stage === "after_promotion") throw new Error("fault:after_promotion");
        }
      });
      await assertRejected(
        faultRepository.applyReviewedMemoryRevision({
          candidateId: revisionCandidate.id,
          sourceMemoryRecordId: revisionSourceRecord.id,
          reviewer: "memory-governance-revision-fault",
          reason: "Atomic revision fault probe",
          recordKey: `memory-governance-revision:${marker}`,
          metadata: { smokeId: marker, lifecycleProbe: "atomic-memory-revision" }
        }),
        "fault:after_promotion",
        "Memory revision fault injection did not abort"
      );
    } finally {
      await faultClient.end();
    }
    const postFaultRevisionRows = await db.select().from(memoryRecords).where(sql`${memoryRecords.metadata}->>'lifecycleProbe' = 'atomic-memory-revision' AND ${memoryRecords.metadata}->>'smokeId' = ${marker}`);
    const postFaultCandidate = await memoryRepository.getMemoryCandidateById(revisionCandidate.id);
    if (postFaultRevisionRows.length !== 0 || postFaultCandidate?.status !== "candidate") {
      throw new Error("Memory revision fault injection left partial promotion state");
    }

    const revisionClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];
    try {
      const revisionRepositories = revisionClients.map((client) => new DrizzleMemoryRepository(createKrnDatabase(client)));
      const revisionResults = await Promise.allSettled(revisionRepositories.map((repository, index) => repository.applyReviewedMemoryRevision({
        candidateId: revisionCandidate.id,
        sourceMemoryRecordId: revisionSourceRecord.id,
        reviewer: `memory-governance-revision-race-${index}`,
        reason: "Concurrent reviewed revision race",
        recordKey: `memory-governance-revision:${marker}`,
        metadata: { smokeId: marker, lifecycleProbe: "atomic-memory-revision" }
      })));
      const revisionRows = await db.select().from(memoryRecords).where(sql`${memoryRecords.metadata}->>'lifecycleProbe' = 'atomic-memory-revision' AND ${memoryRecords.metadata}->>'smokeId' = ${marker}`);
      const revisionOutboxRows = await db.select().from(outboxEvents).where(sql`
        (${outboxEvents.topic} = 'memory.candidate.promoted' AND ${outboxEvents.payload}->>'memoryCandidateId' = ${revisionCandidate.id})
        OR (${outboxEvents.topic} = 'memory.record.superseded' AND ${outboxEvents.payload}->>'memoryRecordId' = ${revisionSourceRecord.id})
      `);
      const revisionCandidateReadback = await memoryRepository.getMemoryCandidateById(revisionCandidate.id);
      assertSmokeReadbackChecks([
        { label: "atomic memory revision fault leaves no replacement", passed: postFaultRevisionRows.length === 0 },
        { label: "atomic memory revision has one concurrent winner", passed: fulfilledCount(revisionResults) === 1 },
        { label: "atomic memory revision creates one replacement", passed: revisionRows.length === 1 },
        { label: "atomic memory revision accepts candidate once", passed: revisionCandidateReadback?.status === "accepted" },
        { label: "atomic memory revision emits promotion and supersession outbox", passed: revisionOutboxRows.filter((row) => row.topic === "memory.candidate.promoted").length === 1 && revisionOutboxRows.filter((row) => row.topic === "memory.record.superseded").length === 1 }
      ], "Atomic memory revision falsifier failed");
    } finally {
      await Promise.all(revisionClients.map((client) => client.end()));
    }
    const reviewedCandidate = await memoryRepository.getMemoryCandidateById(memoryCandidate.id);
    await assertRejected(
      memoryRepository.rejectMemoryCandidate({
        candidateId: memoryCandidate.id,
        reviewer: "memory-governance-smoke-after-accept",
        reason: "An accepted candidate must not be rejected afterward.",
        metadata: {
          smokeId: marker,
          lifecycleProbe: "reject-after-accept"
        }
      }),
      "expected proposed or candidate status",
      "Memory governance allowed rejection after acceptance"
    );
    const requiredVerificationCommands = memoryGovernanceEvidenceContract.commands.filter(
      (command) => command.required
    );

    if (requiredVerificationCommands.length === 0) {
      throw new Error("Memory governance smoke requires an active required verification command");
    }

    const createEvidenceFeedbackOnce = harnessRunRepository.createEvidenceFeedbackOnce;

    if (createEvidenceFeedbackOnce === undefined) {
      throw new Error(
        "Memory governance smoke requires repository-admitted atomic evidence feedback persistence"
      );
    }

    const primaryVerificationAuthority = {
      executionRunId: executionRun.id,
      harnessPlanId: result.harnessPlan.id
    };
    const createCanonicalVerificationEvidence = async (
      input: {
      captureSuffix: string;
      verificationMode: MemoryGovernanceVerificationMode;
      reviewBurden: string;
      eventType: string;
      eventMessage: string;
      },
      authority: {
        executionRunId: string;
        harnessPlanId: string;
      }
    ) => {
      const checkpointObservedAt = Date.now();
      const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(
        authority.executionRunId
      );

      if (aggregate === undefined) {
        throw new Error("Memory governance smoke requires a current harness run aggregate");
      }

      const packetBinding = currentDecisionPacketBindingForHarnessRun({
        aggregate,
        packetGeneratedAt: aggregate.executionRun.updatedAt,
        sha256Hex
      });
      const expectedLifecycleRevision = input.verificationMode === "failed"
        ? aggregate.executionRun.lifecycleRevision + 1
        : aggregate.executionRun.lifecycleRevision;
      const checkpointPassed = memoryGovernanceCheckpointMatches({
        executionRunId: aggregate.executionRun.id,
        expectedExecutionRunId: authority.executionRunId,
        expectedHarnessPlanId: authority.harnessPlanId,
        expectedLifecycleRevision,
        harnessPlanId: aggregate.harnessPlan.id,
        lifecycleRevision: aggregate.executionRun.lifecycleRevision
      });
      const checkpointCompletedAt = new Date().toISOString();
      const commandOutputArtifacts = memoryGovernanceArtifactVerificationModes.has(
        input.verificationMode
      )
        ? memoryGovernanceCheckpointArtifacts({
            commands: requiredVerificationCommands,
            completedAt: checkpointCompletedAt,
            executionRunId: aggregate.executionRun.id,
            expectedExecutionRunId: authority.executionRunId,
            expectedHarnessPlanId: authority.harnessPlanId,
            expectedLifecycleRevision,
            harnessPlanId: aggregate.harnessPlan.id,
            lifecycleRevision: aggregate.executionRun.lifecycleRevision,
            passed: checkpointPassed,
            startedAt: new Date(checkpointObservedAt).toISOString()
          })
        : [];
      const commands = memoryGovernanceVerificationCommands({
        artifacts: commandOutputArtifacts,
        capturedAt: new Date(checkpointObservedAt).toISOString(),
        commands: requiredVerificationCommands,
        marker,
        mode: input.verificationMode
      });
      const captureIdentity = `memory-governance:${marker}:${input.captureSuffix}`;
      const atomicInput = {
        executionRunId: authority.executionRunId,
        sourceRunLifecycleRevision: aggregate.executionRun.lifecycleRevision,
        projectId: project.id,
        captureIdentity,
        decisionPacketClaim: {
          checksum: packetBinding.packetChecksum,
          generatedAt: packetBinding.packetGeneratedAt
        },
        evidence: {
          status: "captured" as const,
          changedFiles: [],
          commands,
          ...(commandOutputArtifacts.length === 0
            ? {}
            : { commandOutputArtifacts }),
          diffRisk: "low" as const,
          reviewBurden: input.reviewBurden,
          rollbackPath: "Delete smoke marker rows.",
          event: {
            type: input.eventType,
            message: input.eventMessage,
            payload: {
              smokeId: marker,
              verificationProbe: input.captureSuffix
            }
          },
          metadata: {
            smokeId: marker,
            verificationProbe: input.captureSuffix
          }
        },
        review: {
          status: "pending" as const,
          reviewer: "memory-governance-smoke",
          summary: input.reviewBurden,
          findings: [],
          metadata: {
            smokeId: marker,
            verificationProbe: input.captureSuffix
          }
        },
        feedback: {
          status: "candidate" as const,
          memoryCandidates: [],
          sourceDecisions: [],
          evalCandidates: [],
          metadata: {
            smokeId: marker,
            verificationProbe: input.captureSuffix
          }
        }
      } satisfies CreateEvidenceFeedbackOnceInput;
      const persisted = await createEvidenceFeedbackOnce.call(
        harnessRunRepository,
        atomicInput
      );
      const admittedBinding = decisionPacketBindingReadbackFromMetadata(
        persisted.evidenceBundle.metadata
      );
      const persistedArtifactCount =
        persisted.evidenceBundle.commandOutputArtifacts?.length ?? 0;

      if (!canonicalVerificationReadbackMatches({
        admittedBinding,
        expectedArtifactCount: commandOutputArtifacts.length,
        packetBinding,
        persistedArtifactCount
      })) {
        throw new Error(
          `Memory governance ${input.captureSuffix} evidence lacked canonical repository admission`
        );
      }

      return {
        evidenceBundle: persisted.evidenceBundle,
        packetBinding
      };
    };
    const failedVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "failed-command",
      verificationMode: "failed",
      reviewBurden: "Memory governance failed command falsifier.",
      eventType: "smoke.memory_governance.failed_verification_captured",
      eventMessage: "Memory governance failed verification evidence captured"
    }, primaryVerificationAuthority);
    const missingRequiredVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "missing-required-command",
      verificationMode: "missing_required",
      reviewBurden: "Memory governance missing required command falsifier.",
      eventType: "smoke.memory_governance.missing_required_verification_captured",
      eventMessage: "Memory governance partial verification evidence captured"
    }, primaryVerificationAuthority);
    const unresolvedOutputVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "unresolved-output-reference",
      verificationMode: "unresolved_output",
      reviewBurden: "Memory governance unresolved output reference falsifier.",
      eventType: "smoke.memory_governance.unresolved_output_verification_captured",
      eventMessage: "Memory governance unresolved output verification evidence captured"
    }, primaryVerificationAuthority);
    const canonicalVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "successful-verification",
      verificationMode: "successful",
      reviewBurden: "Memory governance smoke proof.",
      eventType: "smoke.memory_governance.verification_captured",
      eventMessage: "Memory governance verification evidence captured"
    }, primaryVerificationAuthority);
    const helpedVerificationApplication = {
      memoryRecordId: memoryRecord.id,
      executionRunId: executionRun.id,
      packetChecksum: canonicalVerification.packetBinding.packetChecksum,
      packetGeneratedAt: canonicalVerification.packetBinding.packetGeneratedAt,
      sourceRunLifecycleRevision:
        canonicalVerification.packetBinding.sourceRunLifecycleRevision,
      evidenceBundleId: canonicalVerification.evidenceBundle.id,
      expectedUse: packetBoundApplicationExpectedUse,
      outcome: "helped",
      notes: "Verified explicit promotion and application feedback.",
      metadata: {
        smokeId: marker
      }
    } as const;
    const applicationAggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(
      executionRun.id
    );
    if (applicationAggregate === undefined) {
      throw new Error("Memory governance lost run before packet-bound application");
    }
    const applicationPacketBinding = issuedPacketBinding;
    const packetBoundApplication = {
      memoryRecordId: memoryRecord.id,
      executionRunId: executionRun.id,
      packetChecksum: applicationPacketBinding.packetChecksum,
      packetGeneratedAt: applicationPacketBinding.packetGeneratedAt,
      sourceRunLifecycleRevision: applicationPacketBinding.sourceRunLifecycleRevision,
      expectedUse: packetBoundApplicationExpectedUse,
      outcome: "neutral",
      notes: "Verified current selected memory application authority.",
      metadata: {
        smokeId: marker
      }
    } as const;
    const otherOperatorIntent = await harnessRunRepository.createOperatorIntent({
      workspaceId: workspace.id,
      projectId: project.id,
      source: "cli",
      rawIntent: `${task} other run`,
      metadata: { smokeId: marker }
    });
    const otherTaskContract = await harnessRunRepository.createTaskContract({
      operatorIntentId: otherOperatorIntent.id,
      projectId: project.id,
      title: `${task} other run`,
      objective: "Provide valid but cross-run task authority.",
      constraints: [],
      nonGoals: [],
      acceptance: ["Cross-run application authority rejects."],
      metadata: { smokeId: marker }
    });
    const otherHarnessPlan = await harnessRunRepository.createHarnessPlan({
      taskContractId: otherTaskContract.id,
      version: 1,
      status: "running",
      summary: "Other memory governance run",
      nextAction: "Remain unrelated to the canonical execution run.",
      metadata: { smokeId: marker }
    });
    const otherContextAssembly = await harnessRunRepository.createContextAssembly({
      harnessPlanId: otherHarnessPlan.id,
      status: "assembled",
      tokenBudget: 128,
      inclusions: [],
      exclusions: [],
      metadata: { smokeId: marker }
    });
    const crossProject = await new DrizzleProjectRepository(db).createProject({
      workspaceId: workspace.id,
      slug: `memory-governance-cross-project-${marker}`,
      displayName: `memory-governance-cross-project-${marker}`,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "cross-project-authority"
      }
    });
    const crossProjectApplicationMemory = await memoryRepository.createMemoryRecord({
      projectId: crossProject.id,
      key: `memory-governance-cross-project-application:${marker}`,
      kind: "constraint",
      summary: "Cross-project application authority probe",
      body: "A memory from another project cannot be applied to this execution run.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use only to falsify cross-project application admission.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        applicationKind: "cross-project-authority"
      }
    });

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        taskContractId: otherTaskContract.id,
        metadata: {
          smokeId: marker,
          applicationKind: "cross-run-task-authority"
        }
      }),
      "task contract does not match the execution run",
      "Memory governance accepted a task contract from another run before admission"
    );
    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        contextAssemblyId: otherContextAssembly.id,
        metadata: {
          smokeId: marker,
          applicationKind: "cross-run-context-authority"
        }
      }),
      "context assembly does not match the execution run",
      "Memory governance accepted a context assembly from another run before admission"
    );
    const rejectedLineageApplicationRows = await db
      .select({ id: memoryApplications.id })
      .from(memoryApplications)
      .where(sql`${memoryApplications.metadata}->>'applicationKind' IN (
        'cross-run-task-authority',
        'cross-run-context-authority'
      )`);
    const rejectedLineageOutboxRows = await db
      .select({ id: outboxEvents.id })
      .from(outboxEvents)
      .where(sql`${outboxEvents.topic} = 'memory.application.created'
        AND ${outboxEvents.payload}->>'memoryRecordId' = ${memoryRecord.id}
        AND ${outboxEvents.payload}->>'executionRunId' = ${executionRun.id}`);
    if (rejectedLineageApplicationRows.length !== 0 || rejectedLineageOutboxRows.length !== 0) {
      throw new Error("Rejected cross-run memory application authority left persisted effects");
    }
    crossRunTaskContextRejected = true;

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        memoryRecordId: crossProjectApplicationMemory.id,
        metadata: {
          smokeId: marker,
          applicationKind: "cross-project-authority"
        }
      }),
      "run, task project, and memory record do not match",
      "Memory governance accepted a memory record from another project before admission"
    );
    const rejectedProjectApplicationRows = await db
      .select({ id: memoryApplications.id })
      .from(memoryApplications)
      .where(eq(memoryApplications.memoryRecordId, crossProjectApplicationMemory.id));
    const rejectedProjectOutboxRows = await db
      .select({ id: outboxEvents.id })
      .from(outboxEvents)
      .where(sql`${outboxEvents.topic} = 'memory.application.created'
        AND ${outboxEvents.payload}->>'memoryRecordId' = ${crossProjectApplicationMemory.id}
        AND ${outboxEvents.payload}->>'executionRunId' = ${executionRun.id}`);
    if (rejectedProjectApplicationRows.length !== 0 || rejectedProjectOutboxRows.length !== 0) {
      throw new Error("Rejected cross-project memory application authority left persisted effects");
    }
    crossProjectMemoryApplicationRejected = true;

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...helpedVerificationApplication,
        packetChecksum: failedVerification.packetBinding.packetChecksum,
        packetGeneratedAt: failedVerification.packetBinding.packetGeneratedAt,
        sourceRunLifecycleRevision:
          failedVerification.packetBinding.sourceRunLifecycleRevision,
        evidenceBundleId: failedVerification.evidenceBundle.id
      }),
      "helped memory application requires a fresh successful verification EvidenceBundle",
      "Memory governance accepted failed command evidence"
    );
    failedCommandEvidenceRejected = true;

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...helpedVerificationApplication,
        packetChecksum: missingRequiredVerification.packetBinding.packetChecksum,
        packetGeneratedAt: missingRequiredVerification.packetBinding.packetGeneratedAt,
        sourceRunLifecycleRevision:
          missingRequiredVerification.packetBinding.sourceRunLifecycleRevision,
        evidenceBundleId: missingRequiredVerification.evidenceBundle.id
      }),
      "helped memory application requires a fresh successful verification EvidenceBundle",
      "Memory governance accepted incomplete required command evidence"
    );
    missingRequiredCommandEvidenceRejected = true;

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...helpedVerificationApplication,
        packetChecksum: unresolvedOutputVerification.packetBinding.packetChecksum,
        packetGeneratedAt: unresolvedOutputVerification.packetBinding.packetGeneratedAt,
        sourceRunLifecycleRevision:
          unresolvedOutputVerification.packetBinding.sourceRunLifecycleRevision,
        evidenceBundleId: unresolvedOutputVerification.evidenceBundle.id,
        metadata: {
          smokeId: marker,
          evidenceFalsifier: "unresolved-output-reference"
        }
      }),
      "helped memory application requires a fresh successful verification EvidenceBundle",
      "Memory governance accepted unresolved output reference evidence"
    );
    unresolvedOutputReferenceEvidenceRejected = true;
    const unresolvedOutputApplicationRows = await db
      .select()
      .from(memoryApplications)
      .where(eq(
        memoryApplications.decisionPacketChecksum,
        unresolvedOutputVerification.packetBinding.packetChecksum
      ));
    const [unresolvedOutputMemoryRecord] = await db
      .select({ positiveFeedbackCount: memoryRecords.positiveFeedbackCount })
      .from(memoryRecords)
      .where(eq(memoryRecords.id, memoryRecord.id));
    const unresolvedOutputOutboxRows = await db
      .select()
      .from(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}
        AND ${outboxEvents.payload}->>'evidenceFalsifier' = 'unresolved-output-reference'`);

    const packetApplicationClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];
    let applicationResults: readonly Awaited<
      ReturnType<DrizzleMemoryRepository["recordMemoryApplicationWithEffectsOnce"]>
    >[] = [];

    try {
      const packetApplicationRepositories = packetApplicationClients.map(
        (packetApplicationClient) => new DrizzleMemoryRepository(createKrnDatabase(packetApplicationClient))
      );
      const [firstPacketApplicationRepository, secondPacketApplicationRepository] =
        packetApplicationRepositories;

      if (firstPacketApplicationRepository === undefined || secondPacketApplicationRepository === undefined) {
        throw new Error("Memory governance smoke did not create two packet application repositories");
      }

      applicationResults = await Promise.all([
        firstPacketApplicationRepository.recordMemoryApplicationWithEffectsOnce(packetBoundApplication),
        secondPacketApplicationRepository.recordMemoryApplicationWithEffectsOnce(packetBoundApplication)
      ]);
    } finally {
      await Promise.all(packetApplicationClients.map((packetApplicationClient) => packetApplicationClient.end()));
    }

    const [firstApplicationResult, replayApplicationResult] = applicationResults;

    if (firstApplicationResult === undefined || replayApplicationResult === undefined) {
      throw new Error("Memory governance smoke did not return packet-bound application results");
    }

    const memoryApplication = firstApplicationResult.application;
    const createdApplicationCount = applicationResults.filter((result) => result?.created).length;
    const canonicalMemoryUsefulnessRows = await db
      .select()
      .from(usefulnessApplications)
      .where(eq(usefulnessApplications.applicationId, memoryApplication.id));

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        packetGeneratedAt: new Date(
          Date.parse(packetBoundApplication.packetGeneratedAt) - 1
        ).toISOString()
      }),
      "memory application identity conflict",
      "Memory governance accepted verification evidence from a different packet issuance"
    );
    mismatchedPacketIssuanceRejected = true;

    const unverifiedPacketApplication = packetBoundApplication;

    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...unverifiedPacketApplication,
        packetChecksum: `${packetBoundApplication.packetChecksum}:fabricated`,
        outcome: "neutral",
        metadata: {
          smokeId: marker,
          applicationKind: "fabricated-authority"
        }
      }),
      "memory application authority rejected",
      "Memory governance accepted fabricated packet authority"
    );
    fabricatedApplicationAuthorityRejected = true;

    const unselectedMemoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-unselected:${marker}`,
      kind: "constraint",
      summary: "Unselected memory application authority probe",
      body: "A current packet must not authorize memory that it did not select.",
      owner: "kernel",
      confidence: 70,
      applicationGuidance: "Use only as an unselected-subject falsifier.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: { smokeId: marker }
    });
    const unselectedAggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(
      executionRun.id
    );
    if (unselectedAggregate === undefined) {
      throw new Error("Memory governance lost run before unselected-memory falsifier");
    }
    const unselectedPacketBinding = currentDecisionPacketBindingForHarnessRun({
      aggregate: unselectedAggregate,
      packetGeneratedAt: unselectedAggregate.executionRun.updatedAt,
      sha256Hex
    });
    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        memoryRecordId: unselectedMemoryRecord.id,
        packetChecksum: unselectedPacketBinding.packetChecksum,
        packetGeneratedAt: unselectedPacketBinding.packetGeneratedAt,
        sourceRunLifecycleRevision: unselectedPacketBinding.sourceRunLifecycleRevision,
        notes: "Unselected memory must be rejected.",
        metadata: {
          smokeId: marker,
          applicationKind: "unselected-memory"
        }
      }),
      "is not selected by the issued packet",
      "Memory governance accepted an unselected memory record"
    );
    unselectedMemoryApplicationRejected = true;

    const conflictRaceMemory = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    if (conflictRaceMemory === undefined) {
      throw new Error("Memory governance lost memory before conflicting retry race");
    }
    await harnessRunRepository.createContextAssembly({
      harnessPlanId: result.harnessPlan.id,
      status: "assembled",
      tokenBudget: 256,
      inclusions: [{
        subjectType: "memory_record",
        subjectId: conflictRaceMemory.id,
        reason: "Select memory for conflicting application retry proof.",
        expectedUse: "Prove conflicting application retries reject.",
        sourceAuthority: "project-decision"
      }],
      exclusions: [],
      metadata: {
        smokeId: marker,
        canonicalRevisionTokens: [{
          subjectType: "memory_record",
          subjectId: conflictRaceMemory.id,
          updatedAt: conflictRaceMemory.updatedAt,
          status: conflictRaceMemory.status,
          currentVersionId: conflictRaceMemory.currentVersionId
        }]
      }
    });
    const conflictRaceAggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(
      executionRun.id
    );
    if (conflictRaceAggregate === undefined) {
      throw new Error("Memory governance lost run before conflicting retry race");
    }
    const conflictRaceAuthority = await createIssuedMemoryApplicationRun(
      "conflicting-retry-race",
      memoryRecord.id
    );
    const conflictRaceBinding = conflictRaceAuthority.packetBinding;
    const conflictRaceNeutralApplication = {
      memoryRecordId: memoryRecord.id,
      executionRunId: conflictRaceAuthority.executionRunId,
      packetChecksum: conflictRaceBinding.packetChecksum,
      packetGeneratedAt: conflictRaceBinding.packetGeneratedAt,
      sourceRunLifecycleRevision: conflictRaceBinding.sourceRunLifecycleRevision,
      expectedUse: "Prove conflicting application retries reject.",
      outcome: "neutral" as const,
      notes: "The deterministic neutral winner creates no review effects.",
      metadata: {
        smokeId: marker,
        applicationKind: "conflict-race"
      }
    };
    const conflictRaceStaleApplication = {
      ...conflictRaceNeutralApplication,
      outcome: "stale" as const,
      notes: "A conflicting stale retry must not reuse the neutral application identity.",
      negativeEffects: {
        outcome: "stale" as const,
        eventType: "stale_detected" as const,
        note: "Conflicting stale retry probe.",
        reason: "The same packet identity already admitted a neutral application.",
        metadata: {
          smokeId: marker,
          applicationKind: "conflict-race"
        },
        candidate: {
          key: `feedback:memory-governance-smoke:${marker}:conflict-race`,
          rejectedClaim: memoryRecord.summary,
          reason: "The conflicting retry must not create a candidate.",
          invalidatedBySourceClaimIds: memoryRecord.sourceLineage.map(
            (lineage) => lineage.sourceId
          ),
          appliesTo: memoryRecord.key,
          summary: "Conflicting retry must roll back.",
          body: "This candidate is a falsifier and must never persist.",
          owner: memoryRecord.owner,
          confidence: 70,
          sourceLineage: memoryRecord.sourceLineage
        }
      }
    };
    const conflictRaceClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];
    const [conflictWinnerClient, conflictLoserClient] = conflictRaceClients;
    if (conflictWinnerClient === undefined || conflictLoserClient === undefined) {
      throw new Error("Memory governance did not create conflicting retry clients");
    }
    let releaseWinner: () => void = () => {};
    const winnerRelease = new Promise<void>((resolve) => {
      releaseWinner = resolve;
    });
    let reportWinnerInserted: () => void = () => {};
    const winnerInserted = new Promise<void>((resolve) => {
      reportWinnerInserted = resolve;
    });
    try {
      const conflictWinnerRepository = new DrizzleMemoryRepository(
        createKrnDatabase(conflictWinnerClient),
        {
          faultAfterStage: async (stage) => {
            if (stage === "after_application") {
              reportWinnerInserted();
              await winnerRelease;
            }
          }
        }
      );
      const conflictLoserRepository = new DrizzleMemoryRepository(
        createKrnDatabase(conflictLoserClient)
      );
      const winnerApplication = conflictWinnerRepository
        .recordMemoryApplicationWithEffectsOnce(conflictRaceNeutralApplication);
      await winnerInserted;
      const loserApplication = conflictLoserRepository
        .recordMemoryApplicationWithEffectsOnce(conflictRaceStaleApplication);
      releaseWinner();
      const winnerResult = await winnerApplication;
      if (!winnerResult.created || winnerResult.application.outcome !== "neutral") {
        throw new Error("Memory governance conflicting retry race lacked its neutral winner");
      }
      conflictRaceWinnerApplicationId = winnerResult.application.id;
      await assertMemoryApplicationIdentityConflict({
        operation: loserApplication,
        memoryRecordId: memoryRecord.id,
        executionRunId: conflictRaceAuthority.executionRunId,
        packetChecksum: conflictRaceBinding.packetChecksum,
        message: "Memory governance conflicting stale retry reused the neutral identity"
      });
      await assertMemoryApplicationIdentityConflict({
        operation: conflictLoserRepository.recordMemoryApplicationWithEffectsOnce({
          ...conflictRaceNeutralApplication,
          notes: "Changed notes only."
        }),
        memoryRecordId: memoryRecord.id,
        executionRunId: conflictRaceAuthority.executionRunId,
        packetChecksum: conflictRaceBinding.packetChecksum,
        message: "Memory governance accepted a notes-only conflicting retry"
      });
      await assertMemoryApplicationIdentityConflict({
        operation: conflictLoserRepository.recordMemoryApplicationWithEffectsOnce({
          ...conflictRaceNeutralApplication,
          evidenceBundleId: canonicalVerification.evidenceBundle.id
        }),
        memoryRecordId: memoryRecord.id,
        executionRunId: conflictRaceAuthority.executionRunId,
        packetChecksum: conflictRaceBinding.packetChecksum,
        message: "Memory governance accepted an evidence-only conflicting retry"
      });
      await assertMemoryApplicationIdentityConflict({
        operation: conflictLoserRepository.recordMemoryApplicationWithEffectsOnce({
          ...conflictRaceNeutralApplication,
          outcome: "helped"
        }),
        memoryRecordId: memoryRecord.id,
        executionRunId: conflictRaceAuthority.executionRunId,
        packetChecksum: conflictRaceBinding.packetChecksum,
        message: "Memory governance accepted an outcome-only conflicting retry"
      });
      await assertMemoryApplicationIdentityConflict({
        operation: conflictLoserRepository.recordMemoryApplicationWithEffectsOnce({
          ...conflictRaceNeutralApplication,
          metadata: {
            ...conflictRaceNeutralApplication.metadata,
            retryVariant: "metadata-only"
          }
        }),
        memoryRecordId: memoryRecord.id,
        executionRunId: conflictRaceAuthority.executionRunId,
        packetChecksum: conflictRaceBinding.packetChecksum,
        message: "Memory governance accepted a metadata-only conflicting retry"
      });
      conflictingRetryRejected = true;
    } finally {
      releaseWinner();
      await Promise.all(conflictRaceClients.map((conflictClient) => conflictClient.end()));
    }
    const conflictRaceApplicationRows = await db
      .select()
      .from(memoryApplications)
      .where(sql`${memoryApplications.metadata}->>'smokeId' = ${marker}
        AND ${memoryApplications.metadata}->>'applicationKind' = 'conflict-race'`);
    conflictRaceApplicationCount = conflictRaceApplicationRows.length;
    const conflictRaceFeedbackRows = await db
      .select()
      .from(memoryFeedbackEvents)
      .where(sql`${memoryFeedbackEvents.metadata}->>'smokeId' = ${marker}
        AND ${memoryFeedbackEvents.metadata}->>'applicationKind' = 'conflict-race'`);
    const conflictRaceCandidateRows = await db
      .select()
      .from(antiMemoryCandidates)
      .where(sql`${antiMemoryCandidates.metadata}->>'smokeId' = ${marker}
        AND ${antiMemoryCandidates.metadata}->>'applicationKind' = 'conflict-race'`);
    conflictRaceEffectCount = conflictRaceFeedbackRows.length + conflictRaceCandidateRows.length;
    const conflictRaceApplicationId = conflictRaceApplicationRows[0]?.id;
    if (conflictRaceApplicationId !== undefined) {
      const conflictRaceOutboxRows = await db
        .select()
        .from(outboxEvents)
        .where(sql`${outboxEvents.topic} = 'memory.application.created'
          AND ${outboxEvents.payload}->>'memoryApplicationId' = ${conflictRaceApplicationId}`);
      conflictRaceOutboxExact =
        conflictRaceOutboxRows.length === 1 &&
        conflictRaceOutboxRows[0]?.topic === "memory.application.created";
    }
    const conflictRaceMemoryAfter = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    conflictRaceCounterUnchanged =
      conflictRaceMemoryAfter?.positiveFeedbackCount === conflictRaceMemory.positiveFeedbackCount &&
      conflictRaceMemoryAfter?.negativeFeedbackCount === conflictRaceMemory.negativeFeedbackCount;

    const negativeSelectedMemory = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    if (negativeSelectedMemory === undefined) {
      throw new Error("Memory governance lost selected memory before negative application");
    }
    await harnessRunRepository.createContextAssembly({
      harnessPlanId: result.harnessPlan.id,
      status: "assembled",
      tokenBudget: 256,
      inclusions: [{
        subjectType: "memory_record",
        subjectId: negativeSelectedMemory.id,
        reason: "Select memory for canonical negative feedback.",
        expectedUse: "Verify stale application creates one review chain.",
        sourceAuthority: "project-decision"
      }],
      exclusions: [],
      metadata: {
        smokeId: marker,
        canonicalRevisionTokens: [{
          subjectType: "memory_record",
          subjectId: negativeSelectedMemory.id,
          updatedAt: negativeSelectedMemory.updatedAt,
          status: negativeSelectedMemory.status,
          currentVersionId: negativeSelectedMemory.currentVersionId
        }]
      }
    });
    const negativeAggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(
      executionRun.id
    );
    if (negativeAggregate === undefined) {
      throw new Error("Memory governance lost run before negative application");
    }
    const negativeApplicationAuthority = await createIssuedMemoryApplicationRun(
      "negative-effects-race",
      memoryRecord.id
    );
    const negativePacketBinding = negativeApplicationAuthority.packetBinding;
    const negativePacketApplication = {
      memoryRecordId: memoryRecord.id,
      executionRunId: negativeApplicationAuthority.executionRunId,
      packetChecksum: negativePacketBinding.packetChecksum,
      packetGeneratedAt: negativePacketBinding.packetGeneratedAt,
      sourceRunLifecycleRevision: negativePacketBinding.sourceRunLifecycleRevision,
      expectedUse: "Verify stale application creates one review chain.",
      outcome: "stale" as const,
      notes: "Unbound stale feedback must create reviewable negative effects atomically.",
      metadata: {
        smokeId: marker,
        applicationKind: "negative-race"
      },
      negativeEffects: {
        outcome: "stale" as const,
        eventType: "stale_detected" as const,
        note: "Stale memory must create reviewable negative effects atomically.",
        reason: "Stale memory was observed by the governance smoke.",
        evidenceRef: `smoke:${marker}:stale-application`,
        metadata: {
          smokeId: marker,
          applicationKind: "negative-race"
        },
        candidate: {
          key: `feedback:memory-governance-smoke:${marker}:stale`,
          rejectedClaim: memoryRecord.summary,
          reason: "Stale memory was observed by the governance smoke.",
          invalidatedBySourceClaimIds: memoryRecord.sourceLineage.map((lineage) => lineage.sourceId),
          appliesTo: memoryRecord.key,
          ...(memoryRecord.invalidationRule === undefined
            ? {}
            : { mayRevisitWhen: memoryRecord.invalidationRule }),
          summary: "Review stale memory feedback from governance smoke.",
          body: "This stale feedback must remain reviewable and atomic.",
          owner: memoryRecord.owner,
          confidence: 70,
          sourceLineage: memoryRecord.sourceLineage
        }
      }
    } as const;
    const negativeClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];
    let negativeResults: readonly Awaited<
      ReturnType<DrizzleMemoryRepository["recordMemoryApplicationWithEffectsOnce"]>
    >[] = [];

    try {
      const negativeRepositories = negativeClients.map(
        (negativeClient) => new DrizzleMemoryRepository(createKrnDatabase(negativeClient))
      );
      const [firstNegativeRepository, secondNegativeRepository] = negativeRepositories;
      if (firstNegativeRepository === undefined || secondNegativeRepository === undefined) {
        throw new Error("Memory governance smoke did not create negative race repositories");
      }
      negativeResults = await Promise.all([
        firstNegativeRepository.recordMemoryApplicationWithEffectsOnce(negativePacketApplication),
        secondNegativeRepository.recordMemoryApplicationWithEffectsOnce(negativePacketApplication)
      ]);
    } finally {
      await Promise.all(negativeClients.map((negativeClient) => negativeClient.end()));
    }

    const negativeApplicationCount = negativeResults.filter((result) => result.created).length;
    const negativeApplication = negativeResults[0]?.application;
    const negativeFeedbackRows = await db
      .select()
      .from(memoryFeedbackEvents)
      .where(sql`${memoryFeedbackEvents.metadata}->>'smokeId' = ${marker}
        AND ${memoryFeedbackEvents.metadata}->>'applicationKind' = 'negative-race'`);
    const negativeCandidateRows = await db
      .select()
      .from(antiMemoryCandidates)
      .where(sql`${antiMemoryCandidates.metadata}->>'smokeId' = ${marker}
        AND ${antiMemoryCandidates.metadata}->>'applicationKind' = 'negative-race'`);
    const negativeOutboxRows = negativeApplication === undefined
      ? []
      : await db
          .select()
          .from(outboxEvents)
          .where(sql`${outboxEvents.payload}->>'memoryApplicationId' = ${negativeApplication.id}`);
    const negativeMemoryAfter = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const negativeCounterDeltaExact =
      negativeMemoryAfter?.positiveFeedbackCount ===
        negativeSelectedMemory.positiveFeedbackCount &&
      negativeMemoryAfter?.negativeFeedbackCount ===
        negativeSelectedMemory.negativeFeedbackCount + 1;

    const faultApplicationAuthority = await createIssuedMemoryApplicationRun(
      "fault-rollback",
      memoryRecord.id
    );
    const faultStages = [
      "after_application",
      "after_counter",
      "after_feedback",
      "after_candidate",
      "after_outbox"
    ] as const;
    let faultRollbackExact = true;
    for (const stage of faultStages) {
      const faultClient = postgres(input.databaseUrl, { max: 1, onnotice: () => undefined });
      try {
        const faultSelectedMemory = await memoryRepository.getMemoryRecordById(memoryRecord.id);
        if (faultSelectedMemory === undefined) {
          throw new Error("Memory governance lost selected memory before fault application");
        }
        await harnessRunRepository.createContextAssembly({
          harnessPlanId: result.harnessPlan.id,
          status: "assembled",
          tokenBudget: 256,
          inclusions: [{
            subjectType: "memory_record",
            subjectId: faultSelectedMemory.id,
            reason: `Select memory for ${stage} rollback proof.`,
            expectedUse: negativePacketApplication.expectedUse,
            sourceAuthority: "project-decision"
          }],
          exclusions: [],
          metadata: {
            smokeId: marker,
            canonicalRevisionTokens: [{
              subjectType: "memory_record",
              subjectId: faultSelectedMemory.id,
              updatedAt: faultSelectedMemory.updatedAt,
              status: faultSelectedMemory.status,
              currentVersionId: faultSelectedMemory.currentVersionId
            }]
          }
        });
        const faultAggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(
          executionRun.id
        );
        if (faultAggregate === undefined) {
          throw new Error("Memory governance lost run before fault application");
        }
        const faultPacketBinding = faultApplicationAuthority.packetBinding;
        const [faultOutboxBefore] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(outboxEvents)
          .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}
            AND ${outboxEvents.topic} IN (
              'memory.application.created',
              'memory.feedback.created',
              'anti_memory.candidate.created'
            )`);
        const faultRepository = new DrizzleMemoryRepository(createKrnDatabase(faultClient), {
          faultAfterStage: (observedStage) => {
            if (observedStage === stage) {
              throw new Error(`fault:${stage}`);
            }
          }
        });
        await assertRejected(
          faultRepository.recordMemoryApplicationWithEffectsOnce({
            ...negativePacketApplication,
            executionRunId: faultApplicationAuthority.executionRunId,
            packetChecksum: faultPacketBinding.packetChecksum,
            packetGeneratedAt: faultPacketBinding.packetGeneratedAt,
            sourceRunLifecycleRevision: faultPacketBinding.sourceRunLifecycleRevision,
            metadata: {
              smokeId: marker,
              faultStage: stage,
              packetAuthority: "unbound_negative_fixture"
            },
            negativeEffects: {
              ...negativePacketApplication.negativeEffects,
              metadata: {
                smokeId: marker,
                faultStage: stage
              }
            }
          }),
          `fault:${stage}`,
          `Memory governance fault injection did not fail at ${stage}`
        );
        const faultMemoryAfter = await memoryRepository.getMemoryRecordById(memoryRecord.id);
        const [faultOutboxAfter] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(outboxEvents)
          .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}
            AND ${outboxEvents.topic} IN (
              'memory.application.created',
              'memory.feedback.created',
              'anti_memory.candidate.created'
            )`);
        faultRollbackExact =
          faultRollbackExact &&
          faultMemoryAfter?.positiveFeedbackCount === faultSelectedMemory.positiveFeedbackCount &&
          faultMemoryAfter?.negativeFeedbackCount === faultSelectedMemory.negativeFeedbackCount &&
          faultOutboxAfter?.count === faultOutboxBefore?.count;
      } finally {
        await faultClient.end();
      }
    }
    const faultApplicationRows = await db
      .select()
      .from(memoryApplications)
      .where(sql`${memoryApplications.metadata}->>'smokeId' = ${marker}
        AND ${memoryApplications.metadata}->>'faultStage' IS NOT NULL`);
    const faultFeedbackRows = await db
      .select()
      .from(memoryFeedbackEvents)
      .where(sql`${memoryFeedbackEvents.metadata}->>'smokeId' = ${marker}
        AND ${memoryFeedbackEvents.metadata}->>'faultStage' IS NOT NULL`);
    const faultCandidateRows = await db
      .select()
      .from(antiMemoryCandidates)
      .where(sql`${antiMemoryCandidates.metadata}->>'smokeId' = ${marker}
        AND ${antiMemoryCandidates.metadata}->>'faultStage' IS NOT NULL`);
    const applicationRows = await db
      .select()
      .from(memoryApplications)
      .where(eq(memoryApplications.id, memoryApplication.id));
    const legacyOnlyMemoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-legacy-only:${marker}`,
      kind: "constraint",
      summary: "Legacy-only memory must not strengthen ranking",
      body: "Historical applications without packet identity remain inspectable history.",
      owner: "kernel",
      confidence: 80,
      applicationGuidance: "Do not use legacy application rows as usefulness proof.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        integrityProbe: "legacy-only"
      }
    });
    const counterIntegrityMemoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-counter-integrity:${marker}`,
      kind: "constraint",
      summary: "Packet-bound memory counter integrity",
      body: "Only canonical packet applications may affect ranking counters.",
      owner: "kernel",
      confidence: 85,
      applicationGuidance: "Use only after packet-bound application evidence is present.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        integrityProbe: "counter-rebuild"
      }
    });
    await db.insert(memoryApplications).values([
      {
        memoryRecordId: legacyOnlyMemoryRecord.id,
        executionRunId: null,
        decisionPacketChecksum: null,
        expectedUse: "Legacy fixture only.",
        outcome: "helped",
        notes: "No packet identity was persisted.",
        metadata: {
          smokeId: marker,
          integrityProbe: "legacy-only",
          packetAuthority: "unbound_legacy_fixture"
        }
      },
      {
        memoryRecordId: legacyOnlyMemoryRecord.id,
        executionRunId: null,
        decisionPacketChecksum: null,
        expectedUse: "Legacy fixture only.",
        outcome: "helped",
        notes: "Duplicate legacy identity remains history.",
        metadata: {
          smokeId: marker,
          integrityProbe: "legacy-only",
          packetAuthority: "unbound_legacy_fixture"
        }
      },
      {
        memoryRecordId: counterIntegrityMemoryRecord.id,
        executionRunId: null,
        decisionPacketChecksum: null,
        expectedUse: "Legacy fixture only.",
        outcome: "helped",
        notes: "No packet identity was persisted.",
        metadata: {
          smokeId: marker,
          integrityProbe: "counter-rebuild",
          packetAuthority: "unbound_legacy_fixture"
        }
      },
      {
        memoryRecordId: counterIntegrityMemoryRecord.id,
        executionRunId: null,
        decisionPacketChecksum: null,
        expectedUse: "Legacy fixture only.",
        outcome: "hurt",
        notes: "Legacy negative history has no ranking authority.",
        metadata: {
          smokeId: marker,
          integrityProbe: "counter-rebuild",
          packetAuthority: "unbound_legacy_fixture"
        }
      },
      {
        memoryRecordId: legacyOnlyMemoryRecord.id,
        executionRunId: executionRun.id,
        decisionPacketChecksum: `fabricated-legacy-packet-${marker}`,
        expectedUse: "Packet-shaped legacy fixture only.",
        outcome: "hurt",
        notes: "Historical arbitrary checksum lacks store-owned admission fingerprint.",
        metadata: {
          smokeId: marker,
          integrityProbe: "packet-shaped-legacy",
          decisionPacketGeneratedAt: executionRun.updatedAt,
          decisionPacketSourceRunLifecycleRevision: executionRun.lifecycleRevision,
          packetAuthority: "fabricated_legacy_fixture"
        }
      }
    ]);
    await db
      .update(memoryRecords)
      .set({ positiveFeedbackCount: 99, negativeFeedbackCount: 88 })
      .where(sql`${memoryRecords.id} in (${legacyOnlyMemoryRecord.id}, ${counterIntegrityMemoryRecord.id})`);
    const counterIntegritySelectedMemory = await memoryRepository.getMemoryRecordById(
      counterIntegrityMemoryRecord.id
    );
    if (counterIntegritySelectedMemory === undefined) {
      throw new Error("Memory governance lost counter-integrity memory before selection");
    }
    await harnessRunRepository.createContextAssembly({
      harnessPlanId: result.harnessPlan.id,
      status: "assembled",
      tokenBudget: 256,
      inclusions: [{
        subjectType: "memory_record",
        subjectId: counterIntegritySelectedMemory.id,
        reason: "Select memory for canonical counter rebuild proof.",
        expectedUse: "Prove a packet-bound application survives counter rebuild.",
        sourceAuthority: "project-decision"
      }],
      exclusions: [],
      metadata: {
        smokeId: marker,
        canonicalRevisionTokens: [{
          subjectType: "memory_record",
          subjectId: counterIntegritySelectedMemory.id,
          updatedAt: counterIntegritySelectedMemory.updatedAt,
          status: counterIntegritySelectedMemory.status,
          currentVersionId: counterIntegritySelectedMemory.currentVersionId
        }]
      }
    });
    const counterIntegrityAuthority = await createIssuedMemoryApplicationRun(
      "counter-integrity",
      counterIntegrityMemoryRecord.id
    );
    const counterIntegrityVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "counter-integrity",
      verificationMode: "successful",
      reviewBurden: "Memory governance counter rebuild proof.",
      eventType: "smoke.memory_governance.counter_integrity_verification_captured",
      eventMessage: "Memory governance counter integrity verification captured"
    }, counterIntegrityAuthority);
    await memoryRepository.recordMemoryApplicationWithEffectsOnce({
      memoryRecordId: counterIntegrityMemoryRecord.id,
      executionRunId: counterIntegrityAuthority.executionRunId,
      packetChecksum: counterIntegrityVerification.packetBinding.packetChecksum,
      packetGeneratedAt: counterIntegrityVerification.packetBinding.packetGeneratedAt,
      sourceRunLifecycleRevision:
        counterIntegrityVerification.packetBinding.sourceRunLifecycleRevision,
      evidenceBundleId: counterIntegrityVerification.evidenceBundle.id,
      expectedUse: "Prove a packet-bound application survives counter rebuild.",
      outcome: "helped",
      notes: "Only this current packet application may contribute positive ranking feedback.",
      metadata: {
        smokeId: marker,
        integrityProbe: "counter-rebuild"
      }
    });
    const staleLifecycleVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "stale-lifecycle",
      verificationMode: "successful",
      reviewBurden: "Memory governance stale lifecycle revision falsifier.",
      eventType: "smoke.memory_governance.stale_lifecycle_verification_captured",
      eventMessage: "Memory governance stale lifecycle revision falsifier captured"
    }, primaryVerificationAuthority);
    const runningTransition = await harnessRunRepository.updateExecutionRunStatus({
      executionRunId: executionRun.id,
      expectedStatus: "planned",
      status: "running",
      startedAt: new Date(
        Date.parse(staleLifecycleVerification.packetBinding.packetGeneratedAt) + 2000
      ).toISOString()
    });
    if (runningTransition.kind !== "transitioned") {
      throw new Error("Memory governance execution run did not transition to running");
    }
    const runningExecutionRun = runningTransition.executionRun;
    const historicalRetry = await memoryRepository.recordMemoryApplicationWithEffectsOnce(
      conflictRaceNeutralApplication
    );
    historicalExactRetryPreserved =
      !historicalRetry.created &&
      historicalRetry.application.id === conflictRaceWinnerApplicationId;
    const legacyBeforeStaleLifecycleApplication = await memoryRepository.getMemoryRecordById(
      legacyOnlyMemoryRecord.id
    );
    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        memoryRecordId: legacyOnlyMemoryRecord.id,
        packetChecksum: staleLifecycleVerification.packetBinding.packetChecksum,
        packetGeneratedAt: staleLifecycleVerification.packetBinding.packetGeneratedAt,
        sourceRunLifecycleRevision:
          staleLifecycleVerification.packetBinding.sourceRunLifecycleRevision,
        outcome: "neutral",
        notes: "A never-admitted stale lifecycle identity must reject.",
        metadata: {
          smokeId: marker,
          evidenceFalsifier: "new-stale-lifecycle-revision"
        }
      }),
      "exact persisted packet identity is required",
      "Memory governance accepted a new application from an earlier lifecycle revision"
    );
    const staleLifecycleApplicationRows = await db
      .select()
      .from(memoryApplications)
      .where(sql`${memoryApplications.metadata}->>'evidenceFalsifier' = 'new-stale-lifecycle-revision'
        AND ${memoryApplications.metadata}->>'smokeId' = ${marker}`);
    const legacyAfterStaleLifecycleApplication = await memoryRepository.getMemoryRecordById(
      legacyOnlyMemoryRecord.id
    );
    staleLifecycleRevisionRejected =
      runningExecutionRun.lifecycleRevision === executionRun.lifecycleRevision + 1 &&
      staleLifecycleApplicationRows.length === 0 &&
      legacyBeforeStaleLifecycleApplication?.positiveFeedbackCount ===
        legacyAfterStaleLifecycleApplication?.positiveFeedbackCount;

    const runningStartedAt = runningExecutionRun.startedAt;

    if (runningStartedAt === undefined) {
      throw new Error("Memory governance running execution lacks startedAt");
    }

    const succeededTransition = await harnessRunRepository.updateExecutionRunStatus({
      executionRunId: executionRun.id,
      expectedStatus: "running",
      status: "succeeded",
      completedAt: new Date(
        Date.parse(runningStartedAt) + 1000
      ).toISOString()
    });
    if (succeededTransition.kind !== "transitioned") {
      throw new Error("Memory governance execution run did not transition to succeeded");
    }
    const succeededExecutionRun = succeededTransition.executionRun;
    const terminalVerification = await createCanonicalVerificationEvidence({
      captureSuffix: "terminal-contract",
      verificationMode: "successful",
      reviewBurden: "Memory governance terminal EvidenceContract falsifier.",
      eventType: "smoke.memory_governance.terminal_verification_captured",
      eventMessage: "Memory governance terminal verification falsifier captured"
    }, primaryVerificationAuthority);

    if (
      terminalVerification.packetBinding.sourceRunLifecycleRevision !==
      succeededExecutionRun.lifecycleRevision
    ) {
      throw new Error("Memory governance terminal evidence was not admitted at terminal revision");
    }
    const counterBeforeInactiveApplication = await memoryRepository.getMemoryRecordById(
      counterIntegrityMemoryRecord.id
    );
    await assertRejected(
      memoryRepository.recordMemoryApplicationWithEffectsOnce({
        ...packetBoundApplication,
        memoryRecordId: counterIntegrityMemoryRecord.id,
        packetChecksum: terminalVerification.packetBinding.packetChecksum,
        packetGeneratedAt: terminalVerification.packetBinding.packetGeneratedAt,
        sourceRunLifecycleRevision:
          terminalVerification.packetBinding.sourceRunLifecycleRevision,
        evidenceBundleId: terminalVerification.evidenceBundle.id,
        outcome: "helped",
        metadata: {
          smokeId: marker,
          evidenceFalsifier: "inactive-terminal-contract"
        }
      }),
      "exact persisted packet identity is required",
      "Memory governance accepted helped evidence from a terminal EvidenceContract"
    );
    const counterAfterInactiveApplication = await memoryRepository.getMemoryRecordById(
      counterIntegrityMemoryRecord.id
    );

    if (
      counterBeforeInactiveApplication?.positiveFeedbackCount !==
      counterAfterInactiveApplication?.positiveFeedbackCount
    ) {
      throw new Error("Memory governance terminal EvidenceContract changed the positive feedback counter");
    }
    if (memoryRepository.rebuildMemoryApplicationCounters === undefined) {
      throw new Error("Memory governance smoke requires memory application counter rebuild");
    }
    const counterRebuild = await memoryRepository.rebuildMemoryApplicationCounters();
    const counterRebuildReplay = await memoryRepository.rebuildMemoryApplicationCounters();
    const legacyOnlyAfterRebuild = await memoryRepository.getMemoryRecordById(
      legacyOnlyMemoryRecord.id
    );
    const counterIntegrityAfterRebuild = await memoryRepository.getMemoryRecordById(
      counterIntegrityMemoryRecord.id
    );
    const rankedMemoryRecords = await memoryRepository.listActiveMemory(project.id, 100);
    const legacyOnlyRank = rankedMemoryRecords.findIndex(
      (record) => record.id === legacyOnlyMemoryRecord.id
    );
    const counterIntegrityRank = rankedMemoryRecords.findIndex(
      (record) => record.id === counterIntegrityMemoryRecord.id
    );
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);
    const projectMemoryRecords = await memoryRepository.listMemoryRecordsForProject(project.id);
    const invalidatedMemoryRecord = await memoryRepository.invalidateMemoryRecord({
      memoryRecordId: memoryRecord.id,
      reviewer: "memory-governance-smoke",
      reason: "MM-28 smoke proves invalidated memory is excluded from active memory.",
      invalidatedAt: new Date().toISOString(),
      metadata: {
        smokeId: marker
      }
    });
    const activeMemoryAfterInvalidation = await memoryRepository.listActiveMemory(project.id, 10);
    const supersessionCurrent = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-supersession-current:${marker}`,
      kind: "constraint",
      summary: "Current memory for guarded supersession",
      body: "This active record may be replaced by a reviewed same-project record.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only while the replacement is not yet accepted.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "supersession"
      }
    });
    const supersessionReplacement = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `memory-governance-supersession-replacement:${marker}`,
      kind: "constraint",
      summary: "Replacement memory for guarded supersession",
      body: "This active record is the valid same-project replacement.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use as the reviewed replacement.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "supersession"
      }
    });
    const crossProjectReplacement = await memoryRepository.createMemoryRecord({
      projectId: crossProject.id,
      key: `memory-governance-cross-project-replacement:${marker}`,
      kind: "constraint",
      summary: "Cross-project replacement must be rejected",
      body: "A record from another project cannot supersede this record.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Never use across project authority boundaries.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "cross-project-supersession"
      }
    });

    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: supersessionCurrent.id,
        reviewer: "memory-governance-smoke",
        reason: "Self-supersession must be rejected.",
        supersededByMemoryRecordId: supersessionCurrent.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "supersession"
        }
      }),
      "cannot supersede a record with itself",
      "Memory governance allowed self-supersession"
    );
    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: supersessionCurrent.id,
        reviewer: "memory-governance-smoke",
        reason: "Cross-project supersession must be rejected.",
        supersededByMemoryRecordId: crossProjectReplacement.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "cross-project-supersession"
        }
      }),
      "same project",
      "Memory governance allowed cross-project supersession"
    );
    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: supersessionReplacement.id,
        reviewer: "memory-governance-smoke",
        reason: "An invalidated record cannot be a replacement.",
        supersededByMemoryRecordId: memoryRecord.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "non-active-replacement"
        }
      }),
      "active replacement",
      "Memory governance allowed a non-active replacement"
    );
    await assertRejected(
      memoryRepository.supersedeMemoryRecord({
        memoryRecordId: memoryRecord.id,
        reviewer: "memory-governance-smoke",
        reason: "An invalidated record cannot be superseded again.",
        supersededByMemoryRecordId: supersessionReplacement.id,
        metadata: {
          smokeId: marker,
          lifecycleProbe: "non-active-current"
        }
      }),
      "active current record",
      "Memory governance allowed a non-active current record"
    );
    const supersededRecord = await memoryRepository.supersedeMemoryRecord({
      memoryRecordId: supersessionCurrent.id,
      reviewer: "memory-governance-smoke",
      reason: "A reviewed same-project replacement is active.",
      supersededByMemoryRecordId: supersessionReplacement.id,
      metadata: {
        smokeId: marker,
        lifecycleProbe: "supersession"
      }
    });
    const antiMemoryCandidate = await memoryRepository.createAntiMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `anti-memory-governance-smoke:${marker}`,
      proposedBy: "memory-governance-smoke",
      status: "candidate",
      rejectedClaim: "Markdown files are KRN runtime memory.",
      reason: "Runtime Memory Core is store-backed; markdown is audit/source/export material.",
      invalidatedBySourceClaimIds: [sourceClaim.id],
      appliesTo: "memory governance",
      mayRevisitWhen: "Project memory no longer uses the brain store.",
      summary: "Markdown is not runtime memory",
      body: "Do not treat markdown files as Memory Core.",
      owner: "kernel",
      confidence: 99,
      sourceLineage: [{ sourceId: sourceClaim.id }],
      metadata: {
        smokeId: marker,
        reflectionCandidateEvidence: {
          provenance: "source_claim",
          evidenceRefs: [sourceClaim.id],
          doesNotProve: "This does not prove the anti-memory candidate is reviewed."
        }
      }
    });
    const concurrentAntiMemoryCandidate = await memoryRepository.createAntiMemoryCandidate({
      projectId: project.id,
      executionRunId: executionRun.id,
      key: `anti-memory-governance-concurrent:${marker}`,
      proposedBy: "memory-governance-concurrency-smoke",
      status: "candidate",
      rejectedClaim: "Concurrent anti-memory promotion must have one winner.",
      reason: "One candidate must create at most one anti-memory record.",
      invalidatedBySourceClaimIds: [sourceClaim.id],
      appliesTo: "memory governance concurrency",
      mayRevisitWhen: "Anti-memory promotion concurrency changes.",
      summary: "Concurrent anti-memory promotion must have one winner",
      body: "An anti-memory candidate may create at most one accepted record.",
      owner: "kernel",
      confidence: 95,
      sourceLineage: [{ sourceId: sourceClaim.id }],
      metadata: {
        smokeId: marker,
        lifecycleProbe: "concurrent-anti-memory-promotion"
      }
    });
    const concurrentAntiMemoryClients = [
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined }),
      postgres(input.databaseUrl, { max: 1, onnotice: () => undefined })
    ];

    try {
      const concurrentAntiMemoryRepositories = concurrentAntiMemoryClients.map(
        (concurrentClient) => new DrizzleMemoryRepository(createKrnDatabase(concurrentClient))
      );
      const [firstConcurrentAntiMemoryRepository, secondConcurrentAntiMemoryRepository] =
        concurrentAntiMemoryRepositories;

      if (firstConcurrentAntiMemoryRepository === undefined || secondConcurrentAntiMemoryRepository === undefined) {
        throw new Error("Memory governance concurrency smoke did not create two anti-memory repositories");
      }

      const concurrentAntiMemoryPromotionResults = await Promise.allSettled([
        firstConcurrentAntiMemoryRepository.promoteReviewedAntiMemoryCandidate({
          candidateId: concurrentAntiMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-a",
          decision: "accepted",
          recordKey: `anti-memory-governance-concurrent-a:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-anti-memory-promotion"
          }
        }),
        secondConcurrentAntiMemoryRepository.promoteReviewedAntiMemoryCandidate({
          candidateId: concurrentAntiMemoryCandidate.id,
          reviewer: "memory-governance-concurrency-smoke-b",
          decision: "accepted",
          recordKey: `anti-memory-governance-concurrent-b:${marker}`,
          metadata: {
            smokeId: marker,
            lifecycleProbe: "concurrent-anti-memory-promotion"
          }
        })
      ]);
      const concurrentAntiMemoryRows = await db
        .select()
        .from(antiMemoryRecords)
        .where(sql`${antiMemoryRecords.metadata}->>'lifecycleProbe' = 'concurrent-anti-memory-promotion'
          AND ${antiMemoryRecords.metadata}->>'smokeId' = ${marker}`);
      const concurrentAntiMemoryCandidateReadback = await memoryRepository.getAntiMemoryCandidateById(
        concurrentAntiMemoryCandidate.id
      );

      assertSmokeReadbackChecks([
        {
          label: "concurrent anti-memory promotion has one winner",
          passed: fulfilledCount(concurrentAntiMemoryPromotionResults) === 1
        },
        {
          label: "concurrent anti-memory promotion creates one record",
          passed: concurrentAntiMemoryRows.length === 1
        },
        {
          label: "concurrent anti-memory candidate is accepted once",
          passed: concurrentAntiMemoryCandidateReadback?.status === "accepted"
        }
      ], "Anti-memory governance concurrency falsifier failed");
    } finally {
      await Promise.all(concurrentAntiMemoryClients.map((concurrentClient) => concurrentClient.end()));
    }

    const antiMemoryRecord = await memoryRepository.promoteReviewedAntiMemoryCandidate({
      candidateId: antiMemoryCandidate.id,
      reviewer: "memory-governance-smoke",
      decision: "accepted",
      metadata: {
        smokeId: marker,
        reviewGate: {
          evidenceReviewedRef: sourceClaim.id
        }
      }
    });
    const reviewedAntiMemoryCandidate = await memoryRepository.getAntiMemoryCandidateById(
      antiMemoryCandidate.id
    );
    const reviewedAntiMemoryCandidateStatus =
      reviewedAntiMemoryCandidate?.status ?? "missing";
    await assertRejected(
      memoryRepository.rejectAntiMemoryCandidate({
        candidateId: antiMemoryCandidate.id,
        reviewer: "memory-governance-smoke-after-accept",
        reason: "An accepted anti-memory candidate must not be rejected afterward.",
        metadata: {
          smokeId: marker,
          lifecycleProbe: "reject-after-accept"
        }
      }),
      "expected proposed or candidate status",
      "Memory governance allowed anti-memory rejection after acceptance"
    );
    const runAntiMemory = await memoryRepository.listAntiMemoryForRun(executionRun.id);
    const versionRows = await db
      .select()
      .from(memoryRecordVersions)
      .where(eq(memoryRecordVersions.memoryRecordId, memoryRecord.id));
    const outboxRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'smokeId' = ${marker}`);

    const readbackError = "Memory governance smoke readback did not match persisted records";

    assertSmokeReadbackChecks([
      { label: "source claim readback", passed: readBackSourceClaim?.id === sourceClaim.id },
      { label: "memory candidate readback", passed: readBackCandidate?.id === memoryCandidate.id },
      { label: "candidate accepted", passed: reviewedCandidate?.status === "accepted" },
      { label: "memory record readback", passed: readBackMemoryRecord?.id === memoryRecord.id },
      {
        label: "current version id",
        passed: readBackMemoryRecord?.currentVersionId !== undefined
      },
      {
        label: "project memory record listed",
        passed: projectMemoryRecords.some((record) => record.id === memoryRecord.id)
      },
      {
        label: "memory invalidated",
        passed: invalidatedMemoryRecord.status === "invalidated"
      },
      {
        label: "invalidated memory excluded from active list",
        passed: !activeMemoryAfterInvalidation.some((record) => record.id === memoryRecord.id)
      },
      {
        label: "same-project memory superseded",
        passed: supersededRecord.status === "superseded"
      },
      { label: "memory version row count", passed: versionRows.length === 1 },
      {
        label: "memory version candidate lineage",
        passed: versionRows[0]?.createdFromCandidateId === memoryCandidate.id
      },
      { label: "memory application row count", passed: applicationRows.length === 1 },
      {
        label: "memory application has one canonical usefulness admission",
        passed:
          canonicalMemoryUsefulnessRows.length === 1 &&
          canonicalMemoryUsefulnessRows[0]?.subjectKind === "memory_record" &&
          canonicalMemoryUsefulnessRows[0].subjectId === memoryRecord.id &&
          canonicalMemoryUsefulnessRows[0].packetChecksum ===
            issuedDecisionPacket.packetIdentity.checksum
      },
      {
        label: "packet-bound memory application created once",
        passed:
          createdApplicationCount === 1 &&
          replayApplicationResult.application.id === memoryApplication.id
      },
      {
        label: "neutral packet-bound memory application does not strengthen feedback",
        passed: readBackMemoryRecord?.positiveFeedbackCount === 0
      },
      {
        label: "different packet issuance cannot reuse verification evidence",
        passed: mismatchedPacketIssuanceRejected
      },
      {
        label: "fabricated packet authority rejects",
        passed: fabricatedApplicationAuthorityRejected
      },
      {
        label: "cross-run task and context authority rejects",
        passed: crossRunTaskContextRejected
      },
      {
        label: "cross-project memory application authority rejects",
        passed: crossProjectMemoryApplicationRejected
      },
      {
        label: "unselected memory authority rejects",
        passed: unselectedMemoryApplicationRejected
      },
      {
        label: "conflicting packet identity retry rejects",
        passed:
          conflictingRetryRejected &&
          conflictRaceApplicationCount === 1 &&
          conflictRaceEffectCount === 0 &&
          conflictRaceOutboxExact &&
          conflictRaceCounterUnchanged
      },
      {
        label: "new write from an earlier lifecycle revision rejects",
        passed: staleLifecycleRevisionRejected
      },
      {
        label: "exact admitted retry survives lifecycle advancement",
        passed: historicalExactRetryPreserved
      },
      {
        label: "failed command evidence cannot create helped application",
        passed: failedCommandEvidenceRejected
      },
      {
        label: "incomplete required command evidence cannot create helped application",
        passed: missingRequiredCommandEvidenceRejected
      },
      {
        label: "unresolved output reference evidence cannot create helped application",
        passed:
          unresolvedOutputReferenceEvidenceRejected &&
          unresolvedOutputApplicationRows.length === 0 &&
          unresolvedOutputMemoryRecord?.positiveFeedbackCount === 0 &&
          unresolvedOutputOutboxRows.length === 0
      },
      {
        label: "negative packet application won once",
        passed:
          negativeApplicationCount === 1 &&
          negativeApplication !== undefined &&
          negativeCounterDeltaExact
      },
      {
        label: "negative feedback effect created once",
        passed: negativeFeedbackRows.length === 1
      },
      {
        label: "negative anti-memory candidate created once",
        passed: negativeCandidateRows.length === 1
      },
      {
        label: "negative effect outbox chain exists",
        passed:
          negativeOutboxRows.length === 3 &&
          [
            "memory.application.created",
            "memory.feedback.created",
            "anti_memory.candidate.created"
          ].every((topic) => negativeOutboxRows.filter((row) => row.topic === topic).length === 1)
      },
      {
        label: "fault injection leaves no partial application effects",
        passed: faultApplicationRows.length === 0 &&
          faultFeedbackRows.length === 0 &&
          faultCandidateRows.length === 0 &&
          faultRollbackExact
      },
      {
        label: "memory application record lineage",
        passed: applicationRows[0]?.memoryRecordId === memoryRecord.id
      },
      {
        label: "memory application derives canonical task and context",
        passed:
          applicationRows[0]?.taskContractId === result.taskContract.id &&
          applicationRows[0]?.contextAssemblyId === applicationContextAssembly.id
      },
      {
        label: "memory application packet checksum is typed and unique",
        passed: applicationRows[0]?.decisionPacketChecksum === packetBoundApplication.packetChecksum
      },
      {
        label: "legacy application rows remain inspectable and unbound",
        passed: counterRebuild.legacyApplicationCount >= 5
      },
      {
        label: "legacy rows do not strengthen counters",
        passed: legacyOnlyAfterRebuild?.positiveFeedbackCount === 0 &&
          legacyOnlyAfterRebuild.negativeFeedbackCount === 0
      },
      {
        label: "canonical application rebuild is deterministic",
        passed: counterIntegrityAfterRebuild?.positiveFeedbackCount === 1 &&
          counterIntegrityAfterRebuild.negativeFeedbackCount === 0 &&
          counterRebuild.canonicalApplicationCount === counterRebuildReplay.canonicalApplicationCount &&
          counterRebuild.canonicalOutcomeCounts.helped === counterRebuildReplay.canonicalOutcomeCounts.helped
      },
      {
        label: "ranking uses rebuilt canonical counters",
        passed: counterIntegrityRank >= 0 &&
          legacyOnlyRank >= 0 &&
          counterIntegrityRank < legacyOnlyRank
      },
      {
        label: "anti-memory candidate accepted",
        passed: reviewedAntiMemoryCandidateStatus === "accepted"
      },
      {
        label: "anti-memory candidate lineage",
        passed: antiMemoryRecord.createdFromCandidateId === antiMemoryCandidate.id
      },
      {
        label: "run anti-memory listed",
        passed: runAntiMemory.some((record) => record.id === antiMemoryRecord.id)
      },
      { label: "outbox events created", passed: (outboxRows[0]?.count ?? 0) >= 4 }
    ], readbackError);

    const persistedCandidate = requireSmokeReadbackValue(
      readBackCandidate,
      "memory candidate readback",
      readbackError
    );
    const persistedReviewedCandidate = requireSmokeReadbackValue(
      reviewedCandidate,
      "reviewed candidate readback",
      readbackError
    );
    const persistedMemoryRecord = requireSmokeReadbackValue(
      readBackMemoryRecord,
      "memory record readback",
      readbackError
    );
    const memoryRecordVersion = requireSmokeReadbackValue(
      versionRows[0],
      "memory version row",
      readbackError
    );

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceClaimId: sourceClaim.id,
      memoryCandidateId: memoryCandidate.id,
      readBackMemoryCandidateId: persistedCandidate.id,
      reviewedMemoryCandidateStatus: persistedReviewedCandidate.status,
      memoryRecordId: memoryRecord.id,
      readBackMemoryRecordId: persistedMemoryRecord.id,
      memoryRecordVersionId: memoryRecordVersion.id,
      invalidatedMemoryRecordStatus: invalidatedMemoryRecord.status,
      activeMemoryAfterInvalidationCount: activeMemoryAfterInvalidation.length,
      memoryApplicationId: memoryApplication.id,
      antiMemoryCandidateId: antiMemoryCandidate.id,
      reviewedAntiMemoryCandidateStatus,
      antiMemoryRecordId: antiMemoryRecord.id,
      runAntiMemoryCount: runAntiMemory.length,
      projectMemoryRecordCount: projectMemoryRecords.length,
      outboxEventCount: outboxRows[0]?.count ?? 0,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
