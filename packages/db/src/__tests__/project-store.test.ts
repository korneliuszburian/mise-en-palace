import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const {
  migrateDatabase,
  openPostgresClient
} = vi.hoisted(() => ({
  migrateDatabase: vi.fn(),
  openPostgresClient: vi.fn(() => {
    throw new Error("Postgres write client opened before migration identity gate");
  })
}));

vi.mock("../migration-readiness.js", () => ({
  migrateDatabase
}));

vi.mock("postgres", () => ({
  default: openPostgresClient
}));

import {
  openProjectStore
} from "../project-store.js";

describe("openProjectStore", () => {
  beforeEach(() => {
    migrateDatabase.mockReset();
    openPostgresClient.mockClear();
  });

  it("rejects a mismatched Postgres migration identity before opening a write client", async () => {
    migrateDatabase.mockResolvedValue({
      migrationsFolder: "migrations",
      expectedMigrationCount: 61,
      appliedMigrationCount: 61,
      migrationTablePresent: true,
      migrationIdentityStatus: "mismatched",
      migrationIdentityDetails: ["tampered migration hash"],
      migrationsVerified: false,
      pgvectorAvailable: true,
      postgresServerVersion: "17"
    });

    await expect(openProjectStore({
      kind: "postgres",
      databaseUrl: "postgres://krn:krn@localhost:54329/krn",
      storeIdentity: "postgres://localhost:54329/krn"
    })).rejects.toThrow("Postgres store is not ready: migration identity mismatched");
    expect(openPostgresClient).not.toHaveBeenCalled();
  });
});
