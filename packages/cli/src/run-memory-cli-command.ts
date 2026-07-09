import type {
  CliCommand
} from "./parse-args.js";
import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";
import {
  runMemoryAntiAddCommand
} from "./run-memory-anti-add-command.js";
import {
  runMemoryAntiReviewCommand
} from "./run-memory-anti-review-command.js";
import {
  runMemoryCandidateAddCommand
} from "./run-memory-candidate-add-command.js";
import {
  runMemoryCandidateReviewCommand
} from "./run-memory-candidate-review-command.js";
import {
  runMemoryRecordApplyCommand
} from "./run-memory-record-apply-command.js";
import {
  runMemoryKnowledgeSeedCommand
} from "./run-memory-knowledge-seed-command.js";
import {
  runMemoryKnowledgeProposeCommand
} from "./run-memory-knowledge-propose-command.js";
import {
  runMemoryAntiProposeCommand
} from "./run-memory-anti-propose-command.js";

type MemoryCliCommand = Extract<
  CliCommand,
  | { kind: "memoryCandidateAdd" }
  | { kind: "memoryCandidatePromote" }
  | { kind: "memoryCandidateReject" }
  | { kind: "memoryRecordApply" }
  | { kind: "memoryKnowledgeSeed" }
  | { kind: "memoryKnowledgePropose" }
  | { kind: "memoryAntiAdd" }
  | { kind: "memoryAntiPropose" }
  | { kind: "memoryAntiPromote" }
  | { kind: "memoryAntiReject" }
>;

interface MemoryCliCommandContext {
  env: CliRuntime["env"];
  now: () => string;
  createId: (prefix: string) => string;
  createDatabaseRuntime?: CreateDatabaseRuntime;
  formatCliError(message: string): string;
}

type MemoryCommandOutput = {
  stdout: string;
};

const memoryCommandKinds = new Set<string>([
  "memoryCandidateAdd",
  "memoryCandidatePromote",
  "memoryCandidateReject",
  "memoryRecordApply",
  "memoryKnowledgeSeed",
  "memoryKnowledgePropose",
  "memoryAntiAdd",
  "memoryAntiPropose",
  "memoryAntiPromote",
  "memoryAntiReject"
]);

const memoryCommandResult = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const memoryCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: MemoryCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const databaseRuntimeOption = (
  context: MemoryCliCommandContext
): { createDatabaseRuntime?: CreateDatabaseRuntime } => (
  context.createDatabaseRuntime === undefined
    ? {}
    : { createDatabaseRuntime: context.createDatabaseRuntime }
);

const standardMemoryInput = (context: MemoryCliCommandContext) => ({
  env: context.env,
  now: context.now,
  createId: context.createId,
  ...databaseRuntimeOption(context)
});

const isMemoryCliCommand = (command: CliCommand): command is MemoryCliCommand => (
  memoryCommandKinds.has(command.kind)
);

const memoryFallbackMessages = {
  memoryCandidateAdd: "Unknown memory candidate add error",
  memoryCandidatePromote: "Unknown memory candidate review error",
  memoryCandidateReject: "Unknown memory candidate review error",
  memoryRecordApply: "Unknown memory record apply error",
  memoryKnowledgeSeed: "Unknown memory knowledge seed error",
  memoryKnowledgePropose: "Unknown memory knowledge propose error",
  memoryAntiAdd: "Unknown memory anti add error",
  memoryAntiPropose: "Unknown memory anti propose error",
  memoryAntiPromote: "Unknown memory anti review error",
  memoryAntiReject: "Unknown memory anti review error"
} satisfies Record<MemoryCliCommand["kind"], string>;

const runSelectedMemoryCommand = async (
  command: MemoryCliCommand,
  context: MemoryCliCommandContext
): Promise<MemoryCommandOutput> => {
  if (command.kind === "memoryCandidateAdd") {
    return runMemoryCandidateAddCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (
    command.kind === "memoryCandidatePromote" ||
    command.kind === "memoryCandidateReject"
  ) {
    return runMemoryCandidateReviewCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryRecordApply") {
    return runMemoryRecordApplyCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryKnowledgeSeed") {
    return runMemoryKnowledgeSeedCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryKnowledgePropose") {
    return runMemoryKnowledgeProposeCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryAntiAdd") {
    return runMemoryAntiAddCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryAntiPropose") {
    return runMemoryAntiProposeCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  return runMemoryAntiReviewCommand({
    ...standardMemoryInput(context),
    command
  });
};

export const runMemoryCliCommand = async (
  command: CliCommand,
  context: MemoryCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isMemoryCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedMemoryCommand(command, context);
    return memoryCommandResult(result.stdout);
  } catch (error) {
    return memoryCommandError(error, memoryFallbackMessages[command.kind], context);
  }
};
