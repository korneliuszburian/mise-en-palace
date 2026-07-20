import type {
  Sql
} from "postgres";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type {
  FeedbackDelta,
  MemoryRecord,
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import {
  buildMaintenanceQueueWriteBoundaryReadback,
  buildMemoryStalenessMaintenancePreview,
  createCommandOutputArtifact,
  decisionPacketBindingReadbackFromMetadata,
  parseMaintenanceJob
} from "@krn/core";

import type {
  HarnessCompilerDependencies
} from "@krn/harness";
import type {
  FeedbackDeltaLookupRepository,
  HarnessRunRepository,
  MemoryRepository,
  RetrievalRepository,
  SourceRepository
} from "@krn/core/repositories/internal";
import {
  compileHarnessPlan,
  promoteAntiMemoryCandidateThroughGate,
  proposeMemoryConsolidation
} from "@krn/harness";
import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "@krn/db/dev";
import {
  DrizzleMaintenanceQueueRepository,
  createFeedbackDeltaMaintenanceHandler,
  runMaintenanceQueueRecord
} from "@krn/db/adapters";
import type {
  DatabaseRuntime
} from "../../database-runtime.js";
import {
  runDecisionPacketCommand
} from "../../run-decision-packet-command.js";
import {
  runCodexBriefCommand
} from "../../run-codex-brief-command.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  commandOutputArtifactSha256Hex
} from "../../command-output-artifact-hash.js";
import {
  handleDecisionPacketMcpMessage
} from "../mcp/decision-packet-mcp-server.js";
import {
  measureDecisionPacketTransport,
  type DecisionPacketTransportMeasurement
} from "../mcp/decision-packet-transport-measurement.js";
import {
  isRecord,
  readRecordArray,
  readRequiredRecord,
  readRequiredString,
  readString,
  readStringArray
} from "./json-readers.js";

const returnChannelCheckpointCommand =
  "decision-packet return-channel checkpoint";
const returnLoopApplicationPath =
  "src/application.ts";

const activationSourceRepositoryFor = (
  sourceRepository: SourceRepository
): HarnessCompilerDependencies["sourceRepository"] => {
  const listSourceClaimEdgesForProject = sourceRepository.listSourceClaimEdgesForProject;

  if (listSourceClaimEdgesForProject === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke requires project-scoped SourceClaimEdge reads"
    );
  }

  const getSourceClaimForProject = sourceRepository.getSourceClaimForProject;
  const getSourceDecisionForProject = sourceRepository.getSourceDecisionForProject;
  const listSourceRejectionsForClaim = sourceRepository.listSourceRejectionsForClaim;

  return {
    listClaimsForProject(projectId, limit, options) {
      return sourceRepository.listClaimsForProject(projectId, limit, options);
    },
    listSourceClaimEdgesForProject(projectId, sourceClaimId) {
      return listSourceClaimEdgesForProject.call(sourceRepository, projectId, sourceClaimId);
    },
    listSourceDecisionEdgesForClaim(sourceClaimId) {
      return sourceRepository.listSourceDecisionEdgesForClaim(sourceClaimId);
    },
    ...(getSourceClaimForProject === undefined
      ? {}
      : {
          getSourceClaimForProject(projectId: string, sourceClaimId: string) {
            return getSourceClaimForProject.call(sourceRepository, projectId, sourceClaimId);
          }
        }),
    ...(getSourceDecisionForProject === undefined
      ? {}
      : {
          getSourceDecisionForProject(projectId: string, sourceDecisionId: string) {
            return getSourceDecisionForProject.call(
              sourceRepository,
              projectId,
              sourceDecisionId
            );
          }
        }),
    ...(listSourceRejectionsForClaim === undefined
      ? {}
      : {
          listSourceRejectionsForClaim(sourceClaimId: string) {
            return listSourceRejectionsForClaim.call(sourceRepository, sourceClaimId);
          }
        }),
    listHistoricalClaimWarningsForProject(projectId, limit, options) {
      return sourceRepository.listHistoricalClaimWarningsForProject(projectId, limit, options);
    }
  };
};

type DecisionPacketReadinessStatus = "ready" | "weak_context" | "abstain";

export interface DecisionPacketReturnLoopSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  retainedTrialSourceSeed?: DecisionPacketReturnLoopRetainedSourceSeed;
  smokeId: string;
  retainFixture?: boolean;
  taskPrefix?: string;
}

export interface DecisionPacketReturnLoopSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  projectId: string;
  taskId: string;
  task: string;
  executionRunId: string;
  packetChecksum: string;
  packetEvidenceRef: string;
  packetReadiness: DecisionPacketReadinessStatus;
  requiredDecisionIds: readonly string[];
  decisionApplications: readonly {
    governingDecisionId: string;
    sourceDecisionId: string;
    check: "preflight" | "target_test" | "target_typecheck" | "target_diff_check";
    changedFiles: readonly string[];
  }[];
  returnChannelHasChecksum: boolean;
  matchingFeedbackDeltaId: string;
  matchingFeedbackOutcome: string;
  matchingFeedbackStayedDiagnostic: boolean;
  matchingSourceDecisionId: string;
  matchingSourceDecisionFeedbackOutcome: string;
  matchingSourceDecisionApplicationCount: number;
  matchingSourceDecisionHelpedOutcomeCount: number;
  staleFeedbackDeltaId: string;
  staleFeedbackOutcome: string;
  staleFeedbackStayedDiagnostic: boolean;
  mismatchedFeedbackDeltaId: string;
  mismatchedFeedbackOutcome: string;
  mismatchedFeedbackStripped: boolean;
  mismatchedFeedbackStayedOutOfIssuedPacket: boolean;
  issuedPacketGoverningDecisionIds: readonly string[];
  issuedPacketSourceDecisionIds: readonly string[];
  issuedPacketStaleDecisionIds: readonly string[];
  issuedPacketCaveatedSourceClaimIds: readonly string[];
  issuedPacketRetainsActivatedDecision: boolean;
  issuedPacketIdentityRetained: boolean;
  selectorProofRunId: string;
  selectorRetainedMemoryRecordId: string;
  selectorStaleMemoryRecordId: string;
  selectorRetainedMemoryApplicationId: string;
  selectorStaleMemoryApplicationIds: readonly string[];
  selectorPacketMemoryRefs: readonly string[];
  selectorPacketIncludesRetainedMemory: boolean;
  selectorPacketExcludesStaleMemory: boolean;
  selectorLegacyMemoryApplicationsPacketStable: boolean;
  selectorMaintenanceCandidateId: string;
  selectorMaintenanceAntiMemoryCandidateId: string;
  selectorMaintenanceFeedbackEventId: string;
  selectorMaintenanceCandidateLinkedToFeedbackDelta: boolean;
  standaloneAntiMemoryProofRunId: string;
  standaloneAntiMemoryRecordId: string;
  standaloneAntiMemoryRetrievalRunId: string;
  standaloneAntiMemoryCandidateCount: number;
  standaloneAntiMemoryExcludedDecisionCount: number;
  standaloneAntiMemoryContextExclusionCount: number;
  standaloneAntiMemoryPacketRejectedPathIds: readonly string[];
  standaloneAntiMemoryCliPreserved: boolean;
  standaloneAntiMemoryMcpPreserved: boolean;
  standaloneAntiMemoryUsefulnessRowDelta: number;
  sourceConsensusProofRunId: string;
  sourceConsensusCurrentSourceClaimId: string;
  sourceConsensusSupersededSourceClaimId: string;
  sourceConsensusRejectedSourceClaimId: string;
  sourceConsensusCurrentSourceDecisionEdgeId: string;
  sourceConsensusSupersededSourceDecisionEdgeId: string;
  sourceConsensusSourceRejectionId: string;
  sourceConsensusGoverningDecisionId: string;
  sourceConsensusPacketSourceClaimIds: readonly string[];
  sourceConsensusPacketRejectedPathIds: readonly string[];
  sourceConsensusPacketSourceDecisionEdgeIds: readonly string[];
  sourceConsensusPacketSupersededPathIds: readonly string[];
  sourceConsensusPacketSourceRejectionIds: readonly string[];
  sourceConsensusCurrentClaimGoverned: boolean;
  sourceConsensusNoFormalRejectionRunId: string;
  sourceConsensusNoFormalRejectionStatus: string;
  sourceConsensusNoFormalRejectionReasons: readonly string[];
  sourceConsensusNoFormalRejectionKeepsTypedState: boolean;
  sourceConsensusSupersededClaimIsNonGoverning: boolean;
  sourceConsensusRejectedClaimHasFormalRejection: boolean;
  sourceConsensusTemporalExplanationPresent: boolean;
  sourceConsensusTemporalExplanationHasEvidence: boolean;
  sourceConsensusUnsupportedRelationClaimId: string;
  sourceConsensusUnsupportedRelationEdgeId: string;
  sourceConsensusUnsupportedRelationStayedCurrent: boolean;
  sourceConsensusUnsupportedRelationVisibleAsGap: boolean;
  sourceDissentProofRunId: string;
  sourceDissentCandidateClaimId: string;
  sourceDissentDissentingClaimId: string;
  sourceDissentCandidateDecisionId: string;
  sourceDissentPacketSourceClaimIds: readonly string[];
  sourceDissentPacketConflictingSourceClaimIds: readonly string[];
  sourceDissentPacketDecisionLinkedSourceClaimIds: readonly string[];
  sourceDissentPacketMemoryRefs: readonly string[];
  sourceDissentPacketGoverningDecisionIds: readonly string[];
  sourceDissentPacketSourceDecisionEdgeIds: readonly string[];
  sourceDissentPacketStatus: string;
  sourceDissentPacketReasons: readonly string[];
  sourceDissentBriefStopsExecution: boolean;
  sourceDissentMcpPreservesDissentAndGap: boolean;
  sourceDissentMcpMessageUtf8Bytes: number;
  sourceDissentMcpStructuredContentMeasurement: DecisionPacketTransportMeasurement;
  sourceDissentReadOnlyUsefulnessUnchanged: boolean;
  feedbackMaintenanceQueueRecordId: string;
  feedbackMaintenanceQueueStatus: string;
  feedbackMaintenanceHandlerBoundaryPassed: boolean;
  feedbackMaintenanceAntiMemoryCandidateId: string;
  feedbackMaintenanceAntiMemoryRecordId: string;
  feedbackMaintenanceGovernedProofRunId: string;
  feedbackMaintenanceGovernedPacketSourceClaimIds: readonly string[];
  feedbackMaintenanceGovernedPacketRejectedPathIds: readonly string[];
  feedbackMaintenanceReviewedTransitionGoverned: boolean;
  feedbackMaintenanceCandidateLinkedToFeedbackDelta: boolean;
  feedbackMaintenanceDelayedLookupResolved: boolean;
  feedbackMaintenanceExactReplayIdempotent: boolean;
  feedbackMaintenanceDirectMutationDelta: number;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
  retainedFixture: boolean;
  retainedTrialSourceSeedCorpusName?: string;
  retainedTrialSourceSeedCurrentDecisionIds?: readonly string[];
  retainedTrialSourceSeedFamily?: string;
  retainedTrialSourceSeedPacketGoverningDecisionIds?: readonly string[];
  retainedTrialSourceSeedPacketRejectedPathIds?: readonly string[];
  retainedTrialSourceSeedPacketSourceDecisionIds?: readonly string[];
  retainedTrialSourceSeedPacketSourceRejectionIds?: readonly string[];
  retainedTrialSourceSeedPacketSupersededPathIds?: readonly string[];
  retainedTrialSourceSeedRejectedSourceClaimIds?: readonly string[];
  retainedTrialSourceSeedSourceDecisionIds?: readonly string[];
  retainedTrialSourceSeedSourceRejectionIds?: readonly string[];
  retainedTrialSourceSeedStaleSourceClaimIds?: readonly string[];
}

const retainedTrialDecisionApplicationChecks = [
  "target_test",
  "target_typecheck",
  "target_diff_check"
] as const;
const retainedTrialDecisionApplicationFiles = [
  "src/config.ts",
  "src/userService.ts",
  "tests/userService.test.ts"
] as const;

export const retainedTrialDecisionApplicationsFor = (input: {
  readonly governingDecisionIds: readonly string[];
  readonly preAppliedSourceDecisionIds: readonly string[];
  readonly sourceDecisionIds: readonly string[];
}): DecisionPacketReturnLoopSmokeReport["decisionApplications"] => {
  const preAppliedSourceDecisionIds = new Set(input.preAppliedSourceDecisionIds);

  return input.governingDecisionIds.flatMap((governingDecisionId, index) => {
    const sourceDecisionId = input.sourceDecisionIds[index];
    const check = retainedTrialDecisionApplicationChecks[index];
    const changedFile = retainedTrialDecisionApplicationFiles[index];

    if (sourceDecisionId === undefined) {
      throw new Error(
        "DecisionPacket return-loop smoke cannot retain a fixture without one source decision per governing decision"
      );
    }
    if (check === undefined || changedFile === undefined) {
      throw new Error(
        "DecisionPacket return-loop smoke cannot retain more than three governing decisions"
      );
    }
    if (preAppliedSourceDecisionIds.has(sourceDecisionId)) {
      return [];
    }

    return [{
      governingDecisionId,
      sourceDecisionId,
      check,
      changedFiles: [changedFile]
    }];
  });
};

interface DecisionPacketSmokeExclusion {
  subjectType: string;
  subjectId: string;
  reason: string;
  explanation: string;
}

interface DecisionPacketSmokeJson {
  packetIdentity: {
    checksum: string;
    evidenceRef: string;
    generatedAt: string;
    sourceRunLifecycleRevision: number;
  };
  packet: {
    governingDecisionIds: readonly string[];
    sourceDecisionIds: readonly string[];
    contextExclusions: readonly DecisionPacketSmokeExclusion[];
    memoryRefs: readonly string[];
    rejectedPathIds: readonly string[];
    sourceClaimIds: readonly string[];
    sourceDecisionEdgeIds: readonly string[];
    sourceRejectionIds: readonly string[];
    sourceConsensus: {
      decisionLinkedSourceClaimIds: readonly string[];
      caveatedSourceClaimIds: readonly string[];
      conflictingSourceClaimIds: readonly string[];
      sourceDecisionEdgeIds: readonly string[];
      supersededPathIds: readonly string[];
      rejectedPathIds: readonly string[];
      sourceRejectionIds: readonly string[];
      evidenceGapIds: readonly string[];
      timeline?: Record<string, unknown>;
    };
    staleDecisionIds: readonly string[];
    abstentionScore: {
      status: string;
      reasons: readonly string[];
    };
  };
  readModel: {
    context: {
      exclusionDetails: readonly DecisionPacketSmokeExclusion[];
    };
  };
  returnChannels: {
    evidence: {
      persistedCommand: string;
    };
    feedback: {
      sourceDecisionUsefulnessExample: string;
    };
  };
}

interface SelectorFeedbackProofResult {
  proofRunId: string;
  retrievalRunId: string | undefined;
  retainedMemoryRecordId: string;
  staleMemoryRecordId: string;
  retainedMemoryApplicationId: string;
  staleMemoryApplicationIds: readonly string[];
  packetMemoryRefs: readonly string[];
  includesRetainedMemory: boolean;
  excludesStaleMemory: boolean;
  legacyMemoryApplicationsPacketStable: boolean;
  maintenanceCandidateId: string;
  maintenanceAntiMemoryCandidateId: string;
  maintenanceFeedbackEventId: string;
  maintenanceCandidateLinkedToFeedbackDelta: boolean;
}

const selectMemoryApplicationAuthority = async (input: {
  executionRunId: string;
  expectedUse: string;
  harnessRunRepository: HarnessRunRepository;
  marker: string;
  memoryRecord: MemoryRecord;
  reason: string;
}) => {
  const aggregate = await input.harnessRunRepository.getHarnessRunByExecutionRunId(
    input.executionRunId
  );
  if (aggregate === undefined) {
    throw new Error("DecisionPacket return-loop smoke lost memory application run");
  }
  const projectId = aggregate.taskContract.projectId;
  if (projectId === undefined) {
    throw new Error("DecisionPacket return-loop smoke requires project-bound memory authority");
  }
  const intent = await input.harnessRunRepository.createOperatorIntent({
    workspaceId: aggregate.operatorIntent.workspaceId,
    projectId,
    source: "cli",
    rawIntent: `${input.reason} ${input.marker}`,
    metadata: { smokeId: input.marker }
  });
  const task = await input.harnessRunRepository.createTaskContract({
    operatorIntentId: intent.id,
    projectId,
    title: input.reason,
    objective: input.expectedUse,
    constraints: [],
    nonGoals: [],
    acceptance: ["One selected memory outcome is packet-bound."],
    metadata: { smokeId: input.marker }
  });
  const plan = await input.harnessRunRepository.createHarnessPlan({
    taskContractId: task.id,
    version: 1,
    status: "running",
    summary: input.reason,
    nextAction: input.expectedUse,
    metadata: { smokeId: input.marker }
  });
  await input.harnessRunRepository.createContextAssembly({
    harnessPlanId: plan.id,
    status: "assembled",
    tokenBudget: 256,
    inclusions: [{
      subjectType: "memory_record",
      subjectId: input.memoryRecord.id,
      reason: input.reason,
      expectedUse: input.expectedUse,
      sourceAuthority: "project-decision"
    }],
    exclusions: [],
    metadata: {
      smokeId: input.marker,
      canonicalRevisionTokens: [{
        subjectType: "memory_record",
        subjectId: input.memoryRecord.id,
        updatedAt: input.memoryRecord.updatedAt,
        status: input.memoryRecord.status,
        currentVersionId: input.memoryRecord.currentVersionId
      }]
    }
  });
  const run = await input.harnessRunRepository.createExecutionRun({
    harnessPlanId: plan.id,
    adapter: "codex",
    metadata: { smokeId: input.marker }
  });
  const issue = input.harnessRunRepository.issueDecisionPacketForExecutionRun;
  if (issue === undefined) {
    throw new Error("DecisionPacket return-loop smoke requires persisted packet issuance");
  }
  const issuance = await issue.call(input.harnessRunRepository, run.id);

  return {
    executionRunId: run.id,
    packetChecksum: issuance.packetIdentity.checksum,
    packetEvidenceRef: issuance.packetIdentity.evidenceRef,
    packetGeneratedAt: issuance.packetIdentity.generatedAt,
    sourceRunLifecycleRevision: issuance.packetIdentity.sourceRunLifecycleRevision
  };
};

type FeedbackSourceProof = "helped" | "stale";

type RetainedTrialSourceDecisionStatus = "current" | "stale" | "rejected";

interface DecisionPacketReturnLoopRetainedSourceSeedItem {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: RetainedTrialSourceDecisionStatus;
  readonly evidenceRef: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
}

interface DecisionPacketReturnLoopRetainedSourceSeed {
  readonly family: string;
  readonly corpusName: string;
  readonly decisions: readonly DecisionPacketReturnLoopRetainedSourceSeedItem[];
}

interface FeedbackSourceClaimProof {
  claimId: string;
  decisionId: string;
  decisionTargetId: string;
}

interface RetainedTrialCurrentSourceDecisionProof {
  sourceClaimId: string;
  sourceDecisionEdgeId: string;
  sourceDecisionId: string;
  targetId: string;
}

interface RetainedTrialHistoricalSourceDecisionProof {
  sourceClaimId: string;
  sourceDecisionId: string;
  targetId: string;
}

interface RetainedTrialRejectedSourceDecisionProof {
  sourceClaimId: string;
  sourceDecisionId: string;
  sourceRejectionId: string;
}

interface RetainedTrialSourceSeedProof {
  corpusName: string;
  currentDecisions: readonly RetainedTrialCurrentSourceDecisionProof[];
  family: string;
  rejectedDecisions: readonly RetainedTrialRejectedSourceDecisionProof[];
  staleDecisions: readonly RetainedTrialHistoricalSourceDecisionProof[];
}

interface RetainedTrialSourceSeedReadback {
  packetGoverningDecisionIds: readonly string[];
  packetRejectedPathIds: readonly string[];
  packetSourceDecisionIds: readonly string[];
  packetSourceRejectionIds: readonly string[];
  packetSupersededPathIds: readonly string[];
}

interface RetainedTrialRejectedSourceDecisionInput {
  readonly claim: string;
  readonly claimId: string;
  readonly decisionId: string;
  readonly title: string;
}

type RetainedTrialCreatedSourceDecision =
  | { readonly status: "current"; readonly decision: RetainedTrialCurrentSourceDecisionProof }
  | { readonly status: "stale"; readonly decision: RetainedTrialHistoricalSourceDecisionProof }
  | { readonly status: "rejected"; readonly decision: RetainedTrialRejectedSourceDecisionInput };

interface SourceConsensusProofResult {
  proofRunId: string;
  retrievalRunId: string | undefined;
  currentSourceClaimId: string;
  supersededSourceClaimId: string;
  rejectedSourceClaimId: string;
  currentSourceDecisionEdgeId: string;
  supersededSourceDecisionEdgeId: string;
  sourceRejectionId: string;
  governingDecisionId: string;
  packetSourceClaimIds: readonly string[];
  packetRejectedPathIds: readonly string[];
  packetSourceDecisionEdgeIds: readonly string[];
  packetSupersededPathIds: readonly string[];
  packetSourceRejectionIds: readonly string[];
  currentClaimGoverned: boolean;
  noFormalRejectionRunId: string;
  noFormalRejectionStatus: string;
  noFormalRejectionReasons: readonly string[];
  noFormalRejectionGoverningDecisionIds: readonly string[];
  noFormalRejectionContextExclusions: readonly DecisionPacketSmokeExclusion[];
  noFormalRejectionRejectedPathIds: readonly string[];
  noFormalRejectionSourceRejectionIds: readonly string[];
  noFormalRejectionKeepsTypedState: boolean;
  supersededClaimIsNonGoverning: boolean;
  rejectedClaimHasFormalRejection: boolean;
  temporalExplanationPresent: boolean;
  temporalExplanationHasEvidence: boolean;
  unsupportedRelationClaimId: string;
  unsupportedRelationEdgeId: string;
  unsupportedRelationStayedCurrent: boolean;
  unsupportedRelationVisibleAsGap: boolean;
}

