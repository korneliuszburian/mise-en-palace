import type {
  ListPairedLiveEvalEvidenceInput,
  PairedLiveEvalEvidenceRecord
} from "@krn/core";

import {
  buildPairedLiveEvalEvidenceReadback,
  renderPairedLiveEvalEvidenceReadbackText
} from "./paired-live-eval-evidence-readback.js";
import type {
  PairedLiveEvalEvidenceFilters
} from "./paired-live-eval-evidence-readback.js";
import {
  createPairedLiveEvalReadbackRuntime
} from "./paired-live-eval-readback-runtime.js";

export interface PairedLiveEvalEvidenceCommand {
  readonly projectId: string;
  readonly runId?: string;
  readonly candidateId?: string;
  readonly scenario?: string;
  readonly outcome?: PairedLiveEvalEvidenceFilters["outcome"];
  readonly usefulnessOutcome?: PairedLiveEvalEvidenceFilters["usefulnessOutcome"];
  readonly limit?: number;
  readonly format: "text" | "json";
}

interface PairedLiveEvalEvidenceDatabaseRuntime {
  listPairedLiveEvalEvidence(
    input: ListPairedLiveEvalEvidenceInput
  ): Promise<PairedLiveEvalEvidenceRecord[]>;
  close(): Promise<void>;
}

export type CreatePairedLiveEvalEvidenceDatabaseRuntime = (input: {
  readonly databaseUrl: string;
}) => Promise<PairedLiveEvalEvidenceDatabaseRuntime>;

export interface PairedLiveEvalEvidenceCommandRuntime {
  readonly env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  readonly command: PairedLiveEvalEvidenceCommand;
  readonly createReadbackRuntime?: CreatePairedLiveEvalEvidenceDatabaseRuntime;
}

export interface PairedLiveEvalEvidenceCommandResult {
  readonly stdout: string;
}

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const missingDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn run eval-evidence",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:migrate && pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove paired-live eval evidence exists, survived cleanup, or Memory Core mutated"
].join("\n");

const createDefaultReadbackRuntime = async (input: {
  readonly databaseUrl: string;
}): Promise<PairedLiveEvalEvidenceDatabaseRuntime> =>
  createPairedLiveEvalReadbackRuntime(input);

const resolveRuntime = (
  runtime: PairedLiveEvalEvidenceCommandRuntime,
  databaseUrl: string
): Promise<PairedLiveEvalEvidenceDatabaseRuntime> => (
  runtime.createReadbackRuntime ?? createDefaultReadbackRuntime
)({
  databaseUrl
});

const commandFilters = (
  command: PairedLiveEvalEvidenceCommand
): PairedLiveEvalEvidenceFilters => ({
  ...(command.runId === undefined ? {} : { runId: command.runId }),
  ...(command.candidateId === undefined ? {} : { candidateId: command.candidateId }),
  ...(command.scenario === undefined ? {} : { scenario: command.scenario }),
  ...(command.outcome === undefined ? {} : { outcome: command.outcome }),
  ...(command.usefulnessOutcome === undefined
    ? {}
    : { usefulnessOutcome: command.usefulnessOutcome })
});

const repositoryFilters = (
  command: PairedLiveEvalEvidenceCommand
): ListPairedLiveEvalEvidenceInput => ({
  projectId: command.projectId,
  ...commandFilters(command),
  ...(command.limit === undefined ? {} : { limit: command.limit })
});

const commandOutput = (
  command: PairedLiveEvalEvidenceCommand,
  records: readonly PairedLiveEvalEvidenceRecord[]
): string => {
  const readback = buildPairedLiveEvalEvidenceReadback({
    projectId: command.projectId,
    records,
    filters: commandFilters(command)
  });

  return command.format === "json"
    ? `${JSON.stringify(readback, null, 2)}\n`
    : `${renderPairedLiveEvalEvidenceReadbackText(readback)}\n`;
};

export const runPairedLiveEvalEvidenceCommand = async (
  runtime: PairedLiveEvalEvidenceCommandRuntime
): Promise<PairedLiveEvalEvidenceCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingDatabaseUrlMessage);
  }

  const readRuntime = await resolveRuntime(runtime, databaseUrl);
  try {
    const records = await readRuntime.listPairedLiveEvalEvidence(
      repositoryFilters(runtime.command)
    );

    return {
      stdout: commandOutput(runtime.command, records)
    };
  } finally {
    await readRuntime.close();
  }
};
