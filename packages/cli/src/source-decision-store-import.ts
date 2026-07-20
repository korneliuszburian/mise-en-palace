import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import {
  decisionPacketSupportingEvidenceMaxCharacters,
  type ProjectId,
  type SourceClaim,
  type SourceDecision
} from "@krn/core";
import type {
  SourceDecisionEvidenceFreshness,
  SourceDecisionEvidenceLookup,
  SourceDecisionImportLookup,
  SourceDecisionImportReadback,
  SourceDecisionImportRepository
} from "@krn/core/repositories/internal";
import type {
  ReviewedSourceDecisionCorpus,
  ReviewedSourceDecisionRow
} from "./reviewed-source-decision-corpus.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";

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
  readonly row: ReviewedSourceDecisionRow;
  readonly authorityLifecycleStatus: ReviewedSourceDecisionRow["status"];
  readonly evidenceRef: string;
  readonly metadata: Record<string, unknown>;
  readonly evidenceStatus: SourceDecisionEvidenceLookup["status"];
  readonly evidenceContentHash?: string;
  readonly evidenceCapturedAt?: string;
  readonly evidenceFreshness: SourceDecisionEvidenceFreshness;
  readonly evidenceProvenance?: SourceDecisionEvidenceLookup["provenance"];
  readonly evidenceReason?: string;
  readonly uri: string;
  readonly artifactContentHash: string;
  readonly chunkContent: string;
  readonly chunkContentHash: string;
  readonly retrievalEvidence?: {
    readonly content: string;
    readonly sourceArtifactId: string;
    readonly sourceChunkId: string;
    readonly contentHash: string;
    readonly renderedContentHash: string;
    readonly sourceRange?: string;
    readonly truncated: boolean;
  };
}

export interface PersistedSourceDecisionImportRow {
  readonly decisionId: string;
  readonly evidenceRef: string;
  readonly evidenceStatus: SourceDecisionEvidenceLookup["status"];
  readonly evidenceContentHash?: string;
  readonly evidenceCapturedAt?: string;
  readonly evidenceFreshness: SourceDecisionEvidenceFreshness;
  readonly evidenceProvenance?: SourceDecisionEvidenceLookup["provenance"];
  readonly evidenceReason?: string;
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
  readonly fixture: ReviewedSourceDecisionCorpus;
  readonly importId: string;
  readonly smokeId?: string;
  readonly importedBy: string;
  readonly now: string;
  readonly authorizedRepoRoot?: string;
  readonly requireCapturedProjectEvidence?: boolean;
  readonly resolveEvidence?: SourceDecisionEvidenceResolver;
}

export interface PersistSourceDecisionImportResult {
  readonly importId: string;
  readonly rows: readonly PersistedSourceDecisionImportRow[];
}

export type SourceDecisionEvidenceResolver = (input: {
  projectId: ProjectId;
  decisionId: string;
  evidenceRef: string;
  now: string;
  authorizedRepoRoot?: string;
}) => Promise<SourceDecisionEvidenceLookup>;

export interface SourceDecisionImportCounts {
  readonly decisionCount: number;
  readonly currentDecisionCount: number;
  readonly staleDecisionCount: number;
  readonly rejectedDecisionCount: number;
}

export const sourceDecisionImportCounts = (
  fixture: ReviewedSourceDecisionCorpus
): SourceDecisionImportCounts => ({
  decisionCount: fixture.decisions.length,
  currentDecisionCount: fixture.decisions.filter((row) => row.status === "current").length,
  staleDecisionCount: fixture.decisions.filter((row) => row.status === "stale").length,
  rejectedDecisionCount: fixture.decisions.filter((row) => row.status === "rejected").length
});

export const validateSourceDecisionImportFixture = (
  fixture: ReviewedSourceDecisionCorpus
): void => {
  const declaredDecisionIds = fixture.coverageScope?.declaredRows.map((row) => row.decisionId);

  if (declaredDecisionIds === undefined) {
    return;
  }

  const decisionIds = new Set(fixture.decisions.map((row) => row.id));
  const unknownDecisionIds = declaredDecisionIds.filter((decisionId) => !decisionIds.has(decisionId));

  if (unknownDecisionIds.length > 0) {
    throw new Error(
      `source decision coverage references unknown decisions: ${unknownDecisionIds.join(", ")}`
    );
  }
};

const normalizeImportText = (value: string): string =>
  value.replace(/\r\n?/gu, "\n").trim().replace(/[ \t]+/gu, " ");

