import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  symlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { describe, expect, it, vi, beforeEach } from "vitest";

import type {
  ProjectRecord,
  SourceChunkRecord,
  SourceRepository
} from "@krn/core/repositories/internal";

const mocks = vi.hoisted(() => {
  const client = {
    end: vi.fn<() => Promise<void>>(async () => {})
  };
  const transactionExecute = vi.fn(async () => []);
  const database = {
    transaction: vi.fn(async (
      work: (transaction: { execute: typeof transactionExecute }) => Promise<unknown>
    ) => work({ execute: transactionExecute }))
  };
  const projectRepository = {
    findWorkspaceBySlug: vi.fn(),
    createWorkspace: vi.fn(),
    findProjectBySlug: vi.fn(),
    createProject: vi.fn(),
    getProject: vi.fn(),
    getLatestProjectKernel: vi.fn(),
    getProjectByRepoPath: vi.fn(),
    listRepoInstallationsForProject: vi.fn()
  };
  const sourceRepository: Partial<Pick<SourceRepository, "createSourceChunk">> = {};
  const drizzleSourceRepository = vi.fn(function DrizzleSourceRepository() {
    return sourceRepository;
  });

  return {
    client,
    database,
    transactionExecute,
    createKrnDatabase: vi.fn(() => database),
    postgres: vi.fn(() => client),
    projectRepository,
    harnessRunRepository: {},
    sourceRepository,
    sourceDecisionImportRepository: {},
    drizzleSourceRepository,
    retrievalRepository: {},
    memoryRepository: {},
    maintenanceQueueRepository: {},
    observationRepository: {}
  };
});

vi.mock("postgres", () => ({
  default: mocks.postgres
}));

vi.mock("@krn/db", () => ({
  createKrnDatabase: mocks.createKrnDatabase,
  sql: vi.fn()
}));

vi.mock("@krn/db/adapters", () => ({
  DrizzleProjectRepository: vi.fn(function DrizzleProjectRepository() {
    return mocks.projectRepository;
  }),
  DrizzleHarnessRunRepository: vi.fn(function DrizzleHarnessRunRepository() {
    return mocks.harnessRunRepository;
  }),
  DrizzleSourceRepository: mocks.drizzleSourceRepository,
  DrizzleSourceDecisionImportRepository: vi.fn(function DrizzleSourceDecisionImportRepository() {
    return mocks.sourceDecisionImportRepository;
  }),
  DrizzleRetrievalRepository: vi.fn(function DrizzleRetrievalRepository() {
    return mocks.retrievalRepository;
  }),
  DrizzleMemoryRepository: vi.fn(function DrizzleMemoryRepository() {
    return mocks.memoryRepository;
  }),
  DrizzleMaintenanceQueueRepository: vi.fn(function DrizzleMaintenanceQueueRepository() {
    return mocks.maintenanceQueueRepository;
  }),
  DrizzleObservationRepository: vi.fn(function DrizzleObservationRepository() {
    return mocks.observationRepository;
  }),
  DrizzleReflectionRepository: vi.fn(function DrizzleReflectionRepository() {
    return {};
  })
}));

const now = "2026-06-29T12:00:00.000Z";
const execFileAsync = promisify(execFile);

const project = {
  id: "project-1",
  workspaceId: "workspace-1",
  slug: "project",
  displayName: "project",
  metadata: {},
  createdAt: now,
  updatedAt: now
} satisfies ProjectRecord;

