import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "@krn/db/dev";
import {
  DrizzleMaintenanceQueueRepository
} from "@krn/db/adapters";
import type {
  EvidenceContract
} from "@krn/core";
import type {
  HarnessRunAggregate
} from "@krn/core/repositories";

import {
  runDecisionPacketCommand
} from "../../run-decision-packet-command.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  runRunShowCommand
} from "../../run-run-show-command.js";
import type {
  DatabaseRuntime
} from "../../database-runtime.js";

export interface RunShowDbSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface RunShowDbSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  textReadbackMatched: boolean;
  jsonReadbackMatched: boolean;
  packetBindingStatus: string;
  packetBindingStoredChecksumMatched: boolean;
  packetBindingRetryStable: boolean;
  evidenceBundleCount: number;
  reviewAssessmentCount: number;
  feedbackDeltaCount: number;
  runEventCount: number;
  readbackKind: string;
  readbackMutation: string;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (
  value: Record<string, unknown>,
  key: string
): string | undefined => {
  const field = value[key];

  return typeof field === "string" ? field : undefined;
};

const readRunId = (value: Record<string, unknown>): string | undefined => {
  const run = value.run;

  return isRecord(run) ? readString(run, "id") : undefined;
};

const requiredString = (
  value: Record<string, unknown>,
  key: string,
  message: string
): string => {
  const field = readString(value, key);

  if (field === undefined) {
    throw new Error(message);
  }

  return field;
};

interface PacketIdentity {
  checksum: string;
  evidenceRef: string;
  generatedAt: string;
}

interface PacketBindingSmokeRuntime {
  env: {
    KRN_DATABASE_URL: string;
  };
  now(): string;
  createId(prefix: string): string;
  runId: string;
}

interface PersistedEvidenceChain {
  aggregate: HarnessRunAggregate;
  evidenceBundle: HarnessRunAggregate["evidenceBundles"][number];
  reviewAssessment: HarnessRunAggregate["reviewAssessments"][number];
  feedbackDelta: HarnessRunAggregate["feedbackDeltas"][number];
}

interface PacketBindingCapture {
  packetIdentity: PacketIdentity;
  firstCapture: PersistedEvidenceChain;
  retryCapture: PersistedEvidenceChain;
}

interface PacketBindingReadback {
  textReadbackMatched: boolean;
  jsonReadbackMatched: boolean;
  packetBindingStatus: string;
  readbackKind: string;
  readbackMutation: string;
  packetBinding: Record<string, unknown>;
}

const readPacketIdentity = (value: Record<string, unknown>): PacketIdentity => {
  const packetIdentity = value.packetIdentity;

  if (!isRecord(packetIdentity)) {
    throw new Error("Run-show DB smoke DecisionPacket readback missed packetIdentity");
  }

  return {
    checksum: requiredString(packetIdentity, "checksum", "Run-show DB smoke packet checksum is missing"),
    evidenceRef: requiredString(packetIdentity, "evidenceRef", "Run-show DB smoke packet evidence ref is missing"),
    generatedAt: requiredString(packetIdentity, "generatedAt", "Run-show DB smoke packet generatedAt is missing")
  };
};

const readPacketBinding = (value: Record<string, unknown>): Record<string, unknown> => {
  const evidenceBundles = value.evidenceBundles;

  if (!Array.isArray(evidenceBundles) || !isRecord(evidenceBundles[0])) {
    throw new Error("Run-show DB smoke evidence readback missed the captured bundle");
  }

  const packetBinding = evidenceBundles[0].packetBinding;

  if (!isRecord(packetBinding)) {
    throw new Error("Run-show DB smoke evidence readback missed packetBinding");
  }

  return packetBinding;
};

const parseJsonReadback = (
  stdout: string
): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed)) {
    throw new Error("Run-show DB smoke JSON readback was not an object");
  }

  return parsed;
};

const requiredEvidenceCommands = (
  evidenceContract: EvidenceContract,
  marker: string
) => {
  const commands = evidenceContract.commands.filter((command) => command.required);

  if (commands.length === 0) {
    throw new Error("Run-show DB smoke requires an active required verification command");
  }

  return commands.map((command, index) => ({
    command: command.command,
    status: "passed" as const,
    provenance: "command_runner" as const,
    exitCode: 0,
    capturedAt: "2026-07-13T00:00:01.000Z",
    outputRef: `smoke:${marker}:packet-binding:${index}`
  }));
};

const persistedEvidenceChainFor = (
  aggregate: HarnessRunAggregate | undefined,
  phase: string
): PersistedEvidenceChain => {
  if (aggregate === undefined) {
    throw new Error(`Run-show DB smoke missed the ${phase} persisted evidence capture`);
  }

  const evidenceBundle = aggregate.evidenceBundles[0];
  const reviewAssessment = aggregate.reviewAssessments[0];
  const feedbackDelta = aggregate.feedbackDeltas[0];

  if (evidenceBundle === undefined || reviewAssessment === undefined || feedbackDelta === undefined) {
    throw new Error(`Run-show DB smoke missed the ${phase} evidence/review/feedback chain`);
  }

  return {
    aggregate,
    evidenceBundle,
    reviewAssessment,
    feedbackDelta
  };
};

