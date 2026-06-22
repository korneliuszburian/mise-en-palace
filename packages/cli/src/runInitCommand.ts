import {
  access,
  readFile
} from "node:fs/promises";
import {
  createHash
} from "node:crypto";
import path from "node:path";
import postgres from "postgres";
import {
  createKrnDatabase,
  DrizzleProjectRepository
} from "@krn/db";
import type {
  ProjectKernelRecord,
  ProjectRecord,
  RepoInstallationRecord
} from "@krn/harness";

export interface InitCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  mode: "dryRun" | "connect";
  repo: string;
  persist?: boolean;
  createInitConnectRuntime?: CreateInitConnectRuntime;
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

export interface InitConnectRuntimeInput {
  databaseUrl: string;
}

export interface ConnectTargetRepoInput {
  repoPath: string;
  repoFingerprint: string;
  repoUrl: string;
  packageName: string;
  packageManager: string;
  typescriptPresent: boolean;
  scripts: string[];
}

export interface ConnectTargetRepoResult {
  project: ProjectRecord;
  projectCreated: boolean;
  repoInstallation: RepoInstallationRecord;
  repoInstallationCreated: boolean;
  projectKernel: ProjectKernelRecord;
  projectKernelCreated: boolean;
}

export interface InitConnectRuntime {
  connectTargetRepo(input: ConnectTargetRepoInput): Promise<ConnectTargetRepoResult>;
  close(): Promise<void>;
}

export type CreateInitConnectRuntime = (
  input: InitConnectRuntimeInput
) => Promise<InitConnectRuntime>;

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

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "target-repo" : normalized;
};

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

const createdLabel = (created: boolean): string => (created ? "created" : "reused");

const renderConnect = (
  detection: TargetRepoDetection,
  result: ConnectTargetRepoResult
): string =>
  [
    "KRN Init Connect",
    `Repo path: ${detection.repoPath}`,
    `Repo fingerprint: ${detection.repoFingerprint}`,
    "Persistence: enabled (Postgres, explicit --persist)",
    `Project ID: ${result.project.id} (${createdLabel(result.projectCreated)})`,
    `Repo installation ID: ${result.repoInstallation.id} (${createdLabel(result.repoInstallationCreated)})`,
    `ProjectKernel ID: ${result.projectKernel.id} (${createdLabel(result.projectKernelCreated)})`,
    "Files written: none",
    `Next command: krn plan --project ${result.project.id} --task "improve test script readiness" --persist`
  ].join("\n") + "\n";

const createPostgresInitConnectRuntime = async (
  input: InitConnectRuntimeInput
): Promise<InitConnectRuntime> => {
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);

  return {
    async connectTargetRepo(repoInput: ConnectTargetRepoInput): Promise<ConnectTargetRepoResult> {
      const workspaceSlug = "local";
      const existingWorkspace = await projectRepository.findWorkspaceBySlug(workspaceSlug);
      const workspace =
        existingWorkspace ??
        (await projectRepository.createWorkspace({
          slug: workspaceSlug,
          displayName: workspaceSlug,
          metadata: {
            createdBy: "krn init --connect"
          }
        }));
      const existingProject =
        (await projectRepository.getProjectByRepoFingerprint(repoInput.repoFingerprint)) ??
        (await projectRepository.getProjectByRepoPath(repoInput.repoPath));
      const projectSlug = normalizeSlugPart(
        `${repoInput.packageName}-${repoInput.repoFingerprint.slice(-8)}`
      );
      const project =
        existingProject ??
        (await projectRepository.createProject({
          workspaceId: workspace.id,
          slug: projectSlug,
          displayName: repoInput.packageName,
          description: "Target repo connected by krn init.",
          metadata: {
            createdBy: "krn init --connect",
            repoFingerprint: repoInput.repoFingerprint,
            repoPath: repoInput.repoPath,
            packageManager: repoInput.packageManager,
            typescriptPresent: repoInput.typescriptPresent,
            scripts: repoInput.scripts
          }
        }));
      const installations = await projectRepository.listRepoInstallationsForProject(project.id);
      const existingInstallation = installations.find(
        (installation) =>
          installation.repoFingerprint === repoInput.repoFingerprint ||
          installation.localPathHint === repoInput.repoPath ||
          installation.repoUrl === repoInput.repoUrl
      );
      const repoInstallation =
        existingInstallation ??
        (await projectRepository.createRepoInstallation({
          projectId: project.id,
          provider: "local",
          repoUrl: repoInput.repoUrl,
          defaultBranch: "main",
          repoFingerprint: repoInput.repoFingerprint,
          localPathHint: repoInput.repoPath,
          metadata: {
            createdBy: "krn init --connect",
            packageManager: repoInput.packageManager,
            typescriptPresent: repoInput.typescriptPresent,
            scripts: repoInput.scripts
          }
        }));
      const existingKernel = await projectRepository.getLatestProjectKernel(project.id);
      const projectKernel =
        existingKernel ??
        (await projectRepository.createProjectKernel({
          projectId: project.id,
          version: 1,
          summary: `${repoInput.packageName} target repo connected for KRN harness planning`,
          activeContextRule:
            "select project-scoped source, memory, retrieval, and anti-memory only",
          metadata: {
            createdBy: "krn init --connect",
            repoFingerprint: repoInput.repoFingerprint,
            repoPath: repoInput.repoPath
          }
        }));

      return {
        project,
        projectCreated: existingProject === undefined,
        repoInstallation,
        repoInstallationCreated: existingInstallation === undefined,
        projectKernel,
        projectKernelCreated: existingKernel === undefined
      };
    },
    async close(): Promise<void> {
      await client.end();
    }
  };
};

export const runInitCommand = async (
  runtime: InitCommandRuntime
): Promise<InitCommandResult> => {
  const detection = await detectTargetRepo(runtime.cwd, runtime.repo);

  if (runtime.mode === "connect") {
    if (runtime.persist !== true) {
      throw new Error("krn init --connect requires --persist");
    }

    const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

    if (databaseUrl === undefined || databaseUrl.length === 0) {
      throw new Error("KRN_DATABASE_URL is required for krn init --connect --persist");
    }

    const createRuntime = runtime.createInitConnectRuntime ?? createPostgresInitConnectRuntime;
    const initRuntime = await createRuntime({ databaseUrl });

    try {
      const result = await initRuntime.connectTargetRepo({
        repoPath: detection.repoPath,
        repoFingerprint: detection.repoFingerprint,
        repoUrl: `file://${detection.repoPath}`,
        packageName: detection.packageName,
        packageManager: detection.packageManager,
        typescriptPresent: detection.typescriptPresent,
        scripts: detection.scripts
      });

      return {
        stdout: renderConnect(detection, result)
      };
    } finally {
      await initRuntime.close();
    }
  }

  return {
    stdout: renderDryRun(detection)
  };
};
