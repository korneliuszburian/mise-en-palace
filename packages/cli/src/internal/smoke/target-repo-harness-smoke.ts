import {
  execFile,
  spawn
} from "node:child_process";
import {
  promisify
} from "node:util";
import type {
  Sql
} from "postgres";
import {
  runMigrationReadinessCheck,
  smokeFixtureClocks
} from "@krn/db/dev";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  HarnessRunAggregate
} from "@krn/core/repositories";
import type {
  EvidenceCommand,
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import {
  toEvidenceCommandReadback
} from "@krn/core";
import type {
  DatabaseRuntime
} from "../../database-runtime.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  isRecord,
  readRequiredRecord,
  readRequiredString,
  readRequiredStringArray
} from "./json-readers.js";
import {
  assertBrainStoreReady,
  createSmokeIdFactory,
  createSmokeDatabaseRuntime,
  createSmokeRepositories,
  completedOrNot,
  countMemoryRecordsBySmokeId,
  countRetrievalRunById,
  countRunEventsBySmokeId,
  countSourceArtifactsBySmokeId,
  countSourceClaimsBySmokeId,
  matchedOrMismatch,
  matchedWhen,
  metadataString,
  normalizeSmokeSlugPart,
  passedOrFailed,
  renderCodexBriefFromAggregate,
  sumCountRows,
  yesNo
} from "../../codex-brief-support.js";

const execFileAsync = promisify(execFile);

export interface TargetRepoHarnessSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  repoRoot: string;
  smokeId: string;
  targetRepoPath: string;
}

