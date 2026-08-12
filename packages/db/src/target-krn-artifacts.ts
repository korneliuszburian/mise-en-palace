import {
  constants
} from "node:fs";
import {
  lstat,
  open,
  readdir
} from "node:fs/promises";
import path from "node:path";

const allowedArtifactNames = [
  "memory.db",
  "memory.db-wal",
  "memory.db-shm"
] as const;

export type GovernedKrnArtifactName = (typeof allowedArtifactNames)[number];

export type TargetKrnArtifactsResult =
  | {
      status: "absent" | "allowed";
      artifacts: readonly GovernedKrnArtifactName[];
    }
  | {
      status: "forbidden" | "unverifiable";
      reason: string;
      entry?: string;
    };

const allowedArtifactSet = new Set<string>(allowedArtifactNames);

const sameIdentity = (
  left: { dev: bigint; ino: bigint },
  right: { dev: bigint; ino: bigint }
): boolean => left.dev === right.dev && left.ino === right.ino;

const errorReason = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown filesystem error";

const inspectArtifact = async (
  krnPath: string,
  name: GovernedKrnArtifactName
): Promise<TargetKrnArtifactsResult | { status: "valid"; dev: bigint; ino: bigint }> => {
  const artifactPath = path.join(krnPath, name);

  try {
    const before = await lstat(artifactPath, { bigint: true });
    if (before.isSymbolicLink() || !before.isFile()) {
      return {
        status: "forbidden",
        reason: before.isSymbolicLink() ? "symbolic_link" : "not_regular_file",
        entry: name
      };
    }

    if (before.nlink !== 1n) {
      return {
        status: "forbidden",
        reason: "multiple_hard_links",
        entry: name
      };
    }

    const noFollow = constants.O_NOFOLLOW ?? 0;
    const nonBlock = constants.O_NONBLOCK ?? 0;
    const handle = await open(artifactPath, constants.O_RDONLY | noFollow | nonBlock);

    try {
      const opened = await handle.stat({ bigint: true });
      const after = await lstat(artifactPath, { bigint: true });

      if (
        !opened.isFile() ||
        opened.nlink !== 1n ||
        after.isSymbolicLink() ||
        !after.isFile() ||
        after.nlink !== 1n ||
        !sameIdentity(before, opened) ||
        !sameIdentity(opened, after)
      ) {
        return {
          status: "forbidden",
          reason: "artifact_identity_changed",
          entry: name
        };
      }

      return {
        status: "valid",
        dev: opened.dev,
        ino: opened.ino
      };
    } finally {
      await handle.close();
    }
  } catch (error) {
    return {
      status: "unverifiable",
      reason: errorReason(error),
      entry: name
    };
  }
};

export const inspectTargetKrnArtifacts = async (
  targetWorkspace: string
): Promise<TargetKrnArtifactsResult> => {
  const krnPath = path.join(targetWorkspace, ".krn");
  let directoryBefore;

  try {
    directoryBefore = await lstat(krnPath, { bigint: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { status: "absent", artifacts: [] };
    }

    return { status: "unverifiable", reason: errorReason(error) };
  }

  if (directoryBefore.isSymbolicLink() || !directoryBefore.isDirectory()) {
    return {
      status: "forbidden",
      reason: directoryBefore.isSymbolicLink() ? "krn_symbolic_link" : "krn_not_directory"
    };
  }

  const noFollow = constants.O_NOFOLLOW ?? 0;
  const directoryOnly = constants.O_DIRECTORY ?? 0;
  let directoryHandle;

  try {
    directoryHandle = await open(
      krnPath,
      constants.O_RDONLY | noFollow | directoryOnly
    );
  } catch (error) {
    return { status: "unverifiable", reason: errorReason(error) };
  }

  try {
    const openedDirectory = await directoryHandle.stat({ bigint: true });
    if (!openedDirectory.isDirectory() || !sameIdentity(directoryBefore, openedDirectory)) {
      return { status: "forbidden", reason: "krn_directory_identity_changed" };
    }

    const names = (await readdir(krnPath)).sort();
    const unexpected = names.find((name) => !allowedArtifactSet.has(name));
    if (unexpected !== undefined) {
      return {
        status: "forbidden",
        reason: "unexpected_entry",
        entry: unexpected
      };
    }

    if (
      (names.includes("memory.db-wal") || names.includes("memory.db-shm")) &&
      !names.includes("memory.db")
    ) {
      return { status: "forbidden", reason: "orphan_sidecar" };
    }

    const artifacts = names as GovernedKrnArtifactName[];
    const identities = new Set<string>();
    for (const artifact of artifacts) {
      const inspected = await inspectArtifact(krnPath, artifact);
      if (inspected.status !== "valid") {
        return inspected;
      }

      const identity = `${inspected.dev}:${inspected.ino}`;
      if (identities.has(identity)) {
        return {
          status: "forbidden",
          reason: "duplicate_artifact_identity",
          entry: artifact
        };
      }
      identities.add(identity);
    }

    const namesAfter = (await readdir(krnPath)).sort();
    const directoryAfter = await lstat(krnPath, { bigint: true });
    if (
      JSON.stringify(namesAfter) !== JSON.stringify(names) ||
      directoryAfter.isSymbolicLink() ||
      !directoryAfter.isDirectory() ||
      !sameIdentity(openedDirectory, directoryAfter)
    ) {
      return { status: "forbidden", reason: "krn_directory_changed_during_inspection" };
    }

    return { status: "allowed", artifacts };
  } catch (error) {
    return { status: "unverifiable", reason: errorReason(error) };
  } finally {
    await directoryHandle.close();
  }
};

export const targetKrnArtifactsAreForbidden = (
  result: TargetKrnArtifactsResult
): result is Extract<TargetKrnArtifactsResult, { status: "forbidden" | "unverifiable" }> =>
  result.status === "forbidden" || result.status === "unverifiable";
