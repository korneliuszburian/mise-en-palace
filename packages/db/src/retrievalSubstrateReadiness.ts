import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  DrizzleRetrievalRepository
} from "./repositories/index.js";
import { inspectDatabaseRequiredTables } from "./readinessSupport.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "./sql/pgvector.js";

export interface RetrievalSubstrateReadinessInput {
  databaseUrl: string;
}

export interface RetrievalSubstrateReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  retrievalRepositoryReachable: boolean;
  searchDocumentCount: number;
  embeddingCount: number;
  retrievalRunCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  contextExclusionCount: number;
  retrievalSubstrateProbeReady: boolean;
  runtimeProofReady: boolean;
  retrievalRepositoryError?: string;
}

const requiredRetrievalSubstrateTables = [
  "search_documents",
  "embedding_models",
  "embeddings",
  "retrieval_runs",
  "retrieval_candidates",
  "activation_decisions",
  "context_items",
  "context_exclusions"
] as const;

interface RetrievalSubstrateCounts {
  searchDocumentCount: number;
  embeddingCount: number;
  retrievalRunCount: number;
  retrievalCandidateCount: number;
  activationDecisionCount: number;
  contextExclusionCount: number;
}

const emptyCounts: RetrievalSubstrateCounts = {
  searchDocumentCount: 0,
  embeddingCount: 0,
  retrievalRunCount: 0,
  retrievalCandidateCount: 0,
  activationDecisionCount: 0,
  contextExclusionCount: 0
};

