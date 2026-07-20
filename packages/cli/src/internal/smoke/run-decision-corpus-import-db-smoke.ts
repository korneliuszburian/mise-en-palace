import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

import type {
  SourceDecisionImportReconciliationReport
} from "@krn/core/repositories/internal";
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
  evaluateSourceCoverage,
  type SourceCoverageReport
} from "../../source-coverage.js";
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
  readonly coverage: SourceCoverageReport;
  readonly replayStable: boolean;
  readonly replayPersistedArtifactCount: number;
  readonly partialTupleMutationRejected: boolean;
  readonly partialReplayRejected: boolean;
  readonly changedReplayRejected: boolean;
  readonly atomicFailureRolledBack: boolean;
  readonly reconciliation: SourceDecisionImportReconciliationReport;
  readonly reconciliationReadOnly: boolean;
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
const currentFixtureEvidenceRef = "KRN_ROADMAP.md";

const externalEvidenceRefForSmoke = (smokeId: string): string =>
  `${externalEvidenceRef}#krn-smoke=${encodeURIComponent(smokeId)}`;

interface ImportReconciliationTableCounts {
  readonly artifactCount: number;
  readonly chunkCount: number;
  readonly claimCount: number;
  readonly decisionCount: number;
  readonly decisionEdgeCount: number;
  readonly searchDocumentCount: number;
  readonly rejectionCount: number;
}

const importReconciliationTableCounts = async (
  client: ReturnType<typeof postgres>,
  projectId: string
): Promise<ImportReconciliationTableCounts> => {
  const rows = await client<ImportReconciliationTableCounts[]>`
    select
      (select count(*)::int from source_artifacts where project_id = ${projectId}) as "artifactCount",
      (
        select count(*)::int from source_chunks
        join source_artifacts on source_artifacts.id = source_chunks.source_artifact_id
        where source_artifacts.project_id = ${projectId}
      ) as "chunkCount",
      (
        select count(*)::int from source_claims
        join source_artifacts on source_artifacts.id = source_claims.source_artifact_id
        where source_artifacts.project_id = ${projectId}
      ) as "claimCount",
      (
        select count(*)::int from source_decisions
        join source_claims on source_claims.id = source_decisions.source_claim_id
        join source_artifacts on source_artifacts.id = source_claims.source_artifact_id
        where source_artifacts.project_id = ${projectId}
      ) as "decisionCount",
      (
        select count(*)::int from source_decision_edges
        join source_claims on source_claims.id = source_decision_edges.source_claim_id
        join source_artifacts on source_artifacts.id = source_claims.source_artifact_id
        where source_artifacts.project_id = ${projectId}
      ) as "decisionEdgeCount",
      (
        select count(*)::int from search_documents
        join source_claims on source_claims.id = search_documents.source_claim_id
        join source_artifacts on source_artifacts.id = source_claims.source_artifact_id
        where source_artifacts.project_id = ${projectId}
      ) as "searchDocumentCount",
      (
        select count(*)::int from source_rejections
        join source_claims on source_claims.id = source_rejections.source_claim_id
        join source_artifacts on source_artifacts.id = source_claims.source_artifact_id
        where source_artifacts.project_id = ${projectId}
      ) as "rejectionCount"
  `;
  const counts = rows[0];

  if (counts === undefined) {
    throw new Error("decision corpus import DB smoke missing reconciliation table counts");
  }

  return counts;
};

const hashCapturedEvidence = (content: string): string =>
  createHash("sha256").update(content, "utf8").digest("hex");

const smokeImportFixture = (
  fixture: ReturnType<typeof loadDecisionCorpusImportFixture>,
  smokeExternalEvidenceRef: string
): ReturnType<typeof loadDecisionCorpusImportFixture> => {
  const decisions = fixture.decisions.map((row) => {
    if (row.evidenceRef === externalEvidenceRef) {
      return { ...row, evidenceRef: smokeExternalEvidenceRef };
    }

    return row.status === "current" &&
      !row.evidenceRef.startsWith("http://") &&
      !row.evidenceRef.startsWith("https://")
      ? { ...row, evidenceRef: currentFixtureEvidenceRef }
      : row;
  });

  return {
    ...fixture,
    decisions,
    ...(fixture.coverageScope === undefined
      ? {}
      : {
          coverageScope: {
            declaredRows: fixture.coverageScope.declaredRows.map((declaredRow) => ({
              ...declaredRow,
              evidenceRefs: [
                decisions.find((row) => row.id === declaredRow.decisionId)?.evidenceRef ??
                  declaredRow.evidenceRefs[0] ??
                  ""
              ]
            }))
          }
        })
  };
};

