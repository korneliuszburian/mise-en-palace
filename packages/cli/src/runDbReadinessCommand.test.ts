import { describe, expect, it } from "vitest";

import {
  dbBootstrapDoesNotProve,
  missingDbConfigRecovery,
  unreachablePostgresRecovery
} from "./dbRecoveryGuidance.js";
import {
  redactedPostgresEndpoint
} from "./runDbReadinessCommand.js";

describe("DB readiness command", () => {
  it("redacts credentials and non-endpoint URL parts from Postgres endpoint output", () => {
    expect(
      redactedPostgresEndpoint(
        "postgres://krn:secret@localhost:54329/krn?sslmode=disable#token"
      )
    ).toBe("postgres://localhost:54329/krn");
  });

  it("does not echo an invalid KRN_DATABASE_URL value", () => {
    expect(redactedPostgresEndpoint("not a database url")).toBe(
      "unparseable KRN_DATABASE_URL"
    );
  });

  it("renders actionable recovery commands for local DB bootstrap states", () => {
    expect(missingDbConfigRecovery()).toBe(
      "export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:ready"
    );
    expect(unreachablePostgresRecovery()).toBe(
      "docker compose up -d krn-postgres; docker compose ps krn-postgres; pnpm db:ready"
    );
    expect(dbBootstrapDoesNotProve).toBe(
      "starting Postgres does not prove migrations, pgvector, or persistence until pnpm db:ready and pnpm db:smoke pass"
    );
  });
});
