import {
  createSmokeDatabase,
  ensureSmokeBrainStoreReady,
  normalizeSmokeSlugPart
} from "./dbSmokeSupport.js";
import { DrizzleProjectRepository } from "./repositories/index.js";

export interface PersistenceSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface PersistenceSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  projectId: string;
  readBackProjectId: string;
  cleanedUp: boolean;
}

export const runPersistenceSmokeCheck = async (
  input: PersistenceSmokeInput
): Promise<PersistenceSmokeReport> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    "persistence smoke"
  );

  const workspaceSlug = `krn-smoke-${normalizeSmokeSlugPart(input.smokeId)}`;
  const projectSlug = "runtime-persistence";
  const { client, db } = createSmokeDatabase(input.databaseUrl);
  let cleanedUp = false;

  try {
    const projectRepository = new DrizzleProjectRepository(db);

    await client`
      delete from workspaces
      where slug = ${workspaceSlug}
    `;

    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: projectSlug,
      metadata: {
        smoke: true
      }
    });
    const readBackProject = await projectRepository.findProjectBySlug(
      workspace.id,
      projectSlug
    );

    if (readBackProject === undefined || readBackProject.id !== project.id) {
      throw new Error("Persistence smoke failed to read back inserted project");
    }

    await client`
      delete from workspaces
      where id = ${workspace.id}
    `;
    cleanedUp = true;

    return {
      workspaceSlug,
      projectSlug,
      projectId: project.id,
      readBackProjectId: readBackProject.id,
      cleanedUp
    };
  } finally {
    if (!cleanedUp) {
      await client`
        delete from workspaces
        where slug = ${workspaceSlug}
      `;
    }

    await client.end();
  }
};