const retrievalSubstrateProbeMarker = (): string =>
  `retrieval-substrate-readiness-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const zeroEmbeddingVector = `[${Array.from({
  length: DEFAULT_EMBEDDING_DIMENSIONS
}, () => "0").join(",")}]`;

const requirePositiveCount = (
  value: number,
  label: string
): void => {
  if (value <= 0) {
    throw new Error(`${label} readiness probe count is zero`);
  }
};

const requireInsertedRow = <TRow>(
  row: TRow | undefined,
  label: string
): TRow => {
  if (row === undefined) {
    throw new Error(`retrieval substrate readiness probe did not create ${label}`);
  }

  return row;
};

const invalidRetrievalRunId = "00000000-0000-4000-8000-000000000002";
const invalidSubjectId = "00000000-0000-4000-8000-000000000003";

const assertRetrievalSubstrateConstraintViolation = async (
  client: postgres.Sql
): Promise<void> => {
  await client`savepoint retrieval_substrate_readiness_constraint`;

  let constraintFailed = false;

  try {
    await client`
      insert into retrieval_candidates (
        retrieval_run_id,
        kind,
        subject_type,
        subject_id,
        reason
      )
      values (
        ${invalidRetrievalRunId},
        'search',
        'architecture_decision',
        ${invalidSubjectId},
        'invalid readiness probe'
      )
    `;
  } catch {
    constraintFailed = true;
    await client`rollback to savepoint retrieval_substrate_readiness_constraint`;
  }

  await client`release savepoint retrieval_substrate_readiness_constraint`;

  if (!constraintFailed) {
    throw new Error("retrieval_candidates accepted an invalid retrieval_run_id");
  }
};

const runRetrievalSubstrateReadinessProbe = async (
  client: postgres.Sql
): Promise<boolean> => {
  const marker = retrievalSubstrateProbeMarker();

  await client`begin`;

  try {
    const [workspace] = await client<{ id: string }[]>`
      insert into workspaces (slug, display_name, metadata)
      values (${marker}, 'Retrieval substrate readiness probe', ${client.json({ marker })})
      returning id
    `;

    const workspaceRow = requireInsertedRow(workspace, "a workspace");

    const [project] = await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspaceRow.id}, ${marker}, 'Retrieval substrate readiness probe', ${client.json({ marker })})
      returning id
    `;
    const projectRow = requireInsertedRow(project, "a project");

    const [operatorIntent] = await client<{ id: string }[]>`
      insert into operator_intents (
        workspace_id,
        project_id,
        source,
        raw_intent,
        metadata
      )
      values (
        ${workspaceRow.id},
        ${projectRow.id},
        'db-readiness',
        'retrieval substrate readiness probe',
        ${client.json({ marker })}
      )
      returning id
    `;
    const operatorIntentRow = requireInsertedRow(operatorIntent, "an operator intent");

    const [taskContract] = await client<{ id: string }[]>`
      insert into task_contracts (
        operator_intent_id,
        project_id,
        title,
        objective,
        metadata
      )
      values (
        ${operatorIntentRow.id},
        ${projectRow.id},
        'Retrieval substrate readiness probe',
        'Prove retrieval substrate rows can be inserted and read.',
        ${client.json({ marker })}
      )
      returning id
    `;
    const taskContractRow = requireInsertedRow(taskContract, "a task contract");

    const [harnessPlan] = await client<{ id: string }[]>`
      insert into harness_plans (
        task_contract_id,
        summary,
        metadata
      )
      values (
        ${taskContractRow.id},
        'Retrieval substrate readiness probe',
        ${client.json({ marker })}
      )
      returning id
    `;
    const harnessPlanRow = requireInsertedRow(harnessPlan, "a harness plan");

    const [contextAssembly] = await client<{ id: string }[]>`
      insert into context_assemblies (
        harness_plan_id,
        inclusion_count,
        exclusion_count,
        metadata
      )
      values (
        ${harnessPlanRow.id},
        1,
        1,
        ${client.json({ marker })}
      )
      returning id
    `;
    const contextAssemblyRow = requireInsertedRow(contextAssembly, "a context assembly");

    const [searchDocument] = await client<{ id: string }[]>`
      insert into search_documents (
        project_id,
        subject_type,
        subject_id,
        trust_tier,
        language,
        title,
        body,
        search_text,
        metadata
      )
      values (
        ${projectRow.id},
        'architecture_decision',
        ${projectRow.id},
        'source-code',
        'english',
        'Retrieval substrate readiness probe',
        'The probe writes and reads retrieval rows in one transaction.',
        'retrieval substrate readiness probe',
        ${client.json({ marker })}
      )
      returning id
    `;
    const searchDocumentRow = requireInsertedRow(searchDocument, "a search document");

    const [embeddingModel] = await client<{ id: string }[]>`
      insert into embedding_models (
        provider,
        model,
        dimensions,
        distance_metric,
        metadata
      )
      values (
        'readiness',
        ${marker},
        ${DEFAULT_EMBEDDING_DIMENSIONS},
        'cosine',
        ${client.json({ marker })}
      )
      returning id
    `;
    const embeddingModelRow = requireInsertedRow(embeddingModel, "an embedding model");

    await client`
      insert into embeddings (
        project_id,
        embedding_model_id,
        subject_type,
        subject_id,
        search_document_id,
        embedding,
        content_hash,
        trust_tier,
        metadata
      )
      values (
        ${projectRow.id},
        ${embeddingModelRow.id},
        'architecture_decision',
        ${projectRow.id},
        ${searchDocumentRow.id},
        ${zeroEmbeddingVector}::vector,
        ${`sha256:${marker}:embedding`},
        'source-code',
        ${client.json({ marker })}
      )
    `;

    const [retrievalRun] = await client<{ id: string }[]>`
      insert into retrieval_runs (
        project_id,
        query,
        mode,
        metadata
      )
      values (
        ${projectRow.id},
        'retrieval substrate readiness probe',
        'hybrid',
        ${client.json({ marker })}
      )
      returning id
    `;
    const retrievalRunRow = requireInsertedRow(retrievalRun, "a retrieval run");

    const [retrievalCandidate] = await client<{ id: string }[]>`
      insert into retrieval_candidates (
        retrieval_run_id,
        kind,
        subject_type,
        subject_id,
        search_document_id,
        trust_tier,
        total_score,
        reason,
        metadata
      )
      values (
        ${retrievalRunRow.id},
        'search',
        'architecture_decision',
        ${projectRow.id},
        ${searchDocumentRow.id},
        'source-code',
        100,
        'retrieval substrate readiness probe',
        ${client.json({ marker })}
      )
      returning id
    `;
    const retrievalCandidateRow = requireInsertedRow(retrievalCandidate, "a retrieval candidate");

    await client`
      insert into activation_decisions (
        retrieval_run_id,
        retrieval_candidate_id,
        context_assembly_id,
        subject_type,
        subject_id,
        decision,
        reason,
        score,
        metadata
      )
      values (
        ${retrievalRunRow.id},
        ${retrievalCandidateRow.id},
        ${contextAssemblyRow.id},
        'architecture_decision',
        ${projectRow.id},
        'included',
        'retrieval substrate readiness probe',
        100,
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into context_items (
        context_assembly_id,
        subject_type,
        subject_id,
        position,
        reason,
        expected_use,
        trust_tier,
        metadata
      )
      values (
        ${contextAssemblyRow.id},
        'architecture_decision',
        ${projectRow.id},
        1,
        'retrieval substrate readiness probe',
        'prove context item writes are structurally usable',
        'source-code',
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into context_exclusions (
        context_assembly_id,
        subject_type,
        subject_id,
        reason,
        explanation,
        trust_tier,
        metadata
      )
      values (
        ${contextAssemblyRow.id},
        'architecture_decision',
        ${projectRow.id},
        'duplicate',
        'retrieval substrate readiness probe',
        'source-code',
        ${client.json({ marker })}
      )
    `;

    const [counts] = await client<{
      searchDocumentCount: number;
      embeddingModelCount: number;
      embeddingCount: number;
      retrievalRunCount: number;
      retrievalCandidateCount: number;
      activationDecisionCount: number;
      contextItemCount: number;
      contextExclusionCount: number;
    }[]>`
      select
        (select count(*)::int from search_documents where metadata ->> 'marker' = ${marker}) as "searchDocumentCount",
        (select count(*)::int from embedding_models where metadata ->> 'marker' = ${marker}) as "embeddingModelCount",
        (select count(*)::int from embeddings where metadata ->> 'marker' = ${marker}) as "embeddingCount",
        (select count(*)::int from retrieval_runs where metadata ->> 'marker' = ${marker}) as "retrievalRunCount",
        (select count(*)::int from retrieval_candidates where metadata ->> 'marker' = ${marker}) as "retrievalCandidateCount",
        (select count(*)::int from activation_decisions where metadata ->> 'marker' = ${marker}) as "activationDecisionCount",
        (select count(*)::int from context_items where metadata ->> 'marker' = ${marker}) as "contextItemCount",
        (select count(*)::int from context_exclusions where metadata ->> 'marker' = ${marker}) as "contextExclusionCount"
    `;

    if (counts === undefined) {
      throw new Error("retrieval substrate readiness probe count query returned no row");
    }

    requirePositiveCount(counts.searchDocumentCount, "search_documents");
    requirePositiveCount(counts.embeddingModelCount, "embedding_models");
    requirePositiveCount(counts.embeddingCount, "embeddings");
    requirePositiveCount(counts.retrievalRunCount, "retrieval_runs");
    requirePositiveCount(counts.retrievalCandidateCount, "retrieval_candidates");
    requirePositiveCount(counts.activationDecisionCount, "activation_decisions");
    requirePositiveCount(counts.contextItemCount, "context_items");
    requirePositiveCount(counts.contextExclusionCount, "context_exclusions");

    await assertRetrievalSubstrateConstraintViolation(client);

    return true;
  } finally {
    await client`rollback`;
  }
};

