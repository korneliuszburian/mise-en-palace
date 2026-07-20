import { createHash } from "node:crypto";

import {
  assessTemporalWindow,
  decisionPacketSupportingEvidenceProjectionVersions,
  projectDecisionPacketSupportingEvidence,
  type MemoryRecord,
  type ProjectId,
  type SourceClaim
} from "@krn/core";
import type {
  MemoryRepository,
  SearchDocumentSearchResult,
  SourceRepository
} from "@krn/core/repositories/internal";

import type {
  ActivationExclusion
} from "./types.js";

export type SearchDocumentAuthorityResolution =
  | {
      kind: "source";
      document: SearchDocumentSearchResult;
      subject: SourceClaim;
    }
  | {
      kind: "memory";
      document: SearchDocumentSearchResult;
      subject: MemoryRecord;
    }
  | {
      kind: "unlinked";
      document: SearchDocumentSearchResult;
      explanation: string;
    }
  | {
      kind: "rejected";
      document: SearchDocumentSearchResult;
      exclusion: ActivationExclusion;
    };

type SearchDocumentAuthorityRepositories = {
  memoryRepository: Pick<MemoryRepository, "listActiveMemory"> &
    Partial<Pick<MemoryRepository, "getMemoryRecordById">>;
  sourceRepository: Pick<SourceRepository, "listClaimsForProject"> &
    Partial<Pick<
      SourceRepository,
      "getSourceClaimForProject" | "getSourceDecisionForProject" | "getSourceChunkForProject"
    >>;
};

const metadataRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const normalizedContentHash = (value: string): string => value.replace(/^sha256:/u, "");

const supportingEvidenceProjectionVersionFor = (
  value: unknown
): (typeof decisionPacketSupportingEvidenceProjectionVersions)[number] | undefined => {
  if (value === undefined) {
    return "raw-prefix-v1";
  }

  return decisionPacketSupportingEvidenceProjectionVersions.find((version) => version === value);
};

type RetrievalEvidence = {
  sourceArtifactId: string;
  sourceChunkId: string;
  contentHash: string;
  renderedContentHash: string;
  truncated: boolean;
  sourceRange?: unknown;
  projectionVersion: (typeof decisionPacketSupportingEvidenceProjectionVersions)[number];
};

const retrievalEvidenceFor = (value: unknown): RetrievalEvidence | undefined => {
  const evidence = metadataRecord(value);
  const projectionVersion = supportingEvidenceProjectionVersionFor(evidence?.["projectionVersion"]);

  if (evidence === undefined || projectionVersion === undefined) return undefined;
  if (typeof evidence["sourceArtifactId"] !== "string") return undefined;
  if (typeof evidence["sourceChunkId"] !== "string") return undefined;
  if (typeof evidence["contentHash"] !== "string") return undefined;
  if (typeof evidence["renderedContentHash"] !== "string") return undefined;
  if (typeof evidence["truncated"] !== "boolean") return undefined;

  return {
    sourceArtifactId: evidence["sourceArtifactId"],
    sourceChunkId: evidence["sourceChunkId"],
    contentHash: evidence["contentHash"],
    renderedContentHash: evidence["renderedContentHash"],
    truncated: evidence["truncated"],
    sourceRange: evidence["sourceRange"],
    projectionVersion
  };
};

const sourceRangeMatches = (expected: unknown, actual: unknown): boolean =>
  expected === undefined ? actual === undefined : actual === expected;

