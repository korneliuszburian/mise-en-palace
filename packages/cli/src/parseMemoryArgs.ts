import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";
import {
  metadataEntry,
  optionMatches,
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

const formatMemoryUsage = (): string =>
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

type MemoryTokenParseResult =
  | {
      kind: "next";
      nextIndex: number;
    }
  | {
      kind: "help";
    }
  | {
      kind: "error";
      error: string;
    };

type MemoryStringOptionParseResult<TKey extends string> =
  | {
      matched: true;
      key: TKey;
      value: string;
      nextIndex: number;
    }
  | {
      matched: false;
    }
  | {
      error: string;
    };

type MemoryMetadataCommand = {
  metadata: Record<string, string>;
};

type MemoryPersistedMetadataCommand = MemoryMetadataCommand & {
  persist: boolean;
};

type MemoryCandidateAddCommand = Extract<CliCommand, { kind: "memoryCandidateAdd" }>;
type MemoryAntiAddCommand = Extract<CliCommand, { kind: "memoryAntiAdd" }>;
type MemoryCandidatePromoteCommand = Extract<CliCommand, { kind: "memoryCandidatePromote" }>;
type MemoryCandidateRejectCommand = Extract<CliCommand, { kind: "memoryCandidateReject" }>;
type MemoryRecordApplyCommand = Extract<CliCommand, { kind: "memoryRecordApply" }>;
type MemoryAntiPromoteCommand = Extract<CliCommand, { kind: "memoryAntiPromote" }>;
type MemoryAntiRejectCommand = Extract<CliCommand, { kind: "memoryAntiReject" }>;

type MemoryDraftCommand = MemoryPersistedMetadataCommand & {
  sourceLineageIds: string[];
  candidateEvidenceRefs: string[];
};

interface MemoryPersistedMetadataTokenConfig<TOption extends string, TKey extends string> {
  fallbackUsage: string;
  optionMap: Record<TOption, TKey>;
  assignOption: (key: TKey, value: string) => void;
}

interface MemoryDraftTokenConfig<TOption extends string, TKey extends string>
  extends MemoryPersistedMetadataTokenConfig<TOption, TKey> {
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

const memoryCandidateRejectStringOptions = {
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

const memoryAntiRejectStringOptions = {
  "--candidate-id": "candidateId",
  "--reviewer": "reviewer",
  "--reason": "reason"
} as const;

type MemoryCandidateAddStringKey = typeof memoryCandidateAddStringOptions[keyof typeof memoryCandidateAddStringOptions];
type MemoryAntiAddStringKey = typeof memoryAntiAddStringOptions[keyof typeof memoryAntiAddStringOptions];
type MemoryCandidatePromoteStringKey = typeof memoryCandidatePromoteStringOptions[keyof typeof memoryCandidatePromoteStringOptions];
type MemoryCandidateRejectStringKey = typeof memoryCandidateRejectStringOptions[keyof typeof memoryCandidateRejectStringOptions];
type MemoryRecordApplyStringKey = typeof memoryRecordApplyStringOptions[keyof typeof memoryRecordApplyStringOptions];
type MemoryAntiPromoteStringKey = typeof memoryAntiPromoteStringOptions[keyof typeof memoryAntiPromoteStringOptions];
type MemoryAntiRejectStringKey = typeof memoryAntiRejectStringOptions[keyof typeof memoryAntiRejectStringOptions];

const memoryNext = (nextIndex: number): MemoryTokenParseResult => ({
  kind: "next",
  nextIndex
});

const memoryHelp = (): MemoryTokenParseResult => ({
  kind: "help"
});

const memoryError = (error: string): MemoryTokenParseResult => ({
  kind: "error",
  error
});

const findMappedStringOption = <TOption extends string, TKey extends string>(
  arg: string,
  optionMap: Record<TOption, TKey>
): TOption | undefined =>
  (Object.keys(optionMap) as TOption[]).find((option) => optionMatches(arg, option));

const parseMappedStringOption = <TOption extends string, TKey extends string>(
  rest: readonly string[],
  index: number,
  arg: string,
  optionMap: Record<TOption, TKey>,
  fallbackUsage: string
): MemoryStringOptionParseResult<TKey> => {
  const option = findMappedStringOption(arg, optionMap);

  if (option === undefined) {
    return {
      matched: false
    };
  }

  const valueResult = optionValue(rest, index, option);

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? fallbackUsage
    };
  }

  return {
    matched: true,
    key: optionMap[option],
    value: valueResult.value.trim(),
    nextIndex: valueResult.nextIndex
  };
};

const applyMetadataOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  command: MemoryMetadataCommand,
  fallbackUsage: string
): MemoryTokenParseResult | undefined => {
  if (!optionMatches(arg, "--metadata")) {
    return undefined;
  }

  const metadata = parseMetadataOption(rest, index, fallbackUsage);

  if (metadata.error !== undefined || metadata.entry === undefined) {
    return memoryError(metadata.error ?? fallbackUsage);
  }

  command.metadata[metadata.entry.key] = metadata.entry.value;

  return memoryNext(metadata.nextIndex);
};

