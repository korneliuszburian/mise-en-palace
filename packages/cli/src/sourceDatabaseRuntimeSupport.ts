import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

type SourceCommandDatabaseRuntimeFactory = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const createSourceDatabaseRuntimeInput = async (input: {
  databaseUrl: string;
  commandProjectId?: string;
  cwd: string;
  requireProjectKernelForExplicitProject?: boolean;
  now: () => string;
  createId: (prefix: string) => string;
}): Promise<DatabaseRuntimeInput> => ({
  databaseUrl: input.databaseUrl,
  workspaceSlug: defaultWorkspaceSlug,
  projectSlug: defaultProjectSlug,
  ...(input.commandProjectId === undefined ? {} : { projectId: input.commandProjectId }),
  ...(input.requireProjectKernelForExplicitProject === undefined
    ? {}
    : { requireProjectKernelForExplicitProject: input.requireProjectKernelForExplicitProject }),
  repoPathHint: await findRepoRoot(input.cwd),
  now: input.now,
  createId: input.createId
});

export const createSourceCommandDatabaseRuntime = async (input: {
  createRuntime: SourceCommandDatabaseRuntimeFactory;
  databaseUrl: string;
  commandProjectId: string | undefined;
  cwd: string;
  requireProjectKernelForExplicitProject?: boolean;
  now: () => string;
  createId: (prefix: string) => string;
}): Promise<DatabaseRuntime> =>
  input.createRuntime(await createSourceDatabaseRuntimeInput({
    databaseUrl: input.databaseUrl,
    cwd: input.cwd,
    ...(input.commandProjectId === undefined ? {} : { commandProjectId: input.commandProjectId }),
    ...(input.requireProjectKernelForExplicitProject === undefined
      ? {}
      : { requireProjectKernelForExplicitProject: input.requireProjectKernelForExplicitProject }),
    now: input.now,
    createId: input.createId
  }));