const unsupportedRelationReadbackFor = (input: {
  readonly timelineEntries: readonly Record<string, unknown>[];
  readonly claimId: string;
  readonly edgeId: string;
}): Pick<
  SourceConsensusProofResult,
  "unsupportedRelationStayedCurrent" | "unsupportedRelationVisibleAsGap"
> => {
  const entry = input.timelineEntries.find((candidate) =>
    readString(candidate, "sourceClaimId") === input.claimId
  );
  const relationEvidence = entry === undefined
    ? []
    : readRecordArray(entry, "relationEvidence");

  return {
    unsupportedRelationStayedCurrent: entry !== undefined &&
      readString(entry, "state") === "current_authority" &&
      readStringArray(entry, "supersededBySourceClaimIds").length === 0,
    unsupportedRelationVisibleAsGap: relationEvidence.some((evidence) =>
      readString(evidence, "sourceClaimEdgeId") === input.edgeId &&
      readStringArray(evidence, "evidenceGaps").includes("missing_relation_support_ref")
    )
  };
};

interface SourcePacketProofRepositories {
  readonly harnessRunRepository: HarnessRunRepository;
  readonly sourceRepository: SourceRepository;
  readonly retrievalRepository: RetrievalRepository;
}

interface SourcePacketProofInput {
  readonly baseRuntime: {
    readonly cwd: string;
    readonly env: { readonly KRN_DATABASE_URL: string };
    readonly now: () => string;
    readonly createId: (prefix: string) => string;
  };
  readonly commandRuntime: DatabaseRuntime;
  readonly executionRunId: string;
  readonly marker: string;
  readonly projectId: string;
  readonly repositories: SourcePacketProofRepositories;
  readonly workspaceId: string;
}

interface SourceConsensusProofInput extends SourcePacketProofInput {
  readonly repositories: SourcePacketProofRepositories & {
    readonly memoryRepository: MemoryRepository;
  };
}

interface StandaloneAntiMemoryProofInput extends SourceConsensusProofInput {
  readonly client: Sql;
}

interface StandaloneAntiMemoryProofResult {
  proofRunId: string;
  retrievalRunId: string;
  antiMemoryRecordId: string;
  candidateCount: number;
  excludedDecisionCount: number;
  contextExclusionCount: number;
  packetRejectedPathIds: readonly string[];
  cliPreserved: boolean;
  mcpPreserved: boolean;
  usefulnessRowDelta: number;
}

const issueDecisionPacket = async (
  repository: HarnessRunRepository,
  executionRunId: string
): Promise<void> => {
  const issue = repository.issueDecisionPacketForExecutionRun;

  if (issue === undefined) {
    throw new Error("DecisionPacket return-loop smoke requires persisted issuance");
  }

  await issue.call(repository, executionRunId);
};

const readDecisionPacketForSmokeRun = async (input: {
  readonly baseRuntime: SourcePacketProofInput["baseRuntime"];
  readonly commandRuntime: DatabaseRuntime;
  readonly runId: string;
}): Promise<ReturnType<typeof parseDecisionPacket>> => parseDecisionPacket(
  (await runDecisionPacketCommand({
    ...input.baseRuntime,
    runId: input.runId,
    createDatabaseRuntime: async () => input.commandRuntime
  })).stdout
);

const readMcpDecisionPacketForSmokeRun = async (input: {
  readonly baseRuntime: SourcePacketProofInput["baseRuntime"];
  readonly commandRuntime: DatabaseRuntime;
  readonly mcpId: string;
  readonly runId: string;
}): Promise<ReturnType<typeof readMcpDecisionPacket>> => readMcpDecisionPacket(
  await handleDecisionPacketMcpMessage({
    jsonrpc: "2.0",
    id: input.mcpId,
    method: "tools/call",
    params: {
      name: "krn_decision_packet",
      arguments: { runId: input.runId }
    }
  }, {
    env: input.baseRuntime.env,
    now: input.baseRuntime.now,
    createId: input.baseRuntime.createId,
    session: { phase: "ready" },
    runDecisionPacket: async (runtime) => runDecisionPacketCommand({
      ...input.baseRuntime,
      runId: runtime.runId,
      createDatabaseRuntime: async () => input.commandRuntime
    })
  })
);

const readOnlyDecisionPacketTransports = async (input: {
  readonly baseRuntime: SourcePacketProofInput["baseRuntime"];
  readonly client: Sql;
  readonly commandRuntime: DatabaseRuntime;
  readonly mcpId: string;
  readonly runId: string;
}): Promise<{
  readonly mcpReadback: ReturnType<typeof readMcpDecisionPacket>;
  readonly packet: ReturnType<typeof parseDecisionPacket>;
  readonly usefulnessRowsBefore: number;
}> => {
  const usefulnessRowsBefore = await countReadOnlyUsefulnessRows({
    client: input.client,
    executionRunId: input.runId
  });
  const packet = await readDecisionPacketForSmokeRun(input);
  const mcpReadback = await readMcpDecisionPacketForSmokeRun(input);

  return { mcpReadback, packet, usefulnessRowsBefore };
};

const createReturnLoopTargetRepo = async (): Promise<string> => {
  const targetRepo = await mkdtemp(path.join(tmpdir(), "krn-return-loop-target-"));

  execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: targetRepo });
  for (const [key, value] of [
    ["user.email", "fixture@example.test"],
    ["user.name", "Fixture"]
  ] as const) {
    execFileSync("git", ["config", key, value], { cwd: targetRepo });
  }
  await mkdir(path.join(targetRepo, "src"));
  await writeFile(path.join(targetRepo, returnLoopApplicationPath), "export const base = true;\n");
  execFileSync("git", ["add", returnLoopApplicationPath], { cwd: targetRepo });
  execFileSync("git", ["commit", "--quiet", "-m", "base"], { cwd: targetRepo });

  return targetRepo;
};

interface SourceDissentProofInput extends SourcePacketProofInput {
  readonly client: Sql;
  readonly memoryRecordId: string;
  readonly repositories: SourcePacketProofRepositories & {
    readonly memoryRepository: MemoryRepository;
  };
}

interface SourceDissentProofResult {
  proofRunId: string;
  retrievalRunId: string | undefined;
  candidateClaimId: string;
  dissentingClaimId: string;
  candidateDecisionId: string;
  packetSourceClaimIds: readonly string[];
  packetConflictingSourceClaimIds: readonly string[];
  packetDecisionLinkedSourceClaimIds: readonly string[];
  packetMemoryRefs: readonly string[];
  packetGoverningDecisionIds: readonly string[];
  packetSourceDecisionEdgeIds: readonly string[];
  packetStatus: string;
  packetReasons: readonly string[];
  briefStopsExecution: boolean;
  mcpPreservesDissentAndGap: boolean;
  mcpMessageUtf8Bytes: number;
  mcpStructuredContentMeasurement: DecisionPacketTransportMeasurement;
  readOnlyUsefulnessRowsBefore: number;
  readOnlyUsefulnessRowsAfter: number;
  readOnlyUsefulnessUnchanged: boolean;
}

interface FeedbackMaintenanceProofResult {
  queueRecordId: string;
  queueStatus: string;
  handlerBoundaryPassed: boolean;
  antiMemoryCandidateId: string;
  candidateLinkedToFeedbackDelta: boolean;
  delayedLookupResolved: boolean;
  exactReplayIdempotent: boolean;
  directMutationDelta: number;
}

interface FeedbackMaintenanceGovernedProofResult {
  antiMemoryRecordId: string;
  proofRunId: string;
  packetSourceClaimIds: readonly string[];
  packetRejectedPathIds: readonly string[];
  reviewedTransitionGoverned: boolean;
}

interface ReturnLoopCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

const readPacketIdentity = (
  parsed: Record<string, unknown>
): DecisionPacketSmokeJson["packetIdentity"] => {
  const packetIdentity = readRequiredRecord(
    parsed,
    "packetIdentity",
    "DecisionPacket smoke readback missed packetIdentity"
  );
  const sourceRunLifecycleRevision = packetIdentity.sourceRunLifecycleRevision;

  if (
    typeof sourceRunLifecycleRevision !== "number" ||
    !Number.isSafeInteger(sourceRunLifecycleRevision) ||
    sourceRunLifecycleRevision < 1
  ) {
    throw new Error("DecisionPacket smoke readback missed source run lifecycle revision");
  }

  return {
    checksum: readRequiredString(packetIdentity, "checksum", "DecisionPacket smoke readback missed checksum"),
    evidenceRef: readRequiredString(packetIdentity, "evidenceRef", "DecisionPacket smoke readback missed evidenceRef"),
    generatedAt: readRequiredString(packetIdentity, "generatedAt", "DecisionPacket smoke readback missed generatedAt"),
    sourceRunLifecycleRevision
  };
};

const decisionPacketReadinessStatusFrom = (
  value: string
): DecisionPacketReadinessStatus => {
  if (value === "ready" || value === "weak_context" || value === "abstain") {
    return value;
  }

  throw new Error(`DecisionPacket smoke readback has unsupported readiness status '${value}'`);
};

const readPacket = (
  parsed: Record<string, unknown>
): DecisionPacketSmokeJson["packet"] => {
  const packet = readRequiredRecord(parsed, "packet", "DecisionPacket smoke readback missed packet");
  const sourceConsensus = readRequiredRecord(
    packet,
    "sourceConsensus",
    "DecisionPacket smoke readback missed sourceConsensus"
  );
  const abstentionScore = readRequiredRecord(
    packet,
    "abstentionScore",
    "DecisionPacket smoke readback missed abstentionScore"
  );

  return {
    governingDecisionIds: readStringArray(packet, "governingDecisionIds"),
    sourceDecisionIds: readStringArray(packet, "sourceDecisionIds"),
    contextExclusions: readRecordArray(packet, "contextExclusions")
      .flatMap((item) => {
        const exclusion = readContextExclusion(item);

        return exclusion === undefined ? [] : [exclusion];
      }),
    memoryRefs: readStringArray(packet, "memoryRefs"),
    rejectedPathIds: readStringArray(packet, "rejectedPathIds"),
    sourceClaimIds: readStringArray(packet, "sourceClaimIds"),
    sourceDecisionEdgeIds: readStringArray(packet, "sourceDecisionEdgeIds"),
    sourceRejectionIds: readStringArray(packet, "sourceRejectionIds"),
    sourceConsensus: {
      decisionLinkedSourceClaimIds: readStringArray(sourceConsensus, "decisionLinkedSourceClaimIds"),
      caveatedSourceClaimIds: readStringArray(sourceConsensus, "caveatedSourceClaimIds"),
      conflictingSourceClaimIds: readStringArray(sourceConsensus, "conflictingSourceClaimIds"),
      sourceDecisionEdgeIds: readStringArray(sourceConsensus, "sourceDecisionEdgeIds"),
      supersededPathIds: readStringArray(sourceConsensus, "supersededPathIds"),
      rejectedPathIds: readStringArray(sourceConsensus, "rejectedPathIds"),
      sourceRejectionIds: readStringArray(sourceConsensus, "sourceRejectionIds"),
      evidenceGapIds: readStringArray(sourceConsensus, "evidenceGapIds"),
      ...(isRecord(sourceConsensus.timeline) ? { timeline: sourceConsensus.timeline } : {})
    },
    staleDecisionIds: readStringArray(packet, "staleDecisionIds"),
    abstentionScore: {
      status: readRequiredString(
        abstentionScore,
        "status",
        "DecisionPacket smoke abstentionScore missed status"
      ),
      reasons: readStringArray(abstentionScore, "reasons")
    }
  };
};

const readContextExclusion = (
  value: Record<string, unknown>
): DecisionPacketSmokeExclusion | undefined => {
  const subjectType = readString(value, "subjectType");
  const subjectId = readString(value, "subjectId");
  const reason = readString(value, "reason");
  const explanation = readString(value, "explanation");

  if (
    subjectType === undefined ||
    subjectId === undefined ||
    reason === undefined ||
    explanation === undefined
  ) {
    return undefined;
  }

  return {
    subjectType,
    subjectId,
    reason,
    explanation
  };
};

const readDecisionPacketReadModel = (
  parsed: Record<string, unknown>
): DecisionPacketSmokeJson["readModel"] => {
  const readModel = readRequiredRecord(parsed, "readModel");
  const context = readRequiredRecord(readModel, "context");

  return {
    context: {
      exclusionDetails: readRecordArray(context, "exclusionDetails")
        .flatMap((item) => {
          const exclusion = readContextExclusion(item);

          return exclusion === undefined ? [] : [exclusion];
        })
    }
  };
};

const readReturnChannels = (
  parsed: Record<string, unknown>
): DecisionPacketSmokeJson["returnChannels"] => {
  const returnChannels = readRequiredRecord(parsed, "returnChannels");
  const evidence = readRequiredRecord(returnChannels, "evidence");
  const feedback = readRequiredRecord(returnChannels, "feedback");

  return {
    evidence: {
      persistedCommand: readRequiredString(evidence, "persistedCommand")
    },
    feedback: {
      sourceDecisionUsefulnessExample: readRequiredString(
        feedback,
        "sourceDecisionUsefulnessExample"
      )
    }
  };
};

const parseDecisionPacket = (stdout: string): DecisionPacketSmokeJson => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed)) {
    throw new Error("DecisionPacket smoke readback was not an object");
  }

  return {
    packetIdentity: readPacketIdentity(parsed),
    packet: readPacket(parsed),
    readModel: readDecisionPacketReadModel(parsed),
    returnChannels: readReturnChannels(parsed)
  };
};

const readMcpDecisionPacket = (
  reply: unknown
): {
  readonly packet: DecisionPacketSmokeJson["packet"];
  readonly messageUtf8Bytes: number;
  readonly structuredContentMeasurement: DecisionPacketTransportMeasurement;
} => {
  if (!isRecord(reply)) {
    throw new Error("DecisionPacket MCP smoke reply was not an object");
  }

  const result = readRequiredRecord(reply, "result", "DecisionPacket MCP smoke reply missed result");
  const structuredContent = readRequiredRecord(
    result,
    "structuredContent",
    "DecisionPacket MCP smoke reply missed structuredContent"
  );
  const metadata = readRequiredRecord(
    result,
    "_meta",
    "DecisionPacket MCP smoke reply missed metadata"
  );
  const decisionPacketReadback = readRequiredRecord(
    metadata,
    "decisionPacketReadback",
    "DecisionPacket MCP smoke reply missed hidden DecisionPacket readback metadata"
  );

  return {
    packet: readPacket(decisionPacketReadback),
    messageUtf8Bytes: measureDecisionPacketTransport(reply).utf8Bytes,
    structuredContentMeasurement: measureDecisionPacketTransport(structuredContent)
  };
};

const standaloneAntiMemoryTransportReadback = (input: {
  readonly antiMemoryRecordId: string;
  readonly cliExclusions: readonly DecisionPacketSmokeExclusion[];
  readonly cliPacket: DecisionPacketSmokeJson["packet"];
  readonly mcpPacket: DecisionPacketSmokeJson["packet"];
}): { readonly cliPreserved: boolean; readonly mcpPreserved: boolean } => ({
  cliPreserved:
    input.cliExclusions.length === 1 &&
    input.cliPacket.rejectedPathIds.filter((id) => id === input.antiMemoryRecordId).length === 1 &&
    input.cliPacket.memoryRefs.length === 0 &&
    input.cliPacket.governingDecisionIds.length === 0,
  mcpPreserved:
    input.mcpPacket.rejectedPathIds.filter((id) => id === input.antiMemoryRecordId).length === 1 &&
    input.mcpPacket.memoryRefs.length === 0 &&
    input.mcpPacket.governingDecisionIds.length === 0
});

const countReadOnlyUsefulnessRows = async (input: {
  readonly client: Sql;
  readonly executionRunId: string;
}): Promise<number> => {
  const rows = await input.client<{ count: number }[]>`
    select (
      (select count(*)::int from memory_applications where execution_run_id = ${input.executionRunId}) +
      (select count(*)::int from memory_feedback_events where execution_run_id = ${input.executionRunId}) +
      (
        select count(*)::int
        from feedback_deltas
        join review_assessments on review_assessments.id = feedback_deltas.review_assessment_id
        join evidence_bundles on evidence_bundles.id = review_assessments.evidence_bundle_id
        where evidence_bundles.execution_run_id = ${input.executionRunId}
      )
    )::int as count
  `;

  return rows[0]?.count ?? 0;
};

const isSupersededClaimNonGoverning = (input: {
  readonly packet: DecisionPacketSmokeJson["packet"];
  readonly supersededClaimId: string;
  readonly supersededDecisionId: string;
}): boolean =>
  !input.packet.sourceClaimIds.includes(input.supersededClaimId) &&
  !input.packet.governingDecisionIds.includes(input.supersededDecisionId) &&
  input.packet.sourceConsensus.supersededPathIds.includes(input.supersededClaimId) &&
  !input.packet.rejectedPathIds.includes(input.supersededClaimId);

const hasFormalSourceRejection = (input: {
  readonly packet: DecisionPacketSmokeJson["packet"];
  readonly rejectedClaimId: string;
  readonly sourceRejectionId: string;
}): boolean =>
  !input.packet.sourceClaimIds.includes(input.rejectedClaimId) &&
  input.packet.sourceConsensus.sourceRejectionIds.includes(input.sourceRejectionId) &&
  !input.packet.rejectedPathIds.includes(input.rejectedClaimId);

const hasNoFormalRejectionTypedState = (input: {
  readonly currentDecisionId: string;
  readonly packet: DecisionPacketSmokeJson["packet"];
  readonly supersededClaimId: string;
}): boolean => {
  const hasExplicitSourceExclusion = input.packet.contextExclusions.some((exclusion) => [
    exclusion.subjectType === "source_claim",
    exclusion.subjectId === input.supersededClaimId
  ].every(Boolean));

  return [
    input.packet.governingDecisionIds.includes(input.currentDecisionId),
    hasExplicitSourceExclusion,
    input.packet.sourceConsensus.supersededPathIds.includes(input.supersededClaimId),
    !input.packet.sourceConsensus.rejectedPathIds.includes(input.supersededClaimId),
    !input.packet.rejectedPathIds.includes(input.supersededClaimId),
    ["weak_context", "abstain"].includes(input.packet.abstentionScore.status),
    input.packet.abstentionScore.reasons.some((reason) => [
      "missing_rejected_path_evidence",
      "caveated_source_authority",
      "evidence_gap"
    ].includes(reason))
  ].every(Boolean);
};

const sourceUsefulnessOutcome = (input: {
  readonly applicationId?: string;
  readonly appliedAt?: string;
  readonly evidenceRef: string;
  readonly evidenceRefs?: readonly string[];
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
  readonly reason: string;
} & (
  | { readonly claimId: string; readonly decisionId?: never }
  | { readonly claimId?: never; readonly decisionId: string }
)): SourceUsefulnessOutcomeFeedback => {
  const feedback = {
    ...(input.applicationId === undefined ? {} : { applicationId: input.applicationId }),
    ...(input.appliedAt === undefined ? {} : { appliedAt: input.appliedAt }),
    outcome: input.outcome,
    reason: input.reason,
    evidenceRefs: input.evidenceRefs === undefined
      ? [input.evidenceRef]
      : [...input.evidenceRefs],
    doesNotProve:
      "Agent-packet return-loop smoke feedback does not prove source truth, Codex obedience, or product readiness."
  };

  return input.claimId === undefined
    ? { ...feedback, sourceDecisionId: input.decisionId }
    : { ...feedback, sourceClaimId: input.claimId };
};

const capturedCurrentEvidenceMetadata = (
  marker: string,
  scope: string
): Record<string, string> => ({
  smokeId: marker,
  evidenceStatus: "captured",
  evidenceContentHash: `sha256:decision-packet-return-loop:${marker}:${scope}:evidence`,
  evidenceFreshness: "current"
});

const createFeedbackSourceClaim = async (
  input: {
    readonly marker: string;
    readonly projectId: string;
    readonly sourceArtifactId: string;
    readonly sourceChunkId: string;
    readonly sourceRepository: SourceRepository;
    readonly proof: FeedbackSourceProof;
  }
): Promise<FeedbackSourceClaimProof> => {
  const evidenceMetadata = capturedCurrentEvidenceMetadata(
    input.marker,
    "feedback-source-claims"
  );
  const claim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: input.sourceArtifactId,
    sourceChunkId: input.sourceChunkId,
    claim: `DecisionPacket return-loop feedback ${input.proof} source claim must stay bound to current activation.`,
    mechanism:
      "Source-usefulness feedback is attached to a selected SourceClaim while source decisions and support edges remain canonical authority.",
    krnImplication:
      "KRN keeps source feedback as a bounded diagnostic and maintenance signal instead of letting it mint governing authority.",
    doesNotProve:
      "This fixture does not prove broad source-review quality or live Codex obedience.",
    sourceAuthority: "project-decision",
    supportType: "decision",
    consumer: "DecisionPacket return-loop feedback smoke",
    falsifier:
      "Feedback maintenance cannot resolve the persisted SourceDecision back to a linked SourceClaim.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      feedbackSourceClaim: input.proof
    }
  });
  const decision = await input.sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: claim.id,
    status: "adopt",
    decision: `Use persisted ${input.proof} source support for the DecisionPacket return-loop smoke.`,
    rationale:
      "The smoke must provide canonical source support before feedback is captured.",
    falsifier:
      "The return-loop smoke lets feedback replace the source decision or support edge.",
    consumer: "DecisionPacket return-loop feedback smoke",
    metadata: {
      smokeId: input.marker,
      feedbackSourceClaim: input.proof
    }
  });

  const decisionTargetId = `architecture-decision:feedback:${input.marker}:${input.proof}`;
  await input.sourceRepository.createSourceDecisionEdge({
    sourceClaimId: claim.id,
    sourceDecisionId: decision.id,
    targetType: "architecture_decision",
    targetId: decisionTargetId,
    supportType: "decision",
    confidence: "high",
    notes: "DecisionPacket return-loop smoke canonical source support.",
    metadata: {
      smokeId: input.marker,
      sourceDecisionId: decision.id,
      feedbackSourceClaim: input.proof
    }
  });

  return {
    claimId: claim.id,
    decisionId: decision.id,
    decisionTargetId
  };
};

