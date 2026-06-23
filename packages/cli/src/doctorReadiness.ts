import type {
  DoctorCheck
} from "./runDoctorCommand.js";

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
