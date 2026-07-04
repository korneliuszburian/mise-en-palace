import postgres from "postgres";

import {
  runBrainSearchCommand
} from "./runBrainSearchCommand.js";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";

type PostgresClient = ReturnType<typeof postgres>;

export interface BrainSearchDbSmokeInput {
  databaseUrl: string;
  repoRoot: string;
  smokeId: string;
  now: string;
}

export interface BrainSearchDbSmokeReport {
  projectId: string;
  query: string;
  sourceArtifactId: string;
  sourceClaimId: string;
  sourceDecisionId: string;
  sourceDecisionEdgeId: string;
  searchDocumentId: string;
  baselineSmokeSourceClaimSelected: boolean;
  baselineSelectedKnowledgeCount: number;
  baselineSupportingClaimCount: number;
  baselineSupportingDocumentCount: number;
  baselineSourceDecisionSupportCount: number;
  groundedSmokeSourceClaimSelected: boolean;
  groundedSelectedKnowledgeCount: number;
  groundedSupportingClaimCount: number;
  groundedSupportingDocumentCount: number;
  groundedLinkedSearchDocumentCount: number;
  groundedSourceDecisionSupportCount: number;
  groundedRecommendedNextAction: string;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface BrainSearchJson {
  knowledgeCards?: {
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
  Array.isArray(json.knowledgeCards?.selectedKnowledge)
    ? json.knowledgeCards.selectedKnowledge.flatMap((item) => {
        const record = objectValue(item);
        const id = record === undefined ? undefined : record["id"];

        return typeof id === "string" ? [id] : [];
      })
    : [];

const parseBrainSearchJson = (text: string): BrainSearchJson => {
  const parsed: unknown = JSON.parse(text);
  const record = objectValue(parsed);

  if (record === undefined) {
    throw new Error("brain-search DB smoke expected JSON object output");
  }

  const knowledgeCards = objectValue(record["knowledgeCards"]);
  const sourceSearch = objectValue(record["sourceSearch"]);

  return {
    ...(knowledgeCards === undefined
      ? {}
      : {
          knowledgeCards: {
            selectedKnowledge: knowledgeCards["selectedKnowledge"]
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
  arrayLength(json.knowledgeCards?.selectedKnowledge);

const supportingClaimCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.supportingClaims);

const supportingDocumentCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.supportingDocuments);

const sourceDecisionSupportCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.sourceDecisionSupport);

const linkedSearchDocumentCount = (json: BrainSearchJson): number =>
  numberValue(json.sourceSearch?.linkedSearchDocuments);

const createSmokeId = (smokeId: string) => (prefix: string): string =>
  `${prefix}-${smokeId}`;

const smokeSource = "krn db smoke brain-search";

const cleanupMarkerRows = async (
  client: PostgresClient,
  smokeId: string
): Promise<number> => {
  await client`
    delete from outbox_events
    where payload->>'smokeId' = ${smokeId}
      or payload->>'source' = ${smokeSource}
  `;
  await client`
    delete from source_decision_edges
    where metadata->>'smokeId' = ${smokeId}
      or metadata->>'source' = ${smokeSource}
  `;
  await client`
    delete from search_documents
    where metadata->>'smokeId' = ${smokeId}
      or metadata->>'source' = ${smokeSource}
  `;
  await client`
    delete from source_decisions
    where metadata->>'smokeId' = ${smokeId}
      or metadata->>'source' = ${smokeSource}
  `;
  await client`
    delete from source_claim_edges
    where metadata->>'smokeId' = ${smokeId}
      or metadata->>'source' = ${smokeSource}
  `;
  await client`
    delete from source_claims
    where metadata->>'smokeId' = ${smokeId}
      or metadata->>'source' = ${smokeSource}
  `;
  const deletedArtifacts = await client<{ id: string }[]>`
    delete from source_artifacts
    where metadata->>'smokeId' = ${smokeId}
      or metadata->>'source' = ${smokeSource}
    returning id
  `;

  return deletedArtifacts.length;
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
        (select count(*)::int from source_artifacts where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_claims where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_decisions where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_decision_edges where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from search_documents where metadata->>'smokeId' = ${smokeId}) +
        (select count(*)::int from source_artifacts where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from source_claims where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from source_decisions where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from source_decision_edges where metadata->>'source' = ${smokeSource}) +
        (select count(*)::int from search_documents where metadata->>'source' = ${smokeSource})
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
  const query = `ezbmbrainsearchdogfood${smokeToken}`;
  let runtime: Awaited<ReturnType<typeof createDatabaseRuntime>> | undefined;

  try {
    await cleanupMarkerRows(client, input.smokeId);
    runtime = await createDatabaseRuntime({
      databaseUrl: input.databaseUrl,
      workspaceSlug: "local",
      projectSlug: "brain-search-smoke",
      requireProjectKernelForExplicitProject: false,
      now: () => input.now,
      createId
    });
    const projectId = runtime.projectId;
    const createSmokeDatabaseRuntime = (runtimeInput: Parameters<typeof createDatabaseRuntime>[0]) =>
      createDatabaseRuntime({
        ...runtimeInput,
        projectId,
        requireProjectKernelForExplicitProject: false
      });
    const baseline = parseBrainSearchJson((await runBrainSearchCommand({
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

    const metadata = {
      smokeId: input.smokeId,
      source: smokeSource
    };
    const sourceArtifact = await runtime.sourceRepository.createSourceArtifact({
      projectId,
      kind: "doc",
      trustTier: "project-decision",
      uri: `smoke://brain-search/${input.smokeId}`,
      title: "Brain search DB dogfood source",
      contentHash: `brain-search-${input.smokeId}`,
      metadata
    });
    const sourceClaim = await runtime.sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      claim: `KRN brain search can use ${query} as source-backed selected knowledge.`,
      mechanism:
        "A persisted SourceClaim, SourceDecisionEdge, and SearchDocument are read through live source search before brain-search readback chooses selectedKnowledge.",
      krnImplication:
        "Brain usefulness proof must include store-backed source/search rows before claiming source-grounded nextAction=use.",
      doesNotProve:
        "This fixed DB smoke does not prove broad ranking quality, source truth, or product readiness.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "ezbm brain usefulness dogfood",
      falsifier: "The grounded run has no SourceClaim or SourceDecisionEdge support.",
      metadata
    });
    const sourceDecision = await runtime.sourceRepository.createSourceDecision?.({
      projectId,
      sourceClaimId: sourceClaim.id,
      status: "adopt",
      decision: "Use DB-backed source rows for the brain usefulness smoke.",
      rationale:
        "The claim has mechanism, implication, consumer, falsifier, and non-proof boundary.",
      falsifier: "Source search cannot read back decision support for the smoke claim.",
      consumer: "ezbm brain usefulness dogfood",
      metadata
    });

    if (sourceDecision === undefined) {
      throw new Error("SourceDecision creation is unavailable for brain-search DB smoke");
    }

    const sourceDecisionEdge = await runtime.sourceRepository.createSourceDecisionEdge({
      sourceClaimId: sourceClaim.id,
      targetType: "architecture_decision",
      targetId: `brain-search-dogfood-${input.smokeId}`,
      supportType: "implementation-boundary",
      confidence: "high",
      notes: "Decision-linked support for the brain-search DB dogfood smoke.",
      metadata
    });
    const searchDocument = await runtime.retrievalRepository?.createSearchDocument({
      projectId,
      subjectType: "source_claim",
      subjectId: sourceClaim.id,
      sourceArtifactId: sourceArtifact.id,
      sourceClaimId: sourceClaim.id,
      trustTier: "project-decision",
      title: "Brain search DB dogfood SearchDocument",
      body:
        `SearchDocument for ${query}. The marker-specific evidence is backed by an accepted SourceClaim and SourceDecisionEdge.`,
      searchText:
        `${query} source claim source decision edge selected knowledge`,
      metadataFilters: {
        smokeId: input.smokeId
      },
      metadata
    });

    if (searchDocument === undefined) {
      throw new Error("SearchDocument creation is unavailable for brain-search DB smoke");
    }

    await runtime.close();
    runtime = undefined;

    const grounded = parseBrainSearchJson((await runBrainSearchCommand({
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
    const baselineSelectedKnowledgeCount = selectedKnowledgeCount(baseline);
    const groundedSelectedKnowledgeCount = selectedKnowledgeCount(grounded);
    const groundedSupportingClaimCount = supportingClaimCount(grounded);
    const groundedSupportingDocumentCount = supportingDocumentCount(grounded);
    const groundedLinkedSearchDocumentCount = linkedSearchDocumentCount(grounded);
    const groundedSourceDecisionSupportCount = sourceDecisionSupportCount(grounded);

    const baselineSmokeSourceClaimSelected = selectedKnowledgeIds(baseline).includes(sourceClaim.id);
    const groundedSmokeSourceClaimSelected = selectedKnowledgeIds(grounded).includes(sourceClaim.id);

    if (baselineSelectedKnowledgeCount !== 0) {
      throw new Error("Brain-search DB smoke baseline unexpectedly selected knowledge");
    }

    if (baselineSmokeSourceClaimSelected) {
      throw new Error("Brain-search DB smoke baseline unexpectedly selected smoke SourceClaim");
    }

    if (groundedSelectedKnowledgeCount === 0) {
      throw new Error("Brain-search DB smoke grounded run selected no knowledge");
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

    const remainingMarkerCountBeforeCleanup = await countMarkerRows(client, input.smokeId);

    await cleanupMarkerRows(client, input.smokeId);

    const remainingMarkerCount = await countMarkerRows(client, input.smokeId);

    return {
      projectId,
      query,
      sourceArtifactId: sourceArtifact.id,
      sourceClaimId: sourceClaim.id,
      sourceDecisionId: sourceDecision.id,
      sourceDecisionEdgeId: sourceDecisionEdge.id,
      searchDocumentId: searchDocument.id,
      baselineSmokeSourceClaimSelected,
      baselineSelectedKnowledgeCount,
      baselineSupportingClaimCount: supportingClaimCount(baseline),
      baselineSupportingDocumentCount: supportingDocumentCount(baseline),
      baselineSourceDecisionSupportCount: sourceDecisionSupportCount(baseline),
      groundedSmokeSourceClaimSelected,
      groundedSelectedKnowledgeCount,
      groundedSupportingClaimCount,
      groundedSupportingDocumentCount,
      groundedLinkedSearchDocumentCount,
      groundedSourceDecisionSupportCount,
      groundedRecommendedNextAction: stringValue(grounded.recommendedNextAction),
      remainingMarkerCount,
      cleanedUp: remainingMarkerCountBeforeCleanup > 0 && remainingMarkerCount === 0
    };
  } finally {
    if (runtime !== undefined) {
      await runtime.close();
    }

    await client.end();
  }
};
