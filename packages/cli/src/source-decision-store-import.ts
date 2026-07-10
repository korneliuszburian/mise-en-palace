import { createHash } from "node:crypto";

import type {
  ProjectId,
  SourceClaim,
  SourceDecision
} from "@krn/core";
import type {
  SourceDecisionImportLookup,
  SourceDecisionImportReadback,
  SourceDecisionImportRepository
} from "@krn/core/repositories/internal";
import type {
  DecisionCorpusImportFixture,
  DecisionCorpusImportRow
} from "./internal/eval/run-decision-corpus-import.js";
import {
  buildImportedDecisionCorpus
} from "./internal/eval/run-decision-corpus-import.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";
import {
  loadDecisionPacketEvalFixture
} from "./decision-packet-fixture.js";

type SourceDecisionImportRuntime = Pick<
  DatabaseRuntime,
  | "sourceRepository"
  | "retrievalRepository"
  | "sourceDecisionImportRepository"
  | "withTransaction"
>;
type SourceDecisionImportSourceRepository = SourceDecisionImportRuntime["sourceRepository"];
type SourceDecisionImportRetrievalRepository =
  NonNullable<SourceDecisionImportRuntime["retrievalRepository"]>;
type CreateSourceDecision =
  NonNullable<SourceDecisionImportSourceRepository["createSourceDecision"]>;
type WithDatabaseTransaction = NonNullable<DatabaseRuntime["withTransaction"]>;

interface SourceDecisionImportRepositories {
  readonly retrievalRepository: SourceDecisionImportRetrievalRepository;
  readonly createSourceDecision: CreateSourceDecision;
  readonly sourceDecisionImportRepository: SourceDecisionImportRepository;
  readonly withTransaction: WithDatabaseTransaction;
}

interface PreparedSourceDecisionImportRow {
  readonly row: DecisionCorpusImportRow;
  readonly metadata: Record<string, unknown>;
  readonly evidenceRef: string;
  readonly uri: string;
  readonly artifactContentHash: string;
  readonly chunkContent: string;
  readonly chunkContentHash: string;
}

export interface PersistedSourceDecisionImportRow {
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

export interface PersistSourceDecisionImportInput {
  readonly runtime: SourceDecisionImportRuntime;
  readonly projectId: ProjectId;
  readonly fixture: DecisionCorpusImportFixture;
  readonly importId: string;
  readonly smokeId?: string;
  readonly importedBy: string;
  readonly now: string;
}

export interface SourceDecisionImportCounts {
  readonly decisionCount: number;
  readonly caseCount: number;
  readonly currentDecisionCount: number;
  readonly staleDecisionCount: number;
  readonly rejectedDecisionCount: number;
}

export const sourceDecisionImportCounts = (
  fixture: DecisionCorpusImportFixture
): SourceDecisionImportCounts => ({
  decisionCount: fixture.decisions.length,
  caseCount: fixture.cases.length,
  currentDecisionCount: fixture.decisions.filter((row) => row.status === "current").length,
  staleDecisionCount: fixture.decisions.filter((row) => row.status === "stale").length,
  rejectedDecisionCount: fixture.decisions.filter((row) => row.status === "rejected").length
});

export const validateSourceDecisionImportFixture = (
  fixture: DecisionCorpusImportFixture
): void => {
  const base = loadDecisionPacketEvalFixture(fixture.baseFixturePath);

  buildImportedDecisionCorpus(fixture, base);
};

const normalizeImportText = (value: string): string =>
  value.replace(/\r\n?/gu, "\n").trim().replace(/[ \t]+/gu, " ");

const contentHash = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const resolveEvidenceRef = (value: string, decisionId: string): string => {
  const evidenceRef = normalizeImportText(value);

  if (evidenceRef.length === 0) {
    throw new Error(`decision ${decisionId} has an empty evidenceRef`);
  }

  if (evidenceRef.startsWith("https://") || evidenceRef.startsWith("http://")) {
    try {
      const url = new URL(evidenceRef);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("unsupported URL protocol");
      }
    } catch {
      throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
    }

    return evidenceRef;
  }

