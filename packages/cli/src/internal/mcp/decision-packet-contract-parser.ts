import {
  createHash
} from "node:crypto";
import {
  decisionPacketChecksum,
  type DecisionPacket,
  type DecisionPacketIdentity
} from "@krn/core";

export type DecisionPacketJsonValue =
  | string
  | number
  | boolean
  | null
  | DecisionPacketJsonValue[]
  | DecisionPacketJsonObject;

export type DecisionPacketJsonObject = {
  readonly [key: string]: DecisionPacketJsonValue;
};

const transportProof =
  "DecisionPacket was served through the read-only krn_decision_packet MCP tool";

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const all = (checks: readonly boolean[]): boolean => checks.every(Boolean);

const isArrayOf = (
  value: unknown,
  predicate: (item: unknown) => boolean
): boolean => Array.isArray(value) && value.every(predicate);

const hasFields = (
  value: Record<string, unknown>,
  fields: readonly string[]
): boolean => fields.every((field) => field in value);

const hasOnlyFields = (
  value: Record<string, unknown>,
  fields: readonly string[]
): boolean => {
  const allowed = new Set(fields);

  return Object.keys(value).every((field) => allowed.has(field));
};

const isStringRecord = (
  value: unknown,
  fields: readonly string[]
): value is Record<string, string> =>
  isRecord(value) &&
  hasFields(value, fields) &&
  fields.every((field) => isString(value[field]));

const isTask = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const required = ["id", "title", "objective", "constraints", "nonGoals", "acceptance"];
  const status = value["status"];

  return hasFields(value, required) &&
    hasOnlyFields(value, [...required, "status"]) &&
    required.slice(0, 3).every((field) => isString(value[field])) &&
    required.slice(3).every((field) => isStringArray(value[field])) &&
    (status === undefined || ["draft", "active", "superseded", "closed"].includes(String(status)));
};

const isContextItem = (value: unknown, exclusion: boolean): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const fields = exclusion
    ? ["subjectType", "subjectId", "reason", "explanation", "sourceAuthority"]
    : ["subjectType", "subjectId", "reason", "expectedUse", "sourceAuthority"];

  return hasFields(value, fields) &&
    hasOnlyFields(value, fields) &&
    fields.every((field) => isString(value[field]));
};

const isTaskStandard = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const stringFields = [
    "memoryRecordId", "key", "mechanism", "krnImplication", "decision", "consumer",
    "falsifier", "validFrom", "doesNotProve"
  ];
  const allowed = [...stringFields, "sourceRefs", "validUntil", "rejectedPath"];

  return hasFields(value, [...stringFields, "sourceRefs"]) &&
    hasOnlyFields(value, allowed) &&
    stringFields.every((field) => isString(value[field])) &&
    isStringArray(value["sourceRefs"]) &&
    (value["validUntil"] === undefined || isString(value["validUntil"])) &&
    (value["rejectedPath"] === undefined || isString(value["rejectedPath"]));
};

const isSourceDecisionTarget = (value: unknown): boolean =>
  isRecord(value) &&
  hasFields(value, ["targetType", "targetId", "sourceDecisionEdgeIds"]) &&
  hasOnlyFields(value, ["targetType", "targetId", "sourceDecisionEdgeIds"]) &&
  isString(value["targetType"]) &&
  isString(value["targetId"]) &&
  isStringArray(value["sourceDecisionEdgeIds"]);

const isEvidenceGap = (value: unknown): boolean =>
  isStringRecord(value, ["id", "reason", "verificationRequired"]) &&
  hasOnlyFields(value, ["id", "reason", "verificationRequired"]);

const isEvidenceContract = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const commands = value["commands"];

  return hasFields(value, ["commands", "diffRisk", "reviewBurden", "rollbackPath"]) &&
    hasOnlyFields(value, ["commands", "diffRisk", "reviewBurden", "rollbackPath"]) &&
    Array.isArray(commands) &&
    commands.every((command) =>
      isRecord(command) &&
      hasFields(command, ["command", "required"]) &&
      hasOnlyFields(command, ["command", "required"]) &&
      isString(command["command"]) &&
      typeof command["required"] === "boolean"
    ) &&
    ["low", "medium", "high"].includes(String(value["diffRisk"])) &&
    isString(value["reviewBurden"]) &&
    isString(value["rollbackPath"]);
};

