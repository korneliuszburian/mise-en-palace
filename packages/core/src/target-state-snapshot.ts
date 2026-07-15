import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { compareTargetPaths } from "./target-path-order.js";

const execFileAsync = promisify(execFile);

const updateLengthPrefixed = (
  hash: ReturnType<typeof createHash>,
  value: Uint8Array
): void => {
  const length = Buffer.allocUnsafe(8);
  length.writeBigUInt64BE(BigInt(value.byteLength));
  hash.update(length).update(value);
};

export interface TargetStateSnapshot {
  readonly treeIdentity: string;
  readonly patchIdentity: string;
  readonly changedPaths: readonly string[];
}

const git = async (repoRoot: string, args: readonly string[]) =>
  execFileAsync("git", ["-C", repoRoot, ...args], {
    encoding: "buffer",
    maxBuffer: 32 * 1024 * 1024
  });

export const canonicalTargetRepoPath = async (targetRepo: string): Promise<string> => {
  const candidate = await realpath(path.resolve(targetRepo));
  const gitMarker = await lstat(path.join(candidate, ".git")).catch(() => undefined);
  if (gitMarker !== undefined) {
    return candidate;
  }
  const root = await git(candidate, ["rev-parse", "--show-toplevel"]);
  return realpath(root.stdout.toString("utf8").trim());
};

const untrackedEntry = async (entryPath: string): Promise<{
  mode: string;
  content: Uint8Array;
}> => {
  const stat = await lstat(entryPath);
  if (stat.isSymbolicLink()) {
    return { mode: "120000", content: Buffer.from(await readlink(entryPath)) };
  }
  if (stat.isFile()) {
    return {
      mode: (stat.mode & 0o111) === 0 ? "100644" : "100755",
      content: await readFile(entryPath)
    };
  }
  throw new Error(`unsupported untracked filesystem entry: ${entryPath}`);
};

const submodulePathsFromIndex = (index: Buffer): ReadonlySet<string> => new Set(
  index.toString("utf8").split("\0").filter(Boolean).flatMap((entry) => {
    const separator = entry.indexOf("\t");
    return entry.startsWith("160000 ") && separator >= 0
      ? [entry.slice(separator + 1)]
      : [];
  })
);

export const collectTargetStateSnapshot = async (
  targetRepo: string
): Promise<TargetStateSnapshot> => {
  const repoRoot = await canonicalTargetRepoPath(targetRepo);
  const tree = await git(repoRoot, ["rev-parse", "HEAD^{tree}"]);
  const patch = await git(repoRoot, ["diff", "--ignore-submodules=none", "--binary", "HEAD"]);
  const trackedPaths = await git(
    repoRoot,
    ["diff", "--ignore-submodules=none", "--name-only", "-z", "HEAD"]
  );
  const trackedPathList = trackedPaths.stdout.toString("utf8").split("\0").filter(Boolean);
  const submodulePaths = trackedPathList.length === 0
    ? new Set<string>()
    : submodulePathsFromIndex(
        (await git(repoRoot, [
          "ls-files",
          "--stage",
          "-z",
          "--",
          ...trackedPathList
        ])).stdout
      );
  const changedSubmodule = trackedPathList.find((changedPath) => submodulePaths.has(changedPath));
  if (changedSubmodule !== undefined) {
    throw new Error(`changed submodule cannot be content-addressed: ${changedSubmodule}`);
  }
  const untracked = await git(
    repoRoot,
    ["ls-files", "--others", "--exclude-standard", "-z"]
  );
  const patchHash = createHash("sha256");
  updateLengthPrefixed(patchHash, patch.stdout);

  for (const relativePath of untracked.stdout.toString("utf8").split("\0").filter(Boolean)
    .sort(compareTargetPaths)) {
    const entry = await untrackedEntry(path.join(repoRoot, relativePath));
    updateLengthPrefixed(patchHash, Buffer.from(relativePath));
    updateLengthPrefixed(patchHash, Buffer.from(entry.mode));
    updateLengthPrefixed(patchHash, entry.content);
  }

  return {
    treeIdentity: `git-tree:${tree.stdout.toString("utf8").trim()}`,
    patchIdentity: `sha256:${patchHash.digest("hex")}`,
    changedPaths: [...new Set([
      ...trackedPathList,
      ...untracked.stdout.toString("utf8").split("\0").filter(Boolean)
    ])].sort(compareTargetPaths)
  };
};
