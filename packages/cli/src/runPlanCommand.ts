import {
  renderExecutionBrief
} from "@krn/codex-adapter";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion
} from "@krn/core";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  HarnessCompilerDependencies,
  HarnessRunRepository,
  ProjectKernelRecord,
  RepoInstallationRecord
} from "@krn/harness";
import {
  parseHarnessCompileInput,
  parseOperatorIntentInput,
  parseTaskContractInput
} from "@krn/schema";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import {
  createNoStoreCompilerDependencies
} from "./noStoreRepositories.js";

export interface PlanCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  persist: boolean;
  projectId?: string;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface PlanCommandResult {
  stdout: string;
}

export type CreateDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

interface PersistedPlanIdentity {
  operatorIntentId: string;
  taskContractId: string;
  harnessPlanId: string;
  contextAssemblyId: string;
  executionRunId: string;
}

interface ProjectScopedPlanMetadata {
  projectKernel?: ProjectKernelRecord;
  repoInstallations?: readonly RepoInstallationRecord[];
}

interface CompilerRuntimeResolution {
  workspaceId: string;
  projectId: string;
  persistenceLabel: string;
  compilerDependencies: HarnessCompilerDependencies;
  harnessRunRepository?: Pick<HarnessRunRepository, "createExecutionRun">;
  projectScopedMetadata?: ProjectScopedPlanMetadata;
  close(): Promise<void>;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const subjectRef = (item: { subjectType: string; subjectId: string }): string =>
  `${item.subjectType}:${item.subjectId}`;

const formatInclusionLine = (inclusion: ContextInclusion): string =>
  [
    `- ${subjectRef(inclusion)}`,
    `reason=${inclusion.reason}`,
    `expected_use=${inclusion.expectedUse}`,
    `trust=${inclusion.trustTier}`
  ].join(" | ");

const formatExclusionLine = (exclusion: ContextExclusion): string =>
  [
    `- ${subjectRef(exclusion)}`,
    `reason=${exclusion.reason}`,
    `explanation=${exclusion.explanation}`,
    `trust=${exclusion.trustTier}`
  ].join(" | ");

const formatActivationSummary = (
  contextAssembly: ContextAssembly,
  nextAction: string
): string[] => [
  `Context status: ${contextAssembly.status}`,
  "Context inclusions:",
  ...(contextAssembly.inclusions.length === 0
    ? ["- none"]
    : contextAssembly.inclusions.map(formatInclusionLine)),
  "Context exclusions:",
  ...(contextAssembly.exclusions.length === 0
    ? ["- none"]
    : contextAssembly.exclusions.map(formatExclusionLine)),
  ...(contextAssembly.status === "abstained" ? [`Context abstention: ${nextAction}`] : [])
];

const resolveCompilerRuntime = async (
  runtime: PlanCommandRuntime,
  workspaceSlug: string,
  projectSlug: string
): Promise<CompilerRuntimeResolution> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL;

  if (runtime.projectId !== undefined && !runtime.persist) {
    throw new Error("krn plan --project requires --persist");
  }

  if (!runtime.persist) {
    return {
      workspaceId: `workspace:${workspaceSlug}`,
      projectId: `project:${projectSlug}`,
      persistenceLabel: "disabled (explicit no-store preview; use --persist to write)",
      compilerDependencies: createNoStoreCompilerDependencies(runtime),
      async close(): Promise<void> {
        return undefined;
      }
    };
  }

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn plan --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug,
    projectSlug,
    ...(runtime.projectId === undefined ? {} : { projectId: runtime.projectId }),
    now: runtime.now,
    createId: runtime.createId
  });

  return {
    workspaceId: databaseRuntime.workspaceId,
    projectId: databaseRuntime.projectId,
    persistenceLabel: "enabled (Postgres, explicit --persist)",
    compilerDependencies: databaseRuntime.compilerDependencies,
    harnessRunRepository: databaseRuntime.harnessRunRepository,
    ...(databaseRuntime.projectKernel === undefined && databaseRuntime.repoInstallations === undefined
      ? {}
      : {
          projectScopedMetadata: {
            ...(databaseRuntime.projectKernel === undefined
              ? {}
              : { projectKernel: databaseRuntime.projectKernel }),
            ...(databaseRuntime.repoInstallations === undefined
              ? {}
              : { repoInstallations: databaseRuntime.repoInstallations })
          }
        }),
    close: databaseRuntime.close
  };
};

const formatPlanSummary = (
  task: string,
  projectId: string,
  persistenceLabel: string,
  contextAssembly: ContextAssembly,
  evidenceCommands: readonly string[],
  nextAction: string,
  executionBrief: string,
  projectScopedMetadata?: ProjectScopedPlanMetadata,
  persistedIdentity?: PersistedPlanIdentity
): string => {
  const lines = [
    "KRN Plan",
    `Task: ${task}`,
    `Project ID: ${projectId}`,
    `Persistence: ${persistenceLabel}`,
    ...(projectScopedMetadata?.projectKernel === undefined
      ? []
      : [`ProjectKernel: ${projectScopedMetadata.projectKernel.id}`]),
    ...(projectScopedMetadata?.repoInstallations === undefined
      ? []
      : [
          `Repo installations: ${
            projectScopedMetadata.repoInstallations.length === 0
              ? "none"
              : projectScopedMetadata.repoInstallations
                  .map((repoInstallation) => repoInstallation.id)
                  .join(", ")
          }`
        ]),
    `Context included: ${contextAssembly.inclusions.length}`,
    `Context excluded: ${contextAssembly.exclusions.length}`,
    ...formatActivationSummary(contextAssembly, nextAction),
    `Evidence expected: ${evidenceCommands.join(", ")}`,
    `Next action: ${nextAction}`,
    "",
    executionBrief
  ];

  if (persistedIdentity !== undefined) {
    lines.push(
      "",
      "Persisted IDs:",
      `operatorIntent: ${persistedIdentity.operatorIntentId}`,
      `taskContract: ${persistedIdentity.taskContractId}`,
      `harnessPlan: ${persistedIdentity.harnessPlanId}`,
      `contextAssembly: ${persistedIdentity.contextAssemblyId}`,
      `executionRun: ${persistedIdentity.executionRunId}`
    );
  }

  return lines.join("\n");
};

