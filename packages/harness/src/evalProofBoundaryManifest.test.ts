import { readFileSync } from "node:fs";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  evalProofBoundaryManifest,
  renderEvalProofBoundaryReadback
} from "./evalProofBoundaryManifest.js";

const packageJsonPath = new URL("../../../package.json", import.meta.url);
const ciPath = new URL("../../../.github/workflows/ci.yml", import.meta.url);

const readRootFile = (path: URL): string => readFileSync(path, "utf8");

const packageScripts = (): Record<string, string> => {
  const parsed = JSON.parse(readRootFile(packageJsonPath)) as {
    scripts?: Record<string, string>;
  };

  return parsed.scripts ?? {};
};

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

  it("keeps manifest script names aligned with package.json", () => {
    const scripts = packageScripts();

    for (const entry of evalProofBoundaryManifest) {
      if (entry.scriptName === undefined) {
        continue;
      }

      expect(scripts[entry.scriptName]).toBeDefined();

      if (entry.command.startsWith("pnpm ")) {
        expect(entry.command).toContain(entry.scriptName);
      }
    }
  });

  it("keeps CI commands aligned with CI-scoped proof gates", () => {
    const ci = readRootFile(ciPath);

    for (const entry of evalProofBoundaryManifest) {
      if (entry.requiredFor.includes("ci-fast") || entry.requiredFor.includes("ci-db")) {
        expect(ci).toContain(entry.command);
      }
    }
  });

  it("keeps promptfoo and alpha verify scoped as non-authoritative", () => {
    const promptfoo = evalProofBoundaryManifest.find((entry) => entry.id === "promptfoo-smoke");
    const alphaVerify = evalProofBoundaryManifest.find((entry) =>
      entry.id === "alpha-verify-fast"
    );
    const alphaVerifyFull = evalProofBoundaryManifest.find((entry) =>
      entry.id === "alpha-verify-full"
    );

    expect(promptfoo?.proves.join(" ")).toContain("integration evidence");
    expect(promptfoo?.doesNotProve.join(" ")).toContain("KRN behavior passed");
    expect(promptfoo?.doesNotProve.join(" ")).toContain("GoldenTask behavior proof exists");

    expect(alphaVerify?.doesNotProve.join(" ")).toContain("Fallow changed-file audit passed");
    expect(alphaVerify?.doesNotProve.join(" ")).toContain("Promptfoo smoke passed");
    expect(alphaVerify?.doesNotProve.join(" ")).toContain("DB runtime truth exists");

    expect(alphaVerifyFull?.requiredFor).toContain("product-loop");
    expect(alphaVerifyFull?.proves.join(" ")).toContain("DB brain-loop smoke");
    expect(alphaVerifyFull?.doesNotProve.join(" ")).toContain("worker runtime execution exists");
    expect(alphaVerifyFull?.doesNotProve.join(" ")).toContain("KRN is product-ready");
  });

  it("renders a compact operator readback without changing proof authority", () => {
    const readback = renderEvalProofBoundaryReadback();

    expect(readback).toContain("# Evaluation Proof Boundary Manifest");
    expect(readback).toContain("| Gate | Command | Required For | Proves | Does Not Prove |");

    for (const entry of evalProofBoundaryManifest) {
      expect(readback).toContain(entry.id);
      expect(readback).toContain(entry.command);
    }
  });
});
