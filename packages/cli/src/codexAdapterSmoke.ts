import postgres from "postgres";
import type {
  Sql
} from "postgres";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "@krn/db/adapters";
import {
  runMigrationReadinessCheck
} from "@krn/db/dev";
import {
  compileHarnessPlan,
  createCapabilityPlan,
  createEvidenceContract
} from "@krn/harness";
import type {
  EvidenceContract
} from "@krn/harness";

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
  renderedNonGoals: boolean;
  renderedExplicitExclusions: boolean;
  renderedEvidenceContract: boolean;
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

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDiffRisk = (value: unknown): value is EvidenceContract["diffRisk"] =>
  value === "low" || value === "medium" || value === "high";

const parseEvidenceContract = (value: unknown): EvidenceContract | undefined => {
  if (!isRecord(value) || !Array.isArray(value.commands)) {
    return undefined;
  }

  const commands = value.commands.flatMap((item): EvidenceContract["commands"] => {
    if (!isRecord(item) || typeof item.command !== "string" || typeof item.required !== "boolean") {
      return [];
    }

    return [
      {
        command: item.command,
        required: item.required
      }
    ];
  });

  if (
    commands.length === 0 ||
    !isDiffRisk(value.diffRisk) ||
    typeof value.reviewBurden !== "string" ||
    typeof value.rollbackPath !== "string"
  ) {
    return undefined;
  }

  return {
    commands,
    diffRisk: value.diffRisk,
    reviewBurden: value.reviewBurden,
    rollbackPath: value.rollbackPath,
    metadata: isRecord(value.metadata) ? value.metadata : {}
  };
};

const countQuery = async (rowsPromise: Promise<CountRow[]>): Promise<number> => {
  const rows = await rowsPromise;

  return rows[0]?.count ?? 0;
};

