import {
  createHash
} from "node:crypto";
import postgres from "postgres";
import type {
  Sql
} from "postgres";
import type {
  ExecutionBrief
} from "@krn/codex-adapter";
import {
  buildDecisionPacketContractReadback
} from "@krn/core";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import type {
  EvidenceContract
} from "@krn/harness";
import type {
  HarnessRunAggregate
} from "@krn/core/repositories";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "@krn/db/adapters";
import type {
  HarnessRunRepository
} from "@krn/core/repositories";
import type {
  DatabaseRuntimeInput
} from "./database-runtime.js";
import {
  buildDecisionPacketReadModel
} from "./decision-packet-read-model-builders.js";

export interface CountRow {
  count: number;
}

export interface SmokeDatabaseRuntime {
  client: Sql;
  db: ReturnType<typeof createKrnDatabase>;
}

export interface SmokeRepositories {
  projectRepository: DrizzleProjectRepository;
  harnessRunRepository: DrizzleHarnessRunRepository;
  sourceRepository: DrizzleSourceRepository;
  memoryRepository: DrizzleMemoryRepository;
  retrievalRepository: DrizzleRetrievalRepository;
}

export interface ReadOnlyHarnessRuntime {
  harnessRunRepository: Pick<HarnessRunRepository, "getHarnessRunByExecutionRunId">;
  close(): Promise<void>;
}

type CreateReadOnlyHarnessRuntime = (
  input: DatabaseRuntimeInput
) => Promise<ReadOnlyHarnessRuntime>;

interface ResolveReadOnlyHarnessRuntimeInput {
  databaseUrl: string;
  workspaceSlug: string;
  projectSlug: string;
  now(): string;
  createId(prefix: string): string;
  createDatabaseRuntime?: CreateReadOnlyHarnessRuntime | undefined;
}

interface BrainStoreReadiness {
  migrationsVerified: boolean;
  pgvectorAvailable: boolean;
}

interface RenderCodexBriefFromAggregateInput {
  aggregate: HarnessRunAggregate;
  missingContextMessage: string;
}

export interface RenderedCodexBrief {
  brief: ExecutionBrief;
  renderedBrief: string;
  evidenceContract: EvidenceContract | undefined;
}

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const normalizeSmokeSlugPart = (value: string): string => {
  const smokeSlugPart = value
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((part) => part.length > 0)
    .join("-")
    .slice(0, 48)
    .replace(/-$/u, "");

  return smokeSlugPart.length === 0 ? "local" : smokeSlugPart;
};

const countRows = async (rowsPromise: Promise<CountRow[]>): Promise<number> => {
  const rows = await rowsPromise;

  return rows[0]?.count ?? 0;
};

export const sumCountRows = async (rowsPromises: readonly Promise<CountRow[]>[]): Promise<number> => {
  let total = 0;

  for (const rowsPromise of rowsPromises) {
    total += await countRows(rowsPromise);
  }

  return total;
};

const createSmokeSqlClient = (databaseUrl: string): Sql =>
  postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

export const createSmokeDatabaseRuntime = (databaseUrl: string): SmokeDatabaseRuntime => {
  const client = createSmokeSqlClient(databaseUrl);

  return {
    client,
    db: createKrnDatabase(client)
  };
};

export const createSmokeRepositories = (
  db: SmokeDatabaseRuntime["db"]
): SmokeRepositories => ({
  projectRepository: new DrizzleProjectRepository(db),
  harnessRunRepository: new DrizzleHarnessRunRepository(db),
  sourceRepository: new DrizzleSourceRepository(db),
  memoryRepository: new DrizzleMemoryRepository(db),
  retrievalRepository: new DrizzleRetrievalRepository(db)
});

export const createSmokeIdFactory = (marker: string): ((prefix: string) => string) => {
  let idCounter = 0;

  return (prefix) => {
    idCounter += 1;
    return `${prefix}-${marker}-${idCounter}`;
  };
};

export const yesNo = (value: boolean): "yes" | "no" => value ? "yes" : "no";

