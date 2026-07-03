import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  DrizzleMemoryRepository
} from "./repositories/index.js";
import { inspectDatabaseRequiredTables } from "./readinessSupport.js";

export interface MemoryGovernanceReadinessInput {
  databaseUrl: string;
}

export interface MemoryGovernanceReadinessReport {
  requiredTables: readonly string[];
  presentTables: readonly string[];
  missingTables: readonly string[];
  requiredTableCount: number;
  presentTableCount: number;
  schemaReady: boolean;
  memoryRepositoryReachable: boolean;
  memoryCandidateCount: number;
  memoryRecordCount: number;
  memoryApplicationCount: number;
  antiMemoryRecordCount: number;
  memoryGovernanceProbeReady: boolean;
  runtimeProofReady: boolean;
  memoryRepositoryError?: string;
}

const requiredMemoryGovernanceTables = [
  "memory_records",
  "memory_record_versions",
  "memory_candidates",
  "memory_applications",
  "memory_feedback_events",
  "anti_memory_records"
] as const;

interface MemoryGovernanceCounts {
  memoryCandidateCount: number;
  memoryRecordCount: number;
  memoryApplicationCount: number;
  antiMemoryRecordCount: number;
}

const emptyCounts: MemoryGovernanceCounts = {
  memoryCandidateCount: 0,
  memoryRecordCount: 0,
  memoryApplicationCount: 0,
  antiMemoryRecordCount: 0
};

const memoryGovernanceProbeMarker = (): string =>
  `memory-governance-readiness-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const requirePositiveCount = (
  value: number,
  label: string
): void => {
  if (value <= 0) {
    throw new Error(`${label} readiness probe count is zero`);
  }
};

const assertMemoryGovernanceConstraintViolation = async (
  client: postgres.Sql
): Promise<void> => {
  await client`savepoint memory_governance_readiness_constraint`;

  let constraintFailed = false;

  try {
    await client`
      insert into memory_records (
        project_id,
        key,
        kind,
        summary,
        body,
        owner,
        confidence,
        application_guidance,
        source_lineage
      )
      values (
        '00000000-0000-4000-8000-000000000001',
        'invalid-readiness-probe',
        'risk',
        'invalid readiness probe',
        'invalid readiness probe',
        'db-readiness',
        101,
        'invalid readiness probe',
        ${client.json(["invalid-readiness-probe"])}
      )
    `;
  } catch {
    constraintFailed = true;
    await client`rollback to savepoint memory_governance_readiness_constraint`;
  }

  await client`release savepoint memory_governance_readiness_constraint`;

  if (!constraintFailed) {
    throw new Error("memory_records accepted confidence outside 0..100");
  }
};

const runMemoryGovernanceReadinessProbe = async (
  client: postgres.Sql
): Promise<boolean> => {
  const marker = memoryGovernanceProbeMarker();

  await client`begin`;

  try {
    const [workspace] = await client<{ id: string }[]>`
      insert into workspaces (slug, display_name, metadata)
      values (${marker}, 'Memory governance readiness probe', ${client.json({ marker })})
      returning id
    `;

    if (workspace === undefined) {
      throw new Error("memory governance readiness probe did not create a workspace");
    }

    const [project] = await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspace.id}, ${marker}, 'Memory governance readiness probe', ${client.json({ marker })})
      returning id
    `;

    if (project === undefined) {
      throw new Error("memory governance readiness probe did not create a project");
    }

    const [memoryRecord] = await client<{ id: string }[]>`
      insert into memory_records (
        project_id,
        key,
        kind,
        summary,
        body,
        owner,
        confidence,
        application_guidance,
        source_lineage,
        metadata
      )
      values (
        ${project.id},
        ${marker},
        'risk',
        'Memory governance readiness probe',
        'The probe writes and reads memory governance rows in one transaction.',
        'db-readiness',
        80,
        'Use as structural DB readiness proof only.',
        ${client.json([marker])},
        ${client.json({ marker })}
      )
      returning id
    `;

    if (memoryRecord === undefined) {
      throw new Error("memory governance readiness probe did not create a memory record");
    }

    await client`
      insert into memory_record_versions (
        memory_record_id,
        version,
        summary,
        body,
        owner,
        confidence,
        application_guidance,
        source_lineage,
        metadata
      )
      values (
        ${memoryRecord.id},
        1,
        'Memory governance readiness probe',
        'The probe writes a memory version.',
        'db-readiness',
        80,
        'Use as structural DB readiness proof only.',
        ${client.json([marker])},
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into memory_candidates (
        project_id,
        proposed_by,
        kind,
        summary,
        body,
        owner,
        confidence,
        application_guidance,
        source_lineage,
        metadata
      )
      values (
        ${project.id},
        'db-readiness',
        'risk',
        'Memory governance readiness candidate probe',
        'The probe writes a memory candidate.',
        'db-readiness',
        80,
        'Use as structural DB readiness proof only.',
        ${client.json([marker])},
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into memory_applications (
        memory_record_id,
        expected_use,
        outcome,
        notes,
        metadata
      )
      values (
        ${memoryRecord.id},
        'prove memory application writes are structurally usable',
        'neutral',
        'memory governance readiness probe',
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into memory_feedback_events (
        memory_record_id,
        direction,
        note,
        reason,
        evidence_ref,
        metadata
      )
      values (
        ${memoryRecord.id},
        'positive',
        'memory governance readiness probe',
        'structural readiness',
        ${marker},
        ${client.json({ marker })}
      )
    `;

    await client`
      insert into anti_memory_records (
        project_id,
        key,
        rejected_claim,
        reason,
        applies_to,
        may_revisit_when,
        summary,
        body,
        owner,
        confidence,
        source_lineage,
        metadata
      )
      values (
        ${project.id},
        ${`${marker}:anti`},
        'unsupported memory governance readiness claim',
        'structural anti-memory readiness',
        'db readiness',
        'when memory governance readiness semantics change',
        'Anti-memory readiness probe',
        'The probe writes an anti-memory record.',
        'db-readiness',
        80,
        ${client.json([marker])},
        ${client.json({ marker })}
      )
    `;

    const [counts] = await client<{
      memoryCandidateCount: number;
      memoryRecordCount: number;
      memoryRecordVersionCount: number;
      memoryApplicationCount: number;
      memoryFeedbackEventCount: number;
      antiMemoryRecordCount: number;
    }[]>`
      select
        (select count(*)::int from memory_candidates where metadata ->> 'marker' = ${marker}) as "memoryCandidateCount",
        (select count(*)::int from memory_records where metadata ->> 'marker' = ${marker}) as "memoryRecordCount",
        (select count(*)::int from memory_record_versions where metadata ->> 'marker' = ${marker}) as "memoryRecordVersionCount",
        (select count(*)::int from memory_applications where metadata ->> 'marker' = ${marker}) as "memoryApplicationCount",
        (select count(*)::int from memory_feedback_events where metadata ->> 'marker' = ${marker}) as "memoryFeedbackEventCount",
        (select count(*)::int from anti_memory_records where metadata ->> 'marker' = ${marker}) as "antiMemoryRecordCount"
    `;

    if (counts === undefined) {
      throw new Error("memory governance readiness probe count query returned no row");
    }

    requirePositiveCount(counts.memoryCandidateCount, "memory_candidates");
    requirePositiveCount(counts.memoryRecordCount, "memory_records");
    requirePositiveCount(counts.memoryRecordVersionCount, "memory_record_versions");
    requirePositiveCount(counts.memoryApplicationCount, "memory_applications");
    requirePositiveCount(counts.memoryFeedbackEventCount, "memory_feedback_events");
    requirePositiveCount(counts.antiMemoryRecordCount, "anti_memory_records");

    await assertMemoryGovernanceConstraintViolation(client);

    return true;
  } finally {
    await client`rollback`;
  }
};

