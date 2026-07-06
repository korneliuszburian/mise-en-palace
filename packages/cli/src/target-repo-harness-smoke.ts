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
} from "@krn/harness/repositories";
import {
  toEvidenceCommandReadback
} from "@krn/core";
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
} from "./codex-brief-support.js";

export interface TargetRepoHarnessSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
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
  commandProofBoundary: "weak_default_not_run";
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

const commandsAreWeakDefaultNotRun = (
  evidenceBundle: EvidenceReadbackBundle | undefined
): boolean =>
  evidenceBundle?.commands.every((command) => {
    const evidenceCommand = toEvidenceCommandReadback(command);

    return evidenceCommand.status === "not_run" && evidenceCommand.provenance === "default_template";
  }) ?? false;

const feedbackDeltaHasNoMutations = (
  feedbackDelta: FeedbackReadbackDelta | undefined
): boolean =>
  feedbackDelta !== undefined &&
  feedbackDelta.memoryCandidates.length === 0 &&
  feedbackDelta.sourceDecisions.length === 0 &&
  feedbackDelta.evalCandidates.length === 0;

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
  expected: TargetEvidenceReadbackProof
): TargetEvidenceReadbackProof => {
  if (aggregate === undefined) {
    throw new Error("Target repo harness smoke failed to read back evidence aggregate");
  }

  const readBackEvidenceBundle = findById(aggregate.evidenceBundles, expected.evidenceBundleId);
  const readBackFeedbackDelta = findById(aggregate.feedbackDeltas, expected.feedbackDeltaId);
  const proofIds = readbackProofIds(aggregate, expected);

  if (
    proofIds === undefined ||
    !commandsAreWeakDefaultNotRun(readBackEvidenceBundle) ||
    !feedbackDeltaHasNoMutations(readBackFeedbackDelta)
  ) {
    throw new Error("Target repo harness smoke evidence readback did not preserve proof boundaries");
  }

  return proofIds;
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
      trustTier: "project-decision",
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
      trustTier: "project-decision",
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
      goalReference: "GOAL.md M27 target repo init-connect dogfood",
      execPlanReference: "PLAN.md M27 Slice 09",
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
      goalReference: "GOAL.md M27 target repo init-connect dogfood",
      execPlanReference: "PLAN.md M27 Slice 09",
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

    const evidenceBundle = await harnessRunRepository.createEvidenceBundle({
      executionRunId: executionRun.id,
      status: "captured",
      changedFiles: [],
      commands: [
        { command: "target fixture pnpm typecheck", status: "not_run" },
        { command: "target fixture pnpm test", status: "not_run" },
        { command: "git diff --check", status: "not_run" }
      ],
      diffRisk: "low",
      reviewBurden: "Review target repo harness smoke linkage and cleanup proof.",
      rollbackPath: "Revert the target repo harness smoke implementation commit.",
      event: {
        sequence: 2,
        type: "smoke.target_repo_harness.evidence_captured",
        message: "Target repo harness smoke evidence captured",
        payload: {
          smokeId: marker,
          projectId: project.id,
          executionRunId: executionRun.id
        }
      },
      metadata: {
        smokeId: marker,
        projectId: project.id,
        command: "db:smoke:target-repo-harness"
      }
    });
    const reviewAssessment = await harnessRunRepository.createReviewAssessment({
      evidenceBundleId: evidenceBundle.id,
      status: "pending",
      reviewer: "krn-cli-smoke",
      summary: "Target repo harness smoke evidence captured.",
      findings: [],
      metadata: {
        smokeId: marker,
        projectId: project.id
      }
    });
    const feedbackDelta = await harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: reviewAssessment.id,
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        smokeId: marker,
        projectId: project.id
      }
    });
    const evidenceProof = assertTargetEvidenceReadback(
      await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
      {
        evidenceBundleId: evidenceBundle.id,
        reviewAssessmentId: reviewAssessment.id,
        feedbackDeltaId: feedbackDelta.id
      }
    );

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
      evidenceBundleId: evidenceBundle.id,
      evidenceReadbackMatched: evidenceProof.evidenceBundleId === evidenceBundle.id,
      commandProofBoundary: "weak_default_not_run",
      reviewAssessmentId: reviewAssessment.id,
      reviewAssessmentReadbackMatched: evidenceProof.reviewAssessmentId === reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id,
      feedbackDeltaReadbackMatched: evidenceProof.feedbackDeltaId === feedbackDelta.id,
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
