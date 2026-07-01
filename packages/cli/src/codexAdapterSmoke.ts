import type {
  Sql
} from "postgres";
import {
  runMigrationReadinessCheck
} from "@krn/db/dev";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  HarnessRunAggregate
} from "@krn/harness/repositories";
import type {
  RenderedCodexBrief
} from "./codexBriefSupport.js";
import {
  assertBrainStoreReady,
  countCodexInvocationEvents,
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
  metadataString,
  normalizeSmokeSlugPart,
  passedOrFailed,
  renderCodexBriefFromAggregate,
  sumCountRows,
  yesNo
} from "./codexBriefSupport.js";

export interface CodexAdapterSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface CodexAdapterSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  readBackExecutionRunId: string;
  contextAssemblyId: string;
  renderedObjective: boolean;
  renderedFormatVersion: boolean;
  renderedNonGoals: boolean;
  renderedExplicitExclusions: boolean;
  renderedEvidenceContract: boolean;
  renderedSkillPatternRefs: boolean;
  sourceClaimsUsed: number;
  memoryRecordsUsed: number;
  antiMemoryWarnings: number;
  hookExpectationCount: number;
  codexInvocationCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface CountRow {
  count: number;
}

interface CodexAdapterBriefProof {
  contextAssemblyId: string;
  renderedObjective: boolean;
  renderedFormatVersion: boolean;
  renderedNonGoals: boolean;
  renderedExplicitExclusions: boolean;
  renderedEvidenceContract: boolean;
  renderedSkillPatternRefs: boolean;
  codexInvocationCount: number;
}

const countMarkerRows = async (
  client: Sql,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined,
  contextAssemblyId: string | undefined
): Promise<number> => {
  let count = await sumCountRows([
    client<CountRow[]>`select count(*)::int as count from workspaces where slug = ${workspaceSlug}`,
    countRunEventsBySmokeId(client, marker),
    countSourceArtifactsBySmokeId(client, marker),
    countSourceClaimsBySmokeId(client, marker),
    client<CountRow[]>`select count(*)::int as count from search_documents where metadata->>'smokeId' = ${marker}`,
    countMemoryRecordsBySmokeId(client, marker),
    client<CountRow[]>`select count(*)::int as count from anti_memory_records where metadata->>'smokeId' = ${marker}`
  ]);

  if (retrievalRunId !== undefined) {
    count += await sumCountRows([countRetrievalRunById(client, retrievalRunId)]);
  }

  if (contextAssemblyId !== undefined) {
    count += await sumCountRows([
      client<CountRow[]>`select count(*)::int as count from context_items where context_assembly_id = ${contextAssemblyId}`,
      client<CountRow[]>`select count(*)::int as count from context_exclusions where context_assembly_id = ${contextAssemblyId}`
    ]);
  }

  return count;
};

