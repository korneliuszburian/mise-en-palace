import type {
  ProjectId
} from "@krn/core";
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
  "sourceRepository" | "retrievalRepository"
>;
type SourceDecisionImportSourceRepository = SourceDecisionImportRuntime["sourceRepository"];
type SourceDecisionImportRetrievalRepository =
  NonNullable<SourceDecisionImportRuntime["retrievalRepository"]>;
type CreateSourceDecision =
  NonNullable<SourceDecisionImportSourceRepository["createSourceDecision"]>;

interface SourceDecisionImportRepositories {
  readonly retrievalRepository: SourceDecisionImportRetrievalRepository;
  readonly createSourceDecision: CreateSourceDecision;
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

const metadataForRow = (
  input: PersistSourceDecisionImportInput,
  row: DecisionCorpusImportRow
): Record<string, unknown> => ({
  importId: input.importId,
  ...(input.smokeId === undefined ? {} : { smokeId: input.smokeId }),
  importedBy: input.importedBy,
  importedAt: input.now,
  decisionCorpusImportId: row.id,
  decisionCorpusStatus: row.status,
  evidenceRef: row.evidenceRef
});

const createSourceArtifactAndChunk = async (
  sourceRepository: SourceDecisionImportSourceRepository,
  projectId: ProjectId,
  row: DecisionCorpusImportRow,
  metadata: Record<string, unknown>
) => {
  if (sourceRepository.createSourceChunk === undefined) {
    throw new Error("SourceChunk creation is unavailable for source decision import");
  }

  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId,
    kind: "doc",
    sourceAuthority: "project-decision",
    uri: `source-decision-import://${row.id}`,
    title: row.title,
    contentHash: `source-decision-import:${row.id}`,
    metadata
  });
  const sourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    heading: row.title,
    content: `${row.statement}\n\n${row.noteText}`,
    tokenCount: row.statement.split(/\s+/u).length + row.noteText.split(/\s+/u).length,
    contentHash: `source-decision-import:${row.id}:chunk`,
    metadata
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
        targetId: `source-decision-import:${input.row.id}`,
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

  return {
    retrievalRepository: runtime.retrievalRepository,
    createSourceDecision: createSourceDecision.bind(runtime.sourceRepository)
  };
};

export const persistSourceDecisionImport = async (
  input: PersistSourceDecisionImportInput
): Promise<readonly PersistedSourceDecisionImportRow[]> => {
  const sourceRepository = input.runtime.sourceRepository;
  const {
    retrievalRepository,
    createSourceDecision
  } = assertImportRepositories(input.runtime);

  validateSourceDecisionImportFixture(input.fixture);

  if (
    input.fixture.decisions.some((row) => row.status === "stale") &&
    sourceRepository.deprecateSourceClaim === undefined
  ) {
    throw new Error("SourceClaim deprecation is unavailable for stale source decision import");
  }

  return Promise.all(input.fixture.decisions.map(async (row) => {
    const metadata = metadataForRow(input, row);
    const { sourceArtifact, sourceChunk } = await createSourceArtifactAndChunk(
      sourceRepository,
      input.projectId,
      row,
      metadata
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
      metadata
    });
    const sourceDecision = await createSourceDecision({
      projectId: input.projectId,
      sourceClaimId: sourceClaim.id,
      status: row.status === "rejected"
        ? "reject"
        : row.status === "stale"
          ? "defer"
          : "adopt",
      decision: row.statement,
      rationale: row.noteText,
      falsifier: row.falsifier,
      consumer: "source decision import",
      metadata
    });
    if (row.status === "stale") {
      await sourceRepository.deprecateSourceClaim!({
        sourceClaimId: sourceClaim.id,
        revisitWhen: "Refresh imported decision evidence before future activation."
      });
    }
    const sourceClaimReadback = await sourceRepository.getSourceClaimById(sourceClaim.id);

    if (sourceClaimReadback === undefined) {
      throw new Error(`missing SourceClaim readback for imported decision ${row.id}`);
    }

    if (row.status === "rejected") {
      const sourceRejectionId = await createRejectedPath({
        sourceRepository,
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
        sourceRepository,
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