export const inspectRetrievalSubstrateReadiness = async (
  input: RetrievalSubstrateReadinessInput
): Promise<RetrievalSubstrateReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for retrieval substrate readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const tableInspection = await inspectDatabaseRequiredTables(client, requiredRetrievalSubstrateTables);
    const { presentTables, missingTables, schemaReady } = tableInspection;
    let retrievalRepositoryReachable = false;
    let retrievalRepositoryError: string | undefined;
    let retrievalSubstrateProbeReady = false;
    let counts = emptyCounts;

    if (schemaReady) {
      try {
        const retrievalRepository = new DrizzleRetrievalRepository(createKrnDatabase(client));

        await retrievalRepository.listCandidatesForRetrievalRun(
          "00000000-0000-0000-0000-000000000000"
        );
        await retrievalRepository.listActivationDecisionsForRun(
          "00000000-0000-0000-0000-000000000000"
        );
        retrievalRepositoryReachable = true;
      } catch (error) {
        retrievalRepositoryError =
          error instanceof Error ? error.message : "unknown retrieval repository error";
      }

      try {
        retrievalSubstrateProbeReady = await runRetrievalSubstrateReadinessProbe(client);
      } catch (error) {
        retrievalRepositoryError =
          error instanceof Error ? error.message : "unknown retrieval substrate readiness probe error";
      }

      const countRows = await client<RetrievalSubstrateCounts[]>`
        select
          (select count(*)::int from search_documents) as "searchDocumentCount",
          (select count(*)::int from embeddings) as "embeddingCount",
          (select count(*)::int from retrieval_runs) as "retrievalRunCount",
          (select count(*)::int from retrieval_candidates) as "retrievalCandidateCount",
          (select count(*)::int from activation_decisions) as "activationDecisionCount",
          (select count(*)::int from context_exclusions) as "contextExclusionCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredRetrievalSubstrateTables,
      presentTables,
      missingTables,
      requiredTableCount: tableInspection.requiredTableCount,
      presentTableCount: tableInspection.presentTableCount,
      schemaReady,
      retrievalRepositoryReachable,
      searchDocumentCount: counts.searchDocumentCount,
      embeddingCount: counts.embeddingCount,
      retrievalRunCount: counts.retrievalRunCount,
      retrievalCandidateCount: counts.retrievalCandidateCount,
      activationDecisionCount: counts.activationDecisionCount,
      contextExclusionCount: counts.contextExclusionCount,
      retrievalSubstrateProbeReady,
      runtimeProofReady:
        retrievalRepositoryReachable &&
        retrievalSubstrateProbeReady,
      ...(retrievalRepositoryError === undefined ? {} : { retrievalRepositoryError })
    };
  } finally {
    await client.end();
  }
};
