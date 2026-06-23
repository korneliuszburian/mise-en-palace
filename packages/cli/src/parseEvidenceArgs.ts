import type {
  EvidenceCommand,
  EvidenceCommandStatus
} from "@krn/core";
import {
  optionValue
} from "./parseArgHelpers.js";
import type {
  ParseArgsResult
} from "./parseArgs.js";

const evidenceUsage =
  "Usage: krn evidence capture [--run-id <id>] [--persist] [--command <cmd> --status passed|failed|skipped [--exit-code <code>] [--output <path>]]";

const evidenceStatuses = ["passed", "failed", "skipped"] as const;

const isEvidenceStatus = (value: string): value is EvidenceCommandStatus =>
  evidenceStatuses.some((status) => status === value);

const parseExitCode = (value: string): number | undefined => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
};

const pushPendingCommand = (
  commands: EvidenceCommand[],
  pending: Partial<EvidenceCommand> | undefined
): { error?: string } => {
  if (pending === undefined) {
    return {};
  }

  if (pending.command === undefined || pending.command.trim().length === 0) {
    return {
      error: "--command requires a non-empty value"
    };
  }

  if (pending.status === undefined) {
    return {
      error: "--command requires --status passed|failed|skipped"
    };
  }

  commands.push({
    command: pending.command.trim(),
    status: pending.status,
    ...(pending.exitCode === undefined ? {} : { exitCode: pending.exitCode }),
    ...(pending.outputPath === undefined || pending.outputPath.trim().length === 0
      ? {}
      : { outputPath: pending.outputPath.trim() })
  });

  return {};
};

export const parseEvidenceArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] !== "capture") {
    return {
      error: evidenceUsage
    };
  }

  let persist = false;
  let runId: string | undefined;
  let pendingCommand: Partial<EvidenceCommand> | undefined;
  const commandOutcomes: EvidenceCommand[] = [];

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      persist = true;
      continue;
    }

    if (arg === "--run-id") {
      runId = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith("--run-id=") === true) {
      runId = arg.slice("--run-id=".length);
      continue;
    }

    if (arg === "--command" || arg?.startsWith("--command=") === true) {
      const valueResult = optionValue(rest, index, "--command");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      const pushResult = pushPendingCommand(commandOutcomes, pendingCommand);

      if (pushResult.error !== undefined) {
        return {
          error: pushResult.error
        };
      }

      pendingCommand = {
        command: valueResult.value
      };
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--status" || arg?.startsWith("--status=") === true) {
      const valueResult = optionValue(rest, index, "--status");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (pendingCommand === undefined) {
        return {
          error: "--status requires a preceding --command"
        };
      }

      if (!isEvidenceStatus(valueResult.value)) {
        return {
          error: "--status must be passed, failed, or skipped"
        };
      }

      pendingCommand = {
        ...pendingCommand,
        status: valueResult.value
      };
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--exit-code" || arg?.startsWith("--exit-code=") === true) {
      const valueResult = optionValue(rest, index, "--exit-code");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (pendingCommand === undefined) {
        return {
          error: "--exit-code requires a preceding --command"
        };
      }

      const exitCode = parseExitCode(valueResult.value);

      if (exitCode === undefined) {
        return {
          error: "--exit-code must be an integer"
        };
      }

      pendingCommand = {
        ...pendingCommand,
        exitCode
      };
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--output" || arg?.startsWith("--output=") === true) {
      const valueResult = optionValue(rest, index, "--output");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (pendingCommand === undefined) {
        return {
          error: "--output requires a preceding --command"
        };
      }

      pendingCommand = {
        ...pendingCommand,
        outputPath: valueResult.value
      };
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: evidenceUsage
    };
  }

  const pushResult = pushPendingCommand(commandOutcomes, pendingCommand);

  if (pushResult.error !== undefined) {
    return {
      error: pushResult.error
    };
  }

  return {
    command: {
      kind: "evidenceCapture",
      persist,
      ...(runId === undefined ? {} : { runId: runId.trim() }),
      ...(commandOutcomes.length === 0 ? {} : { commandOutcomes })
    }
  };
};