export const matchedWhen = (value: boolean): "matched" | "mismatch" =>
  value ? "matched" : "mismatch";

export const matchedOrMismatch = (
  actual: string,
  expected: string
): "matched" | "mismatch" => actual === expected ? "matched" : "mismatch";

export const completedOrNot = (value: boolean): "completed" | "not completed" =>
  value ? "completed" : "not completed";

export const passedOrFailed = (value: boolean): "passed" | "failed" =>
  value ? "passed" : "failed";

export const assertBrainStoreReady = (
  readiness: BrainStoreReadiness,
  message: string
): void => {
  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error(message);
  }
};

export const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" ? value : undefined;
};

export const countCodexInvocationEvents = (aggregate: HarnessRunAggregate): number =>
  aggregate.runEvents.filter((event) =>
    event.type === "codex.invoked" ||
    event.type === "codex.executed" ||
    event.type === "codex.execution.started"
  ).length;

export const countRunEventsBySmokeId = (
  client: Sql,
  marker: string
): Promise<CountRow[]> =>
  client<CountRow[]>`select count(*)::int as count from run_events where payload->>'smokeId' = ${marker}`;

export const countSourceArtifactsBySmokeId = (
  client: Sql,
  marker: string
): Promise<CountRow[]> =>
  client<CountRow[]>`select count(*)::int as count from source_artifacts where metadata->>'smokeId' = ${marker}`;

export const countSourceClaimsBySmokeId = (
  client: Sql,
  marker: string
): Promise<CountRow[]> =>
  client<CountRow[]>`select count(*)::int as count from source_claims where metadata->>'smokeId' = ${marker}`;

export const countMemoryRecordsBySmokeId = (
  client: Sql,
  marker: string
): Promise<CountRow[]> =>
  client<CountRow[]>`select count(*)::int as count from memory_records where metadata->>'smokeId' = ${marker}`;

export const countRetrievalRunById = (
  client: Sql,
  retrievalRunId: string
): Promise<CountRow[]> =>
  client<CountRow[]>`select count(*)::int as count from retrieval_runs where id = ${retrievalRunId}`;

const createReadOnlyHarnessRuntime = async (
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  const client = postgres(databaseUrl, { max: 1 });
  const harnessRunRepository = new DrizzleHarnessRunRepository(createKrnDatabase(client));
  const close = async (): Promise<void> => {
    await client.end();
  };

  return {
    harnessRunRepository,
    close
  };
};

export const resolveReadOnlyHarnessRuntime = async (
  input: ResolveReadOnlyHarnessRuntimeInput
): Promise<ReadOnlyHarnessRuntime> => {
  if (input.createDatabaseRuntime === undefined) {
    return createReadOnlyHarnessRuntime(input.databaseUrl);
  }

  return input.createDatabaseRuntime({
    databaseUrl: input.databaseUrl,
    workspaceSlug: input.workspaceSlug,
    projectSlug: input.projectSlug,
    now: input.now,
    createId: input.createId
  });
};

export const renderCodexBriefFromAggregate = (
  input: RenderCodexBriefFromAggregateInput
): RenderedCodexBrief => {
  const contextAssembly = input.aggregate.contextAssembly;

  if (contextAssembly === undefined) {
    throw new Error(input.missingContextMessage);
  }

  const packet = buildDecisionPacketContractReadback({
    readModel: buildDecisionPacketReadModel(input.aggregate),
    generatedAt: input.aggregate.executionRun.updatedAt,
    sha256Hex
  }).packet;
  const brief = createExecutionBrief({
    packet
  });
  const evidenceContract = packet.evidenceContract === undefined
    ? undefined
    : {
        commands: packet.evidenceContract.commands.map((command) => ({
          command: command.command,
          required: command.required
        })),
        diffRisk: packet.evidenceContract.diffRisk,
        reviewBurden: packet.evidenceContract.reviewBurden,
        rollbackPath: packet.evidenceContract.rollbackPath,
        metadata: {}
      } satisfies EvidenceContract;

  return {
    brief,
    renderedBrief: renderExecutionBriefText(brief),
    evidenceContract
  };
};
