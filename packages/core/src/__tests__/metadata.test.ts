import { describe, expect, it } from "vitest";

import {
  readMetadataObjectList,
  readMetadataString,
  readMetadataStringList
} from "../metadata.js";

describe("metadata readers", () => {
  it("reads non-empty string fields only", () => {
    expect(readMetadataString({ value: "kept" }, "value")).toBe("kept");
    expect(readMetadataString({ value: " " }, "value")).toBeUndefined();
    expect(readMetadataString({ value: 123 }, "value")).toBeUndefined();
    expect(readMetadataString({}, "value")).toBeUndefined();
  });

  it("reads string lists while dropping empty and non-string values", () => {
    expect(readMetadataStringList({
      value: ["one", "", "  ", 1, "two"]
    }, "value")).toEqual(["one", "two"]);
    expect(readMetadataStringList({ value: "one" }, "value")).toEqual([]);
  });

  it("reads object lists while dropping arrays and scalar values", () => {
    expect(readMetadataObjectList({
      value: [{ id: "one" }, ["two"], null, "three", { id: "four" }]
    }, "value")).toEqual([{ id: "one" }, { id: "four" }]);
    expect(readMetadataObjectList({ value: { id: "one" } }, "value")).toEqual([]);
  });
});
