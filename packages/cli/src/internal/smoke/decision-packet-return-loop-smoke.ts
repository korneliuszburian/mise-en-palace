import type {
  Sql
} from "postgres";
import type {
  FeedbackDelta,
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
  "packages/cli/src/internal/smoke/decision-packet-return-loop-smoke.ts";
const returnLoopApplicationStatusPath =
  "src/internal/smoke/decision-packet-return-loop-smoke.ts";

export interface DecisionPacketReturnLoopSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface DecisionPacketReturnLoopSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  packetChecksum: string;
  packetEvidenceRef: string;
  returnChannelHasChecksum: boolean;
  matchingFeedbackDeltaId: string;
  matchingFeedbackOutcome: string;
  matchingFeedbackStayedDiagnostic: boolean;
  staleFeedbackDeltaId: string;
  staleFeedbackOutcome: string;
  staleFeedbackStayedDiagnostic: boolean;
  mismatchedFeedbackDeltaId: string;
  mismatchedFeedbackOutcome: string;
  mismatchedFeedbackStripped: boolean;
  mismatchedFeedbackStayedOutOfNextPacket: boolean;
  nextPacketGoverningDecisionIds: readonly string[];
  nextPacketStaleDecisionIds: readonly string[];
  nextPacketCaveatedSourceClaimIds: readonly string[];
  nextPacketRetainsActivatedDecision: boolean;
  selectorProofRunId: string;
  selectorHelpedMemoryRecordId: string;
  selectorStaleMemoryRecordId: string;
  selectorHelpedMemoryApplicationId: string;
  selectorStaleMemoryApplicationIds: readonly string[];
  selectorPacketMemoryRefs: readonly string[];
  selectorPacketIncludesHelpedMemory: boolean;
  selectorPacketExcludesStaleMemory: boolean;
  selectorMaintenanceCandidateId: string;
  selectorMaintenanceAntiMemoryCandidateId: string;
  selectorMaintenanceFeedbackEventId: string;
  selectorMaintenanceCandidateLinkedToFeedbackDelta: boolean;
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
  sourceDissentProofRunId: string;
  sourceDissentCandidateClaimId: string;
  sourceDissentDissentingClaimId: string;
  sourceDissentCandidateDecisionId: string;
  sourceDissentPacketSourceClaimIds: readonly string[];
  sourceDissentPacketConflictingSourceClaimIds: readonly string[];
  sourceDissentPacketDecisionLinkedSourceClaimIds: readonly string[];
  sourceDissentPacketGoverningDecisionIds: readonly string[];
  sourceDissentPacketSourceDecisionEdgeIds: readonly string[];
  sourceDissentPacketStatus: string;
  sourceDissentPacketReasons: readonly string[];
  sourceDissentBriefStopsExecution: boolean;
  sourceDissentMcpPreservesDissentAndGap: boolean;
  sourceDissentReadOnlyUsefulnessUnchanged: boolean;
  feedbackMaintenanceQueueRecordId: string;
  feedbackMaintenanceQueueStatus: string;
  feedbackMaintenanceHandlerBoundaryPassed: boolean;
  feedbackMaintenanceAntiMemoryCandidateId: string;
  feedbackMaintenanceCandidateLinkedToFeedbackDelta: boolean;
  feedbackMaintenanceDelayedLookupResolved: boolean;
  feedbackMaintenanceExactReplayIdempotent: boolean;
  feedbackMaintenanceDirectMutationDelta: number;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
}

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
  helpedMemoryRecordId: string;
  staleMemoryRecordId: string;
  helpedMemoryApplicationId: string;
  staleMemoryApplicationIds: readonly string[];
  packetMemoryRefs: readonly string[];
  includesHelpedMemory: boolean;
  excludesStaleMemory: boolean;
  maintenanceCandidateId: string;
  maintenanceAntiMemoryCandidateId: string;
  maintenanceFeedbackEventId: string;
  maintenanceCandidateLinkedToFeedbackDelta: boolean;
}

type FeedbackSourceProof = "helped" | "stale";

