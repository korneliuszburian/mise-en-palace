import type {
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";
import {
  readSourceRelationMetadataReadback,
  relatedSourceClaimIdForEdge
} from "@krn/core";
import type {
  RankedActivationCandidate
} from "@krn/harness";

import type {
  DatabaseRuntime
} from "./databaseRuntime.js";
import {
  sourceClaimIdFor,
  sourceClaimIdsForCandidates
} from "./sourceSearchDecisionSupport.js";
import {
  sourceSearchMetadataString
} from "./sourceSearchMetadata.js";

export type SourceSearchRelationDirection = "outgoing" | "incoming";

export interface SourceSearchRelationSupport {
  sourceClaimId: SourceClaim["id"];
  edgeId: SourceClaimEdge["id"];
  direction: SourceSearchRelationDirection;
  relatedSourceClaimId: SourceClaim["id"];
  kind: SourceClaimEdge["kind"];
  consumer?: string;
  doesNotProve?: string;
  evidenceRef?: string;
  sourceDecisionRef?: string;
  sourceRanges?: readonly string[];
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
  createdAt: SourceClaimEdge["createdAt"];
}

export type SourceSearchSourceClaimDocumentLinkKind =
  | "source_claim"
  | "source_chunk"
  | "source_artifact";

export interface SourceSearchSourceClaimDocumentLink {
  sourceClaimId: SourceClaim["id"];
  sourceArtifactId?: string;
  sourceChunkId?: string;
  linkedSearchDocumentCount: number;
  linkedSearchDocumentIds: readonly string[];
  linkKinds: readonly SourceSearchSourceClaimDocumentLinkKind[];
  caveat?: string;
}

export interface SourceSearchGraphRelationKindCount {
  kind: SourceClaimEdge["kind"];
  count: number;
}

export interface SourceSearchGraphReadback {
  claimNodes: number;
  relationEdges: number;
  relationKinds: readonly SourceSearchGraphRelationKindCount[];
  temporalEdges: number;
  contradictionEdges: number;
  duplicateEdges: number;
  invalidationEdges: number;
  graphAware: boolean;
  caveats: readonly string[];
}

interface SourceSearchAnswerCandidateForGraph {
  subjectType: RankedActivationCandidate["subjectType"];
}

interface SourceClaimDocumentLinkInput {
  sourceClaimId: SourceClaim["id"];
  sourceArtifactId?: string;
  sourceChunkId?: string;
}

const uniqueStrings = (values: readonly string[]): readonly string[] => [...new Set(values)];

const sourceClaimDocumentLinkInputFor = (
  candidate: RankedActivationCandidate
): SourceClaimDocumentLinkInput | undefined => {
  const sourceClaimId = sourceClaimIdFor(candidate);

  if (sourceClaimId === undefined) {
    return undefined;
  }

  const sourceArtifactId = sourceSearchMetadataString(candidate.metadata, "sourceArtifactId");
  const sourceChunkId = sourceSearchMetadataString(candidate.metadata, "sourceChunkId");

  return {
    sourceClaimId,
    ...(sourceArtifactId === undefined ? {} : { sourceArtifactId }),
    ...(sourceChunkId === undefined ? {} : { sourceChunkId })
  };
};

const linkKindsForDocument = (
  input: SourceClaimDocumentLinkInput,
  document: {
    sourceClaimId?: string;
    sourceChunkId?: string;
    sourceArtifactId?: string;
  }
): SourceSearchSourceClaimDocumentLinkKind[] => {
  const kinds: SourceSearchSourceClaimDocumentLinkKind[] = [];

  if (document.sourceClaimId === input.sourceClaimId) {
    kinds.push("source_claim");
  }

  if (input.sourceChunkId !== undefined && document.sourceChunkId === input.sourceChunkId) {
    kinds.push("source_chunk");
  }

  if (input.sourceArtifactId !== undefined && document.sourceArtifactId === input.sourceArtifactId) {
    kinds.push("source_artifact");
  }

  return kinds;
};

export const buildSourceClaimDocumentLinks = async (input: {
  included: readonly RankedActivationCandidate[];
  projectId: string;
  retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]>;
}): Promise<SourceSearchSourceClaimDocumentLink[]> => {
  const linkInputs = [...new Map(input.included.flatMap((candidate) => {
    const linkInput = sourceClaimDocumentLinkInputFor(candidate);

    return linkInput === undefined ? [] : [[linkInput.sourceClaimId, linkInput] as const];
  })).values()];

  if (linkInputs.length === 0) {
    return [];
  }

  if (input.retrievalRepository.listSearchDocumentsForSourceLinks === undefined) {
    return linkInputs.map((linkInput) => ({
      sourceClaimId: linkInput.sourceClaimId,
      ...(linkInput.sourceArtifactId === undefined ? {} : { sourceArtifactId: linkInput.sourceArtifactId }),
      ...(linkInput.sourceChunkId === undefined ? {} : { sourceChunkId: linkInput.sourceChunkId }),
      linkedSearchDocumentCount: 0,
      linkedSearchDocumentIds: [],
      linkKinds: [],
      caveat: "artifact-linked SearchDocument lookup is unavailable on this retrieval repository"
    }));
  }

  const linkedDocuments = await input.retrievalRepository.listSearchDocumentsForSourceLinks({
    projectId: input.projectId,
    sourceClaimIds: uniqueStrings(linkInputs.map((linkInput) => linkInput.sourceClaimId)),
    sourceArtifactIds: uniqueStrings(linkInputs.flatMap((linkInput) =>
      linkInput.sourceArtifactId === undefined ? [] : [linkInput.sourceArtifactId]
    )),
    sourceChunkIds: uniqueStrings(linkInputs.flatMap((linkInput) =>
      linkInput.sourceChunkId === undefined ? [] : [linkInput.sourceChunkId]
    )),
    limit: Math.max(20, linkInputs.length * 5)
  });

  return linkInputs.map((linkInput) => {
    const linkedIds: string[] = [];
    const linkKinds = new Set<SourceSearchSourceClaimDocumentLinkKind>();

    for (const document of linkedDocuments) {
      const documentLinkKinds = linkKindsForDocument(linkInput, document);

      if (documentLinkKinds.length > 0) {
        linkedIds.push(document.id);
        for (const kind of documentLinkKinds) {
          linkKinds.add(kind);
        }
      }
    }

    return {
      sourceClaimId: linkInput.sourceClaimId,
      ...(linkInput.sourceArtifactId === undefined ? {} : { sourceArtifactId: linkInput.sourceArtifactId }),
      ...(linkInput.sourceChunkId === undefined ? {} : { sourceChunkId: linkInput.sourceChunkId }),
      linkedSearchDocumentCount: linkedIds.length,
      linkedSearchDocumentIds: linkedIds,
      linkKinds: [...linkKinds],
      ...(linkedIds.length === 0
        ? { caveat: "no active SearchDocument is linked by source claim, source chunk, or source artifact" }
        : {})
    };
  });
};

