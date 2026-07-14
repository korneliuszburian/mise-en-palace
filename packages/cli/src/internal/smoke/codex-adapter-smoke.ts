import type {
  Sql
} from "postgres";
import {
  inspectMigrationReadiness,
  smokeFixtureClocks
} from "@krn/db/dev";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  HarnessRunAggregate
} from "@krn/core/repositories";
import type {
  RenderedCodexBrief
} from "../../codex-brief-support.js";
import {
  assertBrainStoreReady,
  countCodexInvocationEvents,
  createSmokeIdFactory,
  createSmokeDatabaseRuntime,
  createSmokeRepositories,  countMemoryRecordsBySmokeId,
  countRetrievalRunById,
  countRunEventsBySmokeId,
  countSourceArtifactsBySmokeId,
  countSourceClaimsBySmokeId,
  metadataString,
  normalizeSmokeSlugPart,
  renderCodexBriefFromAggregate,
  sumCountRows
} from "../../codex-brief-support.js";

export interface CodexAdapterSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface CodexAdapterSmokeReport {
  workspaceSlug: string;
  executionRunId: string;
  contextAssemblyId: string;
  boundaryChecks: readonly string[];
  codexInvocationCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface CountRow {
  count: number;
}

interface CodexAdapterBoundaryProof {
  contextAssemblyId: string;
  checks: readonly string[];
  codexInvocationCount: number;
}

interface CodexAdapterBoundaryCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

type CodexAdapterReadBackContextAssembly = NonNullable<
  HarnessRunAggregate["contextAssembly"]
>;

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
    client<CountRow[]>`select count(*)::int as count from source_decisions where metadata->>'smokeId' = ${marker}`,
    client<CountRow[]>`select count(*)::int as count from source_decision_edges where metadata->>'smokeId' = ${marker}`,
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
  await client`
    delete from run_events
    where payload->>'smokeId' = ${marker}
      or execution_run_id in (
        select id from execution_runs where metadata->>'smokeId' = ${marker}
      )
  `;

  if (retrievalRunId !== undefined) {
    await client`delete from retrieval_runs where id = ${retrievalRunId}`;
  }

