import type { ProjectId, WorkspaceId } from "@krn/core";

import type {
  CreateProjectInput,
  CreateProjectKernelInput,
  CreateRepoInstallationInput,
  CreateWorkspaceInput,
  ProjectKernelRecord,
  ProjectRecord,
  RepoInstallationRecord,
  WorkspaceRecord
} from "./types.js";

export interface ProjectRepository {
  createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceRecord>;
  findWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | undefined>;
  createProject(input: CreateProjectInput): Promise<ProjectRecord>;
  findProjectBySlug(workspaceId: WorkspaceId, slug: string): Promise<ProjectRecord | undefined>;
  getProject(projectId: ProjectId): Promise<ProjectRecord | undefined>;
  getProjectByRepoFingerprint(repoFingerprint: string): Promise<ProjectRecord | undefined>;
  getProjectByRepoPath(localPathHint: string): Promise<ProjectRecord | undefined>;
  createRepoInstallation(input: CreateRepoInstallationInput): Promise<RepoInstallationRecord>;
  listRepoInstallationsForProject(projectId: ProjectId): Promise<RepoInstallationRecord[]>;
  createProjectKernel(input: CreateProjectKernelInput): Promise<ProjectKernelRecord>;
  getLatestProjectKernel(projectId: ProjectId): Promise<ProjectKernelRecord | undefined>;
  cleanupFixtureProjectRecords(marker: string): Promise<number>;
}
