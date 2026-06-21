export type IsoTimestamp = string;

export interface ValidityWindow {
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  invalidationReason?: string;
}
