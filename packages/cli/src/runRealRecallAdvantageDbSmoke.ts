import postgres from "postgres";

import {
  runSourceSearchCommand
} from "./runSourceSearchCommand.js";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import {
  bindSmokeProjectRuntimeFactory,
  closeSmokeRuntimeAndClient,
  finalizeSmokeMarkerCleanup
} from "./smokeRuntimeCleanup.js";

type PostgresClient = ReturnType<typeof postgres>;

interface RealRecallAdvantageDecision {
  readonly id: string;
  readonly standardId: string;
  readonly query: string;
  readonly claim: string;
  readonly mechanism: string;
  readonly implication: string;
  readonly consumer: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
  readonly expectedDecision: string;
}

export interface RealRecallAdvantageDecisionResult {
  readonly decisionId: string;
  readonly standardId: string;
  readonly query: string;
  readonly expectedDecision: string;
  readonly baselineSelectedGovernClaim: boolean;
  readonly baselineIncludedCandidateCount: number;
  readonly groundedSelectedGovernClaim: boolean;
  readonly groundedIncludedCandidateCount: number;
  readonly groundedSourceClaimId: string | null;
}

export interface RealRecallAdvantageDbSmokeInput {
  readonly databaseUrl: string;
  readonly repoRoot: string;
  readonly smokeId: string;
  readonly now: string;
}

export interface RealRecallAdvantageDbSmokeReport {
  readonly smokeId: string;
  readonly projectId: string;
  readonly decisionCount: number;
  readonly groundedHitCount: number;
  readonly baselineHitCount: number;
  readonly decisions: readonly RealRecallAdvantageDecisionResult[];
  readonly limitationClassification: string;
  readonly remainingMarkerCount: number;
  readonly cleanedUp: boolean;
}

// Real KRN governing decisions extracted from repo docs/ADRs (KRN_KERNEL.md,
// naming-vocabulary-audit.md, kernel-next-priority-synthesis.md). These are the
// actual standards the project adopted, not synthetic company-pattern fixtures.
const realDecisions: readonly RealRecallAdvantageDecision[] = [
  {
    id: "real-decision-worker-contract-only",
    standardId: "standard:worker-contract-readback-only",
    query: "should KRN build a worker daemon or background loop for memory maintenance",
    claim:
      "KRN workers must stay contract and readback only; reject a worker daemon, background loop, or job executor until a named product loop requires runtime execution.",
    mechanism:
      "A contract and readback only workers package keeps memory maintenance candidate-only and reviewable instead of implying an autonomous worker daemon, background loop, or job executor.",
    implication:
      "When asked whether to build a worker daemon or background loop for memory maintenance, KRN should select the contract and readback only decision.",
    consumer: "worker runtime boundary",
    falsifier:
      "A KRN slice adds a worker daemon, background loop, scheduler, or job executor without a named product loop that requires runtime execution.",
    doesNotProve: "This does not prove the workers package will never need an executor.",
    expectedDecision:
      "Keep workers contract and readback only; do not build a worker daemon, background loop, or job executor without a named product loop."
  },
  {
    id: "real-decision-unknown-first-boundary",
    standardId: "standard:unknown-first-external-input",
    query: "should external JSON CLI or MCP inputs be cast directly or parsed unknown first",
    claim:
      "TypeScript external JSON, environment, file, CLI, or MCP inputs should enter as unknown and narrow near the boundary through a named parser helper.",
    mechanism:
      "Unknown-first parsing keeps unvalidated external JSON, CLI, or MCP input out of typed command and domain state until a named parser helper validates it near the boundary.",
    implication:
      "When asked whether external JSON CLI or MCP inputs should be cast directly, KRN should select the unknown-first parser boundary decision.",
    consumer: "external input boundary",
    falsifier:
      "A KRN slice casts parsed external JSON, CLI, or MCP input directly into command or domain state without a named parser helper.",
    doesNotProve: "This does not prove every parser helper is complete or correct.",
    expectedDecision:
      "Parse external JSON, CLI, and MCP inputs unknown first through a named boundary helper; do not cast them directly into typed state."
  },
  {
    id: "real-decision-bounded-loop-before-surfaces",
    standardId: "standard:bounded-loop-before-surfaces",
    query: "should KRN build a crawler dashboard or API surface next",
    claim:
      "KRN should prove one bounded local ingest loop before building a crawler, dashboard, API, or MCP surface.",
    mechanism:
      "A bounded local ingest loop proves select, apply, verify, and forget machinery on real content before any crawler, dashboard, API, or MCP surface is justified.",
    implication:
      "When asked whether to build a crawler, dashboard, or API surface next, KRN should select the bounded local loop first decision.",
    consumer: "product surface prioritization",
    falsifier:
      "A KRN slice builds a crawler, dashboard, API, or MCP surface before a bounded local ingest loop is proven.",
    doesNotProve: "This does not prove a bounded local loop will always be sufficient.",
    expectedDecision:
      "Prove one bounded local ingest loop first; do not build a crawler, dashboard, API, or MCP surface until that loop is proven."
  }
];

