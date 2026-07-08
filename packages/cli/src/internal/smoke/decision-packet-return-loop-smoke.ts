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
} from "@krn/harness/repositories/internal";
import {
  compileHarnessPlan,
  proposeMemoryConsolidation
} from "@krn/harness";
import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "@krn/db/dev";
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
  matchingFeedbackRemainedAuthoritative: boolean;
  staleFeedbackDeltaId: string;
  staleFeedbackOutcome: string;
  staleFeedbackDemotedDecision: boolean;
  mismatchedFeedbackDeltaId: string;
  mismatchedFeedbackOutcome: string;
  mismatchedFeedbackDowngraded: boolean;
  mismatchedFeedbackStayedOutOfNextPacket: boolean;
  nextPacketGoverningDecisionIds: readonly string[];
  nextPacketStaleDecisionIds: readonly string[];
  nextPacketIncludesMatchingDecision: boolean;
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

interface ReturnLoopCheck {
  label: string;
  passed: boolean;
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
): DecisionPacketSmokeJson["packet"] => ({
  governingDecisionIds: readStringArray(
    readRequiredRecord(parsed, "packet", "DecisionPacket smoke readback missed packet"),
    "governingDecisionIds"
  ),
  memoryRefs: readStringArray(
    readRequiredRecord(parsed, "packet", "DecisionPacket smoke readback missed packet"),
    "memoryRefs"
  ),
  staleDecisionIds: readStringArray(
    readRequiredRecord(parsed, "packet", "DecisionPacket smoke readback missed packet"),
    "staleDecisionIds"
  )
});

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
  readonly decisionId: string;
  readonly evidenceRef: string;
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
  readonly reason: string;
}): SourceUsefulnessOutcomeFeedback => ({
  sourceDecisionId: input.decisionId,
  outcome: input.outcome,
  reason: input.reason,
  evidenceRefs: [input.evidenceRef],
  doesNotProve:
    "Agent-packet return-loop smoke feedback does not prove source truth, Codex obedience, or product readiness."
});

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
    throw new Error(`DecisionPacket return-loop smoke failed: ${failed.label}`);
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
  sourceRepository: input.repositories.sourceRepository,
  retrievalRepository: input.repositories.retrievalRepository,
  memoryRepository: input.repositories.memoryRepository,
  async close(): Promise<void> {
    // The smoke owns the shared SQL client and closes it after cleanup.
  }
});

