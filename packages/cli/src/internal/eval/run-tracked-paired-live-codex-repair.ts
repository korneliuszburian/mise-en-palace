import { writeFile } from "node:fs/promises";
import {
  defaultTrackedTrialManifestPath,
  runTrackedTrialCommand
} from "./tracked-paired-live-codex-repair.js";

const [manifestPath = defaultTrackedTrialManifestPath(), recordPath] = process.argv.slice(2);
const artifact = await runTrackedTrialCommand(manifestPath);

if (recordPath !== undefined) {
  await writeFile(recordPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
if (artifact.status === "blocked" || artifact.status === "unverified") process.exitCode = 2;