export const runPlanCommand = async (
  task: string,
  runtime: PlanCommandRuntime
): Promise<PlanCommandResult> => {
  const operatorIntent = parseOperatorIntentInput({
    rawIntent: task,
    source: "cli",
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    metadata: {}
  });
  const taskContract = parseTaskContractInput({
    title: task,
    objective: task,
    constraints: [
      "preserve strict TypeScript boundaries",
      "do not write runtime markdown memory"
    ],
    nonGoals: [
      "do not invoke Codex",
      "do not spawn agents",
      "do not create dashboard"
    ],
    acceptance: [
      "pnpm typecheck passes",
      "pnpm test passes",
      "git diff --check passes"
    ],
    metadata: {}
  });
  const compileInput = parseHarnessCompileInput({
    operatorIntent,
    taskContract,
    tokenBudget: 1200,
    metadata: {
      command:
        runtime.projectId === undefined
          ? runtime.persist
            ? "krn plan --persist"
            : "krn plan"
          : "krn plan --project --persist"
    }
  });
  const workspaceSlug = compileInput.operatorIntent.workspaceSlug ?? defaultWorkspaceSlug;
  const projectSlug = compileInput.operatorIntent.projectSlug ?? defaultProjectSlug;
  const compilerRuntime = await resolveCompilerRuntime(runtime, workspaceSlug, projectSlug);

  try {
    const result = await compileHarnessPlan(
      {
        workspaceId: compilerRuntime.workspaceId,
        projectId: compilerRuntime.projectId,
        operatorIntent: {
          rawIntent: compileInput.operatorIntent.rawIntent,
          source: compileInput.operatorIntent.source,
          metadata: compileInput.operatorIntent.metadata
        },
        ...(compileInput.taskContract === undefined
          ? {}
          : { taskContract: compileInput.taskContract }),
        ...(compileInput.tokenBudget === undefined ? {} : { tokenBudget: compileInput.tokenBudget }),
        metadata: compileInput.metadata
      },
      compilerRuntime.compilerDependencies
    );
    const executionBrief = renderExecutionBrief({
      taskContract: result.taskContract,
      harnessPlan: result.harnessPlan,
      contextAssembly: result.contextAssembly,
      capabilityPlan: result.capabilityPlan,
      evidenceContract: result.evidenceContract,
      nextAction: result.nextAction,
      goalReference: "GOAL.md active KRN final harness spine",
      execPlanReference: "PLAN.md Milestone 13"
    });
    const evidenceCommands = result.evidenceContract.commands.map((command) => command.command);
    const executionRun =
      compilerRuntime.harnessRunRepository === undefined
        ? undefined
        : await compilerRuntime.harnessRunRepository.createExecutionRun({
            harnessPlanId: result.harnessPlan.id,
            adapter: "codex",
            status: "planned",
            initialEvent: {
              sequence: 1,
              type: "plan.persisted",
              message: "Persisted harness plan created",
              payload: {
                operatorIntentId: result.operatorIntent.id,
                taskContractId: result.taskContract.id,
                harnessPlanId: result.harnessPlan.id,
                contextAssemblyId: result.contextAssembly.id,
                codexAdapterPlanRefId: result.codexAdapterPlanRef.id
              }
            },
            metadata: {
              command:
                runtime.projectId === undefined
                  ? "krn plan --persist"
                  : "krn plan --project --persist",
              ...(compilerRuntime.projectScopedMetadata?.projectKernel === undefined
                ? {}
                : { projectKernelId: compilerRuntime.projectScopedMetadata.projectKernel.id }),
              ...(compilerRuntime.projectScopedMetadata?.repoInstallations === undefined
                ? {}
                : {
                    repoInstallationIds:
                      compilerRuntime.projectScopedMetadata.repoInstallations.map(
                        (repoInstallation) => repoInstallation.id
                      )
                  }),
              evidenceContract: result.evidenceContract,
              codexAdapterPlanRef: result.codexAdapterPlanRef
            }
          });
    const persistedIdentity =
      executionRun === undefined
        ? undefined
        : {
            operatorIntentId: result.operatorIntent.id,
            taskContractId: result.taskContract.id,
            harnessPlanId: result.harnessPlan.id,
            contextAssemblyId: result.contextAssembly.id,
            executionRunId: executionRun.id
          };

    return {
      stdout: formatPlanSummary(
        task,
        compilerRuntime.projectId,
        compilerRuntime.persistenceLabel,
        result.contextAssembly,
        evidenceCommands,
        result.nextAction,
        executionBrief,
        compilerRuntime.projectScopedMetadata,
        persistedIdentity
      )
    };
  } finally {
    await compilerRuntime.close();
  }
};
