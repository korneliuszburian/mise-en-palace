import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";
import {  renderCodexBriefFromAggregate,
  resolveReadOnlyHarnessRuntime
} from "./codex-brief-support.js";
import {
  formatKnowledgeSelectionLines,
  knowledgeSelectionFromMetadata,
  packetBoundKnowledgeSelection
} from "./knowledge-selection.js";
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
  brainRecallLines: readonly string[]
): string =>
  [
    "KRN Codex Brief",
    `Run ID: ${runId}`,
    "Persistence: read-only (Postgres)",
    "Codex invocation: none",
    "Memory mutation: none",
    "",
    "Selected KRN Context:",
    ...brainRecallLines,
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

    const getIssuance =
      readRuntime.harnessRunRepository.getIssuedDecisionPacketForExecutionRun;

    if (getIssuance === undefined) {
      throw new Error("DecisionPacket issuance readback is unavailable");
    }

    const issuance = await getIssuance.call(
      readRuntime.harnessRunRepository,
      runtime.runId
    );

    if (issuance === undefined) {
      throw new Error(`Execution run has no issued DecisionPacket: ${runtime.runId}`);
    }

    const { renderedBrief } = renderCodexBriefFromAggregate({
      aggregate,
      packet: issuance.packet,
      missingContextMessage: `Execution run has no context assembly: ${runtime.runId}`
    });
    const knowledgeSelection = packetBoundKnowledgeSelection(
      knowledgeSelectionFromMetadata(aggregate.harnessPlan.metadata),
      issuance.packet
    );

    return {
      stdout: renderText(
        runtime.runId,
        renderedBrief,
        formatKnowledgeSelectionLines(knowledgeSelection)
      )
    };
  } finally {
    await readRuntime.close();
  }
};
