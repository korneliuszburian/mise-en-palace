import type {
  CliCommand,
  ParseArgsResult
} from "./parse-args.js";
import {
  type CliTokenParseResult,
  type PersistedMetadataCommand,
  type PersistedMetadataTokenConfig,
  mapStringOptionAssignment,
  optionMatches,
  optionValue,
  parsePersistedMetadataToken
} from "./parse-cli-options.js";

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

export const formatMemoryPatternSeedUsage = (): string =>
  [
    "Usage: krn memory pattern seed --file <catalog.json> [--persist] [--dry-run]",
    "",
    "Seeds retained patterns from a corpus catalog JSON into store-backed memory_records",
    "(kind=pattern) so the brain reads patterns from the DB instead of JSON files.",
    "Idempotent: re-runs skip patterns already seeded (matched by metadata.patternId).",
    "--dry-run lists patterns without writing; --persist writes to the DB."
  ].join("\n") + "\n";

const formatMemoryUsage = (): string =>
  [
    formatMemoryCandidateAddUsage().trim(),
    formatMemoryCandidatePromoteUsage().trim(),
    formatMemoryCandidateRejectUsage().trim(),
    formatMemoryRecordApplyUsage().trim(),
    formatMemoryPatternSeedUsage().trim(),
    formatMemoryAntiAddUsage().trim(),
    formatMemoryAntiPromoteUsage().trim(),
    formatMemoryAntiRejectUsage().trim()
  ].join("\n\n");

type MemoryTokenParseResult = CliTokenParseResult;

type MemoryCandidateAddCommand = Extract<CliCommand, { kind: "memoryCandidateAdd" }>;
type MemoryAntiAddCommand = Extract<CliCommand, { kind: "memoryAntiAdd" }>;
type MemoryCandidatePromoteCommand = Extract<CliCommand, { kind: "memoryCandidatePromote" }>;
type MemoryCandidateRejectCommand = Extract<CliCommand, { kind: "memoryCandidateReject" }>;
type MemoryRecordApplyCommand = Extract<CliCommand, { kind: "memoryRecordApply" }>;
type MemoryPatternSeedCommand = Extract<CliCommand, { kind: "memoryPatternSeed" }>;
type MemoryAntiPromoteCommand = Extract<CliCommand, { kind: "memoryAntiPromote" }>;
type MemoryAntiRejectCommand = Extract<CliCommand, { kind: "memoryAntiReject" }>;
type MemoryRejectCommand = MemoryCandidateRejectCommand | MemoryAntiRejectCommand;

type MemoryDraftCommand = PersistedMetadataCommand & {
  sourceLineageIds: string[];
  candidateEvidenceRefs: string[];
};

interface MemoryDraftTokenConfig<TOption extends string, TKey extends string>
  extends PersistedMetadataTokenConfig<TOption, TKey> {
}

