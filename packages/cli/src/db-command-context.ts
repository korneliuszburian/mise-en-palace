import path from "node:path";

import {
  findRepoRoot
} from "./cli-file-boundary.js";

export interface DbCommandContextRuntime {
  readonly cwd: string;
  readonly env: Record<string, string | undefined>;
}

export const resolveDbCommandContext = async (
  runtime: DbCommandContextRuntime
): Promise<{
  readonly databaseUrl: string | undefined;
  readonly migrationsFolder: string;
  readonly relativeMigrationsFolder: string;
  readonly repoRoot: string;
}> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");

  return {
    repoRoot,
    migrationsFolder,
    relativeMigrationsFolder: path.relative(repoRoot, migrationsFolder),
    databaseUrl: runtime.env.KRN_DATABASE_URL?.trim()
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
