import { sql } from "drizzle-orm";

import type { KrnDatabase } from "./database.js";
import {
  createSmokeDatabase,
  ensureSmokeBrainStoreReady,
  normalizeSmokeSlugPart
} from "./dbSmokeSupport.js";
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
  refreshedProjectKernelId: string;
  refreshedProjectKernelVersion: number;
  refreshedOwnerFilePaths: string[];
  repoInstallationCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface IdentifiedRecord {
  id: string;
}

interface VersionedProjectKernel extends IdentifiedRecord {
  version: number;
  metadata: Record<string, unknown>;
}

interface InitConnectInitialReadback {
  readBackProjectIdByFingerprint: string;
  readBackProjectIdByPath: string;
  readBackRepoInstallationId: string;
  readBackProjectKernelId: string;
}

interface InitConnectReuseReadback {
  reusedProjectId: string;
  reusedRepoInstallationId: string;
  reusedProjectKernelId: string;
  reusedKernelVersion: number;
}

interface InitConnectRefreshReadback {
  refreshedProjectKernelId: string;
  refreshedProjectKernelVersion: number;
  refreshedOwnerFilePaths: string[];
}

const countMarkerRows = async (
  db: KrnDatabase,
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

const assertInitialInitConnectReadback = (
  byFingerprint: IdentifiedRecord | undefined,
  byPath: IdentifiedRecord | undefined,
  projectId: string,
  installations: readonly IdentifiedRecord[],
  repoInstallationId: string,
  latestKernel: IdentifiedRecord | undefined,
  projectKernelId: string
): InitConnectInitialReadback => {
  if (byFingerprint?.id !== projectId || byPath?.id !== projectId) {
    throw new Error("Init-connect smoke failed project lookup by repo identity");
  }

  if (installations[0]?.id !== repoInstallationId || latestKernel?.id !== projectKernelId) {
    throw new Error("Init-connect smoke failed installation/kernel readback");
  }

  return {
    readBackProjectIdByFingerprint: byFingerprint.id,
    readBackProjectIdByPath: byPath.id,
    readBackRepoInstallationId: installations[0].id,
    readBackProjectKernelId: latestKernel.id
  };
};

const readInitConnectReuse = async (
  projectRepository: DrizzleProjectRepository,
  repoFingerprint: string,
  fallbackPath: string
): Promise<{
  reusedProject: IdentifiedRecord | undefined;
  reusedInstallations: readonly IdentifiedRecord[];
  reusedKernel: VersionedProjectKernel | undefined;
}> => {
  const reusedProject =
    (await projectRepository.getProjectByRepoFingerprint(repoFingerprint)) ??
    (await projectRepository.getProjectByRepoPath(fallbackPath));
  const reusedInstallations =
    reusedProject === undefined
      ? []
      : await projectRepository.listRepoInstallationsForProject(reusedProject.id);
  const reusedKernel =
    reusedProject === undefined
      ? undefined
      : await projectRepository.getLatestProjectKernel(reusedProject.id);

  return {
    reusedProject,
    reusedInstallations,
    reusedKernel
  };
};

const assertInitConnectReuse = (
  reuse: Awaited<ReturnType<typeof readInitConnectReuse>>,
  projectId: string,
  repoInstallationId: string,
  projectKernelId: string
): InitConnectReuseReadback => {
  if (
    reuse.reusedProject?.id !== projectId ||
    reuse.reusedInstallations[0]?.id !== repoInstallationId ||
    reuse.reusedKernel?.id !== projectKernelId
  ) {
    throw new Error("Init-connect smoke idempotency readback did not reuse records");
  }

  return {
    reusedProjectId: reuse.reusedProject.id,
    reusedRepoInstallationId: reuse.reusedInstallations[0].id,
    reusedProjectKernelId: reuse.reusedKernel.id,
    reusedKernelVersion: reuse.reusedKernel.version
  };
};

const extractOwnerFilePaths = (
  ownerFiles: unknown
): string[] => (
  Array.isArray(ownerFiles)
    ? ownerFiles.flatMap((ownerFile) => {
        if (
          typeof ownerFile === "object" &&
          ownerFile !== null &&
          !Array.isArray(ownerFile) &&
          "path" in ownerFile &&
          typeof ownerFile.path === "string"
        ) {
          return [ownerFile.path];
        }

        return [];
      })
    : []
);

const assertRefreshedProjectKernelReadback = (
  latestRefreshedKernel: VersionedProjectKernel | undefined,
  refreshedKernel: VersionedProjectKernel,
  previousKernelVersion: number,
  expectedOwnerFilePaths: readonly string[]
): InitConnectRefreshReadback => {
  const latestOwnerFilePaths = extractOwnerFilePaths(latestRefreshedKernel?.metadata.ownerFiles);

  if (
    latestRefreshedKernel === undefined ||
    latestRefreshedKernel.id !== refreshedKernel.id ||
    latestRefreshedKernel.version !== previousKernelVersion + 1 ||
    latestOwnerFilePaths.join(",") !== expectedOwnerFilePaths.join(",")
  ) {
    throw new Error("Init-connect smoke failed refreshed ProjectKernel readback");
  }

  return {
    refreshedProjectKernelId: refreshedKernel.id,
    refreshedProjectKernelVersion: refreshedKernel.version,
    refreshedOwnerFilePaths: expectedOwnerFilePaths.slice()
  };
};

export const runInitConnectSmokeCheck = async (
  input: InitConnectSmokeInput
): Promise<InitConnectSmokeReport> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    "init-connect smoke"
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const workspaceSlug = `krn-init-connect-smoke-${marker}`;
  const projectSlug = `typescript-basic-${marker}`;
  const repoFingerprint = `smoke:${marker}`;
  const smokePathHint = `${input.targetRepoPath}#${marker}`;
  const repoUrl = `file://${smokePathHint}`;
  const refreshedOwnerFiles = [
    {
      path: "src/index.ts",
      root: "src",
      kind: "implementation_entry",
      reason: "refreshed owner-file snapshot"
    },
    {
      path: "tests/readiness.test.ts",
      root: "tests",
      kind: "behavior_test",
      reason: "refreshed owner-file snapshot"
    }
  ];
  const { client, db } = createSmokeDatabase(input.databaseUrl);
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
    const initialReadback = assertInitialInitConnectReadback(
      byFingerprint,
      byPath,
      project.id,
      installations,
      repoInstallation.id,
      latestKernel,
      projectKernel.id
    );
    const reuseReadback = assertInitConnectReuse(
      await readInitConnectReuse(projectRepository, repoFingerprint, input.targetRepoPath),
      project.id,
      repoInstallation.id,
      projectKernel.id
    );

    const refreshedKernel = await projectRepository.createProjectKernel({
      projectId: project.id,
      version: reuseReadback.reusedKernelVersion + 1,
      summary: "Fixture target repo refreshed for KRN harness planning",
      activeContextRule: "select project-scoped source, memory, retrieval, and anti-memory only",
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        repoFingerprint,
        repoPath: smokePathHint,
        ownerFiles: refreshedOwnerFiles
      }
    });
    const latestRefreshedKernel = await projectRepository.getLatestProjectKernel(project.id);
    const refreshReadback = assertRefreshedProjectKernelReadback(
      latestRefreshedKernel,
      refreshedKernel,
      projectKernel.version,
      refreshedOwnerFiles.map((ownerFile) => ownerFile.path)
    );

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectId: project.id,
      readBackProjectIdByFingerprint: initialReadback.readBackProjectIdByFingerprint,
      readBackProjectIdByPath: initialReadback.readBackProjectIdByPath,
      repoInstallationId: repoInstallation.id,
      readBackRepoInstallationId: initialReadback.readBackRepoInstallationId,
      projectKernelId: projectKernel.id,
      readBackProjectKernelId: initialReadback.readBackProjectKernelId,
      reusedProjectId: reuseReadback.reusedProjectId,
      reusedRepoInstallationId: reuseReadback.reusedRepoInstallationId,
      reusedProjectKernelId: reuseReadback.reusedProjectKernelId,
      refreshedProjectKernelId: refreshReadback.refreshedProjectKernelId,
      refreshedProjectKernelVersion: refreshReadback.refreshedProjectKernelVersion,
      refreshedOwnerFilePaths: refreshReadback.refreshedOwnerFilePaths,
      repoInstallationCount: installations.length,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
