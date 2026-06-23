import path from "node:path";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import {
  checkActivation,
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
}

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
