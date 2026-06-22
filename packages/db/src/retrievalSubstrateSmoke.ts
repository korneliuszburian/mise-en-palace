import postgres from "postgres";
import {
  eq,
  sql
} from "drizzle-orm";

import { createKrnDatabase } from "./database.js";
import { runMigrationReadinessCheck } from "./migrationReadiness.js";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "./repositories/index.js";
import {
  contextExclusions,
  contextItems,
  memoryRecords,
  memoryRecordVersions,
  runEvents,
  sourceArtifacts,
  sourceClaims,
  sourceDecisions,
  workspaces
} from "./schema/index.js";

export interface RetrievalSubstrateSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface RetrievalSubstrateSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  sourceClaimId: string;
  memoryRecordId: string;
  evidenceBundleId: string;
  sourceDecisionId: string;
  searchDocumentCount: number;
  lexicalResultCount: number;
  embeddingModelId: string;
  embeddingId: string;
  retrievalRunId: string;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  contextItemCount: number;
  contextExclusionCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
};

const placeholderVector = (): number[] =>
  Array.from({ length: 1536 }, (_, index) => (index === 0 ? 1 : 0));

const countMarkerRows = async (
  db: ReturnType<typeof createKrnDatabase>,
  workspaceSlug: string,
  marker: string,
  contextAssemblyId: string | undefined
): Promise<number> => {
  const workspaceRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug));
  const sourceArtifactRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceArtifacts)
    .where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${marker}`);
  const sourceClaimRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceClaims)
    .where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);
  const sourceDecisionRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sourceDecisions)
    .where(sql`${sourceDecisions.metadata}->>'smokeId' = ${marker}`);
  const memoryRecordRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryRecords)
    .where(sql`${memoryRecords.metadata}->>'smokeId' = ${marker}`);
  const memoryRecordVersionRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryRecordVersions)
    .where(sql`${memoryRecordVersions.metadata}->>'smokeId' = ${marker}`);
  const eventRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runEvents)
    .where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);
  const contextItemRows =
    contextAssemblyId === undefined
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(contextItems)
          .where(eq(contextItems.contextAssemblyId, contextAssemblyId));
  const contextExclusionRows =
    contextAssemblyId === undefined
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(contextExclusions)
          .where(eq(contextExclusions.contextAssemblyId, contextAssemblyId));

  return (
    (workspaceRows[0]?.count ?? 0) +
    (sourceArtifactRows[0]?.count ?? 0) +
    (sourceClaimRows[0]?.count ?? 0) +
    (sourceDecisionRows[0]?.count ?? 0) +
    (memoryRecordRows[0]?.count ?? 0) +
    (memoryRecordVersionRows[0]?.count ?? 0) +
    (eventRows[0]?.count ?? 0) +
    (contextItemRows[0]?.count ?? 0) +
    (contextExclusionRows[0]?.count ?? 0)
  );
};

export const runRetrievalSubstrateSmokeCheck = async (
  input: RetrievalSubstrateSmokeInput
): Promise<RetrievalSubstrateSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for retrieval substrate smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-retrieval-smoke-${marker}`;
  const projectSlug = "retrieval-substrate";
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  let contextAssemblyId: string | undefined;

  const retrievalRepository = new DrizzleRetrievalRepository(db);

  const cleanup = async (): Promise<number> => {
    await retrievalRepository.cleanupTestRetrievalRecords({ smokeId: marker });
    await db
      .delete(memoryRecordVersions)
      .where(sql`${memoryRecordVersions.metadata}->>'smokeId' = ${marker}`);
    await db.delete(memoryRecords).where(sql`${memoryRecords.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceDecisions).where(sql`${sourceDecisions.metadata}->>'smokeId' = ${marker}`);
    await db.delete(sourceClaims).where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);
    await db
      .delete(sourceArtifacts)
      .where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${marker}`);
    await db.delete(runEvents).where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);
    await db.delete(workspaces).where(eq(workspaces.slug, workspaceSlug));

    return countMarkerRows(db, workspaceSlug, marker, contextAssemblyId);
  };

  try {
    await cleanup();

    const projectRepository = new DrizzleProjectRepository(db);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);
    const sourceRepository = new DrizzleSourceRepository(db);
    const memoryRepository = new DrizzleMemoryRepository(db);
    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: projectSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    const operatorIntent = await harnessRunRepository.createOperatorIntent({
      workspaceId: workspace.id,
      projectId: project.id,
      source: "cli",
      rawIntent: `retrieval substrate smoke ${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const taskContract = await harnessRunRepository.createTaskContract({
      operatorIntentId: operatorIntent.id,
      projectId: project.id,
      title: "Retrieval substrate smoke",
      objective: "Prove search document, lexical retrieval, embeddings, candidates, activation, and exclusions.",
      constraints: ["no external embedding service", "self-clean marker rows"],
      nonGoals: ["no dashboard", "no separate vector DB"],
      acceptance: ["lexical search finds inserted document", "cleanup count zero"],
      metadata: {
        smokeId: marker
      }
    });
    const harnessPlan = await harnessRunRepository.createHarnessPlan({
      taskContractId: taskContract.id,
      version: 1,
      status: "running",
      summary: "Retrieval substrate smoke plan",
      nextAction: "Create retrieval substrate proof rows.",
      metadata: {
        smokeId: marker
      }
    });
    const contextAssembly = await harnessRunRepository.createContextAssembly({
      harnessPlanId: harnessPlan.id,
      status: "assembled",
      tokenBudget: 1000,
      inclusions: [],
      exclusions: [],
      metadata: {
        smokeId: marker
      }
    });
    contextAssemblyId = contextAssembly.id;
    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.retrieval_substrate.plan_created",
        message: "Retrieval substrate smoke plan created",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker
      }
    });
    const evidenceBundle = await harnessRunRepository.createEvidenceBundle({
      executionRunId: executionRun.id,
      status: "captured",
      changedFiles: ["packages/db/src/retrievalSubstrateSmoke.ts"],
      commands: [{
        command: "pnpm db:smoke:retrieval-substrate",
        status: "passed"
      }],
      diffRisk: "low",
      reviewBurden: "Smoke proof only.",
      rollbackPath: "Delete smoke marker rows.",
      event: {
        sequence: 2,
        type: "smoke.retrieval_substrate.evidence_captured",
        message: "Retrieval substrate smoke evidence captured",
        payload: {
          smokeId: marker
        }
      },
      metadata: {
        smokeId: marker
      }
    });
    const sourceArtifact = await sourceRepository.createSourceArtifact({
      projectId: project.id,
      kind: "operator_input",
      trustTier: "project-decision",
      uri: `operator://retrieval-substrate-smoke/${marker}`,
      title: "Retrieval substrate smoke source",
      contentHash: `retrieval-substrate-smoke-${marker}`,
      metadata: {
        smokeId: marker
      }
    });
    const sourceClaim = await sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      executionRunId: executionRun.id,
      claim: "Retrieval substrate should keep lexical search and vector-ready records inside Postgres.",
      mechanism: "SearchDocument stores text/FTS data and Embedding stores a pgvector row linked to the document.",
      krnImplication: "M25 activation can rank and audit bounded context candidates.",
      doesNotProve: "This does not prove final ranking quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M24 retrieval substrate smoke",
      falsifier: "Retrieval substrate smoke readback or cleanup fails.",
      revisitWhen: "M25 activation ranking changes the retrieval contract.",
      status: "proposed",
      metadata: {
        smokeId: marker
      }
    });
    const sourceDecision = await sourceRepository.createSourceDecision({
      projectId: project.id,
      sourceClaimId: sourceClaim.id,
      status: "adopt",
      decision: "Keep retrieval substrate in Postgres/pgvector for M24.",
      rationale: "The smoke can persist search documents, lexical search, embedding rows, candidates, and activation decisions without a separate service.",
      falsifier: "Postgres cannot support the M24 retrieval smoke chain.",
      consumer: "M24 retrieval substrate smoke",
      metadata: {
        smokeId: marker
      }
    });
    const memoryRecord = await memoryRepository.createMemoryRecord({
      projectId: project.id,
      key: `retrieval-substrate-smoke:${marker}`,
      kind: "constraint",
      status: "active",
      summary: "Keep retrieval substrate store-backed",
      body: "Retrieval candidates and activation decisions should be persisted before M25 activation.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use when wiring activation context.",
      invalidationRule: "Revisit when retrieval leaves Postgres.",
      sourceLineage: [{ sourceId: sourceClaim.id }],
      isUserPreference: false,
      metadata: {
        smokeId: marker
      }
    });
    const sourceDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "source_claim",
      subjectId: sourceClaim.id,
      sourceClaimId: sourceClaim.id,
      title: "Source graph Postgres edge tables",
      body: "Use Postgres source decision edges before adding a separate graph DB.",
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });
    const memoryDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "memory_record",
      subjectId: memoryRecord.id,
      memoryRecordId: memoryRecord.id,
      title: "Retrieval substrate memory",
      body: "Memory records should become bounded retrieval candidates before activation.",
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });
    const evidenceDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "evidence_bundle",
      subjectId: evidenceBundle.id,
      evidenceBundleId: evidenceBundle.id,
      title: "Retrieval substrate evidence",
      body: "Evidence bundles can be indexed as retrieval documents for follow-up runs.",
      trustTier: "medium",
      metadata: {
        smokeId: marker
      }
    });
    const decisionDocument = await retrievalRepository.createSearchDocument({
      projectId: project.id,
      subjectType: "architecture_decision",
      subjectId: sourceDecision.id,
      sourceDecisionId: sourceDecision.id,
      title: "Retrieval substrate decision",
      body: "Adopt Postgres and pgvector as the M24 retrieval substrate.",
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });
    const lexicalResults = await retrievalRepository.searchLexical({
      projectId: project.id,
      query: "source graph postgres edge tables",
      limit: 5
    });

    if (!lexicalResults.some((result) => result.id === sourceDocument.id)) {
      throw new Error("Retrieval substrate smoke lexical search did not find source document");
    }

    const embeddingModel = await retrievalRepository.createEmbeddingModel({
      provider: "local-placeholder",
      model: "placeholder-1536",
      dimensions: 1536,
      distanceMetric: "cosine",
      metadata: {
        smokeId: marker
      }
    });
    const embedding = await retrievalRepository.createEmbedding({
      projectId: project.id,
      embeddingModelId: embeddingModel.id,
      subjectType: "search_document",
      subjectId: sourceDocument.id,
      searchDocumentId: sourceDocument.id,
      embedding: placeholderVector(),
      contentHash: `retrieval-placeholder-${marker}`,
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });
    const retrievalRun = await retrievalRepository.createRetrievalRun({
      projectId: project.id,
      executionRunId: executionRun.id,
      taskContractId: taskContract.id,
      query: "source graph postgres edge tables",
      mode: "hybrid",
      budget: 1000,
      metadataFilters: {
        trustTier: "project-decision"
      },
      metadata: {
        smokeId: marker
      }
    });
    const includedCandidate = await retrievalRepository.createRetrievalCandidate({
      retrievalRunId: retrievalRun.id,
      kind: "search",
      status: "included",
      subjectType: "search_document",
      subjectId: sourceDocument.id,
      searchDocumentId: sourceDocument.id,
      trustTier: "project-decision",
      lexicalScore: 95,
      vectorScore: 80,
      totalScore: 90,
      score: 90,
      reason: "Lexical query matched the source graph decision terms.",
      metadata: {
        smokeId: marker
      }
    });
    const excludedCandidate = await retrievalRepository.createRetrievalCandidate({
      retrievalRunId: retrievalRun.id,
      kind: "memory",
      status: "excluded",
      subjectType: "search_document",
      subjectId: memoryDocument.id,
      searchDocumentId: memoryDocument.id,
      trustTier: "project-decision",
      lexicalScore: 30,
      contextRoiScore: 20,
      totalScore: 25,
      score: 25,
      reason: "Useful background, but lower context ROI for this query.",
      metadata: {
        smokeId: marker
      }
    });
    await retrievalRepository.createActivationDecision({
      retrievalRunId: retrievalRun.id,
      retrievalCandidateId: includedCandidate.id,
      contextAssemblyId: contextAssembly.id,
      subjectType: "search_document",
      subjectId: sourceDocument.id,
      decision: "included",
      reason: "High-signal source-grounded retrieval candidate.",
      score: 90,
      contextBudgetCost: 220,
      expectedDecisionImpact: "Supports keeping retrieval substrate in Postgres.",
      metadata: {
        smokeId: marker
      }
    });
    await retrievalRepository.createActivationDecision({
      retrievalRunId: retrievalRun.id,
      retrievalCandidateId: excludedCandidate.id,
      contextAssemblyId: contextAssembly.id,
      subjectType: "search_document",
      subjectId: memoryDocument.id,
      decision: "excluded",
      reason: "Lower context ROI than the source claim document.",
      score: 25,
      contextBudgetCost: 400,
      expectedDecisionImpact: "Would add background but not change the decision.",
      metadata: {
        smokeId: marker
      }
    });
    await retrievalRepository.storeContextSelection({
      contextAssemblyId: contextAssembly.id,
      inclusions: [{
        subjectType: "search_document",
        subjectId: sourceDocument.id,
        reason: "Direct source graph retrieval proof.",
        expectedUse: "Guide M24 retrieval substrate implementation.",
        tokenEstimate: 220,
        trustTier: "project-decision"
      }],
      exclusions: [{
        subjectType: "search_document",
        subjectId: memoryDocument.id,
        reason: "low_context_roi",
        explanation: "Lower ROI than the source claim for this query.",
        score: 25,
        trustTier: "project-decision"
      }]
    });
    const candidates = await retrievalRepository.listCandidatesForRetrievalRun(retrievalRun.id);
    const activationRecords = await retrievalRepository.listActivationDecisionsForRun(
      retrievalRun.id
    );
    const contextItemRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contextItems)
      .where(eq(contextItems.contextAssemblyId, contextAssembly.id));
    const contextExclusionRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contextExclusions)
      .where(eq(contextExclusions.contextAssemblyId, contextAssembly.id));

    const searchDocumentCount = [
      sourceDocument,
      memoryDocument,
      evidenceDocument,
      decisionDocument
    ].length;
    const retrievalCandidateCount = candidates.length;
    const activationDecisionCount = activationRecords.length;
    const contextItemCount = contextItemRows[0]?.count ?? 0;
    const contextExclusionCount = contextExclusionRows[0]?.count ?? 0;

    if (
      searchDocumentCount !== 4 ||
      lexicalResults.length === 0 ||
      retrievalCandidateCount !== 2 ||
      activationDecisionCount !== 2 ||
      contextItemCount !== 1 ||
      contextExclusionCount !== 1
    ) {
      throw new Error("Retrieval substrate smoke readback did not match expected records");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      sourceClaimId: sourceClaim.id,
      memoryRecordId: memoryRecord.id,
      evidenceBundleId: evidenceBundle.id,
      sourceDecisionId: sourceDecision.id,
      searchDocumentCount,
      lexicalResultCount: lexicalResults.length,
      embeddingModelId: embeddingModel.id,
      embeddingId: embedding.id,
      retrievalRunId: retrievalRun.id,
      retrievalCandidateCount,
      activationDecisionCount,
      contextItemCount,
      contextExclusionCount,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
