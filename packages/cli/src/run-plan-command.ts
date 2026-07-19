import path from "node:path";

import {
  renderExecutionBrief
} from "@krn/codex-adapter";
import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  DecisionPacket,
  DecisionPacketContractReadback
} from "@krn/core";
import {
  activationRetrievalDiagnosticsFromMetadata,
  assessTargetOwnerFileRecall,
  compileHarnessPlan,
  decisionPacketForCompiledPlan,
  formatActivationRetrievalDiagnostics,
  searchKnowledgeReadModels,
  tokenizeActivationText
} from "@krn/harness";
import type {
  HarnessCompilerDependencies,
  TargetActivationReadModel
} from "@krn/harness";
import type {
  HarnessRunRepository,
  ProjectKernelRecord,
  RepoInstallationRecord
} from "@krn/core/repositories";
import {
  decisionPacketNextActionMetadataKey,
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
  findRepoRoot,
  pathExists,
  pathExistsWithin
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
import {
  applyStoreKnowledgeUsefulnessFeedback,
  listStoreKnowledgeUsefulnessFeedback
} from "./store-knowledge-usefulness-selection.js";

export interface PlanCommandRuntime extends BaseCommandRuntime {
  cwd?: string;
  persist: boolean;
  format?: "text" | "json";
  projectId?: string;
  repo?: string;
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

interface PersistedPlanOutput {
  identity: PersistedPlanIdentity;
  issuance: DecisionPacketContractReadback;
}

interface PlanJsonOutput {
  kind: "krn.plan.v1";
  task: string;
  project: {
    id: string;
    resolution?: ProjectResolution;
  };
  handoff:
    | {
        kind: "persisted";
        identity: PersistedPlanIdentity;
        packetIdentity: DecisionPacketContractReadback["packetIdentity"];
      }
    | {
        kind: "preview";
        packet: DecisionPacket;
        doesNotProve: string;
      };
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
  harnessRunRepository?: Pick<HarnessRunRepository, "createExecutionRun"> &
    Partial<Pick<
      HarnessRunRepository,
      "issueDecisionPacketForExecutionRun" | "listFeedbackDeltasForSubjects"
    >>;
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

interface OwnerFileAvailability {
  ownerFiles: NonNullable<TargetActivationReadModel["ownerFiles"]>;
  unavailableOwnerFilePaths: string[];
}

const ownerFileAvailability = async (
  ownerFiles: NonNullable<TargetActivationReadModel["ownerFiles"]>,
  localPathHints: readonly string[]
): Promise<OwnerFileAvailability> => {
  if (localPathHints.length === 0) {
    return {
      ownerFiles,
      unavailableOwnerFilePaths: []
    };
  }

  const availability = await Promise.all(ownerFiles.map(async (ownerFile) => {
    const available = (await Promise.all(localPathHints.map(async (localPathHint) => {
      return pathExistsWithin(localPathHint, ownerFile.path);
    }))).some(Boolean);

    return { ownerFile, available };
  }));

  return {
    ownerFiles: availability.flatMap(({ ownerFile, available }) =>
      available ? [ownerFile] : []
    ),
    unavailableOwnerFilePaths: availability.flatMap(({ ownerFile, available }) =>
      available ? [] : [ownerFile.path]
    )
  };
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
  const configuredOwnerFiles = uniqueOwnerFiles(
    kernelOwnerFiles.length > 0 ? kernelOwnerFiles : installationOwnerFiles
  );
  const localPathHints = repoInstallations.flatMap((repoInstallation) =>
    repoInstallation.localPathHint === undefined ? [] : [repoInstallation.localPathHint]
  );
  const ownerAvailability = await ownerFileAvailability(
    configuredOwnerFiles,
    localPathHints
  );

  return {
    ...(metadata.projectKernel === undefined ? {} : { projectKernelId: metadata.projectKernel.id }),
    repoInstallationIds: repoInstallations.map((repoInstallation) => repoInstallation.id),
    localPathHints,
    sourceSeeds,
    ...(ownerAvailability.ownerFiles.length === 0
      ? {}
      : { ownerFiles: ownerAvailability.ownerFiles }),
    ...(ownerAvailability.unavailableOwnerFilePaths.length === 0
      ? {}
      : { unavailableOwnerFilePaths: ownerAvailability.unavailableOwnerFilePaths }),
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

  if (runtime.repo !== undefined) {
    return "krn plan --repo --persist";
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

const resolvePlanRepoPathHint = async (
  runtime: Pick<PlanCommandRuntime, "cwd" | "projectId" | "repo">
): Promise<string | undefined> => {
  if (runtime.projectId !== undefined || runtime.cwd === undefined) {
    return undefined;
  }

  const requestedRepoPath =
    runtime.repo === undefined ? runtime.cwd : path.resolve(runtime.cwd, runtime.repo);

  if (runtime.repo !== undefined && !(await pathExists(requestedRepoPath))) {
    throw new Error(`Target repo does not exist: ${requestedRepoPath}`);
  }

  return findRepoRoot(requestedRepoPath);
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
  const repoPathHint = await resolvePlanRepoPathHint(runtime);
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug,
    projectSlug,
    ...(runtime.projectId === undefined ? {} : { projectId: runtime.projectId }),
    ...(repoPathHint === undefined ? {} : { repoPathHint }),
    ...(runtime.repo === undefined ? {} : { requireConnectedRepoPath: true }),
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
  if ((runtime.projectId !== undefined || runtime.repo !== undefined) && !runtime.persist) {
    throw new Error("krn plan --project or --repo requires --persist");
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
    formatTargetOwnerFilesLine(ownerFileRecall),
    ...((ownerFileRecall.unavailableOwnerFilePaths?.length ?? 0) === 0
      ? []
      : [`Target owner files unavailable: ${(ownerFileRecall.unavailableOwnerFilePaths ?? []).join(", ")}`])
  ];
};

const formatTargetOwnerFilesLine = (ownerFileRecall: TargetOwnerFileRecall): string => (
  ownerFileRecall.ownerFilePaths.length === 0
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

const planKnowledgeSelectionLimit = 5;
const planKnowledgeScanLimit = 100;

const readKnowledgeSelection = async (
  query: string,
  compilerRuntime: CompilerRuntimeResolution
): Promise<KnowledgePlanSelection> => {
  const recordsWithSentinel = await compilerRuntime.compilerDependencies.memoryRepository
    .listActiveMemory(
      compilerRuntime.projectId,
      planKnowledgeScanLimit + 1,
      { terms: tokenizeActivationText(query) }
    );
  const scanTruncated = recordsWithSentinel.length > planKnowledgeScanLimit;
  const records = recordsWithSentinel.slice(0, planKnowledgeScanLimit);
  const knowledgeReadModels = records.map(memoryRecordToKnowledgeReadModel);
  const feedbackDeltas = await listStoreKnowledgeUsefulnessFeedback({
    projectId: compilerRuntime.projectId,
    readModels: knowledgeReadModels,
    ...(compilerRuntime.harnessRunRepository === undefined
      ? {}
      : { harnessRunRepository: compilerRuntime.harnessRunRepository })
  });
  const usefulnessSelection = applyStoreKnowledgeUsefulnessFeedback(
    knowledgeReadModels,
    feedbackDeltas
  );
  const readModels = searchKnowledgeReadModels(
    usefulnessSelection.readModels,
    {
      text: query
    }
  ).slice(0, planKnowledgeSelectionLimit);
  const selection = knowledgeSelectionFromReadbackJson(
    query,
    JSON.stringify({
      kind: "krn.memory.recall.readback.v1",
      access: "read_only",
      mutation: "none",
      source: "memory_store",
      filter: {
        text: query
      },
      totalReadModels: readModels.length,
      returnedReadModels: readModels.length,
      readModels,
      ...(usefulnessSelection.reviewOnlyUsefulnessCaveats.length === 0
        ? {}
        : {
            reviewOnlyUsefulnessCaveats: usefulnessSelection.reviewOnlyUsefulnessCaveats
          }),
      proof: {
        proves: [
          "plan knowledge selection read active MemoryRecord rows from the resolved DB project",
          `plan knowledge selection scan limit=${planKnowledgeScanLimit} returned=${records.length} truncated=${scanTruncated}`,
          ...(usefulnessSelection.attachedReviewOnlyFeedback
            ? ["plan knowledge selection attached review-only store-backed usefulness feedback"]
            : [])
        ],
        doesNotProve: [
          "DB-backed knowledge selection proves source truth",
          "Codex used the selected memory",
          `bounded plan knowledge selection proves no eligible knowledge exists beyond the first ${planKnowledgeScanLimit} ranked active rows`,
          ...(usefulnessSelection.attachedReviewOnlyFeedback
            ? ["store-backed usefulness feedback proves broad ranking quality"]
            : ["store-backed usefulness feedback was available"])
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
  let lastSelection: KnowledgePlanSelection | undefined;

  for (const query of queries) {
    const selection = await readKnowledgeSelection(query, compilerRuntime);

    if (selection.status === "selected") {
      return selection;
    }

    lastSelection = selection;
  }

  return lastSelection;
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
    const reason = error instanceof Error ? error.message : "unknown memory recall readback error";

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

const renderPlanExecutionBrief = (
  result: CompiledHarnessPlan,
  issuedDecisionPacket: DecisionPacket | undefined
): string => renderExecutionBrief({
  packet: issuedDecisionPacket ?? decisionPacketForCompiledPlan(result)
});

const renderPlanJson = (input: {
  task: string;
  compilerRuntime: CompilerRuntimeResolution;
  persistedPlan?: PersistedPlanOutput;
  packet: DecisionPacket;
}): string => {
  return `${JSON.stringify({
    kind: "krn.plan.v1",
    task: input.task,
    project: {
      id: input.compilerRuntime.projectId,
      ...(input.compilerRuntime.projectResolution === undefined
        ? {}
        : { resolution: input.compilerRuntime.projectResolution })
    },
    handoff: input.persistedPlan === undefined
      ? {
          kind: "preview",
          packet: input.packet,
          doesNotProve: "A no-store preview is not an issued DecisionPacket and cannot bind persisted evidence."
        }
      : {
          kind: "persisted",
          identity: input.persistedPlan.identity,
          packetIdentity: input.persistedPlan.issuance.packetIdentity
        }
  } satisfies PlanJsonOutput, null, 2)}\n`;
};

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
          unavailableOwnerFilePaths: targetReadModel.unavailableOwnerFilePaths ?? [],
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

const createPersistedPlanOutput = async (
  compilerRuntime: CompilerRuntimeResolution,
  result: CompiledHarnessPlan,
  command: string,
  targetReadModel: TargetActivationReadModel | undefined,
  targetOwnerFileRecall: TargetOwnerFileRecall | undefined
): Promise<PersistedPlanOutput | undefined> => {
  const executionRun =
    compilerRuntime.harnessRunRepository === undefined
      ? undefined
      : await compilerRuntime.harnessRunRepository.createExecutionRun({
          harnessPlanId: result.harnessPlan.id,
          adapter: "codex",
          metadata: {
            command,
            ...projectScopedMetadataForRun(compilerRuntime),
            ...knowledgeSelectionMetadataForRun(result.harnessPlan),
            ...targetReadModelMetadata(targetReadModel, targetOwnerFileRecall),
            ...(compilerRuntime.projectResolution === undefined
              ? {}
              : { projectResolution: compilerRuntime.projectResolution }),
            [decisionPacketNextActionMetadataKey]: result.nextAction,
            evidenceContract: result.evidenceContract,
            codexAdapterPlanRef: result.codexAdapterPlanRef
          }
        });

  if (executionRun === undefined) {
    return undefined;
  }

  if (compilerRuntime.harnessRunRepository?.issueDecisionPacketForExecutionRun === undefined) {
    throw new Error("Persisted plan requires authoritative DecisionPacket issuance");
  }

  const issuance =
    await compilerRuntime.harnessRunRepository.issueDecisionPacketForExecutionRun(executionRun.id);

  return {
    identity: {
      operatorIntentId: result.operatorIntent.id,
      taskContractId: result.taskContract.id,
      harnessPlanId: result.harnessPlan.id,
      contextAssemblyId: result.contextAssembly.id,
      executionRunId: executionRun.id
    },
    issuance
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
    const persistedPlan = await createPersistedPlanOutput(
      compilerRuntime,
      result,
      commandLabelForRuntime(runtime),
      targetReadModel,
      targetOwnerFileRecall
    );
    const authoritativePacket = persistedPlan?.issuance.packet;
    const evidenceCommands = authoritativePacket?.verificationCommands ??
      result.evidenceContract.commands.map((command) => command.command);
    const nextAction = authoritativePacket?.nextAction ?? result.nextAction;
    const executionBrief = renderPlanExecutionBrief(
      result,
      authoritativePacket
    );

    if (runtime.format === "json") {
      return {
        stdout: renderPlanJson({
          task,
          compilerRuntime,
          ...(persistedPlan === undefined ? {} : { persistedPlan }),
          packet: authoritativePacket ?? decisionPacketForCompiledPlan(result)
        })
      };
    }

    return {
      stdout: formatPlanSummary(
        task,
        compilerRuntime.projectId,
        compilerRuntime.persistenceLabel,
        compilerRuntime.projectResolution,
        result.contextAssembly,
        evidenceCommands,
        nextAction,
        executionBrief,
        knowledgeSelection,
        compilerRuntime.projectScopedMetadata,
        targetReadModel,
        persistedPlan?.identity
      )
    };
  } finally {
    await compilerRuntime.close();
  }
};
