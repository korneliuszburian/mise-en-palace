import postgres from "postgres";

import {
  createDatabaseRuntime
} from "../../database-runtime.js";
import {
  bindSmokeProjectRuntimeFactory,
  closeSmokeRuntimeAndClient,
  createUniqueSmokeCreateId
} from "./smoke-runtime-cleanup.js";
import {
  runSmokeSourceSearch,
  topSourceSearchClaimId
} from "./source-search-smoke-runner.js";
import {
  cleanupSourceSmokeMarkers,
  finalizeSourceSmokeMarkerCleanup
} from "./source-smoke-marker-cleanup.js";

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

export const assertAllRealRecallAdvantageWins = (
  decisions: readonly Pick<RealRecallAdvantageDecisionResult, "decisionId" | "advantageWin">[]
): void => {
  const missed = decisions
    .filter((result) => !result.advantageWin)
    .map((result) => result.decisionId);

  if (missed.length > 0) {
    throw new Error(
      `Real-recall eval requires every distractor-competition case to win; missed: ${missed.join(", ")}`
    );
  }
};

// Real KRN governing decisions extracted from repo docs/ADRs (KRN_ROADMAP.md,
// naming-vocabulary-audit.md, kernel-next-priority-synthesis.md). These are the
// actual standards the project adopted, not synthetic company-pattern fixtures.
const realDecisions: readonly RealRecallAdvantageDecision[] = [
  {
    id: "real-decision-worker-contract-only",
    standardId: "standard:worker-contract-readback-only",
    query: "should KRN build a worker daemon or background loop for memory maintenance",
    claim:
      "KRN maintenance preview must stay contract and readback only; reject a worker daemon, background loop, or job executor until a named product loop requires runtime execution.",
    mechanism:
      "A contract and readback only maintenance-preview package keeps memory maintenance candidate-only and reviewable instead of implying an autonomous worker daemon, background loop, or job executor.",
    implication:
      "When asked whether to build a worker daemon or background loop for memory maintenance, KRN should select the contract and readback only decision.",
    consumer: "maintenance runtime boundary",
    falsifier:
      "A KRN slice adds a worker daemon, background loop, scheduler, or job executor without a named product loop that requires runtime execution.",
    doesNotProve: "This does not prove the maintenance-preview package will never need an executor.",
    expectedDecision:
      "Keep maintenance preview contract and readback only; do not build a worker daemon, background loop, or job executor without a named product loop.",
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

interface SmokeSourceClaimSeed {
  readonly sourceArtifactId: string;
  readonly claim: string;
  readonly mechanism: string;
  readonly krnImplication: string;
  readonly doesNotProve: string;
  readonly consumer: string;
  readonly falsifier: string;
  readonly metadata: Record<string, unknown>;
}

// Shared SourceClaim creation for governing and distractor seeds. Both pin
// trustTier/supportType to the same project-decision/implementation-boundary
// pair; only the claim content and metadata differ.
const createSmokeSourceClaim = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  seed: SmokeSourceClaimSeed
): Promise<string> => {
  const sourceClaim = await runtime.sourceRepository.createSourceClaim({
    sourceArtifactId: seed.sourceArtifactId,
    claim: seed.claim,
    mechanism: seed.mechanism,
    krnImplication: seed.krnImplication,
    doesNotProve: seed.doesNotProve,
    trustTier: "project-decision",
    supportType: "implementation-boundary",
    consumer: seed.consumer,
    falsifier: seed.falsifier,
    metadata: seed.metadata
  });

  return sourceClaim.id;
};

interface SmokeSourceDecisionSeed {
  readonly projectId: string;
  readonly sourceClaimId: string;
  readonly decision: string;
  readonly rationale: string;
  readonly falsifier: string;
  readonly consumer: string;
  readonly metadata: Record<string, unknown>;
}

// Shared SourceDecision creation; throws if the repository does not expose
// createSourceDecision so both seed paths fail loudly instead of silently
// skipping the decision.
const createSmokeSourceDecision = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  seed: SmokeSourceDecisionSeed
): Promise<string> => {
  const sourceDecision = await runtime.sourceRepository.createSourceDecision?.({
    projectId: seed.projectId,
    sourceClaimId: seed.sourceClaimId,
    status: "adopt",
    decision: seed.decision,
    rationale: seed.rationale,
    falsifier: seed.falsifier,
    consumer: seed.consumer,
    metadata: seed.metadata
  });

  if (sourceDecision === undefined) {
    throw new Error("SourceDecision creation is unavailable for real-recall-advantage DB smoke");
  }

  return sourceDecision.id;
};

