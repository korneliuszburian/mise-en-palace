import { describe, expect, it, vi } from "vitest";

import { DrizzleProjectRepository } from "../drizzle-project-repository.js";

const methodNames = [
  "getProjectByRepoFingerprint",
  "getProjectByRepoPath",
  "listRepoInstallationsForProject",
  "cleanupFixtureProjectRecords"
] as const;

const projectRow = (id: string) => ({
  id,
  workspaceId: "workspace-1",
  slug: id,
  displayName: id,
  description: null,
  metadata: {},
  createdAt: new Date("2026-06-29T12:00:00.000Z"),
  updatedAt: new Date("2026-06-29T12:00:00.000Z")
});

const repositoryForProjectRows = (
  rows: readonly { project: ReturnType<typeof projectRow> }[]
): DrizzleProjectRepository => {
  const query = {
    where: vi.fn(async () => rows)
  };
  const join = {
    innerJoin: vi.fn(() => query)
  };
  const selection = {
    from: vi.fn(() => join)
  };
  const db = {
    select: vi.fn(() => selection)
  };

  return new DrizzleProjectRepository(db as never);
};

describe("DrizzleProjectRepository", () => {
  it("exposes M27 target repo registration methods", () => {
    const prototype = DrizzleProjectRepository.prototype as Record<string, unknown>;

    for (const methodName of methodNames) {
      expect(typeof prototype[methodName]).toBe("function");
    }
  });

  it("does not resolve an ambiguous repo path to the first matching project", async () => {
    const repository = repositoryForProjectRows([
      { project: projectRow("project-1") },
      { project: projectRow("project-2") }
    ]);

    await expect(repository.getProjectByRepoPath("/target/repo")).resolves.toBeUndefined();
  });
});
