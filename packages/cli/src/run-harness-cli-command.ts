import type {
  CliCommand
} from "./parse-args.js";
import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";
import {
  runPlanCommand
} from "./run-plan-command.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";
import {
  runCodexBriefCommand
} from "./run-codex-brief-command.js";
import {
  runEvidenceCaptureCommand
} from "./run-evidence-capture-command.js";
import {
  runObserveCommand
} from "./run-observe-command.js";
import type {
  CreateObserveDatabaseRuntime
} from "./run-observe-command.js";
import {
  runReflectCommand
} from "./run-reflect-command.js";
import type {
  CreateReflectDatabaseRuntime
} from "./run-reflect-command.js";
import {
  runReviewAssessCommand
} from "./run-review-assess-command.js";
import type {
  CreateReviewAssessDatabaseRuntime
} from "./run-review-assess-command.js";
import {
  runRunShowCommand
} from "./run-run-show-command.js";
import {
  runAgentPacketCommand
} from "./run-agent-packet-command.js";

type HarnessCliCommand = Extract<
  CliCommand,
  | { kind: "plan" }
  | { kind: "reviewAssess" }
  | { kind: "runShow" }
  | { kind: "agentPacket" }
  | { kind: "codexBrief" }
  | { kind: "evidenceCapture" }
  | { kind: "observeRun" }
  | { kind: "reflect" }
>;

interface HarnessCliCommandContext {
  cwd: string;
  env: CliRuntime["env"];
  now: () => string;
  createId: (prefix: string) => string;
  readGitStatus?: CliRuntime["readGitStatus"];
  createDatabaseRuntime?: CreateDatabaseRuntime;
  createReviewAssessDatabaseRuntime?: CreateReviewAssessDatabaseRuntime;
  createObserveDatabaseRuntime?: CreateObserveDatabaseRuntime;
  createReflectDatabaseRuntime?: CreateReflectDatabaseRuntime;
  formatCliError(message: string): string;
}

type HarnessCommandOutput = {
  stdout: string;
};

const harnessCommandResult = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const harnessCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: HarnessCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const databaseRuntimeOption = (
  context: HarnessCliCommandContext
): { createDatabaseRuntime?: CreateDatabaseRuntime } => (
  context.createDatabaseRuntime === undefined
    ? {}
    : { createDatabaseRuntime: context.createDatabaseRuntime }
);

const isHarnessCliCommand = (command: CliCommand): command is HarnessCliCommand => (
  command.kind === "plan" ||
    command.kind === "reviewAssess" ||
    command.kind === "runShow" ||
    command.kind === "agentPacket" ||
    command.kind === "codexBrief" ||
  command.kind === "evidenceCapture" ||
  command.kind === "observeRun" ||
  command.kind === "reflect"
);

const harnessFallbackMessages = {
  plan: "Unknown CLI error",
  reviewAssess: "Unknown review assess error",
  runShow: "Unknown run show error",
  codexBrief: "Unknown Codex brief error",
  agentPacket: "Unknown agent packet error",
  evidenceCapture: "Unknown evidence capture error",
  observeRun: "Unknown observe error",
  reflect: "Unknown reflect error"
} satisfies Record<HarnessCliCommand["kind"], string>;

const runPlanCliCommand = (
  command: Extract<HarnessCliCommand, { kind: "plan" }>,
  context: HarnessCliCommandContext
): Promise<HarnessCommandOutput> =>
  runPlanCommand(command.task, {
    env: context.env,
    cwd: context.cwd,
    now: context.now,
    createId: context.createId,
    persist: command.persist,
    ...(command.projectId === undefined ? {} : { projectId: command.projectId }),
    ...databaseRuntimeOption(context)
  });

const runReviewAssessCliCommand = (
  command: Extract<HarnessCliCommand, { kind: "reviewAssess" }>,
  context: HarnessCliCommandContext
): Promise<HarnessCommandOutput> =>
  runReviewAssessCommand({
    env: context.env,
    now: context.now,
    createId: context.createId,
    command,
    ...(context.createReviewAssessDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: context.createReviewAssessDatabaseRuntime })
  });

