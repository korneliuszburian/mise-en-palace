import {
  buildReflectionCandidateGenerationPlan,
  buildReflectionIssueReports
} from "@krn/core";
import type {
  AntiMemoryRecord,
  ObservationItem,
  ReflectionOutput,
  SourceClaim
} from "@krn/core";
import {
  selectReflectionInput
} from "@krn/harness";

import {
  createReflectDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  ReflectDatabaseRuntime,
  ReflectDatabaseRuntimeInput
} from "./databaseRuntime.js";

export type ReflectScope =
  | {
      kind: "run";
      id: string;
    }
  | {
      kind: "project";
      id: string;
    }
  | {
      kind: "topic";
      name: string;
      projectId: string;
    };

export interface ReflectCliCommand {
  kind: "reflect";
  scope: ReflectScope;
  persist: boolean;
}

export type CreateReflectDatabaseRuntime = (
  input: ReflectDatabaseRuntimeInput
) => Promise<ReflectDatabaseRuntime>;

export interface ReflectCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: ReflectCliCommand;
  createReflectDatabaseRuntime?: CreateReflectDatabaseRuntime;
}

export interface ReflectCommandResult {
  stdout: string;
}

const reflectionLimit = 100;

const persistenceLabel = (persist: boolean): string =>
  persist
    ? "enabled (Postgres, explicit --persist)"
    : "disabled (preview only; use --persist to write reflection record)";

const includesTopic = (value: string, topic: string): boolean =>
  value.toLowerCase().includes(topic.toLowerCase());

const filterObservationsByTopic = (
  observations: readonly ObservationItem[],
  topic: string
): ObservationItem[] => observations.filter((observation) => (
  includesTopic(observation.subject, topic) ||
  includesTopic(observation.summary, topic) ||
  includesTopic(observation.body, topic)
));

const filterSourceClaimsByTopic = (
  sourceClaims: readonly SourceClaim[],
  topic: string
): SourceClaim[] => sourceClaims.filter((sourceClaim) => (
  includesTopic(sourceClaim.claim, topic) ||
  includesTopic(sourceClaim.mechanism, topic) ||
  includesTopic(sourceClaim.krnImplication, topic)
));

const filterAntiMemoryByTopic = (
  antiMemoryRecords: readonly AntiMemoryRecord[],
  topic: string
): AntiMemoryRecord[] => antiMemoryRecords.filter((record) => (
  includesTopic(record.key, topic) ||
  includesTopic(record.summary, topic) ||
  includesTopic(record.body, topic)
));

const resolveRunScope = async (
  databaseRuntime: ReflectDatabaseRuntime,
  runId: string
): Promise<{
  projectId: string;
  executionRunId: string;
  taskContractId?: string;
  observations: ObservationItem[];
  sourceClaims: SourceClaim[];
  antiMemoryRecords: AntiMemoryRecord[];
}> => {
  const run = await databaseRuntime.getRunSnapshot(runId);

  if (run === undefined) {
    throw new Error(`No persisted harness run found for reflect scope run:${runId}`);
  }

  const observations = await databaseRuntime.observationRepository.findByRun(
    run.executionRunId,
    { projectId: run.projectId, limit: reflectionLimit }
  );
  const sourceClaims = await databaseRuntime.sourceRepository
    .listSourceClaimsForRun(run.executionRunId);
  const antiMemoryRecords = await databaseRuntime.memoryRepository
    .listAntiMemoryForRun(run.executionRunId);

  return {
    projectId: run.projectId,
    executionRunId: run.executionRunId,
    ...(run.taskContractId === undefined ? {} : { taskContractId: run.taskContractId }),
    observations,
    sourceClaims,
    antiMemoryRecords
  };
};

const resolveProjectScope = async (
  databaseRuntime: ReflectDatabaseRuntime,
  projectId: string
): Promise<{
  projectId: string;
  observations: ObservationItem[];
  sourceClaims: SourceClaim[];
  antiMemoryRecords: AntiMemoryRecord[];
}> => {
  if (!(await databaseRuntime.projectExists(projectId))) {
    throw new Error(`Project not found for reflect scope project:${projectId}`);
  }

  const observations = await databaseRuntime.observationRepository.findByScope({
    projectId,
    limit: reflectionLimit
  });
  const sourceClaims = await databaseRuntime.sourceRepository
    .listClaimsForProject(projectId, reflectionLimit);
  const antiMemoryRecords = await databaseRuntime.memoryRepository
    .listAntiMemoryForProject(projectId, reflectionLimit);

  return {
    projectId,
    observations,
    sourceClaims,
    antiMemoryRecords
  };
};

const resolveReflectionScope = async (
  databaseRuntime: ReflectDatabaseRuntime,
  scope: ReflectScope
): Promise<{
  projectId: string;
  executionRunId?: string;
  taskContractId?: string;
  topic?: string;
  observations: ObservationItem[];
  sourceClaims: SourceClaim[];
  antiMemoryRecords: AntiMemoryRecord[];
}> => {
  if (scope.kind === "run") {
    return resolveRunScope(databaseRuntime, scope.id);
  }

  if (scope.kind === "project") {
    return resolveProjectScope(databaseRuntime, scope.id);
  }

  const projectScope = await resolveProjectScope(databaseRuntime, scope.projectId);

  return {
    ...projectScope,
    topic: scope.name,
    observations: filterObservationsByTopic(projectScope.observations, scope.name),
    sourceClaims: filterSourceClaimsByTopic(projectScope.sourceClaims, scope.name),
    antiMemoryRecords: filterAntiMemoryByTopic(projectScope.antiMemoryRecords, scope.name)
  };
};

