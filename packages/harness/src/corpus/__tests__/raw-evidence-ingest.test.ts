import { describe, expect, it, vi } from "vitest";

import type { RetrievalRepository } from "../../repositories/retrieval-repository.js";
import type { SourceRepository } from "../../repositories/source-repository.js";
import type {
  CreateSourceArtifactInput,
  CreateSourceChunkInput,
  SearchDocumentRecord,
  SourceArtifactRecord,
  SourceChunkRecord
} from "../../repositories/types.js";
import {
  ingestRawEvidenceSpan,
  rawEvidenceChecksum
} from "../raw-evidence-ingest.js";

type SourceWriter = Pick<SourceRepository, "createSourceArtifact" | "createSourceChunk">;
type RetrievalWriter = Pick<RetrievalRepository, "createSearchDocument">;
type SearchDocumentInput = Parameters<RetrievalWriter["createSearchDocument"]>[0];

const now = "2026-07-07T10:00:00.000Z";
const rawText =
  "Forum consensus changed in 2024: use the governed frontend boilerplate for greenfield React work.";
const spanStart = rawText.indexOf("use the governed frontend boilerplate");
const spanEnd = rawText.length;

const requireString = (value: string | undefined, field: string): string => {
  if (value === undefined) {
    throw new Error(`${field} is required by this test fixture`);
  }

  return value;
};

const sourceArtifactRecord = (
  input: CreateSourceArtifactInput,
  id = "source-artifact-1"
): SourceArtifactRecord => ({
  id,
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  kind: input.kind,
  trustTier: input.trustTier,
  uri: input.uri,
  title: input.title,
  contentHash: input.contentHash,
  metadata: input.metadata ?? {},
  capturedAt: now,
  createdAt: now,
  updatedAt: now
});

const sourceChunkRecord = (
  input: CreateSourceChunkInput,
  id = "source-chunk-1"
): SourceChunkRecord => ({
  id,
  sourceArtifactId: input.sourceArtifactId,
  ordinal: input.ordinal,
  ...(input.heading === undefined ? {} : { heading: input.heading }),
  content: input.content,
  ...(input.tokenCount === undefined ? {} : { tokenCount: input.tokenCount }),
  contentHash: input.contentHash,
  metadata: input.metadata ?? {},
  createdAt: now
});

