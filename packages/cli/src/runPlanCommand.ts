import {
  renderExecutionBrief
} from "@krn/codex-adapter";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  HarnessCompilerDependencies
} from "@krn/harness";
import {
  parseHarnessCompileInput,
  parseOperatorIntentInput,
  parseTaskContractInput
} from "@krn/schema";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import {
  createNoStoreCompilerDependencies
} from "./noStoreRepositories.js";

export interface PlanCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
}

export interface PlanCommandResult {
  stdout: string;
}

interface CompilerRuntimeResolution {
  workspaceId: string;
  projectId: string;
  persistenceLabel: string;
  compilerDependencies: HarnessCompilerDependencies;
  close(): Promise<void>;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const resolveCompilerRuntime = async (
  runtime: PlanCommandRuntime,
  workspaceSlug: string,
  projectSlug: string
): Promise<CompilerRuntimeResolution> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    return {
      workspaceId: `workspace:${workspaceSlug}`,
      projectId: `project:${projectSlug}`,
      persistenceLabel: "disabled (KRN_DATABASE_URL not set; no-store preview)",
      compilerDependencies: createNoStoreCompilerDependencies(runtime),
      async close(): Promise<void> {
        return undefined;
      }
    };
  }

  const databaseRuntime = await createDatabaseRuntime({
    databaseUrl,
    workspaceSlug,
    projectSlug,
    now: runtime.now,
    createId: runtime.createId
  });

  return {
    workspaceId: databaseRuntime.workspaceId,
    projectId: databaseRuntime.projectId,
    persistenceLabel: "enabled (Postgres)",
    compilerDependencies: databaseRuntime.compilerDependencies,
    close: databaseRuntime.close
  };
};

const formatPlanSummary = (
  task: string,
  persistenceLabel: string,
  includedCount: number,
  excludedCount: number,
  evidenceCommands: readonly string[],
  nextAction: string,
  executionBrief: string
): string =>
  [
    "KRN Plan",
    `Task: ${task}`,
    `Persistence: ${persistenceLabel}`,
    `Context included: ${includedCount}`,
    `Context excluded: ${excludedCount}`,
    `Evidence expected: ${evidenceCommands.join(", ")}`,
    `Next action: ${nextAction}`,
    "",
    executionBrief
  ].join("\n");

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
      command: "krn plan"
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

    return {
      stdout: formatPlanSummary(
        task,
        compilerRuntime.persistenceLabel,
        result.contextAssembly.inclusions.length,
        result.contextAssembly.exclusions.length,
        evidenceCommands,
        result.nextAction,
        executionBrief
      )
    };
  } finally {
    await compilerRuntime.close();
  }
};