const memoryCandidateAddStringOptions = {
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

const memoryAntiAddStringOptions = {
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

const memoryCandidatePromoteStringOptions = {
  "--candidate-id": "candidateId",
  "--reviewer": "reviewer",
  "--decision": "decision",
  "--evidence-reviewed-ref": "evidenceReviewedRef",
  "--untrusted-source-review-ref": "untrustedSourceReviewRef"
} as const;

const memoryRejectStringOptions = {
  "--candidate-id": "candidateId",
  "--reviewer": "reviewer",
  "--reason": "reason"
} as const;

const memoryRecordApplyStringOptions = {
  "--run-id": "runId",
  "--memory-id": "memoryId",
  "--outcome": "outcome",
  "--notes": "notes",
  "--expected-use": "expectedUse",
  "--task-contract-id": "taskContractId",
  "--context-assembly-id": "contextAssemblyId"
} as const;

const memoryAntiPromoteStringOptions = {
  "--candidate-id": "candidateId",
  "--reviewer": "reviewer",
  "--decision": "decision",
  "--evidence-reviewed-ref": "evidenceReviewedRef"
} as const;

type MemoryCandidateAddStringKey = typeof memoryCandidateAddStringOptions[keyof typeof memoryCandidateAddStringOptions];
type MemoryAntiAddStringKey = typeof memoryAntiAddStringOptions[keyof typeof memoryAntiAddStringOptions];
type MemoryCandidatePromoteStringKey = typeof memoryCandidatePromoteStringOptions[keyof typeof memoryCandidatePromoteStringOptions];
type MemoryRejectStringKey = typeof memoryRejectStringOptions[keyof typeof memoryRejectStringOptions];
type MemoryRecordApplyStringKey = typeof memoryRecordApplyStringOptions[keyof typeof memoryRecordApplyStringOptions];
type MemoryAntiPromoteStringKey = typeof memoryAntiPromoteStringOptions[keyof typeof memoryAntiPromoteStringOptions];

const memoryNext = (nextIndex: number): MemoryTokenParseResult => ({
  kind: "next",
  nextIndex
});

const memoryError = (error: string): MemoryTokenParseResult => ({
  kind: "error",
  error
});

const parseRepeatedDraftOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  command: MemoryDraftCommand,
  fallbackUsage: string
): MemoryTokenParseResult | undefined => {
  const target =
    optionMatches(arg, "--candidate-evidence-ref")
      ? command.candidateEvidenceRefs
      : optionMatches(arg, "--source-lineage")
        ? command.sourceLineageIds
        : undefined;

  if (target === undefined) {
    return undefined;
  }

  const option = optionMatches(arg, "--candidate-evidence-ref")
    ? "--candidate-evidence-ref"
    : "--source-lineage";
  const valueResult = optionValue(rest, index, option);

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return memoryError(valueResult.error ?? fallbackUsage);
  }

  target.push(valueResult.value.trim());

  return memoryNext(valueResult.nextIndex);
};

const parseDraftToken = <TOption extends string, TKey extends string>(
  rest: readonly string[],
  index: number,
  command: MemoryDraftCommand,
  config: MemoryDraftTokenConfig<TOption, TKey>
): MemoryTokenParseResult => {
  const arg = rest[index];

  if (arg === undefined) {
    return memoryError(config.fallbackUsage);
  }

  const repeated = parseRepeatedDraftOption(rest, index, arg, command, config.fallbackUsage);

  return repeated ?? parsePersistedMetadataToken(rest, index, command, config);
};

const parseMemoryCandidateAddToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryCandidateAddCommand
): MemoryTokenParseResult =>
  parseDraftToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryCandidateAddUsage(),
    optionMap: memoryCandidateAddStringOptions,
    assignOption: mapStringOptionAssignment<MemoryCandidateAddCommand, MemoryCandidateAddStringKey>({
      runId: (command, value) => {
        command.runId = value;
      },
      feedbackDeltaId: (command, value) => {
        command.feedbackDeltaId = value;
      },
      memoryKind: (command, value) => {
        command.memoryKind = value;
      },
      content: (command, value) => {
        command.content = value;
      },
      confidence: (command, value) => {
        command.confidence = value;
      },
      applicationGuidance: (command, value) => {
        command.applicationGuidance = value;
      },
      sourceClaimId: (command, value) => {
        command.sourceClaimId = value;
      },
      invalidationRule: (command, value) => {
        command.invalidationRule = value;
      },
      candidateEvidenceProvenance: (command, value) => {
        command.candidateEvidenceProvenance = value;
      },
      candidateEvidenceDoesNotProve: (command, value) => {
        command.candidateEvidenceDoesNotProve = value;
      },
      owner: (command, value) => {
        command.owner = value;
      },
      proposedBy: (command, value) => {
        command.proposedBy = value;
      }
    }, memoryCommand)
  });

const parseMemoryAntiAddToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryAntiAddCommand
): MemoryTokenParseResult =>
  parseDraftToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryAntiAddUsage(),
    optionMap: memoryAntiAddStringOptions,
    assignOption: mapStringOptionAssignment<MemoryAntiAddCommand, MemoryAntiAddStringKey>({
      runId: (command, value) => {
        command.runId = value;
      },
      rejectedClaim: (command, value) => {
        command.rejectedClaim = value;
      },
      reason: (command, value) => {
        command.reason = value;
      },
      invalidatedBySourceClaimId: (command, value) => {
        command.invalidatedBySourceClaimId = value;
      },
      appliesTo: (command, value) => {
        command.appliesTo = value;
      },
      mayRevisitWhen: (command, value) => {
        command.mayRevisitWhen = value;
      },
      owner: (command, value) => {
        command.owner = value;
      },
      proposedBy: (command, value) => {
        command.proposedBy = value;
      },
      confidence: (command, value) => {
        command.confidence = value;
      },
      key: (command, value) => {
        command.key = value;
      },
      candidateEvidenceProvenance: (command, value) => {
        command.candidateEvidenceProvenance = value;
      },
      candidateEvidenceDoesNotProve: (command, value) => {
        command.candidateEvidenceDoesNotProve = value;
      }
    }, memoryCommand)
  });

const parseMemoryCandidatePromoteToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryCandidatePromoteCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryCandidatePromoteUsage(),
    optionMap: memoryCandidatePromoteStringOptions,
    assignOption: mapStringOptionAssignment<MemoryCandidatePromoteCommand, MemoryCandidatePromoteStringKey>({
      candidateId: (command, value) => {
        command.candidateId = value;
      },
      reviewer: (command, value) => {
        command.reviewer = value;
      },
      decision: (command, value) => {
        command.decision = value;
      },
      evidenceReviewedRef: (command, value) => {
        command.evidenceReviewedRef = value;
      },
      untrustedSourceReviewRef: (command, value) => {
        command.untrustedSourceReviewRef = value;
      }
    }, memoryCommand)
  });

const parseMemoryRejectToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryRejectCommand,
  fallbackUsage: string
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage,
    optionMap: memoryRejectStringOptions,
    assignOption: mapStringOptionAssignment<MemoryRejectCommand, MemoryRejectStringKey>({
      candidateId: (command, value) => {
        command.candidateId = value;
      },
      reviewer: (command, value) => {
        command.reviewer = value;
      },
      reason: (command, value) => {
        command.reason = value;
      }
    }, memoryCommand)
  });

const parseMemoryCandidateRejectToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryCandidateRejectCommand
): MemoryTokenParseResult =>
  parseMemoryRejectToken(rest, index, memoryCommand, formatMemoryCandidateRejectUsage());

const parseMemoryRecordApplyToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryRecordApplyCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryRecordApplyUsage(),
    optionMap: memoryRecordApplyStringOptions,
    assignOption: mapStringOptionAssignment<MemoryRecordApplyCommand, MemoryRecordApplyStringKey>({
      runId: (command, value) => {
        command.runId = value;
      },
      memoryId: (command, value) => {
        command.memoryId = value;
      },
      outcome: (command, value) => {
        command.outcome = value;
      },
      notes: (command, value) => {
        command.notes = value;
      },
      expectedUse: (command, value) => {
        command.expectedUse = value;
      },
      taskContractId: (command, value) => {
        command.taskContractId = value;
      },
      contextAssemblyId: (command, value) => {
        command.contextAssemblyId = value;
      }
    }, memoryCommand)
  });

const parseMemoryAntiPromoteToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryAntiPromoteCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryAntiPromoteUsage(),
    optionMap: memoryAntiPromoteStringOptions,
    assignOption: mapStringOptionAssignment<MemoryAntiPromoteCommand, MemoryAntiPromoteStringKey>({
      candidateId: (command, value) => {
        command.candidateId = value;
      },
      reviewer: (command, value) => {
        command.reviewer = value;
      },
      decision: (command, value) => {
        command.decision = value;
      },
      evidenceReviewedRef: (command, value) => {
        command.evidenceReviewedRef = value;
      }
    }, memoryCommand)
  });

const parseMemoryAntiRejectToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryAntiRejectCommand
): MemoryTokenParseResult =>
  parseMemoryRejectToken(rest, index, memoryCommand, formatMemoryAntiRejectUsage());

const parseMemoryPatternSeedToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryPatternSeedCommand
): MemoryTokenParseResult => {
  const token = rest[index];

  if (token === "--persist") {
    memoryCommand.persist = true;

    return memoryNext(index);
  }

  if (token === "--dry-run") {
    memoryCommand.dryRun = true;

    return memoryNext(index);
  }

  if (token === "--file") {
    const value = optionValue(rest, index, "--file");

    if (value.error !== undefined || value.value === undefined) {
      return memoryError(value.error ?? "krn memory pattern seed --file requires a catalog.json path");
    }

    memoryCommand.catalogFile = value.value;

    return memoryNext(value.nextIndex);
  }

  return memoryError(`Unknown krn memory pattern seed option: ${token ?? ""}`);
};

const parseMemoryTokenLoop = (
  rest: readonly string[],
  parseToken: (index: number) => MemoryTokenParseResult,
  helpCommand: CliCommand
): ParseArgsResult | undefined => {
  for (let index = 2; index < rest.length; index += 1) {
    const parsed = parseToken(index);

    if (parsed.kind === "help") {
      return {
        command: helpCommand
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return undefined;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryCandidateAddToken(rest, index, memoryCommand),
    {
      kind: "memoryCandidateAddHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryCandidatePromoteToken(rest, index, memoryCommand),
    {
      kind: "memoryCandidatePromoteHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryCandidateRejectToken(rest, index, memoryCommand),
    {
      kind: "memoryCandidateRejectHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryRecordApplyToken(rest, index, memoryCommand),
    {
      kind: "memoryRecordApplyHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryAntiAddToken(rest, index, memoryCommand),
    {
      kind: "memoryAntiAddHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryAntiPromoteToken(rest, index, memoryCommand),
    {
      kind: "memoryAntiPromoteHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
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

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryAntiRejectToken(rest, index, memoryCommand),
    {
      kind: "memoryAntiRejectHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
  }

  return {
    command: memoryCommand
  };
};

const parseMemoryPatternSeedArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "memoryPatternSeedHelp"
      }
    };
  }

  const memoryCommand: MemoryPatternSeedCommand = {
    kind: "memoryPatternSeed",
    persist: false,
    dryRun: false,
    catalogFile: ""
  };

  const parsed = parseMemoryTokenLoop(
    rest,
    (index) => parseMemoryPatternSeedToken(rest, index, memoryCommand),
    {
      kind: "memoryPatternSeedHelp"
    }
  );

  if (parsed !== undefined) {
    return parsed;
  }

  if (memoryCommand.catalogFile.length === 0) {
    return {
      error: "krn memory pattern seed requires --file <catalog.json>"
    };
  }

  return {
    command: memoryCommand
  };
};

const memorySubcommandParsers = new Map<string, (rest: readonly string[]) => ParseArgsResult>([
  ["anti add", parseMemoryAntiAddArgs],
  ["anti promote", parseMemoryAntiPromoteArgs],
  ["anti reject", parseMemoryAntiRejectArgs],
  ["candidate add", parseMemoryCandidateAddArgs],
  ["candidate promote", parseMemoryCandidatePromoteArgs],
  ["candidate reject", parseMemoryCandidateRejectArgs],
  ["pattern seed", parseMemoryPatternSeedArgs],
  ["record apply", parseMemoryRecordApplyArgs]
]);

export const parseMemoryArgs = (rest: readonly string[]): ParseArgsResult => {
  const parser = memorySubcommandParsers.get(`${rest[0] ?? ""} ${rest[1] ?? ""}`);

  if (parser !== undefined) {
    return parser(rest);
  }

  return {
    error: formatMemoryUsage()
  };
};
