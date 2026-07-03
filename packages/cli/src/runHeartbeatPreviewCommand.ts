import {
  readFile
} from "node:fs/promises";

import type {
  MemoryRecord,
  ProjectId,
  SourceClaim,
  SourceClaimEdge,
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
import {
  buildBrainHeartbeatPreview
} from "@krn/workers";
import type {
  BrainHeartbeatCandidate,
  KnowledgeAcquisitionActivationUtilityEvidence,
  KnowledgeAcquisitionActivationUtilitySignalEvidence,
  KnowledgeAcquisitionActivationUtilityStrength,
  KnowledgeAcquisitionActivationUtilityVerdict,
  KnowledgeAcquisitionEscalationStep,
  KnowledgeAcquisitionLinkedDocumentEvidence,
  KnowledgeAcquisitionRequest,
  BrainHeartbeatPreview,
  ConsensusCandidateEvaluationInput,
  ConsensusCandidateKind,
  ConsensusEvaluationEvidence,
  ConsensusEvidencePosition,
  WorkerJobAuthorityReadback
} from "@krn/workers";

import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntimeInput,
  ProjectResolution
} from "./databaseRuntime.js";
import {
  findRepoRoot,
  resolveRepoInputFile
} from "./cliFileBoundary.js";
import {
  formatProjectResolutionKind
} from "./projectResolutionFormat.js";
import type {
  CliCommand
} from "./parseArgs.js";

export type HeartbeatPreviewCommand = Extract<CliCommand, { kind: "heartbeatPreview" }>;
type HeartbeatCandidateKind = NonNullable<HeartbeatPreviewCommand["candidateKinds"]>[number];

interface HeartbeatPreviewDatabaseRuntime {
  projectId: string;
  projectResolution?: ProjectResolution;
  memoryRepository: {
    listMemoryRecordsForProject(projectId: ProjectId, limit?: number): Promise<MemoryRecord[]>;
  };
  sourceRepository: {
    listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]>;
    listSourceClaimEdgesForClaim(sourceClaimId: SourceClaim["id"]): Promise<SourceClaimEdge[]>;
  };
  close(): Promise<void>;
}

export type CreateHeartbeatPreviewDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<HeartbeatPreviewDatabaseRuntime>;

export interface HeartbeatPreviewCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: HeartbeatPreviewCommand;
  createDatabaseRuntime?: CreateHeartbeatPreviewDatabaseRuntime;
}

