import {
  lstat,
  mkdtemp,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  migrateSqliteDatabase,
  openKrnSqliteDatabase
} from "@krn/db";
import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  workspaces
} from "../../../db/src/schema/sqlite/harness.js";
import {
  runDoctorCommand
} from "../run-doctor-command.js";

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) =>
    rm(fixture, { recursive: true, force: true })
  ));
});

const createStore = async (): Promise<{ root: string; dbPath: string }> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "krn-sqlite-doctor-"));
  fixtures.push(root);
  const dbPath = path.join(root, ".krn", "memory.db");
  await migrateSqliteDatabase(dbPath);
  return { root, dbPath };
};

describe("SQLite doctor", () => {
  it("passes a healthy open WAL store and leaves runtime proofs unverified", async () => {
    const { root, dbPath } = await createStore();
    const connection = await openKrnSqliteDatabase(dbPath);
    try {
      connection.db.insert(workspaces).values({
        slug: "wal-doctor",
        displayName: "WAL doctor",
        metadata: {}
      }).run();
      await expect(lstat(`${dbPath}-wal`)).resolves.toMatchObject({});
      await expect(lstat(`${dbPath}-shm`)).resolves.toMatchObject({});

      const result = await runDoctorCommand({
        cwd: process.cwd(),
        env: { INIT_CWD: root },
        backend: "sqlite"
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("SQLite connectivity: reachable");
      expect(result.stdout).toContain("Migrations: applied");
      expect(result.stdout).toContain("SQLite schema: present");
      expect(result.stdout).toContain("Repository reachability: ready");
      expect(result.stdout).toContain("Memory store readiness: ready");
      expect(result.stdout).toContain("Activation readiness: runtime_unverified");
      expect(result.stdout).toContain(".krn runtime truth: governed SQLite artifacts only");
    } finally {
      connection.close();
    }
  });

  it("fails for Markdown runtime truth under .krn", async () => {
    const { root, dbPath } = await createStore();
    await writeFile(path.join(path.dirname(dbPath), "notes.md"), "not governed", "utf8");

    const result = await runDoctorCommand({
      cwd: process.cwd(),
      env: { INIT_CWD: root },
      backend: "sqlite"
    });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain(".krn runtime truth: present");
    expect(result.stdout).toContain("Forbidden surfaces: present");
  });

  it("fails closed for a symlinked WAL sidecar", async () => {
    const { root, dbPath } = await createStore();
    const outside = path.join(root, "outside-wal");
    await writeFile(outside, "not a governed sidecar", "utf8");
    await symlink(outside, `${dbPath}-wal`);

    const result = await runDoctorCommand({
      cwd: process.cwd(),
      env: { INIT_CWD: root },
      backend: "sqlite"
    });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("SQLite connectivity: failed (forbidden .krn artifact: symbolic_link (memory.db-wal))");
    expect(result.stdout).toContain(".krn runtime truth: present");
  });
});
