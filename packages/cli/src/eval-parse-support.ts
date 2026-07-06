export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const stringValue = (
  value: unknown,
  label: string
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value;
};

export const stringArrayValue = (
  value: unknown,
  label: string
): readonly string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => stringValue(item, `${label}[${index}]`));
};

export const numberValue = (
  value: unknown,
  label: string
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

export const booleanValue = (
  value: unknown,
  label: string
): boolean => {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

export const recordArray = (
  value: unknown,
  label: string
): readonly Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${label}[${index}] must be an object`);
    }

    return item;
  });
};

export const tupleArray = (
  value: unknown,
  label: string,
  length: number
): readonly unknown[][] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => {
    if (!Array.isArray(item) || item.length !== length) {
      throw new Error(`${label}[${index}] must be a ${length}-item tuple`);
    }

    return item;
  });
};

export const assertUniqueIds = (
  ids: readonly string[],
  label: string
): void => {
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (duplicates.length > 0) {
    throw new Error(`${label} contains duplicate ids: ${Array.from(new Set(duplicates)).join(", ")}`);
  }
};
