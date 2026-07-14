import {
  createHash
} from "node:crypto";
import type {
  DecisionPacketContractReadback
} from "@krn/core";
import {
  buildDecisionPacketContractReadback
} from "@krn/core";
import type {
  DecisionPacketReadModel
} from "./run-show-readback.js";
import {
  readDecisionPacketSnapshot
} from "./run-run-show-command.js";
import type {
  CreateRunShowDatabaseRuntime
} from "./run-run-show-command.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";

export interface DecisionPacketCommandRuntime extends BaseCommandRuntime {
  readonly runId: string;
  readonly createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface DecisionPacketCommandResult {
  readonly stdout: string;
}

interface DecisionPacketCommandReadback {
  readonly kind: DecisionPacketContractReadback["kind"];
  readonly access: DecisionPacketContractReadback["access"];
  readonly mutation: DecisionPacketContractReadback["mutation"];
  readonly surface: DecisionPacketContractReadback["surface"];
  readonly request: DecisionPacketContractReadback["request"];
  readonly packetIdentity: DecisionPacketContractReadback["packetIdentity"];
  readonly packet: DecisionPacketContractReadback["packet"];
  readonly readModel: DecisionPacketReadModel;
  readonly returnChannels: DecisionPacketContractReadback["returnChannels"];
  readonly proof: DecisionPacketContractReadback["proof"];
}

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const missingDecisionPacketDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn decision packet",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:migrate && pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
].join("\n");

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const buildDecisionPacket = (
  authorityProjection: Parameters<typeof buildDecisionPacketContractReadback>[0]["readModel"],
  diagnosticReadModel: DecisionPacketReadModel,
  generatedAt: string
): DecisionPacketCommandReadback => {
  const readback = buildDecisionPacketContractReadback({
    readModel: authorityProjection,
    generatedAt,
    sha256Hex
  });

  return {
    ...readback,
    readModel: diagnosticReadModel,
    proof: readback.proof
  };
};

export const runDecisionPacketCommand = async (
  runtime: DecisionPacketCommandRuntime
): Promise<DecisionPacketCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingDecisionPacketDatabaseUrlMessage);
  }

  const snapshot = await readDecisionPacketSnapshot({
    env: runtime.env,
    now: runtime.now,
    createId: runtime.createId,
    runId: runtime.runId,
    format: "json",
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime })
  });

  return {
    stdout: `${JSON.stringify(buildDecisionPacket(
      snapshot.authorityProjection,
      snapshot.diagnosticReadModel,
      runtime.now()
    ), null, 2)}\n`
  };
};
