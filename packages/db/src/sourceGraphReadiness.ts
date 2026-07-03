import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  DrizzleSourceRepository
} from "./repositories/index.js";
import { inspectDatabaseRequiredTables } from "./readinessSupport.js";

export interface SourceGraphReadinessInput {
  databaseUrl: string;
}

export interface SourceGraphReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  sourceRepositoryReachable: boolean;
  sourceArtifactCount: number;
  sourceClaimCount: number;
  sourceDecisionEdgeCount: number;
  sourceRejectionCount: number;
  sourceGraphProbeReady: boolean;
  runtimeProofReady: boolean;
  sourceRepositoryError?: string;
}

const requiredSourceGraphTables = [
  "source_artifacts",
  "source_chunks",
  "source_claims",
  "source_claim_edges",
  "source_decisions",
  "source_decision_edges",
  "source_rejections",
  "source_snapshots"
] as const;

interface SourceGraphCounts {
  sourceArtifactCount: number;
  sourceClaimCount: number;
  sourceDecisionEdgeCount: number;
  sourceRejectionCount: number;
}

const emptyCounts: SourceGraphCounts = {
  sourceArtifactCount: 0,
  sourceClaimCount: 0,
  sourceDecisionEdgeCount: 0,
  sourceRejectionCount: 0
};