  if (
    /^run-evidence\/[A-Za-z0-9][A-Za-z0-9._/-]*\.md(?:#[A-Za-z0-9._/-]+)?$/u.test(evidenceRef) ||
    /^KRN_ROADMAP\.md(?::[1-9][0-9]*)?(?:#[A-Za-z0-9._/-]+)?$/u.test(evidenceRef)
  ) {
    return evidenceRef;
  }

  throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
};

const metadataForRow = (
  input: PersistSourceDecisionImportInput,
  row: DecisionCorpusImportRow,
  evidenceRef: string
): Record<string, unknown> => ({
  importId: input.importId,
  ...(input.smokeId === undefined ? {} : { smokeId: input.smokeId }),
  importedBy: input.importedBy,
  importedAt: input.now,
  decisionCorpusImportId: row.id,
  decisionCorpusStatus: row.status,
  evidenceRef
});

const prepareImportRows = (
  input: PersistSourceDecisionImportInput
): readonly PreparedSourceDecisionImportRow[] => input.fixture.decisions.map((row) => {
  const evidenceRef = resolveEvidenceRef(row.evidenceRef, row.id);
  const normalizedRow = JSON.stringify({
    doesNotProve: normalizeImportText(row.doesNotProve),
    evidenceRef,
    falsifier: normalizeImportText(row.falsifier),
    noteText: normalizeImportText(row.noteText),
    status: row.status,
    statement: normalizeImportText(row.statement),
    taskScopes: row.taskScopes.map(normalizeImportText),
    title: normalizeImportText(row.title)
  });
  const chunkContent = `${normalizeImportText(row.statement)}\n\n${normalizeImportText(row.noteText)}`;

  return {
    row,
    metadata: metadataForRow(input, row, evidenceRef),
    evidenceRef,
    uri: `source-decision-import://${input.importId}/${row.id}`,
    artifactContentHash: contentHash(`krn.source-decision-import.v1\n${normalizedRow}`),
    chunkContent,
    chunkContentHash: contentHash(`krn.source-decision-import.chunk.v1\n${chunkContent}`)
  };
});

const createSourceArtifactAndChunk = async (
  sourceRepository: SourceDecisionImportSourceRepository,
  projectId: ProjectId,
  importId: string,
  prepared: PreparedSourceDecisionImportRow
) => {
  if (sourceRepository.createSourceChunk === undefined) {
    throw new Error("SourceChunk creation is unavailable for source decision import");
  }

  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId,
    kind: "doc",
    sourceAuthority: "project-decision",
    uri: prepared.uri,
    title: prepared.row.title,
    contentHash: prepared.artifactContentHash,
    importId,
    importRowId: prepared.row.id,
    metadata: prepared.metadata
  });
  const sourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    heading: prepared.row.title,
    content: prepared.chunkContent,
    tokenCount: prepared.chunkContent.split(/\s+/u).length,
    contentHash: prepared.chunkContentHash,
    metadata: prepared.metadata
  });

  return { sourceArtifact, sourceChunk };
};

const createDecisionSupport = async (
  input: {
    readonly sourceRepository: SourceDecisionImportSourceRepository;
    readonly retrievalRepository: SourceDecisionImportRetrievalRepository;
    readonly projectId: ProjectId;
    readonly row: DecisionCorpusImportRow;
    readonly sourceArtifactId: string;
    readonly sourceChunkId: string;
    readonly sourceClaimId: string;
    readonly sourceDecisionId: string;
    readonly metadata: Record<string, unknown>;
  }
): Promise<Pick<PersistedSourceDecisionImportRow, "sourceDecisionEdgeId" | "searchDocumentId">> => {
  const searchDocument = await input.retrievalRepository.createSearchDocument({
    projectId: input.projectId,
    subjectType: "source_claim",
    subjectId: input.sourceClaimId,
    sourceArtifactId: input.sourceArtifactId,
    sourceChunkId: input.sourceChunkId,
    sourceClaimId: input.sourceClaimId,
    sourceDecisionId: input.sourceDecisionId,
    sourceAuthority: "project-decision",
    validityStatus: input.row.status === "stale" ? "expired" : "active",
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
      importId: input.metadata["importId"],
      decisionCorpusStatus: input.row.status
    },
    metadata: {
      ...input.metadata,
      sourceDecisionId: input.sourceDecisionId
    }
  });
  const sourceDecisionEdge = input.row.status === "current"
    ? await input.sourceRepository.createSourceDecisionEdge({
        sourceClaimId: input.sourceClaimId,
        targetType: "architecture_decision",
        targetId: `source-decision-import:${input.metadata["importId"]}:${input.row.id}`,
        supportType: "implementation-boundary",
        confidence: "high",
        notes: input.row.noteText,
        metadata: {
          ...input.metadata,
          sourceDecisionId: input.sourceDecisionId
        }
      })
    : undefined;

  return {
    ...(sourceDecisionEdge === undefined ? {} : { sourceDecisionEdgeId: sourceDecisionEdge.id }),
    searchDocumentId: searchDocument.id
  };
};

const createRejectedPath = async (
  input: {
    readonly sourceRepository: SourceDecisionImportSourceRepository;
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
    consumer: "source decision import",
    metadata: input.metadata
  });

  return sourceRejection.id;
};

