import { createHash } from "node:crypto";

import type {
  DecisionPacketContractReadback
} from "@krn/core";
import {
  parseDecisionPacketContractReadback
} from "@krn/core";
import {
  openKrnSqliteDatabase,
  resolveBackendConfig
} from "@krn/db";
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
import { resolveTargetWorkspace } from "./target-workspace.js";

export interface DecisionPacketCommandRuntime extends BaseCommandRuntime {
  readonly cwd?: string;
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

const buildDecisionPacket = (
  issuance: DecisionPacketContractReadback,
  diagnosticReadModel: DecisionPacketReadModel
): DecisionPacketCommandReadback => ({
  ...issuance,
  readModel: diagnosticReadModel
});

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const parseStoredReadback = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
};

const readSqliteDecisionPacket = async (
  runtime: DecisionPacketCommandRuntime,
  dbPath: string
): Promise<DecisionPacketContractReadback> => {
  const connection = await openKrnSqliteDatabase(dbPath, {
    readonly: true,
    fileMustExist: true
  });

  try {
    const row = connection.client.prepare(`
      select readback
      from decision_packet_issuances
      where execution_run_id = ?
    `).get(runtime.runId) as { readback?: unknown } | undefined;

    const readback = row === undefined
      ? undefined
      : parseDecisionPacketContractReadback({
        value: parseStoredReadback(row.readback),
        expectedRunId: runtime.runId,
        sha256Hex
      });

    if (readback === undefined) {
      throw new Error(`No valid SQLite DecisionPacket issuance found for run ${runtime.runId}`);
    }

    return readback;
  } finally {
    connection.close();
  }
};

export const runDecisionPacketCommand = async (
  runtime: DecisionPacketCommandRuntime
): Promise<DecisionPacketCommandResult> => {
  const requestedBackend = runtime.env.KRN_DB_BACKEND?.trim();
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (requestedBackend === "sqlite" ||
    (requestedBackend === undefined && (databaseUrl === undefined || databaseUrl.length === 0))) {
    const targetWorkspace = await resolveTargetWorkspace({
      cwd: runtime.cwd ?? process.cwd(),
      env: runtime.env
    });
    const backend = resolveBackendConfig({
      env: runtime.env,
      targetWorkspace
    });

    if (backend.kind === "sqlite") {
      return {
        stdout: `${JSON.stringify(await readSqliteDecisionPacket(runtime, backend.dbPath), null, 2)}\n`
      };
    }
  }

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
      snapshot.issuance,
      snapshot.diagnosticReadModel
    ), null, 2)}\n`
  };
};
