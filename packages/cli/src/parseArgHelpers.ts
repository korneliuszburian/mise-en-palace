export interface OptionValueResult {
  value?: string;
  nextIndex: number;
  error?: string;
}

export interface MetadataEntryResult {
  key?: string;
  value?: string;
  error?: string;
}

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
