import {
  access,
  readFile
} from "node:fs/promises";
import path from "node:path";

export const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export const findRepoRoot = async (startPath: string): Promise<string> => {
  let currentPath = startPath;

  for (;;) {
    if (await pathExists(path.join(currentPath, "pnpm-workspace.yaml"))) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return startPath;
    }

    currentPath = parentPath;
  }
};

export const resolveRepoInputFile = async (
  cwd: string,
  filePath: string
): Promise<string> => {
  const cwdPath = path.resolve(cwd, filePath);

  if (await pathExists(cwdPath)) {
    return cwdPath;
  }

  const repoRoot = await findRepoRoot(cwd);

  return path.resolve(repoRoot, filePath);
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export type JsonObjectReadResult =
  | {
      status: "ok";
      value: Record<string, unknown>;
    }
  | {
      status: "missing_or_unreadable";
      reason: string;
    }
  | {
      status: "invalid_json";
      reason: string;
    }
  | {
      status: "not_object";
      reason: string;
    };

export const readJsonObjectResult = async (
  filePath: string
): Promise<JsonObjectReadResult> => {
  let raw: string;

  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    return {
      status: "missing_or_unreadable",
      reason: error instanceof Error ? error.message : "unknown file read error"
    };
  }

  let parsed: unknown;

  try {
    const parsedValue: unknown = JSON.parse(raw);
    parsed = parsedValue;
  } catch (error) {
    return {
      status: "invalid_json",
      reason: error instanceof Error ? error.message : "unknown JSON parse error"
    };
  }

  if (!isJsonObject(parsed)) {
    return {
      status: "not_object",
      reason: "JSON value must be an object"
    };
  }

  return {
    status: "ok",
    value: parsed
  };
};

export const readJsonObject = async (
  filePath: string
): Promise<Record<string, unknown> | undefined> => {
  const result = await readJsonObjectResult(filePath);

  return result.status === "ok" ? result.value : undefined;
};