const contentHash = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const compareImportText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const canonicalImportTextList = (values: readonly string[]): readonly string[] =>
  values.map(normalizeImportText).sort(compareImportText);

const canonicalSourceDecisionImportManifest = (
  fixture: ReviewedSourceDecisionCorpus
) => ({
  version: fixture.version,
  corpusName: normalizeImportText(fixture.corpusName),
  coverageScope: fixture.coverageScope === undefined
    ? null
    : {
        declaredRows: fixture.coverageScope.declaredRows
          .map((row) => ({
            decisionId: normalizeImportText(row.decisionId),
            evidenceRefs: canonicalImportTextList(row.evidenceRefs)
          }))
          .sort((left, right) => compareImportText(left.decisionId, right.decisionId))
      },
  decisions: fixture.decisions
    .map((row) => ({
      id: row.id,
      title: normalizeImportText(row.title),
      statement: normalizeImportText(row.statement),
      status: row.status,
      taskScopes: canonicalImportTextList(row.taskScopes),
      evidenceRef: normalizeImportText(row.evidenceRef),
      falsifier: normalizeImportText(row.falsifier),
      doesNotProve: normalizeImportText(row.doesNotProve),
      noteText: normalizeImportText(row.noteText)
    }))
    .sort((left, right) => compareImportText(left.id, right.id))
});

/**
 * Public CLI retries need an identity that is independent of process clocks
 * and database-generated IDs. The project selector and canonical corpus
 * manifest are the complete semantic input at this boundary; captured-source
 * byte changes remain protected by the persisted artifact hash conflict check.
 */
export const deriveSourceDecisionImportIdentity = (input: {
  readonly projectIdentity: string;
  readonly fixture: ReviewedSourceDecisionCorpus;
}): string => {
  const projectIdentity = normalizeImportText(input.projectIdentity);

  if (projectIdentity.length === 0) {
    throw new Error("source decision import project identity must not be empty");
  }

  return `source-decision-import:${contentHash(
    `krn.source-decision-import.identity.v2\n${JSON.stringify({
      projectIdentity,
      manifest: canonicalSourceDecisionImportManifest(input.fixture)
    })}`
  )}`;
};