interface FeedbackSourceClaimProof {
  claimId: string;
  decisionTargetId: string;
}

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
}

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

interface SourceDissentProofInput extends SourcePacketProofInput {
  readonly client: Sql;
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
  packetGoverningDecisionIds: readonly string[];
  packetSourceDecisionEdgeIds: readonly string[];
  packetStatus: string;
  packetReasons: readonly string[];
  briefStopsExecution: boolean;
  mcpPreservesDissentAndGap: boolean;
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
      evidenceGapIds: readStringArray(sourceConsensus, "evidenceGapIds")
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
): DecisionPacketSmokeJson["packet"] => {
  if (!isRecord(reply)) {
    throw new Error("DecisionPacket MCP smoke reply was not an object");
  }

  const result = readRequiredRecord(reply, "result", "DecisionPacket MCP smoke reply missed result");
  const structuredContent = readRequiredRecord(
    result,
    "structuredContent",
    "DecisionPacket MCP smoke reply missed structuredContent"
  );

  return readPacket(structuredContent);
};

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
    input.packet.sourceRejectionIds.length === 0,
    input.packet.sourceConsensus.sourceRejectionIds.length === 0,
    input.packet.rejectedPathIds.length === 0,
    input.packet.sourceConsensus.rejectedPathIds.length === 0,
    ["weak_context", "abstain"].includes(input.packet.abstentionScore.status),
    input.packet.abstentionScore.reasons.includes("missing_rejected_path_evidence")
  ].every(Boolean);
};

const sourceUsefulnessOutcome = (input: {
  readonly applicationId?: string;
  readonly appliedAt?: string;
  readonly claimId?: string;
  readonly decisionId?: string;
  readonly evidenceRef: string;
  readonly evidenceRefs?: readonly string[];
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
  readonly reason: string;
}): SourceUsefulnessOutcomeFeedback => ({
  ...(input.applicationId === undefined ? {} : { applicationId: input.applicationId }),
  ...(input.appliedAt === undefined ? {} : { appliedAt: input.appliedAt }),
  ...(input.claimId === undefined ? {} : { sourceClaimId: input.claimId }),
  ...(input.decisionId === undefined ? {} : { sourceDecisionId: input.decisionId }),
  outcome: input.outcome,
  reason: input.reason,
  evidenceRefs: input.evidenceRefs === undefined
    ? [input.evidenceRef]
    : [...input.evidenceRefs],
  doesNotProve:
    "Agent-packet return-loop smoke feedback does not prove source truth, Codex obedience, or product readiness."
});

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
    decisionTargetId
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
  const match = /^usefulnessApplication: ([^|]+)\|(.+)$/mu.exec(stdout);
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
    sourceRepository,
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "source-consensus-no-formal-rejection")
  });
  const noFormalRejectionRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: noFormalRejectionCompile.harnessPlan.id,
    adapter: "codex",
    status: "planned",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "source-consensus-no-formal-rejection-proof",
      evidenceContract: noFormalRejectionCompile.evidenceContract
    }
  });
  const noFormalRejectionPacket = parseDecisionPacket((await runDecisionPacketCommand({
    ...input.baseRuntime,
    runId: noFormalRejectionRun.id,
    createDatabaseRuntime: async () => input.commandRuntime
  })).stdout);
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
    sourceRepository,
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "source-consensus")
  });
  const proofRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: sourceConsensusCompile.harnessPlan.id,
    adapter: "codex",
    status: "planned",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "source-consensus-proof",
      evidenceContract: sourceConsensusCompile.evidenceContract
    }
  });
  const packet = parseDecisionPacket((await runDecisionPacketCommand({
    ...input.baseRuntime,
    runId: proofRun.id,
    createDatabaseRuntime: async () => input.commandRuntime
  })).stdout);
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
    rejectedClaimHasFormalRejection
  };
};

