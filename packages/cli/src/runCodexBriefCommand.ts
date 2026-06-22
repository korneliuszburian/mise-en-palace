import postgres from "postgres";
import {
  createKrnDatabase,
  DrizzleHarnessRunRepository
} from "@krn/db";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  createCapabilityPlan,
  createEvidenceContract
} from "@krn/harness";
import type {
  EvidenceContract,
  HarnessRunRepository
} from "@krn/harness";

import type {
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";

export interface CodexBriefCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  runId: string;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface CodexBriefCommandResult {
  stdout: string;
}

interface ReadOnlyHarnessRuntime {
  harnessRunRepository: Pick<HarnessRunRepository, "getHarnessRunByExecutionRunId">;
  close(): Promise<void>;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

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

const createReadOnlyHarnessRuntime = async (
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  const client = postgres(databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);

  return {
    harnessRunRepository: new DrizzleHarnessRunRepository(db),
    async close(): Promise<void> {
      await client.end();
    }
  };
};

const resolveReadOnlyRuntime = async (
  runtime: CodexBriefCommandRuntime,
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  if (runtime.createDatabaseRuntime === undefined) {
    return createReadOnlyHarnessRuntime(databaseUrl);
  }

  const input: DatabaseRuntimeInput = {
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  };
  const databaseRuntime = await runtime.createDatabaseRuntime(input);

  return {
    harnessRunRepository: databaseRuntime.harnessRunRepository,
    close: databaseRuntime.close
  };
};

const renderText = (
  runId: string,
  briefText: string
): string =>
  [
    "KRN Codex Brief",
    `Run ID: ${runId}`,
    "Persistence: read-only (Postgres)",
    "Codex invocation: none",
    "Memory mutation: none",
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

  const readRuntime = await resolveReadOnlyRuntime(runtime, databaseUrl);

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

    const evidenceContract =
      parseEvidenceContract(aggregate.harnessPlan.metadata.evidenceContract) ??
      createEvidenceContract(aggregate.taskContract);
    const capabilityPlan = createCapabilityPlan({
      harnessPlan: aggregate.harnessPlan,
      hasContext: aggregate.contextAssembly.inclusions.length > 0,
      createdAt: runtime.now(),
      createId: runtime.createId
    });
    const brief = createExecutionBrief({
      taskContract: aggregate.taskContract,
      harnessPlan: aggregate.harnessPlan,
      contextAssembly: aggregate.contextAssembly,
      capabilityPlan,
      evidenceContract,
      nextAction: aggregate.harnessPlan.nextAction ?? "Use this brief as the next Codex input.",
      goalReference: "GOAL.md active KRN final harness spine",
      execPlanReference: "GOAL.md M26.03"
    });

    return {
      stdout: renderText(runtime.runId, renderExecutionBriefText(brief))
    };
  } finally {
    await readRuntime.close();
  }
};