const sourceConsensusStringArrays = [
  "decisionLinkedSourceClaimIds", "caveatedSourceClaimIds", "unsupportedSourceClaimIds",
  "conflictingSourceClaimIds", "unknownSourceClaimIds", "sourceDecisionEdgeIds",
  "staleDecisionIds", "supersededPathIds", "rejectedPathIds", "sourceRejectionIds",
  "conflictedDecisionIds", "evidenceGapIds"
] as const;

const isSourceConsensus = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const fields = [...sourceConsensusStringArrays, "sourceDecisionTargets", "doesNotProve"];

  return hasFields(value, fields) &&
    hasOnlyFields(value, fields) &&
    sourceConsensusStringArrays.every((field) => isStringArray(value[field])) &&
    Array.isArray(value["sourceDecisionTargets"]) &&
    value["sourceDecisionTargets"].every(isSourceDecisionTarget) &&
    isString(value["doesNotProve"]);
};

const isAbstentionScore = (value: unknown): boolean =>
  isRecord(value) &&
  hasFields(value, ["status", "score", "reasons", "evidenceGapIds", "doesNotProve"]) &&
  hasOnlyFields(value, ["status", "score", "reasons", "evidenceGapIds", "doesNotProve"]) &&
  ["ready", "weak_context", "abstain"].includes(String(value["status"])) &&
  isFiniteNumber(value["score"]) &&
  isStringArray(value["reasons"]) &&
  isStringArray(value["evidenceGapIds"]) &&
  isString(value["doesNotProve"]);

const briefCountFields = [
  "includedContextCount", "observationPrefixCount", "explicitExclusionCount",
  "sourceClaimUseCount", "memoryRecordUseCount"
] as const;

const briefIdFields = [
  "includedSourceClaimIds", "includedMemoryRecordIds", "excludedSourceClaimIds",
  "excludedMemoryRecordIds", "excludedAntiMemoryRecordIds", "evidenceGapIds"
] as const;

const isBrief = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const fields = [...briefCountFields, ...briefIdFields];

  return hasFields(value, fields) &&
    hasOnlyFields(value, fields) &&
    briefCountFields.every((field) => isFiniteNumber(value[field])) &&
    briefIdFields.every((field) => isStringArray(value[field]));
};

const packetStringArrays = [
  "toolBoundaries", "governingDecisionIds", "governingStatements", "sourceClaimIds",
  "caveatedSourceClaimIds", "sourceDecisionEdgeIds", "sourceRejectionIds", "memoryRefs",
  "caveatedMemoryRefs", "staleDecisionIds", "staleKnowledgeIds", "noiseKnowledgeIds",
  "unknownKnowledgeIds", "supersededPathIds", "rejectedPathIds", "falsifiers",
  "verificationCommands", "doesNotProve", "nonProofs", "noiseDecisionIds",
  "severeStaleAuthorityIds"
] as const;

const packetRequiredFields = [
  "formatVersion", "task", "contextInclusions", "contextExclusions", "nextAction",
  ...packetStringArrays, "taskStandardDecisions", "sourceDecisionTargets", "evidenceGaps",
  "sourceConsensus", "abstentionScore", "brief"
] as const;

const isDecisionPacket = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const evidenceContract = value["evidenceContract"];

  return all([
    hasFields(value, packetRequiredFields),
    hasOnlyFields(value, [...packetRequiredFields, "evidenceContract"]),
    value["formatVersion"] === "krn.decisionPacket.v1",
    isTask(value["task"]),
    isArrayOf(value["contextInclusions"], (item) => isContextItem(item, false)),
    isArrayOf(value["contextExclusions"], (item) => isContextItem(item, true)),
    evidenceContract === undefined || isEvidenceContract(evidenceContract),
    isString(value["nextAction"]),
    packetStringArrays.every((field) => isStringArray(value[field])),
    isArrayOf(value["taskStandardDecisions"], isTaskStandard),
    isArrayOf(value["sourceDecisionTargets"], isSourceDecisionTarget),
    isArrayOf(value["evidenceGaps"], isEvidenceGap),
    isSourceConsensus(value["sourceConsensus"]),
    isAbstentionScore(value["abstentionScore"]),
    isBrief(value["brief"])
  ]);
};

