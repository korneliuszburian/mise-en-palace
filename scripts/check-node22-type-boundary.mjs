import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { resolveScriptRoot } from "./parse-script-root.mjs";

const root = resolveScriptRoot(process.argv.slice(2));
const fixture = join(root, "tests", "fixtures", "node22-type-boundary", "post-node22-api.ts");
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
const typeRoots = join(root, "packages", "cli", "node_modules", "@types");

if (!existsSync(fixture) || !existsSync(tsc)) {
  console.error("Node 22 type boundary fixture or local TypeScript compiler is missing");
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [
    tsc,
    "--noEmit",
    "--strict",
    "--target",
    "ES2022",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--types",
    "node",
    "--typeRoots",
    typeRoots,
    "--skipLibCheck",
    "false",
    fixture
  ], { encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (result.status === 0 || !output.includes("encapsulate")) {
    console.error("Node 22 type boundary failed: post-22 crypto.encapsulate was accepted");
    console.error(output);
    process.exitCode = 1;
  } else {
    console.log("Node 22 type boundary passed: post-22 crypto.encapsulate is rejected.");
  }
}
