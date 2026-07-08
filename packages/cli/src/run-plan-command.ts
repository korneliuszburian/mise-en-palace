import {
  renderExecutionBrief
} from "@krn/codex-adapter";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion
} from "@krn/core";
import {
  activationRetrievalDiagnosticsFromMetadata,
  assessTargetOwnerFileRecall,
  compileHarnessPlan,
  formatActivationRetrievalDiagnostics,
  searchKnowledgeReadModels
} from "@krn/harness";
import type {
  HarnessCompilerDependencies,
  TargetActivationReadModel
} from "@krn/harness";
import type {
  HarnessRunRepository,
  ProjectKernelRecord,
  RepoInstallationRecord
} from "@krn/harness/repositories";
import {
  parseHarnessCompileInput,
  parseOperatorIntentInput,
  parseTaskContractInput
} from "@krn/core";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput,
  ProjectResolution
} from "./database-runtime.js";
import {
  createNoStoreCompilerDependencies
} from "./no-store-repositories.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  formatProjectResolutionKind
} from "./project-resolution-format.js";
import {
  detectSourceSeeds
} from "./run-init-command.js";
import type {
  SourceSeedProposal
} from "./run-init-command.js";
import {
  compactBrainRecallBridgeQueries
} from "./brain-recall-query.js";
import {
  formatKnowledgeSelectionLines,
  knowledgePlanSelectionMetadataKey,
  knowledgeSelectionFromReadbackJson,
  unavailableKnowledgeSelection
} from "./knowledge-selection.js";
import type {
  KnowledgePlanSelection
} from "./knowledge-selection.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  memoryRecordToKnowledgeReadModel
} from "./memory-record-knowledge-read-model.js";

export interface PlanCommandRuntime extends BaseCommandRuntime {
  cwd?: string;
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
  projectResolution?: ProjectResolution;
  compilerDependencies: HarnessCompilerDependencies;
  harnessRunRepository?: Pick<HarnessRunRepository, "createExecutionRun">;
  projectScopedMetadata?: ProjectScopedPlanMetadata;
  close(): Promise<void>;
}

type TargetOwnerFile = NonNullable<TargetActivationReadModel["ownerFiles"]>[number];
type HarnessCompileInput = ReturnType<typeof parseHarnessCompileInput>;
type CompiledHarnessPlan = Awaited<ReturnType<typeof compileHarnessPlan>>;
type TargetOwnerFileRecall = ReturnType<typeof assessTargetOwnerFileRecall>;

const targetTrustExclusions = [
  {
    pathPattern: ".env*",
    reason: "secret-shaped environment files must not enter planning context without explicit redaction"
  },
  {
    pathPattern: ".muke/",
    reason: "generated target runtime/eval state is not source truth by default"
  },
  {
    pathPattern: ".git/",
    reason: "Git internals are not planning context"
  },
  {
    pathPattern: "node_modules/",
    reason: "installed dependencies are generated/vendor state"
  },
  {
    pathPattern: "dist/",
    reason: "build output is generated state"
  },
  {
    pathPattern: "build/",
    reason: "build output is generated state"
  },
  {
    pathPattern: ".supersearch/runtime/",
    reason: "target runtime directories can contain generated state or secrets"
  }
] as const satisfies TargetActivationReadModel["trustExclusions"];

const sourceSeedKinds = [
  "package_manifest",
  "workspace_manifest",
  "typescript_config",
  "project_readme",
  "agent_instructions",
  "docs_root",
  "eval_workspace",
  "script_root",
  "source_root",
  "test_root"
] as const satisfies readonly SourceSeedProposal["kind"][];

const isSourceSeedKind = (value: string): value is SourceSeedProposal["kind"] =>
  sourceSeedKinds.some((kind) => kind === value);

