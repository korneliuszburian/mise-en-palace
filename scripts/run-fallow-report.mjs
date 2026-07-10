import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { resolveScriptRoot } from "./parse-script-root.mjs";

const runReport = (root, args, outputPath) => {
  const result = spawnSync("fallow", args, {
    cwd: root,
    encoding: "utf8"
  });
  const output = [result.stdout, result.stderr]
    .filter((part) => typeof part === "string" && part.length > 0)
    .join("\n");

  writeFileSync(join(root, outputPath), output, "utf8");
  return result.status ?? 1;
};

const main = () => {
  const root = resolveScriptRoot(process.argv.slice(2));
  mkdirSync(join(root, ".local-lab", "fallow"), { recursive: true });
  console.log("FALLOW REPORT (NON-GATING): findings are informational; exit status is intentionally tolerated.");

  const deadAndDupesStatus = runReport(
    root,
    ["--skip", "health", "--format", "compact"],
    ".local-lab/fallow/dead-dupes.compact.txt"
  );
  const healthStatus = runReport(
    root,
    ["health", "--format", "compact"],
    ".local-lab/fallow/health.compact.txt"
  );

  console.log(`Fallow report completed (non-gating): dead/dupes=${deadAndDupesStatus}, health=${healthStatus}.`);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.log("FALLOW REPORT (NON-GATING): report infrastructure failed; CI gate remains separate.");
}
