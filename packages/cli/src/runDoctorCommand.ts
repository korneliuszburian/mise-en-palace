import {
  access,
  readFile
} from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

export interface DoctorRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
}

export interface DoctorResult {
  exitCode: number;
  stdout: string;
}

interface DoctorCheck {
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
  databaseUrl: string | undefined
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

  const client = postgres(databaseUrl, { max: 1 });

  try {
    await client`select 1`;
    const vectorRows = await client<{ exists: boolean }[]>`
      select exists (
        select 1
        from pg_extension
        where extname = 'vector'
      ) as exists
    `;
    const migrationRows = await client<{ exists: boolean }[]>`
      select exists (
        select 1
        from information_schema.tables
        where table_name = '__drizzle_migrations'
      ) as exists
    `;
    const vectorAvailable = vectorRows[0]?.exists === true;
    const migrationsPresent = migrationRows[0]?.exists === true;

    return [
      {
        label: "Postgres config",
        status: "configured and reachable"
      },
      {
        label: "pgvector",
        status: vectorAvailable ? "available" : "missing"
      },
      {
        label: "migrations",
        status: migrationsPresent ? "table present" : "migration table missing"
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
  } finally {
    await client.end();
  }
};

const findCheckStatus = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): string | undefined => checks.find((check) => check.label === label)?.status;

const deriveBrainStoreReadiness = (postgresChecks: readonly DoctorCheck[]): DoctorCheck => {
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

  if (pgvectorStatus === "available" && migrationStatus === "table present") {
    return {
      label: "Brain store readiness",
      status: "ready"
    };
  }

  return {
    label: "Brain store readiness",
    status: "incomplete (pgvector and migrations must be ready)"
  };
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
  const postgresChecks = await checkPostgres(runtime.env.KRN_DATABASE_URL);
  const checks = [
    ...postgresChecks,
    deriveBrainStoreReadiness(postgresChecks),
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

    return false;
  });

  return {
    exitCode: failed ? 1 : 0,
    stdout: `${stdout}\n`
  };
};
