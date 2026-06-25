import { describe, expect, it } from "vitest";

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
});
