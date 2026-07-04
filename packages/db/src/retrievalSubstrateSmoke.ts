import {
  assertSmokeReadbackChecks,
  cleanupRetrievalSubstrateSmokeRows,
  countRetrievalSubstrateSmokeMarkerRows,
  countSmokeContextSelectionRows,
  createSmokeHarnessScaffold
} from "./dbSmokeSupport.js";
import type {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "./repositories/index.js";

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
  vectorResultCount: number;
  hybridResultCount: number;
  embeddingModelId: string;
  embeddingModelProvider: string;
  embeddingModelName: string;
  embeddingModelDimensions: number;
  vectorResultEmbeddingModelId?: string;
  hybridResultEmbeddingModelId?: string;
  lexicalEmbeddingModelProvenance: "unavailable_lexical_only";
  embeddingId: string;
  retrievalRunId: string;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  contextItemCount: number;
  contextExclusionCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const deterministicSmokeVector = (hotIndex: number): number[] =>
  Array.from({ length: 1536 }, (_, index) => (index === hotIndex ? 1 : 0));

export const runRetrievalSubstrateSmokeCheck = async (
  input: RetrievalSubstrateSmokeInput
): Promise<RetrievalSubstrateSmokeReport> => {
  const scaffold = await createSmokeHarnessScaffold({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder,
    smokeId: input.smokeId,
    smokeName: "retrieval substrate smoke",
    workspacePrefix: "krn-retrieval-smoke",
    projectSlug: "retrieval-substrate",
    cleanupRows: cleanupRetrievalSubstrateSmokeRows,
    countMarkerRows: countRetrievalSubstrateSmokeMarkerRows,
    rawIntent: `retrieval substrate smoke ${input.smokeId}`,
    taskContract: {
      title: "Retrieval substrate smoke",
      objective: "Prove search document, lexical retrieval, embeddings, candidates, activation, and exclusions.",
      constraints: ["no external embedding service", "self-clean marker rows"],
      nonGoals: ["no dashboard", "no separate vector DB"],
      acceptance: ["lexical search finds inserted document", "cleanup count zero"]
    },
    harnessPlan: {
      summary: "Retrieval substrate smoke plan",
      nextAction: "Create retrieval substrate proof rows."
    },
    contextAssembly: {
      status: "assembled",
      tokenBudget: 1000
    }
  });
  const {
    client,
    db,
    marker,
    projectSlug,
    workspaceSlug,
    project,
    taskContract,
    harnessPlan,
    contextAssembly,
    cleanup
  } = scaffold;
  const harnessRunRepository: DrizzleHarnessRunRepository = scaffold.harnessRunRepository;
  const memoryRepository: DrizzleMemoryRepository = scaffold.memoryRepository;
  const retrievalRepository: DrizzleRetrievalRepository = scaffold.retrievalRepository;
  const sourceRepository: DrizzleSourceRepository = scaffold.sourceRepository;

  try {
    if (contextAssembly === undefined) {
      throw new Error("Retrieval substrate smoke did not create a context assembly");
    }
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
      provider: "local-smoke",
      model: "smoke-1536",
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
      embedding: deterministicSmokeVector(0),
      contentHash: `retrieval-smoke-${marker}`,
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });
    await retrievalRepository.createEmbedding({
      projectId: project.id,
      embeddingModelId: embeddingModel.id,
      subjectType: "search_document",
      subjectId: memoryDocument.id,
      searchDocumentId: memoryDocument.id,
      embedding: deterministicSmokeVector(1),
      contentHash: `retrieval-smoke-distractor-${marker}`,
      trustTier: "project-decision",
      metadata: {
        smokeId: marker
      }
    });
    const vectorResults = await retrievalRepository.searchVector({
      projectId: project.id,
      embeddingModelId: embeddingModel.id,
      embedding: deterministicSmokeVector(0),
      limit: 5
    });

    const firstVectorResult = vectorResults[0];

    if (firstVectorResult?.id !== sourceDocument.id) {
      throw new Error("Retrieval substrate smoke vector search did not rank source document first");
    }

    if (firstVectorResult.embeddingModel?.embeddingModelId !== embeddingModel.id) {
      throw new Error("Retrieval substrate smoke vector result did not expose embedding model provenance");
    }
    const vectorResultEmbeddingModelId = firstVectorResult.embeddingModel.embeddingModelId;

    const hybridResults = await retrievalRepository.searchHybrid({
      projectId: project.id,
      embeddingModelId: embeddingModel.id,
      query: "source graph postgres edge tables",
      embedding: deterministicSmokeVector(0),
      limit: 5
    });

    if (!hybridResults.some((result) => result.id === sourceDocument.id)) {
      throw new Error("Retrieval substrate smoke hybrid search did not include source document");
    }

    const hybridSourceResult = hybridResults.find((result) => result.id === sourceDocument.id);

    if (hybridSourceResult?.embeddingModel?.embeddingModelId !== embeddingModel.id) {
      throw new Error("Retrieval substrate smoke hybrid result did not expose embedding model provenance");
    }
    const hybridResultEmbeddingModelId = hybridSourceResult.embeddingModel.embeddingModelId;

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
      expectedUse: "Guide retrieval substrate smoke verification.",
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
      exclusionCategory: "low_context_roi",
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
    const contextSelectionCounts = await countSmokeContextSelectionRows(db, contextAssembly.id);

    const searchDocumentCount = [
      sourceDocument,
      memoryDocument,
      evidenceDocument,
      decisionDocument
    ].length;
    const vectorResultCount = vectorResults.length;
    const hybridResultCount = hybridResults.length;
    const retrievalCandidateCount = candidates.length;
    const activationDecisionCount = activationRecords.length;
    const { contextItemCount, contextExclusionCount } = contextSelectionCounts;

    assertSmokeReadbackChecks(
      [
        { label: "search documents", passed: searchDocumentCount === 4 },
        { label: "lexical results", passed: lexicalResults.length > 0 },
        { label: "vector results", passed: vectorResultCount > 0 },
        { label: "hybrid results", passed: hybridResultCount > 0 },
        { label: "retrieval candidates", passed: retrievalCandidateCount === 2 },
        { label: "activation decisions", passed: activationDecisionCount === 2 },
        { label: "context items", passed: contextItemCount === 1 },
        { label: "context exclusions", passed: contextExclusionCount === 1 }
      ],
      "Retrieval substrate smoke readback did not match expected records"
    );

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
      vectorResultCount,
      hybridResultCount,
      embeddingModelId: embeddingModel.id,
      embeddingModelProvider: embeddingModel.provider,
      embeddingModelName: embeddingModel.model,
      embeddingModelDimensions: embeddingModel.dimensions,
      vectorResultEmbeddingModelId,
      hybridResultEmbeddingModelId,
      lexicalEmbeddingModelProvenance: "unavailable_lexical_only",
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
