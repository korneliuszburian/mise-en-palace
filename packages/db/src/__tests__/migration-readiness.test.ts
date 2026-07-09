import { describe, expect, it } from "vitest";

import {
  compareMigrationIdentities,
  type MigrationIdentity
} from "../migration-readiness.js";

const migration = (hash: string, createdAt: string): MigrationIdentity => ({
  hash,
  createdAt
});

describe("compareMigrationIdentities", () => {
  it("accepts an exact ordered identity match", () => {
    expect(compareMigrationIdentities(
      [migration("hash-1", "100"), migration("hash-2", "200")],
      [migration("hash-1", "100"), migration("hash-2", "200")]
    )).toEqual({
      status: "verified",
      details: []
    });
  });

  it("reports missing, extra, reordered, and same-count mismatched migrations", () => {
    const expected = [migration("hash-1", "100"), migration("hash-2", "200")];

    expect(compareMigrationIdentities(expected, [expected[0]!])).toMatchObject({
      status: "missing"
    });
    expect(compareMigrationIdentities(expected, [expected[0]!, expected[1]!, migration("hash-3", "300")]))
      .toMatchObject({ status: "extra" });
    expect(compareMigrationIdentities(expected, [expected[1]!, expected[0]!])).toMatchObject({
      status: "reordered"
    });
    expect(compareMigrationIdentities(expected, [migration("different", "100"), expected[1]!]))
      .toMatchObject({ status: "mismatched" });
  });
});
