import {
  readFile
} from "node:fs/promises";

import type {
  SourceClaimEdgeId,
  SourceClaimEdgeKind,
  SourceLineageRef,
  SourceRelationReviewFocus,
  TargetFitSummary
} from "@krn/core";
import {
  genericOnlyTargetFitSummary,
  parseTargetFitSummary
} from "@krn/core";
import type {
  ConsensusCandidateEvaluationInput,
  ConsensusCandidateKind,
  ConsensusEvaluationEvidence,
  ConsensusEvidencePosition,
  KnowledgeAcquisitionActivationUtilityEvidence,
  KnowledgeAcquisitionActivationUtilitySignalEvidence,
  KnowledgeAcquisitionActivationUtilityStrength,
  KnowledgeAcquisitionActivationUtilityVerdict,
  KnowledgeAcquisitionLinkedDocumentEvidence,
  KnowledgeAcquisitionRequest
} from "@krn/workers";

import {
  resolveRepoInputFile
} from "./cliFileBoundary.js";

const defaultAcquisitionConsumer =
  "heartbeat knowledge acquisition preview";
const defaultAcquisitionFalsifier =
  "A source/brain search missing-evidence or generic-only target-fit readback should produce a candidate-only acquisition request without mutating Memory Core.";
const defaultAcquisitionDoesNotProve =
  "Missing-evidence or generic-only target-fit readback does not prove source truth, acquired knowledge quality, ranking quality, crawler readiness, autonomous worker execution, or Memory Core mutation.";

