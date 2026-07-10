import type {
  DoctorCheck,
  DoctorOutcome
} from "./run-doctor-command.js";
import {
  isCurrentDoctorProof
} from "./doctor-proof.js";

const findCheck = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): DoctorCheck | undefined => checks.find((check) => check.label === label);

const findCheckStatus = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): string | undefined => findCheck(checks, label)?.status;

const findCheckOutcome = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): DoctorOutcome | undefined => findCheck(checks, label)?.outcome;

const hasCurrentRuntimeProof = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"],
  expectation: Parameters<typeof isCurrentDoctorProof>[1] = {}
): boolean => isCurrentDoctorProof(findCheck(checks, label), expectation);

export const deriveBrainStoreReadiness = (postgresChecks: readonly DoctorCheck[]): DoctorCheck => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      label: "Memory store readiness",
      status: "preview only (set KRN_DATABASE_URL and run migrations for persisted harness state)"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      label: "Memory store readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (pgvectorStatus === "available" && migrationStatus?.startsWith("verified") === true) {
    return {
      label: "Memory store readiness",
      status: "ready"
    };
  }

  if (pgvectorStatus === "missing" && migrationStatus?.startsWith("verified") === true) {
    return {
      label: "Memory store readiness",
      status: "blocked (pgvector missing)"
    };
  }

  if (pgvectorStatus === "available" && migrationStatus === "migration table missing") {
    return {
      label: "Memory store readiness",
      status: "blocked (migrations not applied)"
    };
  }

  if (pgvectorStatus === "available" && migrationStatus?.startsWith("unverified") === true) {
    return {
      label: "Memory store readiness",
      status: "blocked (migrations unverified)"
    };
  }

  return {
    label: "Memory store readiness",
    status: "incomplete (pgvector and migrations must be ready)"
  };
};

const hasStatusPrefix = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"],
  prefix: string
): boolean => findCheckStatus(checks, label)?.startsWith(prefix) === true;

const hasCheckOutcome = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"],
  outcome: DoctorOutcome,
  legacyMatch: (status: string | undefined) => boolean
): boolean => {
  const checkOutcome = findCheckOutcome(checks, label);

  return checkOutcome === undefined
    ? legacyMatch(findCheckStatus(checks, label))
    : checkOutcome === outcome;
};

interface BrainStoreOutcomeFlags {
  postgresNotConfigured: boolean;
  postgresUnreachable: boolean;
  pgvectorAvailable: boolean;
  migrationsVerified: boolean;
}

