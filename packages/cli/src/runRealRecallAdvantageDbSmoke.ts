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
  // A tempting-but-wrong shortcut seeded as an accepted SourceClaim WITHOUT a
  // SourceDecision/SourceDecisionEdge. Pure lexical retrieval picks it first;
  // the brain's decision-linked recall must surface the governing claim ahead.
  readonly distractorClaim: string;
  readonly distractorSearchText: string;
}

export interface RealRecallAdvantageDecisionResult {
  readonly decisionId: string;
  readonly standardId: string;
  readonly query: string;
  readonly expectedDecision: string;
  readonly distractorClaimId: string | null;
  readonly governingClaimId: string | null;
  // Baseline = only the distractor is seeded. Top candidate should be the
  // distractor (the brain without the governing decision picks the shortcut).
  readonly baselineTopClaimId: string | null;
  readonly baselineIncludedCandidateCount: number;
  readonly baselinePickedDistractor: boolean;
  // Grounded = distractor + governing (decision-linked). Top should be governing.
  readonly groundedTopClaimId: string | null;
  readonly groundedPickedGoverning: boolean;
  readonly advantageWin: boolean;
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
  readonly advantageWinCount: number;
  readonly baselineDistractorTopCount: number;
  readonly groundedGoverningTopCount: number;
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
      "Keep workers contract and readback only; do not build a worker daemon, background loop, or job executor without a named product loop.",
    distractorClaim:
      "KRN should run an automatic worker daemon and background loop for memory maintenance so the maintenance loop stays always running without operator action.",
    distractorSearchText:
      "should KRN build a worker daemon or background loop for memory maintenance automatic always running operator action"
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
      "Parse external JSON, CLI, and MCP inputs unknown first through a named boundary helper; do not cast them directly into typed state.",
    distractorClaim:
      "External JSON, CLI, and MCP inputs should be cast directly into typed state for speed instead of unknown-first parsing near the boundary.",
    distractorSearchText:
      "should external JSON CLI or MCP inputs be cast directly external JSON CLI MCP inputs cast directly typed state speed boundary"
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
      "Prove one bounded local ingest loop first; do not build a crawler, dashboard, API, or MCP surface until that loop is proven.",
    distractorClaim:
      "KRN should build a crawler, dashboard, and API surface next to expose the brain to operators before proving any bounded local loop.",
    distractorSearchText:
      "should KRN build a crawler dashboard or API surface next operators expose brain surface"
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

// Included candidates are rank-ordered; the first is the top recall result.
const topCandidateSourceClaimId = (json: SourceSearchJson): string | null => {
  for (const candidate of json.includedCandidates) {
    const id = candidateSourceClaimId(candidate);

    if (id !== undefined) {
      return id;
    }
  }

  return null;
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

// Shared SourceArtifact creation for governing and distractor seeds so the
// artifact bootstrap is not cloned across the two seed paths.
const createSmokeSourceArtifact = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  projectId: string,
  uri: string,
  title: string,
  contentHash: string,
  metadata: Record<string, unknown>
): Promise<string> => {
  const sourceArtifact = await runtime.sourceRepository.createSourceArtifact({
    projectId,
    kind: "doc",
    trustTier: "project-decision",
    uri,
    title,
    contentHash,
    metadata
  });

  return sourceArtifact.id;
};

const seedDecision = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  decision: RealRecallAdvantageDecision,
  projectId: string,
  input: RealRecallAdvantageDbSmokeInput,
  metadata: Record<string, unknown>
): Promise<{ readonly sourceClaimId: string }> => {
  const sourceArtifactId = await createSmokeSourceArtifact(
    runtime,
    projectId,
    `smoke://real-recall-advantage/${decision.id}`,
    `Real recall advantage source ${decision.id}`,
    `real-recall-${input.smokeId}-${decision.id}`,
    metadata
  );
  const sourceClaim = await runtime.sourceRepository.createSourceClaim({
    sourceArtifactId,
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
    sourceArtifactId,
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

// Seeds the tempting-but-wrong distractor: an accepted SourceClaim WITH a
// SourceDecision and a LOW-confidence SourceDecisionEdge so it is visible to
// source-search, but ranks below the governing claim's HIGH-confidence edge.
// The distractor's searchText is lexically denser than the governing claim's,
// so a pure-lexical ranking would pick the distractor first.
const seedDistractor = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  decision: RealRecallAdvantageDecision,
  projectId: string,
  input: RealRecallAdvantageDbSmokeInput,
  metadata: Record<string, unknown>
): Promise<{ readonly distractorClaimId: string }> => {
  const sourceArtifactId = await createSmokeSourceArtifact(
    runtime,
    projectId,
    `smoke://real-recall-advantage/distractor-${decision.id}`,
    `Real recall advantage distractor ${decision.id}`,
    `real-recall-distractor-${input.smokeId}-${decision.id}`,
    metadata
  );
  const sourceClaim = await runtime.sourceRepository.createSourceClaim({
    sourceArtifactId,
    claim: `${decision.distractorClaim} Marker: ${decision.query}.`,
    mechanism:
      "This distractor intentionally represents the tempting shortcut the lexical baseline picks before the governing decision is recorded.",
    krnImplication:
      "This is the wrong shortcut; the governing decision for this query is the accepted, high-confidence, decision-linked claim.",
    doesNotProve: "This intentionally represents the baseline's tempting wrong implementation decision.",
    trustTier: "project-decision",
    supportType: "implementation-boundary",
    consumer: decision.consumer,
    falsifier: decision.falsifier,
    metadata: {
      ...metadata,
      decisionId: decision.id,
      role: "distractor"
    }
  });
  const distractorDecision = await runtime.sourceRepository.createSourceDecision?.({
    projectId,
    sourceClaimId: sourceClaim.id,
    status: "adopt",
    decision: decision.distractorClaim,
    rationale:
      "Distractor decision seeded at low confidence so it is visible but ranks below the high-confidence governing decision.",
    falsifier: decision.falsifier,
    consumer: decision.consumer,
    metadata: {
      ...metadata,
      decisionId: decision.id,
      role: "distractor"
    }
  });

  if (distractorDecision === undefined) {
    throw new Error("Distractor SourceDecision creation is unavailable for real-recall-advantage DB smoke");
  }

  await runtime.sourceRepository.createSourceDecisionEdge({
    sourceClaimId: sourceClaim.id,
    targetType: "architecture_decision",
    targetId: `real-recall-advantage-distractor-${decision.id}`,
    supportType: "implementation-boundary",
    confidence: "low",
    notes: "Low-confidence edge so the distractor is visible but ranks below the governing high-confidence edge.",
    metadata: {
      ...metadata,
      decisionId: decision.id,
      role: "distractor",
      sourceDecisionId: distractorDecision.id
    }
  });
  const searchDocument = await runtime.retrievalRepository?.createSearchDocument({
    projectId,
    subjectType: "source_claim",
    subjectId: sourceClaim.id,
    sourceArtifactId,
    sourceClaimId: sourceClaim.id,
    trustTier: "project-decision",
    title: `Real recall advantage distractor SearchDocument ${decision.id}`,
    body: decision.distractorClaim,
    searchText: decision.distractorSearchText,
    metadataFilters: {
      smokeId: input.smokeId
    },
    metadata: {
      ...metadata,
      decisionId: decision.id,
      role: "distractor",
      sourceDecisionId: distractorDecision.id
    }
  });

  if (searchDocument === undefined) {
    throw new Error("Distractor SearchDocument creation is unavailable for real-recall-advantage DB smoke");
  }

  return { distractorClaimId: sourceClaim.id };
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

    // Baseline setup: seed ONLY the distractors (tempting shortcuts, no
    // decision edge). Pure lexical retrieval should pick each distractor first
    // because no governing decision has been recorded yet.
    const distractorsSeeded = await Promise.all(realDecisions.map(async (decision) => ({
      decision,
      ...(await seedDistractor(runtime as Awaited<ReturnType<typeof createDatabaseRuntime>>,
        decision, projectId, input, metadata))
    })));

    await runtime.close();
    runtime = undefined;

    // Baseline pass: top recall result per query should be the distractor.
    const baselineTops = new Map<string, { top: string | null; count: number }>();
    await Promise.all(distractorsSeeded.map(async (entry) => {
      const json = await runSourceSearch(input, createId, createSmokeDatabaseRuntime, entry.decision.query);
      baselineTops.set(entry.decision.id, {
        top: topCandidateSourceClaimId(json),
        count: json.includedCandidates.length
      });
    }));

    // Grounded setup: also seed the governing decisions WITH SourceDecision +
    // SourceDecisionEdge so decision-linked recall can boost them ahead of the
    // lexically-stronger distractors.
    const seededRuntime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: "real-recall-advantage-smoke",
      requireProjectKernelForExplicitProject: false,
      projectId,
      now: () => input.now,
      createId
    });
    runtime = seededRuntime;
    const governingSeeded = await Promise.all(realDecisions.map(async (decision) => ({
      decision,
      ...(await seedDecision(seededRuntime, decision, projectId, input, metadata))
    })));
    await seededRuntime.close();
    runtime = undefined;

    // Grounded pass: top recall result per query should now be the governing
    // claim, because the SourceDecisionEdge boost overtakes the distractor.
    const decisionResults = await Promise.all(governingSeeded.map(async (seededEntry) => {
      const { decision, sourceClaimId } = seededEntry;
      const distractorClaimId = distractorsSeeded.find((entry) => entry.decision.id === decision.id)
        ?.distractorClaimId ?? null;
      const baseline = baselineTops.get(decision.id);
      const baselineTopClaimId = baseline?.top ?? null;
      const baselineIncludedCandidateCount = baseline?.count ?? 0;
      const groundedJson = await runSourceSearch(input, createId, createSmokeDatabaseRuntime, decision.query);
      const groundedTopClaimId = topCandidateSourceClaimId(groundedJson);
      const baselinePickedDistractor = distractorClaimId !== null && baselineTopClaimId === distractorClaimId;
      const groundedPickedGoverning = groundedTopClaimId === sourceClaimId;

      return {
        decisionId: decision.id,
        standardId: decision.standardId,
        query: decision.query,
        expectedDecision: decision.expectedDecision,
        distractorClaimId,
        governingClaimId: sourceClaimId,
        baselineTopClaimId,
        baselineIncludedCandidateCount,
        baselinePickedDistractor,
        groundedTopClaimId,
        groundedPickedGoverning,
        advantageWin: baselinePickedDistractor && groundedPickedGoverning
      };
    }));

    const advantageWinCount = decisionResults.filter((result) => result.advantageWin).length;
    const baselineDistractorTopCount = decisionResults.filter((result) => result.baselinePickedDistractor).length;
    const groundedGoverningTopCount = decisionResults.filter((result) => result.groundedPickedGoverning).length;

    // Require a majority of advantage wins (baseline picks the distractor, then
    // grounded picks the governing claim). Threshold is a majority rather than
    // all so the proof is not brittle to one case's lexical/boost balance.
    if (advantageWinCount < Math.ceil(realDecisions.length / 2)) {
      const missed = decisionResults
        .filter((result) => !result.advantageWin)
        .map((result) => result.decisionId);
      throw new Error(
        `Real-recall-advantage DB smoke lacked distractor-competition advantage wins; missed: ${missed.join(", ")}`
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
      advantageWinCount,
      baselineDistractorTopCount,
      groundedGoverningTopCount,
      decisions: decisionResults,
      limitationClassification:
        "decision_linked_recall_beats_lexical_distractor_not_general_ranking_or_live_codex",
      remainingMarkerCount: markerCleanup.remainingMarkerCount,
      cleanedUp: markerCleanup.cleanedUp
    };
  } finally {
    await closeSmokeRuntimeAndClient(runtime, client);
  }
};
