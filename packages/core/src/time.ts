export type IsoTimestamp = string;

const isoTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export const parseTimestampMs = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const hasValidIsoDateTime = (match: RegExpExecArray): boolean => {
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second;
};

export const isIsoTimestamp = (value: string | undefined): value is IsoTimestamp => {
  if (value === undefined || parseTimestampMs(value) === undefined) {
    return false;
  }

  const match = isoTimestampPattern.exec(value);

  return match !== null && hasValidIsoDateTime(match);
};

export interface TemporalWindowInput {
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
}

export type TemporalWindowHistoricalReason =
  | "before_valid_from"
  | "valid_until_elapsed"
  | "invalidated";

export type TemporalWindowInvalidReason =
  | "invalid_now"
  | "invalid_valid_from"
  | "invalid_valid_until"
  | "invalid_invalidated_at";

export type TemporalWindowAssessment =
  | {
      readonly status: "current";
    }
  | {
      readonly status: "historical";
      readonly reason: TemporalWindowHistoricalReason;
    }
  | {
      readonly status: "invalid";
      readonly reason: TemporalWindowInvalidReason;
    };

const parseTemporalTimestampMs = (value: string | undefined): number | undefined =>
  isIsoTimestamp(value) ? parseTimestampMs(value) : undefined;

export const assessTemporalWindow = (
  input: TemporalWindowInput,
  now: string
): TemporalWindowAssessment => {
  const nowAt = parseTemporalTimestampMs(now);

  if (nowAt === undefined) {
    return {
      status: "invalid",
      reason: "invalid_now"
    };
  }

  const validFromAt = parseTemporalTimestampMs(input.validFrom);
  if (input.validFrom !== undefined && validFromAt === undefined) {
    return {
      status: "invalid",
      reason: "invalid_valid_from"
    };
  }

  const validUntilAt = parseTemporalTimestampMs(input.validUntil);
  if (input.validUntil !== undefined && validUntilAt === undefined) {
    return {
      status: "invalid",
      reason: "invalid_valid_until"
    };
  }

  const invalidatedAt = parseTemporalTimestampMs(input.invalidatedAt);
  if (input.invalidatedAt !== undefined && invalidatedAt === undefined) {
    return {
      status: "invalid",
      reason: "invalid_invalidated_at"
    };
  }

  if (validFromAt !== undefined && validFromAt > nowAt) {
    return {
      status: "historical",
      reason: "before_valid_from"
    };
  }

  if (invalidatedAt !== undefined && invalidatedAt <= nowAt) {
    return {
      status: "historical",
      reason: "invalidated"
    };
  }

  if (validUntilAt !== undefined && validUntilAt <= nowAt) {
    return {
      status: "historical",
      reason: "valid_until_elapsed"
    };
  }

  return {
    status: "current"
  };
};

export interface ValidityWindow {
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  invalidationReason?: string;
}
