import type {
  Sql
} from "postgres";
import type {
  FeedbackDelta,
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import {
  buildMemoryStalenessMaintenancePreview
} from "@krn/core";
import type {
  HarnessCompilerDependencies
} from "@krn/harness";
import type {
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
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  isRecord,
  readRecordArray,
  readRequiredRecord,
  readRequiredString,
  readString,
  readStringArray
} from "./json-readers.js";

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
  mismatchedFeedbackDowngraded: boolean;
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
  sourceConsensusSupersededClaimRejectedPath: boolean;
  sourceConsensusRejectedClaimRejectedPath: boolean;
  feedbackMaintenanceQueueRecordId: string;
  feedbackMaintenanceQueueStatus: string;
  feedbackMaintenanceHandlerBoundaryPassed: boolean;
  feedbackMaintenanceAntiMemoryCandidateId: string;
  feedbackMaintenanceCandidateLinkedToFeedbackDelta: boolean;
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
  };
  packet: {
    governingDecisionIds: readonly string[];
    memoryRefs: readonly string[];
    rejectedPathIds: readonly string[];
    sourceClaimIds: readonly string[];
    sourceConsensus: {
      decisionLinkedSourceClaimIds: readonly string[];
      caveatedSourceClaimIds: readonly string[];
      sourceDecisionEdgeIds: readonly string[];
      supersededPathIds: readonly string[];
      rejectedPathIds: readonly string[];
      sourceRejectionIds: readonly string[];
      evidenceGapIds: readonly string[];
    };
    staleDecisionIds: readonly string[];
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
  supersededClaimRejectedPath: boolean;
  rejectedClaimRejectedPath: boolean;
}

interface FeedbackMaintenanceProofResult {
  queueRecordId: string;
  queueStatus: string;
  handlerBoundaryPassed: boolean;
  antiMemoryCandidateId: string;
  candidateLinkedToFeedbackDelta: boolean;
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