const subjectRef = (item: { subjectType: string; subjectId: string }): string =>
  `${item.subjectType}:${item.subjectId}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonBlankStringField = (
  record: Record<string, unknown>,
  field: string
): string | undefined => {
  const value = record[field];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? undefined : trimmed;
};

const sourceSeedFromUnknown = (value: unknown): SourceSeedProposal | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const seedPath = nonBlankStringField(value, "path");
  const kind = nonBlankStringField(value, "kind");
  const reason = nonBlankStringField(value, "reason");

  if (
    seedPath === undefined ||
    kind === undefined ||
    !isSourceSeedKind(kind) ||
    reason === undefined
  ) {
    return undefined;
  }

  return {
    path: seedPath,
    kind,
    reason
  };
};

const sourceSeedsFromMetadata = (
  metadata: Record<string, unknown> | undefined
): SourceSeedProposal[] => {
  const sourceSeeds = metadata?.sourceSeeds;

  if (!Array.isArray(sourceSeeds)) {
    return [];
  }

  return sourceSeeds.flatMap((seed) => {
    const parsed = sourceSeedFromUnknown(seed);

    return parsed === undefined ? [] : [parsed];
  });
};

const targetOwnerFileFromUnknown = (
  value: unknown
): TargetOwnerFile | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const ownerPath = nonBlankStringField(value, "path");
  const root = nonBlankStringField(value, "root");
  const kind = nonBlankStringField(value, "kind");
  const reason = nonBlankStringField(value, "reason");

  if (ownerPath === undefined || root === undefined || kind === undefined || reason === undefined) {
    return undefined;
  }

  return {
    path: ownerPath,
    root,
    kind,
    reason
  };
};

const ownerFilesFromMetadata = (
  metadata: Record<string, unknown> | undefined
): NonNullable<TargetActivationReadModel["ownerFiles"]> => {
  const ownerFiles = metadata?.ownerFiles;

  if (!Array.isArray(ownerFiles)) {
    return [];
  }

  return ownerFiles.flatMap((ownerFile) => {
    const parsed = targetOwnerFileFromUnknown(ownerFile);

    return parsed === undefined ? [] : [parsed];
  });
};

const uniqueOwnerFiles = (
  ownerFiles: NonNullable<TargetActivationReadModel["ownerFiles"]>
): NonNullable<TargetActivationReadModel["ownerFiles"]> => {
  const ownerFilesByPath = new Map<string, TargetOwnerFile>();

  for (const ownerFile of ownerFiles) {
    ownerFilesByPath.set(ownerFile.path, ownerFile);
  }

  return [...ownerFilesByPath.values()].sort((left, right) => left.path.localeCompare(right.path));
};

const uniqueSourceSeeds = (
  sourceSeeds: readonly SourceSeedProposal[]
): SourceSeedProposal[] => {
  const seedsByPath = new Map<string, SourceSeedProposal>();

  for (const seed of sourceSeeds) {
    seedsByPath.set(seed.path, seed);
  }

  return [...seedsByPath.values()].sort((left, right) => left.path.localeCompare(right.path));
};

const buildTargetActivationReadModel = async (
  metadata: ProjectScopedPlanMetadata | undefined
): Promise<TargetActivationReadModel | undefined> => {
  if (metadata === undefined) {
    return undefined;
  }

  const repoInstallations = metadata.repoInstallations ?? [];
  const liveSeedGroups = await Promise.all(
    repoInstallations.map(async (repoInstallation) => {
      const localPathHint = repoInstallation.localPathHint;

      if (localPathHint === undefined || localPathHint.trim().length === 0) {
        return [];
      }

      return detectSourceSeeds(localPathHint);
    })
  );
  const metadataSeeds = [
    ...sourceSeedsFromMetadata(metadata.projectKernel?.metadata),
    ...repoInstallations.flatMap((repoInstallation) =>
      sourceSeedsFromMetadata(repoInstallation.metadata)
    )
  ];
  const sourceSeeds = uniqueSourceSeeds([
    ...metadataSeeds,
    ...liveSeedGroups.flat()
  ]);
  const kernelOwnerFiles = ownerFilesFromMetadata(metadata.projectKernel?.metadata);
  const installationOwnerFiles = repoInstallations.flatMap((repoInstallation) =>
    ownerFilesFromMetadata(repoInstallation.metadata)
  );
  const ownerFiles = uniqueOwnerFiles(
    kernelOwnerFiles.length > 0 ? kernelOwnerFiles : installationOwnerFiles
  );

  return {
    ...(metadata.projectKernel === undefined ? {} : { projectKernelId: metadata.projectKernel.id }),
    repoInstallationIds: repoInstallations.map((repoInstallation) => repoInstallation.id),
    localPathHints: repoInstallations.flatMap((repoInstallation) =>
      repoInstallation.localPathHint === undefined ? [] : [repoInstallation.localPathHint]
    ),
    sourceSeeds,
    ...(ownerFiles.length === 0 ? {} : { ownerFiles }),
    trustExclusions: targetTrustExclusions
  };
};

const formatInclusionLine = (inclusion: ContextInclusion): string =>
  [
    `- ${subjectRef(inclusion)}`,
    `reason=${inclusion.reason}`,
    `expected_use=${inclusion.expectedUse}`,
    `authority=${inclusion.sourceAuthority}`
  ].join(" | ");

const formatExclusionLine = (exclusion: ContextExclusion): string =>
  [
    `- ${subjectRef(exclusion)}`,
    `reason=${exclusion.reason}`,
    `explanation=${exclusion.explanation}`,
    `authority=${exclusion.sourceAuthority}`
  ].join(" | ");

const formatActivationSummary = (
  contextAssembly: ContextAssembly,
  nextAction: string
): string[] => {
  const diagnostics = activationRetrievalDiagnosticsFromMetadata(contextAssembly.metadata);

  return [
    `Context status: ${contextAssembly.status}`,
    "Context inclusions:",
    ...(contextAssembly.inclusions.length === 0
      ? ["- none"]
      : contextAssembly.inclusions.map(formatInclusionLine)),
    "Context exclusions:",
    ...(contextAssembly.exclusions.length === 0
      ? ["- none"]
      : contextAssembly.exclusions.map(formatExclusionLine)),
    ...(diagnostics === undefined ? [] : formatActivationRetrievalDiagnostics(diagnostics)),
    ...(contextAssembly.status === "abstained" ? [`Context abstention: ${nextAction}`] : [])
  ];
};

const commandLabelForRuntime = (runtime: PlanCommandRuntime): string => {
  if (runtime.projectId !== undefined) {
    return "krn plan --project --persist";
  }

  return runtime.persist ? "krn plan --persist" : "krn plan";
};

const noStoreCompilerRuntime = (
  runtime: PlanCommandRuntime,
  workspaceSlug: string,
  projectSlug: string
): CompilerRuntimeResolution => ({
  workspaceId: `workspace:${workspaceSlug}`,
  projectId: `project:${projectSlug}`,
  persistenceLabel: "disabled (explicit no-store preview; use --persist to write)",
  compilerDependencies: createNoStoreCompilerDependencies(runtime),
  async close(): Promise<void> {
    return undefined;
  }
});

const projectScopedMetadataFromRuntime = (
  databaseRuntime: DatabaseRuntime
): ProjectScopedPlanMetadata | undefined => {
  if (databaseRuntime.projectKernel === undefined && databaseRuntime.repoInstallations === undefined) {
    return undefined;
  }

  return {
    ...(databaseRuntime.projectKernel === undefined
      ? {}
      : { projectKernel: databaseRuntime.projectKernel }),
    ...(databaseRuntime.repoInstallations === undefined
      ? {}
      : { repoInstallations: databaseRuntime.repoInstallations })
  };
};

const persistedCompilerRuntime = async (
  runtime: PlanCommandRuntime,
  workspaceSlug: string,
  projectSlug: string
): Promise<CompilerRuntimeResolution> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn plan --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const repoPathHint =
    runtime.projectId === undefined && runtime.cwd !== undefined
      ? await findRepoRoot(runtime.cwd)
      : undefined;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug,
    projectSlug,
    ...(runtime.projectId === undefined ? {} : { projectId: runtime.projectId }),
    ...(repoPathHint === undefined ? {} : { repoPathHint }),
    now: runtime.now,
    createId: runtime.createId
  });

  return {
    workspaceId: databaseRuntime.workspaceId,
    projectId: databaseRuntime.projectId,
    persistenceLabel: "enabled (Postgres, explicit --persist)",
    ...(databaseRuntime.projectResolution === undefined
      ? {}
      : { projectResolution: databaseRuntime.projectResolution }),
    compilerDependencies: databaseRuntime.compilerDependencies,
    harnessRunRepository: databaseRuntime.harnessRunRepository,
    ...optionalProjectScopedMetadata(projectScopedMetadataFromRuntime(databaseRuntime)),
    close: databaseRuntime.close
  };
};

const optionalProjectScopedMetadata = (
  projectScopedMetadata: ProjectScopedPlanMetadata | undefined
): Pick<CompilerRuntimeResolution, "projectScopedMetadata"> | Record<string, never> => (
  projectScopedMetadata === undefined ? {} : { projectScopedMetadata }
);

const resolveCompilerRuntime = async (
  runtime: PlanCommandRuntime,
  workspaceSlug: string,
  projectSlug: string
): Promise<CompilerRuntimeResolution> => {
  if (runtime.projectId !== undefined && !runtime.persist) {
    throw new Error("krn plan --project requires --persist");
  }

  return runtime.persist
    ? persistedCompilerRuntime(runtime, workspaceSlug, projectSlug)
    : noStoreCompilerRuntime(runtime, workspaceSlug, projectSlug);
};

const formatProjectResolutionLines = (
  projectResolution: ProjectResolution | undefined
): string[] => (
  projectResolution === undefined
    ? []
    : [
        `Project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
        `Project resolution reason: ${projectResolution.reason}`,
        ...(projectResolution.repoPathHint === undefined
          ? []
          : [`Project resolution repoPathHint: ${projectResolution.repoPathHint}`]),
        `Project resolution does not prove: ${projectResolution.doesNotProve}`
      ]
);