const projectKernel = {
  id: "project-kernel-1",
  projectId: project.id,
  version: 1,
  summary: "kernel",
  activeContextRule: "project scoped",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const createLinkedGitWorktree = async (): Promise<{
  readonly mainCheckout: string;
  readonly linkedWorktree: string;
}> => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "krn-runtime-worktree-"));
  const realParent = path.join(directory, "real");
  const aliasParent = path.join(directory, "alias");
  await mkdir(realParent);
  await symlink(realParent, aliasParent, process.platform === "win32" ? "junction" : "dir");

  const mainCheckout = path.join(aliasParent, "main-checkout");
  const linkedWorktree = path.join(aliasParent, "linked-worktree");

  await execFileAsync("git", ["init", "--quiet", "--initial-branch=main", mainCheckout]);
  await execFileAsync("git", ["config", "user.email", "krn-test@example.invalid"], {
    cwd: mainCheckout
  });
  await execFileAsync("git", ["config", "user.name", "KRN Test"], {
    cwd: mainCheckout
  });
  await writeFile(path.join(mainCheckout, "README.md"), "fixture\n");
  await execFileAsync("git", ["add", "README.md"], { cwd: mainCheckout });
  await execFileAsync("git", ["commit", "--quiet", "-m", "base"], {
    cwd: mainCheckout
  });
  await execFileAsync("git", ["worktree", "add", "--quiet", linkedWorktree, "HEAD"], {
    cwd: mainCheckout
  });

  return {
    mainCheckout,
    linkedWorktree
  };
};

