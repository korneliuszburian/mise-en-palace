import {
  access,
  mkdtemp,
  rm
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  runCli
} from "../run-cli.js";

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) =>
    rm(fixture, { recursive: true, force: true })
  ));
});

describe("SQLite DB commands", () => {
  it("keeps readiness read-only, then migrates the package-owned schema idempotently", async () => {
    const targetWorkspace = await mkdtemp(path.join(os.tmpdir(), "krn-sqlite-db-command-"));
    fixtures.push(targetWorkspace);
    const dbPath = path.join(targetWorkspace, ".krn", "memory.db");
    const runtime = {
      cwd: process.cwd(),
      env: { INIT_CWD: targetWorkspace },
      now: () => "2026-08-12T10:00:00.000Z",
      createId: (prefix: string) => `${prefix}-sqlite-db-command`
    };

    const missing = await runCli(["db", "readiness", "--backend", "sqlite"], runtime);
    expect(missing.exitCode).toBe(1);
    expect(missing.stdout).toContain("SQLite/migrations: failed");
    await expect(access(path.dirname(dbPath))).rejects.toThrow();

    const migrated = await runCli(["db", "migrate", "--backend", "sqlite"], runtime);
    expect(migrated).toMatchObject({ exitCode: 0, stderr: "" });
    expect(migrated.stdout).toContain("Migrations folder: @krn/db/sqlite-migrations");
    expect(migrated.stdout).toContain("Migrations identity: verified");
    expect(migrated.stdout).toContain("Repository reachability: ready");

    const repeated = await runCli(["db", "migrate", "--backend", "sqlite"], runtime);
    expect(repeated.exitCode).toBe(0);
    expect(repeated.stdout).toContain("Migrations identity: verified");

    const ready = await runCli(["db", "readiness", "--backend", "sqlite"], runtime);
    expect(ready).toMatchObject({ exitCode: 0, stderr: "" });
    expect(ready.stdout).toContain("Migrations folder: @krn/db/sqlite-migrations");
    expect(ready.stdout).toContain("SQLite schema: present");
    expect(ready.stdout).toContain("Memory store readiness: ready");
  }, 30_000);
});
