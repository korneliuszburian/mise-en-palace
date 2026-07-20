import { describe, expect, it } from "vitest";

import { evaluateFrontendCourseCardsSources } from "../internal/eval/frontend-course-cards-checker.js";

const governedHtml = `<!doctype html><html><head></head><body><main><section class="region" aria-labelledby="courses-title"><div class="wrapper flow"><h2 id="courses-title">Courses</h2><ul class="grid course-list" data-course-list><li data-course-card><a class="course-card flow" href="#course"><h3>CSS</h3><p data-course-copy>Build resilient layouts.</p></a></li></ul></div></section></main></body></html>`;
const governedCss = `.course-card { display:flex; flex-direction:column; gap:var(--course-card-space,1rem); padding:var(--course-card-space,1rem); border-radius:var(--course-card-radius,1rem); overflow-wrap:anywhere; }`;

describe("frontend course cards held-out source contract", () => {
  it("accepts the bounded intrinsic component contract", () => {
    expect(evaluateFrontendCourseCardsSources({ html: governedHtml, cardCss: governedCss, builtCss: governedCss }))
      .toEqual({ passed: true, failures: [] });
  });

  it("rejects a cargo-cult prefix and utility/breakpoint implementation", () => {
    const cargoCultCss = `.c-course-card:nth-child(2) { min-height:12rem; } @media (min-width:40rem) { .c-course-card { padding:2rem; } }`;
    const result = evaluateFrontendCourseCardsSources({
      html: governedHtml
        .replace('class="grid course-list"', 'class="c-grid grid-cols-1 md:grid-cols-3"')
        .replace('class="course-card flow"', 'class="c-course-card p-6 lg:p-10 min-h-20"'),
      cardCss: cargoCultCss,
      builtCss: cargoCultCss
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining([
      "The output must reuse the grid owner.",
      "Markup must not encode a utility-token architecture.",
      "CUBE must not be cargo-culted as c-/u- prefixes."
    ]));
  });

  it("rejects changed course identity and forbidden CSS moved into the global build", () => {
    const result = evaluateFrontendCourseCardsSources({
      initialHtml: governedHtml,
      html: governedHtml.replace("Build resilient layouts.", "Replacement copy."),
      cardCss: governedCss,
      builtCss: `${governedCss}\n@media (min-width:40rem){.course-card{min-height:12rem}}\n.course-card:nth-child(2){--course-card-extra:red}`
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining([
      "The supplied course links, headings, descriptions, and source order must be preserved.",
      "The card implementation must not fork by item position.",
      "The card implementation must remain intrinsically responsive.",
      "The card implementation must not force uniform copy height."
    ]));
  });

  it("ignores unrelated global rules but rejects a block implementation moved to global CSS", () => {
    const unrelatedGlobal = `body { min-height:100vh } @media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto } } .logos > :nth-child(2) { opacity:.8 }`;
    expect(evaluateFrontendCourseCardsSources({
      html: governedHtml,
      cardCss: governedCss,
      builtCss: `${unrelatedGlobal}\n${governedCss}`
    }).passed).toBe(true);

    const movedImplementation = evaluateFrontendCourseCardsSources({
      html: governedHtml,
      cardCss: `/* .course-card implementation lives elsewhere */ .course-card {}`,
      builtCss: governedCss
    });
    expect(movedImplementation.failures).toContain(
      "The course-card block stylesheet must own a load-bearing base rule and consume its API."
    );
  });
});
