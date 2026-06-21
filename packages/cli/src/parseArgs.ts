export type CliCommand =
  | {
      kind: "plan";
      task: string;
      persist: boolean;
    }
  | {
      kind: "doctor";
    }
  | {
      kind: "dbReadiness";
    }
  | {
      kind: "dbSmoke";
      target: "project" | "harnessPlan" | "harnessEvidence" | "sourceGraph";
    }
  | {
      kind: "evidenceCapture";
      persist: boolean;
      runId?: string;
    }
  | {
      kind: "sourceClaimAddHelp";
    }
  | {
      kind: "sourceClaimAdd";
      persist: boolean;
      title?: string;
      claim?: string;
      mechanism?: string;
      doesNotProve?: string;
      supportType?: string;
      trustTier?: string;
      consumer?: string;
      uri?: string;
      type?: string;
      runId?: string;
      falsifier?: string;
      revisitWhen?: string;
      krnImplication?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceDecisionLinkHelp";
    }
  | {
      kind: "sourceDecisionLink";
      persist: boolean;
      sourceClaimId?: string;
      targetType?: string;
      targetId?: string;
      supportType?: string;
      confidence?: string;
      notes?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "sourceClaimRejectHelp";
    }
  | {
      kind: "sourceClaimReject";
      persist: boolean;
      title?: string;
      attemptedClaim?: string;
      rejectedBecause?: string;
      reason?: string;
      doesNotProve?: string;
      consumer?: string;
      runId?: string;
      sourceArtifactId?: string;
      sourceClaimId?: string;
      metadata: Record<string, string>;
    }
  | {
      kind: "help";
    };

export interface ParseArgsResult {
  command?: CliCommand;
  error?: string;
}

const usage = [
  "Usage: krn plan --task \"...\" [--persist]",
  "",
  "Other commands:",
  "krn doctor",
  "krn db readiness",
  "krn db smoke [harness-plan|harness-evidence|source-graph]",
  "krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --support-type implementation-boundary --trust-tier project-decision --consumer \"...\" [--persist]",
  "krn source claim reject --title \"...\" --rejected-because decorative [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
  "krn source decision link --source-claim-id <id> --target-type harness_run --target-id <id> --support-type implementation-boundary --confidence medium --notes \"...\" [--persist]",
  "krn evidence capture [--run-id <id>] [--persist]"
].join("\n");

export const formatUsage = (): string => `${usage}\n`;