export const inspectMemoryGovernanceReadiness = async (
  input: MemoryGovernanceReadinessInput
): Promise<MemoryGovernanceReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for memory governance readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const tableInspection = await inspectDatabaseRequiredTables(client, requiredMemoryGovernanceTables);
    const { presentTables, missingTables, schemaReady } = tableInspection;
    let memoryRepositoryReachable = false;
    let memoryRepositoryError: string | undefined;
    let memoryGovernanceProbeReady = false;
    let counts = emptyCounts;

    if (schemaReady) {
      try {
        const memoryRepository = new DrizzleMemoryRepository(createKrnDatabase(client));

        await memoryRepository.getMemoryRecordById("00000000-0000-0000-0000-000000000000");
        await memoryRepository.getMemoryCandidateById("00000000-0000-0000-0000-000000000000");
        memoryRepositoryReachable = true;
      } catch (error) {
        memoryRepositoryError =
          error instanceof Error ? error.message : "unknown memory repository error";
      }

      try {
        memoryGovernanceProbeReady = await runMemoryGovernanceReadinessProbe(client);
      } catch (error) {
        memoryRepositoryError =
          error instanceof Error ? error.message : "unknown memory governance readiness probe error";
      }

      const countRows = await client<MemoryGovernanceCounts[]>`
        select
          (select count(*)::int from memory_candidates) as "memoryCandidateCount",
          (select count(*)::int from memory_records) as "memoryRecordCount",
          (select count(*)::int from memory_applications) as "memoryApplicationCount",
          (select count(*)::int from anti_memory_records) as "antiMemoryRecordCount"
      `;

      counts = countRows[0] ?? emptyCounts;
    }

    return {
      requiredTables: requiredMemoryGovernanceTables,
      presentTables,
      missingTables,
      requiredTableCount: tableInspection.requiredTableCount,
      presentTableCount: tableInspection.presentTableCount,
      schemaReady,
      memoryRepositoryReachable,
      memoryCandidateCount: counts.memoryCandidateCount,
      memoryRecordCount: counts.memoryRecordCount,
      memoryApplicationCount: counts.memoryApplicationCount,
      antiMemoryRecordCount: counts.antiMemoryRecordCount,
      memoryGovernanceProbeReady,
      runtimeProofReady:
        memoryRepositoryReachable &&
        memoryGovernanceProbeReady,
      ...(memoryRepositoryError === undefined ? {} : { memoryRepositoryError })
    };
  } finally {
    await client.end();
  }
};