const retainedTrialSeedClaimImplicationFor = (
  family: string,
  status: RetainedTrialSourceDecisionStatus
): string => {
  switch (status) {
    case "current":
      return `KRN should expose this ${family} decision as governing task guidance for the retained paired Codex trial.`;
    case "stale":
      return `KRN should preserve this older ${family} path as visible history without activating it as current guidance.`;
    case "rejected":
      return `KRN should expose this rejected ${family} shortcut as non-governing negative guidance.`;
  }
};

const createRetainedTrialSeedDecision = async (
  input: {
    readonly artifactId: string;
    readonly corpusName: string;
    readonly decisionSeed: DecisionPacketReturnLoopRetainedSourceSeedItem;
    readonly family: string;
    readonly index: number;
    readonly marker: string;
    readonly projectId: string;
    readonly sourceRepository: SourceRepository;
  }
): Promise<RetainedTrialCreatedSourceDecision> => {
  const evidenceMetadata = capturedCurrentEvidenceMetadata(
    input.marker,
    `retained-trial-source-seed-${input.family}`
  );
  const metadata = {
    ...evidenceMetadata,
    retainedTrialSourceSeed: input.family,
    retainedTrialSourceSeedCorpusName: input.corpusName,
    retainedTrialSourceSeedDecisionId: input.decisionSeed.id,
    retainedTrialSourceSeedDecisionStatus: input.decisionSeed.status,
    evidenceRef: input.decisionSeed.evidenceRef
  };
  const chunk = await input.sourceRepository.createSourceChunk({
    sourceArtifactId: input.artifactId,
    ordinal: input.index,
    content: input.decisionSeed.statement,
    contentHash:
      `decision-packet-retained-trial-source-seed-${input.family}-${input.marker}-${input.index}`,
    metadata
  });
  const claim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: input.artifactId,
    sourceChunkId: chunk.id,
    claim: input.decisionSeed.statement,
    mechanism:
      `A retained ${input.family} eval fixture source row is promoted into store-backed source authority before DecisionPacket issuance.`,
    krnImplication: retainedTrialSeedClaimImplicationFor(
      input.family,
      input.decisionSeed.status
    ),
    doesNotProve: input.decisionSeed.doesNotProve,
    sourceAuthority: "project-decision",
    supportType: input.decisionSeed.status === "rejected" ? "rejection" : "decision",
    consumer: "retained paired Codex trial",
    falsifier: input.decisionSeed.falsifier,
    status: "proposed",
    metadata
  });
  const sourceDecision = await input.sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: claim.id,
    status: input.decisionSeed.status === "rejected" ? "reject" : "adopt",
    decision: input.decisionSeed.title,
    rationale: `${input.decisionSeed.statement} Evidence: ${input.decisionSeed.evidenceRef}.`,
    falsifier: input.decisionSeed.falsifier,
    consumer: "retained paired Codex trial",
    metadata
  });

  if (input.decisionSeed.status === "rejected") {
    return {
      status: "rejected",
      decision: {
        claim: claim.claim,
        claimId: claim.id,
        decisionId: sourceDecision.id,
        title: input.decisionSeed.title
      }
    };
  }

  const edge = await input.sourceRepository.createSourceDecisionEdge({
    sourceClaimId: claim.id,
    sourceDecisionId: sourceDecision.id,
    targetType: "architecture_decision",
    targetId: input.decisionSeed.id,
    supportType: "decision",
    confidence: "high",
    notes:
      `Retained ${input.family} paired-trial ${input.decisionSeed.status} source decision support.`,
    metadata: {
      ...metadata,
      sourceDecisionId: sourceDecision.id
    }
  });

  if (input.decisionSeed.status === "current") {
    return {
      status: "current",
      decision: {
        sourceClaimId: claim.id,
        sourceDecisionEdgeId: edge.id,
        sourceDecisionId: sourceDecision.id,
        targetId: input.decisionSeed.id
      }
    };
  }

  return {
    status: "stale",
    decision: {
      sourceClaimId: claim.id,
      sourceDecisionId: sourceDecision.id,
      targetId: input.decisionSeed.id
    }
  };
};

const createRetainedTrialSourceDecisionSeed = async (
  input: {
    readonly marker: string;
    readonly projectId: string;
    readonly seed: DecisionPacketReturnLoopRetainedSourceSeed;
    readonly sourceRepository: SourceRepository;
  }
): Promise<RetainedTrialSourceSeedProof> => {
  const evidenceMetadata = capturedCurrentEvidenceMetadata(
    input.marker,
    `retained-trial-source-seed-${input.seed.family}`
  );
  const artifact = await input.sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "run",
    uri: `operator://decision-packet-return-loop/${input.marker}/retained-trial-source-seed/${input.seed.family}`,
    title: `Retained ${input.seed.family} paired-trial source-decision seed`,
    contentHash: `decision-packet-retained-trial-source-seed-${input.seed.family}-${input.marker}`,
    sourceAuthority: "project-decision",
    metadata: {
      ...evidenceMetadata,
      retainedTrialSourceSeed: input.seed.family,
      retainedTrialSourceSeedCorpusName: input.seed.corpusName
    }
  });
  const currentDecisions: RetainedTrialCurrentSourceDecisionProof[] = [];
  const staleDecisions: RetainedTrialHistoricalSourceDecisionProof[] = [];
  const rejectedDecisionInputs: RetainedTrialRejectedSourceDecisionInput[] = [];

  for (const [index, decisionSeed] of input.seed.decisions.entries()) {
    const created = await createRetainedTrialSeedDecision({
      artifactId: artifact.id,
      corpusName: input.seed.corpusName,
      decisionSeed,
      family: input.seed.family,
      index,
      marker: input.marker,
      projectId: input.projectId,
      sourceRepository: input.sourceRepository
    });

    switch (created.status) {
      case "current":
        currentDecisions.push(created.decision);
        break;
      case "stale":
        staleDecisions.push(created.decision);
        break;
      case "rejected":
        rejectedDecisionInputs.push(created.decision);
        break;
    }
  }

  const firstCurrentDecision = currentDecisions[0];
  if (firstCurrentDecision === undefined) {
    throw new Error("Retained paired-trial source seed requires at least one current decision");
  }

  const supersedingDecision = currentDecisions.find((decision) =>
    decision.targetId === "async-job-retry-budget"
  ) ?? firstCurrentDecision;

  for (const staleDecision of staleDecisions) {
    await input.sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: supersedingDecision.sourceClaimId,
      toSourceClaimId: staleDecision.sourceClaimId,
      kind: "supersedes",
      metadata: {
        smokeId: input.marker,
        consumer: "retained paired Codex trial",
        evidenceRef: `retained-trial-source-seed:${input.seed.family}:${staleDecision.targetId}`,
        sourceDecisionRef: supersedingDecision.sourceDecisionId,
        doesNotProve:
          "This retained trial supersession edge does not prove broad temporal source graph quality."
      }
    });
  }

  const rejectedDecisions: RetainedTrialRejectedSourceDecisionProof[] = [];
  for (const rejectedDecision of rejectedDecisionInputs) {
    const sourceRejection = await input.sourceRepository.createSourceRejection({
      projectId: input.projectId,
      sourceArtifactId: artifact.id,
      sourceClaimId: rejectedDecision.claimId,
      title: rejectedDecision.title,
      attemptedClaim: rejectedDecision.claim,
      rejectedBecause: "unsupported",
      reason:
        `The retained ${input.seed.family} trial fixture marks this source path as rejected negative guidance.`,
      doesNotProve:
        "This retained trial source rejection does not prove automated source-review quality.",
      consumer: "retained paired Codex trial",
      metadata: {
        smokeId: input.marker,
        retainedTrialSourceSeed: input.seed.family,
        retainedTrialSourceSeedCorpusName: input.seed.corpusName,
        sourceDecisionId: rejectedDecision.decisionId
      }
    });

    rejectedDecisions.push({
      sourceClaimId: rejectedDecision.claimId,
      sourceDecisionId: rejectedDecision.decisionId,
      sourceRejectionId: sourceRejection.id
    });
  }

  return {
    corpusName: input.seed.corpusName,
    currentDecisions,
    family: input.seed.family,
    rejectedDecisions,
    staleDecisions
  };
};

const retainedTrialSourceDecisionSeedReadbackFor = (
  input: {
    readonly packet: DecisionPacketSmokeJson["packet"];
    readonly proof: RetainedTrialSourceSeedProof;
  }
): RetainedTrialSourceSeedReadback => {
  const packetCurrentDecisions = input.proof.currentDecisions.filter((decision) =>
    input.packet.governingDecisionIds.includes(decision.targetId) &&
    input.packet.sourceDecisionIds.includes(decision.sourceDecisionId)
  );
  const rejectedPathIds = [
    ...input.packet.rejectedPathIds,
    ...input.packet.sourceConsensus.rejectedPathIds
  ];
  const sourceRejectionIds = [
    ...input.packet.sourceRejectionIds,
    ...input.packet.sourceConsensus.sourceRejectionIds
  ];

  return {
    packetGoverningDecisionIds: packetCurrentDecisions.map((decision) => decision.targetId),
    packetSourceDecisionIds: packetCurrentDecisions.map((decision) => decision.sourceDecisionId),
    packetSupersededPathIds: input.proof.staleDecisions
      .map((decision) => decision.sourceClaimId)
      .filter((id) => input.packet.sourceConsensus.supersededPathIds.includes(id)),
    packetRejectedPathIds: input.proof.rejectedDecisions
      .map((decision) => decision.sourceClaimId)
      .filter((id) => rejectedPathIds.includes(id)),
    packetSourceRejectionIds: input.proof.rejectedDecisions
      .map((decision) => decision.sourceRejectionId)
      .filter((id) => sourceRejectionIds.includes(id))
  };
};

const firstSourceUsefulnessOutcome = (
  value: Record<string, unknown>
): Record<string, unknown> | undefined => {
  const outcomes = value["sourceUsefulnessOutcomes"];

  if (!Array.isArray(outcomes)) {
    return undefined;
  }

  const [first] = outcomes;

  return isRecord(first) ? first : undefined;
};

const feedbackOutcome = (
  value: Record<string, unknown>
): string | undefined => {
  const outcome = firstSourceUsefulnessOutcome(value)?.["outcome"];

  return typeof outcome === "string" ? outcome : undefined;
};

const sourceDecisionOutcomeCount = (
  value: Record<string, unknown>,
  sourceDecisionId: string,
  outcome: SourceUsefulnessOutcomeFeedback["outcome"]
): number => {
  const outcomes = value["sourceUsefulnessOutcomes"];

  return Array.isArray(outcomes)
    ? outcomes.filter((item) =>
        isRecord(item) &&
        item["sourceDecisionId"] === sourceDecisionId &&
        item["outcome"] === outcome
      ).length
    : 0;
};

const persistedFeedbackDeltaIdOrThrow = (
  stdout: string,
  message: string
): string => {
  const match = /^feedbackDelta: (.+)$/mu.exec(stdout);
  const feedbackDeltaId = match?.[1]?.trim();

  if (feedbackDeltaId === undefined || feedbackDeltaId.length === 0) {
    throw new Error(message);
  }

  return feedbackDeltaId;
};

const persistedUsefulnessApplicationOrThrow = (
  stdout: string,
  applicationId: string
): { readonly applicationId: string; readonly appliedAt: string } => {
  const match = [...stdout.matchAll(/^usefulnessApplication: ([^|]+)\|(.+)$/gmu)]
    .find((candidate) => candidate[1]?.trim() === applicationId);
  const persistedApplicationId = match?.[1]?.trim();
  const appliedAt = match?.[2]?.trim();

  if (persistedApplicationId !== applicationId || appliedAt === undefined || appliedAt.length === 0) {
    throw new Error("DecisionPacket return-loop smoke missed persisted usefulness application identity");
  }

  return { applicationId: persistedApplicationId, appliedAt };
};

const feedbackDeltaByIdOrThrow = (
  aggregate: { readonly feedbackDeltas: readonly FeedbackDelta[] } | undefined,
  feedbackDeltaId: string,
  message: string
): FeedbackDelta => {
  const feedbackDelta = aggregate?.feedbackDeltas.find((item) => item.id === feedbackDeltaId);

  if (feedbackDelta === undefined) {
    throw new Error(message);
  }

  return feedbackDelta;
};

const assertReturnLoopChecks = (
  checks: readonly ReturnLoopCheck[]
): void => {
  const failed = checks.find((check) => !check.passed);

  if (failed !== undefined) {
    throw new Error(`DecisionPacket return-loop smoke failed: ${failed.label}${failed.detail === undefined ? "" : ` (${failed.detail})`}`);
  }
};

const createIdFactory = (
  marker: string,
  phase: string
): ((prefix: string) => string) => {
  let counter = 0;

  return (prefix) => {
    counter += 1;

    return `${prefix}-${marker}-${phase}-${counter}`;
  };
};

const createSmokeCommandRuntime = (input: {
  readonly compilerDependencies: HarnessCompilerDependencies;
  readonly marker: string;
  readonly projectId: string;
    readonly repositories: {
      readonly harnessRunRepository: DatabaseRuntime["harnessRunRepository"];
      readonly maintenanceQueueRepository: NonNullable<DatabaseRuntime["maintenanceQueueRepository"]>;
      readonly memoryRepository: DatabaseRuntime["memoryRepository"];
      readonly sourceRepository: DatabaseRuntime["sourceRepository"];
      readonly retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]>;
  };
  readonly workspaceId: string;
}): DatabaseRuntime => ({
  workspaceId: input.workspaceId,
  projectId: input.projectId,
  compilerDependencies: input.compilerDependencies,
  harnessRunRepository: input.repositories.harnessRunRepository,
  maintenanceQueueRepository: input.repositories.maintenanceQueueRepository,
  sourceRepository: input.repositories.sourceRepository,
  retrievalRepository: input.repositories.retrievalRepository,
  memoryRepository: input.repositories.memoryRepository,
  async close(): Promise<void> {
    // The smoke owns the shared SQL client and closes it after cleanup.
  }
});

const selectorProofSmokeTables = [
  { tableName: "outbox_events", markerColumn: "payload" },
  { tableName: "memory_applications", markerColumn: "metadata" },
  { tableName: "memory_feedback_events", markerColumn: "metadata" },
  { tableName: "memory_record_versions", markerColumn: "metadata" },
  { tableName: "memory_records", markerColumn: "metadata" },
  { tableName: "anti_memory_candidates", markerColumn: "metadata" },
  { tableName: "memory_candidates", markerColumn: "metadata" },
  { tableName: "source_decision_edges", markerColumn: "metadata" },
  { tableName: "source_decisions", markerColumn: "metadata" },
  { tableName: "source_rejections", markerColumn: "metadata" },
  { tableName: "source_claim_edges", markerColumn: "metadata" },
  { tableName: "source_claims", markerColumn: "metadata" },
  { tableName: "source_artifacts", markerColumn: "metadata" }
] as const;

const deleteSmokeRows = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly markerColumn: "metadata" | "payload";
    readonly tableName: string;
  }
): Promise<void> => {
  await input.client`
    delete from ${input.client(input.tableName)}
    where ${input.client(input.markerColumn)}->>'smokeId' = ${input.marker}
  `;
};

const countSmokeRows = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly markerColumn: "metadata" | "payload";
    readonly tableName: string;
  }
): Promise<number> => {
  const rows = await input.client<{ count: number }[]>`
    select count(*)::int as count
    from ${input.client(input.tableName)}
    where ${input.client(input.markerColumn)}->>'smokeId' = ${input.marker}
  `;

  return rows[0]?.count ?? 0;
};

const deleteSelectorProofRows = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly retrievalRunIds: readonly string[];
  }
): Promise<void> => {
  for (const table of selectorProofSmokeTables) {
    await deleteSmokeRows({
      client: input.client,
      marker: input.marker,
      markerColumn: table.markerColumn,
      tableName: table.tableName
    });
  }

  for (const retrievalRunId of input.retrievalRunIds) {
    await input.client`
      delete from retrieval_runs
      where id = ${retrievalRunId}
    `;
  }
};

const countSelectorProofRows = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly retrievalRunIds: readonly string[];
  }
): Promise<number> => {
  let count = 0;

  for (const table of selectorProofSmokeTables) {
    count += await countSmokeRows({
      client: input.client,
      marker: input.marker,
      markerColumn: table.markerColumn,
      tableName: table.tableName
    });
  }

  for (const retrievalRunId of input.retrievalRunIds) {
    const retrievalRows = await input.client<{ count: number }[]>`
      select count(*)::int as count
      from retrieval_runs
      where id = ${retrievalRunId}
    `;

    count += retrievalRows[0]?.count ?? 0;
  }

  return count;
};

const deleteFeedbackOutboxRows = async (
  input: {
    readonly client: Sql;
    readonly feedbackDeltaIds: readonly string[];
  }
): Promise<void> => {
  for (const feedbackDeltaId of input.feedbackDeltaIds) {
    await input.client`
      delete from maintenance_queue_records
      where payload->>'feedbackDeltaId' = ${feedbackDeltaId}
    `;

    const antiMemoryCandidateRows = await input.client<{ id: string }[]>`
      select id::text as id
      from anti_memory_candidates
      where feedback_delta_id = ${feedbackDeltaId}
    `;

    for (const row of antiMemoryCandidateRows) {
      await input.client`
        delete from outbox_events
        where payload->>'antiMemoryCandidateId' = ${row.id}
      `;
    }

    await input.client`
      delete from anti_memory_candidates
      where feedback_delta_id = ${feedbackDeltaId}
    `;
    await input.client`
      delete from outbox_events
      where payload->>'feedbackDeltaId' = ${feedbackDeltaId}
    `;
  }
};

const countFeedbackOutboxRows = async (
  input: {
    readonly client: Sql;
    readonly feedbackDeltaIds: readonly string[];
  }
): Promise<number> => {
  let count = 0;

  for (const feedbackDeltaId of input.feedbackDeltaIds) {
    const rows = await input.client<{ count: number }[]>`
      select count(*)::int as count
      from outbox_events
      where payload->>'feedbackDeltaId' = ${feedbackDeltaId}
    `;

    count += rows[0]?.count ?? 0;

    const antiMemoryCandidateRows = await input.client<{ id: string }[]>`
      select id::text as id
      from anti_memory_candidates
      where feedback_delta_id = ${feedbackDeltaId}
    `;

    count += antiMemoryCandidateRows.length;

    for (const row of antiMemoryCandidateRows) {
      const outboxRows = await input.client<{ count: number }[]>`
        select count(*)::int as count
        from outbox_events
        where payload->>'antiMemoryCandidateId' = ${row.id}
      `;

      count += outboxRows[0]?.count ?? 0;
    }
  }

  return count;
};

const countFeedbackMaintenanceForbiddenRows = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
  }
): Promise<number> => {
  const rows = await input.client<{ count: number }[]>`
    select (
      (select count(*)::int from memory_records where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from anti_memory_records where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from source_claims where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from source_decisions where metadata->>'smokeId' = ${input.marker})
    ) as count
  `;

  return rows[0]?.count ?? 0;
};

const findFeedbackMaintenanceAntiMemoryCandidate = async (
  input: {
    readonly client: Sql;
    readonly feedbackDeltaId: string;
  }
): Promise<{ id: string; feedbackDeltaId: string | null } | undefined> => {
  const rows = await input.client<{ id: string; feedback_delta_id: string | null }[]>`
    select id::text as id, feedback_delta_id::text as feedback_delta_id
    from anti_memory_candidates
    where feedback_delta_id = ${input.feedbackDeltaId}
    order by created_at asc
    limit 1
  `;
  const row = rows[0];

  if (row === undefined) {
    return undefined;
  }

  return {
    id: row.id,
    feedbackDeltaId: row.feedback_delta_id
  };
};

const findFeedbackMaintenanceQueueRecord = async (
  input: {
    readonly client: Sql;
    readonly feedbackDeltaId: string;
  }
): Promise<{ id: string } | undefined> => {
  const rows = await input.client<{ id: string }[]>`
    select id::text as id
    from maintenance_queue_records
    where job_type = 'review_feedback_delta'
      and payload->>'feedbackDeltaId' = ${input.feedbackDeltaId}
    order by created_at asc
    limit 1
  `;

  return rows[0];
};

const createScopedFeedbackMaintenanceHandler = (
  input: {
    readonly harnessRunRepository: FeedbackDeltaLookupRepository;
    readonly memoryRepository: MemoryRepository;
    readonly sourceRepository: SourceRepository;
  }
): ReturnType<typeof createFeedbackDeltaMaintenanceHandler> => {
  const sourceRepository = input.sourceRepository;
  const getSourceClaimForProject = sourceRepository.getSourceClaimForProject;
  const getSourceDecisionForProject = sourceRepository.getSourceDecisionForProject;

  if (getSourceClaimForProject === undefined || getSourceDecisionForProject === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke requires project-scoped SourceClaim and SourceDecision lookups"
    );
  }

  return createFeedbackDeltaMaintenanceHandler({
    harnessRunRepository: input.harnessRunRepository,
    memoryRepository: input.memoryRepository,
    sourceRepository: {
      getSourceClaimForProject(projectId, sourceClaimId) {
        return getSourceClaimForProject.call(sourceRepository, projectId, sourceClaimId);
      },
      getSourceDecisionForProject(projectId, sourceDecisionId) {
        return getSourceDecisionForProject.call(sourceRepository, projectId, sourceDecisionId);
      }
    },
    now: () => "2026-07-07T12:00:00.000Z"
  });
};

const replayFeedbackMaintenance = async (
  input: {
    readonly client: Sql;
    readonly feedbackDeltaId: string;
    readonly handler: ReturnType<typeof createFeedbackDeltaMaintenanceHandler>;
    readonly readback: Awaited<ReturnType<typeof runMaintenanceQueueRecord>>;
  }
): Promise<{
  readonly candidateId: string | undefined;
  readonly outboxCountUnchanged: boolean;
}> => {
  const feedbackOutboxCountBeforeReplay = await countFeedbackOutboxRows({
    client: input.client,
    feedbackDeltaIds: [input.feedbackDeltaId]
  });
  const replayJob = parseMaintenanceJob(input.readback.record.jobType, input.readback.record.payload);

  if (replayJob?.jobType !== "review_feedback_delta") {
    throw new Error("DecisionPacket return-loop smoke could not parse feedback maintenance replay job");
  }

  const replayOutcome = await input.handler.run({
    record: input.readback.record,
    job: replayJob,
    writeBoundary: buildMaintenanceQueueWriteBoundaryReadback(replayJob.jobType)
  });
  const feedbackOutboxCountAfterReplay = await countFeedbackOutboxRows({
    client: input.client,
    feedbackDeltaIds: [input.feedbackDeltaId]
  });

  return {
    candidateId: replayOutcome.status === "succeeded"
      ? replayOutcome.createdReviewCandidates?.[0]?.id
      : undefined,
    outboxCountUnchanged: feedbackOutboxCountAfterReplay === feedbackOutboxCountBeforeReplay
  };
};

