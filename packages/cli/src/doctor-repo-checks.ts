import {
  readFile
} from "node:fs/promises";
import path from "node:path";

import type {
  DoctorCheck
} from "./run-doctor-command.js";
import {
  pathExists,
  readJsonObject
} from "./cli-file-boundary.js";
import {
  inspectTargetKrnArtifacts,
  targetKrnArtifactsAreForbidden
} from "@krn/db";

export const checkRepoFiles = async (
  repoRoot: string,
  targetWorkspace: string = repoRoot
): Promise<DoctorCheck[]> => {
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
  const krnArtifacts = await inspectTargetKrnArtifacts(targetWorkspace);
  const krnRuntimeTruthForbidden = targetKrnArtifactsAreForbidden(krnArtifacts);
  const workspaceExists = await pathExists(path.join(repoRoot, "pnpm-workspace.yaml"));
  const packagesExists = await pathExists(path.join(repoRoot, "packages"));
  const skillsExists = await pathExists(path.join(repoRoot, ".agents", "skills"));
  const hooksExists = await pathExists(path.join(repoRoot, ".codex", "hooks"));
  const forbiddenSurfaces = [
    await pathExists(path.join(repoRoot, "apps")),
    await pathExists(path.join(repoRoot, "packages", "dashboard")),
    await pathExists(path.join(repoRoot, "packages", "api")),
    krnRuntimeTruthForbidden
  ];
  const forbiddenAbsent = forbiddenSurfaces.every((exists) => !exists);

  return [
    {
      label: "AGENTS.md",
      status: agentsPresent ? `present (${agentsLines} non-empty lines)` : "missing"
    },
    {
      label: ".krn runtime truth",
      status: krnRuntimeTruthForbidden
        ? "present"
        : krnArtifacts.status === "allowed" && krnArtifacts.artifacts.length > 0
          ? "governed SQLite artifacts only"
          : "absent"
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