const smokeSource = "krn db smoke real-recall-advantage";

// Tables this smoke writes to (source seed) or that source-search writes while
// running. Focused subset of the marker-table family; we do not touch memory,
// harness-run, or heartbeat tables here.
const markerTables = [
  "retrieval_runs",
  "source_decision_edges",
  "search_documents",
  "source_decisions",
  "source_claim_edges",
  "source_claims",
  "source_artifacts"
] as const;

const deleteMarkerRows = (
  client: PostgresClient,
  table: typeof markerTables[number],
  smokeId: string
) => client.unsafe(
  `delete from ${table} where metadata->>'smokeId' = $1 or metadata->>'source' = $2`,
  [smokeId, smokeSource]
);

const cleanupMarkerRows = async (
  client: PostgresClient,
  smokeId: string
): Promise<void> => {
  for (const table of markerTables) {
    await deleteMarkerRows(client, table, smokeId);
  }
  await client`
    delete from outbox_events
    where payload->>'smokeId' = ${smokeId}
      or payload->>'source' = ${smokeSource}
  `;
  await client`
    delete from run_events
    where payload->>'smokeId' = ${smokeId}
  `;
};

const countMarkerRows = async (
  client: PostgresClient,
  smokeId: string
): Promise<number> => {
  const rows = await client<{ count: number }[]>`
    select (
      (select count(*)::int from outbox_events where payload->>'smokeId' = ${smokeId}) +
      (select count(*)::int from retrieval_runs where metadata->>'smokeId' = ${smokeId}) +
      (select count(*)::int from run_events where payload->>'smokeId' = ${smokeId}) +
      (select count(*)::int from source_artifacts where metadata->>'smokeId' = ${smokeId}) +
      (select count(*)::int from source_claims where metadata->>'smokeId' = ${smokeId}) +
      (select count(*)::int from source_decisions where metadata->>'smokeId' = ${smokeId}) +
      (select count(*)::int from source_decision_edges where metadata->>'smokeId' = ${smokeId}) +
      (select count(*)::int from search_documents where metadata->>'smokeId' = ${smokeId})
    ) as count
  `;

  return rows[0]?.count ?? 0;
};

interface SourceSearchJson {
  readonly includedCandidates: readonly unknown[];
}

const parseSourceSearchJson = (text: string): SourceSearchJson => {
  const parsed: unknown = JSON.parse(text);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("real-recall-advantage DB smoke expected JSON object output");
  }

  const record = parsed as Record<string, unknown>;
  const includedCandidates = record["includedCandidates"];

  return {
    includedCandidates: Array.isArray(includedCandidates)
      ? includedCandidates as readonly unknown[]
      : []
  };
};

const candidateSourceClaimId = (candidate: unknown): string | undefined => {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return undefined;
  }

  const id = (candidate as Record<string, unknown>)["sourceClaimId"];

  return typeof id === "string" ? id : undefined;
};