const capturePacketBindingEvidence = async (input: {
  commandRuntime: DatabaseRuntime;
  evidenceContract: EvidenceContract;
  marker: string;
  runtime: PacketBindingSmokeRuntime;
}): Promise<PacketBindingCapture> => {
  const decisionPacket = parseJsonReadback((await runDecisionPacketCommand({
    ...input.runtime,
    createDatabaseRuntime: async () => input.commandRuntime
  })).stdout);
  const packetIdentity = readPacketIdentity(decisionPacket);
  const captureRuntime = {
    ...input.runtime,
    cwd: process.cwd(),
    persist: true,
    decisionPacketChecksum: packetIdentity.checksum,
    decisionPacketGeneratedAt: packetIdentity.generatedAt,
    commandOutcomes: requiredEvidenceCommands(input.evidenceContract, input.marker),
    readGitStatus: async () => "",
    createDatabaseRuntime: async () => input.commandRuntime
  };

  await runEvidenceCaptureCommand(captureRuntime);
  const firstCapture = persistedEvidenceChainFor(
    await input.commandRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(input.runtime.runId),
    "first"
  );

  await runEvidenceCaptureCommand(captureRuntime);

  return {
    packetIdentity,
    firstCapture,
    retryCapture: persistedEvidenceChainFor(
      await input.commandRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(input.runtime.runId),
      "retried"
    )
  };
};

const evidenceChainHasExactCounts = (chain: PersistedEvidenceChain): boolean => [
  chain.aggregate.evidenceBundles.length === 1,
  chain.aggregate.reviewAssessments.length === 1,
  chain.aggregate.feedbackDeltas.length === 1,
  chain.aggregate.runEvents.length === 2
].every(Boolean);

const packetBindingRetryStable = (capture: PacketBindingCapture): boolean => [
  evidenceChainHasExactCounts(capture.firstCapture),
  evidenceChainHasExactCounts(capture.retryCapture),
  capture.firstCapture.evidenceBundle.id === capture.retryCapture.evidenceBundle.id,
  capture.firstCapture.reviewAssessment.id === capture.retryCapture.reviewAssessment.id,
  capture.firstCapture.feedbackDelta.id === capture.retryCapture.feedbackDelta.id
].every(Boolean);

const runPacketBindingReadback = async (input: {
  commandRuntime: DatabaseRuntime;
  runtime: PacketBindingSmokeRuntime;
}): Promise<PacketBindingReadback> => {
  const textReadback = await runRunShowCommand({
    ...input.runtime,
    format: "text",
    createDatabaseRuntime: async () => input.commandRuntime
  });
  const jsonReadback = await runRunShowCommand({
    ...input.runtime,
    format: "json",
    createDatabaseRuntime: async () => input.commandRuntime
  });
  const parsed = parseJsonReadback(jsonReadback.stdout);
  const packetBinding = readPacketBinding(parsed);
  const readbackKind = readString(parsed, "kind") ?? "missing";
  const readbackMutation = readString(parsed, "mutation") ?? "missing";
  const packetBindingStatus = readString(packetBinding, "status") ?? "missing";

  return {
    textReadbackMatched: [
      "KRN Decision Packet Read Model",
      `Run ID: ${input.runtime.runId}`,
      "Mutation: none",
      "packetBinding: bound_current"
    ].every((line) => textReadback.stdout.includes(line)),
    jsonReadbackMatched:
      readbackKind === "krn.decisionPacket.readModel.v1" &&
      readbackMutation === "none" &&
      readRunId(parsed) === input.runtime.runId,
    packetBindingStatus,
    readbackKind,
    readbackMutation,
    packetBinding
  };
};

const packetBindingStoredChecksumMatched = (
  capture: PacketBindingCapture,
  readback: PacketBindingReadback
): boolean => {
  const metadata = capture.retryCapture.evidenceBundle.metadata;
  const packetIdentity = capture.packetIdentity;

  return [
    metadata.decisionPacketBindingState === "bound_current",
    metadata.decisionPacketChecksum === packetIdentity.checksum,
    metadata.decisionPacketEvidenceRef === packetIdentity.evidenceRef,
    metadata.decisionPacketGeneratedAt === packetIdentity.generatedAt,
    readback.packetBindingStatus === "bound_current",
    readString(readback.packetBinding, "checksum") === packetIdentity.checksum,
    readString(readback.packetBinding, "evidenceRef") === packetIdentity.evidenceRef,
    readString(readback.packetBinding, "generatedAt") === packetIdentity.generatedAt
  ].every(Boolean);
};

