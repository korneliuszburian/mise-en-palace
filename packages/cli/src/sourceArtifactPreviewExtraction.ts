export interface SourceArtifactPreviewChunk {
  ordinal: number;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
  preview: string;
}

type ExtractionEntityKind = "markdown_heading" | "inline_code";
type ExtractionRelationKind = "scoped_by_heading";

export interface ExtractionEntityCandidate {
  id: string;
  label: string;
  kind: ExtractionEntityKind;
  sourceRange: string;
  lineNumber: number;
}

export interface ExtractionClaimCandidate {
  id: string;
  text: string;
  sourceRange: string;
  lineNumber: number;
  reviewability: "ready" | "needs_more_evidence";
  reviewabilityReason: string;
}

export interface ExtractionRelationCandidate {
  id: string;
  kind: ExtractionRelationKind;
  fromCandidateId: string;
  toCandidateId: string;
  sourceRange: string;
}

export interface ExtractionCandidatePreview {
  entities: readonly ExtractionEntityCandidate[];
  claims: readonly ExtractionClaimCandidate[];
  deferredClaims: readonly ExtractionClaimCandidate[];
  relations: readonly ExtractionRelationCandidate[];
}

interface ClaimScanState {
  insideFence: boolean;
  blockStartLine: number | undefined;
  blockEndLine: number | undefined;
  blockLines: string[];
  blockIsFenced: boolean;
}

interface ClaimCollections {
  claims: ExtractionClaimCandidate[];
  deferredClaims: ExtractionClaimCandidate[];
  seenClaims: Set<string>;
}

const maxCandidatesPerKind = 8;

const sourceRangeForLine = (lineNumber: number): string =>
  `lines ${lineNumber}-${lineNumber}`;

const candidateSlug = (value: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 40);

  return slug.length === 0 ? "candidate" : slug;
};