export interface TargetRepoHarnessSmokeReport {
  workspaceSlug: string;
  projectId: string;
  repoInstallationId: string;
  projectKernelId: string;
  sourceSeedPaths: readonly string[];
  ownerFilePaths: readonly string[];
  trustExclusionPatterns: readonly string[];
  executionRunId: string;
  readBackExecutionRunId: string;
  baselineCodexBriefRendered: boolean;
  baselineMemoryIncluded: boolean;
  baselineContextBytes: number;
  baselineApproximateTokens: number;
  codexBriefRendered: boolean;
  codexBriefMemoryRendered: boolean;
  groundedContextBytes: number;
  groundedApproximateTokens: number;
  evidenceBundleId: string;
  evidenceReadbackMatched: boolean;
  commandProofBoundary: "target_command_packet_bound";
  decisionPacketSurface: "mcp:krn_decision_packet";
  decisionPacketChecksum: string;
  decisionPacketEvidenceRef: string;
  decisionPacketMcpInitialized: boolean;
  decisionPacketMcpToolListed: boolean;
  decisionPacketMcpReadbackMatched: boolean;
  decisionPacketMemoryIncluded: boolean;
  decisionPacketReturnChannelBound: boolean;
  consumerTargetCommand: string;
  consumerTargetCommandStatus: "passed";
  consumerEvidenceBoundToPacket: boolean;
  sourceDecisionUsefulnessOutcome: "helped";
  reviewAssessmentId: string;
  reviewAssessmentReadbackMatched: boolean;
  feedbackDeltaId: string;
  feedbackDeltaReadbackMatched: boolean;
  memorySeedRecordId: string;
  memoryIncluded: boolean;
  memoryApplicationId: string;
  memoryUsefulnessOutcome: "helped";
  memoryUsefulnessReadbackMatched: boolean;
  memoryRecordDrift: "none";
  memoryPositiveFeedbackCount: number;
  automaticMemoryRecordMutation: "none";
  targetProjectLinked: boolean;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface CountRow {
  count: number;
}

type SmokeProjectRepository = ReturnType<typeof createSmokeRepositories>["projectRepository"];

interface CreateTargetFixtureProjectInput {
  projectRepository: SmokeProjectRepository;
  workspaceSlug: string;
  projectSlug: string;
  marker: string;
  repoFingerprint: string;
  repoPath: string;
}

interface TargetPlanReadbackProof {
  contextAssemblyId: string;
  codexBriefRendered: boolean;
  targetProjectLinked: boolean;
  memoryIncluded: boolean;
  memoryRendered: boolean;
  contextBytes: number;
  approximateTokens: number;
}

interface TargetEvidenceReadbackProof {
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
}

interface DecisionPacketConsumerProof {
  initialized: boolean;
  toolListed: boolean;
  checksum: string;
  evidenceRef: string;
  memoryIncluded: boolean;
  returnChannelBound: boolean;
}

interface TargetCommandProof {
  command: string;
  evidenceCommand: EvidenceCommand;
}

interface PacketBoundTargetEvidenceProof extends TargetEvidenceReadbackProof {
  consumerEvidenceBoundToPacket: boolean;
  targetCommand: string;
}

type EvidenceReadbackBundle = HarnessRunAggregate["evidenceBundles"][number];
type FeedbackReadbackDelta = HarnessRunAggregate["feedbackDeltas"][number];

interface IdRecord {
  id: string;
}

const targetFixtureSourceSeeds = [
  {
    path: "AGENTS.md",
    kind: "agent_guidance",
    reason: "target-local agent instructions and trust boundary"
  },
  {
    path: "README.md",
    kind: "repo_overview",
    reason: "target fixture purpose and setup overview"
  },
  {
    path: "docs",
    kind: "target_runbook",
    reason: "target operator runbook and planning guidance"
  },
  {
    path: "src",
    kind: "source_root",
    reason: "implementation owner-file root"
  },
  {
    path: "tests",
    kind: "test_root",
    reason: "behavior proof and test owner-file root"
  }
] as const;

const targetFixtureTrustExclusions = [
  {
    pathPattern: ".env*",
    reason: "secret-shaped environment files must not enter planning context"
  },
  {
    pathPattern: ".git/",
    reason: "repository internals are not planning source truth"
  },
  {
    pathPattern: "node_modules/",
    reason: "third-party install output is not target source truth"
  },
  {
    pathPattern: ".muke/",
    reason: "generated target state is not source truth by default"
  },
  {
    pathPattern: ".supersearch/runtime/",
    reason: "runtime search output is generated state"
  },
  {
    pathPattern: "dist/",
    reason: "build output is generated state"
  },
  {
    pathPattern: "build/",
    reason: "build output is generated state"
  }
] as const;

const targetFixtureOwnerFiles = [
  {
    path: "AGENTS.md",
    root: ".",
    kind: "agent_guidance",
    reason: "target-local agent instructions owner file"
  },
  {
    path: "docs/target-runbook.md",
    root: "docs",
    kind: "target_runbook",
    reason: "target planning runbook owner file"
  },
  {
    path: "src/index.ts",
    root: "src",
    kind: "implementation_entry",
    reason: "implementation readiness owner file"
  },
  {
    path: "tests/readiness.test.ts",
    root: "tests",
    kind: "behavior_test",
    reason: "test readiness owner file"
  }
] as const;

const countMarkerRows = async (
  client: Sql,
  marker: string,
  retrievalRunIds: readonly string[]
): Promise<number> => {
  let count = await sumCountRows([
    client<CountRow[]>`select count(*)::int as count from workspaces where metadata->>'fixtureMarker' = ${marker}`,
    client<CountRow[]>`select count(*)::int as count from projects where metadata->>'fixtureMarker' = ${marker}`,
    client<CountRow[]>`select count(*)::int as count from repo_installations where metadata->>'fixtureMarker' = ${marker}`,
    client<CountRow[]>`select count(*)::int as count from project_kernels where metadata->>'fixtureMarker' = ${marker}`,
    countRunEventsBySmokeId(client, marker),
    client<CountRow[]>`select count(*)::int as count from memory_applications where metadata->>'smokeId' = ${marker}`,
    countMemoryRecordsBySmokeId(client, marker),
    client<CountRow[]>`select count(*)::int as count from source_decision_edges where metadata->>'smokeId' = ${marker}`,
    client<CountRow[]>`select count(*)::int as count from source_decisions where metadata->>'smokeId' = ${marker}`,
    countSourceClaimsBySmokeId(client, marker),
    countSourceArtifactsBySmokeId(client, marker)
  ]);

  for (const retrievalRunId of retrievalRunIds) {
    count += await sumCountRows([countRetrievalRunById(client, retrievalRunId)]);
  }

  return count;
};

const cleanupMarkerRows = async (
  client: Sql,
  marker: string,
  retrievalRunIds: readonly string[]
): Promise<number> => {
  await client`delete from memory_applications where metadata->>'smokeId' = ${marker}`;
  await client`delete from memory_records where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
  await client`delete from outbox_events where payload->>'sourceClaimId' in (
    select id::text from source_claims where metadata->>'smokeId' = ${marker}
  )`;
  await client`delete from source_claims where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
  await client`delete from run_events where payload->>'smokeId' = ${marker}`;

  for (const retrievalRunId of retrievalRunIds) {
    await client`delete from retrieval_runs where id = ${retrievalRunId}`;
  }

  await client`delete from workspaces where metadata->>'fixtureMarker' = ${marker}`;

  return countMarkerRows(client, marker, retrievalRunIds);
};

const createTargetFixtureProject = async (
  input: CreateTargetFixtureProjectInput
) => {
  const fixtureMetadata = {
    smoke: true,
    fixtureMarker: input.marker
  };
  const workspace = await input.projectRepository.createWorkspace({
    slug: input.workspaceSlug,
    displayName: input.workspaceSlug,
    metadata: fixtureMetadata
  });
  const project = await input.projectRepository.createProject({
    workspaceId: workspace.id,
    slug: input.projectSlug,
    displayName: "krn-fixture-typescript-basic",
    metadata: {
      ...fixtureMetadata,
      repoFingerprint: input.repoFingerprint,
      repoPath: input.repoPath,
      sourceSeeds: targetFixtureSourceSeeds,
      ownerFiles: targetFixtureOwnerFiles,
      trustExclusions: targetFixtureTrustExclusions
    }
  });

  return { workspace, project };
};

const targetPlanReadbackProof = (
  input: {
    aggregate: HarnessRunAggregate;
    executionRunId: string;
    projectId: string;
    memoryRecordId: string;
    renderedBrief: string;
    missingContextMessage: string;
    memoryRendered: boolean;
  }
): TargetPlanReadbackProof => {
  const contextAssembly = input.aggregate.contextAssembly;

  if (contextAssembly === undefined) {
    throw new Error(input.missingContextMessage);
  }

  const codexBriefRendered =
    input.renderedBrief.includes("KRN Codex Execution Brief") &&
    input.renderedBrief.includes("Objective: improve test script readiness");
  const targetProjectLinked =
    input.aggregate.operatorIntent.projectId === input.projectId &&
    input.aggregate.taskContract.projectId === input.projectId;
  const memoryIncluded = contextAssembly.inclusions.some((inclusion) =>
    inclusion.subjectType === "memory_record" &&
    inclusion.subjectId === input.memoryRecordId
  );
  const contextBytes = Buffer.byteLength(input.renderedBrief, "utf8");

  return {
    contextAssemblyId: contextAssembly.id,
    codexBriefRendered,
    targetProjectLinked,
    memoryIncluded,
    memoryRendered: input.memoryRendered,
    contextBytes,
    approximateTokens: Math.ceil(contextBytes / 4)
  };
};

const assertTargetPlanReadback = (
  input: {
    aggregate: HarnessRunAggregate;
    executionRunId: string;
    projectId: string;
    memoryRecordId: string;
    renderedBrief: string;
  }
): TargetPlanReadbackProof => {
  const proof = targetPlanReadbackProof({
    ...input,
    missingContextMessage: "Target repo harness smoke failed to read back persisted run",
    // Grounded proof is a strict hit: the brief must expose the typed context row and the id.
    memoryRendered: input.renderedBrief.includes(`memory_record:${input.memoryRecordId}`) &&
      input.renderedBrief.includes(input.memoryRecordId)
  });
  const proofChecks = [
    input.aggregate.executionRun.id === input.executionRunId,
    proof.codexBriefRendered,
    proof.targetProjectLinked,
    proof.memoryIncluded,
    proof.memoryRendered,
    proof.contextBytes > 0
  ];

  if (proofChecks.some((passed) => !passed)) {
    throw new Error("Target repo harness smoke readback did not match expected project proof");
  }

  return proof;
};

const assertTargetBaselineReadback = (
  input: {
    aggregate: HarnessRunAggregate;
    executionRunId: string;
    projectId: string;
    memoryRecordId: string;
    renderedBrief: string;
  }
): TargetPlanReadbackProof => {
  const proof = targetPlanReadbackProof({
    ...input,
    missingContextMessage: "Target repo harness smoke failed to read back baseline run",
    // Baseline proof is a strict miss: a target memory id mention would weaken the baseline.
    memoryRendered: input.renderedBrief.includes(`memory_record:${input.memoryRecordId}`) ||
      input.renderedBrief.includes(input.memoryRecordId)
  });
  const proofChecks = [
    input.aggregate.executionRun.id === input.executionRunId,
    proof.codexBriefRendered,
    proof.targetProjectLinked,
    !proof.memoryIncluded,
    !proof.memoryRendered,
    proof.contextBytes > 0
  ];

  if (proofChecks.some((passed) => !passed)) {
    throw new Error("Target repo harness smoke baseline did not prove memory absence");
  }

  return proof;
};

const findById = <T extends IdRecord>(
  items: readonly T[],
  id: string
): T | undefined => items.find((item) => item.id === id);

const feedbackDeltaHasNoMutations = (
  feedbackDelta: FeedbackReadbackDelta | undefined
): boolean =>
  feedbackDelta !== undefined &&
  feedbackDelta.memoryCandidates.length === 0 &&
  feedbackDelta.sourceDecisions.length === 0 &&
  feedbackDelta.evalCandidates.length === 0;

const sourceUsefulnessOutcome = (input: {
  readonly decisionId: string;
  readonly evidenceRef: string;
  readonly reason: string;
}): SourceUsefulnessOutcomeFeedback => ({
  sourceDecisionId: input.decisionId,
  outcome: "helped",
  reason: input.reason,
  evidenceRefs: [input.evidenceRef],
  doesNotProve:
    "Target-repo consumer proof does not prove arbitrary Codex obedience or source truth outside this packet-bound run."
});

const createDecisionPacketConsumerRuntime = (input: {
  readonly compilerDependencies: DatabaseRuntime["compilerDependencies"];
  readonly harnessRunRepository: DatabaseRuntime["harnessRunRepository"];
  readonly memoryRepository: DatabaseRuntime["memoryRepository"];
  readonly projectId: string;
  readonly retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]>;
  readonly sourceRepository: DatabaseRuntime["sourceRepository"];
  readonly workspaceId: string;
}): DatabaseRuntime => ({
  workspaceId: input.workspaceId,
  projectId: input.projectId,
  compilerDependencies: input.compilerDependencies,
  harnessRunRepository: input.harnessRunRepository,
  sourceRepository: input.sourceRepository,
  retrievalRepository: input.retrievalRepository,
  memoryRepository: input.memoryRepository,
  async close(): Promise<void> {
    // The smoke owns the shared SQL client and closes it after cleanup.
  }
});

