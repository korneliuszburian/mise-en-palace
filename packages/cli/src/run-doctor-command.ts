import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  fileURLToPath
} from "node:url";
import {
  inspectSqliteMigrationReadiness,
  inspectTargetKrnArtifacts,
  parseBackendKind,
  postgresMigrationsFolder,
  resolveBackendConfig,
  sqliteStoreIsReady
} from "@krn/db";
import type {
  BackendKind,
  SqliteMigrationReadinessReport
} from "@krn/db";
import {
  checkActivation,
  checkCodexAdapterRuntimeProof,
  checkHarnessPersistence,
  checkMemoryGovernance,
  checkPostgres,
  checkRetrievalSubstrate,
  checkSourceGraph
} from "./doctor-db-checks.js";
import {
  checkRepoFiles
} from "./doctor-repo-checks.js";
import {
  deriveActivationReadiness,
  deriveBrainStoreReadiness,
  deriveCodexAdapterReadiness,
  deriveHarnessPersistenceReadiness,
  deriveMaintenanceQueueReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness
} from "./doctor-readiness.js";
import {
  checkMaintenanceQueue,
  checkCodexAdapter,
  checkTargetRepoReadiness
} from "./doctor-static-checks.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";
import {
  resolveTargetWorkspace
} from "./target-workspace.js";

export interface DoctorRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  backend?: BackendKind;
  dbPath?: string;
}

export interface DoctorResult {
  exitCode: number;
  stdout: string;
}

export interface DoctorProofEvidence {
  command: string;
  status: "passed" | "failed";
  capturedAt: string;
  freshness: "current" | "stale";
  storeIdentity: string;
  projectId?: string;
  environmentFingerprintId?: string;
}

export interface DoctorCheck {
  label: string;
  status: string;
  outcome?: DoctorOutcome;
  severity?: DoctorSeverity;
  proof?: DoctorProofEvidence;
}

export type DoctorOutcome =
  | "absent"
  | "available"
  | "blocked"
  | "configured_reachable"
  | "configured_unreachable"
  | "incomplete"
  | "known"
  | "migration_table_missing"
  | "migrations_unverified"
  | "migrations_verified"
  | "missing"
  | "not_configured"
  | "partially_ready"
  | "pgvector_available"
  | "pgvector_missing"
  | "present"
  | "preview_only"
  | "proven"
  | "ready"
  | "runtime_unverified"
  | "skipped";

export type DoctorSeverity = "pass" | "warning" | "failure";

interface DoctorFailureRule {
  labels: ReadonlySet<string>;
  matches(status: string): boolean;
}

const statusEquals = (expected: string) =>
  (status: string): boolean => status === expected;

const statusStartsWith = (prefix: string) =>
  (status: string): boolean => status.startsWith(prefix);

const labels = (values: readonly string[]): ReadonlySet<string> => new Set(values);

const doctorFailureRules: readonly DoctorFailureRule[] = [
  {
    labels: labels([
      ".krn runtime truth",
      "Forbidden surfaces",
      "Codex execution runner",
      "KRN MCP product server",
      "Redis/Kafka queue",
      "Autonomous maintenance daemon",
      "Runtime markdown memory",
      "Automatic memory mutation",
      "Separate vector/search DB",
      "Naive RAG dump command",
      "Broad context dump",
      "Core requiredSkills field",
      "Target repo forbidden surfaces"
    ]),
    matches: statusEquals("present")
  },
  {
    labels: labels([
      "TypeScript strictness",
      "workspace packages"
    ]),
    matches: statusEquals("incomplete")
  },
  {
    labels: labels([
      "AGENTS.md",
      "skills surface"
    ]),
    matches: statusEquals("missing")
  },
  {
    labels: labels(["Postgres config"]),
    matches: statusStartsWith("configured but unreachable")
  },
  {
    labels: labels([
      "Memory store readiness",
      "Harness persistence readiness",
      "Source graph readiness",
      "Memory governance readiness",
      "Retrieval substrate readiness",
      "Activation readiness",
      "Codex adapter readiness",
      "Maintenance queue readiness",
      "Target repo readiness"
    ]),
    matches: statusStartsWith("blocked")
  }
];