const readBrainStoreOutcomeFlags = (
  postgresChecks: readonly DoctorCheck[]
): BrainStoreOutcomeFlags => ({
  postgresNotConfigured: hasCheckOutcome(
    postgresChecks,
    "Postgres config",
    "not_configured",
    (status) => status?.startsWith("not configured") === true
  ),
  postgresUnreachable: hasCheckOutcome(
    postgresChecks,
    "Postgres config",
    "configured_unreachable",
    (status) => status?.startsWith("configured but unreachable") === true
  ),
  pgvectorAvailable: hasCheckOutcome(
    postgresChecks,
    "pgvector",
    "pgvector_available",
    (status) => status === "available"
  ),
  migrationsVerified: hasCheckOutcome(
    postgresChecks,
    "migrations",
    "migrations_verified",
    (status) => status?.startsWith("verified") === true
  )
});

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
      status: "blocked (memory store not ready)"
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
  const runtimeProofPresent = hasCurrentRuntimeProof(
    sourceGraphChecks,
    "Source graph runtime proof"
  );
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
      status: "blocked (memory store not ready)"
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

  if (!runtimeProofPresent) {
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
  const runtimeProofPresent = hasCurrentRuntimeProof(
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
      status: "blocked (memory store not ready)"
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

  if (!runtimeProofPresent) {
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
  const runtimeProofPresent = hasCurrentRuntimeProof(
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
      status: "blocked (memory store not ready)"
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

  if (!runtimeProofPresent) {
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
  const runtimeProofPresent = hasCurrentRuntimeProof(
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
      status: "blocked (memory store not ready)"
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

  if (!runtimeProofPresent) {
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
  const brainStore = readBrainStoreOutcomeFlags(postgresChecks);
  const rendererPresent = hasCheckOutcome(
    codexAdapterChecks,
    "Codex adapter renderer",
    "present",
    (status) => status === "present"
  );
  const smokeAvailable = hasCheckOutcome(
    codexAdapterChecks,
    "Execution brief smoke",
    "available",
    (status) => status?.startsWith("available") === true
  );
  const codexRunnerPresent = hasCheckOutcome(
    codexAdapterChecks,
    "Codex execution runner",
    "present",
    (status) => status === "present"
  );
  const mcpProductServerPresent = hasCheckOutcome(
    codexAdapterChecks,
    "KRN MCP product server",
    "present",
    (status) => status === "present"
  );
  const runtimeProofReady = hasCheckOutcome(
    codexAdapterChecks,
    "Codex adapter runtime proof",
    "proven",
    (status) => status?.startsWith("ready") === true
  );

  if (codexRunnerPresent || mcpProductServerPresent) {
    return {
      label: "Codex adapter readiness",
      status: "blocked (forbidden Codex execution or MCP product server present)"
    };
  }

  if (!rendererPresent) {
    return {
      label: "Codex adapter readiness",
      status: "incomplete (Codex adapter renderer missing)"
    };
  }

  if (!smokeAvailable) {
    return {
      label: "Codex adapter readiness",
      status: "incomplete (Codex adapter smoke command missing)"
    };
  }

  if (brainStore.postgresNotConfigured) {
    return {
      label: "Codex adapter readiness",
      status: "preview only (set KRN_DATABASE_URL and run codex adapter smoke for proof)"
    };
  }

  if (brainStore.postgresUnreachable) {
    return {
      label: "Codex adapter readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (!brainStore.pgvectorAvailable || !brainStore.migrationsVerified) {
    return {
      label: "Codex adapter readiness",
      status: "blocked (memory store not ready)"
    };
  }

  if (!runtimeProofReady) {
    return {
      label: "Codex adapter readiness",
      status: "runtime unverified (run pnpm db:smoke:codex-adapter)"
    };
  }

  return {
    label: "Codex adapter readiness",
    status: "ready (renderer, runtime proof, and forbidden surfaces checked)"
  };
};

export const deriveMaintenanceQueueReadiness = (
  postgresChecks: readonly DoctorCheck[],
  maintenanceQueueChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const brainStore = readBrainStoreOutcomeFlags(postgresChecks);
  const schemaPresent = hasCheckOutcome(
    maintenanceQueueChecks,
    "Maintenance queue schema",
    "present",
    (status) => status === "present"
  );
  const repositoryPresent = hasCheckOutcome(
    maintenanceQueueChecks,
    "Maintenance queue repository",
    "present",
    (status) => status === "present"
  );
  const smokeAvailable = hasCheckOutcome(
    maintenanceQueueChecks,
    "Maintenance queue smoke",
    "available",
    (status) => status?.startsWith("available") === true
  );
  const recordExecutorPresent = hasCheckOutcome(
    maintenanceQueueChecks,
    "Maintenance record executor",
    "present",
    (status) => status?.startsWith("present") === true
  );
  const redisKafkaPresent = hasCheckOutcome(
    maintenanceQueueChecks,
    "Redis/Kafka queue",
    "present",
    (status) => status === "present"
  );
  const daemonPresent = hasCheckOutcome(
    maintenanceQueueChecks,
    "Autonomous maintenance daemon",
    "present",
    (status) => status === "present"
  );

  if (redisKafkaPresent || daemonPresent) {
    return {
      label: "Maintenance queue readiness",
      status: "blocked (forbidden autonomous maintenance runtime present)"
    };
  }

  if (!schemaPresent) {
    return {
      label: "Maintenance queue readiness",
      status: "incomplete (maintenance queue schema missing)"
    };
  }

  if (!repositoryPresent) {
    return {
      label: "Maintenance queue readiness",
      status: "incomplete (maintenance queue repository missing)"
    };
  }

  if (!smokeAvailable) {
    return {
      label: "Maintenance queue readiness",
      status: "incomplete (maintenance queue smoke command missing)"
    };
  }

  if (!recordExecutorPresent) {
    return {
      label: "Maintenance queue readiness",
      status: "incomplete (explicit maintenance record executor missing)"
    };
  }

  if (brainStore.postgresNotConfigured) {
    return {
      label: "Maintenance queue readiness",
      status: "preview only (set KRN_DATABASE_URL and run maintenance queue smoke for proof)"
    };
  }

  if (brainStore.postgresUnreachable) {
    return {
      label: "Maintenance queue readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (!brainStore.pgvectorAvailable || !brainStore.migrationsVerified) {
    return {
      label: "Maintenance queue readiness",
      status: "blocked (memory store not ready)"
    };
  }

  return {
    label: "Maintenance queue readiness",
    status:
      "ready (schema, repository, explicit record executor, smoke command, and forbidden daemon checks present)"
  };
};

export const deriveTargetRepoReadiness = (
  postgresChecks: readonly DoctorCheck[],
  targetRepoChecks: readonly DoctorCheck[]
): DoctorCheck => {
  const brainStore = readBrainStoreOutcomeFlags(postgresChecks);
  const initCommandAvailable = hasCheckOutcome(
    targetRepoChecks,
    "Target repo init command",
    "available",
    (status) => status?.startsWith("available") === true
  );
  const fixtureAvailable = hasCheckOutcome(
    targetRepoChecks,
    "Target repo fixture smoke",
    "available",
    (status) => status?.startsWith("available") === true
  );
  const projectSchemaPresent = hasCheckOutcome(
    targetRepoChecks,
    "Project registration schema",
    "present",
    (status) => status?.startsWith("present") === true
  );
  const initConnectSmokeProven = hasCurrentRuntimeProof(
    targetRepoChecks,
    "Init-connect smoke",
    { requiresProjectId: true }
  );
  const targetHarnessSmokeProven = hasCurrentRuntimeProof(
    targetRepoChecks,
    "Target repo harness smoke",
    { requiresProjectId: true }
  );
  const leakageProofKnown = hasCurrentRuntimeProof(
    targetRepoChecks,
    "Cross-project leakage proof",
    { requiresProjectId: true }
  );
  const forbiddenSurfacePresent = hasCheckOutcome(
    targetRepoChecks,
    "Target repo forbidden surfaces",
    "present",
    (status) => status === "present"
  );

  if (forbiddenSurfacePresent) {
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

  if (!projectSchemaPresent) {
    return {
      label: "Target repo readiness",
      status: "blocked (project registration schema missing)"
    };
  }

  if (brainStore.postgresNotConfigured) {
    return {
      label: "Target repo readiness",
      status:
        "preview only (set KRN_DATABASE_URL and run init-connect and target repo harness smokes for proof)"
    };
  }

  if (brainStore.postgresUnreachable) {
    return {
      label: "Target repo readiness",
      status: "blocked (Postgres unreachable)"
    };
  }

  if (!brainStore.pgvectorAvailable || !brainStore.migrationsVerified) {
    return {
      label: "Target repo readiness",
      status: "blocked (memory store not ready)"
    };
  }

  if (!leakageProofKnown) {
    return {
      label: "Target repo readiness",
      status: "runtime unverified (cross-project leakage proof missing)"
    };
  }

  if (!initConnectSmokeProven) {
    return {
      label: "Target repo readiness",
      status: "unverified (init-connect smoke missing)"
    };
  }

  if (!targetHarnessSmokeProven) {
    return {
      label: "Target repo readiness",
      status: "partially ready (init-connect smoke proven; target repo harness smoke missing)"
    };
  }

  return {
    label: "Target repo readiness",
    status:
      "ready (init-connect and target harness smokes proven; source seeds, owner files, evidence readback, and memory usefulness guarded)"
  };
};