export interface HeartbeatPreviewCommandResult {
  stdout: string;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultMemoryLimit = 50;
const defaultSourceClaimLimit = 50;
const defaultMaxCandidates = 10;
const defaultEvidenceRef =
  "krn heartbeat preview operator readback";
const defaultCandidateKinds = [
  "memory_staleness",
  "source_relation",
  "knowledge_acquisition",
  "consensus_evaluation"
] as const satisfies readonly HeartbeatCandidateKind[];
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

const loadKnowledgeAcquisitionRequests = async (
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

const loadConsensusCandidateInputs = async (
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

const uniqueSourceClaimEdges = (
  edges: readonly SourceClaimEdge[]
): SourceClaimEdge[] => {
  const deduped = new Map<SourceClaimEdgeId, SourceClaimEdge>();

  for (const edge of edges) {
    deduped.set(edge.id, edge);
  }

  return Array.from(deduped.values());
};

const loadSourceClaimEdges = async (
  sourceRepository: HeartbeatPreviewDatabaseRuntime["sourceRepository"],
  sourceClaims: readonly SourceClaim[]
): Promise<SourceClaimEdge[]> => {
  const edges = await Promise.all(sourceClaims.map((sourceClaim) =>
    sourceRepository.listSourceClaimEdgesForClaim(sourceClaim.id)
  ));

  return uniqueSourceClaimEdges(edges.flat());
};

const includesCandidateKind = (
  candidateKinds: readonly HeartbeatCandidateKind[],
  candidateKind: HeartbeatCandidateKind
): boolean => candidateKinds.includes(candidateKind);

const selectedCandidateKinds = (
  command: HeartbeatPreviewCommand
): readonly HeartbeatCandidateKind[] =>
  command.candidateKinds ?? defaultCandidateKinds;

const loadMemoryRecordsForPreview = async (
  input: {
    databaseRuntime: HeartbeatPreviewDatabaseRuntime;
    projectId: ProjectId;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<MemoryRecord[]> =>
  includesCandidateKind(input.candidateKinds, "memory_staleness")
    ? input.databaseRuntime.memoryRepository.listMemoryRecordsForProject(
      input.projectId,
      input.command.memoryLimit ?? defaultMemoryLimit
    )
    : [];

const loadSourceClaimsForPreview = async (
  input: {
    databaseRuntime: HeartbeatPreviewDatabaseRuntime;
    projectId: ProjectId;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<SourceClaim[]> =>
  includesCandidateKind(input.candidateKinds, "source_relation")
    ? input.databaseRuntime.sourceRepository.listClaimsForProject(
      input.projectId,
      input.command.sourceClaimLimit ?? defaultSourceClaimLimit
    )
    : [];

const loadSourceClaimEdgesForPreview = async (
  input: {
    databaseRuntime: HeartbeatPreviewDatabaseRuntime;
    sourceClaims: readonly SourceClaim[];
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<SourceClaimEdge[]> =>
  includesCandidateKind(input.candidateKinds, "source_relation")
    ? loadSourceClaimEdges(input.databaseRuntime.sourceRepository, input.sourceClaims)
    : [];

const loadKnowledgeAcquisitionRequestsForPreview = async (
  input: {
    cwd: string;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<KnowledgeAcquisitionRequest[]> =>
  includesCandidateKind(input.candidateKinds, "knowledge_acquisition")
    ? loadKnowledgeAcquisitionRequests(
      input.cwd,
      input.command.acquisitionReadbackFile
    )
    : [];

const loadConsensusCandidatesForPreview = async (
  input: {
    cwd: string;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<ConsensusCandidateEvaluationInput[]> =>
  includesCandidateKind(input.candidateKinds, "consensus_evaluation")
    ? loadConsensusCandidateInputs(
      input.cwd,
      input.command.consensusCandidateFile
    )
    : [];

const formatList = (values: readonly string[]): string[] =>
  values.length === 0 ? ["  - none"] : values.map((value) => `  - ${value}`);

const formatLinkedDocumentEvidence = (
  evidence: KnowledgeAcquisitionLinkedDocumentEvidence | undefined
): string[] => {
  if (evidence === undefined) {
    return [
      "  linkedDocumentEvidence:",
      "  - none"
    ];
  }

  return [
    "  linkedDocumentEvidence:",
    `  - sourceClaimDocumentLinks: ${evidence.sourceClaimDocumentLinks}`,
    `  - linkedSearchDocuments: ${evidence.linkedSearchDocuments}`,
    "  linkedDocumentEvidenceCaveats:",
    ...formatList(evidence.caveats)
  ];
};

const formatActivationUtilitySignalEvidence = (
  evidence: KnowledgeAcquisitionActivationUtilitySignalEvidence
): string[] => [
  `  - ${evidence.signal}: ${evidence.strength}`,
  ...evidence.reasons.map((reason) => `    - ${reason}`)
];

const formatActivationUtilityEvidence = (
  evidence: KnowledgeAcquisitionActivationUtilityEvidence | undefined
): string[] => {
  if (evidence === undefined) {
    return [];
  }

  return [
    "  activationUtilityEvidence:",
    `  - verdict: ${evidence.verdict}`,
    ...formatActivationUtilitySignalEvidence(evidence.selectedKnowledge),
    ...formatActivationUtilitySignalEvidence(evidence.sourceLinkGraph),
    `  - recommendedNextAction: ${evidence.recommendedNextAction}`,
    `  - doesNotProve: ${evidence.doesNotProve}`
  ];
};

const formatAcquisitionEscalationPreview = (
  steps: readonly KnowledgeAcquisitionEscalationStep[]
): string[] => [
  "  acquisitionEscalationPreview:",
  ...(steps.length === 0
    ? ["  - none"]
    : steps.map((step) =>
      `  - ${step.order}. ${step.source} | cost: ${step.cost} | action: ${step.action} | when: ${step.when} | doesNotProve: ${step.doesNotProve}`
    ))
];

const formatWorkerAuthority = (
  authority: WorkerJobAuthorityReadback | undefined
): string[] => {
  if (authority === undefined) {
    return [];
  }

  return [
    "  workerAuthority:",
    `  - jobType: ${authority.jobType}`,
    `  - memoryCoreGate: ${authority.memoryCoreGate}`,
    `  - status: ${authority.status}`,
    `  - idempotencyKey: ${authority.idempotencyKey}`,
    "  - allowedWrites:",
    ...formatList(authority.allowedWrites),
    "  - forbiddenWrites:",
    ...formatList(authority.forbiddenWrites),
    `  - doesNotProve: ${authority.doesNotProve}`
  ];
};

const candidateWorkerAuthority = (
  candidate: BrainHeartbeatCandidate
): WorkerJobAuthorityReadback | undefined =>
  "workerAuthority" in candidate ? candidate.workerAuthority : undefined;

const formatProjectResolutionLines = (
  projectResolution: ProjectResolution | undefined
): string[] => {
  if (projectResolution === undefined) {
    return [
      "Project resolution: unavailable",
      "Project resolution doesNotProve: missing resolution metadata does not prove the wrong project was used."
    ];
  }

  return [
    `Project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
    `Project resolution reason: ${projectResolution.reason}`,
    ...(projectResolution.repoPathHint === undefined
      ? []
      : [`Project resolution repoPathHint: ${projectResolution.repoPathHint}`]),
    `Project resolution doesNotProve: ${projectResolution.doesNotProve}`
  ];
};

const candidateTargetLines = (candidate: BrainHeartbeatCandidate): string[] => {
  if (candidate.kind === "memory_staleness_maintenance_candidate") {
    return [
      `  memoryRecordId: ${candidate.memoryRecordId}`,
      `  memoryKey: ${candidate.memoryKey}`,
      `  memoryKind: ${candidate.memoryKind}`,
      `  memoryStatus: ${candidate.memoryStatus}`,
      `  invalidationIntent: ${candidate.invalidationIntent}`,
      "  sourceLineageRefs:",
      ...formatList(candidate.sourceLineageRefs)
    ];
  }

  if (candidate.kind === "source_relation_maintenance_candidate") {
    return [
      `  sourceClaimEdgeId: ${candidate.sourceClaimEdgeId}`,
      `  fromSourceClaimId: ${candidate.fromSourceClaimId}`,
      `  toSourceClaimId: ${candidate.toSourceClaimId}`,
      `  edgeKind: ${candidate.edgeKind}`,
      `  relationReviewFocus: ${candidate.relationReviewFocus}`,
      `  relationReviewQuestion: ${candidate.relationReviewQuestion}`,
      "  relationEvidenceRefs:",
      ...formatList(candidate.relationEvidenceRefs),
      `  relationEvidenceRequest: ${candidate.relationEvidenceRequest}`
    ];
  }

  if (candidate.kind === "consensus_candidate_evaluation_preview") {
    return [
      `  candidateId: ${candidate.candidateId}`,
      `  candidateKind: ${candidate.candidateKind}`,
      "  decisionOptions:",
      ...formatList(candidate.decisionOptions),
      "  supportEvidenceRefs:",
      ...formatList(candidate.supportEvidenceRefs),
      "  dissentEvidenceRefs:",
      ...formatList(candidate.dissentEvidenceRefs),
      "  riskEvidenceRefs:",
      ...formatList(candidate.riskEvidenceRefs),
      ...(candidate.relationReview === undefined
        ? [
            "  relationReview:",
            "  - none"
          ]
        : [
            "  relationReview:",
            `  - sourceClaimEdgeId: ${candidate.relationReview.sourceClaimEdgeId}`,
            `  - edgeKind: ${candidate.relationReview.edgeKind}`,
            `  - relationReviewFocus: ${candidate.relationReview.relationReviewFocus}`,
            `  - relationReviewQuestion: ${candidate.relationReview.relationReviewQuestion}`,
            `  - consumedBy: ${candidate.relationReview.consumedBy}`,
            `  - reviewUsefulness: ${candidate.relationReview.reviewUsefulness}`,
            `  - doesNotProve: ${candidate.relationReview.doesNotProve}`
          ]),
      "  preservedDissent:",
      ...(candidate.preservedDissent.length === 0
        ? ["  - none"]
        : candidate.preservedDissent.flatMap((item) => [
            `  - ${item.id}: ${item.summary}`,
            `    evidenceRef: ${item.evidenceRef}`,
            `    doesNotProve: ${item.doesNotProve}`
          ]))
    ];
  }

  return [
    `  requestId: ${candidate.requestId}`,
    `  source: ${candidate.source}`,
    `  query: ${candidate.query}`,
    "  missingEvidence:",
    ...formatList(candidate.missingEvidence),
    "  queryShapeDiagnostics:",
    ...formatList(candidate.queryShapeDiagnostics),
    "  recommendedFollowUp:",
    ...formatList(candidate.recommendedFollowUp),
    ...formatLinkedDocumentEvidence(candidate.linkedDocumentEvidence),
    ...formatActivationUtilityEvidence(candidate.activationUtilityEvidence),
    ...formatAcquisitionEscalationPreview(candidate.acquisitionEscalationPreview),
    `  acquisitionEvidenceRequest: ${candidate.acquisitionEvidenceRequest}`,
    `  consumer: ${candidate.consumer}`,
    `  falsifier: ${candidate.falsifier}`
  ];
};

const candidateAction = (candidate: BrainHeartbeatCandidate): string =>
  "action" in candidate
    ? candidate.action
    : candidate.decisionOptions.join(", ");

const candidateReason = (candidate: BrainHeartbeatCandidate): string =>
  "reason" in candidate
    ? candidate.reason
    : "Consensus preview preserves support, dissent, risk, and relation review focus for operator review.";

const formatCandidate = (candidate: BrainHeartbeatCandidate): string[] => {
  const action = candidateAction(candidate);

  return [
    `- candidate: ${candidate.id}`,
    `  kind: ${candidate.kind}`,
    `  action: ${action}`,
    `  nextAction: ${action}`,
    `  reason: ${candidateReason(candidate)}`,
    `  reviewability: ${candidate.reviewability}`,
    "  reviewabilityReasons:",
    ...formatList(candidate.reviewabilityReasons),
    `  summary: ${candidate.summary}`,
    `  applicationGuidance: ${candidate.applicationGuidance}`,
    ...candidateTargetLines(candidate),
    "  evidenceRefs:",
    ...formatList(candidate.evidenceRefs),
    `  doesNotProve: ${candidate.doesNotProve}`,
    `  mutation: ${candidate.mutation}`,
    ...formatWorkerAuthority(candidateWorkerAuthority(candidate)),
    "  forbiddenWrites:",
    ...formatList(candidate.forbiddenWrites)
  ];
};

const formatReviewEvalClosure = (preview: BrainHeartbeatPreview): string[] => [
  "Review/eval closure:",
  `decision: ${preview.reviewEvalClosure.decision}`,
  `nextAction: ${preview.reviewEvalClosure.nextAction}`,
  `summary: ${preview.reviewEvalClosure.summary}`,
  "candidateIds:",
  ...formatList(preview.reviewEvalClosure.candidateIds),
  "evidenceRefs:",
  ...formatList(preview.reviewEvalClosure.evidenceRefs),
  `doesNotProve: ${preview.reviewEvalClosure.doesNotProve}`,
  `mutation: ${preview.reviewEvalClosure.mutation}`,
  "forbiddenWrites:",
  ...formatList(preview.reviewEvalClosure.forbiddenWrites)
];

const formatRuntimeLoop = (preview: BrainHeartbeatPreview): string[] => [
  "Runtime loop:",
  `mode: ${preview.runtimeLoop.mode}`,
  `status: ${preview.runtimeLoop.status}`,
  `nextAction: ${preview.runtimeLoop.nextAction}`,
  `summary: ${preview.runtimeLoop.summary}`,
  `inspectedCandidates: ${preview.runtimeLoop.inspectedCandidates}`,
  `reviewableCandidates: ${preview.runtimeLoop.reviewableCandidates}`,
  `doesNotProve: ${preview.runtimeLoop.doesNotProve}`,
  `mutation: ${preview.runtimeLoop.mutation}`,
  "forbiddenWrites:",
  ...formatList(preview.runtimeLoop.forbiddenWrites)
];

const formatCandidateReviewResult = (preview: BrainHeartbeatPreview): string[] => {
  if (preview.candidateReviewResult === undefined) {
    return [];
  }

  return [
    "Candidate review result:",
    `candidateId: ${preview.candidateReviewResult.candidateId}`,
    `candidateFound: ${preview.candidateReviewResult.candidateFound}`,
    `decision: ${preview.candidateReviewResult.decision}`,
    `nextAction: ${preview.candidateReviewResult.nextAction}`,
    `reason: ${preview.candidateReviewResult.reason}`,
    ...(preview.candidateReviewResult.reviewer === undefined
      ? []
      : [`reviewer: ${preview.candidateReviewResult.reviewer}`]),
    ...(preview.candidateReviewResult.candidateReviewability === undefined
      ? []
      : [`candidateReviewability: ${preview.candidateReviewResult.candidateReviewability}`]),
    "evidenceRefs:",
    ...formatList(preview.candidateReviewResult.evidenceRefs),
    `doesNotProve: ${preview.candidateReviewResult.doesNotProve}`,
    `mutation: ${preview.candidateReviewResult.mutation}`,
    "forbiddenWrites:",
    ...formatList(preview.candidateReviewResult.forbiddenWrites)
  ];
};

const formatHeartbeatPreview = (
  input: {
    projectId: string;
    memoryRecordCount: number;
    sourceClaimCount: number;
    sourceClaimEdgeCount: number;
    candidateKinds: readonly HeartbeatCandidateKind[];
    projectResolution: ProjectResolution | undefined;
    preview: BrainHeartbeatPreview;
  }
): string =>
  [
    "KRN Brain Heartbeat Preview",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    `Project: ${input.projectId}`,
    ...formatProjectResolutionLines(input.projectResolution),
    `Candidate kinds: ${input.candidateKinds.join(", ")}`,
    `Generated at: ${input.preview.generatedAt}`,
    "",
    ...formatReviewEvalClosure(input.preview),
    "",
    ...formatRuntimeLoop(input.preview),
    ...(input.preview.candidateReviewResult === undefined
      ? []
      : ["", ...formatCandidateReviewResult(input.preview)]),
    "",
    "Input readback:",
    `memoryRecords: ${input.memoryRecordCount}`,
    `sourceClaims: ${input.sourceClaimCount}`,
    `sourceClaimEdges: ${input.sourceClaimEdgeCount}`,
    "",
    "Candidate counts:",
    `memoryStaleness: ${input.preview.candidateCounts.memoryStaleness}`,
    `sourceRelation: ${input.preview.candidateCounts.sourceRelation}`,
    `knowledgeAcquisition: ${input.preview.candidateCounts.knowledgeAcquisition}`,
    `consensusEvaluation: ${input.preview.candidateCounts.consensusEvaluation}`,
    `skippedMemoryRecords: ${input.preview.skippedCounts.memoryRecords}`,
    `skippedSourceClaimEdges: ${input.preview.skippedCounts.sourceClaimEdges}`,
    `skippedKnowledgeAcquisitionRequests: ${input.preview.skippedCounts.knowledgeAcquisitionRequests}`,
    `skippedConsensusCandidates: ${input.preview.skippedCounts.consensusCandidates}`,
    "",
    "Candidates:",
    ...(input.preview.candidates.length === 0
      ? ["- none"]
      : input.preview.candidates.flatMap(formatCandidate)),
    "",
    "Mutation boundary:",
    `mutation: ${input.preview.mutation}`,
    "forbiddenWrites:",
    ...formatList(input.preview.forbiddenWrites),
    "",
    "Proof:",
    `- proves: ${input.preview.proof}`,
    `- doesNotProve: ${input.preview.doesNotProve}`
  ].join("\n");

const jsonOutput = (
  input: {
    projectId: string;
    projectResolution: ProjectResolution | undefined;
    memoryRecordCount: number;
    sourceClaimCount: number;
    sourceClaimEdgeCount: number;
    candidateKinds: readonly HeartbeatCandidateKind[];
    preview: BrainHeartbeatPreview;
  }
): string => JSON.stringify({
  ...input,
  preview: {
    ...input.preview,
    candidates: input.preview.candidates.map((candidate) => ({
      ...candidate,
      nextAction: candidateAction(candidate)
    }))
  }
}, null, 2);

export const runHeartbeatPreviewCommand = async (
  runtime: HeartbeatPreviewCommandRuntime
): Promise<HeartbeatPreviewCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn heartbeat preview");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const repoPathHint =
    runtime.command.projectId === undefined
      ? await findRepoRoot(runtime.cwd)
      : undefined;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(runtime.command.projectId === undefined ? {} : { projectId: runtime.command.projectId }),
    ...(repoPathHint === undefined ? {} : { repoPathHint }),
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const projectId = databaseRuntime.projectId as ProjectId;
    const candidateKinds = selectedCandidateKinds(runtime.command);
    const memoryRecords = await loadMemoryRecordsForPreview({
      databaseRuntime,
      projectId,
      command: runtime.command,
      candidateKinds
    });
    const sourceClaims = await loadSourceClaimsForPreview({
      databaseRuntime,
      projectId,
      command: runtime.command,
      candidateKinds
    });
    const sourceClaimEdges = await loadSourceClaimEdgesForPreview({
      databaseRuntime,
      sourceClaims,
      candidateKinds
    });
    const knowledgeAcquisitionRequests = await loadKnowledgeAcquisitionRequestsForPreview({
      cwd: runtime.cwd,
      command: runtime.command,
      candidateKinds
    });
    const consensusCandidates = await loadConsensusCandidatesForPreview({
      cwd: runtime.cwd,
      command: runtime.command,
      candidateKinds
    });
    const preview = buildBrainHeartbeatPreview({
      now: runtime.now(),
      evidenceRef: runtime.command.evidenceRef ?? defaultEvidenceRef,
      memoryRecords,
      sourceClaims,
      sourceClaimEdges,
      ...(knowledgeAcquisitionRequests.length === 0
        ? {}
        : { knowledgeAcquisitionRequests }),
      ...(consensusCandidates.length === 0
        ? {}
        : { consensusCandidates }),
      ...(runtime.command.candidateReview === undefined
        ? {}
        : { candidateReview: runtime.command.candidateReview }),
      ...(runtime.command.nearExpiryDays === undefined
        ? {}
        : { nearExpiryDays: runtime.command.nearExpiryDays }),
      maxCandidates: runtime.command.maxCandidates ?? defaultMaxCandidates
    });
    const output = {
      projectId: databaseRuntime.projectId,
      projectResolution: databaseRuntime.projectResolution,
      memoryRecordCount: memoryRecords.length,
      sourceClaimCount: sourceClaims.length,
      sourceClaimEdgeCount: sourceClaimEdges.length,
      candidateKinds,
      preview
    };

    return {
      stdout:
        runtime.command.format === "json"
          ? jsonOutput(output)
          : formatHeartbeatPreview(output)
    };
  } finally {
    await databaseRuntime.close();
  }
};
