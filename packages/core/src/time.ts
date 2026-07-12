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

export interface ValidityWindow {
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  invalidationReason?: string;
}