const seedCapturedExternalEvidence = async (input: {
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>;
  projectId: string;
  smokeId: string;
  evidenceRef: string;
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
    uri: input.evidenceRef,
    title: "Decision corpus import external evidence fixture",
    contentHash,
    metadata: {
      smokeId: input.smokeId,
      captureKind: "source_evidence_fixture",
      sourceUri: externalEvidenceRef,
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

const smokeEvidenceResolver = (input: {
  readonly repoRoot: string;
  readonly runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>;
}) => async ({
  evidenceRef,
  now,
  projectId
}: {
  readonly evidenceRef: string;
  readonly now: string;
  readonly projectId: string;
}) => {
  if (evidenceRef !== currentFixtureEvidenceRef) {
    const sourceDecisionImportRepository = input.runtime.sourceDecisionImportRepository;

    if (sourceDecisionImportRepository === undefined) {
      throw new Error("decision corpus import DB smoke cannot read captured URL evidence");
    }

    return sourceDecisionImportRepository.getCapturedSourceEvidence({
      projectId,
      evidenceRef
    });
  }

  const evidencePath = path.join(input.repoRoot, evidenceRef);
  const content = await readFile(evidencePath, "utf8");

  return {
    status: "captured" as const,
    evidenceRef,
    content,
    contentHash: hashCapturedEvidence(content),
    capturedAt: now,
    freshness: "current" as const,
    provenance: {
      kind: "local_file" as const,
      uri: pathToFileURL(evidencePath).toString(),
      path: evidenceRef
    }
  };
};

type PersistDecisionCorpusImportInput =
  Omit<Parameters<typeof persistSourceDecisionImport>[0], "importId" | "importedBy"> & {
    readonly smokeId: string;
  };

export const persistDecisionCorpusImport = async (
  input: PersistDecisionCorpusImportInput
): Promise<readonly PersistedDecisionCorpusRow[]> => {
  const persisted = await persistSourceDecisionImport({
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

  return persisted.rows;
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

const requireSmokeEqual = (
  actual: unknown,
  expected: unknown,
  label: string
): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`decision corpus import DB smoke ${label} mismatch`);
  }
};

const requiredReconciledImport = (
  report: SourceDecisionImportReconciliationReport,
  importId: string
) => {
  const reconciledImport = report.imports.items.find((item) => item.importId === importId);

  if (reconciledImport === undefined) {
    throw new Error(`decision corpus import DB smoke missing reconciliation import ${importId}`);
  }

  return reconciledImport;
};

interface DecisionCorpusImportReconciliationProofInput {
  readonly client: ReturnType<typeof postgres>;
  readonly runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>;
  readonly projectId: string;
  readonly fixture: PersistDecisionCorpusImportInput["fixture"];
  readonly smokeId: string;
  readonly partialSmokeId: string;
  readonly partialSourceArtifactId: string;
  readonly partialDecisionId: string;
  readonly partialSourceChunkIds: readonly string[];
  readonly now: string;
  readonly repoRoot: string;
  readonly resolveEvidence: NonNullable<PersistDecisionCorpusImportInput["resolveEvidence"]>;
}

interface DecisionCorpusImportReconciliationProof {
  readonly reconciliation: SourceDecisionImportReconciliationReport;
  readonly reconciliationReadOnly: boolean;
}

const proveDecisionCorpusImportReconciliation = async (
  input: DecisionCorpusImportReconciliationProofInput
): Promise<DecisionCorpusImportReconciliationProof> => {
  const countsBefore = await importReconciliationTableCounts(input.client, input.projectId);
  const withReadSnapshot = input.runtime.withSourceDecisionImportReadSnapshot;

  if (withReadSnapshot === undefined) {
    throw new Error("decision corpus import DB smoke missing reconciliation read snapshot");
  }

  const readback = await withReadSnapshot(async (repository) => {
    return {
      full: await repository.listSourceDecisionImportReconciliation({
        projectId: input.projectId,
        limit: 10
      }),
      bounded: await repository.listSourceDecisionImportReconciliation({
        projectId: input.projectId,
        limit: 1
      }),
      paged: await repository.listSourceDecisionImportReconciliation({
        projectId: input.projectId,
        limit: 1,
        afterImportId: input.smokeId
      })
    };
  });
  const currentImport = requiredReconciledImport(readback.full, input.smokeId);
  const partialImport = requiredReconciledImport(readback.full, input.partialSmokeId);
  const boundedImport = requiredReconciledImport(readback.bounded, input.smokeId);
  const pagedImport = requiredReconciledImport(readback.paged, input.partialSmokeId);
  const decisionCount = input.fixture.decisions.length;
  const partialRow = partialImport.rows.items.find(
    (row) => row.sourceArtifactId === input.partialSourceArtifactId
  );

  if (partialRow === undefined) {
    throw new Error("decision corpus import DB smoke missing partial tuple diagnostics");
  }

  requireSmokeEqual(readback.full.imports.truncated, false, "full reconciliation truncation");
  requireSmokeEqual(readback.full.imports.totalCount, 2, "full reconciliation total count");
  requireSmokeEqual(readback.full.imports.returnedCount, 2, "full reconciliation import count");
  requireSmokeEqual(currentImport.lifecycle, "complete", "current import lifecycle");
  requireSmokeEqual(currentImport.rowCount, decisionCount, "current import row count");
  requireSmokeEqual(currentImport.completeRowCount, decisionCount, "current complete row count");
  requireSmokeEqual(currentImport.partialRowCount, 0, "current partial row count");
  requireSmokeEqual(
    currentImport.equivalentImportIds.items,
    [],
    "current equivalent import IDs"
  );
  requireSmokeEqual(partialImport.lifecycle, "partial", "partial import lifecycle");
  requireSmokeEqual(partialImport.rowCount, decisionCount, "partial import row count");
  requireSmokeEqual(partialImport.completeRowCount, decisionCount - 1, "partial complete row count");
  requireSmokeEqual(partialImport.partialRowCount, 1, "partial row count");
  requireSmokeEqual(partialRow.decisionId, input.partialDecisionId, "partial decision identity");
  requireSmokeEqual(partialRow.lifecycle, "partial", "partial tuple lifecycle");
  requireSmokeEqual(
    partialRow.violations,
    [
      "source_chunk_cardinality",
      "search_document_cardinality"
    ],
    "partial tuple violations"
  );
  requireSmokeEqual(
    partialRow.components.sourceChunks.totalCount,
    2,
    "partial tuple chunk count"
  );
  requireSmokeEqual(
    partialRow.components.sourceChunks.items,
    [...input.partialSourceChunkIds].sort(),
    "partial tuple chunk IDs"
  );
  requireSmokeEqual(
    partialRow.components.searchDocuments.totalCount,
    0,
    "partial tuple search document count"
  );
  requireSmokeEqual(readback.bounded.imports.truncated, true, "bounded reconciliation truncation");
  requireSmokeEqual(readback.bounded.imports.returnedCount, 1, "bounded import count");
  requireSmokeEqual(readback.bounded.afterImportId, null, "bounded reconciliation cursor start");
  requireSmokeEqual(
    readback.bounded.nextAfterImportId,
    input.smokeId,
    "bounded reconciliation next cursor"
  );
  requireSmokeEqual(
    boundedImport.equivalentImportIds.items,
    [],
    "bounded equivalent import IDs"
  );
  requireSmokeEqual(readback.paged.afterImportId, input.smokeId, "paged reconciliation cursor");
  requireSmokeEqual(readback.paged.imports.totalCount, 1, "paged reconciliation remaining count");
  requireSmokeEqual(readback.paged.imports.returnedCount, 1, "paged reconciliation import count");
  requireSmokeEqual(
    readback.paged.nextAfterImportId,
    null,
    "paged reconciliation next cursor"
  );
  requireSmokeEqual(pagedImport.importId, input.partialSmokeId, "paged reconciliation import ID");
  const countsAfter = await importReconciliationTableCounts(input.client, input.projectId);
  const reconciliationReadOnly = JSON.stringify(countsAfter) === JSON.stringify(countsBefore);

  if (!reconciliationReadOnly) {
    throw new Error("decision corpus import DB smoke reconciliation mutated persisted state");
  }

  return {
    reconciliation: readback.full,
    reconciliationReadOnly
  };
};

export const runDecisionCorpusImportDbSmokeCheck = async (
  input: DecisionCorpusImportDbSmokeInput
): Promise<DecisionCorpusImportDbSmokeReport> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const createId = createUniqueSmokeCreateId(input.smokeId);
  const cleanupSmokeIds = [
    `${input.smokeId}-partial-replay`,
    input.smokeId
  ];
  let runtime: Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;
  let primaryError: unknown;

  try {
    await cleanupSourceSmokeMarkers(client, markerTables, input.smokeId, smokeSource);
    runtime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: input.smokeId,
      requireProjectKernelForExplicitProject: false,
      now: () => input.now,
      createId
    });
    const projectId = runtime.projectId;
    const smokeExternalEvidenceRef = externalEvidenceRefForSmoke(input.smokeId);
    const fixture = smokeImportFixture(
      loadDecisionCorpusImportFixture(
        `${input.repoRoot}/tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json`
      ),
      smokeExternalEvidenceRef
    );
    await seedCapturedExternalEvidence({
      runtime,
      projectId,
      smokeId: input.smokeId,
      evidenceRef: smokeExternalEvidenceRef
    });
    const resolveEvidence = smokeEvidenceResolver({
      repoRoot: input.repoRoot,
      runtime
    });
    const persistedRows = await persistDecisionCorpusImport({
      runtime,
      projectId,
      fixture,
      smokeId: input.smokeId,
      now: input.now,
      authorizedRepoRoot: input.repoRoot,
      resolveEvidence
    });
    const replayRows = await persistDecisionCorpusImport({
      runtime,
      projectId,
      fixture,
      smokeId: input.smokeId,
      now: input.now,
      authorizedRepoRoot: input.repoRoot,
      resolveEvidence
    });
    const replayStable = JSON.stringify(replayRows) === JSON.stringify(persistedRows);
    const replayArtifactRows = await client<{ count: number }[]>`
      select count(*)::int as count
      from source_artifacts
      where project_id = ${projectId}
        and import_id = ${input.smokeId}
    `;
    const replayPersistedArtifactCount = replayArtifactRows[0]?.count ?? 0;
    const partialSmokeId = `${input.smokeId}-partial-replay`;
    const partialFixture = {
      ...fixture,
      decisions: fixture.decisions.map((row) => ({
        ...row,
        noteText: `${row.noteText} partial-replay-falsifier`
      }))
    };
    const partialRows = await persistDecisionCorpusImport({
      runtime,
      projectId,
      fixture: partialFixture,
      smokeId: partialSmokeId,
      now: input.now,
      authorizedRepoRoot: input.repoRoot,
      resolveEvidence
    });
    const partialCurrentRow = partialRows.find((row) =>
      row.sourceDecisionEdgeId !== undefined && row.searchDocumentId !== undefined
    );
    if (partialCurrentRow?.searchDocumentId === undefined) {
      throw new Error("decision corpus import DB smoke missing current row for partial replay falsifier");
    }
    const duplicateChunkRows = await client<{ id: string }[]>`
      insert into source_chunks (
        source_artifact_id,
        ordinal,
        heading,
        content,
        token_count,
        content_hash,
        metadata
      )
      select
        source_artifact_id,
        ordinal + 1000,
        heading,
        content,
        token_count,
        content_hash,
        metadata
      from source_chunks
      where id = ${partialCurrentRow.sourceChunkId}
      returning id
    `;
    const duplicateChunkId = duplicateChunkRows[0]?.id;

    if (duplicateChunkId === undefined) {
      throw new Error("decision corpus import DB smoke failed to duplicate partial tuple chunk");
    }

    await client`
      delete from search_documents
      where id = ${partialCurrentRow.searchDocumentId}
    `;
    let partialTupleMutationRejected = false;
    try {
      await client`
        update source_artifacts
        set import_row_id = null
        where id = ${partialCurrentRow.sourceArtifactId}
      `;
    } catch (error) {
      partialTupleMutationRejected = error instanceof Error &&
        error.message.includes("source_artifacts_import_tuple_complete");
    }
    let partialReplayRejected = false;
    try {
      await persistDecisionCorpusImport({
        runtime,
        projectId,
        fixture: partialFixture,
        smokeId: partialSmokeId,
        now: input.now,
        authorizedRepoRoot: input.repoRoot,
        resolveEvidence
      });
    } catch (error) {
      partialReplayRejected = error instanceof Error &&
        error.message.includes("partial existing records");
    }
    const reconciliationProof = await proveDecisionCorpusImportReconciliation({
      client,
      runtime,
      projectId,
      fixture,
      smokeId: input.smokeId,
      partialSmokeId,
      partialSourceArtifactId: partialCurrentRow.sourceArtifactId,
      partialDecisionId: partialCurrentRow.decisionId,
      partialSourceChunkIds: [partialCurrentRow.sourceChunkId, duplicateChunkId],
      now: input.now,
      repoRoot: input.repoRoot,
      resolveEvidence
    });
    const { reconciliation, reconciliationReadOnly } = reconciliationProof;
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
        authorizedRepoRoot: input.repoRoot,
        resolveEvidence
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
    const failureFixture = {
      ...fixture,
      decisions: fixture.decisions.map((row) => ({
        ...row,
        noteText: `${row.noteText} atomic-failure-falsifier`
      }))
    };
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
        fixture: failureFixture,
        importId: failureImportId,
        smokeId: input.smokeId,
        importedBy: "krn db smoke decision-corpus-import atomic-failure",
        now: input.now,
        authorizedRepoRoot: input.repoRoot,
        resolveEvidence
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
      !partialTupleMutationRejected ||
      !partialReplayRejected ||
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
    const externalDecision = fixture.decisions.find(
      (row) => row.evidenceRef === smokeExternalEvidenceRef
    );

    if (externalDecision === undefined) {
      throw new Error("decision corpus import DB smoke fixture requires captured URL evidence");
    }

    const externalEvidenceRow = requiredPersistedRow(persistedRows, externalDecision.id);

    if (
      governingRow.evidenceStatus !== "captured" ||
      governingRow.evidenceContentHash === undefined ||
      governingRow.evidenceCapturedAt === undefined ||
      governingRow.evidenceProvenance === undefined ||
      externalEvidenceRow.evidenceStatus !== "captured" ||
      externalEvidenceRow.evidenceContentHash === undefined ||
      externalEvidenceRow.evidenceCapturedAt === undefined ||
      externalEvidenceRow.evidenceProvenance === undefined
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

    const coverage = evaluateSourceCoverage({
      ...(fixture.coverageScope === undefined ? {} : { scope: fixture.coverageScope }),
      evidence: persistedRows.map((row) => ({
        decisionId: row.decisionId,
        evidenceRef: row.evidenceRef,
        status: row.evidenceStatus,
        ...(row.evidenceCapturedAt === undefined ? {} : { capturedAt: row.evidenceCapturedAt }),
        ...(row.evidenceContentHash === undefined ? {} : { contentHash: row.evidenceContentHash }),
        freshness: row.evidenceFreshness,
        ...(row.evidenceProvenance === undefined ? {} : { provenance: row.evidenceProvenance }),
        ...(row.evidenceReason === undefined ? {} : { reason: row.evidenceReason })
      }))
    });

    await cleanupSourceSmokeMarkers(client, markerTables, partialSmokeId, smokeSource);
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
      coverage,
      replayStable,
      replayPersistedArtifactCount,
      partialTupleMutationRejected,
      partialReplayRejected,
      changedReplayRejected,
      atomicFailureRolledBack,
      reconciliation,
      reconciliationReadOnly,
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
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    let finalizationError: unknown;

    try {
      for (const smokeId of cleanupSmokeIds) {
        await cleanupSourceSmokeMarkers(client, markerTables, smokeId, smokeSource);
      }
      if (runtime !== undefined) {
        await client`delete from projects where id = ${runtime.projectId}`;
      }
    } catch (error) {
      finalizationError = error;
    }

    try {
      await closeSmokeRuntimeAndClient(runtime, client);
    } catch (error) {
      if (finalizationError === undefined) {
        finalizationError = error;
      }
    }

    if (primaryError === undefined && finalizationError !== undefined) {
      throw finalizationError;
    }
  }
};
