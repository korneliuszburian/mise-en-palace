import { resolve } from "node:path";

export function resolveScriptRoot(argv) {
  const rootFlagIndex = argv.indexOf("--root");
  const root = rootFlagIndex === -1 ? process.cwd() : argv[rootFlagIndex + 1];

  if (!root || root.startsWith("--")) {
    throw new Error("--root requires a directory path");
  }

  return resolve(root);
}