const formatProjectScopedMetadataLines = (
  projectScopedMetadata: ProjectScopedPlanMetadata | undefined
): string[] => [
  ...(projectScopedMetadata?.projectKernel === undefined
    ? []
    : [`ProjectKernel: ${projectScopedMetadata.projectKernel.id}`]),
  ...(projectScopedMetadata?.repoInstallations === undefined
    ? []
    : [`Repo installations: ${formatRepoInstallationIds(projectScopedMetadata.repoInstallations)}`])
];

const formatRepoInstallationIds = (
  repoInstallations: readonly RepoInstallationRecord[]
): string => (
  repoInstallations.length === 0
    ? "none"
    : repoInstallations.map((repoInstallation) => repoInstallation.id).join(", ")
);

const formatTargetReadModelLines = (
  targetReadModel: TargetActivationReadModel | undefined
): string[] => {
  if (targetReadModel === undefined) {
    return [];
  }

  const ownerFileRecall = assessTargetOwnerFileRecall(targetReadModel);

  return [
    `Target read model: sourceSeeds=${targetReadModel.sourceSeeds.length}, ownerFiles=${targetReadModel.ownerFiles?.length ?? 0}, trustExclusions=${targetReadModel.trustExclusions.length}`,
    `Target owner-file recall: ${ownerFileRecall.status}`,
    `Target owner-file reason: ${ownerFileRecall.reason}`,
    `Target owner-file explanation: ${ownerFileRecall.explanation}`,
    `Target owner-file does not prove: ${ownerFileRecall.doesNotProve}`,
    formatTargetOwnerFilesLine(ownerFileRecall)
  ];
};

