import { describe, expect, it } from "vitest";

import {
  parseJsonObject
} from "../brain-search-readback.js";

describe("brainSearchReadback", () => {
  it("parses brain-search child output as an unknown-first JSON object", () => {
    const parsed = parseJsonObject("{\"kind\":\"readback\",\"count\":1}", "memory search");

    expect(parsed["kind"]).toBe("readback");
    expect(parsed["count"]).toBe(1);
  });

  it("rejects non-object brain-search child JSON", () => {
    expect(() => parseJsonObject("[]", "memory search")).toThrow(
      "memory search JSON output must be an object"
    );
    expect(() => parseJsonObject("null", "memory search")).toThrow(
      "memory search JSON output must be an object"
    );
  });
});
