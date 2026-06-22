import {
  access,
  readFile
} from "node:fs/promises";
import path from "node:path";
import {
  inspectHarnessPersistenceReadiness,
  inspectMemoryGovernanceReadiness,
  inspectMigrationReadiness,
  inspectSourceGraphReadiness
} from "@krn/db";

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

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const findRepoRoot = async (startPath: string): Promise<string> => {
  let currentPath = startPath;

  for (;;) {
    if (await pathExists(path.join(currentPath, "pnpm-workspace.yaml"))) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return startPath;
    }

    currentPath = parentPath;
  }
};

const readJsonObject = async (filePath: string): Promise<Record<string, unknown> | undefined> => {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

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

const readScriptStatus = (
  packageJson: Record<string, unknown> | undefined,
  scriptName: string,
  expectedCommand: string
): DoctorCheck["status"] => {
  const scripts =
    typeof packageJson?.scripts === "object" &&
    packageJson.scripts !== null &&
    !Array.isArray(packageJson.scripts)
      ? packageJson.scripts as Record<string, unknown>
      : {};
  const scriptValue = scripts[scriptName];

  return typeof scriptValue === "string" && scriptValue.includes(expectedCommand)
    ? `available (pnpm ${scriptName})`
    : `missing (pnpm ${scriptName})`;
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

const readOptionalText = async (filePath: string): Promise<string> => {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
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

const checkRepoFiles = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  const agentsPresent = await pathExists(agentsPath);
  const agentsText = agentsPresent ? await readFile(agentsPath, "utf8") : "";
  const agentsLines = agentsText.split("\n").filter((line) => line.trim().length > 0).length;
  const tsconfig = await readJsonObject(path.join(repoRoot, "tsconfig.base.json"));
  const compilerOptions =
    typeof tsconfig?.compilerOptions === "object" &&
    tsconfig.compilerOptions !== null &&
    !Array.isArray(tsconfig.compilerOptions)
      ? (tsconfig.compilerOptions as Record<string, unknown>)
      : {};
  const strictEnabled = compilerOptions.strict === true;
  const exactOptionalEnabled = compilerOptions.exactOptionalPropertyTypes === true;
  const noUncheckedIndexedAccess = compilerOptions.noUncheckedIndexedAccess === true;
  const krnRuntimeTruthExists = await pathExists(path.join(repoRoot, ".krn"));
  const workspaceExists = await pathExists(path.join(repoRoot, "pnpm-workspace.yaml"));
  const packagesExists = await pathExists(path.join(repoRoot, "packages"));
  const skillsExists = await pathExists(path.join(repoRoot, ".agents", "skills"));
  const hooksExists = await pathExists(path.join(repoRoot, ".codex", "hooks"));
  const forbiddenSurfaces = [
    await pathExists(path.join(repoRoot, "apps")),
    await pathExists(path.join(repoRoot, "packages", "dashboard")),
    await pathExists(path.join(repoRoot, "packages", "api")),
    krnRuntimeTruthExists
  ];
  const forbiddenAbsent = forbiddenSurfaces.every((exists) => !exists);

  return [
    {
      label: "AGENTS.md",
      status: agentsPresent ? `present (${agentsLines} non-empty lines)` : "missing"
    },
    {
      label: ".krn runtime truth",
      status: krnRuntimeTruthExists ? "present" : "absent"
    },
    {
      label: "TypeScript strictness",
      status:
        strictEnabled && exactOptionalEnabled && noUncheckedIndexedAccess
          ? "enabled"
          : "incomplete"
    },
    {
      label: "workspace packages",
      status: workspaceExists && packagesExists ? "present" : "incomplete"
    },
    {
      label: "skills surface",
      status: skillsExists ? "present" : "missing"
    },
    {
      label: "hooks surface",
      status: hooksExists ? "present" : "not configured"
    },
    {
      label: "Forbidden surfaces",
      status: forbiddenAbsent ? "absent" : "present"
    }
  ];
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
  const checks = [
    ...postgresChecks,
    deriveBrainStoreReadiness(postgresChecks),
    ...harnessPersistenceChecks,
    deriveHarnessPersistenceReadiness(postgresChecks, harnessPersistenceChecks),
    ...sourceGraphChecks,
    deriveSourceGraphReadiness(postgresChecks, sourceGraphChecks),
    ...memoryGovernanceChecks,
    deriveMemoryGovernanceReadiness(postgresChecks, memoryGovernanceChecks),
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

    if (check.label === "Runtime markdown memory" || check.label === "Automatic memory mutation") {
      return check.status === "present";
    }

    return false;
  });

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${stdout}\n`
  };
};
