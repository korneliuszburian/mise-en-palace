import {
  readdir,
  readFile
} from "node:fs/promises";
import path from "node:path";

export const readScriptStatus = (
  packageJson: Record<string, unknown> | undefined,
  scriptName: string,
  expectedCommand: string
): string => {
  const scripts =
    typeof packageJson?.scripts === "object" &&
    packageJson.scripts !== null &&
    !Array.isArray(packageJson.scripts)
      ? packageJson.scripts as Record<string, unknown>
      : {};
  const scriptValue = scripts[scriptName];

  return typeof scriptValue === "string" && scriptValue.includes(expectedCommand)
    ? `available (pnpm ${scriptName})`
    : `missing (pnpm ${scriptName})`;
};

export const readOptionalText = async (filePath: string): Promise<string> => {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
};

export const readTreeText = async (targetPath: string): Promise<string> => {
  try {
    const entries = await readdir(targetPath, { withFileTypes: true });
    const texts = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(targetPath, entry.name);

        if (entry.isDirectory()) {
          return readTreeText(entryPath);
        }

        if (!entry.name.endsWith(".ts")) {
          return "";
        }

        return readOptionalText(entryPath);
      })
    );

    return texts.join("\n");
  } catch {
    return "";
  }
};