const isDoctorCheckFailure = (check: DoctorCheck): boolean =>
  doctorFailureRules.some((rule) =>
    rule.labels.has(check.label) && rule.matches(check.status)
  );

export const hasDoctorFailure = (checks: readonly DoctorCheck[]): boolean =>
  checks.some((check) =>
    check.severity === "failure" ||
    (check.severity === undefined && isDoctorCheckFailure(check))
  );

const runPostgresDoctorCommand = async (runtime: DoctorRuntime): Promise<DoctorResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl: runtime.env.KRN_DATABASE_URL,
    evaluatorVersion: "doctor.v1"
  });
  const activationProofFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl: runtime.env.KRN_DATABASE_URL,
    evaluatorVersion: "db-smoke:activation"
  });
  const targetRepoProofFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl: runtime.env.KRN_DATABASE_URL,
    evaluatorVersion: "db-smoke:targetRepoHarness"
  });
  const initConnectProofFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl: runtime.env.KRN_DATABASE_URL,
    evaluatorVersion: "db-smoke:initConnect"
  });
  const codexAdapterProofFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl: runtime.env.KRN_DATABASE_URL,
    evaluatorVersion: "db-smoke:codexAdapter"
  });
  const migrationsFolder = postgresMigrationsFolder;
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
    postgresChecks,
    activationProofFingerprint.id
  );
  const codexAdapterChecks = await checkCodexAdapter(repoRoot);
  const codexAdapterRuntimeProofChecks = await checkCodexAdapterRuntimeProof(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks,
    codexAdapterProofFingerprint.id
  );
  const codexAdapterReadinessChecks = [
    ...codexAdapterChecks,
    ...codexAdapterRuntimeProofChecks
  ];
  const maintenanceQueueChecks = await checkMaintenanceQueue(repoRoot);
  const targetRepoChecks = await checkTargetRepoReadiness(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    targetRepoProofFingerprint.id,
    initConnectProofFingerprint.id
  );
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
    ...codexAdapterReadinessChecks,
    deriveCodexAdapterReadiness(postgresChecks, codexAdapterReadinessChecks),
    ...maintenanceQueueChecks,
    deriveMaintenanceQueueReadiness(postgresChecks, maintenanceQueueChecks),
    ...targetRepoChecks,
    deriveTargetRepoReadiness(postgresChecks, targetRepoChecks),
    ...(await checkRepoFiles(repoRoot))
  ].map((check) => check.proof === undefined
    ? check
    : {
      ...check,
      proof: {
        ...check.proof,
        environmentFingerprintId: environmentFingerprint.id
      }
    });
  const stdout = [
    "KRN Doctor",
    `Repo root: ${repoRoot}`,
    ...environmentFingerprintLines(environmentFingerprint),
    ...checks.map((check) => `${check.label}: ${check.status}`)
  ].join("\n");
  const failed = hasDoctorFailure(checks);

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${stdout}\n`
  };
};

const sqliteRuntimeWarnings = (): DoctorCheck[] => [
  "Harness persistence readiness",
  "Source graph readiness",
  "Memory governance readiness",
  "Retrieval substrate readiness",
  "Activation readiness",
  "Codex adapter readiness",
  "Maintenance queue readiness",
  "Target repo readiness"
].map((label) => ({
  label,
  status: "runtime_unverified (run the matching persisted smoke proof)",
  outcome: "runtime_unverified",
  severity: "warning"
}));

const failedSqliteChecks = (message: string): DoctorCheck[] => [
  "SQLite connectivity",
  "Migrations",
  "SQLite schema",
  "Repository reachability",
  "SQLite journal mode",
  "SQLite foreign keys",
  "SQLite integrity",
  "Memory store readiness"
].map((label) => ({
  label,
  status: label === "SQLite connectivity" ? `failed (${message})` : "blocked",
  severity: "failure"
}));

const reportSqliteChecks = (report: SqliteMigrationReadinessReport): DoctorCheck[] => {
  const healthy = sqliteStoreIsReady(report);
  return [
    { label: "SQLite connectivity", status: report.connectivityReady ? "reachable" : "failed", severity: report.connectivityReady ? "pass" : "failure" },
    { label: "Migrations", status: report.migrationsVerified ? "applied" : `incomplete (${report.migrationIdentityStatus})`, severity: report.migrationsVerified ? "pass" : "failure" },
    { label: "SQLite schema", status: report.schemaPresent ? "present" : "incomplete", severity: report.schemaPresent ? "pass" : "failure" },
    { label: "Repository reachability", status: report.repositoryReachabilityReady ? "ready" : "blocked", severity: report.repositoryReachabilityReady ? "pass" : "failure" },
    { label: "SQLite journal mode", status: report.journalMode, severity: report.journalMode === "wal" ? "pass" : "failure" },
    { label: "SQLite foreign keys", status: report.foreignKeysEnabled && report.foreignKeyViolations === 0 ? "enabled" : `blocked (${report.foreignKeyViolations} violations)`, severity: report.foreignKeysEnabled && report.foreignKeyViolations === 0 ? "pass" : "failure" },
    { label: "SQLite integrity", status: report.integrityReady ? "ok" : "failed", severity: report.integrityReady ? "pass" : "failure" },
    { label: "Memory store readiness", status: healthy ? "ready" : "blocked (SQLite store checks must be ready)", severity: healthy ? "pass" : "failure" }
  ];
};

const runSqliteDoctorCommand = async (
  targetWorkspace: string,
  dbPath: string
): Promise<DoctorResult> => {
  const packageRepoRoot = await findRepoRoot(fileURLToPath(new URL(".", import.meta.url)));
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot: packageRepoRoot,
    evaluatorVersion: "doctor.v1"
  });
  let storeChecks: DoctorCheck[];

  const governedArtifacts = await inspectTargetKrnArtifacts(targetWorkspace);
  if (
    governedArtifacts.status === "forbidden" ||
    governedArtifacts.status === "unverifiable"
  ) {
    const entry = "entry" in governedArtifacts && governedArtifacts.entry !== undefined
      ? ` (${governedArtifacts.entry})`
      : "";
    storeChecks = failedSqliteChecks(
      `forbidden .krn artifact: ${governedArtifacts.reason}${entry}`
    );
  } else {
    try {
      storeChecks = reportSqliteChecks(await inspectSqliteMigrationReadiness(dbPath));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown SQLite readiness error";
      storeChecks = failedSqliteChecks(message);
    }
  }

  const checks: DoctorCheck[] = [
    { label: "SQLite mode", status: "selected", severity: "pass" },
    { label: "SQLite config", status: dbPath, severity: "pass" },
    ...storeChecks,
    ...sqliteRuntimeWarnings(),
    ...(await checkRepoFiles(packageRepoRoot, targetWorkspace))
  ];
  const stdout = [
    "KRN Doctor",
    `Repo root: ${targetWorkspace}`,
    ...environmentFingerprintLines(environmentFingerprint),
    ...checks.map((check) => `${check.label}: ${check.status}`)
  ].join("\n");

  return {
    exitCode: hasDoctorFailure(checks) ? 1 : 0,
    stdout: `${stdout}\n`
  };
};

export const runDoctorCommand = async (runtime: DoctorRuntime): Promise<DoctorResult> => {
  const selectedBackend = parseBackendKind(runtime.backend) ??
    parseBackendKind(runtime.env.KRN_DB_BACKEND) ??
    "sqlite";
  if (selectedBackend === "postgres") {
    resolveBackendConfig({
      backend: "postgres",
      ...(runtime.dbPath === undefined ? {} : { dbPath: runtime.dbPath }),
      env: runtime.env,
      targetWorkspace: runtime.cwd
    });
    return runPostgresDoctorCommand(runtime);
  }

  const targetWorkspace = await resolveTargetWorkspace(runtime);
  const config = resolveBackendConfig({
    ...(runtime.backend === undefined ? {} : { backend: runtime.backend }),
    ...(runtime.dbPath === undefined ? {} : { dbPath: runtime.dbPath }),
    env: runtime.env,
    targetWorkspace
  });

  if (config.kind !== "sqlite") {
    throw new Error("SQLite doctor resolved a non-SQLite backend");
  }
  return runSqliteDoctorCommand(targetWorkspace, config.dbPath);
};