  return {
    checksum: readRequiredString(packetIdentity, "checksum", "DecisionPacket smoke readback missed checksum"),
    evidenceRef: readRequiredString(packetIdentity, "evidenceRef", "DecisionPacket smoke readback missed evidenceRef")
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

  return {
    governingDecisionIds: readStringArray(packet, "governingDecisionIds"),
    memoryRefs: readStringArray(packet, "memoryRefs"),
    rejectedPathIds: readStringArray(packet, "rejectedPathIds"),
    sourceClaimIds: readStringArray(packet, "sourceClaimIds"),
    sourceConsensus: {
      decisionLinkedSourceClaimIds: readStringArray(sourceConsensus, "decisionLinkedSourceClaimIds"),
      caveatedSourceClaimIds: readStringArray(sourceConsensus, "caveatedSourceClaimIds"),
      sourceDecisionEdgeIds: readStringArray(sourceConsensus, "sourceDecisionEdgeIds"),
      supersededPathIds: readStringArray(sourceConsensus, "supersededPathIds"),
      rejectedPathIds: readStringArray(sourceConsensus, "rejectedPathIds"),
      sourceRejectionIds: readStringArray(sourceConsensus, "sourceRejectionIds"),
      evidenceGapIds: readStringArray(sourceConsensus, "evidenceGapIds")
    },
    staleDecisionIds: readStringArray(packet, "staleDecisionIds")
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

const sourceUsefulnessOutcome = (input: {
  readonly claimId?: string;
  readonly decisionId?: string;
  readonly evidenceRef: string;
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
  readonly reason: string;
}): SourceUsefulnessOutcomeFeedback => ({
  ...(input.claimId === undefined ? {} : { sourceClaimId: input.claimId }),
  ...(input.decisionId === undefined ? {} : { sourceDecisionId: input.decisionId }),
  outcome: input.outcome,
  reason: input.reason,
  evidenceRefs: [input.evidenceRef],
  doesNotProve:
    "Agent-packet return-loop smoke feedback does not prove source truth, Codex obedience, or product readiness."
});

const createFeedbackSourceClaim = async (
  input: {
    readonly marker: string;
    readonly projectId: string;
    readonly sourceArtifactId: string;
    readonly sourceRepository: SourceRepository;
    readonly proof: FeedbackSourceProof;
  }
): Promise<FeedbackSourceClaimProof> => {
  const claim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: input.sourceArtifactId,
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
      smokeId: input.marker,
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

const latestFeedbackDeltaOrThrow = (
  aggregate: { readonly feedbackDeltas: readonly FeedbackDelta[] } | undefined,
  message: string
): FeedbackDelta => {
  const feedbackDelta = aggregate?.feedbackDeltas.at(-1);

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

const runFeedbackMaintenanceProof = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly projectId: string;
    readonly feedbackDelta: FeedbackDelta;
    readonly repositories: {
      readonly maintenanceQueueRepository: DrizzleMaintenanceQueueRepository;
      readonly harnessRunRepository: HarnessRunRepository;
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

  const readback = await runMaintenanceQueueRecord({
    repository: input.repositories.maintenanceQueueRepository,
    recordId: queueRecord.id,
    claim: {
      lockedBy: "decision-packet-return-loop-smoke"
    },
    handlers: [
      createFeedbackDeltaMaintenanceHandler({
        harnessRunRepository: input.repositories.harnessRunRepository,
        memoryRepository: input.repositories.memoryRepository,
        sourceRepository: input.repositories.sourceRepository,
        now: () => "2026-07-07T12:00:00.000Z"
      })
    ]
  });
  const candidate = await findFeedbackMaintenanceAntiMemoryCandidate({
    client: input.client,
    feedbackDeltaId: input.feedbackDelta.id
  });
  const directMutationCountAfter = await countFeedbackMaintenanceForbiddenRows({
    client: input.client,
    marker: input.marker
  });

  if (candidate === undefined) {
    throw new Error(
      "DecisionPacket return-loop smoke did not create feedback maintenance anti-memory candidate"
    );
  }

  return {
    queueRecordId: queueRecord.id,
    queueStatus: readback.status,
    handlerBoundaryPassed: readback.handlerWriteBoundary?.status === "passed",
    antiMemoryCandidateId: candidate.id,
    candidateLinkedToFeedbackDelta: candidate.feedbackDeltaId === input.feedbackDelta.id,
    directMutationDelta: directMutationCountAfter - directMutationCountBefore
  };
};

const runSourceConsensusProof = async (
  input: {
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
    readonly repositories: {
      readonly harnessRunRepository: HarnessRunRepository;
      readonly memoryRepository: MemoryRepository;
      readonly sourceRepository: SourceRepository;
      readonly retrievalRepository: RetrievalRepository;
    };
    readonly workspaceId: string;
  }
): Promise<SourceConsensusProofResult> => {
  const {
    harnessRunRepository,
    memoryRepository,
    retrievalRepository,
    sourceRepository
  } = input.repositories;
  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "run",
    uri: `operator://decision-packet-return-loop/${input.marker}/source-consensus`,
    title: "DecisionPacket source consensus smoke source",
    contentHash: `decision-packet-source-consensus-${input.marker}`,
    sourceAuthority: "project-decision",
    metadata: {
      smokeId: input.marker,
      sourceConsensusProof: true
    }
  });
  const currentClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
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
      smokeId: input.marker,
      sourceConsensusProof: "current"
    }
  });
  const supersededClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
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
      smokeId: input.marker,
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
  await sourceRepository.createSourceDecision({
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
    initialEvent: {
      sequence: 1,
      type: "smoke.decision_packet_return_loop.source_consensus",
      message: "DecisionPacket return-loop smoke created source consensus proof run",
      payload: {
        smokeId: input.marker,
        currentSourceClaimId: currentClaim.id,
        supersededSourceClaimId: supersededClaim.id,
        rejectedSourceClaimId: rejectedClaim.id
      }
    },
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
  const supersededClaimRejectedPath =
    !packet.packet.sourceClaimIds.includes(supersededClaim.id) &&
    !packet.packet.governingDecisionIds.includes(supersededDecisionId) &&
    packetSupersededPathIds.includes(supersededClaim.id) &&
    packetRejectedPathIds.includes(supersededClaim.id);
  const rejectedClaimRejectedPath =
    !packet.packet.sourceClaimIds.includes(rejectedClaim.id) &&
    packetRejectedPathIds.includes(rejectedClaim.id);

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
    supersededClaimRejectedPath,
    rejectedClaimRejectedPath
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
    readonly feedbackDeltaId: string;
    readonly marker: string;
    readonly projectId: string;
    readonly repositories: {
      readonly harnessRunRepository: HarnessRunRepository;
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
  const selectorSourceArtifact = await sourceRepository.createSourceArtifact({
    kind: "run",
    uri: `operator://decision-packet-return-loop/${input.marker}/selector-feedback`,
    title: "DecisionPacket selector feedback smoke source",
    contentHash: `decision-packet-selector-feedback-${input.marker}`,
    sourceAuthority: "project-decision",
    metadata: {
      smokeId: input.marker,
      selectorFeedbackProof: true
    }
  });
  const selectorSourceClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: selectorSourceArtifact.id,
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
      smokeId: input.marker,
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
    initialEvent: {
      sequence: 1,
      type: "smoke.decision_packet_return_loop.selector_feedback",
      message: "DecisionPacket return-loop smoke created selector feedback proof run",
      payload: {
        smokeId: input.marker,
        helpedMemoryRecordId: selectorHelpedMemory.id,
        staleMemoryRecordId: selectorStaleMemory.id
      }
    },
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
        ...(sourceConsensusRetrievalRunId === undefined ? [] : [sourceConsensusRetrievalRunId])
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
        ...(sourceConsensusRetrievalRunId === undefined ? [] : [sourceConsensusRetrievalRunId])
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
      retrievalRepository,
      retrievalRunId: compiledRetrievalRunId,
      sourceRepository,
      workspace
    } = await createCompiledSmokeExecution({
      acceptance: "bind headless decision packet feedback to packet checksum",
      command: "db:smoke:decision-packet-return-loop",
      db,
      eventMessage: "Agent-packet return-loop smoke created persisted run",
      eventPayload: (compiledResult) => ({
        operatorIntentId: compiledResult.operatorIntent.id,
        taskContractId: compiledResult.taskContract.id,
        harnessPlanId: compiledResult.harnessPlan.id,
        contextAssemblyId: compiledResult.contextAssembly.id
      }),
      eventType: "smoke.decision_packet_return_loop.persisted",
      marker,
      projectSlug,
      task,
      workspaceSlug,
      prepare: async ({ project, sourceRepository }) => {
        const feedbackSourceArtifact = await sourceRepository.createSourceArtifact({
          projectId: project.id,
          kind: "run",
          uri: `operator://decision-packet-return-loop/${marker}/feedback-source-claims`,
          title: "DecisionPacket feedback source claim smoke source",
          contentHash: `decision-packet-feedback-source-claims-${marker}`,
          sourceAuthority: "project-decision",
          metadata: {
            smokeId: marker,
            feedbackSourceClaims: true
          }
        });
        helpedFeedbackSource = await createFeedbackSourceClaim({
          marker,
          projectId: project.id,
          sourceArtifactId: feedbackSourceArtifact.id,
          sourceRepository,
          proof: "helped"
        });
        staleFeedbackSource = await createFeedbackSourceClaim({
          marker,
          projectId: project.id,
          sourceArtifactId: feedbackSourceArtifact.id,
          sourceRepository,
          proof: "stale"
        });
      }
    });
    retrievalRunId = compiledRetrievalRunId;

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
    const matchingEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: firstPacket.packetIdentity.checksum,
      commandOutcomes: [{
        command: "pnpm --filter @krn/cli test -- decision-packet",
        status: "passed",
        provenance: "operator_reported"
      }],
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          claimId: helpedFeedbackSource.claimId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "helped",
          reason: "Matching packet checksum kept selected source claim feedback bound to the packet."
        })
      ],
      readGitStatus: async () => "",
      createDatabaseRuntime: async () => commandRuntime
    });
    const aggregateAfterMatching =
      await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);
    const matchingFeedbackDelta = latestFeedbackDeltaOrThrow(
      aggregateAfterMatching,
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
    const staleFeedbackDelta = latestFeedbackDeltaOrThrow(
      aggregateAfterStale,
      "DecisionPacket return-loop smoke did not persist stale feedback"
    );

    feedbackDeltaIds.push(staleFeedbackDelta.id);

    const staleFeedbackOutcome = feedbackOutcome(staleFeedbackDelta.metadata);
    const staleFeedbackBoundToPacket =
      staleFeedbackOutcome === "stale" &&
      staleEvidence.stdout.includes(`decisionPacketEvidenceRef: ${packetAfterMatching.packetIdentity.evidenceRef}`);
    const mismatchedChecksum = "0".repeat(64);
    await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: mismatchedChecksum,
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
    const mismatchedFeedbackDelta = latestFeedbackDeltaOrThrow(
      aggregateAfterMismatch,
      "DecisionPacket return-loop smoke did not persist mismatched feedback"
    );

    feedbackDeltaIds.push(mismatchedFeedbackDelta.id);

    const mismatchedFeedbackOutcome = feedbackOutcome(mismatchedFeedbackDelta.metadata);
    const mismatchedFeedbackDowngraded = mismatchedFeedbackOutcome === "unknown";
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

    assertReturnLoopChecks([
      { label: "return channel checksum binding", passed: returnChannelHasChecksum },
      { label: "matching feedback accepted as bounded signal", passed: matchingFeedbackStayedDiagnostic },
      { label: "stale feedback packet binding", passed: staleFeedbackBoundToPacket },
      { label: "stale feedback stayed diagnostic", passed: staleFeedbackStayedDiagnostic },
      { label: "mismatched feedback downgraded", passed: mismatchedFeedbackDowngraded },
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
        label: "source consensus superseded claim rejected path",
        passed: sourceConsensusProof.supersededClaimRejectedPath,
        detail:
          `sourceClaimIds=${sourceConsensusProof.packetSourceClaimIds.join(",")}; ` +
          `rejectedPathIds=${sourceConsensusProof.packetRejectedPathIds.join(",")}; ` +
          `supersededPathIds=${sourceConsensusProof.packetSupersededPathIds.join(",")}`
      },
      {
        label: "source consensus rejected claim rejected path",
        passed: sourceConsensusProof.rejectedClaimRejectedPath,
        detail:
          `sourceClaimIds=${sourceConsensusProof.packetSourceClaimIds.join(",")}; ` +
          `rejectedPathIds=${sourceConsensusProof.packetRejectedPathIds.join(",")}`
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
      mismatchedFeedbackOutcome: mismatchedFeedbackOutcome ?? "missing",
      mismatchedFeedbackDowngraded,
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
      sourceConsensusSupersededClaimRejectedPath:
        sourceConsensusProof.supersededClaimRejectedPath,
      sourceConsensusRejectedClaimRejectedPath: sourceConsensusProof.rejectedClaimRejectedPath,
      feedbackMaintenanceQueueRecordId: feedbackMaintenanceProof.queueRecordId,
      feedbackMaintenanceQueueStatus: feedbackMaintenanceProof.queueStatus,
      feedbackMaintenanceHandlerBoundaryPassed: feedbackMaintenanceProof.handlerBoundaryPassed,
      feedbackMaintenanceAntiMemoryCandidateId: feedbackMaintenanceProof.antiMemoryCandidateId,
      feedbackMaintenanceCandidateLinkedToFeedbackDelta:
        feedbackMaintenanceProof.candidateLinkedToFeedbackDelta,
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
