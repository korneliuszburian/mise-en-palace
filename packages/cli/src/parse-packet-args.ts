import type { ParseArgsResult } from "./parse-args.js";

export const formatPacketUsage = (): string =>
  "Usage: krn packet diff --before-run <run-id> --after-run <run-id> --json\n";

export const parsePacketArgs = (args: readonly string[]): ParseArgsResult => {
  if (args[0] !== "diff") return { error: formatPacketUsage() };
  let beforeRun: string | undefined;
  let afterRun: string | undefined;
  let json = false;
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") { json = true; continue; }
    if (arg === "--before-run" || arg === "--after-run") {
      const value = args[index + 1]?.trim();
      if (value === undefined || value.length === 0 || value.startsWith("--")) return { error: formatPacketUsage() };
      if (arg === "--before-run") beforeRun = value;
      else afterRun = value;
      index += 1;
      continue;
    }
    return { error: formatPacketUsage() };
  }
  return beforeRun === undefined || afterRun === undefined || !json
    ? { error: formatPacketUsage() }
    : { command: { kind: "packetDiff", beforeRun, afterRun } };
};