const assertPacketBindingSmoke = (input: {
  capture: PacketBindingCapture;
  readback: PacketBindingReadback;
  storedChecksumMatched: boolean;
  retryStable: boolean;
}): void => {
  const retry = input.capture.retryCapture.aggregate;
  const failed = [{
    label: "text readback",
    passed: input.readback.textReadbackMatched
  }, {
    label: "JSON readback",
    passed: input.readback.jsonReadbackMatched
  }, {
    label: "stored packet binding",
    passed: input.storedChecksumMatched
  }, {
    label: "stable retry",
    passed: input.retryStable
  }, {
    label: "exact persisted chain counts",
    passed: evidenceChainHasExactCounts(input.capture.retryCapture)
  }].find((check) => !check.passed);

  if (failed !== undefined) {
    throw new Error(
      `Run-show DB smoke packet binding failed ${failed.label}: binding=${input.readback.packetBindingStatus}, bundles=${retry.evidenceBundles.length}, reviews=${retry.reviewAssessments.length}, feedback=${retry.feedbackDeltas.length}, events=${retry.runEvents.length}`
    );
  }
};

export const runRunShowDbSmokeCheck = async (
  input: RunShowDbSmokeInput
): Promise<RunShowDbSmokeReport> => {
  const { client, db, marker, projectSlug, task, workspaceSlug } =
    await createHarnessCompilerSmokeRuntime({
      databaseUrl: input.databaseUrl,
      migrationsFolder: input.migrationsFolder,
      smokeId: input.smokeId,
      smokeName: "run-show smoke",
      workspacePrefix: "krn-run-show-smoke",
      projectSlug: "run-show",
      taskPrefix: "run show readback smoke"
  });
  let retrievalRunId: string | undefined;
  let feedbackDeltaId: string | undefined;
  let cleanedUp = false;

  const cleanup = (): Promise<number> => cleanupHarnessCompilerSmokeRows({
    db,
    feedbackDeltaId,
    marker,
    retrievalRunId,
    workspaceSlug
  });

  try {
    await cleanup();

    const {
      executionRun,
      harnessRunRepository,
      memoryRepository,
      project,
      result,
      retrievalRepository,
      retrievalRunId: compiledRetrievalRunId,
      sourceRepository,
      workspace
    } = await createCompiledSmokeExecution({
      acceptance: "read back persisted run through krn run show",
      command: "db:smoke:run-show",
      db,
      eventMessage: "Run-show smoke created persisted run",
      eventPayload: (compiledResult) => ({
        operatorIntentId: compiledResult.operatorIntent.id,
        taskContractId: compiledResult.taskContract.id,
        harnessPlanId: compiledResult.harnessPlan.id,
        contextAssemblyId: compiledResult.contextAssembly.id
      }),
      eventType: "smoke.run_show.persisted",
      marker,
      projectSlug,
      task,
      workspaceSlug
    });
    retrievalRunId = compiledRetrievalRunId;

    const commandRuntime = {
      workspaceId: workspace.id,
      projectId: project.id,
      compilerDependencies: {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository,
        now: () => "2026-07-13T00:00:00.000Z",
        createId: (prefix: string) => `${prefix}-${marker}`
      },
      harnessRunRepository,
      maintenanceQueueRepository: new DrizzleMaintenanceQueueRepository(db),
      sourceRepository,
      retrievalRepository,
      memoryRepository,
      async close() {}
    };
    const runtime: PacketBindingSmokeRuntime = {
      env: {
        KRN_DATABASE_URL: input.databaseUrl
      },
      now: () => "2026-07-03T12:00:00.000Z",
      createId: (prefix: string) => `${prefix}-${marker}`,
      runId: executionRun.id
    };
    const capture = await capturePacketBindingEvidence({
      commandRuntime,
      evidenceContract: result.evidenceContract,
      marker,
      runtime
    });
    feedbackDeltaId = capture.retryCapture.feedbackDelta.id;
    const readback = await runPacketBindingReadback({ commandRuntime, runtime });
    const storedChecksumMatched = packetBindingStoredChecksumMatched(capture, readback);
    const retryStable = packetBindingRetryStable(capture);

    assertPacketBindingSmoke({
      capture,
      readback,
      storedChecksumMatched,
      retryStable
    });

    const remainingMarkerCount = await cleanup();
    cleanedUp = true;

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      textReadbackMatched: readback.textReadbackMatched,
      jsonReadbackMatched: readback.jsonReadbackMatched,
      packetBindingStatus: readback.packetBindingStatus,
      packetBindingStoredChecksumMatched: storedChecksumMatched,
      packetBindingRetryStable: retryStable,
      evidenceBundleCount: capture.retryCapture.aggregate.evidenceBundles.length,
      reviewAssessmentCount: capture.retryCapture.aggregate.reviewAssessments.length,
      feedbackDeltaCount: capture.retryCapture.aggregate.feedbackDeltas.length,
      runEventCount: capture.retryCapture.aggregate.runEvents.length,
      readbackKind: readback.readbackKind,
      readbackMutation: readback.readbackMutation,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    try {
      if (!cleanedUp) {
        await cleanup();
      }
    } finally {
      await client.end();
    }
  }
};