const runFeedbackMaintenanceProof = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly projectId: string;
    readonly feedbackDelta: FeedbackDelta;
    readonly repositories: {
      readonly maintenanceQueueRepository: DrizzleMaintenanceQueueRepository;
      readonly harnessRunRepository: FeedbackDeltaLookupRepository;
      readonly memoryRepository: MemoryRepository;
      readonly sourceRepository: SourceRepository;
    };
  }
): Promise<FeedbackMaintenanceProofResult> => {
  const directMutationCountBefore = await countFeedbackMaintenanceForbiddenRows({
    client: input.client,
    marker: input.marker
  });
  const queueRecord = await findFeedbackMaintenanceQueueRecord({
    client: input.client,
    feedbackDeltaId: input.feedbackDelta.id
  });

  if (queueRecord === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke did not enqueue feedback maintenance queue record"
    );
  }

  const feedbackMaintenanceHandler = createScopedFeedbackMaintenanceHandler({
    harnessRunRepository: input.repositories.harnessRunRepository,
    memoryRepository: input.repositories.memoryRepository,
    sourceRepository: input.repositories.sourceRepository
  });
  const readback = await runMaintenanceQueueRecord({
    repository: input.repositories.maintenanceQueueRepository,
    recordId: queueRecord.id,
    claim: {
      lockedBy: "decision-packet-return-loop-smoke"
    },
    handlers: [feedbackMaintenanceHandler]
  });
  const candidate = await findFeedbackMaintenanceAntiMemoryCandidate({
    client: input.client,
    feedbackDeltaId: input.feedbackDelta.id
  });

  if (candidate === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke did not create feedback maintenance anti-memory candidate"
    );
  }

  const replay = await replayFeedbackMaintenance({
    client: input.client,
    feedbackDeltaId: input.feedbackDelta.id,
    handler: feedbackMaintenanceHandler,
    readback
  });
  const directMutationCountAfter = await countFeedbackMaintenanceForbiddenRows({
    client: input.client,
    marker: input.marker
  });

  return {
    queueRecordId: queueRecord.id,
    queueStatus: readback.status,
    handlerBoundaryPassed: readback.handlerWriteBoundary?.status === "passed",
    antiMemoryCandidateId: candidate.id,
    candidateLinkedToFeedbackDelta: candidate.feedbackDeltaId === input.feedbackDelta.id,
    delayedLookupResolved:
      readback.status === "succeeded" && candidate.feedbackDeltaId === input.feedbackDelta.id,
    exactReplayIdempotent:
      replay.candidateId === candidate.id && replay.outboxCountUnchanged,
    directMutationDelta: directMutationCountAfter - directMutationCountBefore
  };
};

const runFeedbackMaintenanceGovernedProof = async (
  input: {
    readonly baseRuntime: SourcePacketProofInput["baseRuntime"];
    readonly candidateId: string;
    readonly commandRuntime: DatabaseRuntime;
    readonly evidenceReviewedRef: string;
    readonly marker: string;
    readonly projectId: string;
    readonly sourceClaimId: string;
    readonly repositories: {
      readonly harnessRunRepository: HarnessRunRepository;
      readonly memoryRepository: MemoryRepository;
      readonly retrievalRepository: RetrievalRepository;
      readonly sourceRepository: SourceRepository;
    };
    readonly workspaceId: string;
  }
): Promise<FeedbackMaintenanceGovernedProofResult> => {
  const {
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
  const getSourceClaimForProject = sourceRepository.getSourceClaimForProject;

  if (getSourceClaimForProject === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke requires project-scoped SourceClaim review lookup"
    );
  }

  const promotion = await promoteAntiMemoryCandidateThroughGate({
    memoryRepository,
    sourceRepository: {
      getSourceClaimForProject(projectId, sourceClaimId) {
        return getSourceClaimForProject.call(sourceRepository, projectId, sourceClaimId);
      }
    },
    review: {
      candidateId: input.candidateId,
      reviewer: "decision-packet-return-loop-smoke",
      evidenceReviewedRef: input.evidenceReviewedRef,
      metadata: {
        smokeId: input.marker,
        proof: "feedback_maintenance_reviewed_transition"
      }
    }
  });
  const compiled = await compileHarnessPlan({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    operatorIntent: {
      rawIntent: `DecisionPacket return-loop feedback stale source claim ${input.marker}`,
      source: "cli",
      metadata: { smokeId: input.marker }
    },
    taskContract: {
      title: "Prove reviewed feedback maintenance governs the next selection",
      objective:
        "Select the stale feedback source context after its maintenance candidate was reviewed.",
      constraints: [
        "use the promoted AntiMemoryRecord",
        "keep FeedbackDelta itself review-only"
      ],
      nonGoals: ["no autonomous promotion", "no direct FeedbackDelta selection authority"],
      acceptance: [
        "the reviewed AntiMemoryRecord excludes its source claim from the next DecisionPacket"
      ],
      metadata: {
        smokeId: input.marker,
        proof: "feedback_maintenance_reviewed_transition"
      }
    },
    tokenBudget: 360,
    metadata: {
      smokeId: input.marker,
      proof: "feedback_maintenance_reviewed_transition"
    }
  }, {
    harnessRunRepository,
    memoryRepository,
    sourceRepository: activationSourceRepositoryFor(sourceRepository),
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "feedback-maintenance-governed")
  });
  const proofRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: compiled.harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "feedback-maintenance-governed-proof",
      evidenceContract: compiled.evidenceContract
    }
  });
  await issueDecisionPacket(harnessRunRepository, proofRun.id);
  const packet = await readDecisionPacketForSmokeRun({
    baseRuntime: input.baseRuntime,
    commandRuntime: input.commandRuntime,
    runId: proofRun.id
  });
  const reviewedTransitionGoverned =
    !packet.packet.sourceClaimIds.includes(input.sourceClaimId) &&
    packet.packet.rejectedPathIds.includes(promotion.antiMemoryRecord.id) &&
    packet.readModel.context.exclusionDetails.some((exclusion) =>
      exclusion.subjectType === "source_claim" &&
      exclusion.subjectId === input.sourceClaimId &&
      exclusion.reason === "unsafe" &&
      exclusion.explanation.includes(promotion.antiMemoryRecord.id)
    );

  return {
    antiMemoryRecordId: promotion.antiMemoryRecord.id,
    proofRunId: proofRun.id,
    packetSourceClaimIds: packet.packet.sourceClaimIds,
    packetRejectedPathIds: packet.packet.rejectedPathIds,
    reviewedTransitionGoverned
  };
};

const runStandaloneAntiMemoryProof = async (
  input: StandaloneAntiMemoryProofInput
): Promise<StandaloneAntiMemoryProofResult> => {
  const {
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
  const antiMemory = await memoryRepository.createAntiMemoryRecord({
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    key: `standalone-anti-memory:${input.marker}`,
    rejectedClaim: "Standalone anti-memory rejected path must not become positive authority.",
    reason: "The reviewed path was rejected and remains non-governing.",
    appliesTo: "standalone anti-memory rejected path",
    summary: "Standalone anti-memory rejected path",
    body: "Preserve this standalone anti-memory rejected path only as a packet warning.",
    owner: "decision-packet-return-loop-smoke",
    confidence: 95,
    sourceLineage: [{ sourceId: `source:standalone-anti-memory:${input.marker}` }],
    validFrom: "2026-07-01T00:00:00.000Z",
    metadata: {
      smokeId: input.marker,
      standaloneAntiMemoryProof: true
    }
  });
  const compiled = await compileHarnessPlan({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    operatorIntent: {
      rawIntent: `standalone anti-memory rejected path ${input.marker}`,
      source: "cli",
      metadata: { smokeId: input.marker }
    },
    taskContract: {
      title: "Prove standalone anti-memory DecisionPacket readback",
      objective: "Keep one standalone anti-memory rejected path visible without positive authority.",
      constraints: ["persist one bounded exclusion", "create no usefulness signal"],
      nonGoals: ["no positive memory", "no source decision", "no feedback"],
      acceptance: ["CLI and MCP expose exactly one non-governing rejected path"],
      metadata: {
        smokeId: input.marker,
        standaloneAntiMemoryProof: true
      }
    },
    tokenBudget: 1,
    metadata: {
      smokeId: input.marker,
      proof: "standalone_anti_memory_readback"
    }
  }, {
    harnessRunRepository,
    memoryRepository,
    sourceRepository: activationSourceRepositoryFor(sourceRepository),
    retrievalRepository,
    now: () => "2026-07-15T12:00:00.000Z",
    createId: createIdFactory(input.marker, "standalone-anti-memory")
  });
  const retrievalRunId = compiled.contextAssembly.metadata.retrievalRunId;

  if (typeof retrievalRunId !== "string") {
    throw new Error("Standalone anti-memory proof missed persisted retrieval run id");
  }

  const proofRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: compiled.harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      phase: "standalone-anti-memory-proof",
      evidenceContract: compiled.evidenceContract
    }
  });
  await issueDecisionPacket(harnessRunRepository, proofRun.id);
  const transportProof = await readOnlyDecisionPacketTransports({
    baseRuntime: input.baseRuntime,
    client: input.client,
    commandRuntime: input.commandRuntime,
    mcpId: "standalone-anti-memory",
    runId: proofRun.id
  });
  const { mcpReadback, packet } = transportProof;
  const usefulnessRowsAfter = await countReadOnlyUsefulnessRows({
    client: input.client,
    executionRunId: proofRun.id
  });
  const [counts] = await input.client<{
    candidateCount: number;
    excludedDecisionCount: number;
    contextExclusionCount: number;
  }[]>`
    select
      (
        select count(*)::int
        from retrieval_candidates
        where retrieval_run_id = ${retrievalRunId}
          and kind = 'anti_memory'
          and subject_type = 'anti_memory_record'
          and subject_id = ${antiMemory.id}
      ) as "candidateCount",
      (
        select count(*)::int
        from activation_decisions
        where retrieval_run_id = ${retrievalRunId}
          and subject_type = 'anti_memory_record'
          and subject_id = ${antiMemory.id}
          and decision = 'excluded'
      ) as "excludedDecisionCount",
      (
        select count(*)::int
        from context_exclusions
        where context_assembly_id = ${compiled.contextAssembly.id}
          and subject_type = 'anti_memory_record'
          and subject_id = ${antiMemory.id}
          and reason = 'unsafe'
      ) as "contextExclusionCount"
  `;
  const cliExclusions = packet.readModel.context.exclusionDetails.filter((exclusion) =>
    exclusion.subjectType === "anti_memory_record" && exclusion.subjectId === antiMemory.id
  );
  const transportReadback = standaloneAntiMemoryTransportReadback({
    antiMemoryRecordId: antiMemory.id,
    cliExclusions,
    cliPacket: packet.packet,
    mcpPacket: mcpReadback.packet
  });

  return {
    proofRunId: proofRun.id,
    retrievalRunId,
    antiMemoryRecordId: antiMemory.id,
    candidateCount: counts?.candidateCount ?? 0,
    excludedDecisionCount: counts?.excludedDecisionCount ?? 0,
    contextExclusionCount: counts?.contextExclusionCount ?? 0,
    packetRejectedPathIds: packet.packet.rejectedPathIds,
    cliPreserved: transportReadback.cliPreserved,
    mcpPreserved: transportReadback.mcpPreserved,
    usefulnessRowDelta: usefulnessRowsAfter - transportProof.usefulnessRowsBefore
  };
};

const runSourceConsensusProof = async (
  input: SourceConsensusProofInput
): Promise<SourceConsensusProofResult> => {
  const {
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
  const evidenceMetadata = capturedCurrentEvidenceMetadata(
    input.marker,
    "source-consensus"
  );
  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "run",
    uri: `operator://decision-packet-return-loop/${input.marker}/source-consensus`,
    title: "DecisionPacket source consensus smoke source",
    contentHash: `decision-packet-source-consensus-${input.marker}`,
    sourceAuthority: "project-decision",
    metadata: {
      ...evidenceMetadata,
      sourceConsensusProof: true
    }
  });
  const sourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    content: "Captured evidence for the DecisionPacket source consensus smoke.",
    contentHash: `decision-packet-source-consensus-chunk-${input.marker}`,
    metadata: {
      ...evidenceMetadata,
      sourceConsensusProof: true
    }
  });
  const currentClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    executionRunId: input.executionRunId,
    claim: "Current DecisionPacket source consensus must govern the source consensus proof.",
    mechanism:
      "A decision-linked accepted SourceClaim with source graph supersession support is selected by compileHarnessPlan and rendered into the final DecisionPacket.",
    krnImplication:
      "The headless agent receives current source-backed guidance while superseded and rejected source paths stay visible as non-governing history.",
    doesNotProve:
      "This smoke does not prove broad source truth, large-corpus consensus quality, or live Codex obedience.",
    sourceAuthority: "project-decision",
    supportType: "decision",
    consumer: "DecisionPacket source consensus smoke",
    falsifier:
      "The final DecisionPacket misses the current decision-linked claim or treats superseded/rejected source paths as governing guidance.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      sourceConsensusProof: "current"
    }
  });
  const supersededClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    executionRunId: input.executionRunId,
    claim: "Superseded DecisionPacket source consensus should no longer govern.",
    mechanism:
      "This older accepted SourceClaim keeps decision support so supersession, not missing evidence, is the reason it is excluded.",
    krnImplication:
      "KRN must preserve the older source path as history without activating it as current authority.",
    doesNotProve:
      "This smoke does not prove every supersession path or broad temporal consensus quality.",
    sourceAuthority: "project-decision",
    supportType: "decision",
    consumer: "DecisionPacket source consensus smoke",
    falsifier:
      "The final DecisionPacket includes the superseded source claim as governing authority.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      sourceConsensusProof: "superseded"
    }
  });
  const unsupportedRelationClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    executionRunId: input.executionRunId,
    claim: "DecisionPacket source consensus relation evidence must be present before supersession.",
    mechanism:
      "This decision-supported claim is linked by an intentionally unsupported graph relation.",
    krnImplication:
      "KRN must retain the claim as current while exposing the unsupported relation as a gap.",
    doesNotProve:
      "This smoke does not prove repository-wide relation evidence completeness.",
    sourceAuthority: "project-decision",
    supportType: "decision",
    consumer: "DecisionPacket source consensus smoke",
    falsifier:
      "An unsupported current relation demotes or supersedes this decision-supported claim.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      sourceConsensusProof: "unsupported-relation-target"
    }
  });
  const rejectedClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    executionRunId: input.executionRunId,
    claim: "Rejected DecisionPacket source consensus should stay visible only as a rejected path.",
    mechanism:
      "A reviewed SourceRejection linked to this claim marks the path as non-governing evidence for future activation.",
    krnImplication:
      "KRN can warn the headless agent away from rejected source reasoning without deleting the history.",
    doesNotProve:
      "This smoke does not prove automated source-review quality or broad rejection taxonomy coverage.",
    sourceAuthority: "project-decision",
    supportType: "rejection",
    consumer: "DecisionPacket source consensus smoke",
    falsifier:
      "The final DecisionPacket treats the rejected source claim as governing guidance or drops the rejected path entirely.",
    status: "proposed",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "rejected"
    }
  });
  const currentDecision = await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: currentClaim.id,
    status: "adopt",
    decision: "Adopt current source consensus for the DecisionPacket source proof.",
    rationale:
      "The current claim has mechanism, KRN implication, consumer, falsifier, and decision-grade support.",
    falsifier:
      "The final DecisionPacket misses the current decision-linked source claim.",
    consumer: "DecisionPacket source consensus smoke",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "current"
    }
  });
  const supersededDecision = await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: supersededClaim.id,
    status: "adopt",
    decision: "Retain the older source consensus only as superseded history.",
    rationale:
      "The older claim remains decision-supported so the source graph edge is responsible for the exclusion.",
    falsifier:
      "The final DecisionPacket activates the superseded source claim as current authority.",
    consumer: "DecisionPacket source consensus smoke",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "superseded"
    }
  });
  const unsupportedRelationDecision = await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: unsupportedRelationClaim.id,
    status: "adopt",
    decision: "Adopt the unsupported-relation target as independently decision-supported.",
    rationale:
      "The target remains supported even when a relation lacks inspectable support metadata.",
    falsifier:
      "The target becomes historical solely because of the unsupported relation.",
    consumer: "DecisionPacket source consensus smoke",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "unsupported-relation-target"
    }
  });
  await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: rejectedClaim.id,
    status: "reject",
    decision: "Reject this source consensus path for the DecisionPacket source proof.",
    rationale:
      "The attempted guidance is intentionally represented as a rejected path, not current authority.",
    falsifier:
      "The final DecisionPacket activates the rejected source claim as governing guidance.",
    consumer: "DecisionPacket source consensus smoke",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "rejected"
    }
  });
  const currentDecisionId = `architecture-decision:source-consensus:${input.marker}:current`;
  const supersededDecisionId = `architecture-decision:source-consensus:${input.marker}:superseded`;
  const currentSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
    sourceClaimId: currentClaim.id,
    sourceDecisionId: currentDecision.id,
    targetType: "architecture_decision",
    targetId: currentDecisionId,
    supportType: "decision",
    confidence: "high",
    notes: "DecisionPacket source consensus smoke current decision support.",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "current"
    }
  });
  const supersededSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
    sourceClaimId: supersededClaim.id,
    sourceDecisionId: supersededDecision.id,
    targetType: "architecture_decision",
    targetId: supersededDecisionId,
    supportType: "decision",
    confidence: "high",
    notes: "DecisionPacket source consensus smoke superseded decision support.",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "superseded"
    }
  });
  await sourceRepository.createSourceDecisionEdge({
    sourceClaimId: unsupportedRelationClaim.id,
    sourceDecisionId: unsupportedRelationDecision.id,
    targetType: "architecture_decision",
    targetId: `architecture-decision:source-consensus:${input.marker}:unsupported-relation-target`,
    supportType: "decision",
    confidence: "high",
    notes: "DecisionPacket source consensus smoke unsupported relation target support.",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "unsupported-relation-target"
    }
  });

  await sourceRepository.createSourceClaimEdge({
    fromSourceClaimId: currentClaim.id,
    toSourceClaimId: supersededClaim.id,
    kind: "supersedes",
    metadata: {
      smokeId: input.marker,
      consumer: "DecisionPacket source consensus smoke",
      sourceDecisionRef: currentDecision.id,
      doesNotProve:
        "This source graph edge does not prove broad consensus quality or all temporal source graph behavior."
    }
  });
  const unsupportedRelationEdge = await sourceRepository.createSourceClaimEdge({
    fromSourceClaimId: currentClaim.id,
    toSourceClaimId: unsupportedRelationClaim.id,
    kind: "narrows",
    metadata: {
      smokeId: input.marker,
      consumer: "DecisionPacket source consensus smoke",
      doesNotProve:
        "This intentionally unsupported relation does not prove supersession."
    }
  });

  const noFormalRejectionCompile = await compileHarnessPlan({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    operatorIntent: {
      rawIntent: `decision packet source consensus without formal rejection ${input.marker}`,
      source: "cli",
      metadata: {
        smokeId: input.marker
      }
    },
    taskContract: {
      title: "Prove DecisionPacket stays non-ready without formal rejection",
      objective:
        "Keep the superseded source claim explicit without turning it into rejected-path authority before a SourceRejection exists.",
      constraints: ["use source graph consensus", "render a read-only DecisionPacket"],
      nonGoals: ["no markdown source ledger", "no broad corpus consensus", "no live Codex"],
      acceptance: [
        "current decision-linked source claim appears in the DecisionPacket",
        "superseded source claim remains explicit without formal rejection coverage"
      ],
      metadata: {
        smokeId: input.marker,
        sourceConsensusProof: "no-formal-rejection"
      }
    },
    tokenBudget: 360,
    metadata: {
      smokeId: input.marker,
      proof: "decision_packet_source_consensus_without_formal_rejection"
    }
  }, {
    harnessRunRepository,
    memoryRepository,
    sourceRepository: activationSourceRepositoryFor(sourceRepository),
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "source-consensus-no-formal-rejection")
  });
  const noFormalRejectionRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: noFormalRejectionCompile.harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "source-consensus-no-formal-rejection-proof",
      evidenceContract: noFormalRejectionCompile.evidenceContract
    }
  });
  await issueDecisionPacket(harnessRunRepository, noFormalRejectionRun.id);
  const noFormalRejectionPacket = await readDecisionPacketForSmokeRun({
    baseRuntime: input.baseRuntime,
    commandRuntime: input.commandRuntime,
    runId: noFormalRejectionRun.id
  });
  const noFormalRejectionKeepsTypedState = hasNoFormalRejectionTypedState({
    currentDecisionId,
    packet: noFormalRejectionPacket.packet,
    supersededClaimId: supersededClaim.id
  });

  const sourceRejection = await sourceRepository.createSourceRejection({
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    sourceArtifactId: sourceArtifact.id,
    sourceClaimId: rejectedClaim.id,
    title: "Rejected DecisionPacket source consensus path",
    attemptedClaim: rejectedClaim.claim,
    rejectedBecause: "unsupported",
    reason:
      "The path is deliberately rejected to prove DecisionPacket keeps rejected source evidence out of governing authority.",
    doesNotProve:
      "This source rejection does not prove automated source-review quality.",
    consumer: "DecisionPacket source consensus smoke",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: "rejected"
    }
  });
  const sourceConsensusCompile = await compileHarnessPlan({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    operatorIntent: {
      rawIntent: `decision packet source consensus proof ${input.marker}`,
      source: "cli",
      metadata: {
        smokeId: input.marker
      }
    },
    taskContract: {
      title: "Prove DecisionPacket source consensus",
      objective:
        "Use current DecisionPacket source consensus while preserving superseded and rejected source consensus paths as non-governing evidence.",
      constraints: ["use source graph consensus", "render a read-only DecisionPacket"],
      nonGoals: ["no markdown source ledger", "no broad corpus consensus", "no live Codex"],
      acceptance: [
        "current decision-linked source claim appears in the DecisionPacket",
        "superseded and rejected source claims stay out of governing context"
      ],
      metadata: {
        smokeId: input.marker,
        sourceConsensusProof: true
      }
    },
    tokenBudget: 360,
    metadata: {
      smokeId: input.marker,
      proof: "decision_packet_source_consensus"
    }
  }, {
    harnessRunRepository,
    memoryRepository,
    sourceRepository: activationSourceRepositoryFor(sourceRepository),
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "source-consensus")
  });
  const proofRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: sourceConsensusCompile.harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "source-consensus-proof",
      evidenceContract: sourceConsensusCompile.evidenceContract
    }
  });
  await issueDecisionPacket(harnessRunRepository, proofRun.id);
  const packet = await readDecisionPacketForSmokeRun({
    baseRuntime: input.baseRuntime,
    commandRuntime: input.commandRuntime,
    runId: proofRun.id
  });
  const packetSourceDecisionEdgeIds = packet.packet.sourceConsensus.sourceDecisionEdgeIds;
  const packetSupersededPathIds = packet.packet.sourceConsensus.supersededPathIds;
  const packetRejectedPathIds = packet.packet.rejectedPathIds;
  const currentClaimGoverned =
    packet.packet.sourceClaimIds.includes(currentClaim.id) &&
    packet.packet.sourceConsensus.decisionLinkedSourceClaimIds.includes(currentClaim.id) &&
    packet.packet.governingDecisionIds.includes(currentDecisionId) &&
    packetSourceDecisionEdgeIds.includes(currentSourceDecisionEdge.id);
  const supersededClaimIsNonGoverning = isSupersededClaimNonGoverning({
    packet: packet.packet,
    supersededClaimId: supersededClaim.id,
    supersededDecisionId
  });
  const rejectedClaimHasFormalRejection = hasFormalSourceRejection({
    packet: packet.packet,
    rejectedClaimId: rejectedClaim.id,
    sourceRejectionId: sourceRejection.id
  });
  const timeline = packet.packet.sourceConsensus.timeline;
  const timelineEntries = isRecord(timeline) ? readRecordArray(timeline, "entries") : [];
  const currentTimelineEntry = timelineEntries.find((entry) =>
    readString(entry, "sourceClaimId") === currentClaim.id
  );
  const unsupportedRelationReadback = unsupportedRelationReadbackFor({
    timelineEntries,
    claimId: unsupportedRelationClaim.id,
    edgeId: unsupportedRelationEdge.id
  });
  const temporalExplanationPresent = currentTimelineEntry !== undefined &&
    readString(currentTimelineEntry, "createdAt") !== undefined &&
    readStringArray(currentTimelineEntry, "supersedesSourceClaimIds").includes(supersededClaim.id);
  const temporalExplanationHasEvidence = temporalExplanationPresent &&
    readStringArray(currentTimelineEntry, "evidenceRefs").length > 0;

  return {
    proofRunId: proofRun.id,
    retrievalRunId:
      typeof sourceConsensusCompile.contextAssembly.metadata.retrievalRunId === "string"
        ? sourceConsensusCompile.contextAssembly.metadata.retrievalRunId
        : undefined,
    currentSourceClaimId: currentClaim.id,
    supersededSourceClaimId: supersededClaim.id,
    rejectedSourceClaimId: rejectedClaim.id,
    currentSourceDecisionEdgeId: currentSourceDecisionEdge.id,
    supersededSourceDecisionEdgeId: supersededSourceDecisionEdge.id,
    sourceRejectionId: sourceRejection.id,
    governingDecisionId: currentDecisionId,
    packetSourceClaimIds: packet.packet.sourceClaimIds,
    packetRejectedPathIds,
    packetSourceDecisionEdgeIds,
    packetSupersededPathIds,
    packetSourceRejectionIds: packet.packet.sourceConsensus.sourceRejectionIds,
    currentClaimGoverned,
    noFormalRejectionRunId: noFormalRejectionRun.id,
    noFormalRejectionStatus: noFormalRejectionPacket.packet.abstentionScore.status,
    noFormalRejectionReasons: noFormalRejectionPacket.packet.abstentionScore.reasons,
    noFormalRejectionGoverningDecisionIds: noFormalRejectionPacket.packet.governingDecisionIds,
    noFormalRejectionContextExclusions: noFormalRejectionPacket.packet.contextExclusions,
    noFormalRejectionRejectedPathIds: noFormalRejectionPacket.packet.rejectedPathIds,
    noFormalRejectionSourceRejectionIds: noFormalRejectionPacket.packet.sourceRejectionIds,
    noFormalRejectionKeepsTypedState,
    supersededClaimIsNonGoverning,
    rejectedClaimHasFormalRejection,
    temporalExplanationPresent,
    temporalExplanationHasEvidence,
    unsupportedRelationClaimId: unsupportedRelationClaim.id,
    unsupportedRelationEdgeId: unsupportedRelationEdge.id,
    ...unsupportedRelationReadback
  };
};

