import { describe, expect, it } from "vitest";

import { inspectRequiredTablePresence } from "./readiness-support.js";

describe("inspectRequiredTablePresence", () => {
  it("classifies present and missing tables in required order", async () => {
    const inspection = await inspectRequiredTablePresence(
      ["present_one", "missing_one", "present_two"],
      async (tableName) => tableName.startsWith("present")
    );

    expect(inspection).toEqual({
      requiredTables: ["present_one", "missing_one", "present_two"],
      presentTables: ["present_one", "present_two"],
      missingTables: ["missing_one"],
      requiredTableCount: 3,
      presentTableCount: 2,
      schemaReady: false
    });
  });

  it("marks schema ready only when every required table is present", async () => {
    await expect(
      inspectRequiredTablePresence(["one", "two"], async () => true)
    ).resolves.toMatchObject({
      missingTables: [],
      requiredTableCount: 2,
      presentTableCount: 2,
      schemaReady: true
    });
  });
});
