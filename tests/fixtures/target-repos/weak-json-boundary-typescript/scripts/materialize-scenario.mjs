import {
  cp,
  mkdir,
  rm
} from "node:fs/promises";
import {
  dirname,
  resolve
} from "node:path";
import {
  fileURLToPath
} from "node:url";

const fixtureRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const scenarioName = process.argv[2] ?? "weak-json-boundary";
const outputPath = process.argv[3];

if (!outputPath) {
  console.error("Usage: node scripts/materialize-scenario.mjs <scenario> <output-path>");
  process.exit(2);
}

const scenarioRoot = resolve(fixtureRoot, "scenarios", scenarioName, "files");
const outputRoot = resolve(process.cwd(), outputPath);

await rm(outputRoot, {
  force: true,
  recursive: true
});
await mkdir(outputRoot, {
  recursive: true
});

for (const entry of [
  ".gitignore",
  "AGENTS.md",
  "README.md",
  "docs",
  "package.json",
  "src",
  "tests",
  "tsconfig.json"
]) {
  await cp(resolve(fixtureRoot, entry), resolve(outputRoot, entry), {
    recursive: true
  });
}

await cp(scenarioRoot, outputRoot, {
  recursive: true
});

console.log(`Materialized ${scenarioName} at ${outputRoot}`);