export const formatSourceClaimAddUsage = (): string =>
  [
    "Usage: krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" [--persist]",
    "",
    "Required:",
    "--title",
    "--claim",
    "--mechanism",
    "--does-not-prove",
    "--support-type",
    "--trust-tier",
    "--consumer",
    "",
    "Optional:",
    "--run-id <execution-run-id>",
    "--uri <uri>",
    "--type <artifact-kind-or-source-type>",
    "--krn-implication <text>",
    "--falsifier <text>",
    "--revisit-when <text>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatSourceDecisionLinkUsage = (): string =>
  [
    "Usage: krn source decision link --source-claim-id <id> --target-type <type> --target-id <id> --support-type <type> --confidence <low|medium|high> --notes \"...\" [--persist]",
    "",
    "Required:",
    "--source-claim-id",
    "--target-type",
    "--target-id",
    "--support-type",
    "--confidence",
    "--notes",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatSourceClaimRejectUsage = (): string =>
  [
    "Usage: krn source claim reject --title \"...\" --rejected-because <reason> [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
    "",
    "Required:",
    "--title",
    "--rejected-because",
    "--attempted-claim or --reason",
    "",
    "Optional:",
    "--does-not-prove <text>",
    "--consumer <text>",
    "--run-id <execution-run-id>",
    "--source-artifact-id <id>",
    "--source-claim-id <id>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

const optionValue = (
  args: readonly string[],
  index: number,
  option: string
): { value?: string; nextIndex: number; error?: string } => {
  const arg = args[index];
  const prefix = `${option}=`;

  if (arg?.startsWith(prefix) === true) {
    return {
      value: arg.slice(prefix.length),
      nextIndex: index
    };
  }

  const value = args[index + 1];

  if (value === undefined || value.startsWith("--")) {
    return {
      nextIndex: index,
      error: `${option} requires a value`
    };
  }

  return {
    value,
    nextIndex: index + 1
  };
};

const metadataEntry = (
  value: string
): { key?: string; value?: string; error?: string } => {
  const separatorIndex = value.indexOf("=");

  if (separatorIndex <= 0) {
    return {
      error: "--metadata requires key=value"
    };
  }

  const key = value.slice(0, separatorIndex).trim();
  const metadataValue = value.slice(separatorIndex + 1).trim();

  if (key.length === 0) {
    return {
      error: "--metadata requires key=value"
    };
  }

  return {
    key,
    value: metadataValue
  };
};

export const parseArgs = (args: readonly string[]): ParseArgsResult => {
  const [command, ...rest] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      command: {
        kind: "help"
      }
    };
  }

  if (command === "doctor") {
    if (rest.length > 0) {
      return {
        error: "Usage: krn doctor"
      };
    }

    return {
      command: {
        kind: "doctor"
      }
    };
  }

  if (command === "db") {
    if (rest.length === 1 && rest[0] === "readiness") {
      return {
        command: {
          kind: "dbReadiness"
        }
      };
    }

    if (rest.length === 1 && rest[0] === "smoke") {
      return {
        command: {
          kind: "dbSmoke",
          target: "project"
        }
      };
    }

    if (rest.length === 2 && rest[0] === "smoke" && rest[1] === "harness-plan") {
      return {
        command: {
          kind: "dbSmoke",
          target: "harnessPlan"
        }
      };
    }

    if (rest.length === 2 && rest[0] === "smoke" && rest[1] === "harness-evidence") {
      return {
        command: {
          kind: "dbSmoke",
          target: "harnessEvidence"
        }
      };
    }

    if (rest.length === 2 && rest[0] === "smoke" && rest[1] === "source-graph") {
      return {
        command: {
          kind: "dbSmoke",
          target: "sourceGraph"
        }
      };
    }

    return {
      error: "Usage: krn db readiness|smoke [harness-plan|harness-evidence|source-graph]"
    };
  }

  if (command === "evidence") {
    if (rest[0] === "capture") {
      let persist = false;
      let runId: string | undefined;

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

        return {
          error: "Usage: krn evidence capture [--run-id <id>] [--persist]"
        };
      }

      return {
        command: {
          kind: "evidenceCapture",
          persist,
          ...(runId === undefined ? {} : { runId: runId.trim() })
        }
      };
    }

    return {
      error: "Usage: krn evidence capture [--run-id <id>] [--persist]"
    };
  }

  if (command === "source") {
    if (rest[0] === "claim" && rest[1] === "add") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "sourceClaimAddHelp"
          }
        };
      }

      const sourceCommand: Extract<CliCommand, { kind: "sourceClaimAdd" }> = {
        kind: "sourceClaimAdd",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          sourceCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "sourceClaimAddHelp"
            }
          };
        }

        const optionMap = {
          "--title": "title",
          "--claim": "claim",
          "--mechanism": "mechanism",
          "--does-not-prove": "doesNotProve",
          "--support-type": "supportType",
          "--trust-tier": "trustTier",
          "--consumer": "consumer",
          "--uri": "uri",
          "--type": "type",
          "--run-id": "runId",
          "--falsifier": "falsifier",
          "--revisit-when": "revisitWhen",
          "--krn-implication": "krnImplication"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimAddUsage()
            };
          }

          sourceCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimAddUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatSourceClaimAddUsage()
            };
          }

          sourceCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatSourceClaimAddUsage()
        };
      }

      return {
        command: sourceCommand
      };
    }

    if (rest[0] === "claim" && rest[1] === "reject") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "sourceClaimRejectHelp"
          }
        };
      }

      const sourceCommand: Extract<CliCommand, { kind: "sourceClaimReject" }> = {
        kind: "sourceClaimReject",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          sourceCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "sourceClaimRejectHelp"
            }
          };
        }

        const optionMap = {
          "--title": "title",
          "--attempted-claim": "attemptedClaim",
          "--rejected-because": "rejectedBecause",
          "--reason": "reason",
          "--does-not-prove": "doesNotProve",
          "--consumer": "consumer",
          "--run-id": "runId",
          "--source-artifact-id": "sourceArtifactId",
          "--source-claim-id": "sourceClaimId"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimRejectUsage()
            };
          }

          sourceCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceClaimRejectUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatSourceClaimRejectUsage()
            };
          }

          sourceCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatSourceClaimRejectUsage()
        };
      }

      return {
        command: sourceCommand
      };
    }

    if (rest[0] === "decision" && rest[1] === "link") {
      if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
        return {
          command: {
            kind: "sourceDecisionLinkHelp"
          }
        };
      }

      const sourceCommand: Extract<CliCommand, { kind: "sourceDecisionLink" }> = {
        kind: "sourceDecisionLink",
        persist: false,
        metadata: {}
      };

      for (let index = 2; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          sourceCommand.persist = true;
          continue;
        }

        if (arg === "--help" || arg === "-h") {
          return {
            command: {
              kind: "sourceDecisionLinkHelp"
            }
          };
        }

        const optionMap = {
          "--source-claim-id": "sourceClaimId",
          "--target-type": "targetType",
          "--target-id": "targetId",
          "--support-type": "supportType",
          "--confidence": "confidence",
          "--notes": "notes"
        } as const;
        const option = Object.keys(optionMap).find((candidate) =>
          arg === candidate || arg?.startsWith(`${candidate}=`) === true
        );

        if (option !== undefined) {
          const valueResult = optionValue(rest, index, option);

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceDecisionLinkUsage()
            };
          }

          sourceCommand[optionMap[option as keyof typeof optionMap]] =
            valueResult.value.trim();
          index = valueResult.nextIndex;
          continue;
        }

        if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
          const valueResult = optionValue(rest, index, "--metadata");

          if (valueResult.error !== undefined || valueResult.value === undefined) {
            return {
              error: valueResult.error ?? formatSourceDecisionLinkUsage()
            };
          }

          const entry = metadataEntry(valueResult.value);

          if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
            return {
              error: entry.error ?? formatSourceDecisionLinkUsage()
            };
          }

          sourceCommand.metadata[entry.key] = entry.value;
          index = valueResult.nextIndex;
          continue;
        }

        return {
          error: formatSourceDecisionLinkUsage()
        };
      }

      return {
        command: sourceCommand
      };
    }

    return {
      error: formatSourceClaimAddUsage()
    };
  }

  if (command !== "plan") {
    return {
      error: "Usage: krn plan --task \"...\""
    };
  }

  let task: string | undefined;
  let persist = false;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--task") {
      task = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith("--task=") === true) {
      task = arg.slice("--task=".length);
      continue;
    }

    if (arg === "--persist") {
      persist = true;
      continue;
    }

    return {
      error: usage
    };
  }

  if (task === undefined || task.trim().length === 0) {
    return {
      error: usage
    };
  }

  return {
    command: {
      kind: "plan",
      task: task.trim(),
      persist
    }
  };
};
