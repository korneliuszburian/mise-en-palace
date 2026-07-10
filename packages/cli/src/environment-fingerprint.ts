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
}

export interface EnvironmentFingerprint {
  kind: "krn.environmentFingerprint.v1";
  algorithm: "sha256";
  id: string;
  inputs: EnvironmentFingerprintInputs;
}

const unknownValue = "unknown";

const repositoryRootFrom = (startDirectory: string): string => {
  let directory = path.resolve(startDirectory);

  while (true) {
    if (path.basename(directory) === "mise-en-palace") {
      return directory;
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return path.resolve(startDirectory);
    }

    directory = parent;
  }
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
): Promise<Pick<EnvironmentFingerprintInputs, "postgresServerVersion" | "pgvectorVersion">> => {
  const trimmedUrl = databaseUrl?.trim();
  if (trimmedUrl === undefined || trimmedUrl.length === 0) {
    return {
      postgresServerVersion: "unconfigured",
      pgvectorVersion: "unconfigured"
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
      pgvectorVersion: row?.pgvectorVersion ?? "unavailable"
    };
  } catch {
    return {
      postgresServerVersion: "unavailable",
      pgvectorVersion: "unavailable"
    };
  } finally {
    await client.end();
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
  const repoRoot = repositoryRootFrom(input.repoRoot ?? process.cwd());
  const [gitCommit, gitStatus, pnpmVersion, lockfileSha256, databaseVersions] = await Promise.all([
    readCommand("git", ["rev-parse", "HEAD"], repoRoot),
    readCommand("git", ["status", "--porcelain"], repoRoot),
    readCommand("pnpm", ["--version"], repoRoot),
    readLockfileSha256(repoRoot),
    readDatabaseVersions(input.databaseUrl)
  ]);

  return buildEnvironmentFingerprint({
    gitCommit,
    gitDirty: gitStatus === unknownValue ? unknownValue : gitStatus !== "",
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
