import postgres from "postgres";

import {
  compileHarnessPlan
} from "@krn/harness";
import {
  runBrainSearchCommand
} from "../../run-brain-search-command.js";
import {
  createDatabaseRuntime
} from "../../database-runtime.js";
import {
  bindSmokeProjectRuntimeFactory,
  closeSmokeRuntimeAndClient,
  createUniqueSmokeCreateId,
  finalizeSmokeMarkerCleanup
} from "./smoke-runtime-cleanup.js";

type PostgresClient = ReturnType<typeof postgres>;

export interface BrainSearchDbSmokeInput {
  databaseUrl: string;
  repoRoot: string;
  smokeId: string;
  now: string;
}

export interface BrainSearchDbSmokeReport {
  smokeId: string;
  projectId: string;
  challengeCaseId: string;
  challengeStandardId: string;
  challengeExpectedDecision: string;
  challengeBaselineFailureMode: string;
  challengeFalsifier: string;
  query: string;
  sessionATaskContractId: string;
  sessionAHarnessPlanId: string;
  sessionAExecutionRunId: string;
  sessionAEvidenceBundleId: string;
  sessionAReviewAssessmentId: string;
  sessionAFeedbackDeltaId: string;
  sourceArtifactId: string;
  sourceClaimId: string;
  sourceDecisionId: string;
  sourceDecisionEdgeId: string;
  searchDocumentId: string;
  memoryCandidateId: string;
  memoryRecordId: string;
  baselineSmokeSourceClaimSelected: boolean;
  baselineSmokeMemorySelected: boolean;
  baselineSelectedKnowledgeCount: number;
  baselineSelectedKnowledgePackets: readonly string[];
  baselineSupportingClaimCount: number;
  baselineSupportingDocumentCount: number;
  baselineSourceDecisionSupportCount: number;
  groundedSmokeSourceClaimSelected: boolean;
  groundedSmokeMemorySelected: boolean;
  groundedSelectedKnowledgeCount: number;
  groundedSelectedKnowledgePackets: readonly string[];
  groundedSupportingClaimCount: number;
  groundedSupportingDocumentCount: number;
  groundedLinkedSearchDocumentCount: number;
  groundedSourceDecisionSupportCount: number;
  groundedRecommendedNextAction: string;
  groundedSourceContribution: string;
  limitationClassification: string;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface BrainSearchJson {
  knowledgeReadModels?: {
    selectedKnowledge?: unknown;
  };
  sourceSearch?: {
    supportingClaims?: unknown;
    supportingDocuments?: unknown;
    sourceDecisionSupport?: unknown;
    linkedSearchDocuments?: unknown;
  };
  recommendedNextAction?: unknown;
}

const objectValue = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const numberValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const arrayLength = (value: unknown): number =>
  Array.isArray(value) ? value.length : numberValue(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const selectedKnowledgeIds = (json: BrainSearchJson): readonly string[] =>
  Array.isArray(json.knowledgeReadModels?.selectedKnowledge)
    ? json.knowledgeReadModels.selectedKnowledge.flatMap((item) => {
        const record = objectValue(item);
        const id = record === undefined ? undefined : record["id"];

        return typeof id === "string" ? [id] : [];
      })
    : [];

const selectedKnowledgePackets = (json: BrainSearchJson): readonly string[] =>
  Array.isArray(json.knowledgeReadModels?.selectedKnowledge)
    ? json.knowledgeReadModels.selectedKnowledge.flatMap((item) => {
        const record = objectValue(item);

        if (record === undefined) {
          return [];
        }
        const id = record["id"];
        const source = record["source"];

        return typeof id === "string"
          ? [`${typeof source === "string" ? source : "unknown"}:${id}`]
          : [];
      })
    : [];

const parseBrainSearchJson = (text: string): BrainSearchJson => {
  const parsed: unknown = JSON.parse(text);
  const record = objectValue(parsed);

  if (record === undefined) {
    throw new Error("memory-search DB smoke expected JSON object output");
  }

  const knowledgeReadModels = objectValue(record["knowledgeReadModels"]);
  const sourceSearch = objectValue(record["sourceSearch"]);

  return {
    ...(knowledgeReadModels === undefined
      ? {}
      : {
          knowledgeReadModels: {
            selectedKnowledge: knowledgeReadModels["selectedKnowledge"]
          }
        }),
    ...(sourceSearch === undefined
      ? {}
      : {
          sourceSearch: {
            supportingClaims: sourceSearch["supportingClaims"],
            supportingDocuments: sourceSearch["supportingDocuments"],
            sourceDecisionSupport: sourceSearch["sourceDecisionSupport"],
            linkedSearchDocuments: sourceSearch["linkedSearchDocuments"]
          }
        }),
    recommendedNextAction: record["recommendedNextAction"]
  };
};

const selectedKnowledgeCount = (json: BrainSearchJson): number =>
  arrayLength(json.knowledgeReadModels?.selectedKnowledge);

const supportingClaimCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.supportingClaims);

const supportingDocumentCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.supportingDocuments);

const sourceDecisionSupportCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.sourceDecisionSupport);

const linkedSearchDocumentCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.linkedSearchDocuments);

const createSmokeId = (smokeId: string) => createUniqueSmokeCreateId(smokeId);

const smokeSource = "krn db smoke memory-search";

const retainedStandardChallenge = {
  id: "retained-standard-store-backed-memory-no-markdown",
  standardId: "standard:store-backed-memory",
  expectedDecision: "Use store-backed memory/source evidence; do not create runtime markdown memory files.",
  baselineFailureMode:
    "Simple retrieval can select a tempting MEMORY.md shortcut because it repeats memory and runtime wording.",
  falsifier: "A KRN slice adds runtime MEMORY.md or file-backed memory as the product memory path.",
  query:
    "for KRN runtime memory should Codex create MEMORY.md files or use store backed memory source evidence",
  selectedKnowledgeId: "source:store-backed-memory-no-markdown",
  claim:
    "KRN runtime memory must be store-backed; markdown is allowed only as docs, source, seed, export, backup, or audit trail.",
  mechanism:
    "Store-backed memory gives typed activation, review gates, source lineage, feedback, and forgetting; markdown notes cannot enforce those lifecycle controls.",
  implication:
    "When asked whether to create runtime MEMORY.md files, KRN should select the store-backed memory decision.",
  consumer: "runtime memory design",
  doesNotProve: "This does not prove every markdown source is useless."
} as const;

const markerMetadataTables = [
  "retrieval_runs",
  "source_decision_edges",
  "search_documents",
  "memory_records",
  "memory_candidates",
  "source_decisions",
  "source_claim_edges",
  "source_claims",
  "source_artifacts",
  "feedback_deltas",
  "review_assessments",
  "evidence_bundles",
  "execution_runs",
  "harness_plans",
  "task_contracts",
  "operator_intents"
] as const;

const deleteMarkerMetadataRows = (
  client: PostgresClient,
  tableName: typeof markerMetadataTables[number],
  smokeId: string
) => client.unsafe(
  `delete from ${tableName} where metadata->>'smokeId' = $1 or metadata->>'source' = $2`,
  [smokeId, smokeSource]
);

