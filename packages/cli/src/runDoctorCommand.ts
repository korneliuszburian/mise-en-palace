import path from "node:path";
import {
  inspectHarnessPersistenceReadiness,
  inspectActivationReadiness,
  inspectMemoryGovernanceReadiness,
  inspectMigrationReadiness,
  inspectRetrievalSubstrateReadiness,
  inspectSourceGraphReadiness
} from "@krn/db";
import {
  findRepoRoot,
  pathExists,
  readJsonObject
} from "./cliFileBoundary.js";
import {
  checkRepoFiles
} from "./doctorRepoChecks.js";
import {
  checkCodexAdapter,
  checkTargetRepoReadiness,
  checkWorkerJobs
} from "./doctorStaticChecks.js";
import {
  readOptionalText,
  readScriptStatus,
  readTreeText
} from "./doctorCheckHelpers.js";

export interface DoctorRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
}

export interface DoctorResult {
  exitCode: number;
  stdout: string;
}

export interface DoctorCheck {
  label: string;
  status: string;
}

const checkPostgres = async (
  databaseUrl: string | undefined,
  migrationsFolder: string
): Promise<DoctorCheck[]> => {
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    return [
      {
        label: "Postgres config",
        status: "not configured (KRN_DATABASE_URL missing)"
      },
      {
        label: "pgvector",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "migrations",
        status: "skipped (Postgres not configured)"
      }
    ];
  }

  try {
    const report = await inspectMigrationReadiness({
      databaseUrl,
      migrationsFolder
    });
    const migrationStatus = !report.migrationTablePresent
      ? "migration table missing"
      : report.migrationsVerified
        ? `verified (${report.appliedMigrationCount}/${report.expectedMigrationCount} applied)`
        : `unverified (${report.appliedMigrationCount}/${report.expectedMigrationCount} applied)`;

    return [
      {
        label: "Postgres config",
        status: "configured and reachable"
      },
      {
        label: "pgvector",
        status: report.pgvectorAvailable ? "available" : "missing"
      },
      {
        label: "migrations",
        status: migrationStatus
      }
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown database error";

    return [
      {
        label: "Postgres config",
        status: `configured but unreachable (${message})`
      },
      {
        label: "pgvector",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "migrations",
        status: "skipped (Postgres unreachable)"
      }
    ];
  }
};

const findCheckStatus = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): string | undefined => checks.find((check) => check.label === label)?.status;

export const deriveBrainStoreReadiness = (postgresChecks: readonly DoctorCheck[]): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Brain store readiness",
      status: "preview only (set KRN_DATABASE_URL and run migrations for persisted harness state)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Brain store readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus === "available" && migrationStatus?.startsWith("verified") === true) {
    return {
      label: "Brain store readiness",
      status: "ready"
    };
  }

  if (pgvectorStatus === "missing" && migrationStatus?.startsWith("verified") === true) {
    return {
      label: "Brain store readiness",
      status: "blocked (pgvector missing)"
    };
  }

  if (pgvectorStatus === "available" && migrationStatus === "migration table missing") {
    return {
      label: "Brain store readiness",
      status: "blocked (migrations not applied)"
    };
  }

  if (pgvectorStatus === "available" && migrationStatus?.startsWith("unverified") === true) {
    return {
      label: "Brain store readiness",
      status: "blocked (migrations unverified)"
    };
  }

  return {
    label: "Brain store readiness",
    status: "incomplete (pgvector and migrations must be ready)"
  };
};

const hasStatusPrefix = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"],
  prefix: string
): boolean => findCheckStatus(checks, label)?.startsWith(prefix) === true;

export const deriveHarnessPersistenceReadiness = (
  postgresChecks: readonly DoctorCheck[],
  harnessChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const schemaStatus = findCheckStatus(harnessChecks, "Harness persistence schema");
  const projectSmokeAvailable = hasStatusPrefix(harnessChecks, "Project repository smoke", "available");
  const harnessPlanSmokeAvailable = hasStatusPrefix(harnessChecks, "Harness plan smoke", "available");
  const evidenceSmokeAvailable = hasStatusPrefix(harnessChecks, "Evidence persistence smoke", "available");

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Harness persistence readiness",
      status: "preview only (set KRN_DATABASE_URL and run harness smoke commands for persistence proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Harness persistence readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Harness persistence readiness",
      status: "blocked (brain store not ready)"
    };
  }

  if (schemaStatus?.startsWith("ready") !== true) {
    return {
      label: "Harness persistence readiness",
      status: "blocked (harness persistence schema missing)"
    };
  }

  if (!projectSmokeAvailable || !harnessPlanSmokeAvailable || !evidenceSmokeAvailable) {
    return {
      label: "Harness persistence readiness",
      status: "incomplete (smoke commands missing)"
    };
  }

  return {
    label: "Harness persistence readiness",
    status: "ready (schema present; smoke commands available)"
  };
};

