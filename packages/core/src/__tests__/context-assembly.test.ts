import { describe, expect, expectTypeOf, it } from "vitest";

import {
  contextAssemblyCurrentStatuses
} from "../context-assembly.js";
import type {
  ContextAssemblyCurrentStatus,
  ContextAssemblyStatus
} from "../context-assembly.js";

describe("context assembly lifecycle status", () => {
  it("separates current assembly outcomes from historical lifecycle states", () => {
    expect(contextAssemblyCurrentStatuses).toEqual(["assembled", "abstained"]);
    expectTypeOf<ContextAssemblyCurrentStatus>().toEqualTypeOf<
      "assembled" | "abstained"
    >();
    expectTypeOf<Extract<ContextAssemblyStatus, "stale" | "superseded">>()
      .toEqualTypeOf<"stale" | "superseded">();
  });
});