const formatTargetOwnerFilesLine = (ownerFileRecall: TargetOwnerFileRecall): string => (
  ownerFileRecall.status === "missing_owner_file_read_model"
    ? "Target owner files: unavailable; using root-level source seeds only"
    : `Target owner files: ${ownerFileRecall.ownerFilePaths.join(", ")}`
);

const formatPersistedIdentityLines = (
  persistedIdentity: PersistedPlanIdentity | undefined
): string[] => (
  persistedIdentity === undefined
    ? []
    : [
        "",
        "Persisted IDs:",
        `operatorIntent: ${persistedIdentity.operatorIntentId}`,
        `taskContract: ${persistedIdentity.taskContractId}`,
        `harnessPlan: ${persistedIdentity.harnessPlanId}`,
        `contextAssembly: ${persistedIdentity.contextAssemblyId}`,
        `executionRun: ${persistedIdentity.executionRunId}`
      ]
);

const withKnowledgeSelectionReason = (
  selection: KnowledgePlanSelection,
  reason: string
): KnowledgePlanSelection => ({
  ...selection,
  reason
});

const readKnowledgeSelection = async (
  query: string,
  compilerRuntime: CompilerRuntimeResolution
): Promise<KnowledgePlanSelection> => {
  const records = await compilerRuntime.compilerDependencies.memoryRepository.listActiveMemory(
    compilerRuntime.projectId,
    20
  );
  const readModels = searchKnowledgeReadModels(
    records.map(memoryRecordToKnowledgeReadModel),
    {
      text: query
    }
  ).slice(0, 5);
  const selection = knowledgeSelectionFromReadbackJson(
    query,
    JSON.stringify({
      kind: "krn.brain.recall.readback.v1",
      access: "read_only",
      mutation: "none",
      source: "memory_store",
      filter: {
        text: query
      },
      totalReadModels: readModels.length,
      returnedReadModels: readModels.length,
      readModels,
      proof: {
        proves: [
          "plan knowledge selection read active MemoryRecord rows from the resolved DB project"
        ],
        doesNotProve: [
          "DB-backed knowledge selection proves source truth",
          "Codex used the selected memory",
          "store-backed usefulness feedback has been applied"
        ]
      }
    })
  );

  return selection.status === "selected"
    ? withKnowledgeSelectionReason(selection, "Store-backed knowledge read model matched the pre-coding plan query.")
    : selection;
};

