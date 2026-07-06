import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";
import {
  renderCodexBriefFromAggregate,
  resolveReadOnlyHarnessRuntime
} from "./codex-brief-support.js";
import {
  formatRetainedPatternSelectionLines,
  retainedPatternSelectionFromMetadata
} from "./retained-pattern-selection.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import { defaultWorkspaceSlug, defaultProjectSlug } from "./database-runtime.js";

export interface CodexBriefCommandRuntime extends BaseCommandRuntime {
  runId: string;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface CodexBriefCommandResult {
  stdout: string;
}


const renderText = (
  runId: string,
  briefText: string,
  retainedPatternLines: readonly string[]
): string =>
  [
    "KRN Codex Brief",
    `Run ID: ${runId}`,
    "Persistence: read-only (Postgres)",
    "Codex invocation: none",
    "Memory mutation: none",
    "",
    "Retained Pattern Context:",
    ...retainedPatternLines,
    "",
    briefText.trimEnd()
  ].join("\n") + "\n";

export const runCodexBriefCommand = async (
  runtime: CodexBriefCommandRuntime
): Promise<CodexBriefCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn codex brief");
  }

  const readRuntimeInput = {
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  };
  const readRuntime = await resolveReadOnlyHarnessRuntime(
    runtime.createDatabaseRuntime === undefined
      ? readRuntimeInput
      : {
          ...readRuntimeInput,
          createDatabaseRuntime: runtime.createDatabaseRuntime
        }
  );

  try {
    const aggregate = await readRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
      runtime.runId
    );

    if (aggregate === undefined) {
      throw new Error(`Execution run not found: ${runtime.runId}`);
    }

    if (aggregate.contextAssembly === undefined) {
      throw new Error(`Execution run has no context assembly: ${runtime.runId}`);
    }

    const { renderedBrief } = renderCodexBriefFromAggregate({
      aggregate,
      includeTaskContractInCapabilityPlan: true,
      createdAt: runtime.now(),
      createId: runtime.createId,
      goalReference: "GOAL.md active KRN canonical harness spine",
      execPlanReference: "GOAL.md M26.03",
      nextActionFallback: "Use this brief as the next Codex input.",
      missingContextMessage: `Execution run has no context assembly: ${runtime.runId}`
    });
    const retainedPatternSelection = retainedPatternSelectionFromMetadata(
      aggregate.harnessPlan.metadata
    );

    return {
      stdout: renderText(
        runtime.runId,
        renderedBrief,
        formatRetainedPatternSelectionLines(retainedPatternSelection)
      )
    };
  } finally {
    await readRuntime.close();
  }
};
