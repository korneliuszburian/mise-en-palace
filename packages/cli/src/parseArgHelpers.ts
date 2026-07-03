export interface OptionValueResult {
  value?: string;
  nextIndex: number;
  error?: string;
}

export type ParsedOptionValue =
  | {
      ok: true;
      value: string;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

export interface MetadataEntryResult {
  key?: string;
  value?: string;
  error?: string;
}

export type CliOptionParseResult =
  | {
      matched: true;
      nextIndex: number;
    }
  | {
      matched: false;
    }
  | {
      error: string;
    };

export type CliTokenParseResult =
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

export type MappedStringOptionParseResult<TKey extends string> =
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

export type MetadataCommand = {
  metadata: Record<string, string>;
};

export type PersistedMetadataCommand = MetadataCommand & {
  persist: boolean;
};

export interface PersistedMetadataTokenConfig<TOption extends string, TKey extends string> {
  fallbackUsage: string;
  optionMap: Record<TOption, TKey>;
  assignOption: (key: TKey, value: string) => void;
}

export const optionMatches = (arg: string, option: string): boolean =>
  arg === option || arg.startsWith(`${option}=`);

export const optionValue = (
  args: readonly string[],
  index: number,
  option: string
): OptionValueResult => {
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

export const parsedOptionValue = (
  args: readonly string[],
  index: number,
  option: string,
  fallbackError: string
): ParsedOptionValue => {
  const result = optionValue(args, index, option);

  if (result.error !== undefined || result.value === undefined) {
    return {
      ok: false,
      error: result.error ?? fallbackError
    };
  }

  return {
    ok: true,
    value: result.value.trim(),
    nextIndex: result.nextIndex
  };
};

export const metadataEntry = (
  value: string
): MetadataEntryResult => {
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

const cliNext = (nextIndex: number): CliTokenParseResult => ({
  kind: "next",
  nextIndex
});

const cliHelp = (): CliTokenParseResult => ({
  kind: "help"
});

const cliError = (error: string): CliTokenParseResult => ({
  kind: "error",
  error
});

const findMappedStringOption = <TOption extends string, TKey extends string>(
  arg: string,
  optionMap: Record<TOption, TKey>
): TOption | undefined =>
  (Object.keys(optionMap) as TOption[]).find((option) => optionMatches(arg, option));

export const parseMappedStringOption = <TOption extends string, TKey extends string>(
  rest: readonly string[],
  index: number,
  arg: string,
  optionMap: Record<TOption, TKey>,
  fallbackUsage: string
): MappedStringOptionParseResult<TKey> => {
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

export const mapStringOptionAssignment = <
  TCommand,
  TKey extends string
>(
  assigners: Record<TKey, (command: TCommand, value: string) => void>,
  command: TCommand
) =>
  (key: TKey, value: string): void => {
    assigners[key](command, value);
  };

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

const applyMetadataOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  command: MetadataCommand,
  fallbackUsage: string
): CliOptionParseResult => {
  if (!optionMatches(arg, "--metadata")) {
    return {
      matched: false
    };
  }

  const metadata = parseMetadataOption(rest, index, fallbackUsage);

  if (metadata.error !== undefined || metadata.entry === undefined) {
    return {
      error: metadata.error ?? fallbackUsage
    };
  }

  command.metadata[metadata.entry.key] = metadata.entry.value;

  return {
    matched: true,
    nextIndex: metadata.nextIndex
  };
};

export const parsePersistedMetadataToken = <TOption extends string, TKey extends string>(
  rest: readonly string[],
  index: number,
  command: PersistedMetadataCommand,
  config: PersistedMetadataTokenConfig<TOption, TKey>
): CliTokenParseResult => {
  const arg = rest[index];

  if (arg === undefined) {
    return cliError(config.fallbackUsage);
  }

  if (arg === "--help" || arg === "-h") {
    return cliHelp();
  }

  if (arg === "--persist") {
    command.persist = true;

    return cliNext(index);
  }

  const option = parseMappedStringOption(rest, index, arg, config.optionMap, config.fallbackUsage);

  if ("error" in option) {
    return cliError(option.error);
  }

  if (option.matched) {
    config.assignOption(option.key, option.value);

    return cliNext(option.nextIndex);
  }

  const metadata = applyMetadataOption(rest, index, arg, command, config.fallbackUsage);

  if ("error" in metadata) {
    return cliError(metadata.error);
  }

  return metadata.matched ? cliNext(metadata.nextIndex) : cliError(config.fallbackUsage);
};
