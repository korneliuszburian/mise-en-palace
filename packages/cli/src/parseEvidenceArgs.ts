import type {
  EvidenceCommand,
  EvidenceCommandStatus,
  TargetEvidenceChangedFileInput,
  TargetEvidenceInput
} from "@krn/core";
import {
  optionValue
} from "./parseArgHelpers.js";
import type {
  ParseArgsResult
} from "./parseArgs.js";

const evidenceUsage = [
  "Usage: krn evidence capture [--run-id <id>] [--persist] [--intended-file <path>] [--verification <command=status>] [--target-repo <path>] [--target-mode observation-only|headless-repair|real-second-operator|unknown] [--target-dirty-before clean|dirty|unknown] [--target-dirty-after clean|dirty|unknown] [--target-owned-changes external|owned-by-current-krn-run|partial|unknown] [--target-changed-file <status path>] [--target-command <cmd>] [--command <cmd> --status passed|failed|skipped|missing|not_run [--exit-code <code>] [--output <path>]]",
  "Example: krn evidence capture --intended-file packages/cli/src/runEvidenceCaptureCommand.ts --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
  "Target example: krn evidence capture --target-repo ../target --target-mode observation-only --target-dirty-before dirty --target-dirty-after dirty --target-owned-changes external --target-allowed-write none --target-forbidden-write \"target source edits\" --target-changed-file \"M src/app.ts\" --target-command \"target pnpm test\" --verification \"target pnpm test=passed\"",
  "Persisted example: krn evidence capture --run-id <execution-run-id> --intended-file packages/cli/src/runEvidenceCaptureCommand.ts --verification \"git diff --check=passed\" --persist",
  "Note: evidence capture records operator/captured evidence; it does not run commands."
].join("\n");

const evidenceStatuses = ["passed", "failed", "skipped", "missing", "not_run"] as const;
const targetModes = ["observation-only", "headless-repair", "real-second-operator", "unknown"] as const;
const targetDirtyStates = ["clean", "dirty", "unknown"] as const;
const targetOwnerships = ["external", "owned-by-current-krn-run", "partial", "unknown"] as const;

const isEvidenceStatus = (value: string): value is EvidenceCommandStatus =>
  evidenceStatuses.some((status) => status === value);

const normalizeToken = (value: string): string =>
  value.trim().toLowerCase().replaceAll("_", "-");

const isAllowed = (value: string, allowed: readonly string[]): boolean =>
  allowed.some((item) => item === normalizeToken(value));

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
      error: "--command requires --status passed|failed|skipped|missing|not_run"
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

const parseVerification = (value: string): { command?: EvidenceCommand; error?: string } => {
  const separatorIndex = value.lastIndexOf("=");

  if (separatorIndex < 0) {
    return {
      error: "--verification requires <command=status>"
    };
  }

  const command = value.slice(0, separatorIndex).trim();
  const status = value.slice(separatorIndex + 1).trim();

  if (command.length === 0) {
    return {
      error: "--verification requires a non-empty command"
    };
  }

  if (!isEvidenceStatus(status)) {
    return {
      error: "--verification status must be passed, failed, skipped, missing, or not_run"
    };
  }

  return {
    command: {
      command,
      status,
      provenance: "operator_reported"
    }
  };
};