const retrievalEvidenceExclusion = async (input: {
  document: SearchDocumentSearchResult;
  projectId: ProjectId;
  repositories: SearchDocumentAuthorityRepositories;
}): Promise<ActivationExclusion | undefined> => {
  const rawEvidence = input.document.metadata["retrievalEvidence"];

  if (rawEvidence === undefined) {
    return undefined;
  }

  const evidence = retrievalEvidenceFor(rawEvidence);
  const getSourceChunk = input.repositories.sourceRepository.getSourceChunkForProject;
  if (evidence === undefined || getSourceChunk === undefined) {
    return {
      reason: "unsafe",
      explanation: "SearchDocument retrieval evidence lacks verifiable project-scoped provenance."
    };
  }

  const chunk = await getSourceChunk.call(
    input.repositories.sourceRepository,
    input.projectId,
    evidence["sourceChunkId"]
  );
  const renderedHash = createHash("sha256").update(input.document.body).digest("hex");
  const capturedHash = chunk === undefined
    ? undefined
    : createHash("sha256").update(chunk.content).digest("hex");
  const expectedProjection = chunk === undefined
    ? undefined
    : projectDecisionPacketSupportingEvidence(chunk.content, evidence.projectionVersion);
  const canonicalSourceRange = chunk?.metadata["sourceRange"];

  if (
    chunk === undefined ||
    chunk.sourceArtifactId !== evidence["sourceArtifactId"] ||
    capturedHash !== normalizedContentHash(chunk.contentHash) ||
    normalizedContentHash(chunk.contentHash) !== normalizedContentHash(evidence["contentHash"]) ||
    renderedHash !== normalizedContentHash(evidence["renderedContentHash"]) ||
    input.document.body !== expectedProjection?.content ||
    evidence["truncated"] !== expectedProjection?.truncated ||
    !sourceRangeMatches(canonicalSourceRange, evidence.sourceRange)
  ) {
    return {
      reason: "unsafe",
      explanation: "SearchDocument retrieval evidence does not match its project-scoped captured SourceChunk."
    };
  }

  return undefined;
};

const canonicalLinkNames = [
  "sourceClaimId",
  "memoryRecordId",
  "antiMemoryRecordId"
] as const;

type CanonicalLinkName = (typeof canonicalLinkNames)[number];

const canonicalSubjectTypes = new Set([
  "source_claim",
  "memory_record",
  "anti_memory_record"
]);

const rejection = (
  document: SearchDocumentSearchResult,
  reason: ActivationExclusion["reason"],
  explanation: string
): SearchDocumentAuthorityResolution => ({
  kind: "rejected",
  document,
  exclusion: { reason, explanation }
});

const canonicalLinkIds = (
  document: SearchDocumentSearchResult
): readonly { name: CanonicalLinkName; id: string }[] => canonicalLinkNames.flatMap((name) => {
  const id = document[name];

  return id === undefined || id.trim().length === 0 ? [] : [{ name, id }];
});

const expectedLinkForSubjectType = (
  subjectType: SearchDocumentSearchResult["subjectType"]
): CanonicalLinkName | undefined => {
  switch (subjectType) {
    case "source_claim":
      return "sourceClaimId";
    case "memory_record":
      return "memoryRecordId";
    case "anti_memory_record":
      return "antiMemoryRecordId";
    default:
      return undefined;
  }
};

const sourceClaimForProject = async (
  input: SearchDocumentSearchResult,
  projectId: ProjectId,
  repositories: SearchDocumentAuthorityRepositories,
  knownClaimsById: ReadonlyMap<string, SourceClaim>
): Promise<SourceClaim | undefined> => {
  const sourceClaimId = input.sourceClaimId;

  if (sourceClaimId === undefined) {
    return undefined;
  }

  if (repositories.sourceRepository.getSourceClaimForProject !== undefined) {
    return repositories.sourceRepository.getSourceClaimForProject(projectId, sourceClaimId);
  }

  return knownClaimsById.get(sourceClaimId);
};

const memoryRecordForProject = async (
  input: SearchDocumentSearchResult,
  projectId: ProjectId,
  repositories: SearchDocumentAuthorityRepositories,
  knownMemoryRecordsById: ReadonlyMap<string, MemoryRecord>
): Promise<MemoryRecord | undefined> => {
  const memoryRecordId = input.memoryRecordId;

  if (memoryRecordId === undefined) {
    return undefined;
  }

  const record = repositories.memoryRepository.getMemoryRecordById === undefined
    ? knownMemoryRecordsById.get(memoryRecordId)
    : await repositories.memoryRepository.getMemoryRecordById(memoryRecordId);

  return record?.projectId === projectId ? record : undefined;
};