const localEvidenceRefPattern = /^([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*)(?::[1-9][0-9]*)?(?:#[A-Za-z0-9._/-]+)?$/u;

const isTraversalPath = (localPath: string): boolean =>
  localPath.split("/").some((segment) => segment === "." || segment === "..");

const isSafeLocalEvidenceRef = (evidenceRef: string): boolean => {
  const localPath = localEvidenceRefPattern.exec(evidenceRef)?.[1];

  return localPath !== undefined && !isTraversalPath(localPath);
};

const requireHttpEvidenceRef = (evidenceRef: string, decisionId: string): string => {
  try {
    const url = new URL(evidenceRef);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("unsupported URL protocol");
    }
  } catch {
    throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
  }

  return evidenceRef;
};

const capturedSourceHashEvidenceRefPattern = /^krn-source:\/\/sha256\/([a-f0-9]{64})$/u;

const capturedSourceContentHash = (evidenceRef: string): string | undefined =>
  capturedSourceHashEvidenceRefPattern.exec(evidenceRef)?.[1];

const requireFileEvidenceRef = (evidenceRef: string, decisionId: string): string => {
  try {
    const url = new URL(evidenceRef);

    if (url.protocol !== "file:") {
      throw new Error("unsupported URL protocol");
    }
  } catch {
    throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
  }

  return evidenceRef;
};

const requireCapturedSourceEvidenceRef = (
  evidenceRef: string,
  decisionId: string
): string => {
  if (capturedSourceContentHash(evidenceRef) === undefined) {
    throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
  }

  return evidenceRef;
};

const resolveEvidenceRef = (value: string, decisionId: string): string => {
  const evidenceRef = normalizeImportText(value);

  if (evidenceRef.length === 0) {
    throw new Error(`decision ${decisionId} has an empty evidenceRef`);
  }

  if (evidenceRef.startsWith("https://") || evidenceRef.startsWith("http://")) {
    return requireHttpEvidenceRef(evidenceRef, decisionId);
  }

  if (evidenceRef.startsWith("file://")) {
    return requireFileEvidenceRef(evidenceRef, decisionId);
  }

  if (evidenceRef.startsWith("krn-source://")) {
    return requireCapturedSourceEvidenceRef(evidenceRef, decisionId);
  }

  if (isSafeLocalEvidenceRef(evidenceRef)) {
    return evidenceRef;
  }

  throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
};

const metadataForRow = (
  input: PersistSourceDecisionImportInput,
  row: ReviewedSourceDecisionRow,
  evidence: SourceDecisionEvidenceLookup
): Record<string, unknown> => ({
  importId: input.importId,
  ...(input.smokeId === undefined ? {} : { smokeId: input.smokeId }),
  importedBy: input.importedBy,
  importedAt: input.now,
  decisionCorpusImportId: row.id,
  decisionCorpusStatus: row.status,
  evidenceRef: evidence.evidenceRef,
  ...sourceEvidenceFields(evidence)
});

const sourceEvidenceFields = (
  evidence: SourceDecisionEvidenceLookup
): Pick<
  PreparedSourceDecisionImportRow,
  "evidenceStatus" | "evidenceContentHash" | "evidenceCapturedAt" | "evidenceFreshness" | "evidenceProvenance" | "evidenceReason"
> => ({
  evidenceStatus: evidence.status,
  ...(evidence.contentHash === undefined ? {} : { evidenceContentHash: evidence.contentHash }),
  ...(evidence.capturedAt === undefined ? {} : { evidenceCapturedAt: evidence.capturedAt }),
  evidenceFreshness: evidence.freshness ?? "unknown",
  ...(evidence.provenance === undefined ? {} : { evidenceProvenance: evidence.provenance }),
  ...(evidence.reason === undefined ? {} : { evidenceReason: evidence.reason })
});

const parseLocalEvidencePath = (evidenceRef: string, decisionId: string): string => {
  const match = localEvidenceRefPattern.exec(evidenceRef);
  const localPath = match?.[1];

  if (localPath === undefined) {
    throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
  }

  if (isTraversalPath(localPath)) {
    throw new Error(`decision ${decisionId} has an unresolvable evidenceRef: ${evidenceRef}`);
  }

  return localPath;
};

const capturedEvidenceWithCanonicalHash = (
  evidence: SourceDecisionEvidenceLookup,
  decisionId: string
): SourceDecisionEvidenceLookup => {
  if (evidence.status !== "captured") {
    return evidence;
  }

  if (
    evidence.content === undefined ||
    evidence.provenance === undefined ||
    evidence.capturedAt === undefined
  ) {
    throw new Error(`decision ${decisionId} has captured evidence without content, provenance, or capture time`);
  }

  const actualHash = contentHash(evidence.content);
  const reportedHash = evidence.contentHash?.replace(/^sha256:/u, "");

  if (reportedHash !== undefined && reportedHash !== actualHash) {
    return {
      ...evidence,
      status: "digest_mismatch",
      reason: "captured evidence digest does not match the captured bytes"
    };
  }

  return {
    ...evidence,
    contentHash: actualHash
  };
};

const requireAuthorizedEvidenceRoot = async (input: {
  authorizedRepoRoot?: string;
  decisionId: string;
}): Promise<string> => {
  if (input.authorizedRepoRoot === undefined) {
    throw new Error(`decision ${input.decisionId} requires an authorized repository root for local evidence`);
  }

  return realpath(path.resolve(input.authorizedRepoRoot)).catch(() => {
    throw new Error(`authorized repository root is unavailable for decision ${input.decisionId}`);
  });
};

const relativePathInsideEvidenceRoot = (
  root: string,
  candidate: string,
  decisionId: string
): string => {
  const relativePath = path.relative(root, candidate);

  if (
    relativePath.length === 0 ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`decision ${decisionId} evidenceRef resolves outside the authorized repository root`);
  }

  return relativePath;
};

const resolveLocalEvidenceFile = async (input: {
  candidate: string;
  decisionId: string;
  evidenceRef: string;
  root: string;
}): Promise<SourceDecisionEvidenceLookup | {
  resolvedPath: string;
  resolvedRelativePath: string;
}> => {
  let resolvedPath: string;

  try {
    resolvedPath = await realpath(input.candidate);
  } catch {
    return {
      status: "missing",
      evidenceRef: input.evidenceRef,
      reason: "local evidence file does not exist inside the authorized repository root"
    };
  }

  const resolvedRelativePath = relativePathInsideEvidenceRoot(
    input.root,
    resolvedPath,
    input.decisionId
  );
  const fileStats = await stat(resolvedPath);

  if (!fileStats.isFile()) {
    return {
      status: "missing",
      evidenceRef: input.evidenceRef,
      reason: "local evidence reference does not resolve to a regular file"
    };
  }

  return { resolvedPath, resolvedRelativePath };
};

