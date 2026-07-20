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
  evaluateSourceCoverage,
  type SourceCoverageEvidence,
  type SourceCoverageReport
} from "./source-coverage.js";
import type {
  ReviewedSourceDecisionCorpus
} from "./reviewed-source-decision-corpus.js";
import {
  parseReviewedSourceDecisionCorpus
} from "./reviewed-source-decision-corpus.js";
import {
  deriveSourceDecisionImportIdentity,
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
  readonly repoRoot: string;
  readonly fixture: ReviewedSourceDecisionCorpus;
}

interface PersistedSourceDecisionImport {
  readonly projectId: string;
  readonly importId: string;
  readonly rows: readonly PersistedSourceDecisionImportRow[];
  readonly coverage: SourceCoverageReport;
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

  const parsed = parseReviewedSourceDecisionCorpus(readResult.value);
  const repoRoot = await findRepoRoot(cwd);

  return {
    filePath,
    repoRoot,
    fixture: parsed
  };
};

const summarizeRows = (
  rows: readonly PersistedSourceDecisionImportRow[]
): readonly string[] =>
  rows.map((row) => [
    `- ${row.decisionId}:`,
    `evidence=${row.evidenceStatus}`,
    `freshness=${row.evidenceFreshness}`,
    `sourceClaim=${row.sourceClaimId}`,
    `sourceDecision=${row.sourceDecisionId}`,
    ...(row.sourceDecisionEdgeId === undefined ? [] : [`sourceDecisionEdge=${row.sourceDecisionEdgeId}`]),
    ...(row.searchDocumentId === undefined ? [] : [`searchDocument=${row.searchDocumentId}`]),
    ...(row.sourceRejectionId === undefined ? [] : [`sourceRejection=${row.sourceRejectionId}`])
  ].join(" "));

const coverageFor = (
  fixture: ReviewedSourceDecisionCorpus,
  evidence: readonly SourceCoverageEvidence[]
): SourceCoverageReport => evaluateSourceCoverage({
  ...(fixture.coverageScope === undefined ? {} : { scope: fixture.coverageScope }),
  evidence
});

const previewCoverageFor = (
  fixture: ReviewedSourceDecisionCorpus
): SourceCoverageReport => coverageFor(fixture, []);

const formatSourceDecisionImportText = (
  input: {
    readonly persistenceLabel: string;
    readonly filePath: string;
    readonly fixture: ReviewedSourceDecisionCorpus;
    readonly coverage: SourceCoverageReport;
    readonly importId: string;
    readonly projectId?: string;
    readonly rows?: readonly PersistedSourceDecisionImportRow[];
  }
): string => {
  const counts = sourceDecisionImportCounts(input.fixture);

  return [
    "KRN Source Decision Import",
    persistenceLine(input.persistenceLabel),
    ...(input.projectId === undefined ? [] : [`projectId: ${input.projectId}`]),
    `importId: ${input.importId}`,
    `file: ${path.relative(process.cwd(), input.filePath)}`,
    `corpus: ${input.fixture.corpusName}`,
    `decisions: ${counts.decisionCount} (current=${counts.currentDecisionCount}, stale=${counts.staleDecisionCount}, rejected=${counts.rejectedDecisionCount})`,
    ...(input.rows === undefined
      ? ["DB writes: none"]
      : [
          "",
          "Persisted rows:",
          ...summarizeRows(input.rows)
        ]),
    `coverage: ${input.coverage.status} (declaredRows=${input.coverage.declaredRowCount}, capturedRows=${input.coverage.capturedRowCount}, missingRows=${input.coverage.missingRowCount}, declaredEvidenceRefs=${input.coverage.declaredEvidenceRefCount}, capturedEvidenceRefs=${input.coverage.capturedEvidenceRefCount}, capturedCurrentEvidenceRefs=${input.coverage.capturedCurrentEvidenceRefCount}, capturedStaleEvidenceRefs=${input.coverage.capturedStaleEvidenceRefCount}, capturedUnknownEvidenceRefs=${input.coverage.capturedUnknownEvidenceRefCount}, missingEvidenceRefs=${input.coverage.missingEvidenceRefCount}, mismatchedEvidenceRefs=${input.coverage.mismatchedEvidenceRefCount}, externallyUnverified=${input.coverage.externallyUnverifiedEvidenceRefCount})`,
    "",
    "Proof:",
    "- compact source-to-decision rows parsed unknown-first and validated before store writes",
    "- current/stale/rejected import statuses map to existing source/retrieval rows",
    `doesNotProve: ${[...importReadbackDoesNotProve, ...input.coverage.doesNotProve].join(", ")}`
  ].join("\n");
};

const formatSourceDecisionImportJson = (
  input: {
    readonly persisted: boolean;
    readonly filePath: string;
    readonly fixture: ReviewedSourceDecisionCorpus;
    readonly coverage: SourceCoverageReport;
    readonly importId: string;
    readonly projectId?: string;
    readonly rows?: readonly PersistedSourceDecisionImportRow[];
  }
): string => JSON.stringify({
  kind: "source_decision_import",
  persistence: input.persisted ? "enabled" : "disabled",
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  importId: input.importId,
  file: input.filePath,
  corpusName: input.fixture.corpusName,
  counts: sourceDecisionImportCounts(input.fixture),
  coverage: input.coverage,
  ...(input.rows === undefined ? {} : { rows: input.rows }),
  proof: {
    proves: [
      "compact source-to-decision rows parsed unknown-first and validated before store writes",
      "current/stale/rejected import statuses map to existing source/retrieval rows"
    ],
    doesNotProve: [...importReadbackDoesNotProve, ...input.coverage.doesNotProve]
  }
}, null, 2);

