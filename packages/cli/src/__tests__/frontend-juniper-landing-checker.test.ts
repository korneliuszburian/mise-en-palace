import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { renderFrontendObservationDocument } from "../internal/eval/frontend-held-out-browser-observer.js";
import { evaluateFrontendJuniperSources } from "../internal/eval/frontend-juniper-landing-checker.js";
import { runHeldOutTargetRepairChecker } from "../internal/eval/paired-live-codex-repair.js";

const html = `<!doctype html>
<html><body><header><a href="#main">School</a></header><main id="main">
<section aria-labelledby="intro"><h1 id="intro">Learn coffee</h1><p>Introduction</p></section>
<section aria-labelledby="programs"><h2 id="programs">Programs</h2><ul data-program-list><li><article><h3><a href="#one">One</a></h3><p>Details</p></article></li></ul></section>
<section aria-labelledby="visit"><h2 id="visit">Visit</h2><p>Address</p></section>
</main><footer><address>Juniper Yard</address></footer></body></html>`;

describe("frontend Juniper landing checker", () => {
  it("renders the checker-owned text scale into the browser document", () => {
    expect(renderFrontendObservationDocument("<html><head></head><body></body></html>", "", "", 175))
      .toContain("html{font-size:175%}");
  });

  it("distinguishes governed ownership and resilience from a merely valid starter", () => {
    const starter = evaluateFrontendJuniperSources({
      html,
      initialHtml: html,
      css: ":root{--ink:#111;--paper:#fff} [data-program-list] article{color:var(--ink)}"
    });
    expect(starter.checks.filter((check) => check.passed).map((check) => check.name))
      .toEqual(["frontend_semantics", "frontend_css_ownership", "frontend_code_budget"]);

    const governed = evaluateFrontendJuniperSources({
      html,
      initialHtml: html,
      css: `
        :root {
          --ink: #111; --paper: #fff; --accent: #a30; --line: #ccc;
          --space-s: .5rem; --space-m: 1rem; --space-l: 2rem; --measure: 65ch;
        }
        html { scroll-behavior: smooth; }
        [data-program-list] article {
          --surface: var(--paper);
          color: var(--ink); background: var(--surface, #fff);
        }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
      `
    });
    expect(governed.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "frontend_semantics", passed: true }),
      expect.objectContaining({ name: "frontend_css_ownership", passed: true }),
      expect.objectContaining({ name: "frontend_component_api", passed: true }),
      expect.objectContaining({ name: "frontend_intrinsic_resilience", passed: true }),
      expect.objectContaining({ name: "frontend_code_budget", passed: true })
    ]));
  });

  it("invalidates a clean Juniper-shaped target when it is not the frozen commit", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-juniper-wrong-commit-"));
    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src/index.html"), html, "utf8");
      await writeFile(join(root, "src/styles.css"), ":root{color:black}", "utf8");
      await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { build: "true", check: "true" } }), "utf8");
      for (const args of [
        ["init", "--quiet"],
        ["config", "user.email", "checker@example.invalid"],
        ["config", "user.name", "Juniper checker"],
        ["add", "."],
        ["commit", "--quiet", "-m", "different clean target"]
      ]) execFileSync("git", args, { cwd: root });
      const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

      const score = await runHeldOutTargetRepairChecker({
        family: "frontend-juniper-landing",
        targetRoot: root,
        checkerRoot: process.cwd(),
        initialCommit: commit
      });

      expect(score.status).toBe("invalid");
      expect(score.checks).toContainEqual(expect.objectContaining({
        name: "preflight",
        passed: false,
        details: expect.stringContaining("preregistered write ownership")
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
