import {
  parseTrackedTrialCommandArguments,
  runTrackedTrialCommand
} from "./tracked-paired-live-codex-repair.js";

const { manifestPath, attemptDirectory } = parseTrackedTrialCommandArguments(process.argv.slice(2));
if (manifestPath === undefined) {
  throw new Error(
    "Usage: run-tracked-paired-live-codex-repair <bound-manifest-path> [attempt-directory]"
  );
}
const artifact = await runTrackedTrialCommand(manifestPath, attemptDirectory);

process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
if (artifact.status !== "passed") process.exitCode = 2;
