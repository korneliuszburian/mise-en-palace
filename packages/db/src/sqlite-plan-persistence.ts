import { createHash, randomUUID } from "node:crypto";
import type {
  ContextAssembly,
  DecisionPacket,
  DecisionPacketContractReadback,
  EvidenceContract,
  ExecutionRun,
  HarnessPlan,
  OperatorIntent,
  TaskContract
} from "@krn/core";
import { buildDecisionPacketContractReadback } from "@krn/core";

import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import type { BackendConfig } from "./backend-config.js";
import { sqliteMigrationsFolder } from "./migration-assets.js";
import { SqliteMemoryLifecycleRepository } from "./repositories/sqlite-memory-lifecycle-repository.js";
import { SqliteProjectRepository } from "./repositories/sqlite-project-repository.js";
import { SqliteSourceClaimRepository } from "./repositories/sqlite-source-claim-repository.js";
import { contextAssemblies, decisionPacketIssuances, executionRuns, harnessPlans, operatorIntents, taskContracts } from "./schema/sqlite/harness.js";
import { assertSqliteStoreReady, inspectOpenSqliteStore } from "./sqlite-migration-readiness.js";
import { openKrnSqliteDatabase } from "./sqlite-database.js";

export interface SqlitePlanPersistence {
  readonly projectId: string;
  readonly workspaceId: string;
  readonly memoryRepository: SqliteMemoryLifecycleRepository;
  readonly sourceRepository: SqliteSourceClaimRepository;
  persist(input: {
    operatorIntent: OperatorIntent;
    taskContract: TaskContract;
    harnessPlan: HarnessPlan;
    contextAssembly: ContextAssembly;
    evidenceContract: EvidenceContract;
    packet: DecisionPacket;
    metadata: Record<string, unknown>;
  }): Promise<{
    identity: {
      operatorIntentId: string;
      taskContractId: string;
      harnessPlanId: string;
      contextAssemblyId: string;
      executionRunId: string;
    };
    issuance: DecisionPacketContractReadback;
  }>;
  close(): void;
}

const sha256Hex = (value: string): string => createHash("sha256").update(value).digest("hex");

