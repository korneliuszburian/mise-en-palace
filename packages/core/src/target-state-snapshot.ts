import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

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
  return { mode: `unsupported:${stat.mode}`, content: new Uint8Array() };
};

export const collectTargetStateSnapshot = async (
  targetRepo: string
): Promise<TargetStateSnapshot> => {
  const repoRoot = path.resolve(targetRepo);
  const tree = await git(repoRoot, ["rev-parse", "HEAD^{tree}"]);
  const patch = await git(repoRoot, ["diff", "--binary", "HEAD"]);
  const trackedPaths = await git(repoRoot, ["diff", "--name-only", "-z", "HEAD"]);
  const untracked = await git(
    repoRoot,
    ["ls-files", "--others", "--exclude-standard", "-z"]
  );
  const patchHash = createHash("sha256");
  updateLengthPrefixed(patchHash, patch.stdout);

  for (const relativePath of untracked.stdout.toString("utf8").split("\0").filter(Boolean).sort()) {
    const entry = await untrackedEntry(path.join(repoRoot, relativePath));
    updateLengthPrefixed(patchHash, Buffer.from(relativePath));
    updateLengthPrefixed(patchHash, Buffer.from(entry.mode));
    updateLengthPrefixed(patchHash, entry.content);
  }

  return {
    treeIdentity: `git-tree:${tree.stdout.toString("utf8").trim()}`,
    patchIdentity: `sha256:${patchHash.digest("hex")}`,
    changedPaths: [...new Set([
      ...trackedPaths.stdout.toString("utf8").split("\0").filter(Boolean),
      ...untracked.stdout.toString("utf8").split("\0").filter(Boolean)
    ])].sort()
  };
};