const runUnresolvedAcceptedSourceDissentProof = async (
  input: SourceDissentProofInput
): Promise<SourceDissentProofResult> => {
  const {
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
  const memoryRecord = await memoryRepository.getMemoryRecordById(input.memoryRecordId);
  if (memoryRecord === undefined) {
    throw new Error("DecisionPacket source dissent proof lost its selected memory record");
  }
  const evidenceMetadata = capturedCurrentEvidenceMetadata(
    input.marker,
    "unresolved-source-dissent"
  );
  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "run",
    uri: `operator://decision-packet-return-loop/${input.marker}/unresolved-source-dissent`,
    title: "DecisionPacket unresolved accepted source dissent smoke source",
    contentHash: `decision-packet-unresolved-source-dissent-${input.marker}`,
    sourceAuthority: "project-decision",
    metadata: {
      ...evidenceMetadata,
      unresolvedAcceptedSourceDissentProof: true
    }
  });
  const sourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    content: "Captured evidence for the DecisionPacket unresolved accepted source dissent smoke.",
    contentHash: `decision-packet-unresolved-source-dissent-chunk-${input.marker}`,
    metadata: {
      ...evidenceMetadata,
      unresolvedAcceptedSourceDissentProof: true
    }
  });
  const governingClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    executionRunId: input.executionRunId,
    claim:
      "Unresolved accepted source dissent must stop DecisionPacket execution until a reviewed canonical resolution exists.",
    mechanism:
      "A current accepted SourceClaim with an accepted contradicting peer remains a reviewable conflict rather than unqualified task authority.",
    krnImplication:
      "DecisionPacket must expose the conflict without issuing executable governing guidance.",
    doesNotProve:
      "This smoke does not decide which accepted claim is true or prove broad source consensus quality.",
    sourceAuthority: "project-decision",
    supportType: "decision",
    consumer: "DecisionPacket unresolved source dissent smoke",
    falsifier:
      "A DecisionPacket with this unresolved accepted dissent remains executable instead of abstaining.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      unresolvedAcceptedSourceDissentProof: "governing"
    }
  });
  const dissentingClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    executionRunId: input.executionRunId,
    claim:
      "An unresolved accepted source peer contradicts the governing DecisionPacket instruction and requires review before execution.",
    mechanism:
      "A decision-linked accepted SourceClaim contradicts the candidate governing claim while preserving both paths for canonical review.",
    krnImplication:
      "KRN must not treat retrieval score as conflict resolution.",
    doesNotProve:
      "This smoke does not prove the dissenting claim is true or resolve the conflict.",
    sourceAuthority: "project-decision",
    supportType: "decision",
    consumer: "DecisionPacket unresolved source dissent smoke",
    falsifier:
      "The DecisionPacket silently drops the accepted dissent or issues executable guidance.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      unresolvedAcceptedSourceDissentProof: "dissenting"
    }
  });
  const governingSourceDecision = await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: governingClaim.id,
    status: "adopt",
    decision: "Keep this source claim decision-linked while its accepted contradiction is unresolved.",
    rationale:
      "The claim has full source-to-decision fields; the open conflict is represented by a separate accepted source relation.",
    falsifier:
      "The DecisionPacket omits this accepted source claim from the unresolved conflict readback.",
    consumer: "DecisionPacket unresolved source dissent smoke",
    metadata: {
      smokeId: input.marker,
      unresolvedAcceptedSourceDissentProof: "governing"
    }
  });
  const dissentingSourceDecision = await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: dissentingClaim.id,
    status: "adopt",
    decision: "Keep the accepted contradictory source claim visible for review before execution.",
    rationale:
      "The accepted dissent is decision-linked so absence of support cannot mask the unresolved authority conflict.",
    falsifier:
      "The DecisionPacket treats the accepted contradiction as unsupported instead of explicit conflicting authority.",
    consumer: "DecisionPacket unresolved source dissent smoke",
    metadata: {
      smokeId: input.marker,
      unresolvedAcceptedSourceDissentProof: "dissenting"
    }
  });
  const governingDecisionId = `architecture-decision:unresolved-source-dissent:${input.marker}`;
  const governingSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
    sourceClaimId: governingClaim.id,
    sourceDecisionId: governingSourceDecision.id,
    targetType: "architecture_decision",
    targetId: governingDecisionId,
    supportType: "decision",
    confidence: "high",
    notes: "DecisionPacket unresolved source dissent governing support.",
    metadata: {
      smokeId: input.marker,
      unresolvedAcceptedSourceDissentProof: "governing"
    }
  });
  const dissentingSourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
    sourceClaimId: dissentingClaim.id,
    sourceDecisionId: dissentingSourceDecision.id,
    targetType: "architecture_decision",
    targetId: governingDecisionId,
    supportType: "decision",
    confidence: "high",
    notes: "DecisionPacket unresolved source dissent peer support.",
    metadata: {
      smokeId: input.marker,
      unresolvedAcceptedSourceDissentProof: "dissenting"
    }
  });
  const dissentingSourceClaimEdge = await sourceRepository.createSourceClaimEdge({
    fromSourceClaimId: dissentingClaim.id,
    toSourceClaimId: governingClaim.id,
    kind: "contradicts",
    metadata: {
      smokeId: input.marker,
      consumer: "DecisionPacket unresolved source dissent smoke",
      sourceDecisionRef: dissentingSourceDecision.id,
      doesNotProve:
        "This relation proves only that the persisted smoke models unresolved accepted dissent, not source truth."
    }
  });
  const currentGoverningClaim = await sourceRepository.getSourceClaimById(governingClaim.id);
  const currentDissentingClaim = await sourceRepository.getSourceClaimById(dissentingClaim.id);
  if (currentGoverningClaim === undefined || currentDissentingClaim === undefined) {
    throw new Error("DecisionPacket source dissent smoke lost its canonical claim revisions");
  }
  // Persist a legacy/partial activation state through repositories so the
  // DecisionPacket boundary is tested independently of compiler filtering.
  const smokeMetadata = {
    smokeId: input.marker,
    unresolvedAcceptedSourceDissentProof: true
  };
  const operatorIntent = await harnessRunRepository.createOperatorIntent({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    source: "cli",
    rawIntent: `unresolved accepted source dissent DecisionPacket proof ${input.marker}`,
    metadata: smokeMetadata
  });
  const taskContract = await harnessRunRepository.createTaskContract({
    operatorIntentId: operatorIntent.id,
    projectId: input.projectId,
    title: "Falsify executable unresolved accepted source dissent",
    objective:
      "Read a DecisionPacket with two accepted contradictory source claims and require a reviewed canonical resolution before execution.",
    constraints: ["use source graph consensus", "render a read-only DecisionPacket"],
    nonGoals: ["do not resolve source truth", "do not invoke live Codex"],
    acceptance: [
      "both accepted source claims remain visible",
      "unresolved dissent is classified before execution"
    ],
    metadata: smokeMetadata
  });
  const harnessPlan = await harnessRunRepository.createHarnessPlan({
    taskContractId: taskContract.id,
    version: 1,
    status: "ready",
    summary: "Persisted unresolved accepted source dissent DecisionPacket proof",
    nextAction: "Render the persisted DecisionPacket readback.",
    metadata: smokeMetadata
  });
  const proofRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "unresolved-accepted-source-dissent-proof"
    }
  });
  const retrievalRun = await retrievalRepository.startRetrievalRun({
    projectId: input.projectId,
    executionRunId: proofRun.id,
    taskContractId: taskContract.id,
    query: "unresolved accepted source dissent DecisionPacket proof",
    tokenBudget: 360,
    metadata: smokeMetadata
  });
  const contextAssembly = await harnessRunRepository.createContextAssembly({
    harnessPlanId: harnessPlan.id,
    status: "assembled",
    tokenBudget: 360,
    inclusions: [{
      subjectType: "source_claim",
      subjectId: governingClaim.id,
      reason: "Persisted packet readback includes the decision-linked governing claim.",
      expectedUse: "Expose unresolved accepted dissent before execution.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: dissentingClaim.id,
      reason: "Persisted packet readback includes the accepted contradictory peer.",
      expectedUse: "Expose unresolved accepted dissent before execution.",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "memory_record",
      subjectId: input.memoryRecordId,
      reason: "Retain selected memory context while its supporting source authority is unresolved.",
      expectedUse: "Prove memory guidance cannot bypass contradictory source review.",
      sourceAuthority: "project-decision"
    }],
    exclusions: [],
    metadata: {
      ...smokeMetadata,
      retrievalRunId: retrievalRun.id,
      canonicalRevisionTokens: [
        ...[currentGoverningClaim, currentDissentingClaim].map((claim) => ({
          subjectType: "source_claim",
          subjectId: claim.id,
          updatedAt: claim.updatedAt,
          status: claim.status
        })),
        {
          subjectType: "memory_record",
          subjectId: memoryRecord.id,
          updatedAt: memoryRecord.updatedAt,
          status: memoryRecord.status,
          currentVersionId: memoryRecord.currentVersionId
        }
      ]
    }
  });
  await retrievalRepository.addCandidate({
    retrievalRunId: retrievalRun.id,
    kind: "memory",
    subjectType: "memory_record",
    subjectId: input.memoryRecordId,
    sourceAuthority: "project-decision",
    lexicalScore: 98,
    totalScore: 98,
    score: 98,
    status: "included",
    reason: "Persisted memory guidance is selected alongside unresolved contradictory source authority.",
    metadata: {
      ...smokeMetadata,
      memorySourceConflictProof: true,
      doesNotProve:
        "Memory selection does not override unresolved source conflict or prove source truth."
    }
  });
  await retrievalRepository.addCandidate({
    retrievalRunId: retrievalRun.id,
    kind: "source",
    subjectType: "source_claim",
    subjectId: governingClaim.id,
    sourceAuthority: "project-decision",
    lexicalScore: 100,
    totalScore: 100,
    score: 100,
    status: "included",
    reason: "Persisted source candidate has accepted decision support and unresolved accepted dissent.",
    metadata: {
      ...smokeMetadata,
      sourceClaimAuthority: {
        status: "caveated",
        reasons: ["accepted_with_dissenting_source_claims"]
      },
      sourceClaimEdgeInfluence: {
        edgeIds: [dissentingSourceClaimEdge.id],
        edgeKinds: ["contradicts"],
        seedSourceClaimIds: [dissentingClaim.id],
        doesNotProve:
          "This persisted relation makes accepted dissent reviewable; it does not resolve which claim is true."
      },
      sourceDecisionSupportBoost: {
        edges: [{
          sourceDecisionEdgeId: governingSourceDecisionEdge.id,
          sourceDecisionId: governingSourceDecision.id,
          targetType: "architecture_decision",
          targetId: governingDecisionId
        }],
        confidence: ["high"],
        supportTypes: ["decision"],
        doesNotProve:
          "Persisted decision support does not resolve the accepted source conflict."
      }
    }
  });
  await retrievalRepository.addCandidate({
    retrievalRunId: retrievalRun.id,
    kind: "source",
    subjectType: "source_claim",
    subjectId: dissentingClaim.id,
    sourceAuthority: "project-decision",
    lexicalScore: 99,
    totalScore: 99,
    score: 99,
    status: "included",
    reason: "Persisted source candidate is the accepted contradictory peer.",
    metadata: {
      ...smokeMetadata,
      sourceClaimAuthority: {
        status: "accepted",
        reasons: ["current_decision_linked_authority"]
      },
      sourceDecisionSupportBoost: {
        edges: [{
          sourceDecisionEdgeId: dissentingSourceDecisionEdge.id,
          sourceDecisionId: dissentingSourceDecision.id,
          targetType: "architecture_decision",
          targetId: governingDecisionId
        }],
        confidence: ["high"],
        supportTypes: ["decision"],
        doesNotProve:
          "Persisted decision support does not resolve the accepted source conflict."
      }
    }
  });
  await retrievalRepository.completeRetrievalRun({
    retrievalRunId: retrievalRun.id,
    status: "completed",
    completedAt: "2026-07-07T12:00:00.000Z",
    metadata: smokeMetadata
  });
  await issueDecisionPacket(harnessRunRepository, proofRun.id);
  const transportProof = await readOnlyDecisionPacketTransports({
    baseRuntime: input.baseRuntime,
    client: input.client,
    commandRuntime: input.commandRuntime,
    mcpId: "unresolved-source-dissent",
    runId: proofRun.id
  });
  const { mcpReadback, packet } = transportProof;
  const mcpPacket = mcpReadback.packet;
  const brief = await runCodexBriefCommand({
    ...input.baseRuntime,
    runId: proofRun.id,
    createDatabaseRuntime: async () => input.commandRuntime
  });
  const readOnlyUsefulnessRowsAfter = await countReadOnlyUsefulnessRows({
    client: input.client,
    executionRunId: proofRun.id
  });
  const unresolvedAcceptedDissentEvidenceGapId =
    `evidence-gap:${proofRun.id}:unresolved-accepted-source-dissent:${governingClaim.id}`;
  const mcpPreservesDissentAndGap = [
    mcpPacket.sourceClaimIds.includes(governingClaim.id),
    mcpPacket.sourceClaimIds.includes(dissentingClaim.id),
    mcpPacket.memoryRefs.includes(input.memoryRecordId),
    mcpPacket.sourceConsensus.conflictingSourceClaimIds.includes(governingClaim.id),
    mcpPacket.sourceConsensus.evidenceGapIds.includes(unresolvedAcceptedDissentEvidenceGapId),
    mcpPacket.abstentionScore.status === "abstain",
    mcpPacket.abstentionScore.reasons.includes("unresolved_accepted_source_dissent")
  ].every(Boolean);

  if (contextAssembly.metadata.retrievalRunId !== retrievalRun.id) {
    throw new Error("Persisted source dissent proof context assembly lost its retrieval run binding");
  }

  return {
    proofRunId: proofRun.id,
    retrievalRunId: retrievalRun.id,
    candidateClaimId: governingClaim.id,
    dissentingClaimId: dissentingClaim.id,
    candidateDecisionId: governingDecisionId,
    packetSourceClaimIds: packet.packet.sourceClaimIds,
    packetConflictingSourceClaimIds: packet.packet.sourceConsensus.conflictingSourceClaimIds,
    packetDecisionLinkedSourceClaimIds:
      packet.packet.sourceConsensus.decisionLinkedSourceClaimIds,
    packetMemoryRefs: packet.packet.memoryRefs,
    packetGoverningDecisionIds: packet.packet.governingDecisionIds,
    packetSourceDecisionEdgeIds: packet.packet.sourceDecisionEdgeIds,
    packetStatus: packet.packet.abstentionScore.status,
    packetReasons: packet.packet.abstentionScore.reasons,
    briefStopsExecution:
      packet.packet.abstentionScore.status === "abstain" &&
      brief.stdout.includes("Do not execute; the DecisionPacket abstains") &&
      !brief.stdout.includes("Stop Condition: Stop before Codex execution or hidden state mutation."),
    mcpPreservesDissentAndGap,
    mcpMessageUtf8Bytes: mcpReadback.messageUtf8Bytes,
    mcpStructuredContentMeasurement: mcpReadback.structuredContentMeasurement,
    readOnlyUsefulnessRowsBefore: transportProof.usefulnessRowsBefore,
    readOnlyUsefulnessRowsAfter,
    readOnlyUsefulnessUnchanged:
      transportProof.usefulnessRowsBefore === 0 &&
      readOnlyUsefulnessRowsAfter === transportProof.usefulnessRowsBefore
  };
};

const legacyMemoryApplicationsPacketStabilityProof = async (input: {
  readonly baseRuntime: {
    readonly cwd: string;
    readonly env: { readonly KRN_DATABASE_URL: string };
    readonly now: () => string;
    readonly createId: (prefix: string) => string;
  };
  readonly client: Sql;
  readonly commandRuntime: DatabaseRuntime;
  readonly marker: string;
  readonly memoryRepository: MemoryRepository;
  readonly retainedMemoryId: string;
  readonly staleMemoryId: string;
  readonly selectorPacket: ReturnType<typeof parseDecisionPacket>;
  readonly selectorExecutionRunId: string;
}): Promise<boolean> => {
  await input.client`
    insert into memory_applications (
      memory_record_id,
      execution_run_id,
      decision_packet_checksum,
      expected_use,
      outcome,
      notes,
      metadata
    ) values
      (
        ${input.retainedMemoryId},
        null,
        null,
        'Unbound legacy packet-selection falsifier.',
        'hurt',
        'This row has no packet identity and must remain historical.',
        ${JSON.stringify({ smokeId: input.marker, legacyPacketSelectionProbe: true })}::jsonb
      ),
      (
        ${input.staleMemoryId},
        null,
        null,
        'Unbound legacy packet-selection falsifier.',
        'helped',
        'This row has no packet identity and must remain historical.',
        ${JSON.stringify({ smokeId: input.marker, legacyPacketSelectionProbe: true })}::jsonb
      )
  `;

  const rebuildMemoryApplicationCounters = input.memoryRepository.rebuildMemoryApplicationCounters;
  if (rebuildMemoryApplicationCounters === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke requires memory application counter rebuild readback"
    );
  }
  await rebuildMemoryApplicationCounters.call(input.memoryRepository);
  const selectorPacketAfterLegacyRows = await readDecisionPacketForSmokeRun({
    baseRuntime: input.baseRuntime,
    commandRuntime: input.commandRuntime,
    runId: input.selectorExecutionRunId
  });

  return selectorPacketAfterLegacyRows.packetIdentity.checksum === input.selectorPacket.packetIdentity.checksum &&
    JSON.stringify(selectorPacketAfterLegacyRows.packet.memoryRefs) ===
      JSON.stringify(input.selectorPacket.packet.memoryRefs) &&
    JSON.stringify(selectorPacketAfterLegacyRows.readModel.context.exclusionDetails) ===
      JSON.stringify(input.selectorPacket.readModel.context.exclusionDetails);
};

