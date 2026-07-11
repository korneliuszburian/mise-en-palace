import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);

export interface EnvironmentFingerprintInputs {
  gitCommit: string;
  gitDirty: boolean | "unknown";
  worktreeIdentity?: string;
  lockfileSha256: string;
  nodeVersion: string;
  pnpmVersion: string;
  os: string;
  arch: string;
  postgresServerVersion: string;
  pgvectorVersion: string;
  evaluatorVersion: string;
  checkerVersion: string;
  mcpProtocolVersion: string;
  schemaVersion: string;
  migrationIdentity?: string;
}

export interface EnvironmentFingerprint {
  kind: "krn.environmentFingerprint.v1";
  algorithm: "sha256";
  id: string;
  inputs: EnvironmentFingerprintInputs;
}

const unknownValue = "unknown";

const repositoryRootFrom = async (startDirectory: string): Promise<string> => {
  const result = await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
    cwd: path.resolve(startDirectory),
    encoding: "utf8"
  }).catch(() => undefined);
  const root = typeof result?.stdout === "string" ? result.stdout.trim() : "";

  return root.length > 0 ? root : path.resolve(startDirectory);
};

const readCommand = async (
  command: string,
  args: readonly string[],
  cwd: string
): Promise<string> => {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      encoding: "utf8"
    });
    const output = typeof result.stdout === "string" ? result.stdout.trim() : "";

    return output.length === 0 ? unknownValue : output;
  } catch {
    return unknownValue;
  }
};

const readLockfileSha256 = async (repoRoot: string): Promise<string> => {
  try {
    const lockfile = await readFile(path.join(repoRoot, "pnpm-lock.yaml"));

    return createHash("sha256").update(lockfile).digest("hex");
  } catch {
    return unknownValue;
  }
};

const readDatabaseVersions = async (
  databaseUrl: string | undefined
): Promise<Pick<EnvironmentFingerprintInputs, "postgresServerVersion" | "pgvectorVersion" | "migrationIdentity">> => {
  const trimmedUrl = databaseUrl?.trim();
  if (trimmedUrl === undefined || trimmedUrl.length === 0) {
    return {
      postgresServerVersion: "unconfigured",
      pgvectorVersion: "unconfigured",
      migrationIdentity: "unconfigured"
    };
  }

  const client = postgres(trimmedUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    const [row] = await client<{
      postgresServerVersion: string;
      pgvectorVersion: string | null;
    }[]>`
      select
        current_setting('server_version') as "postgresServerVersion",
        (
          select extversion
          from pg_extension
          where extname = 'vector'
        ) as "pgvectorVersion"
    `;

    return {
      postgresServerVersion: row?.postgresServerVersion ?? "unavailable",
      pgvectorVersion: row?.pgvectorVersion ?? "unavailable",
      migrationIdentity: await readAppliedMigrationIdentity(client)
    };
  } catch {
    return {
      postgresServerVersion: "unavailable",
      pgvectorVersion: "unavailable",
      migrationIdentity: "unavailable"
    };
  } finally {
    await client.end();
  }
};

const readAppliedMigrationIdentity = async (client: postgres.Sql): Promise<string> => {
  try {
    const tableRows = await client<{ present: boolean }[]>`
      select to_regclass('drizzle.__drizzle_migrations') is not null as present
    `;
    if (tableRows[0]?.present !== true) {
      return "unavailable";
    }

    const rows = await client<{ hash: string; createdAt: string }[]>`
      select hash, created_at::text as "createdAt"
      from drizzle.__drizzle_migrations
      order by id
    `;

    return createHash("sha256")
      .update(JSON.stringify(rows.map((row) => `${row.hash}@${row.createdAt}`)))
      .digest("hex");
  } catch {
    return "unavailable";
  }
};

const readWorktreeIdentity = async (
  repoRoot: string
): Promise<{ gitDirty: boolean | "unknown"; worktreeIdentity: string }> => {
  try {
    const [status, workingDiff, stagedDiff, untracked] = await Promise.all([
      execFileAsync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: repoRoot, encoding: "buffer" }),
      execFileAsync("git", ["diff", "--binary"], { cwd: repoRoot, encoding: "buffer" }),
      execFileAsync("git", ["diff", "--cached", "--binary"], { cwd: repoRoot, encoding: "buffer" }),
      execFileAsync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repoRoot, encoding: "utf8" })
    ]);
    const untrackedPaths = untracked.stdout.split("\0").filter((value) => value.length > 0);
    const digest = createHash("sha256");
    digest.update(status.stdout);
    digest.update(workingDiff.stdout);
    digest.update(stagedDiff.stdout);
    for (const relativePath of untrackedPaths) {
      const absolutePath = path.resolve(repoRoot, relativePath);
      if (absolutePath !== repoRoot && !absolutePath.startsWith(`${repoRoot}${path.sep}`)) {
        return { gitDirty: "unknown", worktreeIdentity: "unknown" };
      }
      digest.update(relativePath);
      digest.update(await readFile(absolutePath));
    }

    const dirty = status.stdout.length > 0;
    digest.update(dirty ? "dirty" : "clean");
    return {
      gitDirty: dirty,
      worktreeIdentity: digest.digest("hex")
    };
  } catch {
    return { gitDirty: "unknown", worktreeIdentity: "unknown" };
  }
};

export const buildEnvironmentFingerprint = (
  inputs: EnvironmentFingerprintInputs
): EnvironmentFingerprint => {
  const canonicalInputs = JSON.stringify(inputs);

  return {
    kind: "krn.environmentFingerprint.v1",
    algorithm: "sha256",
    id: createHash("sha256").update(canonicalInputs).digest("hex"),
    inputs
  };
};

export const collectEnvironmentFingerprint = async (input: {
  repoRoot?: string;
  databaseUrl?: string | undefined;
  evaluatorVersion?: string;
  checkerVersion?: string;
} = {}): Promise<EnvironmentFingerprint> => {
  const repoRoot = await repositoryRootFrom(input.repoRoot ?? process.cwd());
  const [gitCommit, pnpmVersion, lockfileSha256, databaseVersions, worktree] = await Promise.all([
    readCommand("git", ["rev-parse", "HEAD"], repoRoot),
    readCommand("pnpm", ["--version"], repoRoot),
    readLockfileSha256(repoRoot),
    readDatabaseVersions(input.databaseUrl),
    readWorktreeIdentity(repoRoot)
  ]);

  return buildEnvironmentFingerprint({
    gitCommit,
    ...worktree,
    lockfileSha256,
    nodeVersion: process.version,
    pnpmVersion,
    os: process.platform,
    arch: process.arch,
    ...databaseVersions,
    evaluatorVersion: input.evaluatorVersion ?? "krn-evaluator.v1",
    checkerVersion: input.checkerVersion ?? "krn-checkers.v1",
    mcpProtocolVersion: "2025-06-18",
    schemaVersion: "krn-schema.v1"
  });
};

export const environmentFingerprintLines = (
  fingerprint: EnvironmentFingerprint
): readonly string[] => [
  `Environment fingerprint: ${fingerprint.id}`,
  `Environment fingerprint inputs: ${JSON.stringify(fingerprint.inputs)}`
];