describe("createDatabaseRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.postgres.mockReturnValue(mocks.client);
    mocks.projectRepository.findWorkspaceBySlug.mockResolvedValue({
      id: "workspace-1",
      slug: "workspace",
      displayName: "workspace",
      metadata: {},
      createdAt: now,
      updatedAt: now
    });
    mocks.projectRepository.findProjectBySlug.mockResolvedValue(project);
    mocks.projectRepository.getProjectByRepoPath.mockResolvedValue(undefined);
    mocks.projectRepository.getLatestProjectKernel.mockResolvedValue(undefined);
    mocks.projectRepository.listRepoInstallationsForProject.mockResolvedValue([]);
  });

  it("does not list repo installations before explicit project kernel failure", async () => {
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    mocks.projectRepository.getProject.mockResolvedValue(project);
    mocks.projectRepository.getLatestProjectKernel.mockResolvedValue(undefined);
    mocks.projectRepository.listRepoInstallationsForProject.mockRejectedValue(
      new Error("repo installations should not be loaded")
    );

    await expect(createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      projectId: "project-1",
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    })).rejects.toThrow("ProjectKernel not found for --project project-1");

    expect(mocks.projectRepository.listRepoInstallationsForProject).not.toHaveBeenCalled();
    expect(mocks.database.transaction).not.toHaveBeenCalled();
    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("does not lock fallback scope when a connected repo path resolves", async () => {
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    mocks.projectRepository.getProjectByRepoPath.mockResolvedValue(project);

    const runtime = await createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      repoPathHint: "/connected/repo",
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    });

    expect(runtime.projectResolution?.kind).toBe("connected_repo_path");
    expect(mocks.database.transaction).not.toHaveBeenCalled();
    expect(mocks.projectRepository.findWorkspaceBySlug).not.toHaveBeenCalled();
    await runtime.close();
  });

  it("resolves a linked git worktree to the registered main checkout project", async () => {
    const { mainCheckout, linkedWorktree } = await createLinkedGitWorktree();
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    mocks.projectRepository.getProjectByRepoPath.mockImplementation(
      async (repoPath: string) => repoPath === mainCheckout ? project : undefined
    );
    mocks.projectRepository.getLatestProjectKernel.mockResolvedValue(projectKernel);

    const runtime = await createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      repoPathHint: linkedWorktree,
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    });

    expect(runtime.projectId).toBe(project.id);
    expect(runtime.projectKernel).toEqual(projectKernel);
    expect(runtime.projectResolution).toMatchObject({
      kind: "connected_repo_path",
      repoPathHint: linkedWorktree
    });
    expect(mocks.projectRepository.getProjectByRepoPath).toHaveBeenCalledWith(linkedWorktree);
    expect(mocks.projectRepository.getProjectByRepoPath).toHaveBeenCalledWith(mainCheckout);
    expect(mocks.database.transaction).not.toHaveBeenCalled();
    expect(mocks.projectRepository.findWorkspaceBySlug).not.toHaveBeenCalled();
    await runtime.close();
  });

  it("fails closed instead of creating a slug fallback for an unrecognized same-name checkout", async () => {
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-shadow-project-"));
    const unrelatedCheckout = path.join(directory, "mise-en-palace");
    await mkdir(unrelatedCheckout);

    await expect(createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      repoPathHint: unrelatedCheckout,
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    })).rejects.toThrow(`No connected project found for repo path ${unrelatedCheckout}`);

    expect(mocks.database.transaction).not.toHaveBeenCalled();
    expect(mocks.projectRepository.findWorkspaceBySlug).not.toHaveBeenCalled();
    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("does not let requireConnectedRepoPath false create a repo-bound slug fallback", async () => {
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-shadow-project-"));
    const unrelatedCheckout = path.join(directory, "mise-en-palace");
    await mkdir(unrelatedCheckout);

    await expect(createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      repoPathHint: unrelatedCheckout,
      requireConnectedRepoPath: false,
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    })).rejects.toThrow(`No connected project found for repo path ${unrelatedCheckout}`);

    expect(mocks.database.transaction).not.toHaveBeenCalled();
    expect(mocks.projectRepository.findWorkspaceBySlug).not.toHaveBeenCalled();
    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("closes the database client when runtime initialization fails after project resolution", async () => {
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    mocks.projectRepository.getProject.mockResolvedValue(project);
    mocks.projectRepository.getLatestProjectKernel.mockResolvedValue(undefined);
    mocks.projectRepository.listRepoInstallationsForProject.mockRejectedValue(
      new Error("repo installation read failed")
    );

    await expect(createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      projectId: "project-1",
      requireProjectKernelForExplicitProject: false,
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    })).rejects.toThrow("repo installation read failed");

    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("closes the database client when observe runtime repository setup fails", async () => {
    const { createObserveDatabaseRuntime } = await import("../database-runtime.js");
    mocks.createKrnDatabase.mockImplementationOnce(() => {
      throw new Error("db init failed");
    });

    await expect(createObserveDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn"
    })).rejects.toThrow("db init failed");

    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("closes the database client when review assessment runtime setup fails", async () => {
    const { createReviewAssessDatabaseRuntime } = await import("../database-runtime.js");
    mocks.createKrnDatabase.mockImplementationOnce(() => {
      throw new Error("review db init failed");
    });

    await expect(createReviewAssessDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn"
    })).rejects.toThrow("review db init failed");

    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("closes the database client when reflect runtime repository setup fails", async () => {
    const { createReflectDatabaseRuntime } = await import("../database-runtime.js");
    mocks.drizzleSourceRepository.mockImplementationOnce(() => {
      throw new Error("reflect repository init failed");
    });

    await expect(createReflectDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn"
    })).rejects.toThrow("reflect repository init failed");

    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });

  it("exposes source chunk persistence through the CLI database runtime", async () => {
    const { createDatabaseRuntime } = await import("../database-runtime.js");
    const sourceChunk = {
      id: "source-chunk-1",
      sourceArtifactId: "source-artifact-1",
      ordinal: 1,
      content: "chunk",
      contentHash: "sha256:chunk",
      metadata: {},
      createdAt: now
    } satisfies SourceChunkRecord;
    const createSourceChunk = vi.fn(async () => sourceChunk);
    mocks.sourceRepository.createSourceChunk = createSourceChunk;

    const runtime = await createDatabaseRuntime({
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      workspaceSlug: "workspace",
      projectSlug: "project",
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`
    });

    await expect(runtime.sourceRepository.createSourceChunk?.({
      sourceArtifactId: "source-artifact-1",
      ordinal: 1,
      content: "chunk",
      contentHash: "sha256:chunk",
      metadata: {}
    })).resolves.toBe(sourceChunk);
    expect(createSourceChunk).toHaveBeenCalledTimes(1);
    expect(mocks.database.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.transactionExecute).toHaveBeenCalledTimes(1);
  });
});
