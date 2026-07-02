import path from "node:path";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import {
  checkActivation,
  checkCodexAdapterRuntimeProof,
  checkHarnessPersistence,
  checkMemoryGovernance,
  checkPostgres,
  checkRetrievalSubstrate,
  checkSourceGraph
} from "./doctorDbChecks.js";
import {
  checkRepoFiles
} from "./doctorRepoChecks.js";
import {
  deriveActivationReadiness,
  deriveBrainStoreReadiness,
  deriveCodexAdapterReadiness,
  deriveHarnessPersistenceReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness,
  deriveWorkerJobReadiness
} from "./doctorReadiness.js";
import {
  checkCodexAdapter,
  checkTargetRepoReadiness,
  checkWorkerJobs
} from "./doctorStaticChecks.js";

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
  outcome?: DoctorOutcome;
  severity?: DoctorSeverity;
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
      "KRN MCP server",
      "Redis/Kafka queue",
      "Broad worker daemon",
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
      "Brain store readiness",
      "Harness persistence readiness",
      "Source graph readiness",
      "Memory governance readiness",
      "Retrieval substrate readiness",
      "Activation readiness",
      "Codex adapter readiness",
      "Worker job readiness",
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
  const codexAdapterRuntimeProofChecks = await checkCodexAdapterRuntimeProof(
    repoRoot,
    runtime.env.KRN_DATABASE_URL,
    postgresChecks
  );
  const codexAdapterReadinessChecks = [
    ...codexAdapterChecks,
    ...codexAdapterRuntimeProofChecks
  ];
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
    ...codexAdapterReadinessChecks,
    deriveCodexAdapterReadiness(postgresChecks, codexAdapterReadinessChecks),
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
  const failed = hasDoctorFailure(checks);

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${stdout}\n`
  };
};