export const deriveSourceGraphReadiness = (
  postgresChecks: readonly DoctorCheck[],
  sourceGraphChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const schemaStatus = findCheckStatus(sourceGraphChecks, "Source graph schema");
  const sourceRepositoryStatus = findCheckStatus(sourceGraphChecks, "SourceRepository read path");
  const sourceSmokeAvailable = hasStatusPrefix(
    sourceGraphChecks,
    "Source graph smoke",
    "available"
  );
  const runtimeProofStatus = findCheckStatus(sourceGraphChecks, "Source graph runtime proof");
  const sourceCrawlerStatus = findCheckStatus(sourceGraphChecks, "Source crawler/research layer");
  const graphDbStatus = findCheckStatus(sourceGraphChecks, "Separate graph DB");

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Source graph readiness",
      status: "preview only (set KRN_DATABASE_URL and run source graph smoke for persistence proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Source graph readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Source graph readiness",
      status: "blocked (brain store not ready)"
    };
  }

  if (sourceCrawlerStatus === "present" || graphDbStatus === "present") {
    return {
      label: "Source graph readiness",
      status: "blocked (forbidden source infrastructure present)"
    };
  }

  if (schemaStatus?.startsWith("ready") !== true) {
    return {
      label: "Source graph readiness",
      status: "blocked (source graph schema missing)"
    };
  }

  if (sourceRepositoryStatus !== "reachable") {
    return {
      label: "Source graph readiness",
      status: "blocked (SourceRepository read path unavailable)"
    };
  }

  if (!sourceSmokeAvailable) {
    return {
      label: "Source graph readiness",
      status: "incomplete (source graph smoke command missing)"
    };
  }

  if (runtimeProofStatus?.startsWith("ready") !== true) {
    return {
      label: "Source graph readiness",
      status: "runtime unverified (run pnpm db:smoke:source-graph)"
    };
  }

  return {
    label: "Source graph readiness",
    status: "ready (schema present; repository reachable; runtime proof present)"
  };
};

export const deriveMemoryGovernanceReadiness = (
  postgresChecks: readonly DoctorCheck[],
  memoryGovernanceChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const schemaStatus = findCheckStatus(memoryGovernanceChecks, "Memory governance schema");
  const memoryRepositoryStatus = findCheckStatus(
    memoryGovernanceChecks,
    "MemoryRepository read path"
  );
  const memorySmokeAvailable = hasStatusPrefix(
    memoryGovernanceChecks,
    "Memory governance smoke",
    "available"
  );
  const runtimeProofStatus = findCheckStatus(
    memoryGovernanceChecks,
    "Memory governance runtime proof"
  );
  const runtimeMarkdownMemoryStatus = findCheckStatus(
    memoryGovernanceChecks,
    "Runtime markdown memory"
  );
  const automaticMemoryMutationStatus = findCheckStatus(
    memoryGovernanceChecks,
    "Automatic memory mutation"
  );

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Memory governance readiness",
      status:
        "preview only (set KRN_DATABASE_URL and run memory governance smoke for persistence proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Memory governance readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Memory governance readiness",
      status: "blocked (brain store not ready)"
    };
  }

  if (
    runtimeMarkdownMemoryStatus === "present" ||
    automaticMemoryMutationStatus === "present"
  ) {
    return {
      label: "Memory governance readiness",
      status: "blocked (forbidden memory runtime present)"
    };
  }

  if (schemaStatus?.startsWith("ready") !== true) {
    return {
      label: "Memory governance readiness",
      status: "blocked (memory governance schema missing)"
    };
  }

  if (memoryRepositoryStatus !== "reachable") {
    return {
      label: "Memory governance readiness",
      status: "blocked (MemoryRepository read path unavailable)"
    };
  }

  if (!memorySmokeAvailable) {
    return {
      label: "Memory governance readiness",
      status: "incomplete (memory governance smoke command missing)"
    };
  }

  if (runtimeProofStatus?.startsWith("ready") !== true) {
    return {
      label: "Memory governance readiness",
      status: "runtime unverified (run pnpm db:smoke:memory-governance)"
    };
  }

  return {
    label: "Memory governance readiness",
    status: "ready (schema present; repository reachable; runtime proof present)"
  };
};

