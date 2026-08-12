import {
  and,
  desc,
  eq
} from "drizzle-orm";
import type {
  ProjectId,
  WorkspaceId
} from "@krn/core";
import type {
  CreateProjectInput,
  CreateProjectKernelInput,
  CreateRepoInstallationInput,
  CreateWorkspaceInput,
  ProjectKernelRecord,
  ProjectRecord,
  ProjectRepository,
  RepoInstallationRecord,
  WorkspaceRecord
} from "@krn/core/repositories/internal";

import type {
  KrnSqliteDatabase
} from "../sqlite-database.js";
import {
  projectKernels,
  projects,
  repoInstallations,
  workspaces
} from "../schema/sqlite/harness.js";
import {
  mapProject,
  mapProjectKernel,
  mapRepoInstallation,
  mapWorkspace
} from "./mappers.js";
import {
  metadataOrEmpty
} from "./repository-value-readers.js";

const requireRow = <T>(rows: readonly T[], operation: string): T => {
  const row = rows[0];
  if (row === undefined) {
    throw new Error(`${operation} did not return a row`);
  }
  return row;
};

export class SqliteProjectRepository implements ProjectRepository {
  constructor(private readonly db: KrnSqliteDatabase) {}

  async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceRecord> {
    return mapWorkspace(requireRow(this.db.insert(workspaces).values({
      slug: input.slug,
      displayName: input.displayName,
      metadata: input.metadata ?? {}
    }).returning().all(), "createWorkspace"));
  }

  async findWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | undefined> {
    const row = this.db.query.workspaces.findFirst({ where: eq(workspaces.slug, slug) }).sync();
    return row === undefined ? undefined : mapWorkspace(row);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectRecord> {
    return mapProject(requireRow(this.db.insert(projects).values({
      workspaceId: input.workspaceId,
      slug: input.slug,
      displayName: input.displayName,
      ...(input.description === undefined ? {} : { description: input.description }),
      metadata: input.metadata ?? {}
    }).returning().all(), "createProject"));
  }

  async findProjectBySlug(workspaceId: WorkspaceId, slug: string): Promise<ProjectRecord | undefined> {
    const row = this.db.query.projects.findFirst({
      where: and(eq(projects.workspaceId, workspaceId), eq(projects.slug, slug))
    }).sync();
    return row === undefined ? undefined : mapProject(row);
  }

  async getProject(projectId: ProjectId): Promise<ProjectRecord | undefined> {
    const row = this.db.query.projects.findFirst({ where: eq(projects.id, projectId) }).sync();
    return row === undefined ? undefined : mapProject(row);
  }

  private projectByInstallation(where: ReturnType<typeof eq>): ProjectRecord | undefined {
    const rows = this.db.select({ project: projects })
      .from(repoInstallations)
      .innerJoin(projects, eq(repoInstallations.projectId, projects.id))
      .where(where)
      .all();
    const byId = new Map(rows.map(({ project }) => [project.id, project]));
    const row = byId.size === 1 ? byId.values().next().value : undefined;
    return row === undefined ? undefined : mapProject(row);
  }

  async getProjectByRepoFingerprint(repoFingerprint: string): Promise<ProjectRecord | undefined> {
    return this.projectByInstallation(eq(repoInstallations.repoFingerprint, repoFingerprint));
  }

  async getProjectByRepoPath(localPathHint: string): Promise<ProjectRecord | undefined> {
    return this.projectByInstallation(eq(repoInstallations.localPathHint, localPathHint));
  }

  async createRepoInstallation(input: CreateRepoInstallationInput): Promise<RepoInstallationRecord> {
    return mapRepoInstallation(requireRow(this.db.insert(repoInstallations).values({
      projectId: input.projectId,
      provider: input.provider,
      repoUrl: input.repoUrl,
      defaultBranch: input.defaultBranch,
      ...(input.repoFingerprint === undefined ? {} : { repoFingerprint: input.repoFingerprint }),
      ...(input.localPathHint === undefined ? {} : { localPathHint: input.localPathHint }),
      metadata: input.metadata ?? {}
    }).returning().all(), "createRepoInstallation"));
  }

  async listRepoInstallationsForProject(projectId: ProjectId): Promise<RepoInstallationRecord[]> {
    return this.db.query.repoInstallations.findMany({
      where: eq(repoInstallations.projectId, projectId),
      orderBy: desc(repoInstallations.createdAt)
    }).sync().map(mapRepoInstallation);
  }

  async createProjectKernel(input: CreateProjectKernelInput): Promise<ProjectKernelRecord> {
    return mapProjectKernel(requireRow(this.db.insert(projectKernels).values({
      projectId: input.projectId,
      version: input.version,
      summary: input.summary,
      activeContextRule: input.activeContextRule,
      metadata: input.metadata ?? {}
    }).returning().all(), "createProjectKernel"));
  }

  async getLatestProjectKernel(projectId: ProjectId): Promise<ProjectKernelRecord | undefined> {
    const row = this.db.query.projectKernels.findFirst({
      where: eq(projectKernels.projectId, projectId),
      orderBy: desc(projectKernels.version)
    }).sync();
    return row === undefined ? undefined : mapProjectKernel(row);
  }

  async cleanupFixtureProjectRecords(marker: string): Promise<number> {
    const rows = this.db.select({ id: workspaces.id, metadata: workspaces.metadata }).from(workspaces).all();
    const ids = rows
      .filter((row) => metadataOrEmpty(row.metadata).fixtureMarker === marker)
      .map((row) => row.id);
    for (const id of ids) {
      this.db.delete(workspaces).where(eq(workspaces.id, id)).run();
    }
    return ids.length;
  }
}