const decisionPacketMcpRequests = (runId: string): readonly Record<string, unknown>[] => [
  {
    jsonrpc: "2.0",
    id: "initialize",
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "krn-target-repo-harness-smoke",
        version: "0.0.0"
      }
    }
  },
  {
    jsonrpc: "2.0",
    method: "notifications/initialized"
  },
  {
    jsonrpc: "2.0",
    id: "tools-list",
    method: "tools/list"
  },
  {
    jsonrpc: "2.0",
    id: "tools-call",
    method: "tools/call",
    params: {
      name: "krn_decision_packet",
      arguments: {
        runId
      }
    }
  }
];

const responseById = (
  responses: readonly Record<string, unknown>[],
  id: string
): Record<string, unknown> => {
  const response = responses.find((item) => item["id"] === id);

  if (response === undefined) {
    throw new Error(`Target repo harness smoke external MCP client missed response ${id}`);
  }

  if (response["error"] !== undefined) {
    throw new Error(`Target repo harness smoke external MCP client returned error for ${id}`);
  }

  return response;
};

const parseMcpResponseLine = (line: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(line);

  if (!isRecord(parsed)) {
    throw new Error("Target repo harness smoke external MCP response was not an object");
  }

  return parsed;
};

const runExternalDecisionPacketMcpClient = async (input: {
  readonly databaseUrl: string;
  readonly repoRoot: string;
  readonly runId: string;
}): Promise<readonly Record<string, unknown>[]> => {
  const child = spawn(
    "pnpm",
    ["--silent", "--filter", "@krn/cli", "mcp:decision-packet"],
    {
      cwd: input.repoRoot,
      env: {
        ...process.env,
        KRN_DATABASE_URL: input.databaseUrl
      },
      stdio: ["pipe", "pipe", "pipe"]
    }
  );
  const requests = decisionPacketMcpRequests(input.runId)
    .map((request) => JSON.stringify(request))
    .join("\n") + "\n";
  const expectedResponses = 3;
  const timeoutMs = 20_000;
  let stdoutBuffer = "";
  let stderrBuffer = "";
  let settled = false;

  return await new Promise<readonly Record<string, unknown>[]>((resolve, reject) => {
    const responses: Record<string, unknown>[] = [];
    const fail = (error: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      child.kill("SIGTERM");
      reject(error);
    };
    const finish = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      child.kill("SIGTERM");
      resolve(responses);
    };
    const timeout = setTimeout(() => {
      fail(new Error(
        `Target repo harness smoke external MCP client timed out after ${timeoutMs}ms. stderr: ${stderrBuffer}`
      ));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();

      for (;;) {
        const lineEnd = stdoutBuffer.indexOf("\n");

        if (lineEnd === -1) {
          break;
        }
        const line = stdoutBuffer.slice(0, lineEnd).trim();
        stdoutBuffer = stdoutBuffer.slice(lineEnd + 1);

        if (line.length === 0) {
          continue;
        }

        try {
          responses.push(parseMcpResponseLine(line));
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
          return;
        }

        if (responses.length >= expectedResponses) {
          finish();
          return;
        }
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
    });
    child.on("error", (error) => {
      fail(error);
    });
    child.on("exit", (code) => {
      if (!settled && responses.length < expectedResponses) {
        fail(new Error(
          `Target repo harness smoke external MCP client exited with ${code ?? "signal"} before all responses. stderr: ${stderrBuffer}`
        ));
      }
    });

    if (child.stdin === null) {
      fail(new Error("Target repo harness smoke external MCP client stdin was unavailable"));
      return;
    }
    child.stdin.end(requests);
  });
};