export const deriveRetrievalSubstrateReadiness = (
  postgresChecks: readonly DoctorCheck[],
  retrievalChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const schemaStatus = findCheckStatus(retrievalChecks, "Retrieval substrate schema");
  const repositoryStatus = findCheckStatus(
    retrievalChecks,
    "RetrievalRepository read path"
  );
  const smokeAvailable = hasStatusPrefix(
    retrievalChecks,
    "Retrieval substrate smoke",
    "available"
  );
  const runtimeProofStatus = findCheckStatus(
    retrievalChecks,
    "Retrieval substrate runtime proof"
  );
  const separateDbStatus = findCheckStatus(retrievalChecks, "Separate vector/search DB");
  const ragDumpStatus = findCheckStatus(retrievalChecks, "Naive RAG dump command");

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Retrieval substrate readiness",
      status:
        "preview only (set KRN_DATABASE_URL and run retrieval substrate smoke for persistence proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Retrieval substrate readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Retrieval substrate readiness",
      status: "blocked (brain store not ready)"
    };
  }

  if (separateDbStatus === "present" || ragDumpStatus === "present") {
    return {
      label: "Retrieval substrate readiness",
      status: "blocked (forbidden retrieval infrastructure present)"
    };
  }

  if (schemaStatus?.startsWith("ready") !== true) {
    return {
      label: "Retrieval substrate readiness",
      status: "blocked (retrieval substrate schema missing)"
    };
  }

  if (repositoryStatus !== "reachable") {
    return {
      label: "Retrieval substrate readiness",
      status: "blocked (RetrievalRepository read path unavailable)"
    };
  }

  if (!smokeAvailable) {
    return {
      label: "Retrieval substrate readiness",
      status: "incomplete (retrieval substrate smoke command missing)"
    };
  }

  if (runtimeProofStatus?.startsWith("ready") !== true) {
    return {
      label: "Retrieval substrate readiness",
      status: "runtime unverified (run pnpm db:smoke:retrieval-substrate)"
    };
  }

  return {
    label: "Retrieval substrate readiness",
    status: "ready (schema present; repository reachable; runtime proof present)"
  };
};

export const deriveActivationReadiness = (
  postgresChecks: readonly DoctorCheck[],
  sourceGraphReadiness: DoctorCheck,
  memoryGovernanceReadiness: DoctorCheck,
  retrievalSubstrateReadiness: DoctorCheck,
  activationChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const domainStatus = findCheckStatus(activationChecks, "Activation domain contracts");
  const engineStatus = findCheckStatus(activationChecks, "Activation engine surface");
  const smokeAvailable = hasStatusPrefix(
    activationChecks,
    "Activation smoke",
    "available"
  );
  const runtimeProofStatus = findCheckStatus(
    activationChecks,
    "Activation smoke runtime proof"
  );
  const broadDumpStatus = findCheckStatus(activationChecks, "Broad context dump");
  const requiredSkillsStatus = findCheckStatus(activationChecks, "Core requiredSkills field");

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Activation readiness",
      status: "preview only (set KRN_DATABASE_URL and run activation smoke for runtime proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Activation readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Activation readiness",
      status: "blocked (brain store not ready)"
    };
  }

  if (broadDumpStatus === "present" || requiredSkillsStatus === "present") {
    return {
      label: "Activation readiness",
      status: "blocked (forbidden activation surface present)"
    };
  }

  if (domainStatus !== "present") {
    return {
      label: "Activation readiness",
      status: "incomplete (activation domain contracts missing)"
    };
  }

  if (engineStatus !== "present") {
    return {
      label: "Activation readiness",
      status: "incomplete (activation engine surface missing)"
    };
  }

  if (!smokeAvailable) {
    return {
      label: "Activation readiness",
      status: "incomplete (activation smoke command missing)"
    };
  }

  if (
    sourceGraphReadiness.status.startsWith("blocked") ||
    memoryGovernanceReadiness.status.startsWith("blocked") ||
    retrievalSubstrateReadiness.status.startsWith("blocked")
  ) {
    return {
      label: "Activation readiness",
      status: "blocked (activation dependency blocked)"
    };
  }

  if (
    sourceGraphReadiness.status.startsWith("ready") !== true ||
    memoryGovernanceReadiness.status.startsWith("ready") !== true ||
    retrievalSubstrateReadiness.status.startsWith("ready") !== true
  ) {
    return {
      label: "Activation readiness",
      status: "runtime unverified (source, memory, or retrieval readiness incomplete)"
    };
  }

  if (runtimeProofStatus?.startsWith("ready") !== true) {
    return {
      label: "Activation readiness",
      status: "runtime unverified (run pnpm db:smoke:activation)"
    };
  }

  return {
    label: "Activation readiness",
    status: "ready (domain contracts, dependencies, and runtime proof present)"
  };
};

