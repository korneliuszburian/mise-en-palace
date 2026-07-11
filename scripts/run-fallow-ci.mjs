import { spawnSync } from "node:child_process";
import process from "node:process";
import { forwardProcessResult } from "./forward-process-result.mjs";
import { resolveScriptRoot } from "./parse-script-root.mjs";
import { resolveCommittedRange } from "./resolve-committed-range.mjs";

const fallowArgs = (baseSha) => [
  "audit",
  "--format",
  "compact",
  "--gate",
  "new-only",
  "--dead-code-baseline",
  "fallow-baselines/dead-code.json",
  "--health-baseline",
  "fallow-baselines/health.json",
  "--dupes-baseline",
  "fallow-baselines/dupes.json",
  "--changed-since",
  baseSha,
];

const runFallow = (root, range) => {
  const result = spawnSync("fallow", fallowArgs(range.baseSha), {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      FALLOW_AUDIT_BASE: range.baseSha,
      FALLOW_AUDIT_HEAD: range.headSha,
    },
  });
  return forwardProcessResult(result);
};

const main = () => {
  const root = resolveScriptRoot(process.argv.slice(2));
  const range = resolveCommittedRange({ cwd: root });

  console.log(
    `Fallow committed range: base=${range.baseSha} head=${range.headSha} changedFiles=${range.changedFiles.length}`,
  );

  return process.argv.includes("--print-range")
    ? (console.log(JSON.stringify(range)), 0)
    : runFallow(root, range);
};

process.exitCode = main();
