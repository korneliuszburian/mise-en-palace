export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const readString = (
  value: Record<string, unknown>,
  key: string
): string | undefined => {
  const field = value[key];

  return typeof field === "string" ? field : undefined;
};

export const readStringArray = (
  value: Record<string, unknown>,
  key: string
): readonly string[] => {
  const field = value[key];

  return Array.isArray(field)
    ? field.filter((item): item is string => typeof item === "string")
    : [];
};

export const readRecordArray = (
  value: Record<string, unknown>,
  key: string
): readonly Record<string, unknown>[] => {
  const field = value[key];

  return Array.isArray(field)
    ? field.filter(isRecord)
    : [];
};

export const readRequiredRecord = (
  value: Record<string, unknown>,
  key: string,
  message = `JSON readback missed ${key}`
): Record<string, unknown> => {
  const field = value[key];

  if (!isRecord(field)) {
    throw new Error(message);
  }

  return field;
};

export const readRequiredString = (
  value: Record<string, unknown>,
  key: string,
  message = `JSON readback missed ${key}`
): string => {
  const field = readString(value, key);

  if (field === undefined || field.trim().length === 0) {
    throw new Error(message);
  }

  return field;
};

export const readRequiredStringArray = (
  value: Record<string, unknown>,
  key: string,
  message = `JSON readback missed ${key}`
): readonly string[] => {
  const field = value[key];

  if (!Array.isArray(field) || !field.every((item) => typeof item === "string")) {
    throw new Error(message);
  }

  return field;
};