export const deriveCodexAdapterReadiness = (
  postgresChecks: readonly DoctorCheck[],
  codexAdapterChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const rendererStatus = findCheckStatus(codexAdapterChecks, "Codex adapter renderer");
  const smokeAvailable = hasStatusPrefix(
    codexAdapterChecks,
    "Execution brief smoke",
    "available"
  );
  const hookProjectionStatus = findCheckStatus(
    codexAdapterChecks,
    "Hook expectation projection"
  );
  const codexRunnerStatus = findCheckStatus(codexAdapterChecks, "Codex execution runner");
  const mcpServerStatus = findCheckStatus(codexAdapterChecks, "KRN MCP server");

  if (codexRunnerStatus === "present" || mcpServerStatus === "present") {
    return {
      label: "Codex adapter readiness",
      status: "blocked (forbidden Codex execution or MCP server present)"
    };
  }

  if (rendererStatus !== "present") {
    return {
      label: "Codex adapter readiness",
      status: "incomplete (Codex adapter renderer missing)"
    };
  }

  if (hookProjectionStatus !== "present") {
    return {
      label: "Codex adapter readiness",
      status: "incomplete (hook expectation projection missing)"
    };
  }

  if (!smokeAvailable) {
    return {
      label: "Codex adapter readiness",
      status: "incomplete (Codex adapter smoke command missing)"
    };
  }

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Codex adapter readiness",
      status: "preview only (set KRN_DATABASE_URL and run codex adapter smoke for proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Codex adapter readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Codex adapter readiness",
      status: "blocked (brain store not ready)"
    };
  }

  return {
    label: "Codex adapter readiness",
    status: "ready (renderer, hook projection, smoke command, and forbidden surfaces checked)"
  };
};

export const deriveWorkerJobReadiness = (
  postgresChecks: readonly DoctorCheck[],
  workerJobChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const schemaStatus = findCheckStatus(workerJobChecks, "Worker job schema");
  const repositoryStatus = findCheckStatus(workerJobChecks, "Worker job repository");
  const smokeAvailable = hasStatusPrefix(workerJobChecks, "Worker job smoke", "available");
  const redisKafkaStatus = findCheckStatus(workerJobChecks, "Redis/Kafka queue");
  const daemonStatus = findCheckStatus(workerJobChecks, "Broad worker daemon");

  if (redisKafkaStatus === "present" || daemonStatus === "present") {
    return {
      label: "Worker job readiness",
      status: "blocked (forbidden worker runtime present)"
    };
  }

  if (schemaStatus !== "present") {
    return {
      label: "Worker job readiness",
      status: "incomplete (worker job schema missing)"
    };
  }

  if (repositoryStatus !== "present") {
    return {
      label: "Worker job readiness",
      status: "incomplete (worker job repository missing)"
    };
  }

  if (!smokeAvailable) {
    return {
      label: "Worker job readiness",
      status: "incomplete (worker job smoke command missing)"
    };
  }

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Worker job readiness",
      status: "preview only (set KRN_DATABASE_URL and run worker job smoke for proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Worker job readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Worker job readiness",
      status: "blocked (brain store not ready)"
    };
  }

  return {
    label: "Worker job readiness",
    status: "ready (schema, repository, smoke command, and forbidden runtime checks present)"
  };
};

