import { desc, eq, and } from "drizzle-orm";
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
} from "@krn/harness";
import type { ProjectId, WorkspaceId } from "@krn/core";

import type { KrnDatabase } from "../database.js";
import {
  projectKernels,
  projects,
  repoInstallations,
  workspaces
} from "../schema/index.js";
import { requireReturnedRow } from "./common.js";
import {
  mapProject,
  mapProjectKernel,
  mapRepoInstallation,
  mapWorkspace
} from "./mappers.js";

export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(workspaces)
        .values({
          slug: input.slug,
          displayName: input.displayName,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createWorkspace"
    );

    return mapWorkspace(row);
  }

  async findWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | undefined> {
    const row = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.slug, slug)
    });

    return row === undefined ? undefined : mapWorkspace(row);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(projects)
        .values({
          workspaceId: input.workspaceId,
          slug: input.slug,
          displayName: input.displayName,
          ...(input.description === undefined ? {} : { description: input.description }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createProject"
    );

    return mapProject(row);
  }

  async findProjectBySlug(
    workspaceId: WorkspaceId,
    slug: string
  ): Promise<ProjectRecord | undefined> {
    const row = await this.db.query.projects.findFirst({
      where: and(eq(projects.workspaceId, workspaceId), eq(projects.slug, slug))
    });

    return row === undefined ? undefined : mapProject(row);
  }

  async getProject(projectId: ProjectId): Promise<ProjectRecord | undefined> {
    const row = await this.db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    return row === undefined ? undefined : mapProject(row);
  }

  async createRepoInstallation(
    input: CreateRepoInstallationInput
  ): Promise<RepoInstallationRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(repoInstallations)
        .values({
          projectId: input.projectId,
          provider: input.provider,
          repoUrl: input.repoUrl,
          defaultBranch: input.defaultBranch,
          ...(input.localPathHint === undefined ? {} : { localPathHint: input.localPathHint }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createRepoInstallation"
    );

    return mapRepoInstallation(row);
  }

  async createProjectKernel(input: CreateProjectKernelInput): Promise<ProjectKernelRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(projectKernels)
        .values({
          projectId: input.projectId,
          version: input.version,
          summary: input.summary,
          activeContextRule: input.activeContextRule,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createProjectKernel"
    );

    return mapProjectKernel(row);
  }

  async getLatestProjectKernel(projectId: ProjectId): Promise<ProjectKernelRecord | undefined> {
    const row = await this.db.query.projectKernels.findFirst({
      where: eq(projectKernels.projectId, projectId),
      orderBy: desc(projectKernels.version)
    });

    return row === undefined ? undefined : mapProjectKernel(row);
  }
}