const resolveLocalEvidence = async (input: {
  authorizedRepoRoot?: string;
  decisionId: string;
  evidenceRef: string;
  now: string;
}): Promise<SourceDecisionEvidenceLookup> => {
  const root = await requireAuthorizedEvidenceRoot(input);
  const localPath = parseLocalEvidencePath(input.evidenceRef, input.decisionId);
  const candidate = path.resolve(root, localPath);
  relativePathInsideEvidenceRoot(root, candidate, input.decisionId);
  const resolved = await resolveLocalEvidenceFile({
    candidate,
    decisionId: input.decisionId,
    evidenceRef: input.evidenceRef,
    root
  });

  if ("status" in resolved) {
    return resolved;
  }

  const content = await readFile(resolved.resolvedPath, "utf8");

  return {
    status: "captured",
    evidenceRef: input.evidenceRef,
    content,
    contentHash: contentHash(content),
    capturedAt: input.now,
    freshness: "unknown",
    provenance: {
      kind: "local_file",
      uri: `file://${resolved.resolvedPath}`,
      path: resolved.resolvedRelativePath
    }
  };
};

const resolveEvidence = async (input: {
  decisionId: string;
  evidenceRef: string;
  now: string;
  projectId: ProjectId;
  authorizedRepoRoot?: string;
  resolveEvidence?: SourceDecisionEvidenceResolver;
  sourceDecisionImportRepository?: SourceDecisionImportRepository;
  requireCapturedProjectEvidence?: boolean;
}): Promise<SourceDecisionEvidenceLookup> => {
  if (input.resolveEvidence !== undefined) {
    return capturedEvidenceWithCanonicalHash(
      await input.resolveEvidence({
        projectId: input.projectId,
        decisionId: input.decisionId,
        evidenceRef: input.evidenceRef,
        now: input.now,
        ...(input.authorizedRepoRoot === undefined
          ? {}
          : { authorizedRepoRoot: input.authorizedRepoRoot })
      }),
      input.decisionId
    );
  }

  if (requiresCapturedEvidenceLookup(input)) {
    return resolveCapturedEvidence(input);
  }

  return resolveLocalEvidence(input);
};

const requiresCapturedEvidenceLookup = (input: {
  readonly evidenceRef: string;
  readonly requireCapturedProjectEvidence?: boolean;
}): boolean =>
  input.requireCapturedProjectEvidence === true ||
  input.evidenceRef.startsWith("file://") ||
  input.evidenceRef.startsWith("http://") ||
  input.evidenceRef.startsWith("https://");

const resolveCapturedEvidence = async (input: {
  readonly decisionId: string;
  readonly evidenceRef: string;
  readonly projectId: ProjectId;
  readonly sourceDecisionImportRepository?: SourceDecisionImportRepository;
}): Promise<SourceDecisionEvidenceLookup> => {
  const capturedEvidence = input.sourceDecisionImportRepository?.getCapturedSourceEvidence;

  if (capturedEvidence === undefined) {
    return {
      status: "externally_unverified",
      evidenceRef: input.evidenceRef,
      reason: "URL evidence requires a project-scoped captured SourceArtifact or SourceSnapshot"
    };
  }

  const evidenceContentHash = capturedSourceContentHash(input.evidenceRef);
  const lookup = await capturedEvidence.call(input.sourceDecisionImportRepository, {
    projectId: input.projectId,
    evidenceRef: input.evidenceRef,
    ...(evidenceContentHash === undefined ? {} : { contentHash: evidenceContentHash })
  });

  return capturedEvidenceWithCanonicalHash(
    lookup.status === "missing"
      ? {
          ...lookup,
          status: "externally_unverified",
          reason: lookup.reason ?? "evidence has no project-scoped captured SourceArtifact or SourceSnapshot"
        }
      : lookup,
    input.decisionId
  );
};

const requireCapturedEvidenceForAuthority = (
  row: ReviewedSourceDecisionRow,
  evidence: SourceDecisionEvidenceLookup
): void => {
  if (row.status !== "current" || evidence.status === "captured") {
    return;
  }

  throw new Error(
    `decision ${row.id} cannot create governing authority: evidence ${evidence.evidenceRef} is ${evidence.status}${
      evidence.reason === undefined ? "" : ` (${evidence.reason})`
    }`
  );
};

const authorityLifecycleStatusFor = (
  row: ReviewedSourceDecisionRow,
  evidence: SourceDecisionEvidenceLookup
): ReviewedSourceDecisionRow["status"] =>
  row.status === "current" &&
  evidence.status === "captured" &&
  evidence.freshness !== "current"
    ? "stale"
    : row.status;

