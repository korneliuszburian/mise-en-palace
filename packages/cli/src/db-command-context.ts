import {
  parseBackendKind,
  postgresMigrationsFolder,
  resolveBackendConfig
} from "@krn/db";
import type {
  BackendKind
} from "@krn/db";

import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";
import {
  resolveTargetWorkspace
} from "./target-workspace.js";

export interface DbCommandContextRuntime {
  readonly cwd: string;
  readonly env: Record<string, string | undefined>;
}

export interface SelectedDbCommandRuntime extends DbCommandContextRuntime {
  readonly backend?: BackendKind;
  readonly dbPath?: string;
}

export type SelectedDbCommandBackend =
  | {
      readonly kind: "sqlite";
      readonly targetWorkspace: string;
      readonly dbPath: string;
    }
  | {
      readonly kind: "postgres";
    };

export const resolveSelectedDbCommandBackend = async (
  runtime: SelectedDbCommandRuntime
): Promise<SelectedDbCommandBackend> => {
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
    return { kind: "postgres" };
  }

  const targetWorkspace = await resolveTargetWorkspace(runtime);
  const config = resolveBackendConfig({
    backend: "sqlite",
    ...(runtime.dbPath === undefined ? {} : { dbPath: runtime.dbPath }),
    env: runtime.env,
    targetWorkspace
  });
  if (config.kind !== "sqlite") {
    throw new Error("SQLite DB command resolved a non-SQLite backend");
  }

  return {
    kind: "sqlite",
    targetWorkspace,
    dbPath: config.dbPath
  };
};

export const resolveDbCommandContext = async (
  runtime: DbCommandContextRuntime
): Promise<{
  readonly databaseUrl: string | undefined;
  readonly migrationsFolder: string;
  readonly relativeMigrationsFolder: string;
  readonly repoRoot: string;
}> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = postgresMigrationsFolder;

  return {
    repoRoot,
    migrationsFolder,
    relativeMigrationsFolder: "packages/db/src/migrations",
    databaseUrl: runtime.env.KRN_DATABASE_URL?.trim()
  };
};

export const resolvePostgresDbCommandContext = async (
  runtime: DbCommandContextRuntime,
  evaluatorVersion: string
): Promise<Awaited<ReturnType<typeof resolveDbCommandContext>> & {
  readonly attachFingerprint: (stdout: string) => string;
}> => {
  const context = await resolveDbCommandContext(runtime);
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot: context.repoRoot,
    databaseUrl: context.databaseUrl,
    evaluatorVersion
  });

  return {
    ...context,
    attachFingerprint: (stdout: string): string =>
      `${stdout}${environmentFingerprintLines(environmentFingerprint).join("\n")}\n`
  };
};

export const missingDbCommandOutput = (input: {
  readonly doesNotProve: string;
  readonly extraLines?: readonly string[];
  readonly nextAction: string;
  readonly relativeMigrationsFolder: string;
  readonly repoRoot: string;
  readonly title: string;
}): string => [
  input.title,
  `Repo root: ${input.repoRoot}`,
  `Migrations folder: ${input.relativeMigrationsFolder}`,
  "DB mode: preview/no-DB",
  "Postgres config: missing KRN_DATABASE_URL",
  `Next action: ${input.nextAction}`,
  `Does not prove: ${input.doesNotProve}`,
  ...(input.extraLines ?? [])
].join("\n") + "\n";