export const deriveTargetRepoReadiness = (
  postgresChecks: readonly DoctorCheck[],
  targetRepoChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const initCommandAvailable = hasStatusPrefix(
    targetRepoChecks,
    "Target repo init command",
    "available"
  );
  const fixtureAvailable = hasStatusPrefix(
    targetRepoChecks,
    "Target repo fixture smoke",
    "available"
  );
  const projectSchemaStatus = findCheckStatus(targetRepoChecks, "Project registration schema");
  const initConnectSmokeStatus = findCheckStatus(targetRepoChecks, "Init-connect smoke");
  const targetHarnessSmokeStatus = findCheckStatus(targetRepoChecks, "Target repo harness smoke");
  const leakageProofStatus = findCheckStatus(targetRepoChecks, "Cross-project leakage proof");
  const forbiddenStatus = findCheckStatus(targetRepoChecks, "Target repo forbidden surfaces");

  if (forbiddenStatus === "present") {
    return {
      label: "Target repo readiness",
      status: "blocked (forbidden target repo surface present)"
    };
  }

  if (!initCommandAvailable) {
    return {
      label: "Target repo readiness",
      status: "incomplete (init-connect command missing)"
    };
  }

  if (!fixtureAvailable) {
    return {
      label: "Target repo readiness",
      status: "incomplete (target repo fixture missing)"
    };
  }

  if (projectSchemaStatus?.startsWith("present") !== true) {
    return {
      label: "Target repo readiness",
      status: "blocked (project registration schema missing)"
    };
  }

  if (leakageProofStatus !== "known") {
    return {
      label: "Target repo readiness",
      status: "runtime unverified (cross-project leakage proof missing)"
    };
  }

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Target repo readiness",
      status:
        "preview only (set KRN_DATABASE_URL and run init-connect and target repo harness smokes for proof)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Target repo readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus !== "available" || migrationStatus?.startsWith("verified") !== true) {
    return {
      label: "Target repo readiness",
      status: "blocked (brain store not ready)"
    };
  }

  if (initConnectSmokeStatus?.startsWith("proven") !== true) {
    return {
      label: "Target repo readiness",
      status: "unverified (init-connect smoke missing)"
    };
  }

  if (targetHarnessSmokeStatus?.startsWith("proven") !== true) {
    return {
      label: "Target repo readiness",
      status: "partially ready (init-connect smoke proven; target repo harness smoke missing)"
    };
  }

  return {
    label: "Target repo readiness",
    status: "ready (init-connect smoke proven; target repo harness smoke proven)"
  };
};

const checkHarnessPersistence = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeChecks = [
    {
      label: "Project repository smoke",
      status: readScriptStatus(packageJson, "db:smoke", "krn db smoke")
    },
    {
      label: "Harness plan smoke",
      status: readScriptStatus(packageJson, "db:smoke:harness-plan", "krn db smoke harness-plan")
    },
    {
      label: "Evidence persistence smoke",
      status: readScriptStatus(
        packageJson,
        "db:smoke:harness-evidence",
        "krn db smoke harness-evidence"
      )
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Harness persistence schema",
        status: "skipped (Postgres not configured)"
      },
      ...smokeChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Harness persistence schema",
        status: "skipped (Postgres unreachable)"
      },
      ...smokeChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Harness persistence schema",
        status: "skipped (brain store not ready)"
      },
      ...smokeChecks
    ];
  }

  try {
    const report = await inspectHarnessPersistenceReadiness({
      databaseUrl
    });

    return [
      {
        label: "Harness persistence schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      ...smokeChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown harness schema error";

    return [
      {
        label: "Harness persistence schema",
        status: `failed (${message})`
      },
      ...smokeChecks
    ];
  }
};

const checkSourceGraph = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Source graph smoke",
    status: readScriptStatus(packageJson, "db:smoke:source-graph", "krn db smoke source-graph")
  };
  const sourceCrawlerPresent =
    await pathExists(path.join(repoRoot, "packages", "source-crawler")) ||
    await pathExists(path.join(repoRoot, "packages", "crawler")) ||
    await pathExists(path.join(repoRoot, "packages", "research"));
  const separateGraphDbPresent =
    await pathExists(path.join(repoRoot, "packages", "graph-db")) ||
    await pathExists(path.join(repoRoot, "packages", "neo4j"));
  const forbiddenChecks = [
    {
      label: "Source crawler/research layer",
      status: sourceCrawlerPresent ? "present" : "absent"
    },
    {
      label: "Separate graph DB",
      status: separateGraphDbPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Source graph schema",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "SourceRepository read path",
        status: "skipped (Postgres not configured)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Source graph schema",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "SourceRepository read path",
        status: "skipped (Postgres unreachable)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Source graph schema",
        status: "skipped (brain store not ready)"
      },
      {
        label: "SourceRepository read path",
        status: "skipped (brain store not ready)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectSourceGraphReadiness({
      databaseUrl
    });

    return [
      {
        label: "Source graph schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      {
        label: "SourceRepository read path",
        status: report.sourceRepositoryReachable
          ? "reachable"
          : `failed (${report.sourceRepositoryError ?? "unknown source repository error"})`
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: report.runtimeProofReady
          ? `ready (claims ${report.sourceClaimCount}, edges ${report.sourceDecisionEdgeCount}, rejections ${report.sourceRejectionCount})`
          : "unverified (run pnpm db:smoke:source-graph)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown source graph schema error";

    return [
      {
        label: "Source graph schema",
        status: `failed (${message})`
      },
      {
        label: "SourceRepository read path",
        status: "skipped (source graph schema check failed)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (source graph schema check failed)"
      },
      ...forbiddenChecks
    ];
  }
};

