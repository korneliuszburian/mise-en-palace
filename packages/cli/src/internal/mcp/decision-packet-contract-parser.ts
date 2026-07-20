import { createHash } from "node:crypto";

import {
  decisionPacketContractReadbackSchema,
  parseDecisionPacketContractReadback as parseCoreDecisionPacketContractReadback
} from "@krn/core";
import type {
  DecisionPacketContractReadback
} from "@krn/core";
import { z } from "zod";

export type DecisionPacketJsonValue =
  | string
  | number
  | boolean
  | null
  | DecisionPacketJsonValue[]
  | DecisionPacketJsonObject;

export type DecisionPacketJsonObject = {
  readonly [key: string]: DecisionPacketJsonValue;
};

const transportProof =
  "DecisionPacket was served through the read-only krn_decision_packet MCP tool";

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const commandReadbackSchema = decisionPacketContractReadbackSchema.extend({
  readModel: z.unknown().optional()
});

const identityOutputSchema = z.toJSONSchema(
  decisionPacketContractReadbackSchema.shape.packetIdentity
);

const isJsonValue = (value: unknown): value is DecisionPacketJsonValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return typeof value === "object" &&
    value !== null &&
    Object.values(value).every(isJsonValue);
};

const isJsonObject = (value: unknown): value is DecisionPacketJsonObject =>
  isJsonValue(value) && typeof value === "object" && value !== null && !Array.isArray(value);

if (!isJsonObject(identityOutputSchema)) {
  throw new Error("DecisionPacket identity output schema is not a JSON object");
}

export const decisionPacketIdentityOutputSchema = identityOutputSchema;

export const parseDecisionPacketContractReadback = (
  value: unknown,
  requestedRunId: string
): DecisionPacketContractReadback | undefined => {
  if (!isJsonObject(value)) {
    return undefined;
  }

  const parsed = commandReadbackSchema.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  const readback = parseCoreDecisionPacketContractReadback({
    value: {
      kind: parsed.data.kind,
      access: parsed.data.access,
      mutation: parsed.data.mutation,
      surface: parsed.data.surface,
      request: parsed.data.request,
      packetIdentity: parsed.data.packetIdentity,
      packet: parsed.data.packet,
      returnChannels: parsed.data.returnChannels,
      proof: parsed.data.proof
    },
    expectedRunId: requestedRunId,
    sha256Hex
  });

  return readback === undefined || readback.proof.proves.includes(transportProof)
    ? undefined
    : readback;
};
