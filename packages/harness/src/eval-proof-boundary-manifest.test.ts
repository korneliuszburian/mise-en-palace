import {
  describe,
  expect,
  it
} from "vitest";

import {
  evalProofBoundaryManifest,
} from "./eval-proof-boundary-manifest.js";

describe("eval proof boundary manifest", () => {
  it("keeps every gate tied to proof and non-proof boundaries", () => {
    for (const entry of evalProofBoundaryManifest) {
      expect(entry.id.trim().length).toBeGreaterThan(0);
      expect(entry.command.trim().length).toBeGreaterThan(0);
      expect(entry.owner.trim().length).toBeGreaterThan(0);
      expect(entry.requiredFor.length).toBeGreaterThan(0);
      expect(entry.proves.length).toBeGreaterThan(0);
      expect(entry.doesNotProve.length).toBeGreaterThan(0);

      expect(entry.proves.join(" ")).not.toMatch(/product-ready|product readiness/iu);
      expect(entry.doesNotProve.join(" ")).toMatch(/KRN is product-ready/iu);
    }
  });
});
