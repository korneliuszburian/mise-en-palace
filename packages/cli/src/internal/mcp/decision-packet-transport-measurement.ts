import {
  Buffer
} from "node:buffer";

export interface DecisionPacketTransportMeasurement {
  readonly utf8Bytes: number;
  readonly collectionCount: number;
  readonly totalCollectionElements: number;
  readonly collectionLength: {
    readonly minimum: number;
    readonly median: number;
    readonly p95: number;
    readonly maximum: number;
  };
  readonly maximumCollectionPath: string | null;
}

export const decisionPacketTransportBudget = {
  maximumMessageUtf8Bytes: 64 * 1024,
  maximumCollectionElements: 64
} as const;

interface CollectionMeasurement {
  readonly path: string;
  readonly length: number;
}

const collectArrays = (
  value: unknown,
  path: string,
  output: CollectionMeasurement[]
): void => {
  if (Array.isArray(value)) {
    output.push({ path, length: value.length });

    value.forEach((item, index) => {
      collectArrays(item, `${path}[${index}]`, output);
    });
    return;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      collectArrays(item, `${path}.${key}`, output);
    }
  }
};

const percentile = (
  sorted: readonly number[],
  ratio: number
): number => sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? 0;

export const measureDecisionPacketTransport = (
  value: unknown
): DecisionPacketTransportMeasurement => {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new Error("DecisionPacket transport measurement requires JSON-serializable input");
  }

  const collections: CollectionMeasurement[] = [];
  collectArrays(value, "$", collections);

  const lengths = collections
    .map((collection) => collection.length)
    .sort((left, right) => left - right);
  const maximum = lengths.at(-1) ?? 0;
  const maximumCollection = collections.find((collection) => collection.length === maximum);

  return {
    utf8Bytes: Buffer.byteLength(serialized, "utf8"),
    collectionCount: lengths.length,
    totalCollectionElements: lengths.reduce((total, length) => total + length, 0),
    collectionLength: {
      minimum: lengths[0] ?? 0,
      median: percentile(lengths, 0.5),
      p95: percentile(lengths, 0.95),
      maximum
    },
    maximumCollectionPath: maximumCollection?.path ?? null
  };
};
