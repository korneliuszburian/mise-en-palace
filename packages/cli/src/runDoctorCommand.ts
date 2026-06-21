import {
  access,
  readFile
} from "node:fs/promises";
import path from "node:path";
import {
  inspectHarnessPersistenceReadiness,
  inspectMigrationReadiness
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
  const checks = [
    ...postgresChecks,
    deriveBrainStoreReadiness(postgresChecks),
    ...harnessPersistenceChecks,
    deriveHarnessPersistenceReadiness(postgresChecks, harnessPersistenceChecks),
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

    return false;
  });

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${stdout}\n`
  };
};