const scopeLabel = (scope: ReflectScope): string => {
  if (scope.kind === "topic") {
    return `topic:${scope.name} project:${scope.projectId}`;
  }

  return `${scope.kind}:${scope.id}`;
};

const createReflectionOutput = (input: {
  id: string;
  resolved: Awaited<ReturnType<typeof resolveReflectionScope>>;
  generatedAt: string;
}): ReflectionOutput => {
  const reflectionInput = selectReflectionInput({
    projectId: input.resolved.projectId,
    ...(input.resolved.executionRunId === undefined
      ? {}
      : { executionRunId: input.resolved.executionRunId }),
    ...(input.resolved.taskContractId === undefined
      ? {}
      : { taskContractId: input.resolved.taskContractId }),
    observations: input.resolved.observations,
    sourceClaims: input.resolved.sourceClaims,
    antiMemoryRecords: input.resolved.antiMemoryRecords,
    generatedAt: input.generatedAt,
    metadata: {
      runtime: "krn reflect",
      ...(input.resolved.topic === undefined ? {} : { topic: input.resolved.topic })
    }
  });
  const issueReports = buildReflectionIssueReports({
    observations: input.resolved.observations,
    now: input.generatedAt
  });

  return {
    id: input.id,
    scope: reflectionInput.scope,
    status: "candidate",
    summary: `Manual reflection over ${reflectionInput.observationItemIds.length} observations.`,
    findings: issueReports.findings,
    contradictions: issueReports.contradictions,
    gaps: issueReports.gaps,
    candidateLinks: [],
    memoryCandidates: [],
    sourceClaimCandidates: [],
    antiMemoryCandidates: [],
    policyCandidates: [],
    evalCandidates: [],
    metadata: {
      runtime: "manual",
      candidateRowsWritten: false,
      memoryMutation: "none"
    },
    createdAt: input.generatedAt,
    updatedAt: input.generatedAt
  };
};

export const runReflectCommand = async (
  runtime: ReflectCommandRuntime
): Promise<ReflectCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn reflect");
  }

  const createRuntime = runtime.createReflectDatabaseRuntime ?? createReflectDatabaseRuntime;
  const databaseRuntime = await createRuntime({ databaseUrl });

  try {
    const generatedAt = runtime.now();
    const resolved = await resolveReflectionScope(databaseRuntime, runtime.command.scope);
    const reflectionInput = selectReflectionInput({
      projectId: resolved.projectId,
      ...(resolved.executionRunId === undefined ? {} : { executionRunId: resolved.executionRunId }),
      ...(resolved.taskContractId === undefined ? {} : { taskContractId: resolved.taskContractId }),
      observations: resolved.observations,
      sourceClaims: resolved.sourceClaims,
      antiMemoryRecords: resolved.antiMemoryRecords,
      generatedAt,
      metadata: {
        runtime: "krn reflect",
        ...(resolved.topic === undefined ? {} : { topic: resolved.topic })
      }
    });
    const output = createReflectionOutput({
      id: runtime.createId("reflection-output"),
      resolved,
      generatedAt
    });
    const candidatePlan = buildReflectionCandidateGenerationPlan(output);
    const lines = [
      "KRN Reflect",
      `Generated at: ${generatedAt}`,
      `Persistence: ${persistenceLabel(runtime.command.persist)}`,
      `Scope: ${scopeLabel(runtime.command.scope)}`,
      `Project ID: ${resolved.projectId}`,
      `Observations selected: ${reflectionInput.observationItemIds.length}`,
      `Source claims selected: ${reflectionInput.sourceClaimIds.length}`,
      `Anti-memory records selected: ${reflectionInput.antiMemoryKeys.length}`,
      `Findings: ${output.findings.length}`,
      `Contradictions: ${output.contradictions.length}`,
      `Gaps: ${output.gaps.length}`,
      `Candidate generation status: ${candidatePlan.status}`,
      "Candidate rows written: no",
      "Memory mutation: none",
      "MemoryRecord created: no"
    ];

    if (!runtime.command.persist) {
      lines.push("Reflection record: preview only");

      return {
        stdout: `${lines.join("\n")}\n`
      };
    }

    const record = await databaseRuntime.reflectionRepository.createReflectionRecord({
      scope: reflectionInput.scope,
      status: "candidate",
      summary: output.summary,
      input: reflectionInput,
      output,
      metadata: {
        runtime: "krn reflect",
        scope: scopeLabel(runtime.command.scope),
        candidateRowsWritten: false,
        memoryMutation: "none"
      }
    });

    lines.push(`Reflection record: ${record.id}`);

    return {
      stdout: `${lines.join("\n")}\n`
    };
  } finally {
    await databaseRuntime.close();
  }
};
