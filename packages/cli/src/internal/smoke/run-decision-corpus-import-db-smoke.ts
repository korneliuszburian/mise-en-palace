import { createHash } from "node:crypto";
import postgres from "postgres";

import {
  bindSmokeProjectRuntimeFactory,
  closeSmokeRuntimeAndClient,
  createUniqueSmokeCreateId
} from "./smoke-runtime-cleanup.js";
import {
  createDatabaseRuntime
} from "../../database-runtime.js";
import type {
  DatabaseRuntimeTransaction
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
  readonly replayStable: boolean;
  readonly replayPersistedArtifactCount: number;
  readonly changedReplayRejected: boolean;
  readonly atomicFailureRolledBack: boolean;
  readonly governingDecisionId: string;
  readonly governingEvidenceStatus: PersistedDecisionCorpusRow["evidenceStatus"];
  readonly externalEvidenceStatus: PersistedDecisionCorpusRow["evidenceStatus"];
  readonly governingSourceClaimId: string;
  readonly governingSourceDecisionEdgeId: string;
  readonly governingSearchDocumentId: string;
  readonly sourceSearchSelectedGoverningClaim: boolean;
  readonly staleDecisionId: string;
  readonly staleSourceClaimId: string;
  readonly staleSourceClaimStatus: string;
  readonly staleSourceClaimRevisitWhen: string;
  readonly staleSourceDecisionStatus: string;
  readonly staleSearchDocumentId: string;
  readonly staleSearchDocumentValidityStatus: string;
  readonly staleSourceDecisionEdgeCount: number;
  readonly sourceSearchSelectedStaleClaim: boolean;
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

const externalEvidenceRef = "https://mem0.ai/blog/loop-engineering-for-ai-agents-memory-first-design";

const hashCapturedEvidence = (content: string): string =>
  createHash("sha256").update(content, "utf8").digest("hex");

const smokeImportFixture = (
  fixture: ReturnType<typeof loadDecisionCorpusImportFixture>
): ReturnType<typeof loadDecisionCorpusImportFixture> => ({
  ...fixture,
  decisions: fixture.decisions.map((row) =>
    row.status === "current" && !row.evidenceRef.startsWith("http://") && !row.evidenceRef.startsWith("https://")
      ? { ...row, evidenceRef: "KRN_ROADMAP.md" }
      : row
  )
});

const seedCapturedExternalEvidence = async (input: {
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>;
  projectId: string;
  smokeId: string;
}): Promise<void> => {
  const createSourceChunk = input.runtime.sourceRepository.createSourceChunk;

  if (createSourceChunk === undefined) {
    throw new Error("decision corpus import DB smoke cannot create captured evidence chunk");
  }

  const content = [
    "Recorded source-evidence fixture for the decision-corpus import DB smoke.",
    "This byte payload exists only to prove that a URL must resolve through a project-scoped captured SourceArtifact.",
    "It does not prove the remote page is current, true, complete, or semantically applicable."
  ].join("\n");
  const contentHash = hashCapturedEvidence(content);
  const sourceArtifact = await input.runtime.sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "url",
    sourceAuthority: "practitioner",
    uri: externalEvidenceRef,
    title: "Decision corpus import external evidence fixture",
    contentHash,
    metadata: {
      smokeId: input.smokeId,
      captureKind: "source_evidence_fixture",
      doesNotProve: "This fixture does not prove remote source truth, freshness, completeness, or interpretation."
    }
  });

  await createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    heading: "Recorded capture",
    content,
    contentHash,
    metadata: {
      smokeId: input.smokeId,
      captureKind: "source_evidence_fixture"
    }
  });
};

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
    smokeId: input.smokeId,
    importedBy: "krn db smoke decision-corpus-import",
    now: input.now,
    ...(input.authorizedRepoRoot === undefined
      ? {}
      : { authorizedRepoRoot: input.authorizedRepoRoot }),
    ...(input.resolveEvidence === undefined ? {} : { resolveEvidence: input.resolveEvidence })
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
    const fixture = smokeImportFixture(loadDecisionCorpusImportFixture(
      `${input.repoRoot}/tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json`
    ));
    await seedCapturedExternalEvidence({
      runtime,
      projectId,
      smokeId: input.smokeId
    });
    const persistedRows = await persistDecisionCorpusImport({
      runtime,
      projectId,
      fixture,
      smokeId: input.smokeId,
      now: input.now,
      authorizedRepoRoot: input.repoRoot
    });
    const replayRows = await persistDecisionCorpusImport({
      runtime,
      projectId,
      fixture,
      smokeId: input.smokeId,
      now: input.now,
      authorizedRepoRoot: input.repoRoot
    });
    const replayStable = JSON.stringify(replayRows) === JSON.stringify(persistedRows);
    const replayArtifactRows = await client<{ count: number }[]>`
      select count(*)::int as count
      from source_artifacts
      where project_id = ${projectId}
        and import_id = ${input.smokeId}
    `;
    const replayPersistedArtifactCount = replayArtifactRows[0]?.count ?? 0;
    const changedFixture = {
      ...fixture,
      decisions: fixture.decisions.map((row, index) => index === 0
        ? { ...row, noteText: `${row.noteText} changed under the same import identity` }
        : row)
    };
    let changedReplayRejected = false;

    try {
      await persistDecisionCorpusImport({
        runtime,
        projectId,
        fixture: changedFixture,
        smokeId: input.smokeId,
        now: input.now,
        authorizedRepoRoot: input.repoRoot
      });
    } catch (error) {
      changedReplayRejected = error instanceof Error &&
        error.message.includes("conflicts with existing content");
    }

    const withTransaction = runtime.withTransaction;

    if (withTransaction === undefined) {
      throw new Error("decision corpus import DB smoke cannot inject transaction failure");
    }

    const failureImportId = `${input.smokeId}:atomic-failure`;
    const failureWithTransaction: NonNullable<typeof runtime.withTransaction> = async <T>(
      lockKey: string,
      work: (transactionRuntime: DatabaseRuntimeTransaction) => Promise<T>
    ): Promise<T> => withTransaction(lockKey, async (transactionRuntime) => {
        const createSourceDecision = transactionRuntime.sourceRepository.createSourceDecision;

        if (createSourceDecision === undefined) {
          throw new Error("decision corpus import DB smoke cannot inject decision failure");
        }

        let decisionWriteCount = 0;
        const failingSourceRepository = {
          ...transactionRuntime.sourceRepository,
          createSourceDecision: async (...args: Parameters<typeof createSourceDecision>) => {
            const sourceDecision = await createSourceDecision(...args);
            decisionWriteCount += 1;

            if (decisionWriteCount === 2) {
              throw new Error("decision corpus import DB smoke injected row failure");
            }

            return sourceDecision;
          }
        };

        return work({
          ...transactionRuntime,
          sourceRepository: failingSourceRepository
        });
      });
    const failureRuntime = {
      ...runtime,
      withTransaction: failureWithTransaction
    };
    let atomicFailureRolledBack = false;

    try {
      await persistSourceDecisionImport({
        runtime: failureRuntime,
        projectId,
        fixture,
        importId: failureImportId,
        smokeId: input.smokeId,
        importedBy: "krn db smoke decision-corpus-import atomic-failure",
        now: input.now,
        authorizedRepoRoot: input.repoRoot
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("injected row failure")) {
        const failureRows = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_artifacts
          where project_id = ${projectId}
            and import_id = ${failureImportId}
        `;
        atomicFailureRolledBack = (failureRows[0]?.count ?? 0) === 0;
      }
    }

    if (
      !replayStable ||
      replayPersistedArtifactCount !== fixture.decisions.length ||
      !changedReplayRejected ||
      !atomicFailureRolledBack
    ) {
      throw new Error("decision corpus import DB smoke failed replay or atomicity proof");
    }
    const firstCase = fixture.cases[0];

    if (firstCase === undefined) {
      throw new Error("decision corpus import DB smoke fixture requires at least one case");
    }

    const governingRow = requiredPersistedRow(persistedRows, firstCase.expectedDecisionId);
    const externalDecision = fixture.decisions.find((row) => row.evidenceRef === externalEvidenceRef);

    if (externalDecision === undefined) {
      throw new Error("decision corpus import DB smoke fixture requires captured URL evidence");
    }

    const externalEvidenceRow = requiredPersistedRow(persistedRows, externalDecision.id);

    if (
      governingRow.evidenceStatus !== "captured" ||
      governingRow.evidenceContentHash === undefined ||
      externalEvidenceRow.evidenceStatus !== "captured" ||
      externalEvidenceRow.evidenceContentHash === undefined
    ) {
      throw new Error("decision corpus import DB smoke did not read back captured evidence status and digest");
    }

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

    const staleDecision = fixture.decisions.find((row) => row.status === "stale");

    if (staleDecision === undefined) {
      throw new Error("decision corpus import DB smoke fixture requires a stale decision");
    }

    const staleRow = requiredPersistedRow(persistedRows, staleDecision.id);
    const staleSearchDocumentId = requireString(
      staleRow.searchDocumentId,
      "stale SearchDocument"
    );
    const staleSourceClaim = await runtime.sourceRepository.getSourceClaimById(
      staleRow.sourceClaimId
    );
    const getSourceDecisionById = runtime.sourceRepository.getSourceDecisionById;

    if (staleSourceClaim === undefined) {
      throw new Error("decision corpus import DB smoke missing stale SourceClaim readback");
    }

    if (getSourceDecisionById === undefined) {
      throw new Error("decision corpus import DB smoke cannot read stale SourceDecision");
    }

    const staleSourceDecision = await getSourceDecisionById(staleRow.sourceDecisionId);

    if (staleSourceDecision === undefined) {
      throw new Error("decision corpus import DB smoke missing stale SourceDecision readback");
    }

    const staleSourceDecisionEdges = await runtime.sourceRepository.listSourceDecisionEdgesForClaim(
      staleRow.sourceClaimId
    );
    const staleSourceClaimRevisitWhen = requireString(
      staleSourceClaim.revisitWhen,
      "stale SourceClaim revisitWhen"
    );
    const staleSearchDocumentRows = await client<{ validity_status: string }[]>`
      select validity_status
      from search_documents
      where id = ${staleSearchDocumentId}
    `;
    const staleSearchDocumentValidityStatus = staleSearchDocumentRows[0]?.validity_status;

    if (staleSearchDocumentValidityStatus === undefined) {
      throw new Error("decision corpus import DB smoke missing stale SearchDocument readback");
    }

    const staleSourceSearchJson = await runSmokeSourceSearch(
      input,
      createId,
      createSmokeDatabaseRuntime,
      staleDecision.statement,
      "decision-corpus-import stale DB smoke"
    );
    const sourceSearchSelectedStaleClaim = sourceSearchIncludesClaim(
      staleSourceSearchJson,
      staleRow.sourceClaimId
    );

    if (
      staleSourceClaim.status !== "deprecated" ||
      staleSourceDecision.status !== "defer" ||
      staleSearchDocumentValidityStatus !== "expired" ||
      staleSourceDecisionEdges.length !== 0 ||
      sourceSearchSelectedStaleClaim
    ) {
      throw new Error(
        "decision corpus import DB smoke allowed stale source decision authority"
      );
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
      replayStable,
      replayPersistedArtifactCount,
      changedReplayRejected,
      atomicFailureRolledBack,
      governingDecisionId: firstCase.expectedDecisionId,
      governingEvidenceStatus: governingRow.evidenceStatus,
      externalEvidenceStatus: externalEvidenceRow.evidenceStatus,
      governingSourceClaimId: governingRow.sourceClaimId,
      governingSourceDecisionEdgeId,
      governingSearchDocumentId,
      sourceSearchSelectedGoverningClaim,
      staleDecisionId: staleDecision.id,
      staleSourceClaimId: staleRow.sourceClaimId,
      staleSourceClaimStatus: staleSourceClaim.status,
      staleSourceClaimRevisitWhen,
      staleSourceDecisionStatus: staleSourceDecision.status,
      staleSearchDocumentId,
      staleSearchDocumentValidityStatus,
      staleSourceDecisionEdgeCount: staleSourceDecisionEdges.length,
      sourceSearchSelectedStaleClaim,
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
