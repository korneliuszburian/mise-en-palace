import {
  link,
  mkdir,
  mkdtemp,
  symlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  inspectTargetKrnArtifacts
} from "@krn/db";

const fixture = async (): Promise<{ root: string; krn: string }> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "krn-governed-artifacts-"));
  const krn = path.join(root, ".krn");
  await mkdir(krn);
  return { root, krn };
};

describe("inspectTargetKrnArtifacts", () => {
  it("allows only the governed SQLite database and adjacent WAL sidecars", async () => {
    const { root, krn } = await fixture();
    await writeFile(path.join(krn, "memory.db"), "db");
    await writeFile(path.join(krn, "memory.db-wal"), "wal");
    await writeFile(path.join(krn, "memory.db-shm"), "shm");

    await expect(inspectTargetKrnArtifacts(root)).resolves.toEqual({
      status: "allowed",
      artifacts: ["memory.db", "memory.db-shm", "memory.db-wal"]
    });
  });

  it("rejects other runtime truth and orphan sidecars", async () => {
    const notes = await fixture();
    await writeFile(path.join(notes.krn, "notes.md"), "not governed");
    await expect(inspectTargetKrnArtifacts(notes.root)).resolves.toMatchObject({
      status: "forbidden",
      reason: "unexpected_entry",
      entry: "notes.md"
    });

    const orphan = await fixture();
    await writeFile(path.join(orphan.krn, "memory.db-wal"), "wal");
    await expect(inspectTargetKrnArtifacts(orphan.root)).resolves.toMatchObject({
      status: "forbidden",
      reason: "orphan_sidecar"
    });
  });

  it("rejects symbolic and multiply-hardlinked governed names", async () => {
    const symbolic = await fixture();
    const outside = path.join(symbolic.root, "outside-wal");
    await writeFile(path.join(symbolic.krn, "memory.db"), "db");
    await writeFile(outside, "wal");
    await symlink(outside, path.join(symbolic.krn, "memory.db-wal"));
    await expect(inspectTargetKrnArtifacts(symbolic.root)).resolves.toMatchObject({
      status: "forbidden",
      entry: "memory.db-wal"
    });

    const hardlinked = await fixture();
    const hardlinkTarget = path.join(hardlinked.root, "outside-db");
    await writeFile(hardlinkTarget, "db");
    await link(hardlinkTarget, path.join(hardlinked.krn, "memory.db"));
    await expect(inspectTargetKrnArtifacts(hardlinked.root)).resolves.toMatchObject({
      status: "forbidden",
      reason: "multiple_hard_links",
      entry: "memory.db"
    });
  });
});
