import postgres from "postgres";

import type {
  ProjectId
} from "@krn/core";
import {
  bindSmokeProjectRuntimeFactory,
  closeSmokeRuntimeAndClient,
  createUniqueSmokeCreateId
} from "./smoke-runtime-cleanup.js";
import {
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";
import {
  loadDecisionCorpusImportFixture,
  buildImportedDecisionCorpus
} from "./run-decision-corpus-import.js";
import {
  loadDecisionPacketEvalFixture
} from "./decision-packet-fixture.js";
import type {
  DecisionCorpusImportFixture,
  DecisionCorpusImportRow
} from "./run-decision-corpus-import.js";
import {
  runSmokeSourceSearch,
  sourceSearchIncludesClaim
} from "./source-search-smoke-runner.js";
import {
  cleanupSourceSmokeMarkers,
  finalizeSourceSmokeMarkerCleanup
} from "./source-smoke-marker-cleanup.js";

type DecisionCorpusImportRuntime = Pick<
  DatabaseRuntime,
  "sourceRepository" | "retrievalRepository"
>;
type DecisionCorpusSourceRepository = DecisionCorpusImportRuntime["sourceRepository"];
type DecisionCorpusRetrievalRepository = NonNullable<DecisionCorpusImportRuntime["retrievalRepository"]>;

export interface DecisionCorpusImportDbSmokeInput {
  readonly databaseUrl: string;
  readonly repoRoot: string;
  readonly smokeId: string;
  readonly now: string;
}

export interface PersistedDecisionCorpusRow {
  readonly decisionId: string;
  readonly sourceArtifactId: string;
  readonly sourceChunkId: string;
  readonly sourceClaimId: string;
  readonly sourceClaimStatus: string;
  readonly sourceDecisionId: string;
  readonly sourceDecisionStatus: string;
  readonly sourceDecisionEdgeId?: string;
  readonly searchDocumentId?: string;
  readonly sourceRejectionId?: string;
}

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

interface PersistDecisionCorpusImportInput {
  readonly runtime: DecisionCorpusImportRuntime;
  readonly projectId: ProjectId;
  readonly fixture: DecisionCorpusImportFixture;
  readonly smokeId: string;
  readonly now: string;
}

const smokeSource = "krn db smoke decision-corpus-import";

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

const metadataForRow = (
  smokeId: string,
  row: DecisionCorpusImportRow
): Record<string, unknown> => ({
  smokeId,
  source: smokeSource,
  decisionCorpusImportId: row.id,
  decisionCorpusStatus: row.status,
  evidenceRef: row.evidenceRef
});

const createSourceArtifactAndChunk = async (
  sourceRepository: DecisionCorpusSourceRepository,
  projectId: ProjectId,
  row: DecisionCorpusImportRow,
  metadata: Record<string, unknown>
) => {
  if (sourceRepository.createSourceChunk === undefined) {
    throw new Error("SourceChunk creation is unavailable for decision-corpus-import DB smoke");
  }

  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId,
    kind: "doc",
    trustTier: "project-decision",
    uri: `decision-corpus-import://${row.id}`,
    title: row.title,
    contentHash: `decision-corpus-import:${row.id}`,
    metadata
  });
  const sourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    heading: row.title,
    content: `${row.statement}\n\n${row.noteText}`,
    tokenCount: row.statement.split(/\s+/u).length + row.noteText.split(/\s+/u).length,
    contentHash: `decision-corpus-import:${row.id}:chunk`,
    metadata
  });

  return { sourceArtifact, sourceChunk };
};

const createDecisionSupport = async (
  input: {
    readonly sourceRepository: DecisionCorpusSourceRepository;
    readonly retrievalRepository: DecisionCorpusRetrievalRepository;
    readonly projectId: ProjectId;
    readonly row: DecisionCorpusImportRow;
    readonly sourceArtifactId: string;
    readonly sourceChunkId: string;
    readonly sourceClaimId: string;
    readonly sourceDecisionId: string;
    readonly metadata: Record<string, unknown>;
  }
): Promise<Pick<PersistedDecisionCorpusRow, "sourceDecisionEdgeId" | "searchDocumentId">> => {
  const sourceDecisionEdge = await input.sourceRepository.createSourceDecisionEdge({
    sourceClaimId: input.sourceClaimId,
    targetType: "architecture_decision",
    targetId: `decision-corpus-import:${input.row.id}`,
    supportType: "implementation-boundary",
    confidence: input.row.status === "current" ? "high" : "medium",
    notes: input.row.noteText,
    metadata: {
      ...input.metadata,
      sourceDecisionId: input.sourceDecisionId
    }
  });
  const searchDocument = await input.retrievalRepository.createSearchDocument({
    projectId: input.projectId,
    subjectType: "source_claim",
    subjectId: input.sourceClaimId,
    sourceArtifactId: input.sourceArtifactId,
    sourceChunkId: input.sourceChunkId,
    sourceClaimId: input.sourceClaimId,
    sourceDecisionId: input.sourceDecisionId,
    trustTier: "project-decision",
    validityStatus: input.row.status === "stale" ? "invalidated" : "active",
    title: input.row.title,
    body: `${input.row.statement}\n\n${input.row.noteText}`,
    searchText: [
      input.row.title,
      input.row.statement,
      input.row.noteText,
      input.row.falsifier,
      input.row.doesNotProve
    ].join(" "),
    metadataFilters: {
      smokeId: input.metadata["smokeId"],
      decisionCorpusStatus: input.row.status
    },
    metadata: {
      ...input.metadata,
      sourceDecisionId: input.sourceDecisionId
    }
  });

  return {
    sourceDecisionEdgeId: sourceDecisionEdge.id,
    searchDocumentId: searchDocument.id
  };
};

