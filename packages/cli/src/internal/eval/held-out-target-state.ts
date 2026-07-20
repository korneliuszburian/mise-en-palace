import type {
  CommandResult,
  HeldOutCheckerInput,
  TargetChangeManifest
} from "./paired-live-codex-repair.js";

export type HeldOutRunCommand = (
  command: string,
  args: readonly string[],
  cwd: string,
  options?: { readonly env?: NodeJS.ProcessEnv; readonly timeoutMs?: number; readonly input?: string }
) => Promise<CommandResult>;

const lines = (value: string): readonly string[] =>
  value.split("\n").map((line) => line.trim()).filter(Boolean);

export const captureHeldOutTargetState = async (
  input: HeldOutCheckerInput,
  runCommand: HeldOutRunCommand,
  allowedPath: (path: string) => boolean
): Promise<TargetChangeManifest> => {
  const [status, head, tracked, untracked] = await Promise.all([
    runCommand("git", ["status", "--porcelain=v1", "--untracked-files=all"], input.targetRoot),
    runCommand("git", ["rev-parse", "HEAD"], input.targetRoot),
    runCommand("git", ["diff", input.initialCommit, "--name-only"], input.targetRoot),
    runCommand("git", ["ls-files", "--others", "--exclude-standard"], input.targetRoot)
  ]);
  const trackedFiles = tracked.exitCode === 0 ? lines(tracked.stdout) : [];
  const untrackedFiles = untracked.exitCode === 0 ? lines(untracked.stdout) : [];
  const changedFiles = [...new Set([...trackedFiles, ...untrackedFiles])];
  return {
    status: [status, head, tracked, untracked].every((result) => result.exitCode === 0) ? "known" : "unknown",
    ...(head.exitCode === 0 ? { headMatchesInitialCommit: head.stdout.trim() === input.initialCommit } : {}),
    trackedFiles,
    untrackedFiles,
    changedFiles,
    forbiddenFiles: changedFiles.filter((path) => !allowedPath(path)),
    statusOutput: status.stdout
  };
};
