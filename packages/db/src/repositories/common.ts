import type { IsoTimestamp } from "@krn/core";

export const requireReturnedRow = <T>(rows: T[], operation: string): T => {
  const row = rows[0];

  if (row === undefined) {
    throw new Error(`${operation} did not return a row`);
  }

  return row;
};

export const toIsoTimestamp = (value: Date): IsoTimestamp => value.toISOString();

export const fromIsoTimestamp = (value: IsoTimestamp): Date => new Date(value);

export const optionalIsoTimestamp = (value: Date | null): IsoTimestamp | undefined =>
  value === null ? undefined : toIsoTimestamp(value);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const metadataOrEmpty = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {};
  }

  return value;
};

export const stringListOrEmpty = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

export const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export const numberOrUndefined = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const booleanOrUndefined = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

type DefinedValues<T extends Record<string, unknown>> = {
  [K in keyof T]: Exclude<T[K], undefined>;
};

export const hasDefinedValues = <T extends Record<string, unknown>>(
  value: T
): value is DefinedValues<T> =>
  Object.values(value).every((item) => item !== undefined);