const cleanupMarkerRows = async (
  client: PostgresClient,
  smokeId: string
): Promise<void> => {
  await deleteMarkerMetadataRows(client, "retrieval_runs", smokeId);
  await deleteMarkerMetadataRows(client, "source_decision_edges", smokeId);
  await deleteMarkerMetadataRows(client, "search_documents", smokeId);
  await client`
    delete from memory_record_versions
    where memory_record_id in (
      select id from memory_records
      where metadata->>'smokeId' = ${smokeId}
        or metadata->>'source' = ${smokeSource}
    )
  `;
  await deleteMarkerMetadataRows(client, "memory_records", smokeId);
  await deleteMarkerMetadataRows(client, "memory_candidates", smokeId);
  await deleteMarkerMetadataRows(client, "source_decisions", smokeId);
  await deleteMarkerMetadataRows(client, "source_claim_edges", smokeId);
  await deleteMarkerMetadataRows(client, "source_claims", smokeId);
  await deleteMarkerMetadataRows(client, "source_artifacts", smokeId);
  await deleteMarkerMetadataRows(client, "feedback_deltas", smokeId);
  await deleteMarkerMetadataRows(client, "review_assessments", smokeId);
  await deleteMarkerMetadataRows(client, "evidence_bundles", smokeId);
  await deleteMarkerMetadataRows(client, "execution_runs", smokeId);
  await deleteMarkerMetadataRows(client, "harness_plans", smokeId);
  await deleteMarkerMetadataRows(client, "task_contracts", smokeId);
  await deleteMarkerMetadataRows(client, "operator_intents", smokeId);
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
    select
      (
        (select count(*)::int from outbox_events where payload->>'smokeId' = ${smokeId}) +
        (select count(*)::int from outbox_events where payload->>'source' = ${smokeSource}) +
        (select count(*)::int from retrieval_runs where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from retrieval_runs where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from run_events where payload->>'smokeId' = ${smokeId}) +
        (select count(*)::int from operator_intents where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from task_contracts where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from harness_plans where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from execution_runs where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from evidence_bundles where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from review_assessments where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from feedback_deltas where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_artifacts where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_claims where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_decisions where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_decision_edges where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from search_documents where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from memory_candidates where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from memory_records where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from memory_record_versions where memory_record_id in (
          select id from memory_records where metadata->>'smokeId' = ${smokeId}
        )) +
        (select count(*)::int from source_artifacts where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from source_claims where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from source_decisions where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from source_decision_edges where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from search_documents where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from memory_candidates where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from memory_records where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from memory_record_versions where memory_record_id in (
          select id from memory_records where metadata->>'source' = ${smokeSource}
        ))
      ) as count
  `;

  return rows[0]?.count ?? 0;
};

export const runBrainSearchDbSmokeCheck = async (
  input: BrainSearchDbSmokeInput
): Promise<BrainSearchDbSmokeReport> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const createId = createSmokeId(input.smokeId);
  const smokeToken = input.smokeId.replace(/[^a-zA-Z0-9]/gu, "").toLowerCase();
  const query = `${retainedStandardChallenge.query} db smoke marker ${smokeToken}`;
  let runtime: Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;

  try {
    await cleanupMarkerRows(client, input.smokeId);
    runtime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: "memory-search-smoke",
      requireProjectKernelForExplicitProject: false,
      now: () => input.now,
      createId
    });
    const projectId = runtime.projectId;
    const createSmokeDatabaseRuntime = bindSmokeProjectRuntimeFactory(runtime);
    const runStoreOnlyBrainSearchJson = async (): Promise<BrainSearchJson> =>
      parseBrainSearchJson((await runBrainSearchCommand({
        cwd: input.repoRoot,
        env: {
          KRN_DATABASE_URL: input.databaseUrl
        },
        now: () => input.now,
        createId,
        createDatabaseRuntime: createSmokeDatabaseRuntime,
        command: {
          kind: "brainSearch",
          query,
          catalogFiles: [],
          storeOnly: true,
          limit: 6,
          maxInclusions: 3,
          format: "json"
        }
      })).stdout);
    const baseline = await runStoreOnlyBrainSearchJson();

    const metadata = {
      smokeId: input.smokeId,
      source: smokeSource
    };
    const sessionACompile = await compileHarnessPlan({
      workspaceId: runtime.workspaceId,
      projectId,
      operatorIntent: {
        source: "cli",
        rawIntent: `teach KRN memory from reviewed retained-standard evidence ${query}`,
        metadata: {
          ...metadata,
          challengeCaseId: retainedStandardChallenge.id,
          challengeStandardId: retainedStandardChallenge.standardId,
          session: "A"
        }
      },
      taskContract: {
        title: "Teach DB-backed memory search from reviewed retained-standard evidence",
        objective:
          `Persist the ${retainedStandardChallenge.standardId} decision so a later memory-search run can retrieve it from live repositories.`,
        constraints: [
          "use DB-backed source and memory repositories",
          "prove the store-backed memory decision beats the markdown runtime-memory shortcut",
          "keep the proof isolated to this smoke project"
        ],
        nonGoals: [
          "do not invoke Codex",
          "do not claim broad memory ranking quality"
        ],
        acceptance: [
          "Session B store-backed memory search selects the Session A MemoryRecord",
          "Session B source-search support remains decision-linked",
          "Session B readback states the retained-standard expected decision and falsifier"
        ],
        metadata: {
          ...metadata,
          challengeCaseId: retainedStandardChallenge.id,
          challengeExpectedDecision: retainedStandardChallenge.expectedDecision,
          challengeFalsifier: retainedStandardChallenge.falsifier,
          session: "A"
        }
      },
      tokenBudget: 360,
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        proof: "db_backed_multi_session_memory_advantage_session_a"
      }
    }, runtime.compilerDependencies);
    const sessionAExecutionRun = await runtime.harnessRunRepository.createExecutionRun({
      harnessPlanId: sessionACompile.harnessPlan.id,
      adapter: "krn-db-smoke-memory-search",
      status: "planned",
      startedAt: input.now,
      initialEvent: {
        sequence: 1,
        type: "smoke.memory_search.session_a.started",
        message: "Brain-search DB smoke Session A started",
        payload: {
          smokeId: input.smokeId,
          query
        }
      },
      metadata: {
        ...metadata,
        session: "A"
      }
    });
    await runtime.harnessRunRepository.updateExecutionRunStatus({
      executionRunId: sessionAExecutionRun.id,
      expectedStatus: "planned",
      status: "running",
      startedAt: input.now,
      event: {
        sequence: 2,
        type: "smoke.memory_search.session_a.running",
        message: "Brain-search DB smoke Session A started",
        payload: {
          smokeId: input.smokeId,
          query
        }
      },
      metadata: {
        ...metadata,
        session: "A"
      }
    });
    await runtime.harnessRunRepository.updateExecutionRunStatus({
      executionRunId: sessionAExecutionRun.id,
      expectedStatus: "running",
      status: "succeeded",
      completedAt: input.now,
      event: {
        sequence: 3,
        type: "smoke.memory_search.session_a.succeeded",
        message: "Brain-search DB smoke Session A completed",
        payload: {
          smokeId: input.smokeId,
          query
        }
      },
      metadata: {
        ...metadata,
        session: "A"
      }
    });
    const sessionAEvidenceBundle = await runtime.harnessRunRepository.createEvidenceBundle({
      executionRunId: sessionAExecutionRun.id,
      status: "captured",
      changedFiles: ["packages/cli/src/internal/smoke/run-brain-search-db-smoke.ts"],
      commands: [{
        command: "pnpm db:smoke:memory-search",
        status: "passed",
        provenance: "operator_reported",
        assertedBy: "memory-search-db-smoke",
        doesNotProve:
          "This command does not prove broad memory ranking quality, source truth, Codex output quality, or product readiness."
      }],
      diffRisk: "low",
      reviewBurden: "DB smoke proof only.",
      rollbackPath: "Delete smoke marker rows.",
      event: {
        sequence: 2,
        type: "smoke.memory_search.session_a.evidence_captured",
        message: "Brain-search DB smoke Session A evidence captured",
        payload: {
          smokeId: input.smokeId,
          query
        }
      },
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        baselineFailureMode: retainedStandardChallenge.baselineFailureMode,
        session: "A",
        doesNotProve:
          "Session A evidence capture does not prove Session B will retrieve or use memory."
      }
    });
    const sessionAReviewAssessment = await runtime.harnessRunRepository.createReviewAssessment({
      evidenceBundleId: sessionAEvidenceBundle.id,
      status: "accepted",
      reviewer: "memory-search-db-smoke",
      summary: "Session A evidence is sufficient to create one review-linked memory candidate.",
      findings: [],
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        expectedDecision: retainedStandardChallenge.expectedDecision,
        session: "A",
        reviewBurden: "low"
      }
    });
    const sessionAFeedbackDelta = await runtime.harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: sessionAReviewAssessment.id,
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        session: "A",
        memoryRecordMutation: "candidate_only_until_promotion"
      }
    });
    const sourceArtifact = await runtime.sourceRepository.createSourceArtifact({
      projectId,
      kind: "doc",
      sourceAuthority: "project-decision",
      uri: `smoke://memory-search/${input.smokeId}`,
      title: "Memory search DB dogfood source",
      contentHash: `memory-search-${input.smokeId}`,
      metadata
    });
    const sourceClaim = await runtime.sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      claim: `${retainedStandardChallenge.claim} Marker: ${query}.`,
      mechanism: retainedStandardChallenge.mechanism,
      krnImplication: retainedStandardChallenge.implication,
      doesNotProve:
        retainedStandardChallenge.doesNotProve,
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: retainedStandardChallenge.consumer,
      falsifier: retainedStandardChallenge.falsifier,
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        selectedKnowledgeId: retainedStandardChallenge.selectedKnowledgeId
      }
    });
    const sourceDecision = await runtime.sourceRepository.createSourceDecision?.({
      projectId,
      sourceClaimId: sourceClaim.id,
      status: "adopt",
      decision: retainedStandardChallenge.expectedDecision,
      rationale:
        "The retained-standard claim has mechanism, implication, consumer, falsifier, and non-proof boundary.",
      falsifier: retainedStandardChallenge.falsifier,
      consumer: retainedStandardChallenge.consumer,
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        standardId: retainedStandardChallenge.standardId
      }
    });

    if (sourceDecision === undefined) {
      throw new Error("SourceDecision creation is unavailable for memory-search DB smoke");
    }

    const sourceDecisionEdge = await runtime.sourceRepository.createSourceDecisionEdge({
      sourceClaimId: sourceClaim.id,
      sourceDecisionId: sourceDecision.id,
      targetType: "architecture_decision",
      targetId: `memory-search-dogfood-${input.smokeId}`,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "Decision-linked support for the store-backed memory retained-standard DB replay.",
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        sourceDecisionId: sourceDecision.id
      }
    });
    const searchDocument = await runtime.retrievalRepository?.createSearchDocument({
      projectId,
      subjectType: "source_claim",
      subjectId: sourceClaim.id,
      sourceArtifactId: sourceArtifact.id,
      sourceClaimId: sourceClaim.id,
      sourceAuthority: "project-decision",
      title: "Memory search DB dogfood SearchDocument",
      body:
        `SearchDocument for ${query}. ${retainedStandardChallenge.expectedDecision} The marker-specific evidence is backed by an accepted SourceClaim and SourceDecisionEdge.`,
      searchText:
        `${query} ${retainedStandardChallenge.standardId} ${retainedStandardChallenge.expectedDecision} source claim source decision edge selected knowledge`,
      metadataFilters: {
        smokeId: input.smokeId
      },
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        sourceDecisionId: sourceDecision.id
      }
    });

    if (searchDocument === undefined) {
      throw new Error("SearchDocument creation is unavailable for memory-search DB smoke");
    }
    const memoryCandidate = await runtime.memoryRepository.createMemoryCandidate({
      projectId,
      executionRunId: sessionAExecutionRun.id,
      feedbackDeltaId: sessionAFeedbackDelta.id,
      proposedBy: "krn db smoke memory-search",
      kind: "procedure",
      summary: "Use store-backed memory instead of runtime markdown memory",
      body:
        `When the operator asks whether KRN runtime memory should use MEMORY.md files or store-backed memory/source evidence, select ${retainedStandardChallenge.expectedDecision}`,
      owner: retainedStandardChallenge.consumer,
      confidence: 95,
      applicationGuidance:
        "Use this persisted MemoryRecord as the memory side of the DB-backed retained-standard advantage proof.",
      invalidationRule:
        "Invalidate if store-backed memory search no longer reads MemoryRecord rows or if the source claim is rejected.",
      sourceLineage: [
        {
          sourceId: sourceClaim.id,
          note: `source-claim:${sourceClaim.id}`
        }
      ],
      sourceClaimIds: [sourceClaim.id],
      isUserPreference: false,
      validFrom: input.now,
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        challengeStandardId: retainedStandardChallenge.standardId,
        expectedDecision: retainedStandardChallenge.expectedDecision,
        baselineFailureMode: retainedStandardChallenge.baselineFailureMode,
        sessionAEvidenceBundleId: sessionAEvidenceBundle.id,
        sessionAReviewAssessmentId: sessionAReviewAssessment.id,
        sessionAFeedbackDeltaId: sessionAFeedbackDelta.id,
        falsifier: "The grounded run does not include this MemoryRecord in selectedKnowledge.",
        doesNotProve:
          "This DB smoke does not prove broad memory ranking quality, source truth, or Codex behavior outside this controlled project."
      }
    });
    const memoryRecord = await runtime.memoryRepository.promoteReviewedMemoryCandidate({
      candidateId: memoryCandidate.id,
      reviewer: "krn db smoke memory-search",
      decision: "accepted",
      recordKey: `memory-search-memory-${input.smokeId}`,
      metadata: {
        ...metadata,
        challengeCaseId: retainedStandardChallenge.id,
        sessionAExecutionRunId: sessionAExecutionRun.id,
        sessionAFeedbackDeltaId: sessionAFeedbackDelta.id
      }
    });

    if (
      memoryRecord.metadata["sessionAExecutionRunId"] !== sessionAExecutionRun.id ||
      memoryRecord.metadata["sessionAFeedbackDeltaId"] !== sessionAFeedbackDelta.id
    ) {
      throw new Error("Brain-search DB smoke MemoryRecord did not preserve Session A links");
    }

    await runtime.close();
    runtime = undefined;

    const grounded = await runStoreOnlyBrainSearchJson();
    const baselineSelectedKnowledgeCount = selectedKnowledgeCount(baseline);
    const groundedSelectedKnowledgeCount = selectedKnowledgeCount(grounded);
    const groundedSupportingClaimCount = supportingClaimCount(grounded);
    const groundedSupportingDocumentCount = supportingDocumentCount(grounded);
    const groundedLinkedSearchDocumentCount = linkedSearchDocumentCount(grounded);
    const groundedSourceDecisionSupportCount = sourceDecisionSupportCount(grounded);

    const baselineSmokeSourceClaimSelected = selectedKnowledgeIds(baseline).includes(sourceClaim.id);
    const baselineSmokeMemorySelected = selectedKnowledgeIds(baseline).includes(memoryRecord.id);
    const groundedSmokeSourceClaimSelected = selectedKnowledgeIds(grounded).includes(sourceClaim.id);
    const groundedSmokeMemorySelected = selectedKnowledgeIds(grounded).includes(memoryRecord.id);

    if (baselineSelectedKnowledgeCount !== 0) {
      throw new Error("Brain-search DB smoke baseline unexpectedly selected knowledge");
    }

    if (baselineSmokeSourceClaimSelected) {
      throw new Error("Brain-search DB smoke baseline unexpectedly selected smoke SourceClaim");
    }

    if (baselineSmokeMemorySelected) {
      throw new Error("Brain-search DB smoke baseline unexpectedly selected smoke MemoryRecord");
    }

    if (groundedSelectedKnowledgeCount === 0) {
      throw new Error("Brain-search DB smoke grounded run selected no knowledge");
    }

    if (!groundedSmokeMemorySelected) {
      throw new Error("Brain-search DB smoke grounded run did not select the smoke MemoryRecord");
    }

    if (!groundedSmokeSourceClaimSelected) {
      throw new Error("Brain-search DB smoke grounded run did not select the smoke SourceClaim");
    }

    if (
      groundedSupportingClaimCount === 0 ||
      groundedLinkedSearchDocumentCount === 0 ||
      groundedSourceDecisionSupportCount === 0
    ) {
      throw new Error("Brain-search DB smoke grounded run lacked source/link decision support");
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
      challengeCaseId: retainedStandardChallenge.id,
      challengeStandardId: retainedStandardChallenge.standardId,
      challengeExpectedDecision: retainedStandardChallenge.expectedDecision,
      challengeBaselineFailureMode: retainedStandardChallenge.baselineFailureMode,
      challengeFalsifier: retainedStandardChallenge.falsifier,
      query,
      sessionATaskContractId: sessionACompile.taskContract.id,
      sessionAHarnessPlanId: sessionACompile.harnessPlan.id,
      sessionAExecutionRunId: sessionAExecutionRun.id,
      sessionAEvidenceBundleId: sessionAEvidenceBundle.id,
      sessionAReviewAssessmentId: sessionAReviewAssessment.id,
      sessionAFeedbackDeltaId: sessionAFeedbackDelta.id,
      sourceArtifactId: sourceArtifact.id,
      sourceClaimId: sourceClaim.id,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionEdgeId: sourceDecisionEdge.id,
      searchDocumentId: searchDocument.id,
      memoryCandidateId: memoryCandidate.id,
      memoryRecordId: memoryRecord.id,
      baselineSmokeSourceClaimSelected,
      baselineSmokeMemorySelected,
      baselineSelectedKnowledgeCount,
      baselineSelectedKnowledgePackets: selectedKnowledgePackets(baseline),
      baselineSupportingClaimCount: supportingClaimCount(baseline),
      baselineSupportingDocumentCount: supportingDocumentCount(baseline),
      baselineSourceDecisionSupportCount: sourceDecisionSupportCount(baseline),
      groundedSmokeSourceClaimSelected,
      groundedSmokeMemorySelected,
      groundedSelectedKnowledgeCount,
      groundedSelectedKnowledgePackets: selectedKnowledgePackets(grounded),
      groundedSupportingClaimCount,
      groundedSupportingDocumentCount,
      groundedLinkedSearchDocumentCount,
      groundedSourceDecisionSupportCount,
      groundedRecommendedNextAction: stringValue(grounded.recommendedNextAction),
      groundedSourceContribution:
        "accepted_source_claim_with_linked_search_document_and_source_decision_edge",
      limitationClassification:
        "single_firm_pattern_db_replay_not_broad_ranking_or_codex_output_quality",
      remainingMarkerCount: markerCleanup.remainingMarkerCount,
      cleanedUp: markerCleanup.cleanedUp
    };
  } finally {
    await closeSmokeRuntimeAndClient(runtime, client);
  }
};
