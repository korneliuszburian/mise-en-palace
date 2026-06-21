import postgres from "postgres";
import {
  createKrnDatabase,
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "@krn/db";
import type {
  HarnessCompilerDependencies,
  HarnessRunRepository,
  SourceRepository
} from "@krn/harness";

export interface DatabaseRuntimeInput {
  databaseUrl: string;
  workspaceSlug: string;
  projectSlug: string;
  now(): string;
  createId(prefix: string): string;
}

export interface DatabaseRuntime {
  workspaceId: string;
  projectId: string;
  compilerDependencies: HarnessCompilerDependencies;
  harnessRunRepository: Pick<
    HarnessRunRepository,
    | "createExecutionRun"
    | "getHarnessRunByExecutionRunId"
    | "createEvidenceBundle"
    | "createReviewAssessment"
    | "createFeedbackDelta"
  >;
  sourceRepository: Pick<
    SourceRepository,
    "createSourceArtifact" | "createSourceClaim"
  >;
  close(): Promise<void>;
}

export const createDatabaseRuntime = async (
  input: DatabaseRuntimeInput
): Promise<DatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);
  const sourceRepository = new DrizzleSourceRepository(db);
  const existingWorkspace = await projectRepository.findWorkspaceBySlug(input.workspaceSlug);
  const workspace =
    existingWorkspace ??
    (await projectRepository.createWorkspace({
      slug: input.workspaceSlug,
      displayName: input.workspaceSlug
    }));
  const existingProject = await projectRepository.findProjectBySlug(
    workspace.id,
    input.projectSlug
  );
  const project =
    existingProject ??
    (await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: input.projectSlug,
      displayName: input.projectSlug
    }));

  return {
    workspaceId: workspace.id,
    projectId: project.id,
    compilerDependencies: {
      harnessRunRepository,
      memoryRepository: new DrizzleMemoryRepository(db),
      sourceRepository,
      retrievalRepository: new DrizzleRetrievalRepository(db),
      now: input.now,
      createId: input.createId
    },
    harnessRunRepository,
    sourceRepository,
    async close(): Promise<void> {
      await client.end();
    }
  };
};
