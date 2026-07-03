import type {
  TaskContract
} from "@krn/core";
import {
  applySourceClaimAuthorityFilter,
  applyContextROI,
  buildActivationQuery,
  retrieveActivationCandidates
} from "@krn/harness";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import type {
  BaseCommandRuntime
} from "./commandRuntimeSupport.js";
import {
  buildRelationSupport,
  buildSourceClaimDocumentLinks
} from "./sourceSearchGraphReadback.js";
import {
  formatSearchJson,
  formatSearchResult
} from "./sourceSearchReadback.js";
import {
  applySourceDecisionSupportBoost,
  buildSourceDecisionSupport,
  sourceDecisionSupportForCandidates
} from "./sourceSearchDecisionSupport.js";
export {
  buildSourceSearchMissingEvidence,
  buildSourceSearchQueryShapeDiagnostics,
  classifySourceSearchAnswerUsefulness
} from "./sourceSearchReadback.js";

export type SourceSearchCommand = Extract<CliCommand, { kind: "sourceSearch" }>;

export interface SourceSearchCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: SourceSearchCommand;
  createDatabaseRuntime?: CreateSourceSearchDatabaseRuntime;
}

export interface SourceSearchCommandResult {
  stdout: string;
}

export type CreateSourceSearchDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultLimit = 20;
const defaultMaxInclusions = 6;
const defaultSourceClaimScanFloor = 30;

const createSearchTaskContract = (
  runtime: SourceSearchCommandRuntime,
  projectId: string,
  query: string,
  now: string
): TaskContract => ({
  id: runtime.createId("source-search-task"),
  operatorIntentId: runtime.createId("source-search-intent"),
  projectId,
  title: `Knowledge search readback: ${query}`,
  objective: query,
  constraints: [
    "read-only knowledge search",
    "show proof and non-proof boundaries"
  ],
  nonGoals: [
    "crawler",
    "dashboard",
    "API",
    "MCP",
    "Memory Core mutation"
  ],
  acceptance: [
    "show reviewable SourceClaim/SearchDocument candidates",
    "show exclusions or no-match guidance"
  ],
  status: "active",
  metadata: {
    source: "krn source search"
  },
  createdAt: now,
  updatedAt: now
});

const createSearchSourceQuery = (taskContract: TaskContract, query: string) => {
  const queryOnly = buildActivationQuery({
    ...taskContract,
    title: "",
    objective: query,
    constraints: [],
    nonGoals: [],
    acceptance: []
  }, {
    focus: "source",
    needs: ["source", "search"]
  });

  return {
    ...queryOnly,
    text: query
  };
};

export const runSourceSearchCommand = async (
  runtime: SourceSearchCommandRuntime
): Promise<SourceSearchCommandResult> => {
  const query = runtime.command.query?.trim();

  if (query === undefined || query.length === 0) {
    throw new Error("--query is required for krn source search");
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source search");
  }

  const now = runtime.now();
  const limit = runtime.command.limit ?? defaultLimit;
  const maxInclusions = runtime.command.maxInclusions ?? Math.min(defaultMaxInclusions, limit);
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(runtime.command.projectId === undefined ? {} : { projectId: runtime.command.projectId }),
    requireProjectKernelForExplicitProject: false,
    repoPathHint: await findRepoRoot(runtime.cwd),
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const retrievalRepository = databaseRuntime.retrievalRepository;

    if (retrievalRepository === undefined) {
      throw new Error("Retrieval repository is unavailable for krn source search");
    }

    const taskContract = createSearchTaskContract(
      runtime,
      databaseRuntime.projectId,
      query,
      now
    );
    const retrieved = await retrieveActivationCandidates({
      taskContract,
      sourceQuery: createSearchSourceQuery(taskContract, query),
      limits: {
        memory: 0,
        source: Math.max(limit, maxInclusions * 4, defaultSourceClaimScanFloor),
        search: limit,
        antiMemory: 0
      },
      repositories: {
        memoryRepository: databaseRuntime.compilerDependencies.memoryRepository,
        sourceRepository: databaseRuntime.compilerDependencies.sourceRepository,
        retrievalRepository
      }
    });
    const authoritySafe = applySourceClaimAuthorityFilter(retrieved.candidates);
    const sourceDecisionSupportCandidates = authoritySafe.filter(
      (candidate) => candidate.exclusion === undefined
    );
    const availableSourceDecisionSupport = await buildSourceDecisionSupport({
      candidates: sourceDecisionSupportCandidates,
      sourceRepository: databaseRuntime.sourceRepository
    });
    const decisionLinked = applySourceDecisionSupportBoost(
      authoritySafe,
      availableSourceDecisionSupport
    );
    const bounded = applyContextROI(decisionLinked, {
      maxInclusions,
      minimumDiverseKinds: ["source", "search"]
    });
    const included = bounded.filter((candidate) => candidate.exclusion === undefined);
    const relationSupport = await buildRelationSupport({
      included,
      sourceRepository: databaseRuntime.sourceRepository
    });
    const sourceDecisionSupport = sourceDecisionSupportForCandidates(
      included,
      availableSourceDecisionSupport
    );
    const sourceClaimDocumentLinks = await buildSourceClaimDocumentLinks({
      included,
      projectId: databaseRuntime.projectId,
      retrievalRepository
    });

    return {
      stdout: runtime.command.json === true
        ? formatSearchJson({
            query,
            projectId: databaseRuntime.projectId,
            limit,
            maxInclusions,
            candidates: bounded,
            diagnostics: retrieved.diagnostics,
            relationSupport,
            sourceDecisionSupport,
            sourceClaimDocumentLinks
          })
        : formatSearchResult({
            query,
            projectId: databaseRuntime.projectId,
            limit,
            maxInclusions,
            candidates: bounded,
            diagnostics: retrieved.diagnostics,
            relationSupport,
            sourceDecisionSupport,
            sourceClaimDocumentLinks
          })
    };
  } finally {
    await databaseRuntime.close();
  }
};
