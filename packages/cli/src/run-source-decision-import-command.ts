import path from "node:path";
import {
  defaultProjectSlug,
  defaultWorkspaceSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import {
  findRepoRoot,
  pathExists,
  readJsonObjectResult,
  resolveRepoInputFile
} from "./cli-file-boundary.js";
import {
  noStorePreviewLabel,
  persistenceLine,
  postgresPersistedLabel
} from "./command-runtime-support.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import type {
  CliCommand
} from "./parse-args.js";
import {
  parseDecisionCorpusImportFixture
} from "./internal/eval/run-decision-corpus-import.js";
import type {
  DecisionCorpusImportFixture
} from "./internal/eval/run-decision-corpus-import.js";
import {
  persistSourceDecisionImport,
  sourceDecisionImportCounts,
  validateSourceDecisionImportFixture,
  type PersistedSourceDecisionImportRow
} from "./source-decision-store-import.js";

export type SourceDecisionImportCommand = Extract<CliCommand, { kind: "sourceDecisionImport" }>;

export interface SourceDecisionImportCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: SourceDecisionImportCommand;
  createDatabaseRuntime?: CreateSourceDecisionImportDatabaseRuntime;
}

export interface SourceDecisionImportCommandResult {
  stdout: string;
}

export type CreateSourceDecisionImportDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

interface LoadedSourceDecisionImportFixture {
  readonly filePath: string;
  readonly fixture: DecisionCorpusImportFixture;
}

interface PersistedSourceDecisionImport {
  readonly projectId: string;
  readonly rows: readonly PersistedSourceDecisionImportRow[];
}

const importReadbackDoesNotProve = [
  "source truth",
  "automatic source promotion outside existing review gates",
  "broad research ingestion quality",
  "Codex obedience",
  "product readiness"
] as const;

const resolveImportFixture = async (
  cwd: string,
  file: string
): Promise<LoadedSourceDecisionImportFixture> => {
  const filePath = await resolveRepoInputFile(cwd, file);
  const readResult = await readJsonObjectResult(filePath);

  if (readResult.status !== "ok") {
    throw new Error(`Unable to read source decision import file: ${readResult.reason}`);
  }

  const parsed = parseDecisionCorpusImportFixture(readResult.value);
  const repoRoot = await findRepoRoot(cwd);
  const baseCandidates = [
    path.resolve(cwd, parsed.baseFixturePath),
    path.resolve(repoRoot, parsed.baseFixturePath),
    path.resolve(path.dirname(filePath), parsed.baseFixturePath),
    path.resolve(repoRoot, "packages/cli", parsed.baseFixturePath)
  ];
  const baseFixturePath =
    (await Promise.all(baseCandidates.map(async (candidate) => ({
      candidate,
      exists: await pathExists(candidate)
    })))).find((candidate) => candidate.exists)?.candidate ??
    baseCandidates[0] ??
    parsed.baseFixturePath;

  return {
    filePath,
    fixture: {
      ...parsed,
      baseFixturePath
    }
  };
};

const summarizeRows = (
  rows: readonly PersistedSourceDecisionImportRow[]
): readonly string[] =>
  rows.map((row) => [
    `- ${row.decisionId}:`,
    `sourceClaim=${row.sourceClaimId}`,
    `sourceDecision=${row.sourceDecisionId}`,
    ...(row.sourceDecisionEdgeId === undefined ? [] : [`sourceDecisionEdge=${row.sourceDecisionEdgeId}`]),
    ...(row.searchDocumentId === undefined ? [] : [`searchDocument=${row.searchDocumentId}`]),
    ...(row.sourceRejectionId === undefined ? [] : [`sourceRejection=${row.sourceRejectionId}`])
  ].join(" "));

const formatSourceDecisionImportText = (
  input: {
    readonly persistenceLabel: string;
    readonly filePath: string;
    readonly fixture: DecisionCorpusImportFixture;
    readonly projectId?: string;
    readonly rows?: readonly PersistedSourceDecisionImportRow[];
  }
): string => {
  const counts = sourceDecisionImportCounts(input.fixture);

  return [
    "KRN Source Decision Import",
    persistenceLine(input.persistenceLabel),
    ...(input.projectId === undefined ? [] : [`projectId: ${input.projectId}`]),
    `file: ${path.relative(process.cwd(), input.filePath)}`,
    `corpus: ${input.fixture.corpusName}`,
    `decisions: ${counts.decisionCount} (current=${counts.currentDecisionCount}, stale=${counts.staleDecisionCount}, rejected=${counts.rejectedDecisionCount})`,
    `cases: ${counts.caseCount}`,
    ...(input.rows === undefined
      ? ["DB writes: none"]
      : [
          "",
          "Persisted rows:",
          ...summarizeRows(input.rows)
        ]),
    "",
    "Proof:",
    "- compact source-to-decision rows parsed unknown-first and validated before store writes",
    "- current/stale/rejected import statuses map to existing source/retrieval rows",
    `doesNotProve: ${importReadbackDoesNotProve.join(", ")}`
  ].join("\n");
};

