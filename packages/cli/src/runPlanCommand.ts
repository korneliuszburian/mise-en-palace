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
  formatActivationRetrievalDiagnostics
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
} from "@krn/schema";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput,
  ProjectResolution
} from "./databaseRuntime.js";
import {
  createNoStoreCompilerDependencies
} from "./noStoreRepositories.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import {
  formatProjectResolutionKind
} from "./projectResolutionReadback.js";
import {
  detectSourceSeeds
} from "./runInitCommand.js";
import type {
  SourceSeedProposal
} from "./runInitCommand.js";

export interface PlanCommandRuntime {
  env: Record<string, string | undefined>;
  cwd?: string;
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
  projectResolution?: ProjectResolution;
  compilerDependencies: HarnessCompilerDependencies;
  harnessRunRepository?: Pick<HarnessRunRepository, "createExecutionRun">;
  projectScopedMetadata?: ProjectScopedPlanMetadata;
  close(): Promise<void>;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

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
  "mcp_workspace",
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

const sourceSeedFromUnknown = (value: unknown): SourceSeedProposal | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const seedPath = value.path;
  const kind = value.kind;
  const reason = value.reason;

  if (
    typeof seedPath !== "string" ||
    seedPath.trim().length === 0 ||
    typeof kind !== "string" ||
    !isSourceSeedKind(kind) ||
    kind.trim().length === 0 ||
    typeof reason !== "string" ||
    reason.trim().length === 0
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
): NonNullable<TargetActivationReadModel["ownerFiles"]>[number] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const ownerPath = value.path;
  const root = value.root;
  const kind = value.kind;
  const reason = value.reason;

  if (
    typeof ownerPath !== "string" ||
    ownerPath.trim().length === 0 ||
    typeof root !== "string" ||
    root.trim().length === 0 ||
    typeof kind !== "string" ||
    kind.trim().length === 0 ||
    typeof reason !== "string" ||
    reason.trim().length === 0
  ) {
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
  const ownerFilesByPath = new Map<string, NonNullable<TargetActivationReadModel["ownerFiles"]>[number]>();

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
  projectResolution: ProjectResolution | undefined,
  contextAssembly: ContextAssembly,
  evidenceCommands: readonly string[],
  nextAction: string,
  executionBrief: string,
  projectScopedMetadata?: ProjectScopedPlanMetadata,
  targetReadModel?: TargetActivationReadModel,
  persistedIdentity?: PersistedPlanIdentity
): string => {
  const lines = [
    "KRN Plan",
    `Task: ${task}`,
    `Project ID: ${projectId}`,
    `Persistence: ${persistenceLabel}`,
    ...(projectResolution === undefined
      ? []
      : [
          `Project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
          `Project resolution reason: ${projectResolution.reason}`,
          ...(projectResolution.repoPathHint === undefined
            ? []
            : [`Project resolution repoPathHint: ${projectResolution.repoPathHint}`]),
          `Project resolution does not prove: ${projectResolution.doesNotProve}`
        ]),
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
    ...(targetReadModel === undefined
      ? []
      : (() => {
          const ownerFileRecall = assessTargetOwnerFileRecall(targetReadModel);

          return [
            `Target read model: sourceSeeds=${targetReadModel.sourceSeeds.length}, ownerFiles=${targetReadModel.ownerFiles?.length ?? 0}, trustExclusions=${targetReadModel.trustExclusions.length}`,
            `Target owner-file recall: ${ownerFileRecall.status}`,
            `Target owner-file reason: ${ownerFileRecall.reason}`,
            `Target owner-file explanation: ${ownerFileRecall.explanation}`,
            `Target owner-file does not prove: ${ownerFileRecall.doesNotProve}`,
            ...(ownerFileRecall.status === "missing_owner_file_read_model"
              ? ["Target owner files: unavailable; using root-level source seeds only"]
              : [`Target owner files: ${ownerFileRecall.ownerFilePaths.join(", ")}`])
          ];
        })()),
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
    const targetReadModel = await buildTargetActivationReadModel(
      compilerRuntime.projectScopedMetadata
    );
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
        ...(targetReadModel === undefined ? {} : { targetReadModel }),
        ...(compileInput.tokenBudget === undefined ? {} : { tokenBudget: compileInput.tokenBudget }),
        metadata: compileInput.metadata
      },
      compilerRuntime.compilerDependencies
    );
    const targetOwnerFileRecall =
      targetReadModel === undefined ? undefined : assessTargetOwnerFileRecall(targetReadModel);
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
              ...(targetReadModel === undefined
                ? {}
                : {
                    targetReadModel: {
                      sourceSeedCount: targetReadModel.sourceSeeds.length,
                      ownerFileCount: targetReadModel.ownerFiles?.length ?? 0,
                      trustExclusionCount: targetReadModel.trustExclusions.length,
                      sourceSeedPaths: targetReadModel.sourceSeeds.map((seed) => seed.path),
                      ownerFilePaths: (targetReadModel.ownerFiles ?? []).map((ownerFile) => ownerFile.path),
                      ...(targetOwnerFileRecall === undefined
                        ? {}
                        : { ownerFileRecall: targetOwnerFileRecall })
                    }
                  }),
              ...(compilerRuntime.projectResolution === undefined
                ? {}
                : { projectResolution: compilerRuntime.projectResolution }),
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
        compilerRuntime.projectResolution,
        result.contextAssembly,
        evidenceCommands,
        result.nextAction,
        executionBrief,
        compilerRuntime.projectScopedMetadata,
        targetReadModel,
        persistedIdentity
      )
    };
  } finally {
    await compilerRuntime.close();
  }
};