const readMcpDecisionPacketProof = async (input: {
  readonly databaseUrl: string;
  readonly executionRunId: string;
  readonly memoryRecordId: string;
  readonly repoRoot: string;
}): Promise<DecisionPacketConsumerProof> => {
  const responses = await runExternalDecisionPacketMcpClient({
    databaseUrl: input.databaseUrl,
    repoRoot: input.repoRoot,
    runId: input.executionRunId
  });
  const initialize = readRequiredRecord(
    responseById(responses, "initialize"),
    "result",
    "Target repo harness smoke expected external MCP initialize result"
  );
  const instructions = readRequiredString(
    initialize,
    "instructions",
    "Target repo harness smoke expected external MCP instructions"
  );
  const toolsList = readRequiredRecord(
    responseById(responses, "tools-list"),
    "result",
    "Target repo harness smoke expected external MCP tools/list result"
  );
  const tools = Array.isArray(toolsList["tools"]) ? toolsList["tools"] : [];
  const toolListed = tools.some((tool) =>
    isRecord(tool) && tool["name"] === "krn_decision_packet"
  );
  const callResult = readRequiredRecord(
    responseById(responses, "tools-call"),
    "result",
    "Target repo harness smoke expected external MCP tools/call result"
  );

  if (callResult["isError"] === true) {
    throw new Error("Target repo harness smoke external MCP tools/call returned an error");
  }

  const structuredContent = callResult["structuredContent"];

  if (!isRecord(structuredContent)) {
    throw new Error("Target repo harness smoke external MCP response missed structured DecisionPacket content");
  }

  const packetIdentity = readRequiredRecord(
    structuredContent,
    "packetIdentity",
    "Target repo harness smoke expected packetIdentity object in DecisionPacket MCP output"
  );
  const packet = readRequiredRecord(
    structuredContent,
    "packet",
    "Target repo harness smoke expected packet object in DecisionPacket MCP output"
  );
  const returnChannels = readRequiredRecord(
    structuredContent,
    "returnChannels",
    "Target repo harness smoke expected returnChannels object in DecisionPacket MCP output"
  );
  const evidence = readRequiredRecord(
    returnChannels,
    "evidence",
    "Target repo harness smoke expected evidence object in DecisionPacket MCP output"
  );
  const feedback = readRequiredRecord(
    returnChannels,
    "feedback",
    "Target repo harness smoke expected feedback object in DecisionPacket MCP output"
  );
  const checksum = readRequiredString(
    packetIdentity,
    "checksum",
    "Target repo harness smoke expected checksum string in DecisionPacket MCP output"
  );
  const evidenceRef = readRequiredString(
    packetIdentity,
    "evidenceRef",
    "Target repo harness smoke expected evidenceRef string in DecisionPacket MCP output"
  );
  const memoryRefs = readRequiredStringArray(
    packet,
    "memoryRefs",
    "Target repo harness smoke expected memoryRefs string array in DecisionPacket MCP output"
  );
  const persistedCommand = readRequiredString(
    evidence,
    "persistedCommand",
    "Target repo harness smoke expected persistedCommand string in DecisionPacket MCP output"
  );
  const sourceDecisionUsefulnessExample = readRequiredString(
    feedback,
    "sourceDecisionUsefulnessExample",
    "Target repo harness smoke expected sourceDecisionUsefulnessExample string in DecisionPacket MCP output"
  );

  return {
    initialized: instructions.includes("Use krn_decision_packet"),
    toolListed,
    checksum,
    evidenceRef,
    memoryIncluded: memoryRefs.includes(input.memoryRecordId),
    returnChannelBound:
      evidenceRef === `packet:${checksum}` &&
      persistedCommand.includes(checksum) &&
      sourceDecisionUsefulnessExample.includes(evidenceRef)
  };
};

const runTargetFixtureCommand = async (
  targetRepoPath: string,
  marker: string
): Promise<TargetCommandProof> => {
  const command = `pnpm --dir ${targetRepoPath} test`;

  await execFileAsync("pnpm", ["--dir", targetRepoPath, "test"], {
    cwd: process.cwd()
  });

  return {
    command,
    evidenceCommand: {
      command,
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: smokeFixtureClocks.targetRepoHarness.now,
      outputRef: `target-command:${marker}:typescript-basic-test`,
      assertedBy: "target-repo-harness-smoke",
      doesNotProve:
        "Target fixture typecheck proves this fixture command passed; it does not prove arbitrary target repos or live Codex edits."
    }
  };
};

const commandBundleHasTargetProof = (
  evidenceBundle: EvidenceReadbackBundle | undefined,
  targetCommand: string
): boolean =>
  evidenceBundle?.commands.some((command) => {
    const evidenceCommand = toEvidenceCommandReadback(command);

    return evidenceCommand.command === targetCommand &&
      evidenceCommand.kind === "command_runner" &&
      evidenceCommand.status === "passed";
  }) ?? false;

const feedbackDeltaHasPacketBoundSourceDecisionOutcome = (
  feedbackDelta: FeedbackReadbackDelta | undefined,
  input: {
    readonly decisionPacketChecksum: string;
    readonly sourceDecisionId: string;
  }
): boolean => {
  if (feedbackDelta === undefined) {
    return false;
  }

  const outcomes = feedbackDelta.metadata["sourceUsefulnessOutcomes"];

  return feedbackDelta.metadata["decisionPacketChecksum"] === input.decisionPacketChecksum &&
    Array.isArray(outcomes) &&
    outcomes.some((outcome) =>
      isRecord(outcome) &&
      outcome["sourceDecisionId"] === input.sourceDecisionId &&
      outcome["outcome"] === "helped"
    );
};