const isPacketIdentity = (
  value: unknown,
  runId: string
): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const fields = [
    "packetId", "checksumAlgorithm", "checksum", "evidenceRef", "generatedAt",
    "sourceRunStatus", "sourceRunLifecycleRevision", "sourceRunUpdatedAt", "freshness"
  ];
  const checksum = value["checksum"];
  const freshness = value["freshness"];

  if (!isString(checksum) || !isRecord(freshness)) {
    return false;
  }

  return all([
    hasFields(value, fields),
    hasOnlyFields(value, fields),
    /^[a-f0-9]{64}$/u.test(checksum),
    value["checksumAlgorithm"] === "sha256",
    value["packetId"] === `decision-packet:${runId}:${checksum.slice(0, 16)}`,
    value["evidenceRef"] === `packet:${checksum}`,
    isString(value["generatedAt"]),
    ["planned", "running", "succeeded", "failed", "blocked", "cancelled"].includes(
      String(value["sourceRunStatus"])
    ),
    Number.isInteger(value["sourceRunLifecycleRevision"]),
    isString(value["sourceRunUpdatedAt"]),
    hasFields(freshness, ["status", "doesNotProve"]),
    hasOnlyFields(freshness, ["status", "doesNotProve"]),
    freshness["status"] === "current_read_model_snapshot",
    isString(freshness["doesNotProve"])
  ]);
};

const hasExpectedChecksum = (
  identity: unknown,
  packet: unknown,
  runId: string
): boolean => {
  if (!isRecord(identity)) {
    return false;
  }

  const expected = decisionPacketChecksum({
    generatedAt: identity["generatedAt"] as string,
    packet: packet as DecisionPacket,
    request: { runId },
    sourceRunStatus: identity["sourceRunStatus"] as DecisionPacketIdentity["sourceRunStatus"],
    sourceRunLifecycleRevision: identity["sourceRunLifecycleRevision"] as number,
    sourceRunUpdatedAt: identity["sourceRunUpdatedAt"] as string
  }, sha256Hex);

  return identity["checksum"] === expected;
};

const isReturnChannels = (value: unknown): boolean => {
  if (!isRecord(value) || !hasOnlyFields(value, ["evidence", "feedback"])) {
    return false;
  }

  return isStringRecord(value["evidence"], ["command", "persistedCommand", "doesNotProve"]) &&
    hasOnlyFields(value["evidence"], ["command", "persistedCommand", "doesNotProve"]) &&
    isStringRecord(value["feedback"], [
      "memoryRecordApplyExample", "sourceUsefulnessExample", "sourceDecisionUsefulnessExample",
      "knowledgeUsefulnessExample", "doesNotProve"
    ]) &&
    hasOnlyFields(value["feedback"], [
      "memoryRecordApplyExample", "sourceUsefulnessExample", "sourceDecisionUsefulnessExample",
      "knowledgeUsefulnessExample", "doesNotProve"
    ]);
};

const isProof = (value: unknown): boolean =>
  isRecord(value) &&
  hasFields(value, ["proves", "doesNotProve"]) &&
  hasOnlyFields(value, ["proves", "doesNotProve"]) &&
  isStringArray(value["proves"]) &&
  !value["proves"].includes(transportProof) &&
  isStringArray(value["doesNotProve"]);

export const parseDecisionPacketContractReadback = (
  value: unknown,
  requestedRunId: string
): DecisionPacketJsonObject | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const request = value["request"];
  const topLevelFields = [
    "kind", "access", "mutation", "surface", "request", "packetIdentity", "packet",
    "returnChannels", "proof", "readModel"
  ];

  if (
    !hasFields(value, topLevelFields.filter((field) => field !== "readModel")) ||
    !hasOnlyFields(value, topLevelFields) ||
    value["kind"] !== "krn.decisionPacketReadback.v1" ||
    value["access"] !== "read_only" ||
    value["mutation"] !== "none" ||
    value["surface"] !== "headless_cli" ||
    !isRecord(request) ||
    !hasOnlyFields(request, ["runId"]) ||
    request["runId"] !== requestedRunId ||
    !isDecisionPacket(value["packet"]) ||
    !isPacketIdentity(value["packetIdentity"], requestedRunId) ||
    !hasExpectedChecksum(value["packetIdentity"], value["packet"], requestedRunId) ||
    !isReturnChannels(value["returnChannels"]) ||
    !isProof(value["proof"])
  ) {
    return undefined;
  }

  return value as DecisionPacketJsonObject;
};
