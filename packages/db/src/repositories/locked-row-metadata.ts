import type { IsoTimestamp } from "@krn/core";

import { toIsoTimestamp } from "./repository-value-readers.js";

export interface LockedRowMetadataInput {
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LockedRowMetadataFields {
  lockedAt?: IsoTimestamp;
  lockedBy?: string;
  lastError?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export const mapLockedRowMetadataFields = (
  row: LockedRowMetadataInput
): LockedRowMetadataFields => ({
  ...(row.lockedAt === null ? {} : { lockedAt: toIsoTimestamp(row.lockedAt) }),
  ...(row.lockedBy === null ? {} : { lockedBy: row.lockedBy }),
  ...(row.lastError === null ? {} : { lastError: row.lastError }),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});
