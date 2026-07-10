import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { resolveScriptRoot } from "./parse-script-root.mjs";

const manifestName = "fixture-ownership.json";

const listFixtureFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  return entry.isDirectory() ? listFixtureFiles(entryPath) : [entryPath];
});

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

// fallow-ignore-next-line complexity -- fixture metadata is an explicit multi-field ownership contract
const validateEntry = (entry, root, knownPaths) => {
  const errors = [];
  const fixturePath = entry?.path;

  if (!nonEmptyString(fixturePath) || !knownPaths.has(fixturePath)) {
    errors.push(`missing or unknown fixture path ${String(fixturePath)}`);
    return errors;
  }

  for (const field of ["consumer", "provenance", "checkerVersion", "replayOwner"]) {
    if (!nonEmptyString(entry[field])) {
      errors.push(`${fixturePath}: ${field} is required`);
    }
  }

  if (!nonEmptyString(entry.capturedAt) || Number.isNaN(Date.parse(entry.capturedAt))) {
    errors.push(`${fixturePath}: capturedAt must be a date`);
  }

  if (entry.archival !== null && (
    !nonEmptyString(entry.archival?.reason) ||
    !nonEmptyString(entry.archival?.reviewDate) ||
    Number.isNaN(Date.parse(entry.archival.reviewDate))
  )) {
    errors.push(`${fixturePath}: archival entries require reason and reviewDate`);
  }

  if (entry.mode === "recorded_replay" && !nonEmptyString(entry.replayOwner)) {
    errors.push(`${fixturePath}: recorded replay requires replayOwner`);
  }

  if (!existsSync(join(root, fixturePath))) {
    errors.push(`${fixturePath}: file does not exist`);
  }

  return errors;
};

// fallow-ignore-next-line complexity -- the gate combines manifest, duplicate, entry, and unreferenced-file invariants
const main = () => {
  const root = resolveScriptRoot(process.argv.slice(2));
  const fixtureRoot = join(root, "tests", "fixtures");
  const manifestPath = join(fixtureRoot, manifestName);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const fixturePaths = listFixtureFiles(fixtureRoot)
    .map((path) => relative(root, path).split(sep).join("/"))
    .filter((path) => path !== `tests/fixtures/${manifestName}`)
    .sort();
  const knownPaths = new Set(fixturePaths);
  const entries = Array.isArray(manifest.fixtures) ? manifest.fixtures : [];
  const entryPaths = entries.map((entry) => entry?.path);
  const duplicatePaths = entryPaths.filter((path, index) => entryPaths.indexOf(path) !== index);
  const errors = [
    ...(manifest.schemaVersion === "fixture-ownership.v1" ? [] : ["manifest schemaVersion must be fixture-ownership.v1"]),
    ...(duplicatePaths.length === 0 ? [] : [`duplicate fixture entries: ${duplicatePaths.join(", ")}`]),
    ...entries.flatMap((entry) => validateEntry(entry, root, knownPaths)),
    ...fixturePaths.filter((path) => !entryPaths.includes(path)).map((path) => `${path}: unreferenced fixture`),
    ...entryPaths.filter((path) => !knownPaths.has(path)).map((path) => `${path}: manifest entry is not a fixture file`)
  ];

  if (errors.length > 0) {
    console.error("Fixture ownership check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Fixture ownership check passed: ${fixturePaths.length} fixtures have consumers and provenance.`);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