const previewSourceDecisionImport = (
  command: SourceDecisionImportCommand,
  loaded: LoadedSourceDecisionImportFixture,
  importId: string
): string =>
  command.json === true
    ? formatSourceDecisionImportJson({
        persisted: false,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        coverage: previewCoverageFor(loaded.fixture),
        importId,
        ...(command.projectId === undefined ? {} : { projectId: command.projectId })
      })
    : formatSourceDecisionImportText({
        persistenceLabel: noStorePreviewLabel,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        coverage: previewCoverageFor(loaded.fixture),
        importId,
        ...(command.projectId === undefined ? {} : { projectId: command.projectId })
      });

const sourceDecisionImportProjectIdentity = (
  command: SourceDecisionImportCommand
): string => command.projectId ?? `workspace:${defaultWorkspaceSlug};project:${defaultProjectSlug}`;

const createSourceDecisionImportRuntime = async (
  runtime: SourceDecisionImportCommandRuntime,
  command: SourceDecisionImportCommand,
  databaseUrl: string
): Promise<DatabaseRuntime> => {
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const repoPathHint = command.repo === undefined
    ? undefined
    : path.resolve(runtime.cwd, command.repo);

  if (repoPathHint !== undefined && !(await pathExists(repoPathHint))) {
    throw new Error(`Target repo does not exist: ${repoPathHint}`);
  }

  return createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(command.projectId === undefined ? {} : { projectId: command.projectId }),
    ...(repoPathHint === undefined ? {} : { repoPathHint }),
    ...(command.repo === undefined ? {} : { requireConnectedRepoPath: true }),
    now: runtime.now,
    createId: runtime.createId
  });
};

const persistLoadedSourceDecisionImport = async (
  runtime: SourceDecisionImportCommandRuntime,
  command: SourceDecisionImportCommand,
  loaded: LoadedSourceDecisionImportFixture,
  databaseRuntime: DatabaseRuntime,
  importId: string
): Promise<PersistedSourceDecisionImport> => {
  const projectId = command.projectId ?? databaseRuntime.projectId;
  const persisted = await persistSourceDecisionImport({
    runtime: databaseRuntime,
    projectId,
    fixture: loaded.fixture,
    importId,
    importedBy: "krn source decision import",
    now: runtime.now(),
    ...(command.repo === undefined ? { authorizedRepoRoot: loaded.repoRoot } : {}),
    ...(command.repo === undefined ? {} : { requireCapturedProjectEvidence: true })
  });

  return {
    projectId,
    importId: persisted.importId,
    rows: persisted.rows,
    coverage: coverageFor(loaded.fixture, persisted.rows.map((row) => ({
      decisionId: row.decisionId,
      evidenceRef: row.evidenceRef,
      status: row.evidenceStatus,
      ...(row.evidenceCapturedAt === undefined ? {} : { capturedAt: row.evidenceCapturedAt }),
      ...(row.evidenceContentHash === undefined ? {} : { contentHash: row.evidenceContentHash }),
      freshness: row.evidenceFreshness,
      ...(row.evidenceProvenance === undefined ? {} : { provenance: row.evidenceProvenance }),
      ...(row.evidenceReason === undefined ? {} : { reason: row.evidenceReason })
    })))
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
        importId: persisted.importId,
        rows: persisted.rows,
        coverage: persisted.coverage
      })
    : formatSourceDecisionImportText({
        persistenceLabel: postgresPersistedLabel,
        filePath: loaded.filePath,
        fixture: loaded.fixture,
        projectId: persisted.projectId,
        importId: persisted.importId,
        rows: persisted.rows,
        coverage: persisted.coverage
      });

export const runSourceDecisionImportCommand = async (
  runtime: SourceDecisionImportCommandRuntime
): Promise<SourceDecisionImportCommandResult> => {
  const command = runtime.command;

  if (command.repo !== undefined && !command.persist) {
    throw new Error("krn source decision import --repo requires --persist");
  }

  const loaded = await resolveImportFixture(runtime.cwd, command.file ?? "");

  validateSourceDecisionImportFixture(loaded.fixture);
  const previewImportId = deriveSourceDecisionImportIdentity({
    projectIdentity: sourceDecisionImportProjectIdentity(command),
    fixture: loaded.fixture
  });

  if (!command.persist) {
    return { stdout: previewSourceDecisionImport(command, loaded, previewImportId) };
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source decision import --persist");
  }

  const databaseRuntime = await createSourceDecisionImportRuntime(runtime, command, databaseUrl);

  try {
    const importId = deriveSourceDecisionImportIdentity({
      projectIdentity: command.repo === undefined
        ? sourceDecisionImportProjectIdentity(command)
        : databaseRuntime.projectId,
      fixture: loaded.fixture
    });
    const persisted = await persistLoadedSourceDecisionImport(
      runtime,
      command,
      loaded,
      databaseRuntime,
      importId
    );

    return {
      stdout: formatPersistedSourceDecisionImport(command, loaded, persisted)
    };
  } finally {
    await databaseRuntime.close();
  }
};