const runSelectorFeedbackProof = async (
  input: {
    readonly baseRuntime: {
      readonly cwd: string;
      readonly env: { readonly KRN_DATABASE_URL: string };
      readonly now: () => string;
      readonly createId: (prefix: string) => string;
    };
    readonly client: Sql;
    readonly commandRuntime: DatabaseRuntime;
    readonly executionRunId: string;
    readonly feedbackDeltaId: string;
    readonly marker: string;
    readonly projectId: string;
    readonly repositories: {
      readonly harnessRunRepository: HarnessRunRepository & FeedbackDeltaLookupRepository;
      readonly memoryRepository: MemoryRepository;
      readonly sourceRepository: SourceRepository;
      readonly retrievalRepository: RetrievalRepository;
    };
    readonly workspaceId: string;
  }
): Promise<SelectorFeedbackProofResult> => {
  const {
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
  const evidenceMetadata = capturedCurrentEvidenceMetadata(
    input.marker,
    "selector-feedback"
  );
  const selectorSourceArtifact = await sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "run",
    uri: `operator://decision-packet-return-loop/${input.marker}/selector-feedback`,
    title: "DecisionPacket selector feedback smoke source",
    contentHash: `decision-packet-selector-feedback-${input.marker}`,
    sourceAuthority: "project-decision",
    metadata: {
      ...evidenceMetadata,
      selectorFeedbackProof: true
    }
  });
  const selectorSourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: selectorSourceArtifact.id,
    ordinal: 0,
    content: "Captured evidence for the DecisionPacket selector feedback smoke.",
    contentHash: `decision-packet-selector-feedback-chunk-${input.marker}`,
    metadata: {
      ...evidenceMetadata,
      selectorFeedbackProof: true
    }
  });
  const selectorSourceClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: selectorSourceArtifact.id,
    sourceChunkId: selectorSourceChunk.id,
    executionRunId: input.executionRunId,
    claim: "Store-backed memory usefulness feedback must affect the next DecisionPacket through activation selection.",
    mechanism:
      "Memory applications update MemoryRecord feedback counters; compileHarnessPlan retrieves those records and activation filters unresolved stale or hurt feedback before the DecisionPacket readback is rendered.",
    krnImplication:
      "A DecisionPacket consumer can see retained useful memory and demoted stale memory without using markdown or JSON ledgers as runtime truth.",
    doesNotProve:
      "This smoke does not prove broad ranking quality, live Codex obedience, or autonomous memory promotion.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "DecisionPacket return-loop smoke",
    falsifier:
      "The selector proof packet misses the retained neutral control or includes stale memory after governed feedback is recorded.",
    revisitWhen: "DecisionPacket feedback or activation selector contracts change.",
    status: "proposed",
    metadata: {
      ...evidenceMetadata,
      selectorFeedbackProof: true
    }
  });

  await sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: selectorSourceClaim.id,
    status: "adopt",
    decision:
      "Use store-backed memory feedback as the selector proof path for DecisionPacket return-loop smoke.",
    rationale:
      "The proof must exercise the same activation selector path that produces the next persisted context assembly.",
    falsifier:
      "A stale MemoryRecord with repeated stale feedback appears in the next DecisionPacket memory refs.",
    consumer: "DecisionPacket return-loop smoke",
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: true
    }
  });

  const selectorRetainedCandidate = await memoryRepository.createMemoryCandidate({
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    proposedBy: "decision-packet-return-loop-smoke",
    kind: "procedure",
    status: "candidate",
    summary: "DecisionPacket selector neutral control should remain eligible",
    body:
      "Use an eligible neutral control when proving stale feedback changes the next DecisionPacket selector.",
    owner: "kernel",
    confidence: 92,
    applicationGuidance:
      "Use when proving DecisionPacket selector feedback retention through compileHarnessPlan activation.",
    invalidationRule: "Revisit when DecisionPacket selector feedback semantics change.",
    sourceClaimIds: [selectorSourceClaim.id],
    sourceLineage: [{ sourceId: selectorSourceClaim.id }],
    isUserPreference: false,
    validFrom: "2026-07-07T12:00:00.000Z",
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "retained_control"
    }
  });
  const selectorRetainedMemory = await memoryRepository.promoteReviewedMemoryCandidate({
    candidateId: selectorRetainedCandidate.id,
    reviewer: "decision-packet-return-loop-smoke",
    decision: "accepted",
    recordKey: `decision-packet-return-loop:${input.marker}:retained-selector-memory`,
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "retained_control"
    }
  });
  const selectorStaleCandidate = await memoryRepository.createMemoryCandidate({
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    proposedBy: "decision-packet-return-loop-smoke",
    kind: "procedure",
    status: "candidate",
    summary: "DecisionPacket selector feedback stale memory should be demoted",
    body:
      "Do not retain this memory after repeated stale application feedback in the DecisionPacket selector proof.",
    owner: "kernel",
    confidence: 92,
    applicationGuidance:
      "This stale proof memory should be excluded by activation after repeated stale feedback.",
    invalidationRule: "Revisit when DecisionPacket selector feedback semantics change.",
    sourceClaimIds: [selectorSourceClaim.id],
    sourceLineage: [{ sourceId: selectorSourceClaim.id }],
    isUserPreference: false,
    validFrom: "2026-07-07T12:00:00.000Z",
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "stale"
    }
  });
  const selectorStaleMemory = await memoryRepository.promoteReviewedMemoryCandidate({
    candidateId: selectorStaleCandidate.id,
    reviewer: "decision-packet-return-loop-smoke",
    decision: "accepted",
    recordKey: `decision-packet-return-loop:${input.marker}:stale-selector-memory`,
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "stale"
    }
  });
  const selectorControlBinding = await selectMemoryApplicationAuthority({
    executionRunId: input.executionRunId,
    expectedUse: "Retain eligible selector feedback memory on the next packet.",
    harnessRunRepository,
    marker: input.marker,
    memoryRecord: selectorRetainedMemory,
    reason: "Select retained control memory before recording its application."
  });
  const selectorRetainedMemoryApplication = await memoryRepository
    .recordMemoryApplicationWithEffectsOnce({
    memoryRecordId: selectorRetainedMemory.id,
    executionRunId: selectorControlBinding.executionRunId,
    expectedUse: "Retain eligible DecisionPacket selector feedback memory on the next packet.",
    outcome: "neutral",
    notes: "Selected control memory remains eligible without fabricated positive feedback.",
    packetChecksum: selectorControlBinding.packetChecksum,
    packetGeneratedAt: selectorControlBinding.packetGeneratedAt,
    sourceRunLifecycleRevision: selectorControlBinding.sourceRunLifecycleRevision,
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "retained_control"
    }
  });
  const selectorStaleMemoryApplicationIds: string[] = [];

  for (const attempt of [1, 2, 3]) {
    const staleMemory = await memoryRepository.getMemoryRecordById(selectorStaleMemory.id);
    if (staleMemory === undefined) {
      throw new Error("DecisionPacket return-loop smoke lost stale selector memory");
    }
    const staleBinding = await selectMemoryApplicationAuthority({
      executionRunId: input.executionRunId,
      expectedUse: "Demote stale DecisionPacket selector feedback memory on the next packet.",
      harnessRunRepository,
      marker: input.marker,
      memoryRecord: staleMemory,
      reason: `Select stale feedback memory for application ${attempt}.`
    });
    const staleApplication = await memoryRepository.recordMemoryApplicationWithEffectsOnce({
      memoryRecordId: selectorStaleMemory.id,
      executionRunId: staleBinding.executionRunId,
      expectedUse: "Demote stale DecisionPacket selector feedback memory on the next packet.",
      outcome: "stale",
      notes: `Store-backed stale feedback ${attempt} should make this memory unsafe for next activation.`,
      packetChecksum: staleBinding.packetChecksum,
      packetGeneratedAt: staleBinding.packetGeneratedAt,
      sourceRunLifecycleRevision: staleBinding.sourceRunLifecycleRevision,
      metadata: {
        smokeId: input.marker,
        selectorFeedbackProof: "stale",
        attempt
      },
      negativeEffects: {
        outcome: "stale",
        eventType: "stale_detected",
        note: `Store-backed stale feedback ${attempt}.`,
        reason: "Selector memory was stale for the governed application.",
        metadata: {
          smokeId: input.marker,
          selectorFeedbackProof: "stale",
          attempt
        },
        candidate: {
          key: `decision-packet-return-loop:${input.marker}:stale:${attempt}`,
          rejectedClaim: staleMemory.summary,
          reason: "Selector memory was stale for the governed application.",
          invalidatedBySourceClaimIds: staleMemory.sourceLineage.map(
            (lineage) => lineage.sourceId
          ),
          appliesTo: staleMemory.key,
          summary: `Review stale selector feedback ${attempt}.`,
          body: "Stale application feedback remains reviewable and non-governing.",
          owner: staleMemory.owner,
          confidence: 70,
          sourceLineage: staleMemory.sourceLineage
        }
      }
    });

    selectorStaleMemoryApplicationIds.push(staleApplication.application.id);
  }

  const selectorStaleMemoryWithFeedback = await memoryRepository.getMemoryRecordById(
    selectorStaleMemory.id
  );

  if (selectorStaleMemoryWithFeedback === undefined) {
    throw new Error("DecisionPacket return-loop smoke lost stale selector memory after feedback");
  }

  const maintenancePreview = buildMemoryStalenessMaintenancePreview({
    now: "2026-07-07T12:00:00.000Z",
    memoryRecords: [selectorStaleMemoryWithFeedback],
    evidenceRef: input.feedbackDeltaId,
    maxCandidates: 1
  });
  const maintenanceCandidate = maintenancePreview.candidates.find((candidate) =>
    candidate.memoryRecordId === selectorStaleMemory.id &&
    candidate.reason === "unresolved_negative_feedback"
  );

  if (maintenanceCandidate === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke did not create an unresolved negative feedback maintenance candidate"
    );
  }

  const maintenanceProposal = await proposeMemoryConsolidation({
    memoryRepository,
    candidate: maintenanceCandidate,
    projectId: input.projectId,
    proposedBy: "decision-packet-return-loop-smoke",
    owner: "kernel",
    observedAt: "2026-07-07T12:00:00.000Z",
    executionRunId: input.executionRunId,
    feedbackDeltaId: input.feedbackDeltaId,
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "maintenance-consolidation"
    }
  });
  const maintenanceCandidateLinkedToFeedbackDelta =
    maintenanceProposal.antiMemoryCandidate.feedbackDeltaId === input.feedbackDeltaId &&
    maintenanceProposal.feedbackEvent.feedbackDeltaId === input.feedbackDeltaId;

  const selectorCompile = await compileHarnessPlan({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    operatorIntent: {
      rawIntent: `decision packet selector feedback proof ${input.marker}`,
      source: "cli",
      metadata: {
        smokeId: input.marker
      }
    },
    taskContract: {
      title: "Prove DecisionPacket selector feedback loop",
      objective:
        "Use DecisionPacket selector feedback memory to prove store-backed usefulness changes the next packet.",
      constraints: ["use store-backed memory feedback", "render a read-only DecisionPacket"],
      nonGoals: ["no markdown feedback ledger", "no worker daemon", "no live Codex"],
      acceptance: [
        "retained neutral control appears in the next DecisionPacket memory refs",
        "stale memory is excluded from the next DecisionPacket context"
      ],
      metadata: {
        smokeId: input.marker,
        selectorFeedbackProof: true
      }
    },
    tokenBudget: 360,
    metadata: {
      smokeId: input.marker,
      proof: "decision_packet_selector_feedback"
    }
  }, {
    harnessRunRepository,
    memoryRepository,
    sourceRepository: activationSourceRepositoryFor(sourceRepository),
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "selector")
  });
  const selectorExecutionRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: selectorCompile.harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "selector-feedback-proof",
      evidenceContract: selectorCompile.evidenceContract
    }
  });
  await issueDecisionPacket(harnessRunRepository, selectorExecutionRun.id);
  const selectorPacket = await readDecisionPacketForSmokeRun({
    baseRuntime: input.baseRuntime,
    commandRuntime: input.commandRuntime,
    runId: selectorExecutionRun.id
  });
  const includesRetainedMemory = selectorPacket.packet.memoryRefs.includes(
    selectorRetainedMemory.id
  );
  const excludesStaleMemory =
    !selectorPacket.packet.memoryRefs.includes(selectorStaleMemory.id) &&
    selectorPacket.readModel.context.exclusionDetails.some((exclusion) =>
      exclusion.subjectType === "memory_record" &&
      exclusion.subjectId === selectorStaleMemory.id &&
      exclusion.reason === "unsafe" &&
      exclusion.explanation.includes("unresolved_negative_feedback")
    );

  const legacyMemoryApplicationsPacketStable = await legacyMemoryApplicationsPacketStabilityProof({
    baseRuntime: input.baseRuntime,
    client: input.client,
    commandRuntime: input.commandRuntime,
    marker: input.marker,
    memoryRepository,
    retainedMemoryId: selectorRetainedMemory.id,
    selectorExecutionRunId: selectorExecutionRun.id,
    selectorPacket,
    staleMemoryId: selectorStaleMemory.id
  });

  return {
    proofRunId: selectorExecutionRun.id,
    retrievalRunId:
      typeof selectorCompile.contextAssembly.metadata.retrievalRunId === "string"
        ? selectorCompile.contextAssembly.metadata.retrievalRunId
        : undefined,
    retainedMemoryRecordId: selectorRetainedMemory.id,
    staleMemoryRecordId: selectorStaleMemory.id,
    retainedMemoryApplicationId: selectorRetainedMemoryApplication.application.id,
    staleMemoryApplicationIds: selectorStaleMemoryApplicationIds,
    packetMemoryRefs: selectorPacket.packet.memoryRefs,
    includesRetainedMemory,
    excludesStaleMemory,
    legacyMemoryApplicationsPacketStable,
    maintenanceCandidateId: maintenanceCandidate.id,
    maintenanceAntiMemoryCandidateId: maintenanceProposal.antiMemoryCandidate.id,
    maintenanceFeedbackEventId: maintenanceProposal.feedbackEvent.id,
    maintenanceCandidateLinkedToFeedbackDelta
  };
};

