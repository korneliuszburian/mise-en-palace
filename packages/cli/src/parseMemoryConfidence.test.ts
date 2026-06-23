import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseMemoryConfidence
} from "./parseMemoryConfidence.js";

describe("parseMemoryConfidence", () => {
  it("parses shared memory confidence labels and integer ranges", () => {
    expect(parseMemoryConfidence("low")).toBe(40);
    expect(parseMemoryConfidence("medium")).toBe(70);
    expect(parseMemoryConfidence("high")).toBe(90);
    expect(parseMemoryConfidence("0")).toBe(0);
    expect(parseMemoryConfidence("100")).toBe(100);
    expect(parseMemoryConfidence(" 85 ")).toBe(85);
  });

  it("supports optional and defaulted confidence inputs", () => {
    expect(parseMemoryConfidence(undefined)).toBeUndefined();
    expect(parseMemoryConfidence("")).toBeUndefined();
    expect(parseMemoryConfidence(undefined, { defaultValue: 90 })).toBe(90);
    expect(parseMemoryConfidence(" ", { defaultValue: 90 })).toBe(90);
  });

  it("rejects non-integer, out-of-range, and unknown confidence values consistently", () => {
    expect(() => parseMemoryConfidence("70.5")).toThrow(
      "--confidence must be low, medium, high, or an integer 0-100"
    );
    expect(() => parseMemoryConfidence("101")).toThrow(
      "--confidence must be low, medium, high, or an integer 0-100"
    );
    expect(() => parseMemoryConfidence("-1")).toThrow(
      "--confidence must be low, medium, high, or an integer 0-100"
    );
    expect(() => parseMemoryConfidence("certain")).toThrow(
      "--confidence must be low, medium, high, or an integer 0-100"
    );
  });
});