const deleteSelectorProofRows = async (
  input: {
    readonly client: Sql;
    readonly marker: string;
    readonly retrievalRunIds: readonly string[];
  }
): Promise<void> => {
  await input.client`
    delete from outbox_events
    where payload->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from memory_applications
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from memory_feedback_events
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from memory_record_versions
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from memory_records
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from anti_memory_candidates
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from memory_candidates
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from source_decision_edges
    where metadata->>'smokeId' = ${input.marker}
  `;
  await input.client`
    delete from source_decisions
    where metadata->>'smokeId' = ${input.marker}
  `;

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
  const rows = await input.client<{ count: number }[]>`
    select (
      (select count(*)::int from memory_applications where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from memory_feedback_events where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from anti_memory_candidates where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from memory_record_versions where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from memory_records where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from memory_candidates where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from source_decision_edges where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from source_decisions where metadata->>'smokeId' = ${input.marker}) +
      (select count(*)::int from outbox_events where payload->>'smokeId' = ${input.marker})
    ) as count
  `;
  let count = rows[0]?.count ?? 0;

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
  }

  return count;
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
  const feedbackDeltaIds: string[] = [];
  let cleanedUp = false;

  const cleanup = async (): Promise<number> => {
    await deleteFeedbackOutboxRows({ client, feedbackDeltaIds });
    await deleteSelectorProofRows({
      client,
      marker,
      retrievalRunIds: selectorRetrievalRunId === undefined ? [] : [selectorRetrievalRunId]
    });

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
    const selectorProofRemaining = await countSelectorProofRows({
      client,
      marker,
      retrievalRunIds: selectorRetrievalRunId === undefined ? [] : [selectorRetrievalRunId]
    });

    return baseRemaining + feedbackOutboxRemaining + selectorProofRemaining;
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
      workspaceSlug
    });
    retrievalRunId = compiledRetrievalRunId;

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
    const returnChannelHasChecksum =
      firstPacket.returnChannels.evidence.persistedCommand.includes(firstPacket.packetIdentity.checksum) &&
      firstPacket.returnChannels.feedback.sourceDecisionUsefulnessExample.includes(
        firstPacket.packetIdentity.evidenceRef
      );
    const decisionId = `source-decision-decision-packet-${marker}`;
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
          decisionId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "helped",
          reason: "Matching packet checksum kept source decision feedback authoritative."
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
    const matchingFeedbackRemainedAuthoritative =
      matchingFeedbackOutcome === "helped" &&
      matchingEvidence.stdout.includes(`decisionPacketEvidenceRef: ${firstPacket.packetIdentity.evidenceRef}`);
    const staleDecisionId = `${decisionId}-stale`;
    const staleEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      decisionPacketChecksum: firstPacket.packetIdentity.checksum,
      commandOutcomes: [{
        command: "pnpm --filter @krn/cli test -- decision-packet-stale-feedback",
        status: "passed",
        provenance: "operator_reported"
      }],
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          decisionId: staleDecisionId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "stale",
          reason: "Matching packet checksum demoted stale source decision feedback in the next packet."
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
      staleEvidence.stdout.includes(`decisionPacketEvidenceRef: ${firstPacket.packetIdentity.evidenceRef}`);
    const mismatchedDecisionId = `${decisionId}-mismatched`;
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
          decisionId: mismatchedDecisionId,
          evidenceRef: firstPacket.packetIdentity.evidenceRef,
          outcome: "helped",
          reason: "Mismatched packet checksum must downgrade this feedback."
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
    const nextPacketIncludesMatchingDecision =
      nextPacket.packet.governingDecisionIds.includes(decisionId);
    const staleFeedbackDemotedDecision =
      nextPacket.packet.staleDecisionIds.includes(staleDecisionId) &&
      !nextPacket.packet.governingDecisionIds.includes(staleDecisionId);
    const mismatchedFeedbackStayedOutOfNextPacket =
      !nextPacket.packet.governingDecisionIds.includes(mismatchedDecisionId) &&
      !nextPacket.packet.staleDecisionIds.includes(mismatchedDecisionId);
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

    assertReturnLoopChecks([
      { label: "return channel checksum binding", passed: returnChannelHasChecksum },
      { label: "matching feedback authoritative", passed: matchingFeedbackRemainedAuthoritative },
      { label: "stale feedback packet binding", passed: staleFeedbackBoundToPacket },
      { label: "stale feedback demoted decision", passed: staleFeedbackDemotedDecision },
      { label: "mismatched feedback downgraded", passed: mismatchedFeedbackDowngraded },
      { label: "mismatched feedback excluded", passed: mismatchedFeedbackStayedOutOfNextPacket },
      { label: "next packet includes matching decision", passed: nextPacketIncludesMatchingDecision },
      { label: "selector packet includes helped memory", passed: selectorProof.includesHelpedMemory },
      { label: "selector packet excludes stale memory", passed: selectorProof.excludesStaleMemory },
      {
        label: "selector maintenance candidate linked to feedback delta",
        passed: selectorProof.maintenanceCandidateLinkedToFeedbackDelta
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
      matchingFeedbackRemainedAuthoritative,
      staleFeedbackDeltaId: staleFeedbackDelta.id,
      staleFeedbackOutcome: staleFeedbackOutcome ?? "missing",
      staleFeedbackDemotedDecision,
      mismatchedFeedbackDeltaId: mismatchedFeedbackDelta.id,
      mismatchedFeedbackOutcome: mismatchedFeedbackOutcome ?? "missing",
      mismatchedFeedbackDowngraded,
      mismatchedFeedbackStayedOutOfNextPacket,
      nextPacketGoverningDecisionIds: nextPacket.packet.governingDecisionIds,
      nextPacketStaleDecisionIds: nextPacket.packet.staleDecisionIds,
      nextPacketIncludesMatchingDecision,
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
