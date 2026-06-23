import type {
  ParseArgsResult
} from "./parseArgs.js";
import {
  optionValue
} from "./parseArgHelpers.js";

type AuditVerificationCommandStatus = "passed" | "failed" | "skipped" | "missing";
type AuditFailOn = "warning";

interface AuditVerificationCommand {
  command: string;
  status: AuditVerificationCommandStatus;
}

const auditVerificationCommand = (
  value: string
): AuditVerificationCommand | { error: string } => {
  const separatorIndex = value.lastIndexOf("=");

  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return {
      error: "--verification requires command=status"
    };
  }

  const command = value.slice(0, separatorIndex).trim();
  const status = value.slice(separatorIndex + 1).trim();

  if (command.length === 0) {
    return {
      error: "--verification requires command=status"
    };
  }

  if (status !== "passed" && status !== "failed" && status !== "skipped" && status !== "missing") {
    return {
      error: "--verification status must be passed, failed, skipped, or missing"
    };
  }

  return {
    command,
    status
  };
};

export const parseAuditArgs = (rest: readonly string[]): ParseArgsResult => {
  const scope = rest[0];

  if (scope !== "repo" && scope !== "slice") {
    return {
      error: "Usage: krn audit repo [--repo <path>] [--json]|krn audit slice --since <ref> [--repo <path>] [--json]"
    };
  }

  let repo: string | undefined;
  let since: string | undefined;
  let format: "text" | "json" = "text";
  let projectId: string | undefined;
  let retrievalRunId: string | undefined;
  let auditBundleId: string | undefined;
  let failOn: AuditFailOn | undefined;
  const intendedFiles: string[] = [];
  const verificationCommands: AuditVerificationCommand[] = [];

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--json") {
      format = "json";
      continue;
    }

    if (arg === "--repo" || arg?.startsWith("--repo=") === true) {
      const valueResult = optionValue(rest, index, "--repo");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit repo [--repo <path>] [--json]"
        };
      }

      repo = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--since" || arg?.startsWith("--since=") === true) {
      const valueResult = optionValue(rest, index, "--since");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--repo <path>] [--json]"
        };
      }

      since = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--project" || arg?.startsWith("--project=") === true) {
      const valueResult = optionValue(rest, index, "--project");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--project <id>]"
        };
      }

      projectId = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--retrieval-run" || arg?.startsWith("--retrieval-run=") === true) {
      const valueResult = optionValue(rest, index, "--retrieval-run");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--retrieval-run <id>]"
        };
      }

      retrievalRunId = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--audit-bundle-id" || arg?.startsWith("--audit-bundle-id=") === true) {
      const valueResult = optionValue(rest, index, "--audit-bundle-id");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--audit-bundle-id <id>]"
        };
      }

      auditBundleId = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--fail-on" || arg?.startsWith("--fail-on=") === true) {
      const valueResult = optionValue(rest, index, "--fail-on");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--fail-on warning]"
        };
      }

      const failOnValue = valueResult.value.trim();

      if (failOnValue !== "warning") {
        return {
          error: "--fail-on must be warning"
        };
      }

      failOn = failOnValue;
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--intended-file" || arg?.startsWith("--intended-file=") === true) {
      const valueResult = optionValue(rest, index, "--intended-file");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--repo <path>] [--intended-file <path>] [--verification <command=status>] [--json]"
        };
      }

      intendedFiles.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--verification" || arg?.startsWith("--verification=") === true) {
      const valueResult = optionValue(rest, index, "--verification");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? "Usage: krn audit slice --since <ref> [--repo <path>] [--verification <command=status>] [--json]"
        };
      }

      const parsedVerification = auditVerificationCommand(valueResult.value);

      if ("error" in parsedVerification) {
        return {
          error: parsedVerification.error
        };
      }

      verificationCommands.push(parsedVerification);
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: "Usage: krn audit repo [--repo <path>] [--json]|krn audit slice --since <ref> [--repo <path>] [--json]"
    };
  }

  if (scope === "repo") {
    if (
      since !== undefined ||
      intendedFiles.length > 0 ||
      verificationCommands.length > 0 ||
      projectId !== undefined ||
      retrievalRunId !== undefined ||
      auditBundleId !== undefined ||
      failOn !== undefined
    ) {
      return {
        error: "Usage: krn audit repo [--repo <path>] [--json]"
      };
    }

    return {
      command: {
        kind: "audit",
        scope,
        ...(repo === undefined ? {} : { repo }),
        format
      }
    };
  }

  if (since === undefined || since.length === 0) {
    return {
      error: "Usage: krn audit slice --since <ref> [--repo <path>] [--json]"
    };
  }

  return {
    command: {
      kind: "audit",
      scope,
      ...(repo === undefined ? {} : { repo }),
      since,
      format,
      intendedFiles,
      verificationCommands,
      ...(projectId === undefined ? {} : { projectId }),
      ...(retrievalRunId === undefined ? {} : { retrievalRunId }),
      ...(auditBundleId === undefined ? {} : { auditBundleId }),
      ...(failOn === undefined ? {} : { failOn })
    }
  };
};
