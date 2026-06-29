import type {
  TaskContract
} from "@krn/core";
import {
  applyContextROI,
  buildActivationQuery,
  retrieveActivationCandidates
} from "@krn/harness";
import type {
  RetrieveActivationCandidatesResult,
  RankedActivationCandidate
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

export type SourceSearchCommand = Extract<CliCommand, { kind: "sourceSearch" }>;

export interface SourceSearchCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
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

type SearchReviewability =
  | "ready"
  | "needs_more_evidence"
  | "unknown";

interface ReviewabilityResult {
  reviewability: SearchReviewability;
  reasons: readonly string[];
}

const reviewabilityFor = (candidate: RankedActivationCandidate): ReviewabilityResult => {
  if (candidate.subjectType === "source_claim") {
    const reasons = [
      candidate.hasMechanism === false
        ? "SourceClaim is missing mechanism."
        : "SourceClaim has mechanism.",
      candidate.doesNotProve === undefined || candidate.doesNotProve.trim().length === 0
        ? "SourceClaim is missing doesNotProve."
        : "SourceClaim has doesNotProve boundary."
    ];

    return {
      reviewability: reasons.some((reason) => reason.includes("missing"))
        ? "needs_more_evidence"
        : "ready",
      reasons
    };
  }

  if (candidate.subjectType === "search_document") {
    return {
      reviewability: candidate.searchDocumentId === undefined ? "needs_more_evidence" : "ready",
      reasons: [
        candidate.searchDocumentId === undefined
          ? "Search candidate has no SearchDocument id."
          : "SearchDocument row matched the query.",
        "SearchDocument readback is reviewable only as retrieval evidence."
      ]
    };
  }

  return {
    reviewability: "unknown",
    reasons: ["Candidate kind is outside the V341 SourceClaim/SearchDocument preview scope."]
  };
};

const formatCandidate = (
  candidate: RankedActivationCandidate,
  status: "included" | "excluded"
): string[] => {
  const reviewability = reviewabilityFor(candidate);

  return [
    `- ${candidate.subjectType}:${candidate.subjectId}`,
    `  status: ${status}`,
    `  kind: ${candidate.kind}`,
    `  trustTier: ${candidate.trustTier}`,
    `  totalScore: ${candidate.totalScore}`,
    `  lexicalScore: ${candidate.lexicalScore}`,
    `  graphScore: ${candidate.graphScore}`,
    `  contextRoiScore: ${candidate.contextRoiScore}`,
    `  reason: ${candidate.reason}`,
    `  expectedUse: ${candidate.expectedUse}`,
    `  reviewability: ${reviewability.reviewability}`,
    "  reviewability reasons:",
    ...reviewability.reasons.map((reason) => `  - ${reason}`),
    ...(candidate.searchDocumentId === undefined
      ? []
      : [`  searchDocumentId: ${candidate.searchDocumentId}`]),
    ...(candidate.sourceClaimId === undefined
      ? []
      : [`  sourceClaimId: ${candidate.sourceClaimId}`]),
    ...(candidate.doesNotProve === undefined
      ? []
      : [`  doesNotProve: ${candidate.doesNotProve}`]),
    ...(candidate.exclusion === undefined
      ? []
      : [
          `  exclusionReason: ${candidate.exclusion.reason}`,
          `  exclusionExplanation: ${candidate.exclusion.explanation}`
        ])
  ];
};

const candidateLabel = (candidate: RankedActivationCandidate): string =>
  `${candidate.subjectType}:${candidate.subjectId}`;

const formatAnswerPackage = (input: {
  query: string;
  included: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
}): string[] => {
  const supportingClaims = input.included.filter(
    (candidate) => candidate.subjectType === "source_claim"
  );
  const supportingDocuments = input.included.filter(
    (candidate) => candidate.subjectType === "search_document"
  );
  const neutralOrNoise = input.included.filter(
    (candidate) =>
      candidate.subjectType !== "source_claim" && candidate.subjectType !== "search_document"
  );
  const missingEvidence = [
    ...(input.diagnostics.sourceClaimCount === 0
      ? ["governed SourceClaim evidence for this query"]
      : []),
    ...(input.diagnostics.searchResultCount === 0
      ? supportingClaims.length > 0
        ? ["matching SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"]
        : ["matching SearchDocument evidence for this query"]
      : [])
  ];
  const recommendedNextAction =
    supportingClaims.length > 0 && supportingDocuments.length > 0
      ? "Use the supporting claims/documents as a Pattern Application Gate, then verify the selected pattern against the target slice."
    : supportingClaims.length > 0
        ? "Use the supporting claims cautiously and split broad queries into narrower topic-specific source searches before changing retrieval."
        : supportingDocuments.length > 0
          ? "Inspect the documents and verify whether a governed SourceClaim should exist before relying on them."
          : "Narrow the query or ingest a bounded local artifact before changing ranking or adding a product surface.";

  return [
    "Answer package preview:",
    `answer: Source search found ${supportingClaims.length} supporting SourceClaim(s) and ${supportingDocuments.length} supporting SearchDocument(s) for "${input.query}".`,
    "supporting claims:",
    ...(supportingClaims.length === 0
      ? ["- none"]
      : supportingClaims.map((candidate) => `- ${candidateLabel(candidate)} | ${candidate.reason}`)),
    "supporting documents:",
    ...(supportingDocuments.length === 0
      ? ["- none"]
      : supportingDocuments.map((candidate) => `- ${candidateLabel(candidate)} | ${candidate.reason}`)),
    "neutral/noise:",
    ...(neutralOrNoise.length === 0
      ? ["- none from included candidates"]
      : neutralOrNoise.map((candidate) => `- ${candidateLabel(candidate)} | outside SourceClaim/SearchDocument answer scope`)),
    "missing evidence:",
    ...(missingEvidence.length === 0 ? ["- none detected by current diagnostics"] : missingEvidence.map((item) => `- ${item}`)),
    "doesNotProve:",
    `- ${input.diagnostics.doesNotProve}`,
    "- source truth, answer correctness, ranking quality, product readiness, or Memory Core mutation",
    `recommended next action: ${recommendedNextAction}`
  ];
};

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

const formatSearchResult = (input: {
  query: string;
  projectId: string;
  limit: number;
  maxInclusions: number;
  candidates: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
}): string => {
  const included = input.candidates.filter((candidate) => candidate.exclusion === undefined);
  const excluded = input.candidates.filter((candidate) => candidate.exclusion !== undefined);

  return [
    "KRN Source Knowledge Search",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    "Mutation: none",
    `Query: ${input.query}`,
    `Project: ${input.projectId}`,
    `Limit: ${input.limit}`,
    `Max inclusions: ${input.maxInclusions}`,
    "",
    "Diagnostics:",
    `- inputStatus: ${input.diagnostics.inputStatus}`,
    `- sourceClaims: ${input.diagnostics.sourceClaimCount}`,
    `- searchResults: ${input.diagnostics.searchResultCount}`,
    `- mergedCandidates: ${input.diagnostics.mergedCandidateCount}`,
    `- doesNotProve: ${input.diagnostics.doesNotProve}`,
    "",
    ...formatAnswerPackage({
      query: input.query,
      included,
      diagnostics: input.diagnostics
    }),
    "",
    "Included candidates:",
    ...(included.length === 0
      ? ["- none"]
      : included.flatMap((candidate) => formatCandidate(candidate, "included"))),
    "",
    "Excluded candidates:",
    ...(excluded.length === 0
      ? ["- none"]
      : excluded.flatMap((candidate) => formatCandidate(candidate, "excluded"))),
    "",
    "No-match guidance:",
    ...(input.candidates.length === 0
      ? [
          "- no candidates matched; try a narrower marker/hash query or ingest a local artifact first"
        ]
      : [
          "- if an expected SearchDocument is excluded, inspect score and budget before changing ranking",
          "- if an expected SourceClaim is missing, verify source claim persistence and project scope"
        ]),
    "",
    "Proof:",
    "- proves: current Postgres can read persisted source/search candidates for this query",
    "- proves: readback shows inclusion/exclusion, scores, reviewability, and proof boundaries",
    "- doesNotProve: source truth, ranking quality, embeddings, graph retrieval, crawler readiness, product readiness, or Memory Core mutation",
    "Memory mutation: none",
    "Crawler: none",
    "Embeddings: not run",
    "Graph runtime: not run"
  ].join("\n");
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
        source: limit,
        search: limit,
        antiMemory: 0
      },
      repositories: {
        memoryRepository: databaseRuntime.compilerDependencies.memoryRepository,
        sourceRepository: databaseRuntime.compilerDependencies.sourceRepository,
        retrievalRepository
      }
    });
    const bounded = applyContextROI(retrieved.candidates, {
      maxInclusions,
      minimumDiverseKinds: ["source", "search"]
    });

    return {
      stdout: formatSearchResult({
        query,
        projectId: databaseRuntime.projectId,
        limit,
        maxInclusions,
        candidates: bounded,
        diagnostics: retrieved.diagnostics
      })
    };
  } finally {
    await databaseRuntime.close();
  }
};