const cleanupMarkerRows = async (
  client: Sql,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined,
  contextAssemblyId: string | undefined
): Promise<number> => {
  await client`delete from run_events where payload->>'smokeId' = ${marker}`;

  if (retrievalRunId !== undefined) {
    await client`delete from retrieval_runs where id = ${retrievalRunId}`;
  }

  await client`delete from search_documents where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
  await client`delete from workspaces where slug = ${workspaceSlug}`;

  return countMarkerRows(client, workspaceSlug, marker, retrievalRunId, contextAssemblyId);
};

const assertCodexAdapterBriefProof = (
  input: {
    aggregate: HarnessRunAggregate;
    executionRunId: string;
    expectedContextAssemblyId: string;
    rendered: RenderedCodexBrief;
  }
): CodexAdapterBriefProof => {
  const contextAssembly = input.aggregate.contextAssembly;

  if (contextAssembly === undefined) {
    throw new Error("Codex adapter smoke failed to read back persisted run");
  }

  const renderedObjective = input.rendered.renderedBrief.includes(
    `Objective: ${input.aggregate.taskContract.objective}`
  );
  const renderedFormatVersion = input.rendered.renderedBrief.includes(
    `Format Version: ${input.rendered.brief.formatVersion}`
  );
  const renderedNonGoals = input.aggregate.taskContract.nonGoals.every((nonGoal) =>
    input.rendered.renderedBrief.includes(`- ${nonGoal}`)
  );
  const renderedExplicitExclusions =
    contextAssembly.exclusions.length > 0 &&
    input.rendered.renderedBrief.includes("Explicit Exclusions:") &&
    !input.rendered.renderedBrief.includes("Explicit Exclusions:\n- none");
  const renderedEvidenceContract =
    input.rendered.renderedBrief.includes("Evidence Contract:") &&
    input.rendered.evidenceContract.commands.every((command) =>
      input.rendered.renderedBrief.includes(command.command)
    );
  const renderedSkillPatternRefs = input.rendered.renderedBrief.includes(
    "pattern:codex-skill-progressive-disclosure-routing"
  );
  const codexInvocationCount = countCodexInvocationEvents(input.aggregate);
  const proofChecks = [
    input.aggregate.executionRun.id === input.executionRunId,
    contextAssembly.id === input.expectedContextAssemblyId,
    renderedObjective,
    renderedFormatVersion,
    renderedNonGoals,
    renderedExplicitExclusions,
    renderedEvidenceContract,
    renderedSkillPatternRefs,
    input.rendered.brief.sourceClaimsUsed.length > 0,
    input.rendered.brief.sourceClaimsUsed.length <= 6,
    input.rendered.brief.memoryRecordsUsed.length > 0,
    input.rendered.brief.memoryRecordsUsed.length <= 6,
    input.rendered.brief.hookExpectations.length >= 5,
    codexInvocationCount === 0
  ];

  if (proofChecks.some((passed) => !passed)) {
    throw new Error("Codex adapter smoke readback did not match expected brief proof");
  }

  return {
    contextAssemblyId: contextAssembly.id,
    renderedObjective,
    renderedFormatVersion,
    renderedNonGoals,
    renderedExplicitExclusions,
    renderedEvidenceContract,
    renderedSkillPatternRefs,
    codexInvocationCount
  };
};

const reportLines = (report: CodexAdapterSmokeReport): string[] => [
  `Workspace smoke row: ${report.workspaceSlug}`,
  `Project smoke row: ${report.projectSlug}`,
  `Execution run: ${report.executionRunId}`,
  `Readback: ${matchedOrMismatch(report.readBackExecutionRunId, report.executionRunId)}`,
  `Context assembly: ${report.contextAssemblyId}`,
  `Objective present: ${yesNo(report.renderedObjective)}`,
  `Format version present: ${yesNo(report.renderedFormatVersion)}`,
  `Non-goals present: ${yesNo(report.renderedNonGoals)}`,
  `Explicit exclusions present: ${yesNo(report.renderedExplicitExclusions)}`,
  `Evidence contract present: ${yesNo(report.renderedEvidenceContract)}`,
  `Skill pattern refs present: ${yesNo(report.renderedSkillPatternRefs)}`,
  `Source claims used: ${report.sourceClaimsUsed}`,
  `Memory records used: ${report.memoryRecordsUsed}`,
  `Anti-memory warnings: ${report.antiMemoryWarnings}`,
  `Hook expectations: ${report.hookExpectationCount}`,
  `Codex invocations: ${report.codexInvocationCount}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${completedOrNot(report.cleanedUp)}`,
  `Codex adapter smoke: ${passedOrFailed(report.cleanedUp)}`
];

export const formatCodexAdapterSmokeReport = (report: CodexAdapterSmokeReport): string =>
  [
    "KRN Codex Adapter Smoke",
    ...reportLines(report)
  ].join("\n") + "\n";

export const formatCodexAdapterSmokeReportLines = reportLines;

export const runCodexAdapterSmokeCheck = async (
  input: CodexAdapterSmokeInput
): Promise<CodexAdapterSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  assertBrainStoreReady(readiness, "Brain store is not ready for Codex adapter smoke");

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const workspaceSlug = `krn-codex-adapter-smoke-${marker}`;
  const projectSlug = "codex-adapter";
  const now = "2026-06-22T06:00:00.000Z";
  const past = "2026-06-01T00:00:00.000Z";
  const { client, db } = createSmokeDatabaseRuntime(input.databaseUrl);
  let retrievalRunId: string | undefined;
  let contextAssemblyId: string | undefined;

  try {
    await cleanupMarkerRows(client, workspaceSlug, marker, retrievalRunId, contextAssemblyId);

    const {
      projectRepository,
      harnessRunRepository,
      sourceRepository,
      memoryRepository,
      retrievalRepository
    } = createSmokeRepositories(db);
    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: projectSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      trustTier: "project-decision",
      uri: `operator://codex-adapter-smoke/${marker}`,
      title: "Codex adapter smoke source",
      contentHash: `codex-adapter-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const adapterClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      claim:
        "Codex adapter smoke must render a bounded execution brief from persisted harness state.",
      mechanism:
        "A persisted run with activated source, memory, exclusions, evidence, and hook expectations is read back and rendered by the adapter.",
      krnImplication:
        "M26 Codex adapter readiness can be proven through a self-cleaning DB smoke command.",
      doesNotProve: "This does not prove Codex executed the work.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M26 Codex adapter smoke",
      falsifier: "The smoke command cannot render objective, context, evidence, or hook expectations.",
      revisitWhen: "Codex adapter output contract changes.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const invokeCodexClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      claim: "Codex adapter smoke should invoke Codex to prove the adapter.",
      mechanism: "Running Codex would prove execution.",
      krnImplication: "The smoke command would become an executor.",
      doesNotProve: "M26 allows actual Codex invocation.",
      trustTier: "project-decision",
      supportType: "rejection",
      consumer: "M26 Codex adapter smoke",
      falsifier: "M26 non-goals forbid Codex invocation.",
      revisitWhen: "A later milestone explicitly accepts execution.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `codex-adapter-smoke:${marker}:bounded-brief`,
      kind: "constraint",
      status: "active",
      summary: "Codex adapter smoke must stay bounded",
      body:
        "The smoke path should render objective, non-goals, explicit exclusions, evidence contract, source and memory references, and hook expectations without invoking Codex.",
      owner: "kernel",
      confidence: 96,
      applicationGuidance: "Use when proving M26 Codex adapter smoke behavior.",
      invalidationRule: "Revisit when M26 adapter smoke semantics change.",
      sourceLineage: [{ sourceId: adapterClaim.id }],
      isUserPreference: false,
      validFrom: past,
      metadata: {
        smokeId: marker
      }
    });
    await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `codex-adapter-smoke:${marker}:expired`,
      kind: "preference",
      status: "active",
      summary: "Old adapter smoke shortcut",
      body: "Expired note suggesting that adapter smoke can skip explicit exclusions.",
      owner: "kernel",
      confidence: 80,
      applicationGuidance: "Do not use for M26 adapter proof.",
      invalidationRule: "Expired before M26.05.",
      sourceLineage: [{ sourceId: adapterClaim.id }],
      isUserPreference: false,
      validFrom: past,
      validUntil: "2026-06-10T00:00:00.000Z",
      metadata: {
        smokeId: marker
      }
    });
    await memoryRepository.createAntiMemoryRecord({
      projectId: project.id,
      key: `codex-adapter-smoke:${marker}:anti-invoke-codex`,
      rejectedClaim: "Codex adapter smoke should invoke Codex to prove the adapter.",
      reason: "M26 must render instructions and expectations without actual Codex execution.",
      invalidatedBySourceClaimIds: [invokeCodexClaim.id],
      invalidatedBySourceClaimId: invokeCodexClaim.id,
      appliesTo: "M26 Codex adapter smoke",
      mayRevisitWhen: "A later execution milestone is accepted.",
      summary: "Do not invoke Codex for M26 adapter smoke",
      body: "The adapter smoke path proves rendered output, not executor behavior.",
      owner: "kernel",
      confidence: 98,
      sourceLineage: [{ sourceId: adapterClaim.id }],
      metadata: {
        smokeId: marker
      }
    });
    await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "source_claim",
      subjectId: adapterClaim.id,
      sourceClaimId: adapterClaim.id,
      title: "Codex adapter smoke search document",
      body:
        "Codex adapter smoke renders persisted execution brief objective non-goals explicit exclusions evidence contract source memory hook expectations no Codex invocation cleanup count zero.",
      searchText:
        "codex adapter smoke execution brief objective non-goals explicit exclusions evidence contract source memory hook expectations cleanup",
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });

    const createSmokeId = createSmokeIdFactory(marker);
    const result = await compileHarnessPlan(
      {
        workspaceId: workspace.id,
        projectId: project.id,
        operatorIntent: {
          rawIntent: `codex adapter smoke ${marker}`,
          source: "cli",
          metadata: {
            smokeId: marker
          }
        },
        taskContract: {
          title: "Render Codex adapter smoke brief",
          objective:
            "Render a persisted Codex execution brief with bounded context, explicit exclusions, evidence contract, and hook expectations.",
          constraints: [
            "no Codex invocation",
            "no MCP server",
            "self-clean marker rows"
          ],
          nonGoals: [
            "do not invoke Codex",
            "do not mutate memory",
            "do not create hook scripts"
          ],
          acceptance: [
            "objective rendered",
            "non-goals rendered",
            "explicit exclusions rendered",
            "evidence contract rendered",
            "source and memory refs bounded",
            "hook expectations rendered",
            "cleanup count zero"
          ],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 420,
        metadata: {
          command: "db:smoke:codex-adapter",
          smokeId: marker
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
    retrievalRunId = metadataString(result.contextAssembly.metadata, "retrievalRunId");
    contextAssemblyId = result.contextAssembly.id;

    if (retrievalRunId === undefined) {
      throw new Error("Codex adapter smoke did not create a retrieval run");
    }

    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: result.harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.codex_adapter.persisted",
        message: "Codex adapter smoke persisted run created",
        payload: {
          smokeId: marker,
          taskContractId: result.taskContract.id,
          harnessPlanId: result.harnessPlan.id,
          contextAssemblyId: result.contextAssembly.id
        }
      },
      metadata: {
        smokeId: marker,
        codexAdapterPlanRef: result.codexAdapterPlanRef,
        evidenceContract: result.evidenceContract
      }
    });
    const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);

    if (aggregate === undefined) {
      throw new Error("Codex adapter smoke failed to read back persisted run");
    }

    const rendered = renderCodexBriefFromAggregate({
      aggregate,
      createdAt: now,
      createId: (prefix) => `${prefix}-${marker}-readback`,
      nextActionFallback: "Use this brief as the next Codex input.",
      goalReference: "GOAL.md active KRN final harness spine",
      execPlanReference: "GOAL.md M26.05",
      missingContextMessage: "Codex adapter smoke failed to read back persisted run"
    });
    const proof = assertCodexAdapterBriefProof({
      aggregate,
      executionRunId: executionRun.id,
      expectedContextAssemblyId: result.contextAssembly.id,
      rendered
    });

    const remainingMarkerCount = await cleanupMarkerRows(
      client,
      workspaceSlug,
      marker,
      retrievalRunId,
      contextAssemblyId
    );

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      readBackExecutionRunId: aggregate.executionRun.id,
      contextAssemblyId: proof.contextAssemblyId,
      renderedObjective: proof.renderedObjective,
      renderedFormatVersion: proof.renderedFormatVersion,
      renderedNonGoals: proof.renderedNonGoals,
      renderedExplicitExclusions: proof.renderedExplicitExclusions,
      renderedEvidenceContract: proof.renderedEvidenceContract,
      renderedSkillPatternRefs: proof.renderedSkillPatternRefs,
      sourceClaimsUsed: rendered.brief.sourceClaimsUsed.length,
      memoryRecordsUsed: rendered.brief.memoryRecordsUsed.length,
      antiMemoryWarnings: rendered.brief.antiMemoryWarnings.length,
      hookExpectationCount: rendered.brief.hookExpectations.length,
      codexInvocationCount: proof.codexInvocationCount,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } catch (error) {
    await cleanupMarkerRows(client, workspaceSlug, marker, retrievalRunId, contextAssemblyId);
    throw error;
  } finally {
    await client.end();
  }
};
