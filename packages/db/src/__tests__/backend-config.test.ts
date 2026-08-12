import path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveBackendConfig } from "../backend-config.js";

const targetWorkspace = path.resolve("/tmp/krn-target");

describe("resolveBackendConfig", () => {
  it("defaults to the governed SQLite artifact in the target workspace", () => {
    expect(resolveBackendConfig({ env: {}, targetWorkspace })).toEqual({
      kind: "sqlite",
      dbPath: path.join(targetWorkspace, ".krn", "memory.db"),
      storeIdentity: `sqlite:${path.join(targetWorkspace, ".krn", "memory.db")}`
    });
  });

  it("uses explicit values before environment values", () => {
    expect(resolveBackendConfig({
      backend: "sqlite",
      dbPath: "state/explicit.db",
      env: {
        KRN_DB_BACKEND: "postgres",
        KRN_DB_PATH: "state/environment.db",
        KRN_DATABASE_URL: "postgres://environment"
      },
      targetWorkspace
    })).toMatchObject({
      kind: "sqlite",
      dbPath: path.join(targetWorkspace, "state", "explicit.db")
    });
  });

  it("uses environment selection before the SQLite default", () => {
    expect(resolveBackendConfig({
      env: { KRN_DB_PATH: "state/environment.db" },
      targetWorkspace
    })).toMatchObject({
      kind: "sqlite",
      dbPath: path.join(targetWorkspace, "state", "environment.db")
    });

    expect(resolveBackendConfig({
      env: {
        KRN_DB_BACKEND: "postgres",
        KRN_DATABASE_URL: "postgres://krn:secret@localhost/krn"
      },
      targetWorkspace
    })).toMatchObject({
      kind: "postgres",
      databaseUrl: "postgres://krn:secret@localhost/krn"
    });
  });

  it("preserves KRN_DATABASE_URL for an explicitly selected Postgres backend", () => {
    expect(resolveBackendConfig({
      backend: "postgres",
      env: {
        KRN_DB_BACKEND: "sqlite",
        KRN_DATABASE_URL: "postgres://krn:secret@localhost/krn"
      },
      targetWorkspace
    })).toMatchObject({
      kind: "postgres",
      databaseUrl: "postgres://krn:secret@localhost/krn"
    });
  });

  it("rejects unknown backends and Postgres-only path confusion", () => {
    expect(() => resolveBackendConfig({
      backend: "mysql",
      env: {},
      targetWorkspace
    })).toThrow("Unsupported KRN database backend: mysql");

    expect(() => resolveBackendConfig({
      backend: "postgres",
      dbPath: "memory.db",
      env: {},
      targetWorkspace
    })).toThrow("--db-path is only valid with the sqlite backend");

    expect(() => resolveBackendConfig({
      backend: " ",
      env: { KRN_DB_BACKEND: "postgres" },
      targetWorkspace
    })).toThrow("--backend requires a non-empty value");
  });

  it("rejects non-governed SQLite artifacts under the target .krn directory", () => {
    expect(() => resolveBackendConfig({
      dbPath: ".krn/custom.db",
      env: {},
      targetWorkspace
    })).toThrow("must use the governed artifact");

    expect(() => resolveBackendConfig({
      dbPath: ".krn/nested/memory.db",
      env: {},
      targetWorkspace
    })).toThrow("must use the governed artifact");
  });
});