type JsonRecord = Record<string, unknown>;

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonRecord = (raw: string, filePath: string): JsonRecord => {
  let parsed: unknown;

  try {
    const parsedValue: unknown = JSON.parse(raw);

    parsed = parsedValue;
  } catch (error) {
    throw new Error(
      `${filePath} must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    );
  }

  if (!isJsonRecord(parsed)) {
    throw new Error(`${filePath} JSON must be an object`);
  }

  return parsed;
};

const recordValue = (value: unknown): JsonRecord | undefined =>
  isJsonRecord(value) ? value : undefined;

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const stringArrayValue = (value: unknown): readonly string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const numberValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const booleanValue = (value: unknown): boolean =>
  value === true;

const arrayLength = (value: unknown): number =>
  Array.isArray(value) ? value.length : 0;

const activationUtilityStrengthValue = (
  value: unknown
): KnowledgeAcquisitionActivationUtilityStrength | undefined =>
  value === "useful" || value === "weak" || value === "missing" ? value : undefined;

const activationUtilityVerdictValue = (
  value: unknown
): KnowledgeAcquisitionActivationUtilityVerdict | undefined =>
  value === "linked_evidence_exploration_candidate" ||
  value === "selected_knowledge_sufficient" ||
  value === "insufficient_evidence"
    ? value
    : undefined;

const oneOf = <TValue extends string>(
  value: unknown,
  allowed: readonly TValue[]
): TValue | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return allowed.find((item) => item === value);
};

const consensusCandidateKinds = [
  "memory_candidate",
  "anti_memory_candidate",
  "source_decision_candidate",
  "source_claim_candidate",
  "eval_candidate",
  "policy_candidate",
  "skill_candidate",
  "unknown_candidate"
] as const satisfies readonly ConsensusCandidateKind[];

const consensusCandidateKindValue = (
  value: unknown
): ConsensusCandidateKind | undefined =>
  oneOf(value, consensusCandidateKinds);

const consensusEvidencePositions = [
  "support",
  "dissent",
  "risk"
] as const satisfies readonly ConsensusEvidencePosition[];

const consensusEvidencePositionValue = (
  value: unknown
): ConsensusEvidencePosition | undefined =>
  oneOf(value, consensusEvidencePositions);

const sourceClaimEdgeKinds = [
  "supports",
  "contradicts",
  "qualifies",
  "depends_on",
  "supersedes",
  "duplicates",
  "narrows",
  "invalidates",
  "expires"
] as const satisfies readonly SourceClaimEdgeKind[];

const sourceClaimEdgeKindValue = (
  value: unknown
): SourceClaimEdgeKind | undefined =>
  oneOf(value, sourceClaimEdgeKinds);

const sourceRelationReviewFocuses = [
  "contradiction",
  "duplicate",
  "supersession",
  "invalidation",
  "expiration",
  "relation_evidence",
  "stale_connected_claim"
] as const satisfies readonly SourceRelationReviewFocus[];

const sourceRelationReviewFocusValue = (
  value: unknown
): SourceRelationReviewFocus | undefined =>
  oneOf(value, sourceRelationReviewFocuses);

const safeSlug = (value: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug.length === 0 ? "readback" : slug;
};

const uniqueStrings = (values: readonly string[]): readonly string[] =>
  Array.from(new Set(values));

const joinedDoesNotProve = (values: readonly string[]): string =>
  uniqueStrings(values).join(" ") || defaultAcquisitionDoesNotProve;

const optionalTextAsList = (value: unknown): readonly string[] => {
  const text = stringValue(value);

  return text === undefined ? [] : [text];
};

const linkedDocumentEvidenceFromBrainSourceSearch = (
  sourceSearch: JsonRecord
): KnowledgeAcquisitionLinkedDocumentEvidence | undefined => {
  const sourceClaimDocumentLinks = numberValue(sourceSearch["sourceClaimDocumentLinks"]);
  const linkedSearchDocuments = numberValue(sourceSearch["linkedSearchDocuments"]);
  const caveats = stringArrayValue(sourceSearch["sourceClaimDocumentLinkCaveats"]);

  if (sourceClaimDocumentLinks === 0 && linkedSearchDocuments === 0 && caveats.length === 0) {
    return undefined;
  }

  return {
    sourceClaimDocumentLinks,
    linkedSearchDocuments,
    caveats
  };
};

const sourceEvidenceCount = (sourceSearch: JsonRecord): number =>
  numberValue(sourceSearch["supportingClaims"]) +
  numberValue(sourceSearch["supportingDocuments"]) +
  numberValue(sourceSearch["sourceClaimDocumentLinks"]) +
  numberValue(sourceSearch["linkedSearchDocuments"]) +
  numberValue(sourceSearch["relationSupport"]) +
  numberValue(sourceSearch["sourceDecisionSupport"]);

const hasUsefulSourceEvidence = (sourceSearch: JsonRecord): boolean =>
  stringValue(sourceSearch["answerUsefulness"]) === "useful" ||
  sourceEvidenceCount(sourceSearch) > 0;

const targetFitSummaryFromBrainSearch = (
  readback: JsonRecord
): TargetFitSummary | undefined =>
  parseTargetFitSummary(recordValue(readback["knowledgeCards"])?.["targetFitSummary"]);

const genericOnlyTargetFitMissingEvidence = (
  input: {
    query: string;
    sourceSearch: JsonRecord;
    targetFitSummary: TargetFitSummary | undefined;
  }
): readonly string[] => {
  const targetFitSummary = genericOnlyTargetFitSummary(input.targetFitSummary);

  if (targetFitSummary === undefined || !hasUsefulSourceEvidence(input.sourceSearch)) {
    return [];
  }

  return [
    `target-specific SourceClaim evidence for brain-search query "${input.query}"`
  ];
};

const genericOnlyTargetFitDiagnostics = (
  input: {
    sourceSearch: JsonRecord;
    targetFitSummary: TargetFitSummary | undefined;
  }
): readonly string[] => {
  const targetFitSummary = genericOnlyTargetFitSummary(input.targetFitSummary);

  if (targetFitSummary === undefined) {
    return [];
  }

  return [
    "targetFitSummary: generic_only_selected_knowledge",
    `targetSpecific: ${targetFitSummary.targetSpecific}`,
    `genericGuardrail: ${targetFitSummary.genericGuardrail}`,
    `sourceSearch answerUsefulness: ${stringValue(input.sourceSearch["answerUsefulness"]) ?? "unknown"}`,
    `source evidence count: ${sourceEvidenceCount(input.sourceSearch)}`
  ];
};

const genericOnlyTargetFitRecommendedFollowUp = (
  targetFitSummary: TargetFitSummary | undefined
): readonly string[] => {
  const genericOnlySummary = genericOnlyTargetFitSummary(targetFitSummary);

  if (genericOnlySummary === undefined) {
    return [];
  }

  return [
    "Create or review target-specific SourceClaim evidence before treating generic selectedKnowledge as sufficient.",
    ...optionalTextAsList(genericOnlySummary.recommendedUse)
  ];
};

const activationUtilitySignalEvidence = (
  input: {
    signal: KnowledgeAcquisitionActivationUtilitySignalEvidence["signal"];
    value: unknown;
  }
): KnowledgeAcquisitionActivationUtilitySignalEvidence | undefined => {
  const record = recordValue(input.value);

  if (record === undefined) {
    return undefined;
  }

  const strength = activationUtilityStrengthValue(record["strength"]);

  if (strength === undefined) {
    return undefined;
  }

  return {
    signal: input.signal,
    strength,
    reasons: stringArrayValue(record["reasons"])
  };
};

const activationUtilityEvidenceFromBrainSearch = (
  readback: JsonRecord
): KnowledgeAcquisitionActivationUtilityEvidence | undefined => {
  const activationUtility = recordValue(readback["activationUtility"]);

  if (activationUtility === undefined) {
    return undefined;
  }

  const verdict = activationUtilityVerdictValue(activationUtility["verdict"]);

  if (verdict !== "linked_evidence_exploration_candidate") {
    return undefined;
  }

  const selectedKnowledge = activationUtilitySignalEvidence({
    signal: "selected_knowledge",
    value: activationUtility["selectedKnowledge"]
  });
  const sourceLinkGraph = activationUtilitySignalEvidence({
    signal: "source_link_graph",
    value: activationUtility["sourceLinkGraph"]
  });
  const recommendedNextAction = stringValue(activationUtility["recommendedNextAction"]);
  const doesNotProve = stringValue(activationUtility["doesNotProve"]);

  if (
    selectedKnowledge === undefined ||
    sourceLinkGraph === undefined ||
    recommendedNextAction === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    verdict,
    selectedKnowledge,
    sourceLinkGraph,
    recommendedNextAction,
    doesNotProve
  };
};

const brainSearchAcquisitionRequestFromSourceSearch = (
  input: {
    filePath: string;
    query: string;
    readback: JsonRecord;
    sourceSearch: JsonRecord;
    topLevelRecommendedNextAction: readonly string[];
  }
): KnowledgeAcquisitionRequest | undefined => {
  const targetFitSummary = targetFitSummaryFromBrainSearch(input.readback);
  const missingEvidence = uniqueStrings([
    ...stringArrayValue(input.sourceSearch["missingEvidence"]),
    ...genericOnlyTargetFitMissingEvidence({
      query: input.query,
      sourceSearch: input.sourceSearch,
      targetFitSummary
    })
  ]);
  const linkedDocumentEvidence = linkedDocumentEvidenceFromBrainSourceSearch(input.sourceSearch);
  const activationUtilityEvidence = activationUtilityEvidenceFromBrainSearch(input.readback);

  if (missingEvidence.length === 0) {
    return undefined;
  }

  return {
    id: `readback-brain-search-${safeSlug(input.query)}`,
    source: "brain_search",
    query: input.query,
    missingEvidence,
    queryShapeDiagnostics: uniqueStrings(
      [
        ...stringArrayValue(input.sourceSearch["queryShapeDiagnostics"]),
        ...genericOnlyTargetFitDiagnostics({
          sourceSearch: input.sourceSearch,
          targetFitSummary
        })
      ]
    ),
    recommendedFollowUp: uniqueStrings([
      ...stringArrayValue(input.sourceSearch["recommendedFollowUp"]),
      ...genericOnlyTargetFitRecommendedFollowUp(targetFitSummary),
      ...input.topLevelRecommendedNextAction,
      ...optionalTextAsList(activationUtilityEvidence?.recommendedNextAction)
    ]),
    ...(linkedDocumentEvidence === undefined ? {} : { linkedDocumentEvidence }),
    ...(activationUtilityEvidence === undefined ? {} : { activationUtilityEvidence }),
    evidenceRefs: [input.filePath],
    consumer: defaultAcquisitionConsumer,
    falsifier: defaultAcquisitionFalsifier,
    doesNotProve: joinedDoesNotProve([
      ...stringArrayValue(input.sourceSearch["doesNotProve"]),
      ...optionalTextAsList(targetFitSummary?.doesNotProve),
      ...optionalTextAsList(activationUtilityEvidence?.doesNotProve),
      ...stringArrayValue(recordValue(input.readback["proof"])?.["doesNotProve"])
    ])
  };
};

const brainSearchAcquisitionRequest = (
  input: {
    filePath: string;
    readback: JsonRecord;
  }
): KnowledgeAcquisitionRequest | undefined => {
  const sourceSearch = recordValue(input.readback["sourceSearch"]);

  if (sourceSearch === undefined) {
    return undefined;
  }

  return brainSearchAcquisitionRequestFromSourceSearch({
    ...input,
    query: stringValue(input.readback["query"]) ?? "unknown query",
    sourceSearch,
    topLevelRecommendedNextAction: optionalTextAsList(input.readback["recommendedNextAction"])
  });
};

const sourceSearchAcquisitionRequest = (
  input: {
    filePath: string;
    readback: JsonRecord;
  }
): KnowledgeAcquisitionRequest | undefined => {
  const query = stringValue(input.readback["query"]) ?? "unknown query";
  const answerPackage = recordValue(input.readback["answerPackage"]);

  if (answerPackage === undefined) {
    return undefined;
  }

  const missingEvidence = stringArrayValue(answerPackage["missingEvidence"]);

  if (missingEvidence.length === 0) {
    return undefined;
  }

  return {
    id: `readback-source-search-${safeSlug(query)}`,
    source: "source_search",
    query,
    missingEvidence,
    queryShapeDiagnostics: uniqueStrings(
      stringArrayValue(answerPackage["queryShapeDiagnostics"])
    ),
    recommendedFollowUp: uniqueStrings([
      ...stringArrayValue(answerPackage["recommendedFollowUp"]),
      ...optionalTextAsList(answerPackage["recommendedNextAction"])
    ]),
    evidenceRefs: [input.filePath],
    consumer: defaultAcquisitionConsumer,
    falsifier: defaultAcquisitionFalsifier,
    doesNotProve: joinedDoesNotProve([
      ...stringArrayValue(answerPackage["doesNotProve"]),
      ...stringArrayValue(recordValue(input.readback["proof"])?.["doesNotProve"])
    ])
  };
};

const statusDiagnostic = (
  label: string,
  record: JsonRecord | undefined
): string | undefined => {
  const status = stringValue(record?.["status"]);

  return status === undefined ? undefined : `${label}: ${status}`;
};

const ingestStatusDiagnostic = (
  label: string,
  ingestLoop: JsonRecord | undefined
): string | undefined => {
  const status = stringValue(ingestLoop?.[label]);

  return status === undefined ? undefined : `${label}: ${status}`;
};

const missingIngestReadbackEvidence = (
  input: {
    file: string;
    persistence: JsonRecord | undefined;
    ingestLoop: JsonRecord | undefined;
  }
): readonly string[] => {
  if (!booleanValue(input.persistence?.["enabled"])) {
    return [
      `persisted source/search readback for source artifact preview ${input.file}`
    ];
  }

  const missing: string[] = [];

  if (stringValue(input.ingestLoop?.["chunkToSearchDocument"]) !== "ready") {
    missing.push(`SearchDocument readback for source artifact preview ${input.file}`);
  }

  if (stringValue(input.ingestLoop?.["searchDocumentToActivationReadback"]) !== "ready") {
    missing.push(`activation readback for source artifact preview ${input.file}`);
  }

  return missing;
};

const sourceArtifactPreviewDiagnostics = (
  input: {
    readback: JsonRecord;
    candidateBridge: JsonRecord | undefined;
    ingestLoop: JsonRecord | undefined;
  }
): readonly string[] => uniqueStrings([
  `access: ${stringValue(input.readback["access"]) ?? "unknown"}`,
  `chunks: ${arrayLength(input.readback["chunks"])}`,
  ...optionalTextAsList(statusDiagnostic(
    "searchDocumentCandidate",
    recordValue(input.candidateBridge?.["searchDocumentCandidate"])
  )),
  ...optionalTextAsList(statusDiagnostic(
    "sourceClaimCandidate",
    recordValue(input.candidateBridge?.["sourceClaimCandidate"])
  )),
  ...optionalTextAsList(statusDiagnostic(
    "sourceClaimEdgeCandidate",
    recordValue(input.candidateBridge?.["sourceClaimEdgeCandidate"])
  )),
  ...optionalTextAsList(ingestStatusDiagnostic(
    "chunkToSearchDocument",
    input.ingestLoop
  )),
  ...optionalTextAsList(ingestStatusDiagnostic(
    "searchDocumentToActivationReadback",
    input.ingestLoop
  ))
]);

const sourceArtifactPreviewFollowUp = (
  ingestLoop: JsonRecord | undefined
): readonly string[] => uniqueStrings([
  ...optionalTextAsList(ingestLoop?.["sourceSearchReadbackCommand"]),
  ...optionalTextAsList(ingestLoop?.["brainSearchReadbackCommand"]),
  "Use this source artifact preview JSON as readback evidence before opening crawler, schema, ranking, API/MCP, worker, or Memory Core work."
]);

const sourceArtifactPreviewDoesNotProve = (
  input: {
    readback: JsonRecord;
    ingestLoop: JsonRecord | undefined;
  }
): string => joinedDoesNotProve([
  ...stringArrayValue(recordValue(input.readback["proof"])?.["doesNotProve"]),
  ...optionalTextAsList(input.ingestLoop?.["doesNotProve"])
]);

const sourceArtifactPreviewAcquisitionRequest = (
  input: {
    filePath: string;
    readback: JsonRecord;
  }
): KnowledgeAcquisitionRequest | undefined => {
  if (stringValue(input.readback["kind"]) !== "krn.sourceArtifactPreview.v1") {
    return undefined;
  }

  const artifact = recordValue(input.readback["artifact"]);
  const candidateBridge = recordValue(input.readback["candidateBridge"]);
  const persistence = recordValue(input.readback["persistence"]);
  const readback = recordValue(persistence?.["readback"]);
  const ingestLoop = recordValue(readback?.["ingestLoop"]);
  const file = stringValue(artifact?.["file"]) ?? "unknown source artifact";
  const contentHash = stringValue(artifact?.["contentHash"]);
  const missingEvidence = missingIngestReadbackEvidence({
    file,
    persistence,
    ingestLoop
  });

  if (missingEvidence.length === 0) {
    return undefined;
  }

  return {
    id: `readback-source-artifact-preview-${safeSlug(file)}`,
    source: "source_artifact_preview",
    query: file,
    missingEvidence,
    queryShapeDiagnostics: sourceArtifactPreviewDiagnostics({
      readback: input.readback,
      candidateBridge,
      ingestLoop
    }),
    recommendedFollowUp: sourceArtifactPreviewFollowUp(ingestLoop),
    evidenceRefs: uniqueStrings([
      input.filePath,
      file,
      ...optionalTextAsList(contentHash)
    ]),
    consumer: defaultAcquisitionConsumer,
    falsifier: "A source artifact preview JSON file without artifact/chunk/candidate/readback state should not produce a reviewable acquisition request.",
    doesNotProve: sourceArtifactPreviewDoesNotProve({
      readback: input.readback,
      ingestLoop
    })
  };
};

const optionalRequestAsList = (
  request: KnowledgeAcquisitionRequest | undefined
): KnowledgeAcquisitionRequest[] =>
  request === undefined ? [] : [request];

const buildAcquisitionRequestFromReadback = (
  input: {
    filePath: string;
    readback: JsonRecord;
  }
): KnowledgeAcquisitionRequest[] => {
  const brainSearchRequest = brainSearchAcquisitionRequest(input);

  return brainSearchRequest === undefined
    ? [
        ...optionalRequestAsList(sourceSearchAcquisitionRequest(input)),
        ...optionalRequestAsList(sourceArtifactPreviewAcquisitionRequest(input))
      ]
    : [brainSearchRequest];
};

export const loadKnowledgeAcquisitionRequests = async (
  cwd: string,
  acquisitionReadbackFile: string | undefined
): Promise<KnowledgeAcquisitionRequest[]> => {
  if (acquisitionReadbackFile === undefined) {
    return [];
  }

  const resolvedPath = await resolveRepoInputFile(cwd, acquisitionReadbackFile);
  const raw = await readFile(resolvedPath, "utf8");
  const readback = parseJsonRecord(raw, acquisitionReadbackFile);

  return buildAcquisitionRequestFromReadback({
    filePath: acquisitionReadbackFile,
    readback
  });
};

const requiredStringField = (
  record: JsonRecord,
  field: string,
  context: string
): string => {
  const value = stringValue(record[field]);

  if (value === undefined) {
    throw new Error(`${context}.${field} must be a non-empty string`);
  }

  return value;
};

const recordArrayField = (
  value: unknown,
  context: string
): readonly JsonRecord[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array`);
  }

  return value.map((item, index) => {
    const record = recordValue(item);

    if (record === undefined) {
      throw new Error(`${context}[${index}] must be an object`);
    }

    return record;
  });
};