const prepareImportRow = async (
  input: PersistSourceDecisionImportInput,
  row: ReviewedSourceDecisionRow,
  evidenceRef: string
): Promise<PreparedSourceDecisionImportRow> => {
  requireContentAddressedProjectEvidence(input, row.id, evidenceRef);

  const evidence = await resolveEvidence(evidenceResolutionInputFor(input, row.id, evidenceRef));

  requireCapturedEvidenceForAuthority(row, evidence);
  const authorityLifecycleStatus = authorityLifecycleStatusFor(row, evidence);

  // Capture time is provenance, not semantic corpus content: retry clocks must not change it.
  const normalizedRow = JSON.stringify({
    doesNotProve: normalizeImportText(row.doesNotProve),
    evidenceContentHash: evidence.contentHash ?? null,
    evidenceRef,
    evidenceStatus: evidence.status,
    evidenceFreshness: evidence.freshness ?? "unknown",
    ...(evidence.provenance === undefined ? {} : { evidenceProvenance: evidence.provenance }),
    ...(evidence.reason === undefined ? {} : { evidenceReason: evidence.reason }),
    falsifier: normalizeImportText(row.falsifier),
    noteText: normalizeImportText(row.noteText),
    status: row.status,
    statement: normalizeImportText(row.statement),
    taskScopes: canonicalImportTextList(row.taskScopes),
    title: normalizeImportText(row.title)
  });
  const capturedContent = capturedContentForImport(input, evidence);
  const chunkContent = `${normalizeImportText(row.statement)}\n\n${normalizeImportText(row.noteText)}${capturedContent}`;
  const retrievalEvidence = retrievalEvidenceForImport(input, evidence);

  return {
    row,
    authorityLifecycleStatus,
    evidenceRef,
    metadata: metadataForRow(input, row, evidence),
    ...sourceEvidenceFields(evidence),
    uri: `source-decision-import://${input.importId}/${row.id}`,
    artifactContentHash: contentHash(`krn.source-decision-import.v2\n${normalizedRow}`),
    chunkContent,
    chunkContentHash: contentHash(`krn.source-decision-import.chunk.v2\n${chunkContent}`),
    ...(retrievalEvidence === undefined ? {} : { retrievalEvidence })
  };
};

const requireContentAddressedProjectEvidence = (
  input: PersistSourceDecisionImportInput,
  decisionId: string,
  evidenceRef: string
): void => {
  if (
    input.requireCapturedProjectEvidence === true &&
    capturedSourceContentHash(evidenceRef) === undefined
  ) {
    throw new Error(
      `decision ${decisionId} requires content-addressed project evidence: krn-source://sha256/<digest>`
    );
  }
};

const evidenceResolutionInputFor = (
  input: PersistSourceDecisionImportInput,
  decisionId: string,
  evidenceRef: string
): Parameters<typeof resolveEvidence>[0] => ({
  decisionId,
  evidenceRef,
  now: input.now,
  projectId: input.projectId,
  ...(input.authorizedRepoRoot === undefined
    ? {}
    : { authorizedRepoRoot: input.authorizedRepoRoot }),
  ...(input.resolveEvidence === undefined ? {} : { resolveEvidence: input.resolveEvidence }),
  ...(input.runtime.sourceDecisionImportRepository === undefined
    ? {}
    : { sourceDecisionImportRepository: input.runtime.sourceDecisionImportRepository }),
  ...(input.requireCapturedProjectEvidence === undefined
    ? {}
    : { requireCapturedProjectEvidence: input.requireCapturedProjectEvidence })
});

const capturedContentForImport = (
  input: PersistSourceDecisionImportInput,
  evidence: SourceDecisionEvidenceLookup
): string => evidence.content === undefined || input.requireCapturedProjectEvidence === true
  ? ""
  : `\n\nCaptured evidence (${evidence.evidenceRef}):\n${evidence.content}`;