const canonicalLinkExclusion = (
  document: SearchDocumentSearchResult,
  links: readonly { name: CanonicalLinkName; id: string }[]
): ActivationExclusion | undefined => {
  const expectedLink = expectedLinkForSubjectType(document.subjectType);

  if (links.length > 1 || (expectedLink !== undefined && links[0]?.name !== expectedLink)) {
    return {
      reason: "unsafe",
      explanation: "SearchDocument canonical subject type and link columns are incoherent."
    };
  }

  if (links.length === 0 && canonicalSubjectTypes.has(document.subjectType)) {
    return {
      reason: "unsafe",
      explanation: "Canonical SearchDocument subjects require an explicit canonical link."
    };
  }

  return undefined;
};

const sourceClaimProvenanceExclusion = async (input: {
  document: SearchDocumentSearchResult;
  claim: SourceClaim;
  projectId: ProjectId;
  repositories: SearchDocumentAuthorityRepositories;
}): Promise<ActivationExclusion | undefined> => {
  const evidenceExclusion = await retrievalEvidenceExclusion(input);
  if (evidenceExclusion !== undefined) {
    return evidenceExclusion;
  }

  if (
    input.document.sourceArtifactId !== undefined &&
    input.document.sourceArtifactId !== input.claim.sourceArtifactId
  ) {
    return {
      reason: "unsafe",
      explanation: "SearchDocument source artifact does not belong to its canonical source claim."
    };
  }

  if (
    input.document.sourceChunkId !== undefined &&
    input.document.sourceChunkId !== input.claim.sourceChunkId
  ) {
    return {
      reason: "unsafe",
      explanation: "SearchDocument source chunk does not belong to its canonical source claim."
    };
  }

  if (input.document.sourceDecisionId === undefined) {
    return undefined;
  }

  const decision = input.repositories.sourceRepository.getSourceDecisionForProject === undefined
    ? undefined
    : await input.repositories.sourceRepository.getSourceDecisionForProject(
        input.projectId,
        input.document.sourceDecisionId
      );

  return decision?.sourceClaimId === input.claim.id && decision.status === "adopt"
    ? undefined
    : {
        reason: "unsafe",
        explanation:
          "SearchDocument source decision does not belong to its canonical source claim and project."
      };
};

const resolveSourceClaimDocument = async (input: {
  document: SearchDocumentSearchResult;
  projectId: ProjectId;
  repositories: SearchDocumentAuthorityRepositories;
  knownClaimsById: ReadonlyMap<string, SourceClaim>;
}): Promise<SearchDocumentAuthorityResolution> => {
  const claim = await sourceClaimForProject(
    input.document,
    input.projectId,
    input.repositories,
    input.knownClaimsById
  );

  if (claim === undefined) {
    return rejection(
      input.document,
      "unsafe",
      "SearchDocument source claim is missing or outside the activation project."
    );
  }

  if (claim.status !== "accepted") {
    return rejection(
      input.document,
      claim.status === "deprecated" ? "stale" : "unsafe",
      `SearchDocument source claim is not current: ${claim.status}.`
    );
  }

  const provenanceExclusion = await sourceClaimProvenanceExclusion({ ...input, claim });
  if (provenanceExclusion !== undefined) {
    return rejection(
      input.document,
      provenanceExclusion.reason,
      provenanceExclusion.explanation
    );
  }

  return { kind: "source", document: input.document, subject: claim };
};

const resolveMemoryDocument = async (input: {
  document: SearchDocumentSearchResult;
  projectId: ProjectId;
  repositories: SearchDocumentAuthorityRepositories;
  knownMemoryRecordsById: ReadonlyMap<string, MemoryRecord>;
}): Promise<SearchDocumentAuthorityResolution> => {
  if (input.document.metadata["retrievalEvidence"] !== undefined) {
    return rejection(
      input.document,
      "unsafe",
      "SearchDocument retrieval evidence is supported only beneath reviewed source authority."
    );
  }

  const record = await memoryRecordForProject(
    input.document,
    input.projectId,
    input.repositories,
    input.knownMemoryRecordsById
  );

  if (record === undefined) {
    return rejection(
      input.document,
      "unsafe",
      "SearchDocument memory record is missing or outside the activation project."
    );
  }

  if (record.status !== "active") {
    return rejection(
      input.document,
      record.status === "stale" || record.status === "deprecated" ? "stale" : "unsafe",
      `SearchDocument memory record is not current: ${record.status}.`
    );
  }

  return { kind: "memory", document: input.document, subject: record };
};