// fallow-ignore-next-line complexity -- this DB smoke intentionally sequences packet binding, evidence, feedback, maintenance, and selector readback falsifiers
export const runDecisionPacketReturnLoopSmokeCheck = async (
  input: DecisionPacketReturnLoopSmokeInput
): Promise<DecisionPacketReturnLoopSmokeReport> => {
  const { client, db, marker, projectSlug, task, workspaceSlug } =
    await createHarnessCompilerSmokeRuntime({
      databaseUrl: input.databaseUrl,
      migrationsFolder: input.migrationsFolder,
      smokeId: input.smokeId,
      smokeName: "decision packet return-loop smoke",
      workspacePrefix: "krn-decision-packet-smoke",
      projectSlug: "decision-packet-return-loop",
      taskPrefix: input.taskPrefix ?? "decision packet return loop smoke"
    });
  let retrievalRunId: string | undefined;
  let selectorRetrievalRunId: string | undefined;
  let standaloneAntiMemoryRetrievalRunId: string | undefined;
  let sourceConsensusRetrievalRunId: string | undefined;
  let sourceDissentRetrievalRunId: string | undefined;
  const feedbackDeltaIds: string[] = [];
  const maintenanceQueueIds: string[] = [];
  let cleanedUp = false;
  let retainedFixture = false;
  let helpedFeedbackSource: FeedbackSourceClaimProof | undefined;
  let retainedTrialSourceSeedProof: RetainedTrialSourceSeedProof | undefined;
  let staleFeedbackSource: FeedbackSourceClaimProof | undefined;
  const targetRepo = await createReturnLoopTargetRepo();
  await writeFile(
    path.join(targetRepo, returnLoopApplicationPath),
    "export const appliedDecision = true;\n"
  );

  const cleanup = async (): Promise<number> => {
    const proofRetrievalRunIds = [
      selectorRetrievalRunId,
      standaloneAntiMemoryRetrievalRunId,
      sourceConsensusRetrievalRunId,
      sourceDissentRetrievalRunId
    ].filter((id): id is string => id !== undefined);

    await deleteFeedbackOutboxRows({ client, feedbackDeltaIds });
    await client`
      delete from anti_memory_records
      where metadata->>'smokeId' = ${marker}
        and metadata->>'standaloneAntiMemoryProof' = 'true'
    `;
    await deleteSelectorProofRows({
      client,
      marker,
      retrievalRunIds: proofRetrievalRunIds
    });
    if (maintenanceQueueIds.length > 0) {
      await new DrizzleMaintenanceQueueRepository(db).cleanupTestMaintenanceQueues({
        maintenanceQueueIds
      });
    }

    const baseRemaining = await cleanupHarnessCompilerSmokeRows({
      db,
      feedbackDeltaId: undefined,
      marker,
      retrievalRunId,
      workspaceSlug
    });
    const feedbackOutboxRemaining = await countFeedbackOutboxRows({
      client,
      feedbackDeltaIds
    });
    const maintenanceQueueRemaining = maintenanceQueueIds.length === 0
      ? 0
      : (await client<{ count: number }[]>`
          select count(*)::int as count
          from maintenance_queue_records
          where id in ${client(maintenanceQueueIds)}
        `)[0]?.count ?? 0;
    const selectorProofRemaining = await countSelectorProofRows({
      client,
      marker,
      retrievalRunIds: proofRetrievalRunIds
    });

    return baseRemaining + feedbackOutboxRemaining + selectorProofRemaining + maintenanceQueueRemaining;
  };

  try {
    await cleanup();

    const {
      executionRun,
      harnessRunRepository,
      memoryRepository,
      project,
      result,
      retrievalRepository,
      retrievalRunId: compiledRetrievalRunId,
      sourceRepository,
      workspace
    } = await createCompiledSmokeExecution({
      acceptance: "bind headless decision packet feedback to packet checksum",
      command: "db:smoke:decision-packet-return-loop",
      db,
      marker,
      projectSlug,
      task,
      workspaceSlug,
      prepare: async ({ project, sourceRepository }) => {
        const evidenceMetadata = capturedCurrentEvidenceMetadata(
          marker,
          "feedback-source-claims"
        );
        const feedbackSourceArtifact = await sourceRepository.createSourceArtifact({
          projectId: project.id,
          kind: "run",
          uri: `operator://decision-packet-return-loop/${marker}/feedback-source-claims`,
          title: "DecisionPacket feedback source claim smoke source",
          contentHash: `decision-packet-feedback-source-claims-${marker}`,
          sourceAuthority: "project-decision",
          metadata: {
            ...evidenceMetadata,
            feedbackSourceClaims: true
          }
        });
        const feedbackSourceChunk = await sourceRepository.createSourceChunk({
          sourceArtifactId: feedbackSourceArtifact.id,
          ordinal: 0,
          content: "Captured evidence for the DecisionPacket feedback source claims smoke.",
          contentHash: `decision-packet-feedback-source-claims-chunk-${marker}`,
          metadata: {
            ...evidenceMetadata,
            feedbackSourceClaims: true
          }
        });
        helpedFeedbackSource = await createFeedbackSourceClaim({
          marker,
          projectId: project.id,
          sourceArtifactId: feedbackSourceArtifact.id,
          sourceChunkId: feedbackSourceChunk.id,
          sourceRepository,
          proof: "helped"
        });
        staleFeedbackSource = await createFeedbackSourceClaim({
          marker,
          projectId: project.id,
          sourceArtifactId: feedbackSourceArtifact.id,
          sourceChunkId: feedbackSourceChunk.id,
          sourceRepository,
          proof: "stale"
        });
        if (input.retainedTrialSourceSeed !== undefined) {
          retainedTrialSourceSeedProof = await createRetainedTrialSourceDecisionSeed({
            marker,
            projectId: project.id,
            seed: input.retainedTrialSourceSeed,
            sourceRepository
          });
        }
      }
    });
    retrievalRunId = compiledRetrievalRunId;
    // Compiler defaults are broad pnpm checks this smoke does not execute; persist
    // the smoke-only contract for the genuine in-process return-channel checkpoint.
    const returnLoopEvidenceContract = {
      ...result.evidenceContract,
      commands: [{ command: returnChannelCheckpointCommand, required: true }]
    };
    const harnessPlanMetadata = JSON.stringify({
      ...result.harnessPlan.metadata,
      evidenceContract: returnLoopEvidenceContract
    });
    await client`
      update harness_plans
      set metadata = ${harnessPlanMetadata}::jsonb
      where id = ${result.harnessPlan.id}
    `;

    const maintenanceQueueRepository = new DrizzleMaintenanceQueueRepository(db);
    const commandRuntime = createSmokeCommandRuntime({
      compilerDependencies: {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository,
        now: () => "2026-07-07T12:00:00.000Z",
        createId: (prefix) => `${prefix}-${marker}`
      },
      marker,
      projectId: project.id,
      repositories: {
        harnessRunRepository,
        maintenanceQueueRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository
      },
      workspaceId: workspace.id
    });
    const baseRuntime = {
      env: {
        KRN_DATABASE_URL: input.databaseUrl
      },
      cwd: process.cwd(),
      now: () => "2026-07-07T12:00:00.000Z",
      createId: (prefix: string) => `${prefix}-${marker}`
    };
    await issueDecisionPacket(harnessRunRepository, executionRun.id);
    const firstPacket = await readDecisionPacketForSmokeRun({
      baseRuntime,
      commandRuntime,
      runId: executionRun.id
    });
    if (helpedFeedbackSource === undefined || staleFeedbackSource === undefined) {
      throw new Error("DecisionPacket return-loop smoke did not prepare canonical feedback source claims");
    }
    const retainedTrialSourceSeedReadback = retainedTrialSourceSeedProof === undefined
      ? undefined
      : retainedTrialSourceDecisionSeedReadbackFor({
          packet: firstPacket.packet,
          proof: retainedTrialSourceSeedProof
        });
    if (input.retainFixture === true) {
      const rejectedArtifact = await sourceRepository.createSourceArtifact({
        projectId: project.id,
        kind: "run",
        uri: `operator://decision-packet-return-loop/${marker}/retained-trial-rejected-path`,
        title: "Retained paired-trial rejected path",
        contentHash: `decision-packet-retained-trial-rejected-path-${marker}`,
        sourceAuthority: "project-decision",
        metadata: {
          smokeId: marker,
          retainedTrialRejectedPath: true
        }
      });
      const rejectedChunk = await sourceRepository.createSourceChunk({
        sourceArtifactId: rejectedArtifact.id,
        ordinal: 0,
        content: "A deliberately rejected alternative path for the retained paired trial.",
        contentHash: `decision-packet-retained-trial-rejected-path-chunk-${marker}`,
        metadata: {
          smokeId: marker,
          retainedTrialRejectedPath: true
        }
      });
      const rejectedClaim = await sourceRepository.createSourceClaim({
        sourceArtifactId: rejectedArtifact.id,
        sourceChunkId: rejectedChunk.id,
        executionRunId: executionRun.id,
        claim: "The deliberately rejected alternative path should not govern this trial.",
        mechanism: "The retained trial must preserve a rejected path as non-governing evidence.",
        krnImplication: "KRN should expose rejected context without selecting it as current guidance.",
        doesNotProve: "This fixture does not prove source truth or trial outcome.",
        sourceAuthority: "project-decision",
        supportType: "decision",
        consumer: "retained paired Codex trial",
        falsifier: "The rejected path becomes a governing DecisionPacket decision.",
        metadata: {
          smokeId: marker,
          retainedTrialRejectedPath: true
        }
      });
      await sourceRepository.createSourceDecision({
        projectId: project.id,
        sourceClaimId: rejectedClaim.id,
        status: "reject",
        decision: "Reject the deliberately unsupported alternative path.",
        rationale: "The paired trial requires an explicit rejected path to remain non-governing evidence.",
        falsifier: "The rejected alternative is selected as current DecisionPacket guidance.",
        consumer: "retained paired Codex trial",
        metadata: {
          smokeId: marker,
          retainedTrialRejectedPath: true
        }
      });
      await sourceRepository.createSourceRejection({
        projectId: project.id,
        executionRunId: executionRun.id,
        sourceArtifactId: rejectedArtifact.id,
        sourceClaimId: rejectedClaim.id,
        title: "Retained paired-trial rejected path",
        attemptedClaim: rejectedClaim.claim,
        rejectedBecause: "unsupported",
        reason: "The path is seeded solely to make rejection handling observable in the paired trial.",
        doesNotProve: "This fixture does not prove source-review quality.",
        consumer: "retained paired Codex trial",
        metadata: {
          smokeId: marker,
          retainedTrialRejectedPath: true
        }
      });
    }
    const unseenDecisionId = `source-decision-unseen:${marker}`;
    const packetSelectedCanonicalDecisions =
      firstPacket.packet.sourceDecisionIds.includes(helpedFeedbackSource.decisionId) &&
      firstPacket.packet.sourceDecisionIds.includes(staleFeedbackSource.decisionId);
    const returnChannelHasChecksum =
      firstPacket.returnChannels.evidence.persistedCommand.includes(firstPacket.packetIdentity.checksum) &&
      firstPacket.returnChannels.feedback.sourceDecisionUsefulnessExample.includes(
        "decision:<id>=selected"
      ) && packetSelectedCanonicalDecisions;

    if (!returnChannelHasChecksum) {
      throw new Error("DecisionPacket return-loop checkpoint did not bind the return channel");
    }

    const matchingApplicationId = `decision-packet-return-loop:${marker}:source-application`;
    const matchingDecisionApplicationId =
      `decision-packet-return-loop:${marker}:source-decision-application`;
    const returnLoopTargetEvidence = {
      targetRepo,
      mode: "headless-repair",
      dirtyBefore: "clean",
      dirtyAfter: "dirty",
      ownedChanges: "owned-by-current-krn-run",
      targetStatusFreshness: "fresh-current-task",
      changedFiles: [{
        status: "M",
        path: returnLoopApplicationPath,
        ownership: "owned-by-current-krn-run"
      }],
      commands: [returnChannelCheckpointCommand]
    } as const;
    const applicationEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: firstPacket.packetIdentity.checksum,
      decisionPacketGeneratedAt: firstPacket.packetIdentity.generatedAt,
      targetEvidence: returnLoopTargetEvidence,
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          applicationId: matchingApplicationId,
          claimId: helpedFeedbackSource.claimId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "selected",
          reason: "Record selected source application before running the return-channel checkpoint."
        }),
        sourceUsefulnessOutcome({
          applicationId: matchingDecisionApplicationId,
          decisionId: helpedFeedbackSource.decisionId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "selected",
          reason:
            "Record selected canonical SourceDecision application before running the return-channel checkpoint."
        })
      ],
      readGitStatus: async () => "",
      createDatabaseRuntime: async () => commandRuntime
    });
    const applicationFeedbackDeltaId = persistedFeedbackDeltaIdOrThrow(
      applicationEvidence.stdout,
      "DecisionPacket return-loop smoke application capture missed persisted feedback delta id"
    );
    const matchingApplication = persistedUsefulnessApplicationOrThrow(
      applicationEvidence.stdout,
      matchingApplicationId
    );
    const matchingDecisionApplication = persistedUsefulnessApplicationOrThrow(
      applicationEvidence.stdout,
      matchingDecisionApplicationId
    );
    feedbackDeltaIds.push(applicationFeedbackDeltaId);

    const checkpointStartedAt = new Date(
      Math.max(
        Date.now(),
        Date.parse(matchingApplication.appliedAt) + 1,
        Date.parse(matchingDecisionApplication.appliedAt) + 1
      )
    ).toISOString();
    const checkpointCompletedAt = new Date(Date.parse(checkpointStartedAt) + 1).toISOString();
    const checkpointArtifact = createCommandOutputArtifact({
      command: returnChannelCheckpointCommand,
      exitCode: 0,
      startedAt: checkpointStartedAt,
      completedAt: checkpointCompletedAt,
      stdout: new TextEncoder().encode(JSON.stringify({
        packetChecksum: firstPacket.packetIdentity.checksum,
        packetEvidenceRef: firstPacket.packetIdentity.evidenceRef,
        returnChannelHasChecksum
      })),
      stderr: new Uint8Array()
    }, commandOutputArtifactSha256Hex);

    const matchingEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: firstPacket.packetIdentity.checksum,
      decisionPacketGeneratedAt: firstPacket.packetIdentity.generatedAt,
      commandOutcomes: [{
        command: checkpointArtifact.command,
        status: "passed",
        provenance: "command_runner",
        exitCode: checkpointArtifact.exitCode,
        capturedAt: checkpointArtifact.completedAt,
        outputRef: checkpointArtifact.outputRef
      }],
      commandOutputArtifacts: [checkpointArtifact],
      targetEvidence: returnLoopTargetEvidence,
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          applicationId: matchingApplication.applicationId,
          appliedAt: matchingApplication.appliedAt,
          claimId: helpedFeedbackSource.claimId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          evidenceRefs: [
            firstPacket.packetIdentity.evidenceRef,
            returnLoopApplicationPath,
            checkpointArtifact.command,
            checkpointArtifact.outputRef
          ],
          outcome: "helped",
          reason: "Matching packet checksum kept selected source claim feedback bound to the packet."
        }),
        sourceUsefulnessOutcome({
          applicationId: matchingDecisionApplication.applicationId,
          appliedAt: matchingDecisionApplication.appliedAt,
          decisionId: helpedFeedbackSource.decisionId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          evidenceRefs: [
            firstPacket.packetIdentity.evidenceRef,
            returnLoopApplicationPath,
            checkpointArtifact.command,
            checkpointArtifact.outputRef
          ],
          outcome: "helped",
          reason:
            "Matching packet checksum kept selected canonical SourceDecision feedback bound to the packet."
        })
      ],
      readGitStatus: async () => "",
      createDatabaseRuntime: async () => commandRuntime
    });
    const aggregateAfterMatching =
      await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);
    const matchingFeedbackDelta = feedbackDeltaByIdOrThrow(
      aggregateAfterMatching,
      persistedFeedbackDeltaIdOrThrow(
        matchingEvidence.stdout,
        "DecisionPacket return-loop smoke matching capture missed persisted feedback delta id"
      ),
      "DecisionPacket return-loop smoke did not persist matching feedback"
    );

    feedbackDeltaIds.push(matchingFeedbackDelta.id);

    const matchingFeedbackOutcome = feedbackOutcome(matchingFeedbackDelta.metadata);
    const matchingSourceDecisionHelpedOutcomeCount = sourceDecisionOutcomeCount(
      matchingFeedbackDelta.metadata,
      helpedFeedbackSource.decisionId,
      "helped"
    );
    const matchingSourceDecisionApplicationCount = (await client<{ count: number }[]>`
      select count(*)::int as count
      from usefulness_applications
      where execution_run_id = ${executionRun.id}
        and subject_kind = 'source_decision'::usefulness_application_subject_kind
        and subject_id = ${helpedFeedbackSource.decisionId}
        and packet_checksum = ${firstPacket.packetIdentity.checksum}
    `)[0]?.count ?? 0;
    const matchingFeedbackWasAccepted =
      matchingFeedbackOutcome === "helped" &&
      matchingSourceDecisionHelpedOutcomeCount === 1 &&
      matchingSourceDecisionApplicationCount === 1 &&
      matchingEvidence.stdout.includes(`decisionPacketEvidenceRef: ${firstPacket.packetIdentity.evidenceRef}`);
    const packetAfterMatching = await readDecisionPacketForSmokeRun({
      baseRuntime,
      commandRuntime,
      runId: executionRun.id
    });
    const staleEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: packetAfterMatching.packetIdentity.checksum,
      decisionPacketGeneratedAt: packetAfterMatching.packetIdentity.generatedAt,
      commandOutcomes: [{
        command: "pnpm --filter @krn/cli test -- decision-packet-stale-feedback",
        status: "passed",
        provenance: "operator_reported"
      }],
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          claimId: staleFeedbackSource.claimId,
          evidenceRef: packetAfterMatching.packetIdentity.evidenceRef,
          outcome: "stale",
          reason: "Matching packet checksum kept stale source claim feedback reviewable."
        })
      ],
      readGitStatus: async () => "",
      createDatabaseRuntime: async () => commandRuntime
    });
    const aggregateAfterStale =
      await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);
    const staleFeedbackDelta = feedbackDeltaByIdOrThrow(
      aggregateAfterStale,
      persistedFeedbackDeltaIdOrThrow(
        staleEvidence.stdout,
        "DecisionPacket return-loop smoke stale capture missed persisted feedback delta id"
      ),
      "DecisionPacket return-loop smoke did not persist stale feedback"
    );

    feedbackDeltaIds.push(staleFeedbackDelta.id);

    const staleFeedbackOutcome = feedbackOutcome(staleFeedbackDelta.metadata);
    const staleFeedbackBoundToPacket =
      staleFeedbackOutcome === "stale" &&
      staleEvidence.stdout.includes(`decisionPacketEvidenceRef: ${packetAfterMatching.packetIdentity.evidenceRef}`);
    const mismatchedChecksum = "0".repeat(64);
    const mismatchedEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: mismatchedChecksum,
      decisionPacketGeneratedAt: firstPacket.packetIdentity.generatedAt,
      commandOutcomes: [{
        command: "pnpm --filter @krn/cli test -- mismatched-decision-packet",
        status: "passed",
        provenance: "operator_reported"
      }],
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          decisionId: unseenDecisionId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "helped",
          reason: "Unseen source decision feedback must not mint governing authority."
        })
      ],
      readGitStatus: async () => "",
      createDatabaseRuntime: async () => commandRuntime
    });
    const aggregateAfterMismatch =
      await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);
    const mismatchedFeedbackDelta = feedbackDeltaByIdOrThrow(
      aggregateAfterMismatch,
      persistedFeedbackDeltaIdOrThrow(
        mismatchedEvidence.stdout,
        "DecisionPacket return-loop smoke mismatched capture missed persisted feedback delta id"
      ),
      "DecisionPacket return-loop smoke did not persist mismatched feedback"
    );

    feedbackDeltaIds.push(mismatchedFeedbackDelta.id);

    const mismatchedFeedbackOutcome = feedbackOutcome(mismatchedFeedbackDelta.metadata);
    const mismatchedFeedbackStripped =
      mismatchedFeedbackOutcome === undefined &&
      decisionPacketBindingReadbackFromMetadata(mismatchedFeedbackDelta.metadata).status ===
        "unbound";
    const issuedPacketReadback = await readDecisionPacketForSmokeRun({
      baseRuntime,
      commandRuntime,
      runId: executionRun.id
    });
    const issuedPacketRetainsActivatedDecision =
      issuedPacketReadback.packet.governingDecisionIds.includes(
        helpedFeedbackSource.decisionTargetId
      ) &&
      issuedPacketReadback.packet.governingDecisionIds.includes(
        staleFeedbackSource.decisionTargetId
      );
    const issuedPacketCaveatedSourceClaimIds =
      issuedPacketReadback.packet.sourceConsensus.caveatedSourceClaimIds;
    const issuedPacketIdentityRetained =
      issuedPacketReadback.packetIdentity.checksum === firstPacket.packetIdentity.checksum &&
      issuedPacketReadback.packetIdentity.generatedAt === firstPacket.packetIdentity.generatedAt &&
      issuedPacketReadback.packetIdentity.sourceRunLifecycleRevision ===
        firstPacket.packetIdentity.sourceRunLifecycleRevision;
    const staleFeedbackStayedDiagnostic =
      staleFeedbackOutcome === "stale" &&
      issuedPacketIdentityRetained &&
      !issuedPacketCaveatedSourceClaimIds.includes(staleFeedbackSource.claimId) &&
      issuedPacketReadback.packet.governingDecisionIds.includes(
        staleFeedbackSource.decisionTargetId
      );
    const mismatchedFeedbackStayedOutOfIssuedPacket =
      !issuedPacketReadback.packet.governingDecisionIds.includes(unseenDecisionId) &&
      !issuedPacketReadback.packet.staleDecisionIds.includes(unseenDecisionId);
    const matchingFeedbackStayedDiagnostic =
      matchingFeedbackWasAccepted &&
      issuedPacketIdentityRetained &&
      issuedPacketRetainsActivatedDecision &&
      !issuedPacketReadback.packet.governingDecisionIds.includes(helpedFeedbackSource.claimId);

    await client`
      insert into feedback_deltas (
        review_assessment_id,
        status,
        memory_candidates,
        source_decisions,
        eval_candidates,
        metadata,
        created_at,
        updated_at
      )
      select
        ${staleFeedbackDelta.reviewAssessmentId}::uuid,
        'candidate'::feedback_delta_status,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        jsonb_build_object(
          'smokeId', ${marker}::text,
          'knowledgeUsefulnessOutcomes', jsonb_build_array(
            jsonb_build_object(
              'knowledgeId', 'knowledge:maintenance-delay-' || newer.index::text,
              'outcome', 'helped',
              'reason', 'Unrelated newer feedback must not hide the queued delta.',
              'evidenceRefs', jsonb_build_array('smoke:maintenance-delay'),
              'doesNotProve', 'This row does not prove broad usefulness ranking quality.'
            )
          )
        ),
        now(),
        now()
      from generate_series(1, 501) as newer(index)
    `;
    const feedbackMaintenanceProof = await runFeedbackMaintenanceProof({
      client,
      marker,
      projectId: project.id,
      feedbackDelta: staleFeedbackDelta,
      repositories: {
        maintenanceQueueRepository,
        harnessRunRepository,
        memoryRepository,
        sourceRepository
      }
    });

    maintenanceQueueIds.push(feedbackMaintenanceProof.queueRecordId);

    const selectorProof = await runSelectorFeedbackProof({
      baseRuntime,
      client,
      commandRuntime,
      executionRunId: executionRun.id,
      feedbackDeltaId: staleFeedbackDelta.id,
      marker,
      projectId: project.id,
      repositories: {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository
      },
      workspaceId: workspace.id
    });
    selectorRetrievalRunId = selectorProof.retrievalRunId;
    const sourceConsensusProof = await runSourceConsensusProof({
      baseRuntime,
      commandRuntime,
      executionRunId: executionRun.id,
      marker,
      projectId: project.id,
      repositories: {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository
      },
      workspaceId: workspace.id
    });
    sourceConsensusRetrievalRunId = sourceConsensusProof.retrievalRunId;
    const sourceDissentProof = await runUnresolvedAcceptedSourceDissentProof({
      baseRuntime,
      client,
      commandRuntime,
      executionRunId: executionRun.id,
      marker,
      memoryRecordId: selectorProof.retainedMemoryRecordId,
      projectId: project.id,
      repositories: {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository
      },
      workspaceId: workspace.id
    });
    sourceDissentRetrievalRunId = sourceDissentProof.retrievalRunId;
    const standaloneAntiMemoryProof = await runStandaloneAntiMemoryProof({
      baseRuntime,
      client,
      commandRuntime,
      executionRunId: executionRun.id,
      marker,
      projectId: project.id,
      repositories: {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository
      },
      workspaceId: workspace.id
    });
    standaloneAntiMemoryRetrievalRunId = standaloneAntiMemoryProof.retrievalRunId;
    const feedbackMaintenanceGovernedProof = await runFeedbackMaintenanceGovernedProof({
      baseRuntime,
      candidateId: feedbackMaintenanceProof.antiMemoryCandidateId,
      commandRuntime,
      evidenceReviewedRef: `feedback_delta:${staleFeedbackDelta.id}`,
      marker,
      projectId: project.id,
      sourceClaimId: staleFeedbackSource.claimId,
      repositories: {
        harnessRunRepository,
        memoryRepository,
        retrievalRepository,
        sourceRepository
      },
      workspaceId: workspace.id
    });

    assertReturnLoopChecks([
      { label: "return channel checksum binding", passed: returnChannelHasChecksum },
      { label: "matching feedback accepted as bounded signal", passed: matchingFeedbackStayedDiagnostic },
      {
        label: "selected canonical SourceDecision records exactly one application and helped outcome",
        passed:
          matchingSourceDecisionApplicationCount === 1 &&
          matchingSourceDecisionHelpedOutcomeCount === 1,
        detail:
          `sourceDecisionId=${helpedFeedbackSource.decisionId}; ` +
          `applicationCount=${matchingSourceDecisionApplicationCount}; ` +
          `helpedOutcomeCount=${matchingSourceDecisionHelpedOutcomeCount}`
      },
      { label: "stale feedback packet binding", passed: staleFeedbackBoundToPacket },
      { label: "stale feedback stayed diagnostic", passed: staleFeedbackStayedDiagnostic },
      { label: "mismatched feedback stripped", passed: mismatchedFeedbackStripped },
      { label: "mismatched feedback excluded", passed: mismatchedFeedbackStayedOutOfIssuedPacket },
      { label: "issued packet retains activated decisions", passed: issuedPacketRetainsActivatedDecision },
      { label: "issued packet identity retained", passed: issuedPacketIdentityRetained },
      ...(retainedTrialSourceSeedProof === undefined ||
        retainedTrialSourceSeedReadback === undefined
        ? []
        : [{
            label: "retained trial source seed current decisions selected",
            passed:
              retainedTrialSourceSeedReadback.packetGoverningDecisionIds.length ===
                retainedTrialSourceSeedProof.currentDecisions.length &&
              retainedTrialSourceSeedReadback.packetSourceDecisionIds.length ===
                retainedTrialSourceSeedProof.currentDecisions.length,
            detail:
              `family=${retainedTrialSourceSeedProof.family}; ` +
              `governingDecisionIds=${retainedTrialSourceSeedReadback.packetGoverningDecisionIds.join(",")}; ` +
              `sourceDecisionIds=${retainedTrialSourceSeedReadback.packetSourceDecisionIds.join(",")}`
          }, {
            label: "retained trial source seed stale decisions stay superseded",
            passed:
              retainedTrialSourceSeedReadback.packetSupersededPathIds.length ===
                retainedTrialSourceSeedProof.staleDecisions.length,
            detail:
              `family=${retainedTrialSourceSeedProof.family}; ` +
              `supersededPathIds=${retainedTrialSourceSeedReadback.packetSupersededPathIds.join(",")}`
          }, {
            label: "retained trial source seed rejected decisions have formal source rejection",
            passed:
              retainedTrialSourceSeedReadback.packetSourceRejectionIds.length ===
                retainedTrialSourceSeedProof.rejectedDecisions.length,
            detail:
              `family=${retainedTrialSourceSeedProof.family}; ` +
              `rejectedPathIds=${retainedTrialSourceSeedReadback.packetRejectedPathIds.join(",")}; ` +
              `sourceRejectionIds=${retainedTrialSourceSeedReadback.packetSourceRejectionIds.join(",")}`
          }]),
      {
        label: "selector packet includes retained neutral control memory",
        passed: selectorProof.includesRetainedMemory
      },
      { label: "selector packet excludes stale memory", passed: selectorProof.excludesStaleMemory },
      {
        label: "unbound legacy memory applications cannot alter DecisionPacket selection",
        passed: selectorProof.legacyMemoryApplicationsPacketStable
      },
      {
        label: "feedback maintenance queue succeeded",
        passed: feedbackMaintenanceProof.queueStatus === "succeeded"
      },
      {
        label: "feedback maintenance handler boundary passed",
        passed: feedbackMaintenanceProof.handlerBoundaryPassed
      },
      {
        label: "feedback maintenance anti-memory candidate linked to feedback delta",
        passed: feedbackMaintenanceProof.candidateLinkedToFeedbackDelta
      },
      {
        label: "reviewed feedback maintenance transition governs the next selection",
        passed: feedbackMaintenanceGovernedProof.reviewedTransitionGoverned,
        detail:
          `antiMemoryRecordId=${feedbackMaintenanceGovernedProof.antiMemoryRecordId}; ` +
          `sourceClaimId=${staleFeedbackSource.claimId}; ` +
          `packetSourceClaimIds=${feedbackMaintenanceGovernedProof.packetSourceClaimIds.join(",")}; ` +
          `packetRejectedPathIds=${feedbackMaintenanceGovernedProof.packetRejectedPathIds.join(",")}`
      },
      {
        label: "feedback maintenance exact replay is idempotent",
        passed: feedbackMaintenanceProof.exactReplayIdempotent
      },
      {
        label: "feedback maintenance did not directly mutate durable truth",
        passed: feedbackMaintenanceProof.directMutationDelta === 0
      },
      {
        label: "selector maintenance candidate linked to feedback delta",
        passed: selectorProof.maintenanceCandidateLinkedToFeedbackDelta
      },
      {
        label: "source consensus current claim governed",
        passed: sourceConsensusProof.currentClaimGoverned,
        detail:
          `sourceClaimIds=${sourceConsensusProof.packetSourceClaimIds.join(",")}; ` +
          `decisionEdgeIds=${sourceConsensusProof.packetSourceDecisionEdgeIds.join(",")}`
      },
      {
        label: "standalone anti-memory persists as exactly one non-governing exclusion",
        passed:
          standaloneAntiMemoryProof.candidateCount === 1 &&
          standaloneAntiMemoryProof.excludedDecisionCount === 1 &&
          standaloneAntiMemoryProof.contextExclusionCount === 1 &&
          standaloneAntiMemoryProof.cliPreserved &&
          standaloneAntiMemoryProof.mcpPreserved &&
          standaloneAntiMemoryProof.usefulnessRowDelta === 0,
        detail:
          `antiMemoryRecordId=${standaloneAntiMemoryProof.antiMemoryRecordId}; ` +
          `candidateCount=${standaloneAntiMemoryProof.candidateCount}; ` +
          `excludedDecisionCount=${standaloneAntiMemoryProof.excludedDecisionCount}; ` +
          `contextExclusionCount=${standaloneAntiMemoryProof.contextExclusionCount}; ` +
          `rejectedPathIds=${standaloneAntiMemoryProof.packetRejectedPathIds.join(",")}; ` +
          `cliPreserved=${standaloneAntiMemoryProof.cliPreserved}; ` +
          `mcpPreserved=${standaloneAntiMemoryProof.mcpPreserved}; ` +
          `usefulnessRowDelta=${standaloneAntiMemoryProof.usefulnessRowDelta}`
      },
      {
        label: "source consensus without formal rejection stays non-ready and explicit",
        passed: sourceConsensusProof.noFormalRejectionKeepsTypedState,
        detail:
          `runId=${sourceConsensusProof.noFormalRejectionRunId}; ` +
          `status=${sourceConsensusProof.noFormalRejectionStatus}; ` +
          `reasons=${sourceConsensusProof.noFormalRejectionReasons.join(",")}; ` +
          `governingDecisionIds=${sourceConsensusProof.noFormalRejectionGoverningDecisionIds.join(",")}; ` +
          `contextExclusions=${sourceConsensusProof.noFormalRejectionContextExclusions.map((exclusion) =>
            `${exclusion.subjectType}:${exclusion.subjectId}:${exclusion.reason}`
          ).join(",")}; ` +
          `rejectedPathIds=${sourceConsensusProof.noFormalRejectionRejectedPathIds.join(",")}; ` +
          `sourceRejectionIds=${sourceConsensusProof.noFormalRejectionSourceRejectionIds.join(",")}`
      },
      {
        label: "source consensus superseded claim stays non-governing",
        passed: sourceConsensusProof.supersededClaimIsNonGoverning,
        detail:
          `sourceClaimIds=${sourceConsensusProof.packetSourceClaimIds.join(",")}; ` +
          `rejectedPathIds=${sourceConsensusProof.packetRejectedPathIds.join(",")}; ` +
          `supersededPathIds=${sourceConsensusProof.packetSupersededPathIds.join(",")}`
      },
      {
        label: "source consensus rejected claim has formal rejection",
        passed: sourceConsensusProof.rejectedClaimHasFormalRejection,
        detail:
          `sourceClaimIds=${sourceConsensusProof.packetSourceClaimIds.join(",")}; ` +
          `rejectedPathIds=${sourceConsensusProof.packetRejectedPathIds.join(",")}; ` +
          `sourceRejectionIds=${sourceConsensusProof.packetSourceRejectionIds.join(",")}`
      },
      {
        label: "source consensus temporal explanation binds transition and evidence",
        passed:
          sourceConsensusProof.temporalExplanationPresent &&
          sourceConsensusProof.temporalExplanationHasEvidence,
        detail:
          `present=${sourceConsensusProof.temporalExplanationPresent}; ` +
          `hasEvidence=${sourceConsensusProof.temporalExplanationHasEvidence}`
      },
      {
        label: "unsupported source relation stays non-governing in DB activation",
        passed:
          sourceConsensusProof.unsupportedRelationStayedCurrent &&
          sourceConsensusProof.unsupportedRelationVisibleAsGap,
        detail:
          `claimId=${sourceConsensusProof.unsupportedRelationClaimId}; ` +
          `edgeId=${sourceConsensusProof.unsupportedRelationEdgeId}; ` +
          `stayedCurrent=${sourceConsensusProof.unsupportedRelationStayedCurrent}; ` +
          `visibleAsGap=${sourceConsensusProof.unsupportedRelationVisibleAsGap}`
      },
      {
        label: "selected memory plus unresolved source dissent abstains without governing guidance",
        passed:
          sourceDissentProof.packetStatus === "abstain" &&
          sourceDissentProof.packetReasons.includes("conflicting_authority") &&
          sourceDissentProof.packetReasons.includes("unresolved_accepted_source_dissent") &&
          sourceDissentProof.packetSourceClaimIds.includes(sourceDissentProof.candidateClaimId) &&
          sourceDissentProof.packetSourceClaimIds.includes(sourceDissentProof.dissentingClaimId) &&
          sourceDissentProof.packetMemoryRefs.includes(selectorProof.retainedMemoryRecordId) &&
          sourceDissentProof.packetConflictingSourceClaimIds.includes(
            sourceDissentProof.candidateClaimId
          ) &&
          sourceDissentProof.packetDecisionLinkedSourceClaimIds.length === 0 &&
          sourceDissentProof.packetGoverningDecisionIds.length === 0 &&
          sourceDissentProof.packetSourceDecisionEdgeIds.length === 0 &&
          sourceDissentProof.briefStopsExecution,
        detail:
          `runId=${sourceDissentProof.proofRunId}; ` +
          `status=${sourceDissentProof.packetStatus}; ` +
          `reasons=${sourceDissentProof.packetReasons.join(",")}; ` +
          `candidateClaimId=${sourceDissentProof.candidateClaimId}; ` +
          `dissentingClaimId=${sourceDissentProof.dissentingClaimId}; ` +
          `sourceClaimIds=${sourceDissentProof.packetSourceClaimIds.join(",")}; ` +
          `memoryRefs=${sourceDissentProof.packetMemoryRefs.join(",")}; ` +
          `conflictingSourceClaimIds=${sourceDissentProof.packetConflictingSourceClaimIds.join(",")}; ` +
          `decisionLinkedSourceClaimIds=${sourceDissentProof.packetDecisionLinkedSourceClaimIds.join(",")}; ` +
          `governingDecisionIds=${sourceDissentProof.packetGoverningDecisionIds.join(",")}; ` +
          `sourceDecisionEdgeIds=${sourceDissentProof.packetSourceDecisionEdgeIds.join(",")}; ` +
          `briefStopsExecution=${sourceDissentProof.briefStopsExecution}`
      },
      {
        label: "unresolved accepted source dissent survives read-only MCP transport",
        passed: sourceDissentProof.mcpPreservesDissentAndGap,
        detail:
          `candidateClaimId=${sourceDissentProof.candidateClaimId}; ` +
          `dissentingClaimId=${sourceDissentProof.dissentingClaimId}; ` +
          `mcpPreservesDissentAndGap=${sourceDissentProof.mcpPreservesDissentAndGap}`
      },
      {
        label: "unresolved accepted source dissent readbacks do not promote usefulness",
        passed: sourceDissentProof.readOnlyUsefulnessUnchanged,
        detail:
          `rowsBefore=${sourceDissentProof.readOnlyUsefulnessRowsBefore}; ` +
          `rowsAfter=${sourceDissentProof.readOnlyUsefulnessRowsAfter}`
      }
    ]);

    const requiredDecisionIds = retainedTrialSourceSeedReadback?.packetGoverningDecisionIds ??
      firstPacket.packet.governingDecisionIds;
    const decisionApplications = retainedTrialDecisionApplicationsFor({
      governingDecisionIds: requiredDecisionIds,
      sourceDecisionIds: retainedTrialSourceSeedReadback?.packetSourceDecisionIds ??
        firstPacket.packet.sourceDecisionIds,
      preAppliedSourceDecisionIds: retainedTrialSourceSeedReadback === undefined
        ? [helpedFeedbackSource.decisionId]
        : []
    });
    const cleanupRemainingMarkerCount = input.retainFixture === true
      ? 0
      : await cleanup();
    retainedFixture = input.retainFixture === true;
    cleanedUp = !retainedFixture;

    return {
      workspaceSlug,
      projectSlug,
      projectId: project.id,
      taskId: result.taskContract.id,
      task,
      executionRunId: executionRun.id,
      packetChecksum: firstPacket.packetIdentity.checksum,
      packetEvidenceRef: firstPacket.packetIdentity.evidenceRef,
      packetReadiness: decisionPacketReadinessStatusFrom(
        firstPacket.packet.abstentionScore.status
      ),
      requiredDecisionIds,
      decisionApplications,
      returnChannelHasChecksum,
      matchingFeedbackDeltaId: matchingFeedbackDelta.id,
      matchingFeedbackOutcome: matchingFeedbackOutcome ?? "missing",
      matchingFeedbackStayedDiagnostic,
      matchingSourceDecisionId: helpedFeedbackSource.decisionId,
      matchingSourceDecisionFeedbackOutcome:
        matchingSourceDecisionHelpedOutcomeCount === 1 ? "helped" : "missing",
      matchingSourceDecisionApplicationCount,
      matchingSourceDecisionHelpedOutcomeCount,
      staleFeedbackDeltaId: staleFeedbackDelta.id,
      staleFeedbackOutcome: staleFeedbackOutcome ?? "missing",
      staleFeedbackStayedDiagnostic,
      mismatchedFeedbackDeltaId: mismatchedFeedbackDelta.id,
      mismatchedFeedbackOutcome: mismatchedFeedbackOutcome ?? "absent",
      mismatchedFeedbackStripped,
      mismatchedFeedbackStayedOutOfIssuedPacket,
      issuedPacketGoverningDecisionIds: issuedPacketReadback.packet.governingDecisionIds,
      issuedPacketSourceDecisionIds: issuedPacketReadback.packet.sourceDecisionIds,
      issuedPacketStaleDecisionIds: issuedPacketReadback.packet.staleDecisionIds,
      issuedPacketCaveatedSourceClaimIds,
      issuedPacketRetainsActivatedDecision,
      issuedPacketIdentityRetained,
      selectorProofRunId: selectorProof.proofRunId,
      selectorRetainedMemoryRecordId: selectorProof.retainedMemoryRecordId,
      selectorStaleMemoryRecordId: selectorProof.staleMemoryRecordId,
      selectorRetainedMemoryApplicationId: selectorProof.retainedMemoryApplicationId,
      selectorStaleMemoryApplicationIds: selectorProof.staleMemoryApplicationIds,
      selectorPacketMemoryRefs: selectorProof.packetMemoryRefs,
      selectorPacketIncludesRetainedMemory: selectorProof.includesRetainedMemory,
      selectorPacketExcludesStaleMemory: selectorProof.excludesStaleMemory,
      selectorLegacyMemoryApplicationsPacketStable:
        selectorProof.legacyMemoryApplicationsPacketStable,
      selectorMaintenanceCandidateId: selectorProof.maintenanceCandidateId,
      selectorMaintenanceAntiMemoryCandidateId: selectorProof.maintenanceAntiMemoryCandidateId,
      selectorMaintenanceFeedbackEventId: selectorProof.maintenanceFeedbackEventId,
      selectorMaintenanceCandidateLinkedToFeedbackDelta:
        selectorProof.maintenanceCandidateLinkedToFeedbackDelta,
      standaloneAntiMemoryProofRunId: standaloneAntiMemoryProof.proofRunId,
      standaloneAntiMemoryRecordId: standaloneAntiMemoryProof.antiMemoryRecordId,
      standaloneAntiMemoryRetrievalRunId: standaloneAntiMemoryProof.retrievalRunId,
      standaloneAntiMemoryCandidateCount: standaloneAntiMemoryProof.candidateCount,
      standaloneAntiMemoryExcludedDecisionCount:
        standaloneAntiMemoryProof.excludedDecisionCount,
      standaloneAntiMemoryContextExclusionCount:
        standaloneAntiMemoryProof.contextExclusionCount,
      standaloneAntiMemoryPacketRejectedPathIds:
        standaloneAntiMemoryProof.packetRejectedPathIds,
      standaloneAntiMemoryCliPreserved: standaloneAntiMemoryProof.cliPreserved,
      standaloneAntiMemoryMcpPreserved: standaloneAntiMemoryProof.mcpPreserved,
      standaloneAntiMemoryUsefulnessRowDelta: standaloneAntiMemoryProof.usefulnessRowDelta,
      sourceConsensusProofRunId: sourceConsensusProof.proofRunId,
      sourceConsensusCurrentSourceClaimId: sourceConsensusProof.currentSourceClaimId,
      sourceConsensusSupersededSourceClaimId: sourceConsensusProof.supersededSourceClaimId,
      sourceConsensusRejectedSourceClaimId: sourceConsensusProof.rejectedSourceClaimId,
      sourceConsensusCurrentSourceDecisionEdgeId: sourceConsensusProof.currentSourceDecisionEdgeId,
      sourceConsensusSupersededSourceDecisionEdgeId:
        sourceConsensusProof.supersededSourceDecisionEdgeId,
      sourceConsensusSourceRejectionId: sourceConsensusProof.sourceRejectionId,
      sourceConsensusGoverningDecisionId: sourceConsensusProof.governingDecisionId,
      sourceConsensusPacketSourceClaimIds: sourceConsensusProof.packetSourceClaimIds,
      sourceConsensusPacketRejectedPathIds: sourceConsensusProof.packetRejectedPathIds,
      sourceConsensusPacketSourceDecisionEdgeIds:
        sourceConsensusProof.packetSourceDecisionEdgeIds,
      sourceConsensusPacketSupersededPathIds: sourceConsensusProof.packetSupersededPathIds,
      sourceConsensusPacketSourceRejectionIds: sourceConsensusProof.packetSourceRejectionIds,
      sourceConsensusCurrentClaimGoverned: sourceConsensusProof.currentClaimGoverned,
      sourceConsensusNoFormalRejectionRunId: sourceConsensusProof.noFormalRejectionRunId,
      sourceConsensusNoFormalRejectionStatus: sourceConsensusProof.noFormalRejectionStatus,
      sourceConsensusNoFormalRejectionReasons: sourceConsensusProof.noFormalRejectionReasons,
      sourceConsensusNoFormalRejectionKeepsTypedState:
        sourceConsensusProof.noFormalRejectionKeepsTypedState,
      sourceConsensusSupersededClaimIsNonGoverning:
        sourceConsensusProof.supersededClaimIsNonGoverning,
      sourceConsensusRejectedClaimHasFormalRejection:
        sourceConsensusProof.rejectedClaimHasFormalRejection,
      sourceConsensusTemporalExplanationPresent:
        sourceConsensusProof.temporalExplanationPresent,
      sourceConsensusTemporalExplanationHasEvidence:
        sourceConsensusProof.temporalExplanationHasEvidence,
      sourceConsensusUnsupportedRelationClaimId:
        sourceConsensusProof.unsupportedRelationClaimId,
      sourceConsensusUnsupportedRelationEdgeId:
        sourceConsensusProof.unsupportedRelationEdgeId,
      sourceConsensusUnsupportedRelationStayedCurrent:
        sourceConsensusProof.unsupportedRelationStayedCurrent,
      sourceConsensusUnsupportedRelationVisibleAsGap:
        sourceConsensusProof.unsupportedRelationVisibleAsGap,
      sourceDissentProofRunId: sourceDissentProof.proofRunId,
      sourceDissentCandidateClaimId: sourceDissentProof.candidateClaimId,
      sourceDissentDissentingClaimId: sourceDissentProof.dissentingClaimId,
      sourceDissentCandidateDecisionId: sourceDissentProof.candidateDecisionId,
      sourceDissentPacketSourceClaimIds: sourceDissentProof.packetSourceClaimIds,
      sourceDissentPacketConflictingSourceClaimIds:
        sourceDissentProof.packetConflictingSourceClaimIds,
      sourceDissentPacketDecisionLinkedSourceClaimIds:
        sourceDissentProof.packetDecisionLinkedSourceClaimIds,
      sourceDissentPacketMemoryRefs: sourceDissentProof.packetMemoryRefs,
      sourceDissentPacketGoverningDecisionIds:
        sourceDissentProof.packetGoverningDecisionIds,
      sourceDissentPacketSourceDecisionEdgeIds:
        sourceDissentProof.packetSourceDecisionEdgeIds,
      sourceDissentPacketStatus: sourceDissentProof.packetStatus,
      sourceDissentPacketReasons: sourceDissentProof.packetReasons,
      sourceDissentBriefStopsExecution: sourceDissentProof.briefStopsExecution,
      sourceDissentMcpPreservesDissentAndGap: sourceDissentProof.mcpPreservesDissentAndGap,
      sourceDissentMcpMessageUtf8Bytes: sourceDissentProof.mcpMessageUtf8Bytes,
      sourceDissentMcpStructuredContentMeasurement:
        sourceDissentProof.mcpStructuredContentMeasurement,
      sourceDissentReadOnlyUsefulnessUnchanged:
        sourceDissentProof.readOnlyUsefulnessUnchanged,
      feedbackMaintenanceQueueRecordId: feedbackMaintenanceProof.queueRecordId,
      feedbackMaintenanceQueueStatus: feedbackMaintenanceProof.queueStatus,
      feedbackMaintenanceHandlerBoundaryPassed: feedbackMaintenanceProof.handlerBoundaryPassed,
      feedbackMaintenanceAntiMemoryCandidateId: feedbackMaintenanceProof.antiMemoryCandidateId,
      feedbackMaintenanceAntiMemoryRecordId:
        feedbackMaintenanceGovernedProof.antiMemoryRecordId,
      feedbackMaintenanceGovernedProofRunId: feedbackMaintenanceGovernedProof.proofRunId,
      feedbackMaintenanceGovernedPacketSourceClaimIds:
        feedbackMaintenanceGovernedProof.packetSourceClaimIds,
      feedbackMaintenanceGovernedPacketRejectedPathIds:
        feedbackMaintenanceGovernedProof.packetRejectedPathIds,
      feedbackMaintenanceReviewedTransitionGoverned:
        feedbackMaintenanceGovernedProof.reviewedTransitionGoverned,
      feedbackMaintenanceCandidateLinkedToFeedbackDelta:
        feedbackMaintenanceProof.candidateLinkedToFeedbackDelta,
      feedbackMaintenanceDelayedLookupResolved:
        feedbackMaintenanceProof.delayedLookupResolved,
      feedbackMaintenanceExactReplayIdempotent:
        feedbackMaintenanceProof.exactReplayIdempotent,
      feedbackMaintenanceDirectMutationDelta: feedbackMaintenanceProof.directMutationDelta,
      cleanupRemainingMarkerCount,
      cleanedUp: cleanupRemainingMarkerCount === 0 && !retainedFixture,
      retainedFixture,
      ...(retainedTrialSourceSeedProof === undefined ||
        retainedTrialSourceSeedReadback === undefined
        ? {}
        : {
            retainedTrialSourceSeedCorpusName: retainedTrialSourceSeedProof.corpusName,
            retainedTrialSourceSeedCurrentDecisionIds:
              retainedTrialSourceSeedProof.currentDecisions.map((decision) => decision.targetId),
            retainedTrialSourceSeedFamily: retainedTrialSourceSeedProof.family,
            retainedTrialSourceSeedPacketGoverningDecisionIds:
              retainedTrialSourceSeedReadback.packetGoverningDecisionIds,
            retainedTrialSourceSeedPacketRejectedPathIds:
              retainedTrialSourceSeedReadback.packetRejectedPathIds,
            retainedTrialSourceSeedPacketSourceDecisionIds:
              retainedTrialSourceSeedReadback.packetSourceDecisionIds,
            retainedTrialSourceSeedPacketSourceRejectionIds:
              retainedTrialSourceSeedReadback.packetSourceRejectionIds,
            retainedTrialSourceSeedPacketSupersededPathIds:
              retainedTrialSourceSeedReadback.packetSupersededPathIds,
            retainedTrialSourceSeedRejectedSourceClaimIds:
              retainedTrialSourceSeedProof.rejectedDecisions.map(
                (decision) => decision.sourceClaimId
              ),
            retainedTrialSourceSeedSourceDecisionIds: [
              ...retainedTrialSourceSeedProof.currentDecisions.map(
                (decision) => decision.sourceDecisionId
              ),
              ...retainedTrialSourceSeedProof.staleDecisions.map(
                (decision) => decision.sourceDecisionId
              ),
              ...retainedTrialSourceSeedProof.rejectedDecisions.map(
                (decision) => decision.sourceDecisionId
              )
            ],
            retainedTrialSourceSeedSourceRejectionIds:
              retainedTrialSourceSeedProof.rejectedDecisions.map(
                (decision) => decision.sourceRejectionId
              ),
            retainedTrialSourceSeedStaleSourceClaimIds:
              retainedTrialSourceSeedProof.staleDecisions.map((decision) => decision.sourceClaimId)
          })
    };
  } finally {
    try {
      if (!cleanedUp && !retainedFixture) {
        await cleanup();
      }
    } finally {
      await client.end();
      await rm(targetRepo, { recursive: true, force: true });
    }
  }
};
