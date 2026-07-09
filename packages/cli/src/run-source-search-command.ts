import type {
  TaskContract
} from "@krn/core";
import {
  applyContextROI,
  buildActivationQuery,
  retrieveActivationCandidates,
  type RankedActivationCandidate
} from "@krn/harness";
import {
  createDatabaseRuntime
} from "./database-runtime.js";
import {
  sourceClaimAuthorityStateFor
} from "@krn/core";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  CliCommand
} from "./parse-args.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  createSourceCommandDatabaseRuntime
} from "./source-database-runtime-support.js";
import {
  buildSourceConsensusReadback,
  buildRelationSupport,
  buildSourceClaimDocumentLinks
} from "./source-search-graph-readback.js";
import {
  formatSearchJson,
  formatSearchResult
} from "./source-search-readback.js";
import {
  applySourceDecisionSupportBoost,
  buildSourceDecisionSupport,
  sourceDecisionSupportForCandidates
} from "./source-search-decision-support.js";
export {
  buildSourceSearchMissingEvidence,
  buildSourceSearchQueryShapeDiagnostics,
  classifySourceSearchAnswerUsefulness
} from "./source-search-readback.js";

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

const defaultLimit = 20;
const defaultMaxInclusions = 6;
const defaultSourceClaimScanFloor = 30;

const sourceSearchSourceClaimCanReadBack = (
  candidate: RankedActivationCandidate
): boolean => {
  if (candidate.subjectType !== "source_claim") {
    return true;
  }

  if (candidate.sourceClaimStatus !== undefined && candidate.sourceClaimStatus !== "accepted") {
    return false;
  }

  if (candidate.sourceClaimAuthorityStatus !== undefined) {
    const state = sourceClaimAuthorityStateFor({
      status: candidate.sourceClaimAuthorityStatus,
      reasons: candidate.sourceClaimAuthorityReasons ?? []
    });

    return state === "accepted" || state === "conflicting" || state === "unsupported";
  }

  return candidate.sourceClaimStatus === "accepted";
};

const sourceSearchSourceClaimExclusionReason = (
  candidate: RankedActivationCandidate
): "stale" | "unsafe" =>
  candidate.sourceClaimAuthorityStatus !== undefined &&
  sourceClaimAuthorityStateFor({
    status: candidate.sourceClaimAuthorityStatus,
    reasons: candidate.sourceClaimAuthorityReasons ?? []
  }) === "stale"
    ? "stale"
    : "unsafe";

const applySourceSearchEvidenceFilter = (
  candidates: readonly RankedActivationCandidate[]
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined || sourceSearchSourceClaimCanReadBack(candidate)) {
      return candidate;
    }

    return {
      ...candidate,
      exclusion: {
        reason: sourceSearchSourceClaimExclusionReason(candidate),
        explanation: candidate.subjectType === "source_claim" && candidate.sourceClaimStatus !== "accepted"
          ? `Source claims require accepted status before activation; ${candidate.sourceClaimStatus ?? "unknown"} claims remain review candidates, not source-search evidence. SourceClaim authority status ${candidate.sourceClaimAuthorityStatus ?? "unknown"}.`
          : `Source search can read back accepted, caveated, or evidence-gap SourceClaims only; ${candidate.sourceClaimAuthorityStatus ?? candidate.sourceClaimStatus ?? "unknown"} is not reviewable as source-search evidence.`
      }
    };
  });

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
  const databaseRuntime = await createSourceCommandDatabaseRuntime({
    createRuntime: runtime.createDatabaseRuntime ?? createDatabaseRuntime,
    databaseUrl,
    commandProjectId: runtime.command.projectId,
    cwd: runtime.cwd,
    requireProjectKernelForExplicitProject: false,
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
    const authoritySafe = applySourceSearchEvidenceFilter(retrieved.candidates);
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
    const consensusReadback = await buildSourceConsensusReadback({
      candidates: bounded,
      now,
      sourceRepository: databaseRuntime.sourceRepository
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
            sourceClaimDocumentLinks,
            consensusReadback
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
            sourceClaimDocumentLinks,
            consensusReadback
          })
    };
  } finally {
    await databaseRuntime.close();
  }
};