const runSourceSearch = async (
  input: RealRecallAdvantageDbSmokeInput,
  createId: (prefix: string) => string,
  createSmokeDatabaseRuntime: (runtimeInput: Parameters<typeof createDatabaseRuntime>[0]) =>
    Promise<Awaited<ReturnType<typeof createDatabaseRuntime>>>,
  query: string
): Promise<SourceSearchJson> => {
  const result = await runSourceSearchCommand({
    cwd: input.repoRoot,
    env: {
      KRN_DATABASE_URL: input.databaseUrl
    },
    now: () => input.now,
    createId,
    createDatabaseRuntime: createSmokeDatabaseRuntime,
    command: {
      kind: "sourceSearch",
      query,
      json: true,
      limit: 12,
      maxInclusions: 6
    }
  });

  return parseSourceSearchJson(result.stdout);
};

const seedDecision = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  decision: RealRecallAdvantageDecision,
  projectId: string,
  input: RealRecallAdvantageDbSmokeInput,
  metadata: Record<string, unknown>
): Promise<{ readonly sourceClaimId: string }> => {
  const sourceArtifact = await runtime.sourceRepository.createSourceArtifact({
    projectId,
    kind: "doc",
    trustTier: "project-decision",
    uri: `smoke://real-recall-advantage/${decision.id}`,
    title: `Real recall advantage source ${decision.id}`,
    contentHash: `real-recall-${input.smokeId}-${decision.id}`,
    metadata
  });
  const sourceClaim = await runtime.sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    claim: `${decision.claim} Marker: ${decision.query}.`,
    mechanism: decision.mechanism,
    krnImplication: decision.implication,
    doesNotProve: decision.doesNotProve,
    trustTier: "project-decision",
    supportType: "implementation-boundary",
    consumer: decision.consumer,
    falsifier: decision.falsifier,
    metadata: {
      ...metadata,
      decisionId: decision.id,
      standardId: decision.standardId
    }
  });
  const sourceDecision = await runtime.sourceRepository.createSourceDecision?.({
    projectId,
    sourceClaimId: sourceClaim.id,
    status: "adopt",
    decision: decision.expectedDecision,
    rationale:
      "The real governing decision has mechanism, implication, consumer, falsifier, and non-proof boundary.",
    falsifier: decision.falsifier,
    consumer: decision.consumer,
    metadata: {
      ...metadata,
      decisionId: decision.id,
      standardId: decision.standardId
    }
  });

  if (sourceDecision === undefined) {
    throw new Error("SourceDecision creation is unavailable for real-recall-advantage DB smoke");
  }

  await runtime.sourceRepository.createSourceDecisionEdge({
    sourceClaimId: sourceClaim.id,
    targetType: "architecture_decision",
    targetId: `real-recall-advantage-${decision.id}`,
    supportType: "implementation-boundary",
    confidence: "high",
    notes: "Decision-linked support for the real-recall-advantage DB replay.",
    metadata: {
      ...metadata,
      decisionId: decision.id,
      sourceDecisionId: sourceDecision.id
    }
  });
  const searchDocument = await runtime.retrievalRepository?.createSearchDocument({
    projectId,
    subjectType: "source_claim",
    subjectId: sourceClaim.id,
    sourceArtifactId: sourceArtifact.id,
    sourceClaimId: sourceClaim.id,
    trustTier: "project-decision",
    title: `Real recall advantage SearchDocument ${decision.id}`,
    body: `${decision.expectedDecision} ${decision.claim}`,
    searchText: `${decision.query} ${decision.standardId} ${decision.expectedDecision} ${decision.claim} ${decision.mechanism}`,
    metadataFilters: {
      smokeId: input.smokeId
    },
    metadata: {
      ...metadata,
      decisionId: decision.id,
      sourceDecisionId: sourceDecision.id
    }
  });

  if (searchDocument === undefined) {
    throw new Error("SearchDocument creation is unavailable for real-recall-advantage DB smoke");
  }

  return { sourceClaimId: sourceClaim.id };
};

