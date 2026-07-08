import { describe, expect, it } from "vitest";

import { mapLockedRowMetadataFields } from "../locked-row-metadata.js";

const createdAt = new Date("2026-06-30T04:00:00.000Z");
const updatedAt = new Date("2026-06-30T04:05:00.000Z");

describe("locked row metadata mapper", () => {
  it("omits unlocked optional fields", () => {
    expect(
      mapLockedRowMetadataFields({
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        createdAt,
        updatedAt
      })
    ).toEqual({
      createdAt: "2026-06-30T04:00:00.000Z",
      updatedAt: "2026-06-30T04:05:00.000Z"
    });
  });

  it("maps locked and failed fields", () => {
    expect(
      mapLockedRowMetadataFields({
        lockedAt: new Date("2026-06-30T04:01:00.000Z"),
        lockedBy: "runner-1",
        lastError: "retry later",
        createdAt,
        updatedAt
      })
    ).toEqual({
      lockedAt: "2026-06-30T04:01:00.000Z",
      lockedBy: "runner-1",
      lastError: "retry later",
      createdAt: "2026-06-30T04:00:00.000Z",
      updatedAt: "2026-06-30T04:05:00.000Z"
    });
  });
});