const relationDirectionFor = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): SourceSearchRelationDirection =>
  edge.fromSourceClaimId === sourceClaimId ? "outgoing" : "incoming";

const relationMetadataEntries = (
  metadata: ReturnType<typeof readSourceRelationMetadataReadback>
): ReadonlyArray<readonly [keyof SourceSearchRelationSupport, string | readonly string[] | undefined]> => [
  ["consumer", metadata.consumer],
  ["doesNotProve", metadata.doesNotProve],
  ["evidenceRef", metadata.evidenceRef],
  ["sourceDecisionRef", metadata.sourceDecisionRef],
  ["sourceRanges", metadata.sourceRanges.length === 0 ? undefined : metadata.sourceRanges],
  ["validFrom", metadata.validFrom],
  ["validUntil", metadata.validUntil],
  ["invalidatedAt", metadata.invalidatedAt]
];

const relationMetadataReadback = (
  metadata: ReturnType<typeof readSourceRelationMetadataReadback>
): Partial<SourceSearchRelationSupport> =>
  Object.fromEntries(relationMetadataEntries(metadata).filter(([, value]) =>
    value !== undefined)) as Partial<SourceSearchRelationSupport>;

const relationSupportFromEdge = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): SourceSearchRelationSupport | undefined => {
  const metadata = readSourceRelationMetadataReadback(edge.metadata);
  const relatedSourceClaimId = relatedSourceClaimIdForEdge(sourceClaimId, edge);

  if (relatedSourceClaimId === undefined) {
    return undefined;
  }

  const support: SourceSearchRelationSupport = {
    sourceClaimId,
    edgeId: edge.id,
    direction: relationDirectionFor(sourceClaimId, edge),
    relatedSourceClaimId,
    kind: edge.kind,
    createdAt: edge.createdAt,
    ...relationMetadataReadback(metadata)
  };

  return support;
};