const resolveLinkedDocument = async (input: {
  document: SearchDocumentSearchResult;
  link: { name: CanonicalLinkName; id: string };
  projectId: ProjectId;
  repositories: SearchDocumentAuthorityRepositories;
  knownClaimsById: ReadonlyMap<string, SourceClaim>;
  knownMemoryRecordsById: ReadonlyMap<string, MemoryRecord>;
}): Promise<SearchDocumentAuthorityResolution> => {
  if (input.document.subjectId !== input.link.id) {
    return rejection(
      input.document,
      "unsafe",
      "SearchDocument subjectId does not match its canonical link."
    );
  }

  if (input.link.name === "antiMemoryRecordId") {
    return rejection(
      input.document,
      "unsafe",
      "AntiMemoryRecord is a rejection projection and cannot become activation authority."
    );
  }

  if (input.link.name === "sourceClaimId") {
    return resolveSourceClaimDocument(input);
  }

  return resolveMemoryDocument(input);
};

const resolveSearchDocument = async (input: {
  document: SearchDocumentSearchResult;
  now: string;
  projectId: ProjectId;
  repositories: SearchDocumentAuthorityRepositories;
  knownClaimsById: ReadonlyMap<string, SourceClaim>;
  knownMemoryRecordsById: ReadonlyMap<string, MemoryRecord>;
}): Promise<SearchDocumentAuthorityResolution> => {
  if (input.document.projectId !== input.projectId) {
    return rejection(
      input.document,
      "unsafe",
      "SearchDocument project scope does not match the activation project."
    );
  }

  if (input.document.validityStatus !== "active") {
    return rejection(
      input.document,
      input.document.validityStatus === "invalidated" ? "invalidated" : "stale",
      "SearchDocument lifecycle status is not active."
    );
  }

  const temporalWindow = assessTemporalWindow(input.document, input.now);
  if (temporalWindow.status !== "current") {
    return rejection(
      input.document,
      temporalWindow.status === "historical" && temporalWindow.reason === "invalidated"
        ? "invalidated"
        : "stale",
      `SearchDocument is not current at activation time (${temporalWindow.status}:${temporalWindow.reason}).`
    );
  }

  const links = canonicalLinkIds(input.document);
  const exclusion = canonicalLinkExclusion(input.document, links);

  if (exclusion !== undefined) {
    return rejection(input.document, exclusion.reason, exclusion.explanation);
  }

  const link = links[0];

  if (link === undefined) {
    return {
      kind: "unlinked",
      document: input.document,
      explanation:
        "SearchDocument has no canonical subject link; it remains non-governing search evidence."
    };
  }

  return resolveLinkedDocument({ ...input, link });
};

export const resolveSearchDocumentAuthority = async (input: {
  documents: readonly SearchDocumentSearchResult[];
  now: string;
  projectId: ProjectId;
  knownMemoryRecords: readonly MemoryRecord[];
  knownSourceClaims: readonly SourceClaim[];
  repositories: SearchDocumentAuthorityRepositories;
}): Promise<SearchDocumentAuthorityResolution[]> => {
  const knownMemoryRecordsById = new Map(
    input.knownMemoryRecords.map((record) => [record.id, record])
  );
  const knownClaimsById = new Map(
    input.knownSourceClaims.map((claim) => [claim.id, claim])
  );

  return Promise.all(input.documents.map((document) => resolveSearchDocument({
    document,
    now: input.now,
    projectId: input.projectId,
    repositories: input.repositories,
    knownClaimsById,
    knownMemoryRecordsById
  })));
};