const countMarkerRows = async (
  client: Sql,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined,
  contextAssemblyId: string | undefined
): Promise<number> => {
  let count = 0;

  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from workspaces where slug = ${workspaceSlug}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from run_events where payload->>'smokeId' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from source_artifacts where metadata->>'smokeId' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from source_claims where metadata->>'smokeId' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from search_documents where metadata->>'smokeId' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from memory_records where metadata->>'smokeId' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from anti_memory_records where metadata->>'smokeId' = ${marker}`
  );

  if (retrievalRunId !== undefined) {
    count += await countQuery(
      client<CountRow[]>`select count(*)::int as count from retrieval_runs where id = ${retrievalRunId}`
    );
  }

  if (contextAssemblyId !== undefined) {
    count += await countQuery(
      client<CountRow[]>`select count(*)::int as count from context_items where context_assembly_id = ${contextAssemblyId}`
    );
    count += await countQuery(
      client<CountRow[]>`select count(*)::int as count from context_exclusions where context_assembly_id = ${contextAssemblyId}`
    );
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

const reportLines = (report: CodexAdapterSmokeReport): string[] => [
  `Workspace smoke row: ${report.workspaceSlug}`,
  `Project smoke row: ${report.projectSlug}`,
  `Execution run: ${report.executionRunId}`,
  `Readback: ${
    report.readBackExecutionRunId === report.executionRunId ? "matched" : "mismatch"
  }`,
  `Context assembly: ${report.contextAssemblyId}`,
  `Objective present: ${report.renderedObjective ? "yes" : "no"}`,
  `Non-goals present: ${report.renderedNonGoals ? "yes" : "no"}`,
  `Explicit exclusions present: ${report.renderedExplicitExclusions ? "yes" : "no"}`,
  `Evidence contract present: ${report.renderedEvidenceContract ? "yes" : "no"}`,
  `Source claims used: ${report.sourceClaimsUsed}`,
  `Memory records used: ${report.memoryRecordsUsed}`,
  `Anti-memory warnings: ${report.antiMemoryWarnings}`,
  `Hook expectations: ${report.hookExpectationCount}`,
  `Codex invocations: ${report.codexInvocationCount}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
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
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for Codex adapter smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-codex-adapter-smoke-${marker}`;
  const projectSlug = "codex-adapter";
  const now = "2026-06-22T06:00:00.000Z";
  const past = "2026-06-01T00:00:00.000Z";
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  let retrievalRunId: string | undefined;
  let contextAssemblyId: string | undefined;

  try {
    await cleanupMarkerRows(client, workspaceSlug, marker, retrievalRunId, contextAssemblyId);

    const projectRepository = new DrizzleProjectRepository(db);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);
    const sourceRepository = new DrizzleSourceRepository(db);
    const memoryRepository = new DrizzleMemoryRepository(db);
    const retrievalRepository = new DrizzleRetrievalRepository(db);
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

    let idCounter = 0;
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
        createId: (prefix) => {
          idCounter += 1;
          return `${prefix}-${marker}-${idCounter}`;
        }
      }
    );
    const maybeRetrievalRunId = result.contextAssembly.metadata.retrievalRunId;
    retrievalRunId = typeof maybeRetrievalRunId === "string" ? maybeRetrievalRunId : undefined;
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

    if (aggregate === undefined || aggregate.contextAssembly === undefined) {
      throw new Error("Codex adapter smoke failed to read back persisted run");
    }

    const evidenceContract =
      parseEvidenceContract(aggregate.harnessPlan.metadata.evidenceContract) ??
      createEvidenceContract(aggregate.taskContract);
    const capabilityPlan = createCapabilityPlan({
      harnessPlan: aggregate.harnessPlan,
      hasContext: aggregate.contextAssembly.inclusions.length > 0,
      createdAt: now,
      createId: (prefix) => `${prefix}-${marker}-readback`
    });
    const brief = createExecutionBrief({
      taskContract: aggregate.taskContract,
      harnessPlan: aggregate.harnessPlan,
      contextAssembly: aggregate.contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: aggregate.harnessPlan.nextAction ?? "Use this brief as the next Codex input.",
      goalReference: "GOAL.md active KRN final harness spine",
      execPlanReference: "GOAL.md M26.05"
    });
    const renderedBrief = renderExecutionBriefText(brief);
    const renderedObjective = renderedBrief.includes(`Objective: ${aggregate.taskContract.objective}`);
    const renderedNonGoals = aggregate.taskContract.nonGoals.every((nonGoal) =>
      renderedBrief.includes(`- ${nonGoal}`)
    );
    const renderedExplicitExclusions =
      aggregate.contextAssembly.exclusions.length > 0 &&
      renderedBrief.includes("Explicit Exclusions:") &&
      !renderedBrief.includes("Explicit Exclusions:\n- none");
    const renderedEvidenceContract =
      renderedBrief.includes("Evidence Contract:") &&
      evidenceContract.commands.every((command) => renderedBrief.includes(command.command));
    const codexInvocationCount = aggregate.runEvents.filter((event) =>
      event.type === "codex.invoked" ||
      event.type === "codex.executed" ||
      event.type === "codex.execution.started"
    ).length;

    if (
      aggregate.executionRun.id !== executionRun.id ||
      aggregate.contextAssembly.id !== result.contextAssembly.id ||
      !renderedObjective ||
      !renderedNonGoals ||
      !renderedExplicitExclusions ||
      !renderedEvidenceContract ||
      brief.sourceClaimsUsed.length === 0 ||
      brief.sourceClaimsUsed.length > 6 ||
      brief.memoryRecordsUsed.length === 0 ||
      brief.memoryRecordsUsed.length > 6 ||
      brief.hookExpectations.length < 5 ||
      codexInvocationCount !== 0
    ) {
      throw new Error("Codex adapter smoke readback did not match expected brief proof");
    }

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
      contextAssemblyId: aggregate.contextAssembly.id,
      renderedObjective,
      renderedNonGoals,
      renderedExplicitExclusions,
      renderedEvidenceContract,
      sourceClaimsUsed: brief.sourceClaimsUsed.length,
      memoryRecordsUsed: brief.memoryRecordsUsed.length,
      antiMemoryWarnings: brief.antiMemoryWarnings.length,
      hookExpectationCount: brief.hookExpectations.length,
      codexInvocationCount,
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