const retrievalEvidenceForImport = (
  input: PersistSourceDecisionImportInput,
  evidence: SourceDecisionEvidenceLookup
): PreparedSourceDecisionImportRow["retrievalEvidence"] => {
  const sourceArtifactId = evidence.provenance?.sourceArtifactId;
  const sourceChunkId = evidence.provenance?.sourceChunkId;
  const sourceRange = evidence.provenance?.sourceRange;

  if (
    input.requireCapturedProjectEvidence !== true ||
    evidence.status !== "captured" ||
    evidence.content === undefined ||
    evidence.contentHash === undefined ||
    sourceArtifactId === undefined ||
    sourceChunkId === undefined
  ) {
    return undefined;
  }

  const truncated = evidence.content.length > decisionPacketSupportingEvidenceMaxCharacters;

  const content = truncated
    ? evidence.content.slice(0, decisionPacketSupportingEvidenceMaxCharacters)
    : evidence.content;

  return {
    content,
    sourceArtifactId,
    sourceChunkId,
    contentHash: evidence.contentHash,
    renderedContentHash: contentHash(content),
    ...(sourceRange === undefined
      ? {}
      : { sourceRange }),
    truncated
  };
};

const prepareImportRows = async (
  input: PersistSourceDecisionImportInput
): Promise<readonly PreparedSourceDecisionImportRow[]> => {
  const rowsWithEvidenceRefs = input.fixture.decisions.map((row) => ({
    row,
    evidenceRef: resolveEvidenceRef(row.evidenceRef, row.id)
  }));

  return Promise.all(rowsWithEvidenceRefs.map(({ row, evidenceRef }) =>
    prepareImportRow(input, row, evidenceRef)
  ));
};

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
    readonly row: ReviewedSourceDecisionRow;
    readonly authorityLifecycleStatus: ReviewedSourceDecisionRow["status"];
    readonly sourceArtifactId: string;
    readonly sourceChunkId: string;
    readonly sourceClaimId: string;
    readonly sourceDecisionId: string;
    readonly metadata: Record<string, unknown>;
    readonly retrievalEvidence?: PreparedSourceDecisionImportRow["retrievalEvidence"];
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
    validityStatus: input.authorityLifecycleStatus === "stale" ? "expired" : "active",
    title: input.row.title,
    body: input.retrievalEvidence?.content ?? `${input.row.statement}\n\n${input.row.noteText}`,
    searchText: [
      input.row.title,
      input.row.statement,
      input.row.noteText,
      input.retrievalEvidence?.content ?? "",
      input.row.falsifier,
      input.row.doesNotProve
    ].join(" "),
    metadataFilters: {
      importId: input.metadata["importId"],
      decisionCorpusStatus: input.row.status
    },
    metadata: {
      ...input.metadata,
      sourceDecisionId: input.sourceDecisionId,
      ...(input.retrievalEvidence === undefined
        ? {}
        : {
            retrievalEvidence: {
              sourceArtifactId: input.retrievalEvidence.sourceArtifactId,
              sourceChunkId: input.retrievalEvidence.sourceChunkId,
              contentHash: input.retrievalEvidence.contentHash,
              renderedContentHash: input.retrievalEvidence.renderedContentHash,
              ...(input.retrievalEvidence.sourceRange === undefined
                ? {}
                : { sourceRange: input.retrievalEvidence.sourceRange }),
              truncated: input.retrievalEvidence.truncated
            }
          })
    }
  });
  const sourceDecisionEdge = input.authorityLifecycleStatus === "current"
      ? await input.sourceRepository.createSourceDecisionEdge({
          sourceClaimId: input.sourceClaimId,
          sourceDecisionId: input.sourceDecisionId,
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
    readonly row: ReviewedSourceDecisionRow;
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
  evidenceRef: row.evidenceRef,
  evidenceStatus: row.evidenceStatus,
  ...(row.evidenceCapturedAt === undefined ? {} : { evidenceCapturedAt: row.evidenceCapturedAt }),
  evidenceFreshness: row.evidenceFreshness ?? "unknown",
  ...(row.evidenceProvenance === undefined ? {} : { evidenceProvenance: row.evidenceProvenance }),
  ...(row.evidenceReason === undefined ? {} : { evidenceReason: row.evidenceReason }),
  ...(row.evidenceContentHash === undefined ? {} : { evidenceContentHash: row.evidenceContentHash }),
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
  authorityLifecycleStatus: ReviewedSourceDecisionRow["status"]
): SourceDecision["status"] =>
  authorityLifecycleStatus === "rejected"
    ? "reject"
    : authorityLifecycleStatus === "stale"
      ? "defer"
      : "adopt";

const expectedClaimStatusFor = (
  authorityLifecycleStatus: ReviewedSourceDecisionRow["status"]
): SourceClaim["status"] =>
  authorityLifecycleStatus === "rejected"
    ? "rejected"
    : authorityLifecycleStatus === "stale"
      ? "deprecated"
      : "accepted";

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
      row.sourceClaimStatus !== expectedClaimStatusFor(prepared.authorityLifecycleStatus) ||
      row.sourceDecisionStatus !== expectedDecisionStatusFor(prepared.authorityLifecycleStatus);
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

const sourceDecisionImportManifestLockKey = (input: {
  projectId: ProjectId;
  preparedRows: readonly PreparedSourceDecisionImportRow[];
}): string => `source-decision-import-manifest:${contentHash(JSON.stringify({
  projectId: input.projectId,
  rows: input.preparedRows
    .map((prepared) => ({
      decisionId: prepared.row.id,
      contentHash: prepared.artifactContentHash
    }))
    .sort((left, right) => compareImportText(left.decisionId, right.decisionId))
}))}`;

const deprecateImportedSourceClaimIfInactive = async (input: {
  readonly sourceRepository: SourceDecisionImportSourceRepository;
  readonly authorityLifecycleStatus: ReviewedSourceDecisionRow["status"];
  readonly sourceClaimId: string;
  readonly metadata: Record<string, unknown>;
}): Promise<void> => {
  if (input.authorityLifecycleStatus !== "stale") {
    return;
  }

  if (input.sourceRepository.deprecateSourceClaim === undefined) {
    throw new Error("SourceClaim deprecation is unavailable for stale source decision import");
  }

  await input.sourceRepository.deprecateSourceClaim({
    sourceClaimId: input.sourceClaimId,
    revisitWhen: "Refresh imported decision evidence before future activation.",
    metadata: input.metadata
  });
};

const projectScopedImportedSourceClaimReadback = async (input: {
  readonly sourceRepository: SourceDecisionImportSourceRepository;
  readonly projectId: ProjectId;
  readonly decisionId: string;
  readonly sourceClaimId: string;
}): Promise<SourceClaim> => {
  if (input.sourceRepository.getSourceClaimForProject === undefined) {
    throw new Error("Project-scoped SourceClaim lookup is unavailable for source decision import");
  }

  const sourceClaim = await input.sourceRepository.getSourceClaimForProject(
    input.projectId,
    input.sourceClaimId
  );

  if (sourceClaim === undefined) {
    throw new Error(`missing SourceClaim readback for imported decision ${input.decisionId}`);
  }

  return sourceClaim;
};

const persistedEvidenceFields = (
  prepared: PreparedSourceDecisionImportRow
): Pick<PersistedSourceDecisionImportRow, "evidenceRef" | "evidenceStatus" | "evidenceContentHash" | "evidenceCapturedAt" | "evidenceFreshness" | "evidenceProvenance" | "evidenceReason"> => ({
  evidenceRef: prepared.evidenceRef,
  evidenceStatus: prepared.evidenceStatus,
  ...(prepared.evidenceCapturedAt === undefined ? {} : { evidenceCapturedAt: prepared.evidenceCapturedAt }),
  evidenceFreshness: prepared.evidenceFreshness,
  ...(prepared.evidenceProvenance === undefined ? {} : { evidenceProvenance: prepared.evidenceProvenance }),
  ...(prepared.evidenceReason === undefined ? {} : { evidenceReason: prepared.evidenceReason }),
  ...(prepared.evidenceContentHash === undefined
    ? {}
    : { evidenceContentHash: prepared.evidenceContentHash })
});

const persistSourceDecisionImportRow = async (input: {
  readonly createSourceDecision: CreateSourceDecision;
  readonly importId: string;
  readonly prepared: PreparedSourceDecisionImportRow;
  readonly projectId: ProjectId;
  readonly retrievalRepository: SourceDecisionImportRetrievalRepository;
  readonly sourceRepository: SourceDecisionImportSourceRepository;
}): Promise<PersistedSourceDecisionImportRow> => {
  const row = input.prepared.row;
  const authorityLifecycleStatus = input.prepared.authorityLifecycleStatus;
  const { sourceArtifact, sourceChunk } = await createSourceArtifactAndChunk(
    input.sourceRepository,
    input.projectId,
    input.importId,
    input.prepared
  );
  const sourceClaim = await input.sourceRepository.createSourceClaim({
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
    metadata: input.prepared.metadata
  });
  const sourceDecision = await input.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: sourceClaim.id,
    status: expectedDecisionStatusFor(authorityLifecycleStatus),
    decision: row.statement,
    rationale: row.noteText,
    falsifier: row.falsifier,
    consumer: "source decision import",
    metadata: input.prepared.metadata
  });

  await deprecateImportedSourceClaimIfInactive({
    sourceRepository: input.sourceRepository,
    authorityLifecycleStatus,
    sourceClaimId: sourceClaim.id,
    metadata: input.prepared.metadata
  });
  const sourceClaimReadback = await projectScopedImportedSourceClaimReadback({
    sourceRepository: input.sourceRepository,
    projectId: input.projectId,
    decisionId: row.id,
    sourceClaimId: sourceClaim.id
  });

  if (authorityLifecycleStatus === "rejected") {
    return {
      decisionId: row.id,
      ...persistedEvidenceFields(input.prepared),
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      sourceClaimId: sourceClaim.id,
      sourceClaimStatus: sourceClaimReadback.status,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionStatus: sourceDecision.status,
      sourceRejectionId: await createRejectedPath({
        sourceRepository: input.sourceRepository,
        projectId: input.projectId,
        row,
        sourceArtifactId: sourceArtifact.id,
        sourceClaimId: sourceClaim.id,
        metadata: input.prepared.metadata
      })
    };
  }

  return {
    decisionId: row.id,
    ...persistedEvidenceFields(input.prepared),
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    sourceClaimId: sourceClaim.id,
    sourceClaimStatus: sourceClaimReadback.status,
    sourceDecisionId: sourceDecision.id,
    sourceDecisionStatus: sourceDecision.status,
    ...await createDecisionSupport({
      sourceRepository: input.sourceRepository,
      retrievalRepository: input.retrievalRepository,
      projectId: input.projectId,
      row,
      authorityLifecycleStatus,
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      sourceClaimId: sourceClaim.id,
      sourceDecisionId: sourceDecision.id,
      metadata: input.prepared.metadata,
      ...(input.prepared.retrievalEvidence === undefined
        ? {}
        : { retrievalEvidence: input.prepared.retrievalEvidence })
    })
  };
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
    rows.push(await persistSourceDecisionImportRow({
      createSourceDecision,
      retrievalRepository,
      sourceRepository,
      projectId: input.projectId,
      importId: input.importId,
      prepared
    }));
  }

  return rows;
};

