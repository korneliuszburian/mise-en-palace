import {
  readFile
} from "node:fs/promises";
import path from "node:path";

import type {
  DoctorCheck
} from "./runDoctorCommand.js";
import {
  pathExists,
  readJsonObject
} from "./cliFileBoundary.js";

export const checkRepoFiles = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  const agentsPresent = await pathExists(agentsPath);
  const agentsText = agentsPresent ? await readFile(agentsPath, "utf8") : "";
  const agentsLines = agentsText.split("\n").filter((line) => line.trim().length > 0).length;
  const tsconfig = await readJsonObject(path.join(repoRoot, "tsconfig.base.json"));
  const compilerOptions =
    typeof tsconfig?.compilerOptions === "object" &&
    tsconfig.compilerOptions !== null &&
    !Array.isArray(tsconfig.compilerOptions)
      ? (tsconfig.compilerOptions as Record<string, unknown>)
      : {};
  const strictEnabled = compilerOptions.strict === true;
  const exactOptionalEnabled = compilerOptions.exactOptionalPropertyTypes === true;
  const noUncheckedIndexedAccess = compilerOptions.noUncheckedIndexedAccess === true;
  const krnRuntimeTruthExists = await pathExists(path.join(repoRoot, ".krn"));
  const workspaceExists = await pathExists(path.join(repoRoot, "pnpm-workspace.yaml"));
  const packagesExists = await pathExists(path.join(repoRoot, "packages"));
  const skillsExists = await pathExists(path.join(repoRoot, ".agents", "skills"));
  const hooksExists = await pathExists(path.join(repoRoot, ".codex", "hooks"));
  const forbiddenSurfaces = [
    await pathExists(path.join(repoRoot, "apps")),
    await pathExists(path.join(repoRoot, "packages", "dashboard")),
    await pathExists(path.join(repoRoot, "packages", "api")),
    krnRuntimeTruthExists
  ];
  const forbiddenAbsent = forbiddenSurfaces.every((exists) => !exists);

  return [
    {
      label: "AGENTS.md",
      status: agentsPresent ? `present (${agentsLines} non-empty lines)` : "missing"
    },
    {
      label: ".krn runtime truth",
      status: krnRuntimeTruthExists ? "present" : "absent"
    },
    {
      label: "TypeScript strictness",
      status:
        strictEnabled && exactOptionalEnabled && noUncheckedIndexedAccess
          ? "enabled"
          : "incomplete"
    },
    {
      label: "workspace packages",
      status: workspaceExists && packagesExists ? "present" : "incomplete"
    },
    {
      label: "skills surface",
      status: skillsExists ? "present" : "missing"
    },
    {
      label: "hooks surface",
      status: hooksExists ? "present" : "not configured"
    },
    {
      label: "Forbidden surfaces",
      status: forbiddenAbsent ? "absent" : "present"
    }
  ];
};