const runReadbackHarnessCommand = (
  command: Extract<HarnessCliCommand, { kind: "runShow" | "agentPacket" | "codexBrief" }>,
  context: HarnessCliCommandContext
): Promise<HarnessCommandOutput> => {
  if (command.kind === "runShow") {
    return runRunShowCommand({
      env: context.env,
      now: context.now,
      createId: context.createId,
      runId: command.runId,
      format: command.format,
      ...databaseRuntimeOption(context)
    });
  }

  if (command.kind === "agentPacket") {
    return runAgentPacketCommand({
      env: context.env,
      now: context.now,
      createId: context.createId,
      runId: command.runId,
      ...databaseRuntimeOption(context)
    });
  }

  return runCodexBriefCommand({
    env: context.env,
    now: context.now,
    createId: context.createId,
    runId: command.runId,
    ...databaseRuntimeOption(context)
  });
};

const runEvidenceCliCommand = (
  command: Extract<HarnessCliCommand, { kind: "evidenceCapture" }>,
  context: HarnessCliCommandContext
): Promise<HarnessCommandOutput> =>
  runEvidenceCaptureCommand({
    env: context.env,
    cwd: context.cwd,
    now: context.now,
    createId: context.createId,
    persist: command.persist,
    ...(command.runId === undefined ? {} : { runId: command.runId }),
    ...(command.agentPacketChecksum === undefined
      ? {}
      : { agentPacketChecksum: command.agentPacketChecksum }),
    ...(command.intendedFiles === undefined ? {} : { intendedFiles: command.intendedFiles }),
    ...(command.commandOutcomes === undefined
      ? {}
      : { commandOutcomes: command.commandOutcomes }),
    ...(command.targetEvidence === undefined ? {} : { targetEvidence: command.targetEvidence }),
    ...(command.sourceUsefulnessOutcomes === undefined
      ? {}
      : { sourceUsefulnessOutcomes: command.sourceUsefulnessOutcomes }),
    ...(command.brainKnowledgeUsefulnessOutcomes === undefined
      ? {}
      : { brainKnowledgeUsefulnessOutcomes: command.brainKnowledgeUsefulnessOutcomes }),
    ...databaseRuntimeOption(context),
    ...(context.readGitStatus === undefined ? {} : { readGitStatus: context.readGitStatus })
  });

const runObservationHarnessCommand = (
  command: Extract<HarnessCliCommand, { kind: "observeRun" | "reflect" }>,
  context: HarnessCliCommandContext
): Promise<HarnessCommandOutput> => {
  if (command.kind === "observeRun") {
    return runObserveCommand({
      env: context.env,
      now: context.now,
      command,
      ...(context.createObserveDatabaseRuntime === undefined
        ? {}
        : { createObserveDatabaseRuntime: context.createObserveDatabaseRuntime })
    });
  }

  return runReflectCommand({
    env: context.env,
    now: context.now,
    createId: context.createId,
    command,
    ...(context.createReflectDatabaseRuntime === undefined
      ? {}
      : { createReflectDatabaseRuntime: context.createReflectDatabaseRuntime })
  });
};

const runSelectedHarnessCommand = (
  command: HarnessCliCommand,
  context: HarnessCliCommandContext
): Promise<HarnessCommandOutput> => {
  if (command.kind === "plan") {
    return runPlanCliCommand(command, context);
  }

  if (command.kind === "reviewAssess") {
    return runReviewAssessCliCommand(command, context);
  }

  if (command.kind === "runShow" || command.kind === "agentPacket" || command.kind === "codexBrief") {
    return runReadbackHarnessCommand(command, context);
  }

  if (command.kind === "evidenceCapture") {
    return runEvidenceCliCommand(command, context);
  }

  return runObservationHarnessCommand(command, context);
};

export const runHarnessCliCommand = async (
  command: CliCommand,
  context: HarnessCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isHarnessCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedHarnessCommand(command, context);
    return harnessCommandResult(result.stdout);
  } catch (error) {
    return harnessCommandError(error, harnessFallbackMessages[command.kind], context);
  }
};