const assertImportRepositories = (
  runtime: SourceDecisionImportRuntime
): SourceDecisionImportRepositories => {
  const createSourceDecision = runtime.sourceRepository.createSourceDecision;

  if (createSourceDecision === undefined) {
    throw new Error("SourceDecision creation is unavailable for source decision import");
  }

  if (runtime.retrievalRepository === undefined) {
    throw new Error("SearchDocument creation is unavailable for source decision import");
  }

  if (runtime.sourceRepository.createSourceChunk === undefined) {
    throw new Error("SourceChunk creation is unavailable for source decision import");
  }

  if (runtime.sourceDecisionImportRepository === undefined) {
    throw new Error("Source decision import readback is unavailable");
  }

  if (runtime.withTransaction === undefined) {
    throw new Error("Source decision import transaction is unavailable");
  }

  return {
    retrievalRepository: runtime.retrievalRepository,
    createSourceDecision: createSourceDecision.bind(runtime.sourceRepository),
    sourceDecisionImportRepository: runtime.sourceDecisionImportRepository,
    withTransaction: runtime.withTransaction
  };
};

const persistedRowFromReadback = (
  row: SourceDecisionImportReadback
): PersistedSourceDecisionImportRow => ({
  decisionId: row.decisionId,
  sourceArtifactId: row.sourceArtifactId,
  sourceChunkId: row.sourceChunkId,
  sourceClaimId: row.sourceClaimId,
  sourceClaimStatus: row.sourceClaimStatus,
  sourceDecisionId: row.sourceDecisionId,
  sourceDecisionStatus: row.sourceDecisionStatus,
  ...(row.sourceDecisionEdgeId === undefined
    ? {}
    : { sourceDecisionEdgeId: row.sourceDecisionEdgeId }),
  ...(row.searchDocumentId === undefined ? {} : { searchDocumentId: row.searchDocumentId }),
  ...(row.sourceRejectionId === undefined ? {} : { sourceRejectionId: row.sourceRejectionId })
});

const expectedDecisionStatusFor = (
  row: DecisionCorpusImportRow
): SourceDecision["status"] =>
  row.status === "rejected" ? "reject" : row.status === "stale" ? "defer" : "adopt";

const expectedClaimStatusFor = (
  row: DecisionCorpusImportRow
): SourceClaim["status"] =>
  row.status === "rejected" ? "rejected" : row.status === "stale" ? "deprecated" : "accepted";

const existingImportRows = async (
  repository: SourceDecisionImportRepository,
  projectId: ProjectId,
  importId: string,
  preparedRows: readonly PreparedSourceDecisionImportRow[]
): Promise<readonly PersistedSourceDecisionImportRow[] | undefined> => {
  const lookups = await Promise.all(preparedRows.map((prepared) =>
    repository.getSourceDecisionImportRow({
      projectId,
      importId,
      decisionId: prepared.row.id
    })
  ));
  const existing = lookups.filter((lookup): lookup is Extract<SourceDecisionImportLookup, { status: "complete" | "partial" }> =>
    lookup.status !== "missing"
  );

  if (existing.length === 0) {
    return undefined;
  }

  const partial = existing.filter((lookup) => lookup.status === "partial");
  const complete = existing.filter((lookup): lookup is Extract<SourceDecisionImportLookup, { status: "complete" }> =>
    lookup.status === "complete"
  );
  const missing = lookups.filter((lookup) => lookup.status === "missing");

  if (partial.length > 0 || missing.length > 0) {
    const existingIds = [
      ...partial.map((lookup) => lookup.sourceArtifactId),
      ...complete.map((lookup) => lookup.row.decisionId)
    ];

    throw new Error(
      `source decision import ${importId} has partial existing records; conflicting rows: ${existingIds.join(", ")}`
    );
  }

  const completeRows = complete.map((lookup) => lookup.row);
  const preparedById = new Map(preparedRows.map((prepared) => [prepared.row.id, prepared]));
  const conflicts = completeRows.filter((row) => {
    const prepared = preparedById.get(row.decisionId);

    return prepared === undefined ||
      row.contentHash !== prepared.artifactContentHash ||
      row.sourceClaimStatus !== expectedClaimStatusFor(prepared.row) ||
      row.sourceDecisionStatus !== expectedDecisionStatusFor(prepared.row);
  });

  if (conflicts.length > 0) {
    throw new Error(
      `source decision import ${importId} conflicts with existing content: ${conflicts
        .map((row) => row.decisionId)
        .join(", ")}`
    );
  }

  const rowsById = new Map(completeRows.map((row) => [row.decisionId, row]));

  return preparedRows.map((prepared) => {
    const row = rowsById.get(prepared.row.id);

    if (row === undefined) {
      throw new Error(`source decision import ${importId} missing replay row ${prepared.row.id}`);
    }

    return persistedRowFromReadback(row);
  });
};