const runUnresolvedAcceptedSourceDissentProof = async (
  input: SourceDissentProofInput
): Promise<SourceDissentProofResult> => {
  const {
    harnessRunRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
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
    status: "planned",
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
    }],
    exclusions: [],
    metadata: {
      ...smokeMetadata,
      retrievalRunId: retrievalRun.id,
      canonicalRevisionTokens: [currentGoverningClaim, currentDissentingClaim].map((claim) => ({
        subjectType: "source_claim",
        subjectId: claim.id,
        updatedAt: claim.updatedAt,
        status: claim.status
      }))
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
        sourceDecisionEdgeIds: [governingSourceDecisionEdge.id],
        sourceDecisionIds: [governingSourceDecision.id],
        targets: [{
          sourceDecisionEdgeId: governingSourceDecisionEdge.id,
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
        sourceDecisionEdgeIds: [dissentingSourceDecisionEdge.id],
        sourceDecisionIds: [dissentingSourceDecision.id],
        targets: [{
          sourceDecisionEdgeId: dissentingSourceDecisionEdge.id,
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
  const readOnlyUsefulnessRowsBefore = await countReadOnlyUsefulnessRows({
    client: input.client,
    executionRunId: proofRun.id
  });
  const packet = parseDecisionPacket((await runDecisionPacketCommand({
    ...input.baseRuntime,
    runId: proofRun.id,
    createDatabaseRuntime: async () => input.commandRuntime
  })).stdout);
  const mcpPacket = readMcpDecisionPacket(await handleDecisionPacketMcpMessage({
    jsonrpc: "2.0",
    id: "unresolved-source-dissent",
    method: "tools/call",
    params: {
      name: "krn_decision_packet",
      arguments: {
        runId: proofRun.id
      }
    }
  }, {
    env: input.baseRuntime.env,
    now: input.baseRuntime.now,
    createId: input.baseRuntime.createId,
    session: { initialized: true },
    runDecisionPacket: async (runtime) => runDecisionPacketCommand({
      ...input.baseRuntime,
      runId: runtime.runId,
      createDatabaseRuntime: async () => input.commandRuntime
    })
  }));
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
    packetGoverningDecisionIds: packet.packet.governingDecisionIds,
    packetSourceDecisionEdgeIds: packet.packet.sourceDecisionEdgeIds,
    packetStatus: packet.packet.abstentionScore.status,
    packetReasons: packet.packet.abstentionScore.reasons,
    briefStopsExecution:
      packet.packet.abstentionScore.status === "abstain" &&
      brief.stdout.includes("Do not execute; the DecisionPacket abstains") &&
      !brief.stdout.includes("Stop Condition: Stop before Codex execution or hidden state mutation."),
    mcpPreservesDissentAndGap,
    readOnlyUsefulnessRowsBefore,
    readOnlyUsefulnessRowsAfter,
    readOnlyUsefulnessUnchanged:
      readOnlyUsefulnessRowsBefore === 0 &&
      readOnlyUsefulnessRowsAfter === readOnlyUsefulnessRowsBefore
  };
};

const runSelectorFeedbackProof = async (
  input: {
    readonly baseRuntime: {
      readonly cwd: string;
      readonly env: { readonly KRN_DATABASE_URL: string };
      readonly now: () => string;
      readonly createId: (prefix: string) => string;
    };
    readonly commandRuntime: DatabaseRuntime;
    readonly executionRunId: string;
    readonly packetChecksum: string;
    readonly packetGeneratedAt: string;
    readonly sourceRunLifecycleRevision: number;
    readonly verificationEvidenceBundleId: string;
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
      "The selector proof packet misses the helped memory or includes the stale memory after store-backed feedback is recorded.",
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

  const selectorHelpedCandidate = await memoryRepository.createMemoryCandidate({
    projectId: input.projectId,
    executionRunId: input.executionRunId,
    proposedBy: "decision-packet-return-loop-smoke",
    kind: "procedure",
    status: "candidate",
    summary: "DecisionPacket selector feedback memory should be retained",
    body:
      "Use store-backed memory application feedback when proving the next DecisionPacket selector retained useful Memory Core context.",
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
      selectorFeedbackProof: "helped"
    }
  });
  const selectorHelpedMemory = await memoryRepository.promoteReviewedMemoryCandidate({
    candidateId: selectorHelpedCandidate.id,
    reviewer: "decision-packet-return-loop-smoke",
    decision: "accepted",
    recordKey: `decision-packet-return-loop:${input.marker}:helped-selector-memory`,
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "helped"
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
  const selectorHelpedMemoryApplication = await memoryRepository.recordMemoryApplication({
    memoryRecordId: selectorHelpedMemory.id,
    executionRunId: input.executionRunId,
    expectedUse: "Retain useful DecisionPacket selector feedback memory on the next packet.",
    outcome: "helped",
    notes: "Store-backed helped feedback should keep this memory eligible for next activation.",
    packetChecksum: input.packetChecksum,
    packetGeneratedAt: input.packetGeneratedAt,
    sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
    evidenceBundleId: input.verificationEvidenceBundleId,
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: "helped"
    }
  });
  const selectorStaleMemoryApplicationIds: string[] = [];

  for (const attempt of [1, 2, 3]) {
    const staleApplication = await memoryRepository.recordMemoryApplication({
      memoryRecordId: selectorStaleMemory.id,
      executionRunId: input.executionRunId,
      expectedUse: "Demote stale DecisionPacket selector feedback memory on the next packet.",
      outcome: "stale",
      notes: `Store-backed stale feedback ${attempt} should make this memory unsafe for next activation.`,
      packetChecksum: `${input.packetChecksum}-stale-${attempt}`,
      packetGeneratedAt: input.packetGeneratedAt,
      sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
      metadata: {
        smokeId: input.marker,
        selectorFeedbackProof: "stale",
        attempt
      }
    });

    selectorStaleMemoryApplicationIds.push(staleApplication.id);
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
        "helped memory appears in the next DecisionPacket memory refs",
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
    sourceRepository,
    retrievalRepository,
    now: () => "2026-07-07T12:00:00.000Z",
    createId: createIdFactory(input.marker, "selector")
  });
  const selectorExecutionRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: selectorCompile.harnessPlan.id,
    adapter: "codex",
    status: "planned",
    metadata: {
      smokeId: input.marker,
      command: "db:smoke:decision-packet-return-loop",
      phase: "selector-feedback-proof",
      evidenceContract: selectorCompile.evidenceContract
    }
  });
  const selectorPacket = parseDecisionPacket((await runDecisionPacketCommand({
    ...input.baseRuntime,
    runId: selectorExecutionRun.id,
    createDatabaseRuntime: async () => input.commandRuntime
  })).stdout);
  const includesHelpedMemory = selectorPacket.packet.memoryRefs.includes(selectorHelpedMemory.id);
  const excludesStaleMemory =
    !selectorPacket.packet.memoryRefs.includes(selectorStaleMemory.id) &&
    selectorPacket.readModel.context.exclusionDetails.some((exclusion) =>
      exclusion.subjectType === "memory_record" &&
      exclusion.subjectId === selectorStaleMemory.id &&
      exclusion.reason === "unsafe" &&
      exclusion.explanation.includes("unresolved_negative_feedback")
    );

  return {
    proofRunId: selectorExecutionRun.id,
    retrievalRunId:
      typeof selectorCompile.contextAssembly.metadata.retrievalRunId === "string"
        ? selectorCompile.contextAssembly.metadata.retrievalRunId
        : undefined,
    helpedMemoryRecordId: selectorHelpedMemory.id,
    staleMemoryRecordId: selectorStaleMemory.id,
    helpedMemoryApplicationId: selectorHelpedMemoryApplication.id,
    staleMemoryApplicationIds: selectorStaleMemoryApplicationIds,
    packetMemoryRefs: selectorPacket.packet.memoryRefs,
    includesHelpedMemory,
    excludesStaleMemory,
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
      taskPrefix: "decision packet return loop smoke"
    });
  let retrievalRunId: string | undefined;
  let selectorRetrievalRunId: string | undefined;
  let sourceConsensusRetrievalRunId: string | undefined;
  let sourceDissentRetrievalRunId: string | undefined;
  const feedbackDeltaIds: string[] = [];
  const maintenanceQueueIds: string[] = [];
  let cleanedUp = false;
  let helpedFeedbackSource: FeedbackSourceClaimProof | undefined;
  let staleFeedbackSource: FeedbackSourceClaimProof | undefined;

  const cleanup = async (): Promise<number> => {
    await deleteFeedbackOutboxRows({ client, feedbackDeltaIds });
    await deleteSelectorProofRows({
      client,
      marker,
      retrievalRunIds: [
        ...(selectorRetrievalRunId === undefined ? [] : [selectorRetrievalRunId]),
        ...(sourceConsensusRetrievalRunId === undefined ? [] : [sourceConsensusRetrievalRunId]),
        ...(sourceDissentRetrievalRunId === undefined ? [] : [sourceDissentRetrievalRunId])
      ]
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
      retrievalRunIds: [
        ...(selectorRetrievalRunId === undefined ? [] : [selectorRetrievalRunId]),
        ...(sourceConsensusRetrievalRunId === undefined ? [] : [sourceConsensusRetrievalRunId]),
        ...(sourceDissentRetrievalRunId === undefined ? [] : [sourceDissentRetrievalRunId])
      ]
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
    const firstPacket = parseDecisionPacket((await runDecisionPacketCommand({
      ...baseRuntime,
      runId: executionRun.id,
      createDatabaseRuntime: async () => commandRuntime
    })).stdout);
    if (helpedFeedbackSource === undefined || staleFeedbackSource === undefined) {
      throw new Error("DecisionPacket return-loop smoke did not prepare canonical feedback source claims");
    }
    const unseenDecisionId = `source-decision-unseen:${marker}`;
    const returnChannelHasChecksum =
      firstPacket.returnChannels.evidence.persistedCommand.includes(firstPacket.packetIdentity.checksum) &&
      firstPacket.returnChannels.feedback.sourceDecisionUsefulnessExample.includes(
        "does not expose canonical selected SourceDecision ids"
      );

    if (!returnChannelHasChecksum) {
      throw new Error("DecisionPacket return-loop checkpoint did not bind the return channel");
    }

    const matchingApplicationId = `decision-packet-return-loop:${marker}:source-application`;
    const applicationEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: firstPacket.packetIdentity.checksum,
      decisionPacketGeneratedAt: firstPacket.packetIdentity.generatedAt,
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          applicationId: matchingApplicationId,
          claimId: helpedFeedbackSource.claimId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "selected",
          reason: "Record selected source application before running the return-channel checkpoint."
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
    feedbackDeltaIds.push(applicationFeedbackDeltaId);

    const checkpointStartedAt = new Date(
      Math.max(Date.now(), Date.parse(matchingApplication.appliedAt) + 1)
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
      intendedFiles: [returnLoopApplicationPath],
      commandOutcomes: [{
        command: checkpointArtifact.command,
        status: "passed",
        provenance: "command_runner",
        exitCode: checkpointArtifact.exitCode,
        capturedAt: checkpointArtifact.completedAt,
        outputRef: checkpointArtifact.outputRef
      }],
      commandOutputArtifacts: [checkpointArtifact],
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
        })
      ],
      readGitStatus: async () => ` M ${returnLoopApplicationStatusPath}\n`,
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
    const matchingFeedbackWasAccepted =
      matchingFeedbackOutcome === "helped" &&
      matchingEvidence.stdout.includes(`decisionPacketEvidenceRef: ${firstPacket.packetIdentity.evidenceRef}`);
    const packetAfterMatching = parseDecisionPacket((await runDecisionPacketCommand({
      ...baseRuntime,
      runId: executionRun.id,
      createDatabaseRuntime: async () => commandRuntime
    })).stdout);
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
    const nextPacket = parseDecisionPacket((await runDecisionPacketCommand({
      ...baseRuntime,
      runId: executionRun.id,
      createDatabaseRuntime: async () => commandRuntime
    })).stdout);
    const nextPacketRetainsActivatedDecision =
      nextPacket.packet.governingDecisionIds.includes(helpedFeedbackSource.decisionTargetId) &&
      nextPacket.packet.governingDecisionIds.includes(staleFeedbackSource.decisionTargetId);
    const nextPacketCaveatedSourceClaimIds = nextPacket.packet.sourceConsensus.caveatedSourceClaimIds;
    const staleFeedbackStayedDiagnostic =
      staleFeedbackOutcome === "stale" &&
      nextPacketCaveatedSourceClaimIds.includes(staleFeedbackSource.claimId) &&
      nextPacket.packet.governingDecisionIds.includes(staleFeedbackSource.decisionTargetId);
    const mismatchedFeedbackStayedOutOfNextPacket =
      !nextPacket.packet.governingDecisionIds.includes(unseenDecisionId) &&
      !nextPacket.packet.staleDecisionIds.includes(unseenDecisionId);
    const matchingFeedbackStayedDiagnostic =
      matchingFeedbackWasAccepted &&
      nextPacketRetainsActivatedDecision &&
      !nextPacket.packet.governingDecisionIds.includes(helpedFeedbackSource.claimId);

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
      commandRuntime,
      executionRunId: executionRun.id,
      packetChecksum: firstPacket.packetIdentity.checksum,
      packetGeneratedAt: firstPacket.packetIdentity.generatedAt,
      sourceRunLifecycleRevision: firstPacket.packetIdentity.sourceRunLifecycleRevision,
      verificationEvidenceBundleId: aggregateAfterMatching?.evidenceBundles.at(-1)?.id ?? "",
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
      projectId: project.id,
      repositories: {
        harnessRunRepository,
        sourceRepository,
        retrievalRepository
      },
      workspaceId: workspace.id
    });
    sourceDissentRetrievalRunId = sourceDissentProof.retrievalRunId;

    assertReturnLoopChecks([
      { label: "return channel checksum binding", passed: returnChannelHasChecksum },
      { label: "matching feedback accepted as bounded signal", passed: matchingFeedbackStayedDiagnostic },
      { label: "stale feedback packet binding", passed: staleFeedbackBoundToPacket },
      { label: "stale feedback stayed diagnostic", passed: staleFeedbackStayedDiagnostic },
      { label: "mismatched feedback stripped", passed: mismatchedFeedbackStripped },
      { label: "mismatched feedback excluded", passed: mismatchedFeedbackStayedOutOfNextPacket },
      { label: "next packet retains activated decisions", passed: nextPacketRetainsActivatedDecision },
      { label: "selector packet includes helped memory", passed: selectorProof.includesHelpedMemory },
      { label: "selector packet excludes stale memory", passed: selectorProof.excludesStaleMemory },
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
        label: "unresolved accepted source dissent abstains without governing guidance",
        passed:
          sourceDissentProof.packetStatus === "abstain" &&
          sourceDissentProof.packetReasons.includes("conflicting_authority") &&
          sourceDissentProof.packetReasons.includes("unresolved_accepted_source_dissent") &&
          sourceDissentProof.packetSourceClaimIds.includes(sourceDissentProof.candidateClaimId) &&
          sourceDissentProof.packetSourceClaimIds.includes(sourceDissentProof.dissentingClaimId) &&
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

    const cleanupRemainingMarkerCount = await cleanup();
    cleanedUp = true;

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      packetChecksum: firstPacket.packetIdentity.checksum,
      packetEvidenceRef: firstPacket.packetIdentity.evidenceRef,
      returnChannelHasChecksum,
      matchingFeedbackDeltaId: matchingFeedbackDelta.id,
      matchingFeedbackOutcome: matchingFeedbackOutcome ?? "missing",
      matchingFeedbackStayedDiagnostic,
      staleFeedbackDeltaId: staleFeedbackDelta.id,
      staleFeedbackOutcome: staleFeedbackOutcome ?? "missing",
      staleFeedbackStayedDiagnostic,
      mismatchedFeedbackDeltaId: mismatchedFeedbackDelta.id,
      mismatchedFeedbackOutcome: mismatchedFeedbackOutcome ?? "absent",
      mismatchedFeedbackStripped,
      mismatchedFeedbackStayedOutOfNextPacket,
      nextPacketGoverningDecisionIds: nextPacket.packet.governingDecisionIds,
      nextPacketStaleDecisionIds: nextPacket.packet.staleDecisionIds,
      nextPacketCaveatedSourceClaimIds,
      nextPacketRetainsActivatedDecision,
      selectorProofRunId: selectorProof.proofRunId,
      selectorHelpedMemoryRecordId: selectorProof.helpedMemoryRecordId,
      selectorStaleMemoryRecordId: selectorProof.staleMemoryRecordId,
      selectorHelpedMemoryApplicationId: selectorProof.helpedMemoryApplicationId,
      selectorStaleMemoryApplicationIds: selectorProof.staleMemoryApplicationIds,
      selectorPacketMemoryRefs: selectorProof.packetMemoryRefs,
      selectorPacketIncludesHelpedMemory: selectorProof.includesHelpedMemory,
      selectorPacketExcludesStaleMemory: selectorProof.excludesStaleMemory,
      selectorMaintenanceCandidateId: selectorProof.maintenanceCandidateId,
      selectorMaintenanceAntiMemoryCandidateId: selectorProof.maintenanceAntiMemoryCandidateId,
      selectorMaintenanceFeedbackEventId: selectorProof.maintenanceFeedbackEventId,
      selectorMaintenanceCandidateLinkedToFeedbackDelta:
        selectorProof.maintenanceCandidateLinkedToFeedbackDelta,
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
      sourceDissentProofRunId: sourceDissentProof.proofRunId,
      sourceDissentCandidateClaimId: sourceDissentProof.candidateClaimId,
      sourceDissentDissentingClaimId: sourceDissentProof.dissentingClaimId,
      sourceDissentCandidateDecisionId: sourceDissentProof.candidateDecisionId,
      sourceDissentPacketSourceClaimIds: sourceDissentProof.packetSourceClaimIds,
      sourceDissentPacketConflictingSourceClaimIds:
        sourceDissentProof.packetConflictingSourceClaimIds,
      sourceDissentPacketDecisionLinkedSourceClaimIds:
        sourceDissentProof.packetDecisionLinkedSourceClaimIds,
      sourceDissentPacketGoverningDecisionIds:
        sourceDissentProof.packetGoverningDecisionIds,
      sourceDissentPacketSourceDecisionEdgeIds:
        sourceDissentProof.packetSourceDecisionEdgeIds,
      sourceDissentPacketStatus: sourceDissentProof.packetStatus,
      sourceDissentPacketReasons: sourceDissentProof.packetReasons,
      sourceDissentBriefStopsExecution: sourceDissentProof.briefStopsExecution,
      sourceDissentMcpPreservesDissentAndGap: sourceDissentProof.mcpPreservesDissentAndGap,
      sourceDissentReadOnlyUsefulnessUnchanged:
        sourceDissentProof.readOnlyUsefulnessUnchanged,
      feedbackMaintenanceQueueRecordId: feedbackMaintenanceProof.queueRecordId,
      feedbackMaintenanceQueueStatus: feedbackMaintenanceProof.queueStatus,
      feedbackMaintenanceHandlerBoundaryPassed: feedbackMaintenanceProof.handlerBoundaryPassed,
      feedbackMaintenanceAntiMemoryCandidateId: feedbackMaintenanceProof.antiMemoryCandidateId,
      feedbackMaintenanceCandidateLinkedToFeedbackDelta:
        feedbackMaintenanceProof.candidateLinkedToFeedbackDelta,
      feedbackMaintenanceDelayedLookupResolved:
        feedbackMaintenanceProof.delayedLookupResolved,
      feedbackMaintenanceExactReplayIdempotent:
        feedbackMaintenanceProof.exactReplayIdempotent,
      feedbackMaintenanceDirectMutationDelta: feedbackMaintenanceProof.directMutationDelta,
      cleanupRemainingMarkerCount,
      cleanedUp: cleanupRemainingMarkerCount === 0
    };
  } finally {
    try {
      if (!cleanedUp) {
        await cleanup();
      }
    } finally {
      await client.end();
    }
  }
};
