import type { IsoTimestamp } from "../time.js";

export interface ObservationTemporalScope {
  observedAt: IsoTimestamp;
  eventTime?: IsoTimestamp;
  ingestedAt: IsoTimestamp;
  referenceTime?: IsoTimestamp;
  validFrom?: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  supersededAt?: IsoTimestamp;
}
