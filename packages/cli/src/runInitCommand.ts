import {
  access,
  readFile
} from "node:fs/promises";
import {
  createHash
} from "node:crypto";
import path from "node:path";

export interface InitCommandRuntime {
  cwd: string;
  mode: "dryRun";
  repo: string;
}

export interface InitCommandResult {
  stdout: string;
}

interface TargetRepoDetection {
  repoPath: string;
  repoFingerprint: string;
  packageManager: string;
  typescriptPresent: boolean;
  scripts: string[];
  agentsPresent: boolean;
  codexPresent: boolean;
  agentSkillsPresent: boolean;
  forbiddenSurfaces: string[];
  packageName: string;
}

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJsonObject = async (filePath: string): Promise<Record<string, unknown> | undefined> => {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);

    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const dependencyRecordHas = (
  value: unknown,
  dependencyName: string
): boolean => isRecord(value) && typeof value[dependencyName] === "string";

const sortedScriptNames = (packageJson: Record<string, unknown> | undefined): string[] => {
  const scripts = packageJson?.scripts;

  if (!isRecord(scripts)) {
    return [];
  }

  return Object.keys(scripts)
    .filter((scriptName) => typeof scripts[scriptName] === "string")
    .sort();
};

const packageName = (packageJson: Record<string, unknown> | undefined): string =>
  typeof packageJson?.name === "string" && packageJson.name.trim().length > 0
    ? packageJson.name.trim()
    : "unnamed-target-repo";

const detectPackageManager = async (
  repoPath: string,
  packageJson: Record<string, unknown> | undefined
): Promise<string> => {
  if (await pathExists(path.join(repoPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (await pathExists(path.join(repoPath, "package-lock.json"))) {
    return "npm";
  }

  if (await pathExists(path.join(repoPath, "yarn.lock"))) {
    return "yarn";
  }

  if (
    (await pathExists(path.join(repoPath, "bun.lock"))) ||
    (await pathExists(path.join(repoPath, "bun.lockb")))
  ) {
    return "bun";
  }

  return packageJson === undefined ? "unknown" : "package-json";
};

const detectTypeScript = async (
  repoPath: string,
  packageJson: Record<string, unknown> | undefined
): Promise<boolean> => {
  if (await pathExists(path.join(repoPath, "tsconfig.json"))) {
    return true;
  }

  if (packageJson === undefined) {
    return false;
  }

  return (
    dependencyRecordHas(packageJson.dependencies, "typescript") ||
    dependencyRecordHas(packageJson.devDependencies, "typescript")
  );
};

const forbiddenSurfacePaths = [
  "apps",
  ".krn",
  "packages/api",
  "packages/dashboard",
  "packages/mcp-server",
  "redis",
  "kafka",
  "qdrant",
  "neo4j"
] as const;

const detectForbiddenSurfaces = async (repoPath: string): Promise<string[]> => {
  const existing = await Promise.all(
    forbiddenSurfacePaths.map(async (surface) => ({
      surface,
      present: await pathExists(path.join(repoPath, surface))
    }))
  );

  return existing.filter((item) => item.present).map((item) => item.surface);
};

const fingerprintForRepo = (repoPath: string, packageNameValue: string): string =>
  `sha256:${createHash("sha256").update(`${repoPath}\n${packageNameValue}`).digest("hex").slice(0, 16)}`;

const findWorkspaceRoot = async (startPath: string): Promise<string> => {
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

const resolveRepoPath = async (cwd: string, repo: string): Promise<string> => {
  const cwdRelativePath = path.resolve(cwd, repo);

  if (path.isAbsolute(repo) || (await pathExists(cwdRelativePath))) {
    return cwdRelativePath;
  }

  const workspaceRoot = await findWorkspaceRoot(cwd);

  return path.resolve(workspaceRoot, repo);
};

const detectTargetRepo = async (
  cwd: string,
  repo: string
): Promise<TargetRepoDetection> => {
  const repoPath = await resolveRepoPath(cwd, repo);

  if (!(await pathExists(repoPath))) {
    throw new Error(`Target repo does not exist: ${repoPath}`);
  }

  const packageJson = await readJsonObject(path.join(repoPath, "package.json"));
  const packageNameValue = packageName(packageJson);
  const [
    packageManager,
    typescriptPresent,
    agentsPresent,
    codexPresent,
    agentSkillsPresent,
    forbiddenSurfaces
  ] = await Promise.all([
    detectPackageManager(repoPath, packageJson),
    detectTypeScript(repoPath, packageJson),
    pathExists(path.join(repoPath, "AGENTS.md")),
    pathExists(path.join(repoPath, ".codex")),
    pathExists(path.join(repoPath, ".agents", "skills")),
    detectForbiddenSurfaces(repoPath)
  ]);

  return {
    repoPath,
    repoFingerprint: fingerprintForRepo(repoPath, packageNameValue),
    packageManager,
    typescriptPresent,
    scripts: sortedScriptNames(packageJson),
    agentsPresent,
    codexPresent,
    agentSkillsPresent,
    forbiddenSurfaces,
    packageName: packageNameValue
  };
};

const presentLabel = (present: boolean): string => (present ? "present" : "absent");

const scriptsLabel = (scripts: readonly string[]): string =>
  scripts.length === 0 ? "none" : scripts.join(", ");

const forbiddenSurfacesLabel = (surfaces: readonly string[]): string =>
  surfaces.length === 0 ? "absent" : surfaces.join(", ");

const renderDryRun = (detection: TargetRepoDetection): string =>
  [
    "KRN Init Dry Run",
    `Repo path: ${detection.repoPath}`,
    `Repo fingerprint: ${detection.repoFingerprint}`,
    `Package manager: ${detection.packageManager}`,
    `TypeScript: ${detection.typescriptPresent ? "present" : "absent"}`,
    `Scripts: ${scriptsLabel(detection.scripts)}`,
    `Existing AGENTS.md: ${presentLabel(detection.agentsPresent)}`,
    `Existing .codex: ${presentLabel(detection.codexPresent)}`,
    `Existing .agents/skills: ${presentLabel(detection.agentSkillsPresent)}`,
    `Forbidden surfaces: ${forbiddenSurfacesLabel(detection.forbiddenSurfaces)}`,
    "ProjectKernel proposal:",
    `- summary: ${detection.packageName} target repo connected for KRN harness planning`,
    "- activeContextRule: select project-scoped source, memory, retrieval, and anti-memory only",
    "Codex overlay proposal:",
    "- AGENTS.md: propose thin KRN target repo instructions",
    "- .codex: no runtime overlay write proposed in dry-run",
    "No files written",
    `Next command: krn init --connect --repo ${detection.repoPath} --persist`
  ].join("\n") + "\n";

export const runInitCommand = async (
  runtime: InitCommandRuntime
): Promise<InitCommandResult> => {
  if (runtime.mode !== "dryRun") {
    throw new Error("Only krn init --dry-run is implemented");
  }

  const detection = await detectTargetRepo(runtime.cwd, runtime.repo);

  return {
    stdout: renderDryRun(detection)
  };
};
