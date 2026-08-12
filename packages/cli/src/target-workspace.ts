import {
  realpath,
  stat
} from "node:fs/promises";
import path from "node:path";

export interface TargetWorkspaceInput {
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  repo?: string;
}

const isDirectory = async (candidate: string): Promise<boolean> => {
  try {
    const canonical = await realpath(candidate);
    const info = await stat(canonical);
    return info.isDirectory();
  } catch {
    return false;
  }
};

const canonicalDirectory = async (candidate: string): Promise<string> => {
  let canonical: string;
  try {
    canonical = await realpath(candidate);
  } catch {
    throw new Error(`Target workspace is not a directory: ${candidate}`);
  }

  if (!(await isDirectory(canonical))) {
    throw new Error(`Target workspace is not a directory: ${candidate}`);
  }

  return canonical;
};

const resolveCallerDirectory = async (
  input: Pick<TargetWorkspaceInput, "cwd" | "env">
): Promise<string> => {
  const initCwd = input.env.INIT_CWD?.trim();

  if (
    initCwd !== undefined &&
    initCwd.length > 0 &&
    path.isAbsolute(initCwd) &&
    await isDirectory(initCwd)
  ) {
    return realpath(initCwd);
  }

  return canonicalDirectory(path.resolve(input.cwd));
};

export const resolveTargetWorkspace = async (
  input: TargetWorkspaceInput
): Promise<string> => {
  const repo = input.repo?.trim();

  if (input.repo !== undefined) {
    if (repo === undefined || repo.length === 0) {
      throw new Error("--repo requires a non-empty target workspace");
    }

    const requested = path.isAbsolute(repo)
      ? path.normalize(repo)
      : path.resolve(await resolveCallerDirectory(input), repo);

    return canonicalDirectory(requested);
  }

  const initCwd = input.env.INIT_CWD?.trim();
  if (initCwd === undefined || initCwd.length === 0 || !path.isAbsolute(initCwd)) {
    throw new Error(
      "INIT_CWD must identify the canonical target workspace for SQLite commands"
    );
  }

  return canonicalDirectory(initCwd);
};
