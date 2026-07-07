import type { ProjectId, SourceTrustTier } from "@krn/core";

import type { RetrievalRepository } from "../repositories/retrieval-repository.js";
import type { SourceRepository } from "../repositories/source-repository.js";
import type {
  SearchDocumentRecord,
  SourceArtifactRecord,
  SourceChunkRecord
} from "../repositories/types.js";

export type RawEvidenceSourceType =
  | "forum_post"
  | "mail"
  | "document"
  | "repo_file"
  | "operator_input";

export interface RawEvidenceSpan {
  start: number;
  end: number;
  label?: string;
}

export interface RawEvidenceIdentity {
  sourceType: RawEvidenceSourceType;
  externalId: string;
  owner: string;
  uri: string;
  title: string;
  observedAt: string;
  sourceChecksum: string;
}

export interface RawEvidenceIngestInput extends RawEvidenceIdentity {
  projectId?: ProjectId;
  sourceRepository: Pick<SourceRepository, "createSourceArtifact" | "createSourceChunk">;
  retrievalRepository: Pick<RetrievalRepository, "createSearchDocument">;
  rawText: string;
  span: RawEvidenceSpan;
  trustTier?: SourceTrustTier;
  language?: string;
  validUntil?: string;
  retrievalMetadata?: Record<string, unknown>;
  now?: string;
}

export interface RawEvidenceIngestResult {
  sourceArtifact: SourceArtifactRecord;
  sourceChunk: SourceChunkRecord;
  searchDocument: SearchDocumentRecord;
  citationRef: string;
  storedSpan: {
    content: string;
    contentHash: string;
    start: number;
    end: number;
  };
  outsideActiveContext: readonly string[];
  doesNotProve: readonly string[];
}

export const rawEvidenceChecksum = (content: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `checksum:fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const requireNonEmpty = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`Raw evidence ${field} is required`);
  }

  return trimmed;
};

const requireIsoDate = (value: string, field: string): string => {
  const trimmed = requireNonEmpty(value, field);
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`Raw evidence ${field} must be a parseable timestamp`);
  }

  return trimmed;
};

const assertCurrentEnough = (validUntil: string | undefined, now: string | undefined): void => {
  if (validUntil === undefined) {
    return;
  }

  const validUntilIso = requireIsoDate(validUntil, "validUntil");
  const nowIso = now === undefined ? new Date().toISOString() : requireIsoDate(now, "now");

  if (Date.parse(validUntilIso) <= Date.parse(nowIso)) {
    throw new Error("Raw evidence span is stale and cannot be activated");
  }
};

const extractCitableSpan = (rawText: string, span: RawEvidenceSpan): string => {
  if (!Number.isInteger(span.start) || !Number.isInteger(span.end)) {
    throw new Error("Raw evidence span bounds must be integers");
  }

  if (span.start < 0 || span.end <= span.start || span.end > rawText.length) {
    throw new Error("Raw evidence span bounds must cite content inside rawText");
  }

  const content = rawText.slice(span.start, span.end);
  if (content.trim().length === 0) {
    throw new Error("Raw evidence span must cite non-empty content");
  }

  return content;
};

const citationRef = (identity: RawEvidenceIdentity, span: RawEvidenceSpan): string =>
  `${identity.sourceType}:${identity.externalId}#char=${span.start}-${span.end}`;

export const ingestRawEvidenceSpan = async (
  input: RawEvidenceIngestInput
): Promise<RawEvidenceIngestResult> => {
  const identity: RawEvidenceIdentity = {
    sourceType: input.sourceType,
    externalId: requireNonEmpty(input.externalId, "externalId"),
    owner: requireNonEmpty(input.owner, "owner"),
    uri: requireNonEmpty(input.uri, "uri"),
    title: requireNonEmpty(input.title, "title"),
    observedAt: requireIsoDate(input.observedAt, "observedAt"),
    sourceChecksum: requireNonEmpty(input.sourceChecksum, "sourceChecksum")
  };
  const rawText = requireNonEmpty(input.rawText, "rawText");
  const actualChecksum = rawEvidenceChecksum(rawText);
  if (identity.sourceChecksum !== actualChecksum) {
    throw new Error("Raw evidence sourceChecksum does not match rawText");
  }
  assertCurrentEnough(input.validUntil, input.now);

  const spanContent = extractCitableSpan(rawText, input.span);
  const spanHash = rawEvidenceChecksum(spanContent);
  const ref = citationRef(identity, input.span);
  const trustTier = input.trustTier ?? "medium";
  const metadata = {
    rawEvidence: {
      sourceType: identity.sourceType,
      externalId: identity.externalId,
      owner: identity.owner,
      observedAt: identity.observedAt,
      citationRef: ref,
      span: {
        start: input.span.start,
        end: input.span.end,
        ...(input.span.label === undefined ? {} : { label: input.span.label })
      },
      sourceChecksum: identity.sourceChecksum
    },
    ...(input.retrievalMetadata ?? {})
  };

  const sourceArtifact = await input.sourceRepository.createSourceArtifact({
    ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
    kind: "external_doc",
    trustTier,
    uri: identity.uri,
    title: identity.title,
    contentHash: identity.sourceChecksum,
    metadata
  });
  const sourceChunk = await input.sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    ...(input.span.label === undefined ? {} : { heading: input.span.label }),
    content: spanContent,
    tokenCount: spanContent.trim().split(/\s+/u).length,
    contentHash: spanHash,
    metadata
  });
  const searchDocument = await input.retrievalRepository.createSearchDocument({
    ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
    subjectType: "source_chunk",
    subjectId: sourceChunk.id,
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    trustTier,
    language: input.language ?? "english",
    title: identity.title,
    body: spanContent,
    searchText: `${identity.title}\n${spanContent}`,
    metadataFilters: {
      sourceType: identity.sourceType,
      owner: identity.owner,
      externalId: identity.externalId
    },
    validFrom: identity.observedAt,
    ...(input.validUntil === undefined ? {} : { validUntil: input.validUntil }),
    metadata
  });

  return {
    sourceArtifact,
    sourceChunk,
    searchDocument,
    citationRef: ref,
    storedSpan: {
      content: spanContent,
      contentHash: spanHash,
      start: input.span.start,
      end: input.span.end
    },
    outsideActiveContext: [
      "full external corpus",
      "attachments or binary payloads",
      "uncited neighboring records"
    ],
    doesNotProve: [
      "that the source claim should be promoted as knowledge",
      "that corpus-wide consensus has been computed",
      "that every external record was ingested"
    ]
  };
};