const stripMarkdownPrefix = (value: string): string =>
  value
    .replace(/^#{1,6}\s+/u, "")
    .replace(/^[-*]\s+/u, "")
    .trim();

const addEntityCandidate = (
  entities: ExtractionEntityCandidate[],
  seenEntities: Set<string>,
  kind: ExtractionEntityKind,
  label: string,
  lineNumber: number
): void => {
  const key = `${kind}:${lineNumber}:${label}`;

  if (label.length === 0 || seenEntities.has(key)) {
    return;
  }

  seenEntities.add(key);
  entities.push({
    id: `entity-candidate:${lineNumber}:${candidateSlug(label)}`,
    label,
    kind,
    sourceRange: sourceRangeForLine(lineNumber),
    lineNumber
  });
};

const addHeadingEntityCandidate = (
  line: string,
  lineNumber: number,
  entities: ExtractionEntityCandidate[],
  seenEntities: Set<string>
): void => {
  const headingMatch = /^(#{1,6})\s+(.+)$/u.exec(line);
  const label = headingMatch?.[2];

  if (label !== undefined) {
    addEntityCandidate(entities, seenEntities, "markdown_heading", stripMarkdownPrefix(label), lineNumber);
  }
};

const addInlineCodeEntityCandidates = (
  line: string,
  lineNumber: number,
  entities: ExtractionEntityCandidate[],
  seenEntities: Set<string>
): void => {
  for (const match of line.matchAll(/`([^`\n]{2,80})`/gu)) {
    const label = match[1]?.trim();

    if (label !== undefined) {
      addEntityCandidate(entities, seenEntities, "inline_code", label, lineNumber);
    }
  }
};

const collectEntityCandidates = (
  chunks: readonly SourceArtifactPreviewChunk[]
): ExtractionEntityCandidate[] => {
  const entities: ExtractionEntityCandidate[] = [];
  const seenEntities = new Set<string>();

  for (const chunk of chunks) {
    for (const [index, rawLine] of chunk.content.split("\n").entries()) {
      const line = rawLine.trim();

      if (line.length === 0) {
        continue;
      }

      const lineNumber = chunk.startLine + index;

      addHeadingEntityCandidate(line, lineNumber, entities, seenEntities);
      addInlineCodeEntityCandidates(line, lineNumber, entities, seenEntities);
    }
  }

  return entities;
};

const createClaimScanState = (insideFence: boolean): ClaimScanState => ({
  insideFence,
  blockStartLine: undefined,
  blockEndLine: undefined,
  blockLines: [],
  blockIsFenced: insideFence
});

const resetClaimBlock = (state: ClaimScanState): void => {
  state.blockStartLine = undefined;
  state.blockEndLine = undefined;
  state.blockLines = [];
  state.blockIsFenced = state.insideFence;
};

const appendClaimLine = (
  state: ClaimScanState,
  lineNumber: number,
  line: string,
  fenced: boolean
): void => {
  state.blockStartLine ??= lineNumber;
  state.blockEndLine = lineNumber;
  state.blockIsFenced = state.blockIsFenced || fenced;
  state.blockLines.push(stripMarkdownPrefix(line));
};

const hasClaimSignal = (claim: string): boolean =>
  claim.length >= 24 &&
  /\b(should|must|can|cannot|does|do|is|are|requires|reject|proves?|supports|contradicts|narrows|exposes?)\b/iu.test(claim);

const reviewabilityReasonForClaim = (isFenced: boolean, isLeadInFragment: boolean): string => {
  if (isFenced) {
    return "Fenced/code or source-decision metadata block requires human extraction before it can become a claim candidate.";
  }

  if (isLeadInFragment) {
    return "Lead-in fragment ends with ':' and needs following evidence before it can become a claim candidate.";
  }

  return "Candidate has claim signal, source range, and no deterministic noise marker.";
};

const createClaimCandidate = (
  state: ClaimScanState,
  normalizedClaim: string
): ExtractionClaimCandidate | undefined => {
  if (
    state.blockStartLine === undefined ||
    state.blockEndLine === undefined ||
    !hasClaimSignal(normalizedClaim)
  ) {
    return undefined;
  }

  const isLeadInFragment = /:\s*$/u.test(normalizedClaim);
  const reviewability = state.blockIsFenced || isLeadInFragment
    ? "needs_more_evidence"
    : "ready";

  return {
    id: `claim-candidate:${state.blockStartLine}:${candidateSlug(normalizedClaim)}`,
    text: normalizedClaim,
    sourceRange: `lines ${state.blockStartLine}-${state.blockEndLine}`,
    lineNumber: state.blockStartLine,
    reviewability,
    reviewabilityReason: reviewabilityReasonForClaim(state.blockIsFenced, isLeadInFragment)
  };
};

const flushClaimBlock = (
  state: ClaimScanState,
  collections: ClaimCollections
): void => {
  if (
    state.blockStartLine === undefined ||
    state.blockEndLine === undefined ||
    state.blockLines.length === 0
  ) {
    resetClaimBlock(state);
    return;
  }

  const normalizedClaim = state.blockLines.join(" ").replace(/\s+/gu, " ").trim();
  const claimKey = `${state.blockStartLine}-${state.blockEndLine}:${normalizedClaim}`;
  const candidate = collections.seenClaims.has(claimKey)
    ? undefined
    : createClaimCandidate(state, normalizedClaim);

  if (candidate !== undefined) {
    collections.seenClaims.add(claimKey);
    (candidate.reviewability === "ready"
      ? collections.claims
      : collections.deferredClaims).push(candidate);
  }

  resetClaimBlock(state);
};

const handleFenceLine = (
  state: ClaimScanState,
  lineNumber: number,
  line: string,
  collections: ClaimCollections
): void => {
  if (!state.insideFence) {
    flushClaimBlock(state, collections);
    state.insideFence = true;
    appendClaimLine(state, lineNumber, line, true);
    return;
  }

  appendClaimLine(state, lineNumber, line, true);
  state.insideFence = false;
  flushClaimBlock(state, collections);
};

const scanClaimLine = (
  state: ClaimScanState,
  lineNumber: number,
  line: string,
  collections: ClaimCollections
): void => {
  if (/^```/u.test(line)) {
    handleFenceLine(state, lineNumber, line, collections);
    return;
  }

  if (state.insideFence) {
    if (line.length > 0) {
      appendClaimLine(state, lineNumber, line, true);
    }
    return;
  }

  if (line.length === 0 || /^#{1,6}\s+/u.test(line)) {
    flushClaimBlock(state, collections);
    return;
  }

  if (/^[-*]\s+/u.test(line) && state.blockLines.length > 0) {
    flushClaimBlock(state, collections);
  }

  appendClaimLine(state, lineNumber, line, false);
};

const collectClaimCandidates = (
  chunks: readonly SourceArtifactPreviewChunk[]
): Pick<ClaimCollections, "claims" | "deferredClaims"> => {
  const collections: ClaimCollections = {
    claims: [],
    deferredClaims: [],
    seenClaims: new Set<string>()
  };
  let insideFence = false;

  for (const chunk of chunks) {
    const state = createClaimScanState(insideFence);

    for (const [index, rawLine] of chunk.content.split("\n").entries()) {
      scanClaimLine(state, chunk.startLine + index, rawLine.trim(), collections);
    }

    flushClaimBlock(state, collections);
    insideFence = state.insideFence;
  }

  return collections;
};

const nearestHeadingBefore = (
  claim: ExtractionClaimCandidate,
  headingEntities: readonly ExtractionEntityCandidate[]
): ExtractionEntityCandidate | undefined =>
  [...headingEntities].reverse().find((entity) => entity.lineNumber < claim.lineNumber);

const createRelationCandidate = (
  claim: ExtractionClaimCandidate,
  heading: ExtractionEntityCandidate
): ExtractionRelationCandidate => ({
  id: `relation-candidate:${heading.lineNumber}-${claim.lineNumber}:scoped-by-heading`,
  kind: "scoped_by_heading",
  fromCandidateId: claim.id,
  toCandidateId: heading.id,
  sourceRange: `${heading.sourceRange}, ${claim.sourceRange}`
});

const collectRelationCandidates = (
  claims: readonly ExtractionClaimCandidate[],
  entities: readonly ExtractionEntityCandidate[]
): ExtractionRelationCandidate[] => {
  const headingEntities = entities.filter((entity) => entity.kind === "markdown_heading");

  return claims.flatMap((claim): ExtractionRelationCandidate[] => {
    const heading = nearestHeadingBefore(claim, headingEntities);

    return heading === undefined ? [] : [createRelationCandidate(claim, heading)];
  });
};

export const extractLocalSourceCandidates = (
  chunks: readonly SourceArtifactPreviewChunk[]
): ExtractionCandidatePreview => {
  const entities = collectEntityCandidates(chunks);
  const { claims, deferredClaims } = collectClaimCandidates(chunks);
  const relations = collectRelationCandidates(claims, entities);

  return {
    entities: entities.slice(0, maxCandidatesPerKind),
    claims: claims.slice(0, maxCandidatesPerKind),
    deferredClaims: deferredClaims.slice(0, maxCandidatesPerKind),
    relations: relations.slice(0, maxCandidatesPerKind)
  };
};