export const runRealRecallAdvantageDbSmokeCheck = async (
  input: RealRecallAdvantageDbSmokeInput
): Promise<RealRecallAdvantageDbSmokeReport> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const createId = (prefix: string): string => `${prefix}-${input.smokeId}`;
  const metadata = {
    smokeId: input.smokeId,
    source: smokeSource
  };
  let runtime: Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;

  try {
    await cleanupMarkerRows(client, input.smokeId);
    runtime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: "real-recall-advantage-smoke",
      requireProjectKernelForExplicitProject: false,
      now: () => input.now,
      createId
    });
    const projectId = runtime.projectId;
    const createSmokeDatabaseRuntime = bindSmokeProjectRuntimeFactory(runtime);

    // Baseline pass: run each natural-language query BEFORE the governing
    // decisions are seeded. The brain cannot surface a decision it has not
    // learned, so the governing claim (not yet created) cannot be selected.
    const baselineResults = await Promise.all(realDecisions.map(async (decision) => {
      const json = await runSourceSearch(input, createId, createSmokeDatabaseRuntime, decision.query);
      return { decision, json };
    }));

    // Seed every real governing decision (source artifact, claim, adopt
    // decision, decision edge, search document) with real prose searchText.
    const seeded = await Promise.all(realDecisions.map(async (decision) => ({
      decision,
      ...(await seedDecision(runtime as Awaited<ReturnType<typeof createDatabaseRuntime>>,
        decision, projectId, input, metadata))
    })));

    await runtime.close();
    runtime = undefined;

    // Grounded pass: run the same natural-language queries AFTER seeding.
    // The brain must surface each governing claim via lexical/vector recall
    // boosted by its decision-linked SourceDecisionEdge.
    const decisionResults = await Promise.all(seeded.map(async (seededEntry) => {
      const { decision, sourceClaimId } = seededEntry;
      const baselineEntry = baselineResults.find((entry) => entry.decision.id === decision.id);
      const baselineJson = baselineEntry === undefined
        ? { includedCandidates: [] as readonly unknown[] }
        : baselineEntry.json;
      const baselineCandidateIds = baselineJson.includedCandidates
        .map(candidateSourceClaimId)
        .filter((id): id is string => id !== undefined);
      const groundedJson = await runSourceSearch(input, createId, createSmokeDatabaseRuntime, decision.query);
      const groundedCandidateIds = groundedJson.includedCandidates
        .map(candidateSourceClaimId)
        .filter((id): id is string => id !== undefined);

      return {
        decisionId: decision.id,
        standardId: decision.standardId,
        query: decision.query,
        expectedDecision: decision.expectedDecision,
        baselineSelectedGovernClaim: baselineCandidateIds.includes(sourceClaimId),
        baselineIncludedCandidateCount: baselineCandidateIds.length,
        groundedSelectedGovernClaim: groundedCandidateIds.includes(sourceClaimId),
        groundedIncludedCandidateCount: groundedCandidateIds.length,
        groundedSourceClaimId: groundedCandidateIds.includes(sourceClaimId) ? sourceClaimId : null
      };
    }));

    const groundedHitCount = decisionResults.filter((result) => result.groundedSelectedGovernClaim).length;
    const baselineHitCount = decisionResults.filter((result) => result.baselineSelectedGovernClaim).length;

    if (groundedHitCount !== realDecisions.length) {
      const missed = decisionResults
        .filter((result) => !result.groundedSelectedGovernClaim)
        .map((result) => result.decisionId);
      throw new Error(
        `Real-recall-advantage DB smoke grounded run missed governing claims: ${missed.join(", ")}`
      );
    }

    const markerCleanup = await finalizeSmokeMarkerCleanup(
      client,
      input.smokeId,
      countMarkerRows,
      cleanupMarkerRows
    );

    return {
      smokeId: input.smokeId,
      projectId,
      decisionCount: realDecisions.length,
      groundedHitCount,
      baselineHitCount,
      decisions: decisionResults,
      limitationClassification:
        "natural_language_recall_of_real_repo_decisions_not_live_codex_or_broad_ranking",
      remainingMarkerCount: markerCleanup.remainingMarkerCount,
      cleanedUp: markerCleanup.cleanedUp
    };
  } finally {
    await closeSmokeRuntimeAndClient(runtime, client);
  }
};