const parsePersistedMetadataToken = <TOption extends string, TKey extends string>(
  rest: readonly string[],
  index: number,
  command: MemoryPersistedMetadataCommand,
  config: MemoryPersistedMetadataTokenConfig<TOption, TKey>
): MemoryTokenParseResult => {
  const arg = rest[index];

  if (arg === undefined) {
    return memoryError(config.fallbackUsage);
  }

  if (arg === "--help" || arg === "-h") {
    return memoryHelp();
  }

  if (arg === "--persist") {
    command.persist = true;

    return memoryNext(index);
  }

  const option = parseMappedStringOption(rest, index, arg, config.optionMap, config.fallbackUsage);

  if ("error" in option) {
    return memoryError(option.error);
  }

  if (option.matched) {
    config.assignOption(option.key, option.value);

    return memoryNext(option.nextIndex);
  }

  const metadata = applyMetadataOption(rest, index, arg, command, config.fallbackUsage);

  return metadata ?? memoryError(config.fallbackUsage);
};

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
    assignOption: (key, value) => {
      memoryCommand[key as MemoryCandidateAddStringKey] = value;
    }
  });

const parseMemoryAntiAddToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryAntiAddCommand
): MemoryTokenParseResult =>
  parseDraftToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryAntiAddUsage(),
    optionMap: memoryAntiAddStringOptions,
    assignOption: (key, value) => {
      memoryCommand[key as MemoryAntiAddStringKey] = value;
    }
  });

const parseMemoryCandidatePromoteToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryCandidatePromoteCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryCandidatePromoteUsage(),
    optionMap: memoryCandidatePromoteStringOptions,
    assignOption: (key, value) => {
      memoryCommand[key as MemoryCandidatePromoteStringKey] = value;
    }
  });

const parseMemoryCandidateRejectToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryCandidateRejectCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryCandidateRejectUsage(),
    optionMap: memoryCandidateRejectStringOptions,
    assignOption: (key, value) => {
      memoryCommand[key as MemoryCandidateRejectStringKey] = value;
    }
  });

const parseMemoryRecordApplyToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryRecordApplyCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryRecordApplyUsage(),
    optionMap: memoryRecordApplyStringOptions,
    assignOption: (key, value) => {
      memoryCommand[key as MemoryRecordApplyStringKey] = value;
    }
  });

const parseMemoryAntiPromoteToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryAntiPromoteCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryAntiPromoteUsage(),
    optionMap: memoryAntiPromoteStringOptions,
    assignOption: (key, value) => {
      memoryCommand[key as MemoryAntiPromoteStringKey] = value;
    }
  });

const parseMemoryAntiRejectToken = (
  rest: readonly string[],
  index: number,
  memoryCommand: MemoryAntiRejectCommand
): MemoryTokenParseResult =>
  parsePersistedMetadataToken(rest, index, memoryCommand, {
    fallbackUsage: formatMemoryAntiRejectUsage(),
    optionMap: memoryAntiRejectStringOptions,
    assignOption: (key, value) => {
      memoryCommand[key as MemoryAntiRejectStringKey] = value;
    }
  });

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