const searchDocumentRecord = (
  input: SearchDocumentInput,
  id = "search-document-1"
): SearchDocumentRecord => ({
  id,
  subjectType: input.subjectType,
  subjectId: input.subjectId,
  sourceArtifactId: requireString(input.sourceArtifactId, "sourceArtifactId"),
  sourceChunkId: requireString(input.sourceChunkId, "sourceChunkId"),
  trustTier: input.trustTier ?? "medium",
  validityStatus: input.validityStatus ?? "active",
  language: input.language ?? "english",
  title: input.title,
  body: input.body,
  searchText: input.searchText ?? `${input.title}\n${input.body}`,
  metadataFilters: input.metadataFilters ?? {},
  validFrom: input.validFrom ?? now,
  validUntil: requireString(input.validUntil, "validUntil"),
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

const createRepositories = (): {
  sourceRepository: SourceWriter;
  retrievalRepository: RetrievalWriter;
  createSourceArtifact: ReturnType<typeof vi.fn<[CreateSourceArtifactInput], Promise<SourceArtifactRecord>>>;
  createSourceChunk: ReturnType<typeof vi.fn<[CreateSourceChunkInput], Promise<SourceChunkRecord>>>;
  createSearchDocument: ReturnType<typeof vi.fn<[SearchDocumentInput], Promise<SearchDocumentRecord>>>;
} => {
  const createSourceArtifact = vi.fn(
    async (input: CreateSourceArtifactInput) => sourceArtifactRecord(input)
  );
  const createSourceChunk = vi.fn(
    async (input: CreateSourceChunkInput) => sourceChunkRecord(input)
  );
  const createSearchDocument = vi.fn(
    async (input: SearchDocumentInput) => searchDocumentRecord(input)
  );

  return {
    sourceRepository: {
      createSourceArtifact,
      createSourceChunk
    },
    retrievalRepository: {
      createSearchDocument
    },
    createSourceArtifact,
    createSourceChunk,
    createSearchDocument
  };
};

describe("ingestRawEvidenceSpan", () => {
  it("stores a citable raw evidence span without indexing the whole corpus", async () => {
    const repositories = createRepositories();

    const result = await ingestRawEvidenceSpan({
      sourceRepository: repositories.sourceRepository,
      retrievalRepository: repositories.retrievalRepository,
      projectId: "project-1",
      sourceType: "forum_post",
      externalId: "astropolis-post-42",
      owner: "astropolis",
      uri: "https://example.test/forum/post/42",
      title: "Frontend boilerplate consensus",
      observedAt: "2026-07-01T12:00:00.000Z",
      validUntil: "2026-12-01T00:00:00.000Z",
      now,
      sourceChecksum: rawEvidenceChecksum(rawText),
      rawText,
      span: {
        start: spanStart,
        end: spanEnd,
        label: "accepted consensus"
      },
      retrievalMetadata: {
        corpus: "team-forum"
      }
    });

    expect(result.citationRef).toBe(`forum_post:astropolis-post-42#char=${spanStart}-${spanEnd}`);
    expect(result.sourceArtifact.contentHash).toBe(rawEvidenceChecksum(rawText));
    expect(result.sourceChunk.content).toBe(rawText.slice(spanStart, spanEnd));
    expect(result.searchDocument.subjectType).toBe("source_chunk");
    expect(result.searchDocument.sourceChunkId).toBe(result.sourceChunk.id);
    expect(result.searchDocument.body).toBe(rawText.slice(spanStart, spanEnd));
    expect(result.searchDocument.body).not.toBe(rawText);
    expect(result.outsideActiveContext).toContain("full external corpus");
    expect(result.doesNotProve).toContain("that corpus-wide consensus has been computed");

    expect(repositories.createSourceArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "external_doc",
        uri: "https://example.test/forum/post/42",
        contentHash: rawEvidenceChecksum(rawText)
      })
    );
    expect(repositories.createSearchDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataFilters: {
          sourceType: "forum_post",
          owner: "astropolis",
          externalId: "astropolis-post-42"
        },
        validFrom: "2026-07-01T12:00:00.000Z",
        validUntil: "2026-12-01T00:00:00.000Z"
      })
    );
  });

  it("rejects raw evidence when the checksum does not match the source text", async () => {
    const repositories = createRepositories();

    await expect(
      ingestRawEvidenceSpan({
        sourceRepository: repositories.sourceRepository,
        retrievalRepository: repositories.retrievalRepository,
        sourceType: "forum_post",
        externalId: "post-1",
        owner: "forum",
        uri: "https://example.test/post/1",
        title: "Bad checksum",
        observedAt: "2026-07-01T12:00:00.000Z",
        sourceChecksum: "sha256:not-the-text",
        rawText,
        span: {
          start: 0,
          end: 10
        }
      })
    ).rejects.toThrow("sourceChecksum does not match");

    expect(repositories.createSourceArtifact).not.toHaveBeenCalled();
    expect(repositories.createSearchDocument).not.toHaveBeenCalled();
  });

  it("rejects spans that cannot cite source content", async () => {
    const repositories = createRepositories();

    await expect(
      ingestRawEvidenceSpan({
        sourceRepository: repositories.sourceRepository,
        retrievalRepository: repositories.retrievalRepository,
        sourceType: "document",
        externalId: "doc-1",
        owner: "team",
        uri: "https://example.test/doc/1",
        title: "Out of bounds",
        observedAt: "2026-07-01T12:00:00.000Z",
        sourceChecksum: rawEvidenceChecksum(rawText),
        rawText,
        span: {
          start: 5,
          end: rawText.length + 1
        }
      })
    ).rejects.toThrow("span bounds must cite content");

    expect(repositories.createSourceArtifact).not.toHaveBeenCalled();
  });

  it("rejects stale evidence before it reaches retrieval", async () => {
    const repositories = createRepositories();

    await expect(
      ingestRawEvidenceSpan({
        sourceRepository: repositories.sourceRepository,
        retrievalRepository: repositories.retrievalRepository,
        sourceType: "mail",
        externalId: "mail-1",
        owner: "team",
        uri: "mail://mail-1",
        title: "Expired decision",
        observedAt: "2026-06-01T12:00:00.000Z",
        validUntil: "2026-07-01T00:00:00.000Z",
        now,
        sourceChecksum: rawEvidenceChecksum(rawText),
        rawText,
        span: {
          start: 0,
          end: 10
        }
      })
    ).rejects.toThrow("stale");

    expect(repositories.createSourceArtifact).not.toHaveBeenCalled();
    expect(repositories.createSearchDocument).not.toHaveBeenCalled();
  });
});