const consensusEvidenceFromRecord = (
  record: JsonRecord,
  context: string
): ConsensusEvaluationEvidence => {
  const position = consensusEvidencePositionValue(record["position"]);

  if (position === undefined) {
    throw new Error(`${context}.position must be support, dissent, or risk`);
  }

  return {
    id: requiredStringField(record, "id", context),
    position,
    summary: requiredStringField(record, "summary", context),
    evidenceRef: requiredStringField(record, "evidenceRef", context),
    doesNotProve: requiredStringField(record, "doesNotProve", context)
  };
};

const consensusEvidenceArray = (
  value: unknown,
  context: string
): readonly ConsensusEvaluationEvidence[] => {
  const fieldContext = `${context}.evidence`;

  return recordArrayField(value, fieldContext)
    .map((record, index) => consensusEvidenceFromRecord(record, `${fieldContext}[${index}]`));
};

const sourceLineageArray = (
  value: unknown,
  context: string
): readonly SourceLineageRef[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const fieldContext = `${context}.sourceLineage`;

  return recordArrayField(value, fieldContext).map((record, index) => {
    const itemContext = `${fieldContext}[${index}]`;
    const sourceId = requiredStringField(record, "sourceId", itemContext);
    const note = stringValue(record["note"]);

    return {
      sourceId,
      ...(note === undefined ? {} : { note })
    };
  });
};

