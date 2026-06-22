import postgres from "postgres";
import { sql } from "drizzle-orm";

import { createKrnDatabase } from "./database.js";
import { runMigrationReadinessCheck } from "./migrationReadiness.js";
import { DrizzleProjectRepository } from "./repositories/index.js";
import {
  projectKernels,
  projects,
  repoInstallations,
  workspaces
} from "./schema/index.js";

export interface InitConnectSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
  targetRepoPath: string;
}

export interface InitConnectSmokeReport {
  workspaceSlug: string;
  projectId: string;
  readBackProjectIdByFingerprint: string;
  readBackProjectIdByPath: string;
  repoInstallationId: string;
  readBackRepoInstallationId: string;
  projectKernelId: string;
  readBackProjectKernelId: string;
  reusedProjectId: string;
  reusedRepoInstallationId: string;
  reusedProjectKernelId: string;
  repoInstallationCount: number;
  remainingMarkerCount: number;
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

const countMarkerRows = async (
  db: ReturnType<typeof createKrnDatabase>,
  marker: string
): Promise<number> => {
  const workspaceRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(sql`${workspaces.metadata}->>'fixtureMarker' = ${marker}`);
  const projectRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(sql`${projects.metadata}->>'fixtureMarker' = ${marker}`);
  const installationRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(repoInstallations)
    .where(sql`${repoInstallations.metadata}->>'fixtureMarker' = ${marker}`);
  const kernelRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectKernels)
    .where(sql`${projectKernels.metadata}->>'fixtureMarker' = ${marker}`);

  return (
    (workspaceRows[0]?.count ?? 0) +
    (projectRows[0]?.count ?? 0) +
    (installationRows[0]?.count ?? 0) +
    (kernelRows[0]?.count ?? 0)
  );
};

export const runInitConnectSmokeCheck = async (
  input: InitConnectSmokeInput
): Promise<InitConnectSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for init-connect smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-init-connect-smoke-${marker}`;
  const projectSlug = `typescript-basic-${marker}`;
  const repoFingerprint = `smoke:${marker}`;
  const smokePathHint = `${input.targetRepoPath}#${marker}`;
  const repoUrl = `file://${smokePathHint}`;
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);

  const cleanup = async (): Promise<number> => {
    await projectRepository.cleanupFixtureProjectRecords(marker);

    return countMarkerRows(db, marker);
  };

  try {
    await cleanup();

    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true,
        fixtureMarker: marker
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: "krn-fixture-typescript-basic",
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        repoFingerprint,
        repoPath: smokePathHint
      }
    });
    const repoInstallation = await projectRepository.createRepoInstallation({
      projectId: project.id,
      provider: "local",
      repoUrl,
      defaultBranch: "main",
      repoFingerprint,
      localPathHint: smokePathHint,
      metadata: {
        smoke: true,
        fixtureMarker: marker
      }
    });
    const projectKernel = await projectRepository.createProjectKernel({
      projectId: project.id,
      version: 1,
      summary: "Fixture target repo connected for KRN harness planning",
      activeContextRule: "select project-scoped source, memory, retrieval, and anti-memory only",
      metadata: {
        smoke: true,
        fixtureMarker: marker
      }
    });
    const byFingerprint = await projectRepository.getProjectByRepoFingerprint(repoFingerprint);
    const byPath = await projectRepository.getProjectByRepoPath(smokePathHint);
    const installations = await projectRepository.listRepoInstallationsForProject(project.id);
    const latestKernel = await projectRepository.getLatestProjectKernel(project.id);

    if (byFingerprint?.id !== project.id || byPath?.id !== project.id) {
      throw new Error("Init-connect smoke failed project lookup by repo identity");
    }

    if (installations[0]?.id !== repoInstallation.id || latestKernel?.id !== projectKernel.id) {
      throw new Error("Init-connect smoke failed installation/kernel readback");
    }

    const reusedProject =
      (await projectRepository.getProjectByRepoFingerprint(repoFingerprint)) ??
      (await projectRepository.getProjectByRepoPath(input.targetRepoPath));
    const reusedInstallations =
      reusedProject === undefined
        ? []
        : await projectRepository.listRepoInstallationsForProject(reusedProject.id);
    const reusedKernel =
      reusedProject === undefined
        ? undefined
        : await projectRepository.getLatestProjectKernel(reusedProject.id);

    if (
      reusedProject?.id !== project.id ||
      reusedInstallations[0]?.id !== repoInstallation.id ||
      reusedKernel?.id !== projectKernel.id
    ) {
      throw new Error("Init-connect smoke idempotency readback did not reuse records");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectId: project.id,
      readBackProjectIdByFingerprint: byFingerprint.id,
      readBackProjectIdByPath: byPath.id,
      repoInstallationId: repoInstallation.id,
      readBackRepoInstallationId: installations[0].id,
      projectKernelId: projectKernel.id,
      readBackProjectKernelId: latestKernel.id,
      reusedProjectId: reusedProject.id,
      reusedRepoInstallationId: reusedInstallations[0].id,
      reusedProjectKernelId: reusedKernel.id,
      repoInstallationCount: installations.length,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