const checkMemoryGovernance = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Memory governance smoke",
    status: readScriptStatus(
      packageJson,
      "db:smoke:memory-governance",
      "krn db smoke memory-governance"
    )
  };
  const runtimeMarkdownMemoryPresent =
    await pathExists(path.join(repoRoot, "memory.md")) ||
    await pathExists(path.join(repoRoot, "MEMORY.md")) ||
    await pathExists(path.join(repoRoot, "runtime-memory.md")) ||
    await pathExists(path.join(repoRoot, "memory")) ||
    await pathExists(path.join(repoRoot, "memories")) ||
    await pathExists(path.join(repoRoot, ".memory")) ||
    await pathExists(path.join(repoRoot, "docs", "memory")) ||
    await pathExists(path.join(repoRoot, "docs", "runtime-memory"));
  const evidenceCaptureText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runEvidenceCaptureCommand.ts")
  );
  const automaticMemoryMutationPresent =
    evidenceCaptureText.includes("createMemoryCandidate(") ||
    evidenceCaptureText.includes("promoteMemoryCandidate(") ||
    evidenceCaptureText.includes("createMemoryRecord(") ||
    (await pathExists(path.join(repoRoot, "packages", "memory-crawler"))) ||
    (await pathExists(path.join(repoRoot, "packages", "memory-worker"))) ||
    (await pathExists(path.join(repoRoot, "packages", "memory-auto-promoter")));
  const forbiddenChecks = [
    {
      label: "Runtime markdown memory",
      status: runtimeMarkdownMemoryPresent ? "present" : "absent"
    },
    {
      label: "Automatic memory mutation",
      status: automaticMemoryMutationPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Memory governance schema",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (Postgres not configured)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Memory governance schema",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (Postgres unreachable)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Memory governance schema",
        status: "skipped (brain store not ready)"
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (brain store not ready)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectMemoryGovernanceReadiness({
      databaseUrl
    });

    return [
      {
        label: "Memory governance schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      {
        label: "MemoryRepository read path",
        status: report.memoryRepositoryReachable
          ? "reachable"
          : `failed (${report.memoryRepositoryError ?? "unknown memory repository error"})`
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: report.runtimeProofReady
          ? `ready (candidates ${report.memoryCandidateCount}, records ${report.memoryRecordCount}, applications ${report.memoryApplicationCount}, anti-memory ${report.antiMemoryRecordCount})`
          : "unverified (run pnpm db:smoke:memory-governance)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown memory governance schema error";

    return [
      {
        label: "Memory governance schema",
        status: `failed (${message})`
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (memory governance schema check failed)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (memory governance schema check failed)"
      },
      ...forbiddenChecks
    ];
  }
};

const checkRetrievalSubstrate = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Retrieval substrate smoke",
    status: readScriptStatus(
      packageJson,
      "db:smoke:retrieval-substrate",
      "krn db smoke retrieval-substrate"
    )
  };
  const separateVectorSearchDbPresent =
    await pathExists(path.join(repoRoot, "packages", "vector-db")) ||
    await pathExists(path.join(repoRoot, "packages", "qdrant")) ||
    await pathExists(path.join(repoRoot, "packages", "search-engine")) ||
    await pathExists(path.join(repoRoot, "packages", "opensearch")) ||
    await pathExists(path.join(repoRoot, "packages", "elastic"));
  const cliText = await readOptionalText(path.join(repoRoot, "packages", "cli", "src", "parseArgs.ts"));
  const naiveRagDumpCommandPresent =
    cliText.includes("rag-dump") ||
    cliText.includes("rag dump") ||
    cliText.includes("dump-context") ||
    cliText.includes("context-dump");
  const forbiddenChecks = [
    {
      label: "Separate vector/search DB",
      status: separateVectorSearchDbPresent ? "present" : "absent"
    },
    {
      label: "Naive RAG dump command",
      status: naiveRagDumpCommandPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Retrieval substrate schema",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (Postgres not configured)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Retrieval substrate schema",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (Postgres unreachable)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Retrieval substrate schema",
        status: "skipped (brain store not ready)"
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (brain store not ready)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectRetrievalSubstrateReadiness({
      databaseUrl
    });

    return [
      {
        label: "Retrieval substrate schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      {
        label: "RetrievalRepository read path",
        status: report.retrievalRepositoryReachable
          ? "reachable"
          : `failed (${report.retrievalRepositoryError ?? "unknown retrieval repository error"})`
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: report.runtimeProofReady
          ? `ready (search documents ${report.searchDocumentCount}, candidates ${report.retrievalCandidateCount}, activation decisions ${report.activationDecisionCount}, exclusions ${report.contextExclusionCount})`
          : "unverified (run pnpm db:smoke:retrieval-substrate)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown retrieval substrate schema error";

    return [
      {
        label: "Retrieval substrate schema",
        status: `failed (${message})`
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (retrieval substrate schema check failed)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (retrieval substrate schema check failed)"
      },
      ...forbiddenChecks
    ];
  }
};

const checkActivation = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Activation smoke",
    status: readScriptStatus(packageJson, "db:smoke:activation", "krn db smoke activation")
  };
  const coreActivationText = await readOptionalText(
    path.join(repoRoot, "packages", "core", "src", "activation.ts")
  );
  const coreIndexText = await readOptionalText(
    path.join(repoRoot, "packages", "core", "src", "index.ts")
  );
  const coreText = await readTreeText(path.join(repoRoot, "packages", "core", "src"));
  const activationEngineText = await readOptionalText(
    path.join(repoRoot, "packages", "harness", "src", "activation", "activationEngine.ts")
  );
  const activationIndexText = await readOptionalText(
    path.join(repoRoot, "packages", "harness", "src", "activation", "index.ts")
  );
  const cliText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "parseArgs.ts")
  );
  const planText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runPlanCommand.ts")
  );
  const requiredContracts = [
    "ActivationPolicy",
    "TrustAssessment",
    "ContextROI",
    "ActivationTrace",
    "ActivationInput",
    "ActivationResult",
    "ActivationAbstention",
    "ConflictSet",
    "ContextBudget"
  ];
  const activationDomainPresent =
    requiredContracts.every((contract) => coreActivationText.includes(contract)) &&
    coreIndexText.includes("./activation");
  const activationEnginePresent =
    activationEngineText.includes("retrieveActivationCandidates") &&
    activationEngineText.includes("persistActivationTrace") &&
    activationIndexText.includes("./conflictFilter") &&
    activationIndexText.includes("./contextRoi") &&
    activationIndexText.includes("./assembleContext");
  const broadContextDumpPresent =
    cliText.includes("rag-dump") ||
    cliText.includes("rag dump") ||
    cliText.includes("dump-context") ||
    cliText.includes("context-dump") ||
    planText.includes("raw onboarding") ||
    await pathExists(path.join(repoRoot, "packages", "context-dump"));
  const requiredSkillsPresent = coreText.includes("requiredSkills");
  const forbiddenChecks = [
    {
      label: "Broad context dump",
      status: broadContextDumpPresent ? "present" : "absent"
    },
    {
      label: "Core requiredSkills field",
      status: requiredSkillsPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const baseChecks = [
    {
      label: "Activation domain contracts",
      status: activationDomainPresent ? "present" : "missing"
    },
    {
      label: "Activation engine surface",
      status: activationEnginePresent ? "present" : "missing"
    },
    smokeCheck
  ];

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectActivationReadiness({
      databaseUrl
    });

    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: report.runtimeProofReady
          ? `ready (decisions ${report.activationDecisionCount}, inclusions ${report.contextItemCount}, exclusions ${report.contextExclusionCount})`
          : "unverified (run pnpm db:smoke:activation)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown activation readiness error";

    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: `failed (${message})`
      },
      ...forbiddenChecks
    ];
  }
};