const firstSelectedKnowledge = async (
  queries: readonly string[],
  compilerRuntime: CompilerRuntimeResolution
): Promise<KnowledgePlanSelection | undefined> => {
  for (const query of queries) {
    const selection = await readKnowledgeSelection(query, compilerRuntime);

    if (selection.status === "selected") {
      return selection;
    }
  }

  return undefined;
};

const buildKnowledgeSelection = async (
  task: string,
  compilerRuntime: CompilerRuntimeResolution
): Promise<KnowledgePlanSelection> => {
  const baseQueries = [task, task.replace(/-/gu, " ")];
  const queries = [...new Set(baseQueries.flatMap((query) => {
    const compactQueries = compactBrainRecallBridgeQueries(query);

    return [query, ...compactQueries];
  }))];

  try {
    const selection = await firstSelectedKnowledge(queries, compilerRuntime);

    if (selection !== undefined) {
      return selection;
    }

    return knowledgeSelectionFromReadbackJson(
      task,
      JSON.stringify({
        source: "memory_store",
        readModels: [],
        proof: {
          proves: ["store-backed MemoryRecord readback was executed with primary and compacted bridge queries"],
          doesNotProve: ["memory store completeness", "knowledge relevance"]
        }
      })
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown brain recall readback error";

    return unavailableKnowledgeSelection(task, reason);
  }
};

const withKnowledgeSelectionMetadata = (
  compileInput: HarnessCompileInput,
  knowledgeSelection: KnowledgePlanSelection
): HarnessCompileInput => ({
  ...compileInput,
  metadata: {
    ...(compileInput.metadata ?? {}),
    [knowledgePlanSelectionMetadataKey]: knowledgeSelection
  }
});

const formatPlanSummary = (
  task: string,
  projectId: string,
  persistenceLabel: string,
  projectResolution: ProjectResolution | undefined,
  contextAssembly: ContextAssembly,
  evidenceCommands: readonly string[],
  nextAction: string,
  executionBrief: string,
  knowledgeSelection: KnowledgePlanSelection,
  projectScopedMetadata?: ProjectScopedPlanMetadata,
  targetReadModel?: TargetActivationReadModel,
  persistedIdentity?: PersistedPlanIdentity
): string => {
  const lines = [
    "KRN Plan",
    `Task: ${task}`,
    `Project ID: ${projectId}`,
    `Persistence: ${persistenceLabel}`,
    ...formatProjectResolutionLines(projectResolution),
    ...formatProjectScopedMetadataLines(projectScopedMetadata),
    ...formatTargetReadModelLines(targetReadModel),
    ...formatKnowledgeSelectionLines(knowledgeSelection),
    `Context included: ${contextAssembly.inclusions.length}`,
    `Context excluded: ${contextAssembly.exclusions.length}`,
    ...formatActivationSummary(contextAssembly, nextAction),
    `Evidence expected: ${evidenceCommands.join(", ")}`,
    `Next action: ${nextAction}`,
    "",
    executionBrief,
    ...formatPersistedIdentityLines(persistedIdentity)
  ];

  return lines.join("\n");
};

const buildHarnessCompileInput = (
  task: string,
  runtime: PlanCommandRuntime
): HarnessCompileInput => {
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

  return parseHarnessCompileInput({
    operatorIntent,
    taskContract,
    tokenBudget: 1200,
    metadata: {
      command: commandLabelForRuntime(runtime)
    }
  });
};

const compilePlanForCommand = (
  compilerRuntime: CompilerRuntimeResolution,
  compileInput: HarnessCompileInput,
  targetReadModel: TargetActivationReadModel | undefined
): Promise<CompiledHarnessPlan> =>
  compileHarnessPlan(
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
      ...(targetReadModel === undefined ? {} : { targetReadModel }),
      ...(compileInput.tokenBudget === undefined ? {} : { tokenBudget: compileInput.tokenBudget }),
      metadata: compileInput.metadata
    },
    compilerRuntime.compilerDependencies
  );

const renderPlanExecutionBrief = (result: CompiledHarnessPlan): string =>
  renderExecutionBrief({
    taskContract: result.taskContract,
    contextAssembly: result.contextAssembly,
    capabilityPlan: result.capabilityPlan,
    evidenceContract: result.evidenceContract,
    nextAction: result.nextAction
  });

