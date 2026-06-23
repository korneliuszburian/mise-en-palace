import {
  z
} from "zod";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  MetadataSchema,
  NonEmptyTextListSchema,
  OptionalTextSchema,
  RequiredTextSchema,
  TextListSchema,
  privateReasoningMetadataKeys,
  rejectForbiddenMetadataKeys
} from "./schemaPrimitives.js";

describe("schemaPrimitives", () => {
  it("exports shared metadata, text, and text-list schemas", () => {
    expect(MetadataSchema.parse(undefined)).toEqual({});
    expect(RequiredTextSchema.parse("  value  ")).toBe("value");
    expect(OptionalTextSchema.parse(undefined)).toBeUndefined();
    expect(TextListSchema.parse(undefined)).toEqual([]);
    expect(TextListSchema.parse([" one ", "two"])).toEqual(["one", "two"]);
    expect(NonEmptyTextListSchema.parse([" ref "])).toEqual(["ref"]);
    expect(() => NonEmptyTextListSchema.parse([])).toThrow();
  });

  it("rejects shared private reasoning metadata keys with caller-owned messages", () => {
    const TestSchema = z
      .object({
        metadata: MetadataSchema
      })
      .superRefine((value, context) => {
        rejectForbiddenMetadataKeys(value.metadata, context, {
          keys: privateReasoningMetadataKeys,
          message: "metadata cannot store private reasoning"
        });
      });

    expect(() => TestSchema.parse({
      metadata: {
        chainOfThought: "hidden"
      }
    })).toThrow("metadata cannot store private reasoning");
  });
});