const persistSourceDecisionImportRows = async (
  input: {
    readonly runtime: Pick<DatabaseRuntime, "sourceRepository" | "retrievalRepository">;
    readonly projectId: ProjectId;
    readonly importId: string;
    readonly preparedRows: readonly PreparedSourceDecisionImportRow[];
  }
): Promise<readonly PersistedSourceDecisionImportRow[]> => {
  const sourceRepository = input.runtime.sourceRepository;
  const retrievalRepository = input.runtime.retrievalRepository;
  const createSourceDecision = sourceRepository.createSourceDecision;

  if (createSourceDecision === undefined || retrievalRepository === undefined) {
    throw new Error("Source decision import write repositories are unavailable");
  }

  const rows: PersistedSourceDecisionImportRow[] = [];

  for (const prepared of input.preparedRows) {
    const row = prepared.row;
    const { sourceArtifact, sourceChunk } = await createSourceArtifactAndChunk(
      sourceRepository,
      input.projectId,
      input.importId,
      prepared
    );
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      claim: row.statement,
      mechanism: row.noteText,
      krnImplication: row.statement,
      doesNotProve: row.doesNotProve,
      sourceAuthority: "project-decision",
      supportType: row.status === "rejected" ? "rejection" : "implementation-boundary",
      consumer: "source decision import",
      falsifier: row.falsifier,
      metadata: prepared.metadata
    });
    const sourceDecision = await createSourceDecision({
      projectId: input.projectId,
      sourceClaimId: sourceClaim.id,
      status: expectedDecisionStatusFor(row),
      decision: row.statement,
      rationale: row.noteText,
      falsifier: row.falsifier,
      consumer: "source decision import",
      metadata: prepared.metadata
    });

    if (row.status === "stale") {
      if (sourceRepository.deprecateSourceClaim === undefined) {
        throw new Error("SourceClaim deprecation is unavailable for stale source decision import");
      }

      await sourceRepository.deprecateSourceClaim({
        sourceClaimId: sourceClaim.id,
        revisitWhen: "Refresh imported decision evidence before future activation."
      });
    }

    const sourceClaimReadback = await sourceRepository.getSourceClaimById(sourceClaim.id);

    if (sourceClaimReadback === undefined) {
      throw new Error(`missing SourceClaim readback for imported decision ${row.id}`);
    }

    if (row.status === "rejected") {
      rows.push({
        decisionId: row.id,
        sourceArtifactId: sourceArtifact.id,
        sourceChunkId: sourceChunk.id,
        sourceClaimId: sourceClaim.id,
        sourceClaimStatus: sourceClaimReadback.status,
        sourceDecisionId: sourceDecision.id,
        sourceDecisionStatus: sourceDecision.status,
        sourceRejectionId: await createRejectedPath({
          sourceRepository,
          projectId: input.projectId,
          row,
          sourceArtifactId: sourceArtifact.id,
          sourceClaimId: sourceClaim.id,
          metadata: prepared.metadata
        })
      });
      continue;
    }

    rows.push({
      decisionId: row.id,
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      sourceClaimId: sourceClaim.id,
      sourceClaimStatus: sourceClaimReadback.status,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionStatus: sourceDecision.status,
      ...await createDecisionSupport({
        sourceRepository,
        retrievalRepository,
        projectId: input.projectId,
        row,
        sourceArtifactId: sourceArtifact.id,
        sourceChunkId: sourceChunk.id,
        sourceClaimId: sourceClaim.id,
        sourceDecisionId: sourceDecision.id,
        metadata: prepared.metadata
      })
    });
  }

  return rows;
};

export const persistSourceDecisionImport = async (
  input: PersistSourceDecisionImportInput
): Promise<readonly PersistedSourceDecisionImportRow[]> => {
  validateSourceDecisionImportFixture(input.fixture);
  const preparedRows = prepareImportRows(input);

  if (
    preparedRows.some((prepared) => prepared.row.status === "stale") &&
    input.runtime.sourceRepository.deprecateSourceClaim === undefined
  ) {
    throw new Error("SourceClaim deprecation is unavailable for source decision import");
  }

  const repositories = assertImportRepositories(input.runtime);

  return repositories.withTransaction(input.importId, async (transactionRuntime) => {
    if (transactionRuntime.sourceDecisionImportRepository === undefined) {
      throw new Error("Source decision import transaction readback is unavailable");
    }

    const existingRows = await existingImportRows(
      transactionRuntime.sourceDecisionImportRepository,
      input.projectId,
      input.importId,
      preparedRows
    );

    if (existingRows !== undefined) {
      return existingRows;
    }

    return persistSourceDecisionImportRows({
      runtime: transactionRuntime,
      projectId: input.projectId,
      importId: input.importId,
      preparedRows
    });
  });
};