// All content that differs between a governing seed and a distractor seed.
// Capturing it as data (instead of two parallel seed functions) keeps the
// artifact -> claim -> decision -> edge -> search-document sequence in one
// place and lets the variant describe only the differences.
interface RealRecallSeedVariant {
  readonly artifactSlug: string;
  readonly claimText: string;
  readonly mechanism: string;
  readonly krnImplication: string;
  readonly doesNotProve: string;
  readonly decisionText: string;
  readonly decisionRationale: string;
  readonly edgeConfidence: "high" | "low";
  readonly edgeNotes: string;
  readonly searchTitle: string;
  readonly searchBody: string;
  readonly searchText: string;
  readonly extraMetadata: Record<string, unknown>;
}

const governingVariant = (decision: RealRecallAdvantageDecision): RealRecallSeedVariant => ({
  artifactSlug: "source",
  claimText: decision.claim,
  mechanism: decision.mechanism,
  krnImplication: decision.implication,
  doesNotProve: decision.doesNotProve,
  decisionText: decision.expectedDecision,
  decisionRationale:
    "The real governing decision has mechanism, implication, consumer, falsifier, and non-proof boundary.",
  edgeConfidence: "high",
  edgeNotes: "Decision-linked support for the real-recall-advantage DB replay.",
  searchTitle: `Real recall advantage SearchDocument ${decision.id}`,
  searchBody: `${decision.expectedDecision} ${decision.claim}`,
  searchText:
    `${decision.query} ${decision.standardId} ${decision.expectedDecision} ${decision.claim} ${decision.mechanism}`,
  extraMetadata: { standardId: decision.standardId }
});

// The distractor mirrors the governing seed but carries the tempting shortcut,
// a low-confidence edge (so it is visible but ranks below the governing
// high-confidence edge), and lexically denser searchText.
const distractorVariant = (decision: RealRecallAdvantageDecision): RealRecallSeedVariant => ({
  artifactSlug: "distractor",
  claimText: decision.distractorClaim,
  mechanism:
    "This distractor intentionally represents the tempting shortcut the lexical baseline picks before the governing decision is recorded.",
  krnImplication:
    "This is the wrong shortcut; the governing decision for this query is the accepted, high-confidence, decision-linked claim.",
  doesNotProve: "This intentionally represents the baseline's tempting wrong implementation decision.",
  decisionText: decision.distractorClaim,
  decisionRationale:
    "Distractor decision seeded at low confidence so it is visible but ranks below the high-confidence governing decision.",
  edgeConfidence: "low",
  edgeNotes: "Low-confidence edge so the distractor is visible but ranks below the governing high-confidence edge.",
  searchTitle: `Real recall advantage distractor SearchDocument ${decision.id}`,
  searchBody: decision.distractorClaim,
  searchText: decision.distractorSearchText,
  extraMetadata: { role: "distractor" }
});

// Single seed path for both governing and distractor claims. Creates a source
// artifact, claim, adopt decision, decision edge, and search document, using
// the variant to pick content and confidence. Returns the created claim id.
const seedRealRecallClaim = async (
  runtime: Awaited<ReturnType<typeof createDatabaseRuntime>>,
  decision: RealRecallAdvantageDecision,
  variant: RealRecallSeedVariant,
  projectId: string,
  input: RealRecallAdvantageDbSmokeInput,
  metadata: Record<string, unknown>
): Promise<string> => {
  const claimMetadata = {
    ...metadata,
    decisionId: decision.id,
    ...variant.extraMetadata
  };
  const sourceArtifactId = await createSmokeSourceArtifact(
    runtime,
    projectId,
    `smoke://real-recall-advantage/${variant.artifactSlug}-${decision.id}`,
    `Real recall advantage ${variant.artifactSlug} ${decision.id}`,
    `real-recall-${variant.artifactSlug}-${input.smokeId}-${decision.id}`,
    metadata
  );
  const sourceClaimId = await createSmokeSourceClaim(runtime, {
    sourceArtifactId,
    claim: `${variant.claimText} Marker: ${decision.query}.`,
    mechanism: variant.mechanism,
    krnImplication: variant.krnImplication,
    doesNotProve: variant.doesNotProve,
    consumer: decision.consumer,
    falsifier: decision.falsifier,
    metadata: claimMetadata
  });
  const sourceDecisionId = await createSmokeSourceDecision(runtime, {
    projectId,
    sourceClaimId,
    decision: variant.decisionText,
    rationale: variant.decisionRationale,
    falsifier: decision.falsifier,
    consumer: decision.consumer,
    metadata: claimMetadata
  });

  await runtime.sourceRepository.createSourceDecisionEdge({
    sourceClaimId,
    targetType: "architecture_decision",
    targetId: `real-recall-advantage-${variant.artifactSlug}-${decision.id}`,
    supportType: "implementation-boundary",
    confidence: variant.edgeConfidence,
    notes: variant.edgeNotes,
    metadata: {
      ...claimMetadata,
      sourceDecisionId
    }
  });
  const searchDocument = await runtime.retrievalRepository?.createSearchDocument({
    projectId,
    subjectType: "source_claim",
    subjectId: sourceClaimId,
    sourceArtifactId,
    sourceClaimId,
    trustTier: "project-decision",
    title: variant.searchTitle,
    body: variant.searchBody,
    searchText: variant.searchText,
    metadataFilters: {
      smokeId: input.smokeId
    },
    metadata: {
      ...claimMetadata,
      sourceDecisionId
    }
  });

  if (searchDocument === undefined) {
    throw new Error("SearchDocument creation is unavailable for real-recall-advantage DB smoke");
  }

  return sourceClaimId;
};