const consensusRelationReviewFromRecord = (
  value: unknown,
  context: string
): ConsensusCandidateEvaluationInput["relationReview"] => {
  if (value === undefined) {
    return undefined;
  }

  const record = recordValue(value);

  if (record === undefined) {
    throw new Error(`${context}.relationReview must be an object when provided`);
  }

  const edgeKind = sourceClaimEdgeKindValue(record["edgeKind"]);
  const relationReviewFocus = sourceRelationReviewFocusValue(record["relationReviewFocus"]);

  if (edgeKind === undefined) {
    throw new Error(`${context}.relationReview.edgeKind must be a known source claim edge kind`);
  }

  if (relationReviewFocus === undefined) {
    throw new Error(`${context}.relationReview.relationReviewFocus must be a known relation review focus`);
  }

  return {
    sourceClaimEdgeId: requiredStringField(
      record,
      "sourceClaimEdgeId",
      `${context}.relationReview`
    ) as SourceClaimEdgeId,
    edgeKind,
    relationReviewFocus,
    relationReviewQuestion: requiredStringField(
      record,
      "relationReviewQuestion",
      `${context}.relationReview`
    )
  };
};

const consensusCandidateFromRecord = (
  record: JsonRecord,
  index: number
): ConsensusCandidateEvaluationInput => {
  const context = `candidates[${index}]`;
  const candidateKind = consensusCandidateKindValue(record["candidateKind"]);

  if (candidateKind === undefined) {
    throw new Error(`${context}.candidateKind must be a known consensus candidate kind`);
  }

  const body = stringValue(record["body"]);
  const applicationGuidance = stringValue(record["applicationGuidance"]);
  const duplicateOf = stringValue(record["duplicateOf"]);
  const notUsefulReason = stringValue(record["notUsefulReason"]);
  const sourceLineage = sourceLineageArray(record["sourceLineage"], context);
  const relationReview = consensusRelationReviewFromRecord(record["relationReview"], context);

  return {
    candidateId: requiredStringField(record, "candidateId", context),
    candidateKind,
    summary: requiredStringField(record, "summary", context),
    ...(body === undefined ? {} : { body }),
    ...(applicationGuidance === undefined ? {} : { applicationGuidance }),
    evidenceRefs: stringArrayValue(record["evidenceRefs"]),
    ...(sourceLineage === undefined ? {} : { sourceLineage }),
    ...(duplicateOf === undefined ? {} : { duplicateOf }),
    ...(notUsefulReason === undefined ? {} : { notUsefulReason }),
    ...(relationReview === undefined ? {} : { relationReview }),
    evidence: consensusEvidenceArray(record["evidence"], context)
  };
};

export const loadConsensusCandidateInputs = async (
  cwd: string,
  consensusCandidateFile: string | undefined
): Promise<ConsensusCandidateEvaluationInput[]> => {
  if (consensusCandidateFile === undefined) {
    return [];
  }

  const resolvedPath = await resolveRepoInputFile(cwd, consensusCandidateFile);
  const raw = await readFile(resolvedPath, "utf8");
  const readback = parseJsonRecord(raw, consensusCandidateFile);
  const candidates = readback["candidates"];

  return recordArrayField(candidates, `${consensusCandidateFile}.candidates`)
    .map(consensusCandidateFromRecord);
};