const parseTargetChangedFile = (
  value: string
): { changedFile?: TargetEvidenceChangedFileInput; error?: string } => {
  const trimmed = value.trim();
  const separatorIndex = trimmed.search(/\s/);

  if (separatorIndex < 0) {
    return {
      error: "--target-changed-file requires <status path>"
    };
  }

  const status = trimmed.slice(0, separatorIndex).trim();
  const path = trimmed.slice(separatorIndex + 1).trim();

  if (status.length === 0 || path.length === 0) {
    return {
      error: "--target-changed-file requires <status path>"
    };
  }

  return {
    changedFile: {
      status,
      path
    }
  };
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
  const intendedFiles: string[] = [];
  let targetRepo: string | undefined;
  let targetMode: string | undefined;
  let targetDirtyBefore: string | undefined;
  let targetDirtyAfter: string | undefined;
  let targetOwnedChanges: string | undefined;
  const targetAllowedWrites: string[] = [];
  const targetForbiddenWrites: string[] = [];
  const targetChangedFiles: TargetEvidenceChangedFileInput[] = [];
  const targetCommands: string[] = [];

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

    if (arg === "--intended-file" || arg?.startsWith("--intended-file=") === true) {
      const valueResult = optionValue(rest, index, "--intended-file");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      const intendedFile = valueResult.value.trim();

      if (intendedFile.length === 0) {
        return {
          error: "--intended-file requires a non-empty path"
        };
      }

      intendedFiles.push(intendedFile);
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-repo" || arg?.startsWith("--target-repo=") === true) {
      const valueResult = optionValue(rest, index, "--target-repo");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      targetRepo = valueResult.value.trim();

      if (targetRepo.length === 0) {
        return {
          error: "--target-repo requires a non-empty value"
        };
      }

      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-mode" || arg?.startsWith("--target-mode=") === true) {
      const valueResult = optionValue(rest, index, "--target-mode");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (!isAllowed(valueResult.value, targetModes)) {
        return {
          error: "--target-mode must be observation-only, headless-repair, real-second-operator, or unknown"
        };
      }

      targetMode = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-dirty-before" || arg?.startsWith("--target-dirty-before=") === true) {
      const valueResult = optionValue(rest, index, "--target-dirty-before");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (!isAllowed(valueResult.value, targetDirtyStates)) {
        return {
          error: "--target-dirty-before must be clean, dirty, or unknown"
        };
      }

      targetDirtyBefore = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-dirty-after" || arg?.startsWith("--target-dirty-after=") === true) {
      const valueResult = optionValue(rest, index, "--target-dirty-after");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (!isAllowed(valueResult.value, targetDirtyStates)) {
        return {
          error: "--target-dirty-after must be clean, dirty, or unknown"
        };
      }

      targetDirtyAfter = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-owned-changes" || arg?.startsWith("--target-owned-changes=") === true) {
      const valueResult = optionValue(rest, index, "--target-owned-changes");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      if (!isAllowed(valueResult.value, targetOwnerships)) {
        return {
          error: "--target-owned-changes must be external, owned-by-current-krn-run, partial, or unknown"
        };
      }

      targetOwnedChanges = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-changed-file" || arg?.startsWith("--target-changed-file=") === true) {
      const valueResult = optionValue(rest, index, "--target-changed-file");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      const parseResult = parseTargetChangedFile(valueResult.value);

      if (parseResult.error !== undefined || parseResult.changedFile === undefined) {
        return {
          error: parseResult.error ?? evidenceUsage
        };
      }

      targetChangedFiles.push(parseResult.changedFile);
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-command" || arg?.startsWith("--target-command=") === true) {
      const valueResult = optionValue(rest, index, "--target-command");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      const command = valueResult.value.trim();

      if (command.length === 0) {
        return {
          error: "--target-command requires a non-empty value"
        };
      }

      targetCommands.push(command);
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-allowed-write" || arg?.startsWith("--target-allowed-write=") === true) {
      const valueResult = optionValue(rest, index, "--target-allowed-write");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      const allowedWrite = valueResult.value.trim();

      if (allowedWrite.length === 0) {
        return {
          error: "--target-allowed-write requires a non-empty value"
        };
      }

      targetAllowedWrites.push(allowedWrite);
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--target-forbidden-write" || arg?.startsWith("--target-forbidden-write=") === true) {
      const valueResult = optionValue(rest, index, "--target-forbidden-write");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? evidenceUsage
        };
      }

      const forbiddenWrite = valueResult.value.trim();

      if (forbiddenWrite.length === 0) {
        return {
          error: "--target-forbidden-write requires a non-empty value"
        };
      }

      targetForbiddenWrites.push(forbiddenWrite);
      index = valueResult.nextIndex;
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

    if (arg === "--verification" || arg?.startsWith("--verification=") === true) {
      const valueResult = optionValue(rest, index, "--verification");

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

      pendingCommand = undefined;

      const verificationResult = parseVerification(valueResult.value);

      if (verificationResult.error !== undefined || verificationResult.command === undefined) {
        return {
          error: verificationResult.error ?? evidenceUsage
        };
      }

      commandOutcomes.push(verificationResult.command);
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
          error: "--status must be passed, failed, skipped, missing, or not_run"
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

  const hasTargetEvidence =
    targetRepo !== undefined ||
    targetMode !== undefined ||
    targetDirtyBefore !== undefined ||
    targetDirtyAfter !== undefined ||
    targetOwnedChanges !== undefined ||
    targetAllowedWrites.length > 0 ||
    targetForbiddenWrites.length > 0 ||
    targetChangedFiles.length > 0 ||
    targetCommands.length > 0;

  if (hasTargetEvidence && targetRepo === undefined) {
    return {
      error: "--target-repo is required when target evidence flags are supplied"
    };
  }

  const targetEvidence: TargetEvidenceInput | undefined =
    hasTargetEvidence && targetRepo !== undefined
      ? {
          targetRepo,
          ...(targetMode === undefined ? {} : { mode: targetMode }),
          ...(targetDirtyBefore === undefined ? {} : { dirtyBefore: targetDirtyBefore }),
          ...(targetDirtyAfter === undefined ? {} : { dirtyAfter: targetDirtyAfter }),
          ...(targetOwnedChanges === undefined ? {} : { ownedChanges: targetOwnedChanges }),
          ...(targetAllowedWrites.length === 0 ? {} : { allowedWrites: targetAllowedWrites }),
          ...(targetForbiddenWrites.length === 0 ? {} : { forbiddenWrites: targetForbiddenWrites }),
          ...(targetChangedFiles.length === 0 ? {} : { changedFiles: targetChangedFiles }),
          ...(targetCommands.length === 0 ? {} : { commands: targetCommands })
        }
      : undefined;

  return {
    command: {
      kind: "evidenceCapture",
      persist,
      ...(runId === undefined ? {} : { runId: runId.trim() }),
      ...(intendedFiles.length === 0 ? {} : { intendedFiles }),
      ...(commandOutcomes.length === 0 ? {} : { commandOutcomes }),
      ...(targetEvidence === undefined ? {} : { targetEvidence })
    }
  };
};
