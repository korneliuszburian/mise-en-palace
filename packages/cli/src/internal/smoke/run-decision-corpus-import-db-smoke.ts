import postgres from "postgres";

import {
  bindSmokeProjectRuntimeFactory,
  closeSmokeRuntimeAndClient,
  createUniqueSmokeCreateId
} from "./smoke-runtime-cleanup.js";
import {
  createDatabaseRuntime
} from "../../database-runtime.js";
import {
  loadDecisionCorpusImportFixture
} from "../eval/run-decision-corpus-import.js";
import {
  persistSourceDecisionImport,
  type PersistedSourceDecisionImportRow
} from "../../source-decision-store-import.js";
import {
  runSmokeSourceSearch,
  sourceSearchIncludesClaim
} from "./source-search-smoke-runner.js";
import {
  cleanupSourceSmokeMarkers,
  finalizeSourceSmokeMarkerCleanup
} from "./source-smoke-marker-cleanup.js";

export interface DecisionCorpusImportDbSmokeInput {
  readonly databaseUrl: string;
  readonly repoRoot: string;
  readonly smokeId: string;
  readonly now: string;
}

export type PersistedDecisionCorpusRow = PersistedSourceDecisionImportRow;

export interface DecisionCorpusImportDbSmokeReport {
  readonly smokeId: string;
  readonly projectId: string;
  readonly fixtureCorpusName: string;
  readonly importedDecisionCount: number;
  readonly importedCaseCount: number;
  readonly persistedRows: readonly PersistedDecisionCorpusRow[];
  readonly governingDecisionId: string;
  readonly governingSourceClaimId: string;
  readonly governingSourceDecisionEdgeId: string;
  readonly governingSearchDocumentId: string;
  readonly sourceSearchSelectedGoverningClaim: boolean;
  readonly sourceSearchSupportingClaimCount: number;
  readonly sourceSearchSupportingDocumentCount: number;
  readonly sourceSearchDecisionSupportCount: number;
  readonly limitationClassification: string;
  readonly remainingMarkerCount: number;
  readonly cleanedUp: boolean;
}

const markerTables = [
  "retrieval_runs",
  "search_documents",
  "source_rejections",
  "source_decision_edges",
  "source_decisions",
  "source_claim_edges",
  "source_claims",
  "source_chunks",
  "source_artifacts"
] as const;

const smokeSource = "krn db smoke decision-corpus-import";

type PersistDecisionCorpusImportInput =
  Omit<Parameters<typeof persistSourceDecisionImport>[0], "importId" | "importedBy"> & {
    readonly smokeId: string;
  };

export const persistDecisionCorpusImport = async (
  input: PersistDecisionCorpusImportInput
): Promise<readonly PersistedDecisionCorpusRow[]> => {
  return persistSourceDecisionImport({
    runtime: input.runtime,
    projectId: input.projectId,
    fixture: input.fixture,
    importId: input.smokeId,
    importedBy: "krn db smoke decision-corpus-import",
    now: input.now
  });
};

const countValue = (value: unknown): number => {
  if (Array.isArray(value)) {
    return value.length;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const requiredPersistedRow = (
  rows: readonly PersistedDecisionCorpusRow[],
  decisionId: string
): PersistedDecisionCorpusRow => {
  const row = rows.find((candidate) => candidate.decisionId === decisionId);

  if (row === undefined) {
    throw new Error(`missing persisted imported decision ${decisionId}`);
  }

  return row;
};

const requireString = (
  value: string | undefined,
  label: string
): string => {
  if (value === undefined || value.length === 0) {
    throw new Error(`missing ${label}`);
  }

  return value;
};

export const runDecisionCorpusImportDbSmokeCheck = async (
  input: DecisionCorpusImportDbSmokeInput
): Promise<DecisionCorpusImportDbSmokeReport> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const createId = createUniqueSmokeCreateId(input.smokeId);
  let runtime: Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;

  try {
    await cleanupSourceSmokeMarkers(client, markerTables, input.smokeId, smokeSource);
    runtime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: "decision-corpus-import-smoke",
      requireProjectKernelForExplicitProject: false,
      now: () => input.now,
      createId
    });
    const projectId = runtime.projectId;
    const fixture = loadDecisionCorpusImportFixture(
      `${input.repoRoot}/tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json`
    );
    const persistedRows = await persistDecisionCorpusImport({
      runtime,
      projectId,
      fixture,
      smokeId: input.smokeId,
      now: input.now
    });
    const firstCase = fixture.cases[0];

    if (firstCase === undefined) {
      throw new Error("decision corpus import DB smoke fixture requires at least one case");
    }

    const governingRow = requiredPersistedRow(persistedRows, firstCase.expectedDecisionId);
    const governingSourceDecisionEdgeId = requireString(
      governingRow.sourceDecisionEdgeId,
      "governing SourceDecisionEdge"
    );
    const governingSearchDocumentId = requireString(
      governingRow.searchDocumentId,
      "governing SearchDocument"
    );
    const createSmokeDatabaseRuntime = bindSmokeProjectRuntimeFactory(runtime);
    const sourceSearchJson = await runSmokeSourceSearch(
      input,
      createId,
      createSmokeDatabaseRuntime,
      firstCase.task,
      "decision-corpus-import DB smoke"
    );
    const sourceSearchSelectedGoverningClaim = sourceSearchIncludesClaim(
      sourceSearchJson,
      governingRow.sourceClaimId
    );

    if (!sourceSearchSelectedGoverningClaim) {
      throw new Error("decision corpus import DB smoke did not select the governing SourceClaim");
    }

    const markerCleanup = await finalizeSourceSmokeMarkerCleanup(
      client,
      markerTables,
      input.smokeId,
      smokeSource
    );

    return {
      smokeId: input.smokeId,
      projectId,
      fixtureCorpusName: fixture.corpusName,
      importedDecisionCount: fixture.decisions.length,
      importedCaseCount: fixture.cases.length,
      persistedRows,
      governingDecisionId: firstCase.expectedDecisionId,
      governingSourceClaimId: governingRow.sourceClaimId,
      governingSourceDecisionEdgeId,
      governingSearchDocumentId,
      sourceSearchSelectedGoverningClaim,
      sourceSearchSupportingClaimCount: countValue(sourceSearchJson.answerPackage?.supportingClaims),
      sourceSearchSupportingDocumentCount: countValue(sourceSearchJson.answerPackage?.supportingDocuments),
      sourceSearchDecisionSupportCount: countValue(sourceSearchJson.answerPackage?.sourceDecisionSupport),
      limitationClassification:
        "db_backed_import_and_source_search_readback_not_live_codex_or_source_truth",
      remainingMarkerCount: markerCleanup.remainingMarkerCount,
      cleanedUp: markerCleanup.cleanedUp
    };
  } finally {
    await closeSmokeRuntimeAndClient(runtime, client);
  }
};
