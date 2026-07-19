import path from "node:path";

export const resolvePairedLiveRepoRoot = (cwd = process.cwd()): string =>
  path.basename(cwd) === "cli" && path.basename(path.dirname(cwd)) === "packages"
    ? path.resolve(cwd, "../..")
    : path.resolve(cwd);
