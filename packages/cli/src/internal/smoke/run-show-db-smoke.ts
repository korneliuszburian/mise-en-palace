import {
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import {
  tmpdir
} from "node:os";
import path from "node:path";
import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "@krn/db/dev";
import {
  DrizzleMaintenanceQueueRepository
} from "@krn/db/adapters";
import {
  decisionPacketMissingActiveEvidenceContractGapId,
  parseEvidenceContract
} from "@krn/core";
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
  terminalActivationInactive: boolean;
  terminalContractHistoryVisible: boolean;
  terminalCommandsSuppressed: boolean;
  terminalEvidenceGapPresent: boolean;
  terminalPacketAbstained: boolean;
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

const recordHasStrings = (
  value: unknown,
  expected: Readonly<Record<string, string>>
): boolean => isRecord(value) && Object.entries(expected).every(
  ([key, expectedValue]) => readString(value, key) === expectedValue
);

const arrayHasRecordWithString = (
  value: unknown,
  key: string,
  expectedValue: string
): boolean => Array.isArray(value) && value.some((item) =>
  isRecord(item) && readString(item, key) === expectedValue
);

const evidenceContractProofShape = (contract: EvidenceContract) => ({
  taskContractId: contract.taskContractId,
  commands: contract.commands,
  diffRisk: contract.diffRisk,
  reviewBurden: contract.reviewBurden,
  rollbackPath: contract.rollbackPath
});

const evidenceContractHistoryMatches = (
  value: unknown,
  expected: EvidenceContract
): boolean => {
  const parsed = parseEvidenceContract(value);

  return parsed !== undefined &&
    JSON.stringify(evidenceContractProofShape(parsed)) ===
      JSON.stringify(evidenceContractProofShape(expected));
};

interface PacketIdentity {
  packetId: string;
  checksum: string;
  evidenceRef: string;
  generatedAt: string;
  sourceRunStatus: string;
  sourceRunLifecycleRevision: number;
  sourceRunUpdatedAt: string;
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

interface TerminalEvidenceContractReadback {
  activationInactive: boolean;
  contractHistoryVisible: boolean;
  commandsSuppressed: boolean;
  evidenceGapPresent: boolean;
  packetIdentityMatched: boolean;
  packetAbstained: boolean;
}

const readPacketIdentity = (value: Record<string, unknown>): PacketIdentity => {
  const packetIdentity = value.packetIdentity;

  if (!isRecord(packetIdentity)) {
    throw new Error("Run-show DB smoke DecisionPacket readback missed packetIdentity");
  }
  const sourceRunLifecycleRevision = packetIdentity.sourceRunLifecycleRevision;

  if (
    typeof sourceRunLifecycleRevision !== "number" ||
    !Number.isSafeInteger(sourceRunLifecycleRevision) ||
    sourceRunLifecycleRevision < 1
  ) {
    throw new Error("Run-show DB smoke packet source run lifecycle revision is missing");
  }

  return {
    packetId: requiredString(packetIdentity, "packetId", "Run-show DB smoke packet id is missing"),
    checksum: requiredString(packetIdentity, "checksum", "Run-show DB smoke packet checksum is missing"),
    evidenceRef: requiredString(packetIdentity, "evidenceRef", "Run-show DB smoke packet evidence ref is missing"),
    generatedAt: requiredString(packetIdentity, "generatedAt", "Run-show DB smoke packet generatedAt is missing"),
    sourceRunStatus: requiredString(
      packetIdentity,
      "sourceRunStatus",
      "Run-show DB smoke packet source run status is missing"
    ),
    sourceRunLifecycleRevision,
    sourceRunUpdatedAt: requiredString(
      packetIdentity,
      "sourceRunUpdatedAt",
      "Run-show DB smoke packet source run updatedAt is missing"
    )
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

const terminalEvidenceContractReadback = (
  value: Record<string, unknown>,
  evidenceContract: EvidenceContract,
  terminalRun: HarnessRunAggregate["executionRun"],
  firstPacketIdentity: PacketIdentity
): TerminalEvidenceContractReadback => {
  const readModel = value.readModel;
  const packet = value.packet;

  if (!isRecord(readModel) || !isRecord(packet)) {
    throw new Error("Run-show DB smoke terminal DecisionPacket missed readModel or packet");
  }

  const activation = readModel.evidenceContractActivation;
  const historicalContract = readModel.evidenceContract;
  const abstentionScore = packet.abstentionScore;
  const verificationCommands = packet.verificationCommands;
  const evidenceGaps = packet.evidenceGaps;
  const packetIdentity = readPacketIdentity(value);

  return {
    activationInactive: recordHasStrings(activation, {
      status: "inactive",
      reason: "execution_run_terminal",
      executionRunId: terminalRun.id
    }),
    contractHistoryVisible: evidenceContractHistoryMatches(historicalContract, evidenceContract),
    commandsSuppressed: Array.isArray(verificationCommands) &&
      verificationCommands.length === 0 &&
      packet.evidenceContract === undefined,
    evidenceGapPresent: arrayHasRecordWithString(
      evidenceGaps,
      "id",
      decisionPacketMissingActiveEvidenceContractGapId
    ),
    packetIdentityMatched: [
      firstPacketIdentity.sourceRunStatus === "planned",
      packetIdentity.packetId !== firstPacketIdentity.packetId,
      packetIdentity.checksum !== firstPacketIdentity.checksum,
      packetIdentity.sourceRunStatus === terminalRun.status,
      packetIdentity.sourceRunLifecycleRevision === terminalRun.lifecycleRevision,
      packetIdentity.sourceRunUpdatedAt === terminalRun.updatedAt
    ].every(Boolean),
    packetAbstained: recordHasStrings(abstentionScore, { status: "abstain" })
  };
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
  marker: string;
  runtime: PacketBindingSmokeRuntime;
}): Promise<PacketBindingCapture> => {
  const startedAt = new Date().toISOString();
  const decisionPacketResult = await runDecisionPacketCommand({
    ...input.runtime,
    createDatabaseRuntime: async () => input.commandRuntime
  });
  const completedAt = new Date().toISOString();
  const decisionPacket = parseJsonReadback(decisionPacketResult.stdout);
  const packetIdentity = readPacketIdentity(decisionPacket);
  const captureDirectory = await mkdtemp(
    path.join(tmpdir(), `krn-run-show-smoke-${input.marker}-`)
  );
  const stdoutFile = path.join(captureDirectory, "decision-packet.stdout");
  const stderrFile = path.join(captureDirectory, "decision-packet.stderr");

  try {
    await Promise.all([
      writeFile(stdoutFile, decisionPacketResult.stdout),
      writeFile(stderrFile, "")
    ]);
    const captureRuntime = {
      ...input.runtime,
      cwd: process.cwd(),
      persist: true,
      decisionPacketChecksum: packetIdentity.checksum,
      decisionPacketGeneratedAt: packetIdentity.generatedAt,
      commandOutcomes: [{
        command: "krn decision packet readback observation",
        status: "passed" as const,
        exitCode: 0,
        startedAt,
        capturedAt: completedAt,
        stdoutFile,
        stderrFile
      }],
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
  } finally {
    await rm(captureDirectory, { recursive: true, force: true });
  }
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
      "packetBinding: bound_current",
      "packetBindingSourceRunLifecycleRevision:",
      "command output artifacts:",
      "storedBytesSha256:"
    ].every((line) => textReadback.stdout.includes(line)),
    jsonReadbackMatched:
      readbackKind === "krn.decisionPacket.readModel.v1" &&
      readbackMutation === "none" &&
      readRunId(parsed) === input.runtime.runId &&
      jsonReadback.stdout.includes('"commandOutputArtifacts"') &&
      !jsonReadback.stdout.includes('"bytes"'),
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
    metadata.decisionPacketSourceRunLifecycleRevision === packetIdentity.sourceRunLifecycleRevision,
    readback.packetBindingStatus === "bound_current",
    readString(readback.packetBinding, "checksum") === packetIdentity.checksum,
    readString(readback.packetBinding, "evidenceRef") === packetIdentity.evidenceRef,
    readString(readback.packetBinding, "generatedAt") === packetIdentity.generatedAt,
    readback.packetBinding.sourceRunLifecycleRevision === packetIdentity.sourceRunLifecycleRevision
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

const assertTerminalEvidenceContractReadback = (
  readback: TerminalEvidenceContractReadback
): void => {
  const failed = [{
    label: "inactive terminal activation",
    passed: readback.activationInactive
  }, {
    label: "historical contract visibility",
    passed: readback.contractHistoryVisible
  }, {
    label: "terminal command suppression",
    passed: readback.commandsSuppressed
  }, {
    label: "inactive-contract evidence gap",
    passed: readback.evidenceGapPresent
  }, {
    label: "terminal packet identity",
    passed: readback.packetIdentityMatched
  }, {
    label: "terminal packet abstention",
    passed: readback.packetAbstained
  }].find((check) => !check.passed);

  if (failed !== undefined) {
    throw new Error(`Run-show DB smoke terminal EvidenceContract failed ${failed.label}`);
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

    const runningTransition = await harnessRunRepository.updateExecutionRunStatus({
      executionRunId: executionRun.id,
      expectedStatus: "planned",
      status: "running",
      startedAt: "2026-07-13T00:00:02.000Z"
    });

    if (runningTransition.kind !== "transitioned") {
      throw new Error("Run-show smoke expected the planned run to transition to running");
    }

    const succeededTransition = await harnessRunRepository.updateExecutionRunStatus({
      executionRunId: executionRun.id,
      expectedStatus: "running",
      status: "succeeded",
      completedAt: "2026-07-13T00:00:03.000Z"
    });

    if (succeededTransition.kind !== "transitioned") {
      throw new Error("Run-show smoke expected the running run to transition to succeeded");
    }

    const succeededRun = succeededTransition.executionRun;
    const terminalContractReadback = terminalEvidenceContractReadback(
      parseJsonReadback((await runDecisionPacketCommand({
        ...runtime,
        createDatabaseRuntime: async () => commandRuntime
      })).stdout),
      result.evidenceContract,
      succeededRun,
      capture.packetIdentity
    );
    assertTerminalEvidenceContractReadback(terminalContractReadback);

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
      terminalActivationInactive: terminalContractReadback.activationInactive,
      terminalContractHistoryVisible: terminalContractReadback.contractHistoryVisible,
      terminalCommandsSuppressed: terminalContractReadback.commandsSuppressed,
      terminalEvidenceGapPresent: terminalContractReadback.evidenceGapPresent,
      terminalPacketAbstained: terminalContractReadback.packetAbstained,
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