const formatSourceDecisionImportJson = (
  input: {
    readonly persisted: boolean;
    readonly filePath: string;
    readonly fixture: DecisionCorpusImportFixture;
    readonly projectId?: string;
    readonly rows?: readonly PersistedSourceDecisionImportRow[];
  }
): string => JSON.stringify({
  kind: "source_decision_import",
  persistence: input.persisted ? "enabled" : "disabled",
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  file: input.filePath,
  corpusName: input.fixture.corpusName,
  counts: sourceDecisionImportCounts(input.fixture),
  ...(input.rows === undefined ? {} : { rows: input.rows }),
  proof: {
    proves: [
      "compact source-to-decision rows parsed unknown-first and validated before store writes",
      "current/stale/rejected import statuses map to existing source/retrieval rows"
    ],
    doesNotProve: importReadbackDoesNotProve
  }
}, null, 2);

const previewSourceDecisionImport = (
  command: SourceDecisionImportCommand,
  loaded: LoadedSourceDecisionImportFixture
): string =>
  command.json === true
    ? formatSourceDecisionImportJson({
        persisted: false,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        ...(command.projectId === undefined ? {} : { projectId: command.projectId })
      })
    : formatSourceDecisionImportText({
        persistenceLabel: noStorePreviewLabel,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        ...(command.projectId === undefined ? {} : { projectId: command.projectId })
      });

const createSourceDecisionImportRuntime = async (
  runtime: SourceDecisionImportCommandRuntime,
  command: SourceDecisionImportCommand,
  databaseUrl: string
): Promise<DatabaseRuntime> => {
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(command.projectId === undefined ? {} : { projectId: command.projectId }),
    now: runtime.now,
    createId: runtime.createId
  });
};

const persistLoadedSourceDecisionImport = async (
  runtime: SourceDecisionImportCommandRuntime,
  command: SourceDecisionImportCommand,
  loaded: LoadedSourceDecisionImportFixture,
  databaseRuntime: DatabaseRuntime
): Promise<PersistedSourceDecisionImport> => {
  const projectId = command.projectId ?? databaseRuntime.projectId;
  const rows = await persistSourceDecisionImport({
    runtime: databaseRuntime,
    projectId,
    fixture: loaded.fixture,
    importId: runtime.createId("source-decision-import"),
    importedBy: "krn source decision import",
    now: runtime.now()
  });

  return {
    projectId,
    rows
  };
};

const formatPersistedSourceDecisionImport = (
  command: SourceDecisionImportCommand,
  loaded: LoadedSourceDecisionImportFixture,
  persisted: PersistedSourceDecisionImport
): string =>
  command.json === true
    ? formatSourceDecisionImportJson({
        persisted: true,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        projectId: persisted.projectId,
        rows: persisted.rows
      })
    : formatSourceDecisionImportText({
        persistenceLabel: postgresPersistedLabel,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        projectId: persisted.projectId,
        rows: persisted.rows
      });

export const runSourceDecisionImportCommand = async (
  runtime: SourceDecisionImportCommandRuntime
): Promise<SourceDecisionImportCommandResult> => {
  const command = runtime.command;
  const loaded = await resolveImportFixture(runtime.cwd, command.file ?? "");

  validateSourceDecisionImportFixture(loaded.fixture);

  if (!command.persist) {
    return { stdout: previewSourceDecisionImport(command, loaded) };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source decision import --persist");
  }

  const databaseRuntime = await createSourceDecisionImportRuntime(runtime, command, databaseUrl);

  try {
    const persisted = await persistLoadedSourceDecisionImport(runtime, command, loaded, databaseRuntime);

    return {
      stdout: formatPersistedSourceDecisionImport(command, loaded, persisted)
    };
  } finally {
    await databaseRuntime.close();
  }
};
