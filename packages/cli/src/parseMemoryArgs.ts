import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";
import {
  metadataEntry,
  optionValue
} from "./parseArgHelpers.js";

export const formatMemoryCandidateAddUsage = (): string =>
  [
    "Usage: krn memory candidate add --run-id <id>|--feedback-delta-id <id> --kind <kind> --content \"...\" --confidence <low|medium|high|0-100> --application-guidance \"...\" [--source-claim-id <id>|--source-lineage <id>] [--persist]",
    "",
    "Required:",
    "--run-id or --feedback-delta-id",
    "--kind",
    "--content",
    "--confidence",
    "--application-guidance",
    "--source-claim-id or --source-lineage",
    "--invalidation-rule",
    "",
    "Optional:",
    "--owner <owner>",
    "--proposed-by <name>",
    "--candidate-evidence-provenance <provenance>",
    "--candidate-evidence-ref <ref> (repeatable; required before reviewed promotion)",
    "--candidate-evidence-does-not-prove <text>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryCandidatePromoteUsage = (): string =>
  [
    "Usage: krn memory candidate promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--untrusted-source-review-ref <ref>] [--persist]",
    "",
    "Required:",
    "--candidate-id",
    "--reviewer",
    "--decision accepted",
    "--evidence-reviewed-ref",
    "",
    "Optional:",
    "--untrusted-source-review-ref <ref> (required by the review gate for non-trusted source lineage)",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryCandidateRejectUsage = (): string =>
  [
    "Usage: krn memory candidate reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
    "",
    "Required:",
    "--candidate-id",
    "--reviewer",
    "--reason",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryRecordApplyUsage = (): string =>
  [
    "Usage: krn memory record apply --run-id <id> --memory-id <id> --outcome <helped|hurt|neutral|stale> --notes \"...\" [--persist]",
    "",
    "Required:",
    "--run-id",
    "--memory-id",
    "--outcome",
    "--notes",
    "",
    "Optional:",
    "--expected-use <text>",
    "--task-contract-id <id>",
    "--context-assembly-id <id>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryAntiAddUsage = (): string =>
  [
    "Usage: krn memory anti add --run-id <id> --rejected-claim \"...\" --reason \"...\" [--invalidated-by-source-claim-id <id>|--source-lineage <id>] [--persist]",
    "",
    "Required:",
    "--run-id",
    "--rejected-claim",
    "--reason",
    "--invalidated-by-source-claim-id or --source-lineage",
    "",
    "Optional:",
    "--applies-to <text>",
    "--may-revisit-when <text>",
    "--owner <owner>",
    "--proposed-by <name>",
    "--confidence <low|medium|high|0-100>",
    "--key <key>",
    "--candidate-evidence-provenance <provenance>",
    "--candidate-evidence-ref <ref> (repeatable; required before reviewed promotion)",
    "--candidate-evidence-does-not-prove <text>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryAntiPromoteUsage = (): string =>
  [
    "Usage: krn memory anti promote --candidate-id <id> --reviewer <name> --decision accepted --evidence-reviewed-ref <ref> [--persist]",
    "",
    "Required:",
    "--candidate-id",
    "--reviewer",
    "--decision accepted",
    "--evidence-reviewed-ref",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryAntiRejectUsage = (): string =>
  [
    "Usage: krn memory anti reject --candidate-id <id> --reviewer <name> --reason \"...\" [--persist]",
    "",
    "Required:",
    "--candidate-id",
    "--reviewer",
    "--reason",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatMemoryUsage = (): string =>
  [
    formatMemoryCandidateAddUsage().trim(),
    formatMemoryCandidatePromoteUsage().trim(),
    formatMemoryCandidateRejectUsage().trim(),
    formatMemoryRecordApplyUsage().trim(),
    formatMemoryAntiAddUsage().trim(),
    formatMemoryAntiPromoteUsage().trim(),
    formatMemoryAntiRejectUsage().trim()
  ].join("\n\n");

const parseMetadataOption = (
  rest: readonly string[],
  index: number,
  fallbackUsage: string
): {
  entry?: {
    key: string;
    value: string;
  };
  error?: string;
  nextIndex: number;
} => {
  const valueResult = optionValue(rest, index, "--metadata");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? fallbackUsage,
      nextIndex: index
    };
  }

  const entry = metadataEntry(valueResult.value);

  if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
    return {
      error: entry.error ?? fallbackUsage,
      nextIndex: valueResult.nextIndex
    };
  }

  return {
    entry: {
      key: entry.key,
      value: entry.value
    },
    nextIndex: valueResult.nextIndex
  };
};

const parseMemoryCandidateAddArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryCandidateAddHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryCandidateAdd" }> = {
    kind: "memoryCandidateAdd",
    persist: false,
    sourceLineageIds: [],
    candidateEvidenceRefs: [],
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryCandidateAddHelp"
        }
      };
    }

    const optionMap = {
      "--run-id": "runId",
      "--feedback-delta-id": "feedbackDeltaId",
      "--kind": "memoryKind",
      "--content": "content",
      "--confidence": "confidence",
      "--application-guidance": "applicationGuidance",
      "--source-claim-id": "sourceClaimId",
      "--invalidation-rule": "invalidationRule",
      "--candidate-evidence-provenance": "candidateEvidenceProvenance",
      "--candidate-evidence-does-not-prove": "candidateEvidenceDoesNotProve",
      "--owner": "owner",
      "--proposed-by": "proposedBy"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryCandidateAddUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (
      arg === "--candidate-evidence-ref" ||
      arg?.startsWith("--candidate-evidence-ref=") === true
    ) {
      const valueResult = optionValue(rest, index, "--candidate-evidence-ref");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryCandidateAddUsage()
        };
      }

      memoryCommand.candidateEvidenceRefs.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--source-lineage" || arg?.startsWith("--source-lineage=") === true) {
      const valueResult = optionValue(rest, index, "--source-lineage");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryCandidateAddUsage()
        };
      }

      memoryCommand.sourceLineageIds.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryCandidateAddUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryCandidateAddUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryCandidateAddUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryCandidatePromoteArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryCandidatePromoteHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryCandidatePromote" }> = {
    kind: "memoryCandidatePromote",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryCandidatePromoteHelp"
        }
      };
    }

    const optionMap = {
      "--candidate-id": "candidateId",
      "--reviewer": "reviewer",
      "--decision": "decision",
      "--evidence-reviewed-ref": "evidenceReviewedRef",
      "--untrusted-source-review-ref": "untrustedSourceReviewRef"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryCandidatePromoteUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryCandidatePromoteUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryCandidatePromoteUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryCandidatePromoteUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryCandidateRejectArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryCandidateRejectHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryCandidateReject" }> = {
    kind: "memoryCandidateReject",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryCandidateRejectHelp"
        }
      };
    }

    const optionMap = {
      "--candidate-id": "candidateId",
      "--reviewer": "reviewer",
      "--reason": "reason"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryCandidateRejectUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryCandidateRejectUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryCandidateRejectUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryCandidateRejectUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryRecordApplyArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryRecordApplyHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryRecordApply" }> = {
    kind: "memoryRecordApply",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryRecordApplyHelp"
        }
      };
    }

    const optionMap = {
      "--run-id": "runId",
      "--memory-id": "memoryId",
      "--outcome": "outcome",
      "--notes": "notes",
      "--expected-use": "expectedUse",
      "--task-contract-id": "taskContractId",
      "--context-assembly-id": "contextAssemblyId"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryRecordApplyUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryRecordApplyUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryRecordApplyUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryRecordApplyUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryAntiAddArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryAntiAddHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryAntiAdd" }> = {
    kind: "memoryAntiAdd",
    persist: false,
    sourceLineageIds: [],
    candidateEvidenceRefs: [],
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryAntiAddHelp"
        }
      };
    }

    const optionMap = {
      "--run-id": "runId",
      "--rejected-claim": "rejectedClaim",
      "--reason": "reason",
      "--invalidated-by-source-claim-id": "invalidatedBySourceClaimId",
      "--applies-to": "appliesTo",
      "--may-revisit-when": "mayRevisitWhen",
      "--owner": "owner",
      "--proposed-by": "proposedBy",
      "--confidence": "confidence",
      "--key": "key",
      "--candidate-evidence-provenance": "candidateEvidenceProvenance",
      "--candidate-evidence-does-not-prove": "candidateEvidenceDoesNotProve"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryAntiAddUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (
      arg === "--candidate-evidence-ref" ||
      arg?.startsWith("--candidate-evidence-ref=") === true
    ) {
      const valueResult = optionValue(rest, index, "--candidate-evidence-ref");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryAntiAddUsage()
        };
      }

      memoryCommand.candidateEvidenceRefs.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--source-lineage" || arg?.startsWith("--source-lineage=") === true) {
      const valueResult = optionValue(rest, index, "--source-lineage");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryAntiAddUsage()
        };
      }

      memoryCommand.sourceLineageIds.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryAntiAddUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryAntiAddUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryAntiAddUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryAntiPromoteArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryAntiPromoteHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryAntiPromote" }> = {
    kind: "memoryAntiPromote",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryAntiPromoteHelp"
        }
      };
    }

    const optionMap = {
      "--candidate-id": "candidateId",
      "--reviewer": "reviewer",
      "--decision": "decision",
      "--evidence-reviewed-ref": "evidenceReviewedRef"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryAntiPromoteUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryAntiPromoteUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryAntiPromoteUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryAntiPromoteUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryAntiRejectArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryAntiRejectHelp"
      }
    };
  }

  const memoryCommand: Extract<CliCommand, { kind: "memoryAntiReject" }> = {
    kind: "memoryAntiReject",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      memoryCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "memoryAntiRejectHelp"
        }
      };
    }

    const optionMap = {
      "--candidate-id": "candidateId",
      "--reviewer": "reviewer",
      "--reason": "reason"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatMemoryAntiRejectUsage()
        };
      }

      memoryCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatMemoryAntiRejectUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatMemoryAntiRejectUsage()
        };
      }

      memoryCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatMemoryAntiRejectUsage()
    };
  }

  return {
    command: memoryCommand
  };
};

export const parseMemoryArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] === "candidate" && rest[1] === "add") {
    return parseMemoryCandidateAddArgs(rest);
  }

  if (rest[0] === "candidate" && rest[1] === "promote") {
    return parseMemoryCandidatePromoteArgs(rest);
  }

  if (rest[0] === "candidate" && rest[1] === "reject") {
    return parseMemoryCandidateRejectArgs(rest);
  }

  if (rest[0] === "record" && rest[1] === "apply") {
    return parseMemoryRecordApplyArgs(rest);
  }

  if (rest[0] === "anti" && rest[1] === "add") {
    return parseMemoryAntiAddArgs(rest);
  }

  if (rest[0] === "anti" && rest[1] === "promote") {
    return parseMemoryAntiPromoteArgs(rest);
  }

  if (rest[0] === "anti" && rest[1] === "reject") {
    return parseMemoryAntiRejectArgs(rest);
  }

  return {
    error: formatMemoryUsage()
  };
};