  await client`delete from search_documents where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
  await client`delete from workspaces where slug = ${workspaceSlug}`;

  return countMarkerRows(client, workspaceSlug, marker, retrievalRunId, contextAssemblyId);
};

const hasStaleMemoryExclusion = (
  input: {
    contextAssembly: CodexAdapterReadBackContextAssembly;
    expectedExpiredMemoryRecordId: string;
    rendered: RenderedCodexBrief;
  }
): boolean => {
  const exclusion = input.contextAssembly.exclusions.find((item) =>
    item.subjectType === "memory_record" &&
    item.subjectId === input.expectedExpiredMemoryRecordId
  );
  const explicitExclusionRendered = input.rendered.brief.explicitExclusions.some((item) =>
    item.subjectType === "memory_record" &&
    item.subjectId === input.expectedExpiredMemoryRecordId &&
    item.reason === "stale"
  );
  const renderedTextIncludesExclusion = input.rendered.renderedBrief.includes(
    `memory_record:${input.expectedExpiredMemoryRecordId}`
  );
  const excludedFromSelectedMemory = !input.rendered.brief.memoryRecordsSelected.includes(
    input.expectedExpiredMemoryRecordId
  );

  return exclusion?.reason === "stale" &&
    explicitExclusionRendered &&
    renderedTextIncludesExclusion &&
    excludedFromSelectedMemory;
};

const renderedBriefCoversContract = (
  aggregate: HarnessRunAggregate,
  rendered: RenderedCodexBrief
): boolean =>
  rendered.renderedBrief.includes(`Objective: ${aggregate.taskContract.objective}`) &&
  rendered.renderedBrief.includes(`Format Version: ${rendered.brief.formatVersion}`) &&
  aggregate.taskContract.nonGoals.every((nonGoal) =>
    rendered.renderedBrief.includes(`- ${nonGoal}`)
  ) &&
  rendered.renderedBrief.includes("Explicit Exclusions:") &&
  !rendered.renderedBrief.includes("Explicit Exclusions:\n- none") &&
  rendered.renderedBrief.includes("Evidence Contract:") &&
  rendered.evidenceContract?.commands.every((command) =>
    rendered.renderedBrief.includes(command.command)
  ) === true;

const hasBoundedSelectedContext = (
  input: {
    expectedExpiredMemoryRecordId: string;
    expectedMemoryRecordId: string;
    expectedSourceClaimId: string;
    rendered: RenderedCodexBrief;
  }
): boolean =>
  input.rendered.brief.sourceClaimsSelected.includes(input.expectedSourceClaimId) &&
  input.rendered.brief.memoryRecordsSelected.includes(input.expectedMemoryRecordId) &&
  !input.rendered.brief.memoryRecordsSelected.includes(input.expectedExpiredMemoryRecordId);

const assertCodexAdapterBoundary = (
  input: {
    aggregate: HarnessRunAggregate;
    executionRunId: string;
    expectedContextAssemblyId: string;
    expectedExpiredMemoryRecordId: string;
    expectedMemoryRecordId: string;
    expectedSourceClaimId: string;
    rendered: RenderedCodexBrief;
  }
): CodexAdapterBoundaryProof => {
  const contextAssembly = input.aggregate.contextAssembly;

  if (contextAssembly === undefined) {
    throw new Error("Codex adapter smoke failed to read back persisted run");
  }

  const codexInvocationCount = countCodexInvocationEvents(input.aggregate);
  const proofChecks: readonly CodexAdapterBoundaryCheck[] = [
    {
      label: "persisted-readback",
      passed:
        input.aggregate.executionRun.id === input.executionRunId &&
        contextAssembly.id === input.expectedContextAssemblyId
    },
    {
      label: "rendered-contract",
      passed: renderedBriefCoversContract(input.aggregate, input.rendered)
    },
    {
      label: "bounded-selected-context",
      passed: hasBoundedSelectedContext({
        expectedExpiredMemoryRecordId: input.expectedExpiredMemoryRecordId,
        expectedMemoryRecordId: input.expectedMemoryRecordId,
        expectedSourceClaimId: input.expectedSourceClaimId,
        rendered: input.rendered
      }),
      detail: [
        `expectedSourceClaimId=${input.expectedSourceClaimId}`,
        `sourceClaimsSelected=${input.rendered.brief.sourceClaimsSelected.join(",")}`,
        `contextInclusions=${contextAssembly.inclusions.map((item) =>
          `${item.subjectType}:${item.subjectId}:${item.reason}`
        ).join(",")}`,
        `contextExclusions=${contextAssembly.exclusions.map((item) =>
          `${item.subjectType}:${item.subjectId}:${item.reason}:${item.explanation}`
        ).join(",")}`,
        `expectedMemoryRecordId=${input.expectedMemoryRecordId}`,
        `expectedExpiredMemoryRecordId=${input.expectedExpiredMemoryRecordId}`,
        `memoryRecordsSelected=${input.rendered.brief.memoryRecordsSelected.join(",")}`
      ].join(" | ")
    },
    {
      label: "stale-memory-exclusion",
      passed: hasStaleMemoryExclusion({
        contextAssembly,
        expectedExpiredMemoryRecordId: input.expectedExpiredMemoryRecordId,
        rendered: input.rendered
      })
    },
    { label: "no-codex-invocation", passed: codexInvocationCount === 0 }
  ];
  const failedCheck = proofChecks.find((check) => !check.passed);

  if (failedCheck !== undefined) {
    throw new Error(
      [
        `Codex adapter smoke readback did not match expected brief proof: ${failedCheck.label}`,
        failedCheck.detail
      ].filter((line): line is string => line !== undefined).join(" | ")
    );
  }

  return {
    contextAssemblyId: contextAssembly.id,
    checks: proofChecks.map((check) => check.label),
    codexInvocationCount
  };
};

const reportLines = (report: CodexAdapterSmokeReport): string[] => [
  `Workspace smoke row: ${report.workspaceSlug}`,
  `Execution run: ${report.executionRunId}`,
  `Context assembly: ${report.contextAssemblyId}`,
  `Boundary checks: ${report.boundaryChecks.join(", ")}`,
  `Codex invocations: ${report.codexInvocationCount}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Codex adapter smoke: ${report.cleanedUp ? "passed" : "failed"}`
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
  const readiness = await inspectMigrationReadiness({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  assertBrainStoreReady(readiness, "Memory store is not ready for Codex adapter smoke");

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const workspaceSlug = `krn-codex-adapter-smoke-${marker}`;
  const projectSlug = "codex-adapter";
  const { now, past, expiredValidUntil } = smokeFixtureClocks.codexAdapter;
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
    const capturedSourceMetadata = {
      smokeId: marker,
      evidenceRef: `operator://codex-adapter-smoke/${marker}#captured-evidence`,
      evidenceStatus: "captured",
      evidenceContentHash: `sha256:codex-adapter-smoke-${marker}:captured-evidence`,
      evidenceFreshness: "current"
    };
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      sourceAuthority: "project-decision",
      uri: `operator://codex-adapter-smoke/${marker}`,
      title: "Codex adapter smoke source",
      contentHash: `codex-adapter-smoke-${marker}`,
      metadata: capturedSourceMetadata
    });
    const sourceChunk = await sourceRepository.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: 0,
      heading: "Bounded Codex adapter brief",
      content:
        "Codex adapter smoke must render a bounded execution brief from persisted harness state.",
      contentHash: `codex-adapter-smoke-chunk-${marker}`,
      metadata: capturedSourceMetadata
    });
    const adapterClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      claim:
        "Codex adapter smoke must render a bounded execution brief from persisted harness state.",
      mechanism:
        "A persisted run with activated source, memory, exclusions, evidence, and proof boundaries is read back and rendered by the adapter.",
      krnImplication:
        "M26 Codex adapter readiness can be proven through a self-cleaning DB smoke command.",
      doesNotProve: "This does not prove Codex executed the work.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M26 Codex adapter smoke",
      falsifier: "The smoke command cannot render objective, context, evidence, or proof boundaries.",
      revisitWhen: "2030-01-01T00:00:00.000Z",
      metadata: capturedSourceMetadata
    });
    const adapterDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: adapterClaim.id,
      status: "adopt",
      decision: "Use Codex adapter smoke source claim as accepted brief context.",
      rationale:
        "The smoke source claim has an explicit mechanism, consumer, falsifier, and bounded non-proof, so it can anchor adapter readback.",
      falsifier: "The adapter smoke stops rendering source-backed context from the accepted claim.",
      consumer: "M26 Codex adapter smoke",
      metadata: {
        smokeId: marker
      }
    });
    await sourceRepository.createSourceDecisionEdge({
      sourceClaimId: adapterClaim.id,
      sourceDecisionId: adapterDecision.id,
      targetType: "architecture_decision",
      targetId: adapterDecision.id,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "Codex adapter smoke source claim is decision-linked authority for bounded brief rendering.",
      metadata: {
        smokeId: marker,
        sourceDecisionId: adapterDecision.id
      }
    });
    const boundedMemoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `codex-adapter-smoke:${marker}:bounded-brief`,
      kind: "constraint",
      status: "active",
      summary: "Codex adapter smoke must stay bounded",
      body:
        "The smoke path should render objective, non-goals, explicit exclusions, evidence contract, source and memory references, and proof boundaries without invoking Codex.",
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
    const expiredMemoryRecord = await memoryRepository.createMemoryRecord({
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
      validUntil: expiredValidUntil,
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
            "Render a persisted Codex execution brief with bounded context, explicit exclusions, evidence contract, and proof boundaries.",
          constraints: [
            "no Codex invocation",
            "no MCP product server",
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
            "proof boundaries rendered",
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
      missingContextMessage: "Codex adapter smoke failed to read back persisted run"
    });
    const proof = assertCodexAdapterBoundary({
      aggregate,
      executionRunId: executionRun.id,
      expectedContextAssemblyId: result.contextAssembly.id,
      expectedExpiredMemoryRecordId: expiredMemoryRecord.id,
      expectedMemoryRecordId: boundedMemoryRecord.id,
      expectedSourceClaimId: adapterClaim.id,
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
      executionRunId: executionRun.id,
      contextAssemblyId: proof.contextAssemblyId,
      boundaryChecks: proof.checks,
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