const createRejectedPath = async (
  input: {
    readonly sourceRepository: DecisionCorpusSourceRepository;
    readonly projectId: ProjectId;
    readonly row: DecisionCorpusImportRow;
    readonly sourceArtifactId: string;
    readonly sourceClaimId: string;
    readonly metadata: Record<string, unknown>;
  }
): Promise<string> => {
  const sourceRejection = await input.sourceRepository.createSourceRejection({
    projectId: input.projectId,
    sourceArtifactId: input.sourceArtifactId,
    sourceClaimId: input.sourceClaimId,
    title: input.row.title,
    attemptedClaim: input.row.statement,
    rejectedBecause: "unsupported",
    reason: input.row.falsifier,
    doesNotProve: input.row.doesNotProve,
    consumer: "decision corpus import",
    metadata: input.metadata
  });

  return sourceRejection.id;
};

export const persistDecisionCorpusImport = async (
  input: PersistDecisionCorpusImportInput
): Promise<readonly PersistedDecisionCorpusRow[]> => {
  const base = loadDecisionPacketEvalFixture(input.fixture.baseFixturePath);
  const retrievalRepository = input.runtime.retrievalRepository;
  const createSourceDecision = input.runtime.sourceRepository.createSourceDecision;

  if (createSourceDecision === undefined) {
    throw new Error("SourceDecision creation is unavailable for decision-corpus-import DB smoke");
  }

  if (retrievalRepository === undefined) {
    throw new Error("SearchDocument creation is unavailable for decision-corpus-import DB smoke");
  }

  buildImportedDecisionCorpus(input.fixture, base);

  return Promise.all(input.fixture.decisions.map(async (row) => {
    const metadata = metadataForRow(input.smokeId, row);
    const { sourceArtifact, sourceChunk } = await createSourceArtifactAndChunk(
      input.runtime.sourceRepository,
      input.projectId,
      row,
      metadata
    );
    const sourceClaim = await input.runtime.sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      claim: row.statement,
      mechanism: row.noteText,
      krnImplication: row.statement,
      doesNotProve: row.doesNotProve,
      trustTier: "project-decision",
      supportType: row.status === "rejected" ? "rejection" : "implementation-boundary",
      consumer: "decision corpus import",
      falsifier: row.falsifier,
      metadata
    });
    const sourceDecision = await createSourceDecision({
      projectId: input.projectId,
      sourceClaimId: sourceClaim.id,
      status: row.status === "rejected" ? "reject" : "adopt",
      decision: row.statement,
      rationale: row.noteText,
      falsifier: row.falsifier,
      consumer: "decision corpus import",
      metadata
    });
    const sourceClaimReadback = await input.runtime.sourceRepository.getSourceClaimById(sourceClaim.id);

    if (sourceClaimReadback === undefined) {
      throw new Error(`missing SourceClaim readback for imported decision ${row.id}`);
    }

    if (row.status === "rejected") {
      const sourceRejectionId = await createRejectedPath({
        sourceRepository: input.runtime.sourceRepository,
        projectId: input.projectId,
        row,
        sourceArtifactId: sourceArtifact.id,
        sourceClaimId: sourceClaim.id,
        metadata
      });

      return {
        decisionId: row.id,
        sourceArtifactId: sourceArtifact.id,
        sourceChunkId: sourceChunk.id,
        sourceClaimId: sourceClaim.id,
        sourceClaimStatus: sourceClaimReadback.status,
        sourceDecisionId: sourceDecision.id,
        sourceDecisionStatus: sourceDecision.status,
        sourceRejectionId
      };
    }

    return {
      decisionId: row.id,
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      sourceClaimId: sourceClaim.id,
      sourceClaimStatus: sourceClaimReadback.status,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionStatus: sourceDecision.status,
      ...await createDecisionSupport({
        sourceRepository: input.runtime.sourceRepository,
        retrievalRepository,
        projectId: input.projectId,
        row,
        sourceArtifactId: sourceArtifact.id,
        sourceChunkId: sourceChunk.id,
        sourceClaimId: sourceClaim.id,
        sourceDecisionId: sourceDecision.id,
        metadata
      })
    };
  }));
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
