import {
  createFeedbackDeltaMaintenanceHandler,
  runMaintenanceQueueRecord
} from "@krn/db/adapters";
import type {
  MaintenanceQueueRuntimeWriteBoundaryAssessment,
  MaintenanceQueueWriteBoundaryReadback
} from "@krn/core";

import {
  createMaintenanceQueueDatabaseRuntime
} from "./database-runtime.js";
import type {
  MaintenanceQueueDatabaseRuntime,
  MaintenanceQueueDatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import type {
  CliCommand
} from "./parse-args.js";

export type MaintenanceRunCommand = Extract<CliCommand, { kind: "maintenanceRun" }>;

export type CreateMaintenanceQueueDatabaseRuntime = (
  input: MaintenanceQueueDatabaseRuntimeInput
) => Promise<MaintenanceQueueDatabaseRuntime>;

export interface MaintenanceRunCommandRuntime extends BaseCommandRuntime {
  command: MaintenanceRunCommand;
  createMaintenanceQueueDatabaseRuntime?: CreateMaintenanceQueueDatabaseRuntime;
}

export interface MaintenanceRunCommandResult {
  stdout: string;
}

const lockedBy = "krn-cli-maintenance-run";

const linesForValues = (
  label: string,
  values: readonly string[]
): string[] => [
  `${label}:`,
  ...(values.length === 0 ? ["- none"] : values.map((value) => `- ${value}`))
];

const writeBoundaryLines = (
  boundary: MaintenanceQueueWriteBoundaryReadback
): string[] => [
  "writeBoundary:",
  `  status: ${boundary.status}`,
  `  memoryBoundary: ${boundary.memoryBoundary}`,
  `  queueRecordKeyTemplate: ${boundary.queueRecordKeyTemplate}`,
  `  allowedWrites: ${boundary.allowedWrites.join(", ")}`,
  `  forbiddenWrites: ${boundary.forbiddenWrites.join(", ")}`,
  `  doesNotProve: ${boundary.doesNotProve}`
];

const handlerWriteBoundaryLines = (
  boundary: MaintenanceQueueRuntimeWriteBoundaryAssessment | undefined
): string[] => {
  if (boundary === undefined) {
    return ["handlerWriteBoundary: none"];
  }

  return [
    "handlerWriteBoundary:",
    `  status: ${boundary.status}`,
    `  memoryBoundary: ${boundary.memoryBoundary}`,
    `  declaredWrites: ${boundary.declaredWrites.join(", ")}`,
    ...(boundary.violations.length === 0
      ? ["  violations: none"]
      : [
          "  violations:",
          ...boundary.violations.map((violation) => `  - ${violation.code}: ${violation.message}`)
        ])
  ];
};

const createdReviewCandidateLines = (
  createdReviewCandidates: Awaited<ReturnType<typeof runMaintenanceQueueRecord>>["createdReviewCandidates"]
): string[] => linesForValues(
  "createdReviewCandidates",
  createdReviewCandidates.map((candidate) => `${candidate.kind}:${candidate.id}`)
);

const formatMaintenanceRunOutput = (
  readback: Awaited<ReturnType<typeof runMaintenanceQueueRecord>>
): string => [
  "KRN Maintenance Queue Run",
  `status: ${readback.status}`,
  `jobType: ${readback.jobType}`,
  `recordId: ${readback.record.id}`,
  `recordStatus: ${readback.record.status}`,
  `queueKey: ${readback.record.queueKey}`,
  `attempts: ${readback.record.attempts}/${readback.record.maxAttempts}`,
  `queueRecordKeyUniqueness: ${readback.queueRecordKeyUniqueness}`,
  ...writeBoundaryLines(readback.writeBoundary),
  ...handlerWriteBoundaryLines(readback.handlerWriteBoundary),
  ...createdReviewCandidateLines(readback.createdReviewCandidates),
  ...linesForValues("proves", readback.proves),
  ...linesForValues("doesNotProve", readback.doesNotProve)
].join("\n") + "\n";

export const runMaintenanceQueueCommand = async (
  runtime: MaintenanceRunCommandRuntime
): Promise<MaintenanceRunCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn maintenance run");
  }

  const createRuntime =
    runtime.createMaintenanceQueueDatabaseRuntime ?? createMaintenanceQueueDatabaseRuntime;
  const databaseRuntime = await createRuntime({ databaseUrl });

  try {
    const readback = await runMaintenanceQueueRecord({
      repository: databaseRuntime.maintenanceQueueRepository,
      recordId: runtime.command.id,
      claim: {
        lockedAt: runtime.now(),
        lockedBy
      },
      handlers: [
        createFeedbackDeltaMaintenanceHandler({
          harnessRunRepository: databaseRuntime.harnessRunRepository,
          memoryRepository: databaseRuntime.memoryRepository,
          now: runtime.now
        })
      ]
    });

    return {
      stdout: formatMaintenanceRunOutput(readback)
    };
  } finally {
    await databaseRuntime.close();
  }
};