const sourceGraphProbeMarker = (): string =>
  `source-graph-readiness-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const invalidSourceClaimId = "00000000-0000-4000-8000-000000000001";

const requirePositiveCount = (
  value: number,
  label: string
): void => {
  if (value <= 0) {
    throw new Error(`${label} readiness probe count is zero`);
  }
};

const assertSourceGraphConstraintViolation = async (
  client: postgres.Sql
): Promise<void> => {
  await client`savepoint source_graph_readiness_constraint`;

  let constraintFailed = false;

  try {
    await client`
      insert into source_claim_edges (
        from_source_claim_id,
        to_source_claim_id,
        kind
      )
      values (
        ${invalidSourceClaimId},
        ${invalidSourceClaimId},
        'supports'
      )
    `;
  } catch {
    constraintFailed = true;
    await client`rollback to savepoint source_graph_readiness_constraint`;
  }

  await client`release savepoint source_graph_readiness_constraint`;

  if (!constraintFailed) {
    throw new Error("source_claim_edges accepted invalid SourceClaim references");
  }
};

const runSourceGraphReadinessProbe = async (
  client: postgres.Sql
): Promise<boolean> => {
  const marker = sourceGraphProbeMarker();

  await client`begin`;

  try {
    const [workspace] = await client<{ id: string }[]>`
      insert into workspaces (slug, display_name, metadata)
      values (${marker}, 'Source graph readiness probe', ${client.json({ marker })})
      returning id
    `;

    if (workspace === undefined) {
      throw new Error("source graph readiness probe did not create a workspace");
    }

    const [project] = await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspace.id}, ${marker}, 'Source graph readiness probe', ${client.json({ marker })})
      returning id
    `;

    if (project === undefined) {
      throw new Error("source graph readiness probe did not create a project");
    }

    const [artifact] = await client<{ id: string }[]>`
      insert into source_artifacts (
        project_id,
        kind,
        trust_tier,
        uri,
        title,
        content_hash,
        metadata
      )
      values (
        ${project.id},
        'doc',
        'source-code',
        ${`probe://${marker}`},
        'Source graph readiness probe',
        ${`sha256:${marker}`},
        ${client.json({ marker })}
      )
      returning id
    `;

    if (artifact === undefined) {
      throw new Error("source graph readiness probe did not create a source artifact");
    }

    const [chunk] = await client<{ id: string }[]>`
      insert into source_chunks (
        source_artifact_id,
        ordinal,
        content,
        content_hash,
        metadata
      )
      values (
        ${artifact.id},
        0,
        'source graph readiness probe chunk',
        ${`sha256:${marker}:chunk`},
        ${client.json({ marker })}
      )
      returning id
    `;

    if (chunk === undefined) {
      throw new Error("source graph readiness probe did not create a source chunk");
    }

    const [sourceClaim] = await client<{ id: string }[]>`
      insert into source_claims (
        source_artifact_id,
        source_chunk_id,
        claim,
        mechanism,
        krn_implication,
        does_not_prove,
        trust_tier,
        support_type,
        consumer,
        falsifier,
        metadata
      )
      values (
        ${artifact.id},
        ${chunk.id},
        'Source graph readiness probe claim',
        'The probe writes and reads source graph rows in one transaction.',
        'Readiness proves source graph persistence is structurally usable.',
        'This probe does not prove source truth or product readiness.',
        'source-code',
        'mechanism',
        'db readiness',
        'delete or break a source graph required table',
        ${client.json({ marker })}
      )
      returning id
    `;

    const [relatedClaim] = await client<{ id: string }[]>`
      insert into source_claims (
        source_artifact_id,
        source_chunk_id,
        claim,
        mechanism,
        krn_implication,
        does_not_prove,
        trust_tier,
        support_type,
        consumer,
        falsifier,
        metadata
      )
      values (
        ${artifact.id},
        ${chunk.id},
        'Related source graph readiness probe claim',
        'The related claim supports edge readback.',
        'Readiness can verify SourceClaimEdge persistence.',
        'This probe does not prove graph retrieval quality.',
        'source-code',
        'mechanism',
        'db readiness',
        'delete or break source claim edge writes',
        ${client.json({ marker })}
      )
      returning id
    `;

    if (sourceClaim === undefined || relatedClaim === undefined) {
      throw new Error("source graph readiness probe did not create source claims");
    }

    await client`
      insert into source_claim_edges (
        from_source_claim_id,
        to_source_claim_id,
        kind,
        metadata
      )
      values (
        ${sourceClaim.id},
        ${relatedClaim.id},
        'supports',
        ${client.json({ marker })}
      )
    `;

    const [sourceDecision] = await client<{ id: string }[]>`
      insert into source_decisions (
        project_id,
        source_claim_id,
        status,
        decision,
        rationale,
        falsifier,
        consumer,
        metadata
      )
      values (
        ${project.id},
        ${sourceClaim.id},
        'adopt',
        'Use source graph readiness probe rows as structural DB proof only.',
        'The probe inserts and reads live source graph tables.',
        'source graph readiness probe fails',
        'db readiness',
        ${client.json({ marker })}
      )
      returning id
    `;

    if (sourceDecision === undefined) {
      throw new Error("source graph readiness probe did not create a source decision");
    }

    await client`
      insert into source_decision_edges (
        source_claim_id,
        target_type,
        target_id,
        support_type,
        confidence,
        notes,
        metadata
      )
      values (
        ${sourceClaim.id},
        'architecture_decision',
        ${marker},
        'mechanism',
        'high',
        'source graph readiness probe decision edge',
        ${client.json({ marker, sourceDecisionId: sourceDecision.id })}
      )
    `;

    await client`
      insert into source_rejections (
        project_id,
        source_artifact_id,
        source_claim_id,
        title,
        attempted_claim,
        rejected_because,
        reason,
        does_not_prove,
        consumer,
        metadata
      )
      values (
        ${project.id},
        ${artifact.id},
        ${relatedClaim.id},
        'Source graph readiness rejection probe',
        'A rejected probe claim should remain rejected.',
        'unsupported',
        'The related probe claim is only structural support.',
        'This rejection does not prove source quality.',
        'db readiness',
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into source_snapshots (
        source_artifact_id,
        snapshot_uri,
        content_hash,
        metadata
      )
      values (
        ${artifact.id},
        ${`probe://${marker}/snapshot`},
        ${`sha256:${marker}:snapshot`},
        ${client.json({ marker })}
      )
    `;

    const [counts] = await client<{
      sourceArtifactCount: number;
      sourceClaimCount: number;
      sourceClaimEdgeCount: number;
      sourceDecisionCount: number;
      sourceDecisionEdgeCount: number;
      sourceRejectionCount: number;
      sourceSnapshotCount: number;
    }[]>`
      select
        (select count(*)::int from source_artifacts where metadata ->> 'marker' = ${marker}) as "sourceArtifactCount",
        (select count(*)::int from source_claims where metadata ->> 'marker' = ${marker}) as "sourceClaimCount",
        (select count(*)::int from source_claim_edges where metadata ->> 'marker' = ${marker}) as "sourceClaimEdgeCount",
        (select count(*)::int from source_decisions where metadata ->> 'marker' = ${marker}) as "sourceDecisionCount",
        (select count(*)::int from source_decision_edges where metadata ->> 'marker' = ${marker}) as "sourceDecisionEdgeCount",
        (select count(*)::int from source_rejections where metadata ->> 'marker' = ${marker}) as "sourceRejectionCount",
        (select count(*)::int from source_snapshots where metadata ->> 'marker' = ${marker}) as "sourceSnapshotCount"
    `;

    if (counts === undefined) {
      throw new Error("source graph readiness probe count query returned no row");
    }

    requirePositiveCount(counts.sourceArtifactCount, "source_artifacts");
    requirePositiveCount(counts.sourceClaimCount, "source_claims");
    requirePositiveCount(counts.sourceClaimEdgeCount, "source_claim_edges");
    requirePositiveCount(counts.sourceDecisionCount, "source_decisions");
    requirePositiveCount(counts.sourceDecisionEdgeCount, "source_decision_edges");
    requirePositiveCount(counts.sourceRejectionCount, "source_rejections");
    requirePositiveCount(counts.sourceSnapshotCount, "source_snapshots");

    await assertSourceGraphConstraintViolation(client);

    return true;
  } finally {
    await client`rollback`;
  }
};

export const inspectSourceGraphReadiness = async (
  input: SourceGraphReadinessInput
): Promise<SourceGraphReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for source graph readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const tableInspection = await inspectDatabaseRequiredTables(client, requiredSourceGraphTables);
    const { presentTables, missingTables, schemaReady } = tableInspection;
    let sourceRepositoryReachable = false;
    let sourceRepositoryError: string | undefined;
    let sourceGraphProbeReady = false;
    let counts = emptyCounts;

    if (schemaReady) {
      try {
        const sourceRepository = new DrizzleSourceRepository(createKrnDatabase(client));

        await sourceRepository.getSourceClaimById("00000000-0000-0000-0000-000000000000");
        sourceRepositoryReachable = true;
      } catch (error) {
        sourceRepositoryError = error instanceof Error ? error.message : "unknown source repository error";
      }

      try {
        sourceGraphProbeReady = await runSourceGraphReadinessProbe(client);
      } catch (error) {
        sourceRepositoryError =
          error instanceof Error ? error.message : "unknown source graph readiness probe error";
      }

      const countRows = await client<SourceGraphCounts[]>`
        select
          (select count(*)::int from source_artifacts) as "sourceArtifactCount",
          (select count(*)::int from source_claims) as "sourceClaimCount",
          (select count(*)::int from source_decision_edges) as "sourceDecisionEdgeCount",
          (select count(*)::int from source_rejections) as "sourceRejectionCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredSourceGraphTables,
      presentTables,
      missingTables,
      requiredTableCount: tableInspection.requiredTableCount,
      presentTableCount: tableInspection.presentTableCount,
      schemaReady,
      sourceRepositoryReachable,
      sourceArtifactCount: counts.sourceArtifactCount,
      sourceClaimCount: counts.sourceClaimCount,
      sourceDecisionEdgeCount: counts.sourceDecisionEdgeCount,
      sourceRejectionCount: counts.sourceRejectionCount,
      sourceGraphProbeReady,
      runtimeProofReady:
        sourceRepositoryReachable &&
        sourceGraphProbeReady,
      ...(sourceRepositoryError === undefined ? {} : { sourceRepositoryError })
    };
  } finally {
    await client.end();
  }
};