export const runRealRecallAdvantageDbSmokeCheck = async (
  input: RealRecallAdvantageDbSmokeInput
): Promise<RealRecallAdvantageDbSmokeReport> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const createId = createUniqueSmokeCreateId(input.smokeId);
  const metadata = {
    smokeId: input.smokeId,
    source: smokeSource
  };
  let runtime: Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;

  try {
    await cleanupSourceSmokeMarkers(client, markerTables, input.smokeId, smokeSource);
    const seedingRuntime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: "real-recall-advantage-smoke",
      requireProjectKernelForExplicitProject: false,
      now: () => input.now,
      createId
    });
    runtime = seedingRuntime;
    const projectId = seedingRuntime.projectId;
    const createSmokeDatabaseRuntime = bindSmokeProjectRuntimeFactory(seedingRuntime);

    // Baseline setup: seed ONLY the distractors (tempting shortcuts with a
    // low-confidence edge). Pure lexical retrieval should pick each distractor
    // first because no governing decision has been recorded yet. The single
    // seeding runtime stays open for the governing seed too; recall queries
    // inject their own runtime via createSmokeDatabaseRuntime.
    const distractorsSeeded = await Promise.all(realDecisions.map(async (decision) => ({
      decision,
      distractorClaimId: await seedRealRecallClaim(seedingRuntime, decision, distractorVariant(decision), projectId, input, metadata)
    })));

    // Baseline pass: top recall result per query should be the distractor.
    const baselineTops = new Map<string, { top: string | null; count: number }>();
    await Promise.all(distractorsSeeded.map(async (entry) => {
      const json = await runSmokeSourceSearch(
        input,
        createId,
        createSmokeDatabaseRuntime,
        entry.decision.query,
        "real-recall-advantage DB smoke"
      );
      baselineTops.set(entry.decision.id, {
        top: topSourceSearchClaimId(json),
        count: json.includedCandidates.length
      });
    }));

    // Grounded setup: seed the governing decisions WITH SourceDecision +
    // SourceDecisionEdge (high confidence) so decision-linked recall can boost
    // them ahead of the lexically-stronger distractors.
    const governingSeeded = await Promise.all(realDecisions.map(async (decision) => ({
      decision,
      sourceClaimId: await seedRealRecallClaim(seedingRuntime, decision, governingVariant(decision), projectId, input, metadata)
    })));

    // Grounded pass: top recall result per query should now be the governing
    // claim, because the high-confidence SourceDecisionEdge overtakes the
    // low-confidence distractor.
    const decisionResults = await Promise.all(governingSeeded.map(async (seededEntry) => {
      const { decision, sourceClaimId } = seededEntry;
      const distractorClaimId = distractorsSeeded.find((entry) => entry.decision.id === decision.id)
        ?.distractorClaimId ?? null;
      const baseline = baselineTops.get(decision.id);
      const baselineTopClaimId = baseline?.top ?? null;
      const baselineIncludedCandidateCount = baseline?.count ?? 0;
      const groundedJson = await runSmokeSourceSearch(
        input,
        createId,
        createSmokeDatabaseRuntime,
        decision.query,
        "real-recall-advantage DB smoke"
      );
      const groundedTopClaimId = topSourceSearchClaimId(groundedJson);
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

    assertAllRealRecallAdvantageWins(decisionResults);

    const markerCleanup = await finalizeSourceSmokeMarkerCleanup(
      client,
      markerTables,
      input.smokeId,
      smokeSource
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
