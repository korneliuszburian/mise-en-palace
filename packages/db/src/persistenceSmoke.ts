import postgres from "postgres";

import { createKrnDatabase } from "./database.js";
import { runMigrationReadinessCheck } from "./migrationReadiness.js";
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

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
};

export const runPersistenceSmokeCheck = async (
  input: PersistenceSmokeInput
): Promise<PersistenceSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for persistence smoke");
  }

  const workspaceSlug = `krn-smoke-${normalizeSlugPart(input.smokeId)}`;
  const projectSlug = "runtime-persistence";
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  let cleanedUp = false;

  try {
    const db = createKrnDatabase(client);
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