const readbackProofIds = (
  aggregate: HarnessRunAggregate,
  expected: TargetEvidenceReadbackProof
): TargetEvidenceReadbackProof | undefined => {
  const evidenceBundleId = findById(aggregate.evidenceBundles, expected.evidenceBundleId)?.id;
  const reviewAssessmentId = findById(aggregate.reviewAssessments, expected.reviewAssessmentId)?.id;
  const feedbackDeltaId = findById(aggregate.feedbackDeltas, expected.feedbackDeltaId)?.id;

  if (
    evidenceBundleId === undefined ||
    reviewAssessmentId === undefined ||
    feedbackDeltaId === undefined
  ) {
    return undefined;
  }

  return {
    evidenceBundleId,
    reviewAssessmentId,
    feedbackDeltaId
  };
};

const assertTargetEvidenceReadback = (
  aggregate: HarnessRunAggregate | undefined,
  expected: TargetEvidenceReadbackProof,
  input: {
    readonly decisionPacketChecksum: string;
    readonly sourceDecisionId: string;
    readonly targetCommand: string;
  }
): TargetEvidenceReadbackProof => {
  if (aggregate === undefined) {
    throw new Error("Target repo harness smoke failed to read back evidence aggregate");
  }

  const readBackEvidenceBundle = findById(aggregate.evidenceBundles, expected.evidenceBundleId);
  const readBackFeedbackDelta = findById(aggregate.feedbackDeltas, expected.feedbackDeltaId);
  const proofIds = readbackProofIds(aggregate, expected);

  if (
    proofIds === undefined ||
    !commandBundleHasTargetProof(readBackEvidenceBundle, input.targetCommand) ||
    !feedbackDeltaHasNoMutations(readBackFeedbackDelta) ||
    !feedbackDeltaHasPacketBoundSourceDecisionOutcome(readBackFeedbackDelta, {
      decisionPacketChecksum: input.decisionPacketChecksum,
      sourceDecisionId: input.sourceDecisionId
    })
  ) {
    throw new Error("Target repo harness smoke evidence readback did not preserve proof boundaries");
  }

  return proofIds;
};

const capturePacketBoundTargetEvidence = async (input: {
  readonly createId: (prefix: string) => string;
  readonly databaseUrl: string;
  readonly decisionPacketProof: DecisionPacketConsumerProof;
  readonly decisionRuntime: DatabaseRuntime;
  readonly executionRunId: string;
  readonly harnessRunRepository: DatabaseRuntime["harnessRunRepository"];
  readonly marker: string;
  readonly now: string;
  readonly sourceDecisionId: string;
  readonly targetRepoPath: string;
}): Promise<PacketBoundTargetEvidenceProof> => {
  const targetCommandProof = await runTargetFixtureCommand(input.targetRepoPath, input.marker);
  const evidenceCapture = await runEvidenceCaptureCommand({
    env: {
      KRN_DATABASE_URL: input.databaseUrl
    },
    cwd: process.cwd(),
    now: () => input.now,
    createId: input.createId,
    persist: true,
    runId: input.executionRunId,
    decisionPacketChecksum: input.decisionPacketProof.checksum,
    commandOutcomes: [targetCommandProof.evidenceCommand],
    targetEvidence: {
      targetRepo: input.targetRepoPath,
      mode: "observation_only",
      dirtyBefore: "clean",
      dirtyAfter: "clean",
      ownedChanges: "external",
      targetStatusFreshness: "fresh_current_task",
      targetPatchLifecycle: "none",
      allowedWrites: [],
      forbiddenWrites: ["target source edits"],
      changedFiles: [],
      commands: [targetCommandProof.command],
      doesNotProve: [
        "Target command proof does not prove live Codex followed the DecisionPacket.",
        "No target repository files were edited in this consumer proof."
      ]
    },
    sourceUsefulnessOutcomes: [
      sourceUsefulnessOutcome({
        decisionId: input.sourceDecisionId,
        evidenceRef: input.decisionPacketProof.evidenceRef,
        reason:
          "MCP DecisionPacket selected target fixture memory before the headless target command passed."
      })
    ],
    readGitStatus: async () => "",
    createDatabaseRuntime: async () => input.decisionRuntime
  });
  const evidenceAggregate =
    await input.harnessRunRepository.getHarnessRunByExecutionRunId(input.executionRunId);
  const evidenceBundle = evidenceAggregate?.evidenceBundles.at(-1);
  const reviewAssessment = evidenceAggregate?.reviewAssessments.at(-1);
  const feedbackDelta = evidenceAggregate?.feedbackDeltas.at(-1);

  if (
    evidenceBundle === undefined ||
    reviewAssessment === undefined ||
    feedbackDelta === undefined
  ) {
    throw new Error("Target repo harness smoke did not persist packet-bound evidence");
  }

  const proof = assertTargetEvidenceReadback(
    evidenceAggregate,
    {
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id
    },
    {
      decisionPacketChecksum: input.decisionPacketProof.checksum,
      sourceDecisionId: input.sourceDecisionId,
      targetCommand: targetCommandProof.command
    }
  );
  const consumerEvidenceBoundToPacket =
    evidenceCapture.stdout.includes(`decisionPacketEvidenceRef: ${input.decisionPacketProof.evidenceRef}`);

  if (!consumerEvidenceBoundToPacket) {
    throw new Error("Target repo harness smoke evidence output did not bind to the DecisionPacket checksum");
  }

  return {
    ...proof,
    consumerEvidenceBoundToPacket,
    targetCommand: targetCommandProof.command
  };
};

