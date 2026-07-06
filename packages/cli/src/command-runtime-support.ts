export interface BaseCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
}

export const postgresPersistedLabel = "enabled (Postgres, explicit --persist)";

export const noStorePreviewLabel = "disabled (no-store preview; use --persist to write)";

export const previewOnlyPersistenceLabel = (writeTarget: string): string =>
  `disabled (preview only; use --persist to ${writeTarget})`;

export const persistenceLine = (label: string): string => `Persistence: ${label}`;

export const writePersistenceLabel = (
  persist: boolean,
  disabledLabel = noStorePreviewLabel
): string => persist ? postgresPersistedLabel : disabledLabel;
