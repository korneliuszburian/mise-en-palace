import { describe, expect, it, vi, beforeEach } from "vitest";

import type {
  ProjectRecord
} from "@krn/harness/repositories/internal";

const mocks = vi.hoisted(() => {
  const client = {
    end: vi.fn<() => Promise<void>>(async () => {})
  };
  const projectRepository = {
    getProject: vi.fn(),
    getLatestProjectKernel: vi.fn(),
    listRepoInstallationsForProject: vi.fn()
  };

  return {
    client,
    createKrnDatabase: vi.fn(),
    postgres: vi.fn(() => client),
    projectRepository,
    harnessRunRepository: {},
    sourceRepository: {},
    retrievalRepository: {},
    memoryRepository: {},
    observationRepository: {}
  };
});

vi.mock("postgres", () => ({
  default: mocks.postgres
}));

vi.mock("@krn/db", () => ({
  createKrnDatabase: mocks.createKrnDatabase
}));

vi.mock("@krn/db/adapters", () => ({
  DrizzleProjectRepository: vi.fn(function DrizzleProjectRepository() {
    return mocks.projectRepository;
  }),
  DrizzleHarnessRunRepository: vi.fn(function DrizzleHarnessRunRepository() {
    return mocks.harnessRunRepository;
  }),
  DrizzleSourceRepository: vi.fn(function DrizzleSourceRepository() {
    return mocks.sourceRepository;
  }),
  DrizzleRetrievalRepository: vi.fn(function DrizzleRetrievalRepository() {
    return mocks.retrievalRepository;
  }),
  DrizzleMemoryRepository: vi.fn(function DrizzleMemoryRepository() {
    return mocks.memoryRepository;
  }),
  DrizzleObservationRepository: vi.fn(function DrizzleObservationRepository() {
    return mocks.observationRepository;
  }),
  DrizzleReflectionRepository: vi.fn(function DrizzleReflectionRepository() {
    return {};
  })
}));

const now = "2026-06-29T12:00:00.000Z";

const project = {
  id: "project-1",
  workspaceId: "workspace-1",
  slug: "project",
  displayName: "project",
  metadata: {},
  createdAt: now,
  updatedAt: now
} satisfies ProjectRecord;

describe("createDatabaseRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.postgres.mockReturnValue(mocks.client);
  });

  it("does not list repo installations before explicit project kernel failure", async () => {
    const { createDatabaseRuntime } = await import("./databaseRuntime.js");
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
    expect(mocks.client.end).toHaveBeenCalledTimes(1);
  });
});