const reportLines = (report: TargetRepoHarnessSmokeReport): string[] => [
  `Workspace smoke row: ${report.workspaceSlug}`,
  `Project: ${report.projectId}`,
  `Repo installation: ${report.repoInstallationId}`,
  `ProjectKernel: ${report.projectKernelId}`,
  `Target source seeds: ${report.sourceSeedPaths.join(", ")}`,
  `Target owner files: ${report.ownerFilePaths.join(", ")}`,
  `Target trust exclusions: ${report.trustExclusionPatterns.join(", ")}`,
  `Execution run: ${report.executionRunId}`,
  `Readback: ${matchedOrMismatch(report.readBackExecutionRunId, report.executionRunId)}`,
  `Baseline Codex brief rendered: ${yesNo(report.baselineCodexBriefRendered)}`,
  `Baseline memory included: ${yesNo(report.baselineMemoryIncluded)}`,
  `Baseline context bytes: ${report.baselineContextBytes}`,
  `Baseline approximate tokens: ${report.baselineApproximateTokens}`,
  `Codex brief rendered: ${yesNo(report.codexBriefRendered)}`,
  `Codex brief memory rendered: ${yesNo(report.codexBriefMemoryRendered)}`,
  `Grounded context bytes: ${report.groundedContextBytes}`,
  `Grounded approximate tokens: ${report.groundedApproximateTokens}`,
  `Evidence bundle: ${report.evidenceBundleId}`,
  `Evidence readback: ${matchedWhen(report.evidenceReadbackMatched)}`,
  `Command proof boundary: ${report.commandProofBoundary}`,
  `DecisionPacket surface: ${report.decisionPacketSurface}`,
  `DecisionPacket checksum: ${report.decisionPacketChecksum}`,
  `DecisionPacket evidence ref: ${report.decisionPacketEvidenceRef}`,
  `DecisionPacket MCP initialized: ${matchedWhen(report.decisionPacketMcpInitialized)}`,
  `DecisionPacket MCP tool listed: ${matchedWhen(report.decisionPacketMcpToolListed)}`,
  `DecisionPacket MCP readback: ${matchedWhen(report.decisionPacketMcpReadbackMatched)}`,
  `DecisionPacket memory included: ${yesNo(report.decisionPacketMemoryIncluded)}`,
  `DecisionPacket return channel bound: ${yesNo(report.decisionPacketReturnChannelBound)}`,
  `Consumer target command: ${report.consumerTargetCommand}`,
  `Consumer target command status: ${report.consumerTargetCommandStatus}`,
  `Consumer evidence bound to packet: ${yesNo(report.consumerEvidenceBoundToPacket)}`,
  `Source decision usefulness outcome: ${report.sourceDecisionUsefulnessOutcome}`,
  `Review assessment: ${report.reviewAssessmentId}`,
  `Review assessment readback: ${matchedWhen(report.reviewAssessmentReadbackMatched)}`,
  `Feedback delta: ${report.feedbackDeltaId}`,
  `Feedback delta readback: ${matchedWhen(report.feedbackDeltaReadbackMatched)}`,
  `Memory seed record: ${report.memorySeedRecordId}`,
  `Memory included: ${yesNo(report.memoryIncluded)}`,
  `Memory application: ${report.memoryApplicationId}`,
  `Memory usefulness outcome: ${report.memoryUsefulnessOutcome}`,
  `Memory usefulness readback: ${matchedWhen(report.memoryUsefulnessReadbackMatched)}`,
  `Memory record drift: ${report.memoryRecordDrift}`,
  `Memory positive feedback count: ${report.memoryPositiveFeedbackCount}`,
  `Automatic MemoryRecord mutation: ${report.automaticMemoryRecordMutation}`,
  `Target project linked: ${yesNo(report.targetProjectLinked)}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${completedOrNot(report.cleanedUp)}`,
  `Target repo harness smoke: ${passedOrFailed(report.cleanedUp)}`
];

export const formatTargetRepoHarnessSmokeReport = (
  report: TargetRepoHarnessSmokeReport
): string =>
  [
    "KRN Target Repo Harness Smoke",
    ...reportLines(report)
  ].join("\n") + "\n";

export const formatTargetRepoHarnessSmokeReportLines = reportLines;

