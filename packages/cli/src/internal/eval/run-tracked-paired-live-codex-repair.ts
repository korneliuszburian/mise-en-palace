import {
  defaultTrackedTrialManifestPath,
  runTrackedTrialCommand
} from "./tracked-paired-live-codex-repair.js";

const [manifestPath = defaultTrackedTrialManifestPath(), attemptDirectory] = process.argv.slice(2);
const artifact = await runTrackedTrialCommand(manifestPath, attemptDirectory);

process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
if (artifact.status !== "passed") process.exitCode = 2;
