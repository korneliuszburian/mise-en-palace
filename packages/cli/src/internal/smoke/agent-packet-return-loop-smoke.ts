import type {
  Sql
} from "postgres";
import type {
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import type {
  HarnessCompilerDependencies
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
  runAgentPacketCommand
} from "../../run-agent-packet-command.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";

export interface AgentPacketReturnLoopSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface AgentPacketReturnLoopSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  packetChecksum: string;
  packetEvidenceRef: string;
  returnChannelHasChecksum: boolean;
  matchingFeedbackDeltaId: string;
  matchingFeedbackOutcome: string;
  matchingFeedbackRemainedAuthoritative: boolean;
  mismatchedFeedbackDeltaId: string;
  mismatchedFeedbackOutcome: string;
  mismatchedFeedbackDowngraded: boolean;
  nextPacketGoverningDecisionIds: readonly string[];
  nextPacketIncludesMatchingDecision: boolean;
  cleanupRemainingMarkerCount: number;
  cleanedUp: boolean;
}

interface AgentPacketSmokeJson {
  packetIdentity: {
    checksum: string;
    evidenceRef: string;
  };
  packet: {
    governingDecisionIds: readonly string[];
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readRecord = (
  value: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined => {
  const field = value[key];

  return isRecord(field) ? field : undefined;
};

const readString = (
  value: Record<string, unknown>,
  key: string
): string | undefined => {
  const field = value[key];

  return typeof field === "string" ? field : undefined;
};

const readStringArray = (
  value: Record<string, unknown>,
  key: string
): readonly string[] => {
  const field = value[key];

  return Array.isArray(field)
    ? field.filter((item): item is string => typeof item === "string")
    : [];
};

const readRequiredRecord = (
  value: Record<string, unknown>,
  key: string
): Record<string, unknown> => {
  const field = readRecord(value, key);

  if (field === undefined) {
    throw new Error(`Agent packet smoke readback missed ${key}`);
  }

  return field;
};

const readRequiredString = (
  value: Record<string, unknown>,
  key: string
): string => {
  const field = readString(value, key);

  if (field === undefined) {
    throw new Error(`Agent packet smoke readback missed ${key}`);
  }

  return field;
};

const readPacketIdentity = (
  parsed: Record<string, unknown>
): AgentPacketSmokeJson["packetIdentity"] => {
  const packetIdentity = readRequiredRecord(parsed, "packetIdentity");

  return {
    checksum: readRequiredString(packetIdentity, "checksum"),
    evidenceRef: readRequiredString(packetIdentity, "evidenceRef")
  };
};

const readPacket = (
  parsed: Record<string, unknown>
): AgentPacketSmokeJson["packet"] => ({
  governingDecisionIds: readStringArray(
    readRequiredRecord(parsed, "packet"),
    "governingDecisionIds"
  )
});

const readReturnChannels = (
  parsed: Record<string, unknown>
): AgentPacketSmokeJson["returnChannels"] => {
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

const parseAgentPacket = (stdout: string): AgentPacketSmokeJson => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed)) {
    throw new Error("Agent packet smoke readback was not an object");
  }

  return {
    packetIdentity: readPacketIdentity(parsed),
    packet: readPacket(parsed),
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

export const runAgentPacketReturnLoopSmokeCheck = async (
  input: AgentPacketReturnLoopSmokeInput
): Promise<AgentPacketReturnLoopSmokeReport> => {
  const { client, db, marker, projectSlug, task, workspaceSlug } =
    await createHarnessCompilerSmokeRuntime({
      databaseUrl: input.databaseUrl,
      migrationsFolder: input.migrationsFolder,
      smokeId: input.smokeId,
      smokeName: "agent packet return-loop smoke",
      workspacePrefix: "krn-agent-packet-smoke",
      projectSlug: "agent-packet-return-loop",
      taskPrefix: "agent packet return loop smoke"
    });
  let retrievalRunId: string | undefined;
  const feedbackDeltaIds: string[] = [];
  let cleanedUp = false;

  const cleanup = async (): Promise<number> => {
    await deleteFeedbackOutboxRows({ client, feedbackDeltaIds });

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

    return baseRemaining + feedbackOutboxRemaining;
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
      acceptance: "bind headless agent packet feedback to packet checksum",
      command: "db:smoke:agent-packet-return-loop",
      db,
      eventMessage: "Agent-packet return-loop smoke created persisted run",
      eventPayload: (compiledResult) => ({
        operatorIntentId: compiledResult.operatorIntent.id,
        taskContractId: compiledResult.taskContract.id,
        harnessPlanId: compiledResult.harnessPlan.id,
        contextAssemblyId: compiledResult.contextAssembly.id
      }),
      eventType: "smoke.agent_packet_return_loop.persisted",
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
    const firstPacket = parseAgentPacket((await runAgentPacketCommand({
      ...baseRuntime,
      runId: executionRun.id,
      createDatabaseRuntime: async () => commandRuntime
    })).stdout);
    const returnChannelHasChecksum =
      firstPacket.returnChannels.evidence.persistedCommand.includes(firstPacket.packetIdentity.checksum) &&
      firstPacket.returnChannels.feedback.sourceDecisionUsefulnessExample.includes(
        firstPacket.packetIdentity.evidenceRef
      );
    const decisionId = `source-decision-agent-packet-${marker}`;
    const matchingEvidence = await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      agentPacketChecksum: firstPacket.packetIdentity.checksum,
      commandOutcomes: [{
        command: "pnpm --filter @krn/cli test -- agent-packet",
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
    const matchingFeedbackDelta = aggregateAfterMatching?.feedbackDeltas.at(-1);

    if (matchingFeedbackDelta === undefined) {
      throw new Error("Agent-packet return-loop smoke did not persist matching feedback");
    }

    feedbackDeltaIds.push(matchingFeedbackDelta.id);

    const matchingFeedbackOutcome = feedbackOutcome(matchingFeedbackDelta.metadata);
    const matchingFeedbackRemainedAuthoritative =
      matchingFeedbackOutcome === "helped" &&
      matchingEvidence.stdout.includes(`agentPacketEvidenceRef: ${firstPacket.packetIdentity.evidenceRef}`);
    const staleChecksum = "0".repeat(64);
    await runEvidenceCaptureCommand({
      ...baseRuntime,
      persist: true,
      runId: executionRun.id,
      agentPacketChecksum: staleChecksum,
      commandOutcomes: [{
        command: "pnpm --filter @krn/cli test -- stale-agent-packet",
        status: "passed",
        provenance: "operator_reported"
      }],
      sourceUsefulnessOutcomes: [
        sourceUsefulnessOutcome({
          decisionId: `${decisionId}-stale`,
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
    const mismatchedFeedbackDelta = aggregateAfterMismatch?.feedbackDeltas.at(-1);

    if (mismatchedFeedbackDelta === undefined) {
      throw new Error("Agent-packet return-loop smoke did not persist mismatched feedback");
    }

    feedbackDeltaIds.push(mismatchedFeedbackDelta.id);

    const mismatchedFeedbackOutcome = feedbackOutcome(mismatchedFeedbackDelta.metadata);
    const mismatchedFeedbackDowngraded = mismatchedFeedbackOutcome === "unknown";
    const nextPacket = parseAgentPacket((await runAgentPacketCommand({
      ...baseRuntime,
      runId: executionRun.id,
      createDatabaseRuntime: async () => commandRuntime
    })).stdout);
    const nextPacketIncludesMatchingDecision =
      nextPacket.packet.governingDecisionIds.includes(decisionId);

    if (
      !returnChannelHasChecksum ||
      !matchingFeedbackRemainedAuthoritative ||
      !mismatchedFeedbackDowngraded ||
      !nextPacketIncludesMatchingDecision
    ) {
      throw new Error("Agent-packet return-loop smoke failed checksum binding assertions");
    }

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
      mismatchedFeedbackDeltaId: mismatchedFeedbackDelta.id,
      mismatchedFeedbackOutcome: mismatchedFeedbackOutcome ?? "missing",
      mismatchedFeedbackDowngraded,
      nextPacketGoverningDecisionIds: nextPacket.packet.governingDecisionIds,
      nextPacketIncludesMatchingDecision,
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