export const runTargetRepoHarnessSmokeCheck = async (
  input: TargetRepoHarnessSmokeInput
): Promise<TargetRepoHarnessSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  assertBrainStoreReady(readiness, "Brain store is not ready for target repo harness smoke");

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const workspaceSlug = `krn-target-repo-harness-smoke-${marker}`;
  const projectSlug = `typescript-basic-${marker}`;
  const repoFingerprint = `target-repo-harness:${marker}`;
  const repoPath = `${input.targetRepoPath}#${marker}`;
  const now = smokeFixtureClocks.targetRepoHarness.now;
  const { client, db } = createSmokeDatabaseRuntime(input.databaseUrl);
  const retrievalRunIds: string[] = [];

  try {
    await cleanupMarkerRows(client, marker, retrievalRunIds);

    const {
      projectRepository,
      harnessRunRepository,
      sourceRepository,
      memoryRepository,
      retrievalRepository
    } = createSmokeRepositories(db);
    const { workspace, project } = await createTargetFixtureProject({
      projectRepository,
      workspaceSlug,
      projectSlug,
      marker,
      repoFingerprint,
      repoPath
    });
    const repoInstallation = await projectRepository.createRepoInstallation({
      projectId: project.id,
      provider: "local",
      repoUrl: `file://${repoPath}`,
      defaultBranch: "main",
      repoFingerprint,
      localPathHint: repoPath,
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions
      }
    });
    const projectKernel = await projectRepository.createProjectKernel({
      projectId: project.id,
      version: 1,
      summary: "Fixture target repo connected for full harness smoke",
      activeContextRule: "select project-scoped source, memory, retrieval, and anti-memory only",
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions
      }
    });
    const createSmokeId = createSmokeIdFactory(marker);
    const baselineResult = await compileHarnessPlan(
      {
        workspaceId: workspace.id,
        projectId: project.id,
        operatorIntent: {
          rawIntent: "improve test script readiness",
          source: "cli",
          metadata: {
            smokeId: marker,
            phase: "baseline"
          }
        },
        taskContract: {
          title: "improve test script readiness",
          objective: "improve test script readiness",
          constraints: [
            "use the target repo project scope",
            "do not mutate fixture files"
          ],
          nonGoals: [
            "do not invoke Codex",
            "do not create dashboard"
          ],
          acceptance: [
            "project-scoped plan persisted",
            "Codex brief rendered",
            "memory baseline miss recorded"
          ],
          metadata: {
            smokeId: marker,
            phase: "baseline"
          }
        },
        tokenBudget: 420,
        metadata: {
          command: "db:smoke:target-repo-harness",
          smokeId: marker,
          phase: "baseline",
          projectKernelId: projectKernel.id,
          repoInstallationIds: [repoInstallation.id]
        }
      },
      {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository,
        now: () => now,
        createId: createSmokeId
      }
    );
    const baselineRetrievalRunId = metadataString(baselineResult.contextAssembly.metadata, "retrievalRunId");

    if (baselineRetrievalRunId === undefined) {
      throw new Error("Target repo harness smoke did not create a baseline retrieval run");
    }

    retrievalRunIds.push(baselineRetrievalRunId);
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://target-repo-harness-smoke/${marker}`,
      title: "Target repo harness smoke memory source",
      contentHash: `target-repo-harness-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      claim: "Target fixture readiness memory should help target-like planning when scoped to the same project.",
      mechanism: "A reviewed, project-scoped MemoryRecord is available before planning and can be selected as bounded context.",
      krnImplication: "Target-like runs can measure whether selected memory helped without automatically promoting new memory.",
      doesNotProve: "This does not prove memory usefulness on arbitrary external repositories.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "V03 target memory usefulness smoke",
      falsifier: "The smoke cannot activate the memory or record helped feedback for the run.",
      revisitWhen: "Target memory usefulness semantics change.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const sourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: sourceClaim.id,
      status: "adopt",
      decision: "Adopt target fixture readiness memory as bounded planning support.",
      rationale:
        "The target repo harness smoke needs accepted source support before treating the MemoryRecord as governed context.",
      consumer: "V03 target memory usefulness smoke",
      falsifier: "The memory appears in plan/brief context without an accepted SourceClaim decision.",
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `target-repo-harness:${marker}:readiness-memory`,
      kind: "procedure",
      status: "active",
      summary: "Target fixture readiness memory supports scoped planning.",
      body:
        "Use this memory when improving test script readiness in the TypeScript target fixture; keep source seeds, owner files, evidence, and readback bounded to the target project.",
      owner: "krn-cli-smoke",
      confidence: 92,
      applicationGuidance:
        "Use for target fixture readiness planning only; record helped/neutral/hurt outcome after the run.",
      invalidationRule: "Revisit when target fixture readiness behavior changes.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      validFrom: now,
      metadata: {
        smokeId: marker,
        fixtureMemory: true
      }
    });
    const baselineExecutionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: baselineResult.harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.target_repo_harness.baseline",
        message: "Target repo harness smoke baseline run created",
        payload: {
          smokeId: marker,
          projectId: project.id,
          memoryRecordId: memoryRecord.id
        }
      },
      metadata: {
        smokeId: marker,
        phase: "baseline",
        command: "db:smoke:target-repo-harness"
      }
    });
    const baselineAggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(baselineExecutionRun.id);

    if (baselineAggregate === undefined) {
      throw new Error("Target repo harness smoke failed to read back baseline run");
    }

    const { renderedBrief: baselineRenderedBrief } = renderCodexBriefFromAggregate({
      aggregate: baselineAggregate,
      createdAt: now,
      createId: (prefix) => `${prefix}-${marker}-baseline-readback`,
      nextActionFallback: "Use this brief as the next Codex input.",
      missingContextMessage: "Target repo harness smoke failed to read back baseline run"
    });
    const baselineProof = assertTargetBaselineReadback({
      aggregate: baselineAggregate,
      executionRunId: baselineExecutionRun.id,
      projectId: project.id,
      memoryRecordId: memoryRecord.id,
      renderedBrief: baselineRenderedBrief
    });
    const result = await compileHarnessPlan(
      {
        workspaceId: workspace.id,
        projectId: project.id,
        operatorIntent: {
          rawIntent: "improve test script readiness",
          source: "cli",
          metadata: {
            smokeId: marker
          }
        },
        taskContract: {
          title: "improve test script readiness",
          objective: "improve test script readiness",
          constraints: [
            "use the target repo project scope",
            "do not mutate fixture files"
          ],
          nonGoals: [
            "do not invoke Codex",
            "do not create dashboard"
          ],
          acceptance: [
            "project-scoped plan persisted",
            "Codex brief rendered",
            "evidence captured",
            "cleanup count zero"
          ],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 420,
        metadata: {
          command: "db:smoke:target-repo-harness",
          smokeId: marker,
          projectKernelId: projectKernel.id,
          repoInstallationIds: [repoInstallation.id]
        }
      },
      {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository,
        now: () => now,
        createId: createSmokeId
      }
    );
    const retrievalRunId = metadataString(result.contextAssembly.metadata, "retrievalRunId");

    if (retrievalRunId === undefined) {
      throw new Error("Target repo harness smoke did not create a retrieval run");
    }

    retrievalRunIds.push(retrievalRunId);

    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: result.harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.target_repo_harness.persisted",
        message: "Target repo harness smoke persisted run created",
        payload: {
          smokeId: marker,
          projectId: project.id,
          projectKernelId: projectKernel.id,
          repoInstallationId: repoInstallation.id,
          sourceSeeds: targetFixtureSourceSeeds,
          ownerFiles: targetFixtureOwnerFiles,
          trustExclusions: targetFixtureTrustExclusions
        }
      },
      metadata: {
        smokeId: marker,
        command: "db:smoke:target-repo-harness",
        projectKernelId: projectKernel.id,
        repoInstallationIds: [repoInstallation.id],
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions,
        codexAdapterPlanRef: result.codexAdapterPlanRef,
        evidenceContract: result.evidenceContract
      }
    });
    const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);

    if (aggregate === undefined) {
      throw new Error("Target repo harness smoke failed to read back persisted run");
    }

    const { renderedBrief } = renderCodexBriefFromAggregate({
      aggregate,
      createdAt: now,
      createId: (prefix) => `${prefix}-${marker}-readback`,
      nextActionFallback: "Use this brief as the next Codex input.",
      missingContextMessage: "Target repo harness smoke failed to read back persisted run"
    });
    const planProof = assertTargetPlanReadback({
      aggregate,
      executionRunId: executionRun.id,
      projectId: project.id,
      memoryRecordId: memoryRecord.id,
      renderedBrief
    });
    await sourceRepository.createSourceDecisionEdge({
      sourceClaimId: sourceClaim.id,
      targetType: "harness_run",
      targetId: executionRun.id,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "Accepted source support backs the memory-assisted plan/brief smoke.",
      metadata: {
        smokeId: marker,
        sourceDecisionId: sourceDecision.id
      }
    });
    const memoryApplication = await memoryRepository.recordMemoryApplication({
      memoryRecordId: memoryRecord.id,
      executionRunId: executionRun.id,
      taskContractId: aggregate.taskContract.id,
      contextAssemblyId: planProof.contextAssemblyId,
      expectedUse: "Use target fixture readiness memory to keep planning scoped and reviewable.",
      outcome: "helped",
      notes: "Memory helped keep the target fixture harness smoke scoped to source seeds, owner files, evidence, and readback.",
      metadata: {
        smokeId: marker,
        command: "db:smoke:target-repo-harness"
      }
    });
    const readBackMemoryRecord = await memoryRepository.getMemoryRecordById(memoryRecord.id);

    if (
      readBackMemoryRecord === undefined ||
      readBackMemoryRecord.positiveFeedbackCount < memoryRecord.positiveFeedbackCount + 1
    ) {
      throw new Error("Target repo harness smoke memory usefulness readback did not match");
    }

    const memoryRecordContentUnchanged =
      readBackMemoryRecord.status === memoryRecord.status &&
      readBackMemoryRecord.summary === memoryRecord.summary &&
      readBackMemoryRecord.body === memoryRecord.body &&
      readBackMemoryRecord.applicationGuidance === memoryRecord.applicationGuidance &&
      readBackMemoryRecord.invalidationRule === memoryRecord.invalidationRule &&
      JSON.stringify(readBackMemoryRecord.sourceLineage) === JSON.stringify(memoryRecord.sourceLineage) &&
      JSON.stringify(readBackMemoryRecord.metadata) === JSON.stringify(memoryRecord.metadata);

    if (!memoryRecordContentUnchanged) {
      throw new Error("Target repo harness smoke mutated MemoryRecord content/status metadata");
    }

    const compilerDependencies = {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository,
      now: () => now,
      createId: createSmokeId
    };
    const decisionRuntime = createDecisionPacketConsumerRuntime({
      compilerDependencies,
      harnessRunRepository,
      memoryRepository,
      projectId: project.id,
      retrievalRepository,
      sourceRepository,
      workspaceId: workspace.id
    });
    const decisionPacketProof = await readMcpDecisionPacketProof({
      databaseUrl: input.databaseUrl,
      executionRunId: executionRun.id,
      memoryRecordId: memoryRecord.id,
      repoRoot: input.repoRoot
    });

    if (
      !decisionPacketProof.initialized ||
      !decisionPacketProof.toolListed ||
      !decisionPacketProof.memoryIncluded ||
      !decisionPacketProof.returnChannelBound
    ) {
      throw new Error("Target repo harness smoke DecisionPacket MCP proof was not packet-bound");
    }

    const evidenceProof = await capturePacketBoundTargetEvidence({
      createId: createSmokeId,
      databaseUrl: input.databaseUrl,
      decisionPacketProof,
      decisionRuntime,
      executionRunId: executionRun.id,
      harnessRunRepository,
      marker,
      now,
      sourceDecisionId: sourceDecision.id,
      targetRepoPath: input.targetRepoPath
    });

    const remainingMarkerCount = await cleanupMarkerRows(client, marker, retrievalRunIds);

    return {
      workspaceSlug,
      projectId: project.id,
      repoInstallationId: repoInstallation.id,
      projectKernelId: projectKernel.id,
      sourceSeedPaths: targetFixtureSourceSeeds.map((seed) => seed.path),
      ownerFilePaths: targetFixtureOwnerFiles.map((ownerFile) => ownerFile.path),
      trustExclusionPatterns: targetFixtureTrustExclusions.map((exclusion) => exclusion.pathPattern),
      executionRunId: executionRun.id,
      readBackExecutionRunId: aggregate.executionRun.id,
      baselineCodexBriefRendered: baselineProof.codexBriefRendered,
      baselineMemoryIncluded: baselineProof.memoryIncluded,
      baselineContextBytes: baselineProof.contextBytes,
      baselineApproximateTokens: baselineProof.approximateTokens,
      codexBriefRendered: planProof.codexBriefRendered,
      codexBriefMemoryRendered: planProof.memoryRendered,
      groundedContextBytes: planProof.contextBytes,
      groundedApproximateTokens: planProof.approximateTokens,
      evidenceBundleId: evidenceProof.evidenceBundleId,
      evidenceReadbackMatched: true,
      commandProofBoundary: "target_command_packet_bound",
      decisionPacketSurface: "mcp:krn_decision_packet",
      decisionPacketChecksum: decisionPacketProof.checksum,
      decisionPacketEvidenceRef: decisionPacketProof.evidenceRef,
      decisionPacketMcpInitialized: decisionPacketProof.initialized,
      decisionPacketMcpToolListed: decisionPacketProof.toolListed,
      decisionPacketMcpReadbackMatched:
        decisionPacketProof.memoryIncluded && decisionPacketProof.returnChannelBound,
      decisionPacketMemoryIncluded: decisionPacketProof.memoryIncluded,
      decisionPacketReturnChannelBound: decisionPacketProof.returnChannelBound,
      consumerTargetCommand: evidenceProof.targetCommand,
      consumerTargetCommandStatus: "passed",
      consumerEvidenceBoundToPacket: evidenceProof.consumerEvidenceBoundToPacket,
      sourceDecisionUsefulnessOutcome: "helped",
      reviewAssessmentId: evidenceProof.reviewAssessmentId,
      reviewAssessmentReadbackMatched: true,
      feedbackDeltaId: evidenceProof.feedbackDeltaId,
      feedbackDeltaReadbackMatched: true,
      memorySeedRecordId: memoryRecord.id,
      memoryIncluded: planProof.memoryIncluded,
      memoryApplicationId: memoryApplication.id,
      memoryUsefulnessOutcome: "helped",
      memoryUsefulnessReadbackMatched: readBackMemoryRecord.id === memoryRecord.id,
      memoryRecordDrift: "none",
      memoryPositiveFeedbackCount: readBackMemoryRecord.positiveFeedbackCount,
      automaticMemoryRecordMutation: "none",
      targetProjectLinked: planProof.targetProjectLinked,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } catch (error) {
    await cleanupMarkerRows(client, marker, retrievalRunIds);
    throw error;
  } finally {
    await client.end();
  }
};