export const openSqlitePlanPersistence = async (
  config: Extract<BackendConfig, { kind: "sqlite" }>,
  repoPath: string,
  projectId?: string
): Promise<SqlitePlanPersistence> => {
  const connection = await openKrnSqliteDatabase(config.dbPath, { createParent: true });
  try {
    migrateSqlite(connection.db, { migrationsFolder: sqliteMigrationsFolder });
    assertSqliteStoreReady(await inspectOpenSqliteStore(connection));
    const projectRepository = new SqliteProjectRepository(connection.db);
    const project = projectId === undefined
      ? await projectRepository.getProjectByRepoPath(repoPath)
      : await projectRepository.getProject(projectId);
    if (project === undefined) {
      throw new Error(`No SQLite project is connected to target repo: ${repoPath}`);
    }

    const memoryRepository = new SqliteMemoryLifecycleRepository(connection.db, connection);
    const sourceRepository = new SqliteSourceClaimRepository(connection.db);

    return {
      projectId: project.id,
      workspaceId: project.workspaceId,
      memoryRepository,
      sourceRepository,
      persist(input) {
        const executionRunId = randomUUID();
        const now = new Date();
        const executionRun: ExecutionRun = {
          id: executionRunId,
          harnessPlanId: input.harnessPlan.id,
          adapter: "codex",
          status: "planned",
          lifecycleRevision: 1,
          metadata: input.metadata,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        const readModel = {
          run: executionRun,
          task: {
            id: input.taskContract.id,
            projectId: input.taskContract.projectId ?? null,
            title: input.taskContract.title,
            objective: input.taskContract.objective,
            constraints: input.taskContract.constraints,
            nonGoals: input.taskContract.nonGoals,
            acceptance: input.taskContract.acceptance,
            status: input.taskContract.status
          },
          context: {
            inclusions: input.packet.contextInclusions.length,
            exclusions: input.packet.contextExclusions.length,
            inclusionDetails: input.packet.contextInclusions,
            exclusionDetails: input.packet.contextExclusions
          },
          toolBoundaries: input.packet.toolBoundaries,
          nextAction: input.packet.nextAction,
          evidenceContractActivation: {
            status: "active" as const,
            taskContractId: input.taskContract.id,
            harnessPlanId: input.harnessPlan.id,
            executionRunId,
            evidenceContract: input.evidenceContract,
            taskContractStatus: "active" as const,
            executionRunStatus: "planned" as const
          },
          evidenceContract: input.evidenceContract,
          evidenceBundles: [],
          feedbackDeltas: [],
          proof: { doesNotProve: input.packet.doesNotProve }
        };
        const issuance = buildDecisionPacketContractReadback({
          readModel,
          generatedAt: now.toISOString(),
          sha256Hex
        });

        const run = connection.client.transaction(() => {
          connection.db.insert(operatorIntents).values({
            id: input.operatorIntent.id,
            workspaceId: project.workspaceId,
            projectId: project.id,
            source: input.operatorIntent.source,
            rawIntent: input.operatorIntent.rawIntent,
            normalizedIntent: input.operatorIntent.normalizedIntent,
            status: input.operatorIntent.status,
            metadata: input.operatorIntent.metadata,
            createdAt: new Date(input.operatorIntent.createdAt),
            updatedAt: now
          }).run();
          connection.db.insert(taskContracts).values({
            id: input.taskContract.id,
            operatorIntentId: input.operatorIntent.id,
            projectId: project.id,
            title: input.taskContract.title,
            objective: input.taskContract.objective,
            constraints: input.taskContract.constraints,
            nonGoals: input.taskContract.nonGoals,
            acceptance: input.taskContract.acceptance,
            status: input.taskContract.status,
            metadata: input.taskContract.metadata,
            createdAt: new Date(input.taskContract.createdAt),
            updatedAt: now
          }).run();
          connection.db.insert(harnessPlans).values({
            id: input.harnessPlan.id,
            taskContractId: input.taskContract.id,
            version: input.harnessPlan.version,
            status: input.harnessPlan.status,
            summary: input.harnessPlan.summary,
            nextAction: input.harnessPlan.nextAction,
            metadata: input.harnessPlan.metadata,
            createdAt: new Date(input.harnessPlan.createdAt),
            updatedAt: now
          }).run();
          connection.db.insert(contextAssemblies).values({
            id: input.contextAssembly.id,
            harnessPlanId: input.harnessPlan.id,
            status: input.contextAssembly.status,
            tokenBudget: input.contextAssembly.tokenBudget,
            inclusionCount: input.contextAssembly.inclusions.length,
            exclusionCount: input.contextAssembly.exclusions.length,
            selectedContext: { inclusions: input.contextAssembly.inclusions },
            excludedContext: { exclusions: input.contextAssembly.exclusions },
            metadata: input.contextAssembly.metadata,
            createdAt: new Date(input.contextAssembly.createdAt)
          }).run();
          connection.db.insert(executionRuns).values({
            id: executionRun.id,
            harnessPlanId: input.harnessPlan.id,
            adapter: executionRun.adapter,
            status: executionRun.status,
            lifecycleRevision: executionRun.lifecycleRevision,
            metadata: executionRun.metadata,
            createdAt: now,
            updatedAt: now
          }).run();
          connection.db.insert(decisionPacketIssuances).values({
            executionRunId,
            packetChecksum: issuance.packetIdentity.checksum,
            packetGeneratedAt: now,
            sourceRunLifecycleRevision: issuance.packetIdentity.sourceRunLifecycleRevision,
            readback: issuance,
            createdAt: now
          }).run();
          return executionRun;
        })();

        return Promise.resolve({
          identity: {
            operatorIntentId: input.operatorIntent.id,
            taskContractId: input.taskContract.id,
            harnessPlanId: input.harnessPlan.id,
            contextAssemblyId: input.contextAssembly.id,
            executionRunId: run.id
          },
          issuance
        });
      },
      close() {
        connection.close();
      }
    };
  } catch (error) {
    connection.close();
    throw error;
  }
};
