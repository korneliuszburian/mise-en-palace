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

export const metadataOrEmpty = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

export const stringListOrEmpty = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};