const buildRelationKindCounts = (
  relationSupport: readonly SourceSearchRelationSupport[]
): readonly SourceSearchGraphRelationKindCount[] => {
  const counts = new Map<SourceClaimEdge["kind"], number>();

  for (const relation of relationSupport) {
    counts.set(relation.kind, (counts.get(relation.kind) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, count]) => ({ kind, count }));
};

const hasTemporalMetadata = (relation: SourceSearchRelationSupport): boolean =>
  relation.validFrom !== undefined ||
  relation.validUntil !== undefined ||
  relation.invalidatedAt !== undefined ||
  relation.kind === "supersedes" ||
  relation.kind === "invalidates" ||
  relation.kind === "expires";

export const buildGraphReadback = (input: {
  supportingClaims: readonly SourceSearchAnswerCandidateForGraph[];
  relationSupport: readonly SourceSearchRelationSupport[];
}): SourceSearchGraphReadback => {
  const contradictionEdges = input.relationSupport.filter(
    (relation) => relation.kind === "contradicts"
  ).length;
  const duplicateEdges = input.relationSupport.filter(
    (relation) => relation.kind === "duplicates"
  ).length;
  const invalidationEdges = input.relationSupport.filter((relation) =>
    relation.kind === "invalidates" ||
    relation.kind === "expires" ||
    relation.kind === "supersedes"
  ).length;
  const temporalEdges = input.relationSupport.filter(hasTemporalMetadata).length;

  return {
    claimNodes: input.supportingClaims.length,
    relationEdges: input.relationSupport.length,
    relationKinds: buildRelationKindCounts(input.relationSupport),
    temporalEdges,
    contradictionEdges,
    duplicateEdges,
    invalidationEdges,
    graphAware: input.relationSupport.length > 0,
    caveats: [
      "graph readback summarizes existing SourceClaimEdge rows only",
      "entity extraction is not available in this bounded readback",
      "relation support does not prove source truth, edge correctness, or ranking quality"
    ]
  };
};

export const buildRelationSupport = async (input: {
  included: readonly RankedActivationCandidate[];
  sourceRepository: Pick<DatabaseRuntime["sourceRepository"], "listSourceClaimEdgesForClaim">;
}): Promise<SourceSearchRelationSupport[]> => {
  const sourceClaimIds = sourceClaimIdsForCandidates(input.included);
  const edgeGroups = await Promise.all(sourceClaimIds.map(async (sourceClaimId) => {
    const edges = await input.sourceRepository.listSourceClaimEdgesForClaim(sourceClaimId);

    return edges.flatMap((edge) => {
      const support = relationSupportFromEdge(sourceClaimId, edge);

      return support === undefined ? [] : [support];
    });
  }));

  return edgeGroups.flat();
};