const targetReadModelMetadata = (
  targetReadModel: TargetActivationReadModel | undefined,
  targetOwnerFileRecall: TargetOwnerFileRecall | undefined
): Record<string, unknown> => (
  targetReadModel === undefined
    ? {}
    : {
        targetReadModel: {
          sourceSeedCount: targetReadModel.sourceSeeds.length,
          ownerFileCount: targetReadModel.ownerFiles?.length ?? 0,
          trustExclusionCount: targetReadModel.trustExclusions.length,
          sourceSeedPaths: targetReadModel.sourceSeeds.map((seed) => seed.path),
          ownerFilePaths: (targetReadModel.ownerFiles ?? []).map((ownerFile) => ownerFile.path),
          ...(targetOwnerFileRecall === undefined ? {} : { ownerFileRecall: targetOwnerFileRecall })
        }
      }
);

const projectScopedMetadataForRun = (
  compilerRuntime: CompilerRuntimeResolution
): Record<string, unknown> => ({
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
      })
});

const knowledgeSelectionMetadataForRun = (
  harnessPlan: CompiledHarnessPlan["harnessPlan"]
): Record<string, unknown> => {
  const knowledgeSelection =
    harnessPlan.metadata[knowledgePlanSelectionMetadataKey];

  return knowledgeSelection === undefined
    ? {}
    : { [knowledgePlanSelectionMetadataKey]: knowledgeSelection };
};

const createPersistedPlanIdentity = async (
  compilerRuntime: CompilerRuntimeResolution,
  result: CompiledHarnessPlan,
  command: string,
  targetReadModel: TargetActivationReadModel | undefined,
  targetOwnerFileRecall: TargetOwnerFileRecall | undefined
): Promise<PersistedPlanIdentity | undefined> => {
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
            command,
            ...projectScopedMetadataForRun(compilerRuntime),
            ...knowledgeSelectionMetadataForRun(result.harnessPlan),
            ...targetReadModelMetadata(targetReadModel, targetOwnerFileRecall),
            ...(compilerRuntime.projectResolution === undefined
              ? {}
              : { projectResolution: compilerRuntime.projectResolution }),
            evidenceContract: result.evidenceContract,
            codexAdapterPlanRef: result.codexAdapterPlanRef
          }
        });

  return executionRun === undefined
    ? undefined
    : {
        operatorIntentId: result.operatorIntent.id,
        taskContractId: result.taskContract.id,
        harnessPlanId: result.harnessPlan.id,
        contextAssemblyId: result.contextAssembly.id,
        executionRunId: executionRun.id
      };
};

export const runPlanCommand = async (
  task: string,
  runtime: PlanCommandRuntime
): Promise<PlanCommandResult> => {
  const baseCompileInput = buildHarnessCompileInput(task, runtime);
  const workspaceSlug = baseCompileInput.operatorIntent.workspaceSlug ?? defaultWorkspaceSlug;
  const projectSlug = baseCompileInput.operatorIntent.projectSlug ?? defaultProjectSlug;
  const compilerRuntime = await resolveCompilerRuntime(runtime, workspaceSlug, projectSlug);

  try {
    const knowledgeSelection = await buildKnowledgeSelection(task, compilerRuntime);
    const compileInput = withKnowledgeSelectionMetadata(
      baseCompileInput,
      knowledgeSelection
    );
    const targetReadModel = await buildTargetActivationReadModel(
      compilerRuntime.projectScopedMetadata
    );
    const result = await compilePlanForCommand(compilerRuntime, compileInput, targetReadModel);
    const targetOwnerFileRecall =
      targetReadModel === undefined ? undefined : assessTargetOwnerFileRecall(targetReadModel);
    const executionBrief = renderPlanExecutionBrief(result);
    const evidenceCommands = result.evidenceContract.commands.map((command) => command.command);
    const persistedIdentity = await createPersistedPlanIdentity(
      compilerRuntime,
      result,
      commandLabelForRuntime(runtime),
      targetReadModel,
      targetOwnerFileRecall
    );

    return {
      stdout: formatPlanSummary(
        task,
        compilerRuntime.projectId,
        compilerRuntime.persistenceLabel,
        compilerRuntime.projectResolution,
        result.contextAssembly,
        evidenceCommands,
        result.nextAction,
        executionBrief,
        knowledgeSelection,
        compilerRuntime.projectScopedMetadata,
        targetReadModel,
        persistedIdentity
      )
    };
  } finally {
    await compilerRuntime.close();
  }
};