export const persistSourceDecisionImport = async (
  input: PersistSourceDecisionImportInput
): Promise<PersistSourceDecisionImportResult> => {
  validateSourceDecisionImportFixture(input.fixture);
  const preparedRows = await prepareImportRows(input);

  if (
    preparedRows.some((prepared) => prepared.row.status === "stale") &&
    input.runtime.sourceRepository.deprecateSourceClaim === undefined
  ) {
    throw new Error("SourceClaim deprecation is unavailable for source decision import");
  }

  const repositories = assertImportRepositories(input.runtime);

  const manifestLockKey = sourceDecisionImportManifestLockKey({
    projectId: input.projectId,
    preparedRows
  });

  return repositories.withTransaction(manifestLockKey, async (transactionRuntime) => {
    if (transactionRuntime.sourceDecisionImportRepository === undefined) {
      throw new Error("Source decision import transaction readback is unavailable");
    }

    const equivalentImportIds = await transactionRuntime.sourceDecisionImportRepository
      .findEquivalentSourceDecisionImportIds({
        projectId: input.projectId,
        manifest: preparedRows.map((prepared) => ({
          decisionId: prepared.row.id,
          contentHash: prepared.artifactContentHash
        }))
      });

    if (equivalentImportIds.length > 1) {
      throw new Error(
        `source decision import manifest already has competing equivalent imports: ${equivalentImportIds.join(", ")}`
      );
    }

    const equivalentImportId = equivalentImportIds[0];

    if (equivalentImportId !== undefined) {
      const equivalentRows = await existingImportRows(
        transactionRuntime.sourceDecisionImportRepository,
        input.projectId,
        equivalentImportId,
        preparedRows
      );

      if (equivalentRows === undefined) {
        throw new Error(
          `source decision import equivalent manifest ${equivalentImportId} has no replayable rows`
        );
      }

      return { importId: equivalentImportId, rows: equivalentRows };
    }

    const existingRows = await existingImportRows(
      transactionRuntime.sourceDecisionImportRepository,
      input.projectId,
      input.importId,
      preparedRows
    );

    if (existingRows !== undefined) {
      throw new Error(
        `source decision import ${input.importId} exists but is absent from its semantic manifest lookup`
      );
    }

    const rows = await persistSourceDecisionImportRows({
      runtime: transactionRuntime,
      projectId: input.projectId,
      importId: input.importId,
      preparedRows
    });

    return { importId: input.importId, rows };
  });
};