export const runDoctorCommand = async (runtime: DoctorRuntime): Promise<DoctorResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const postgresChecks = await checkPostgres(runtime.env.KRN_DATABASE_URL, migrationsFolder);
  const harnessPersistenceChecks = await checkHarnessPersistence(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks
  );
  const sourceGraphChecks = await checkSourceGraph(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks
  );
  const memoryGovernanceChecks = await checkMemoryGovernance(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks
  );
  const retrievalSubstrateChecks = await checkRetrievalSubstrate(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks
  );
  const sourceGraphReadiness = deriveSourceGraphReadiness(postgresChecks, sourceGraphChecks);
  const memoryGovernanceReadiness = deriveMemoryGovernanceReadiness(
    postgresChecks,
    memoryGovernanceChecks
  );
  const retrievalSubstrateReadiness = deriveRetrievalSubstrateReadiness(
    postgresChecks,
    retrievalSubstrateChecks
  );
  const activationChecks = await checkActivation(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks
  );
  const codexAdapterChecks = await checkCodexAdapter(repoRoot);
  const workerJobChecks = await checkWorkerJobs(repoRoot);
  const targetRepoChecks = await checkTargetRepoReadiness(repoRoot);
  const checks = [
    ...postgresChecks,
    deriveBrainStoreReadiness(postgresChecks),
    ...harnessPersistenceChecks,
    deriveHarnessPersistenceReadiness(postgresChecks, harnessPersistenceChecks),
    ...sourceGraphChecks,
    sourceGraphReadiness,
    ...memoryGovernanceChecks,
    memoryGovernanceReadiness,
    ...retrievalSubstrateChecks,
    retrievalSubstrateReadiness,
    ...activationChecks,
    deriveActivationReadiness(
      postgresChecks,
      sourceGraphReadiness,
      memoryGovernanceReadiness,
      retrievalSubstrateReadiness,
      activationChecks
    ),
    ...codexAdapterChecks,
    deriveCodexAdapterReadiness(postgresChecks, codexAdapterChecks),
    ...workerJobChecks,
    deriveWorkerJobReadiness(postgresChecks, workerJobChecks),
    ...targetRepoChecks,
    deriveTargetRepoReadiness(postgresChecks, targetRepoChecks),
    ...(await checkRepoFiles(repoRoot))
  ];
  const stdout = [
    "KRN Doctor",
    `Repo root: ${repoRoot}`,
    ...checks.map((check) => `${check.label}: ${check.status}`)
  ].join("\n");
  const failed = checks.some((check) => {
    if (check.label === ".krn runtime truth" || check.label === "Forbidden surfaces") {
      return check.status === "present";
    }

    if (check.label === "TypeScript strictness" || check.label === "workspace packages") {
      return check.status === "incomplete";
    }

    if (check.label === "AGENTS.md" || check.label === "skills surface") {
      return check.status === "missing";
    }

    if (check.label === "Postgres config") {
      return check.status.startsWith("configured but unreachable");
    }

    if (check.label === "Brain store readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Harness persistence readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Source graph readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Memory governance readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Retrieval substrate readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Activation readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Codex adapter readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Worker job readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Target repo readiness") {
      return check.status.startsWith("blocked");
    }

    if (check.label === "Codex execution runner" || check.label === "KRN MCP server") {
      return check.status === "present";
    }

    if (check.label === "Redis/Kafka queue" || check.label === "Broad worker daemon") {
      return check.status === "present";
    }

    if (check.label === "Runtime markdown memory" || check.label === "Automatic memory mutation") {
      return check.status === "present";
    }

    if (check.label === "Separate vector/search DB" || check.label === "Naive RAG dump command") {
      return check.status === "present";
    }

    if (check.label === "Broad context dump" || check.label === "Core requiredSkills field") {
      return check.status === "present";
    }

    if (check.label === "Target repo forbidden surfaces") {
      return check.status === "present";
    }

    return false;
  });

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${stdout}\n`
  };
};
