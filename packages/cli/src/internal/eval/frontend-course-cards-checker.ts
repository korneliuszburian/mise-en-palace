import type {
  CommandResult,
  HeldOutArmScore,
  HeldOutCheckerInput,
  HeldOutCheck,
  TargetChangeManifest
} from "./paired-live-codex-repair.js";
import {
  createFrontendBrowserObservations,
  frontendCommandPassed as passed,
  invalidFrontendPreflightScore,
  readOptionalFrontendFile as readOptional,
  renderFrontendObservationDocument,
  runFrontendBrowserObservations,
  skippedFrontendCommand as skipped
} from "./frontend-held-out-browser-observer.js";
import {
  captureHeldOutTargetState,
  type HeldOutRunCommand
} from "./held-out-target-state.js";

type RunCommand = HeldOutRunCommand;

const htmlPath = "index.html";
const cardPath = "css/blocks/course-card.css";
const globalCssPath = "css/global.css";
const builtCssPath = "dist/global.css";
const allowedFiles = new Set([htmlPath, cardPath, globalCssPath]);
const timeoutMs = 120_000;

const courseSeam = /(?:\.course-card\b|\[data-course-card\]|\.course-list\b)/u;

const cssRuleEntries = (css: string): readonly { readonly selector: string; readonly body: string }[] =>
  [...css.replace(/\/\*[\s\S]*?\*\//gu, "").matchAll(/([^{}]+)\{([^{}]*)\}/gu)]
    .map((match) => ({ selector: (match[1] ?? "").trim(), body: match[2] ?? "" }));

const motionPreferenceMedia = /^@media\s*\(\s*prefers-reduced-motion\s*:\s*(?:reduce|no-preference)\s*\)\s*$/iu;
const motionOnlyDeclaration = /^(?:animation|transition)(?:-[a-z-]+)?\s*:/iu;
const changesOnlyMotion = (body: string): boolean => body
  .split(";")
  .map((declaration) => declaration.trim())
  .filter((declaration) => declaration.length > 0)
  .every((declaration) => motionOnlyDeclaration.test(declaration));

const closingBraceOffset = (source: string, open: number): number => {
  let depth = 1;
  for (let cursor = open + 1; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") depth -= 1;
    if (depth === 0) return cursor + 1;
  }
  return source.length;
};

const courseMediaCreatesLayoutFork = (css: string): boolean => {
  const source = css.replace(/\/\*[\s\S]*?\*\//gu, "");
  const normalizedSource = source.toLowerCase();
  let cursor = 0;
  while ((cursor = normalizedSource.indexOf("@media", cursor)) >= 0) {
    const open = normalizedSource.indexOf("{", cursor + "@media".length);
    if (open < 0) return false;
    const close = closingBraceOffset(source, open);
    const body = source.slice(open + 1, close - 1);
    const courseRules = cssRuleEntries(body).filter((rule) => courseSeam.test(rule.selector));
    if (courseRules.length > 0) {
      const prelude = source.slice(cursor, open).trim();
      const isMotionOnlyPreference = motionPreferenceMedia.test(prelude) &&
        courseRules.every((rule) => changesOnlyMotion(rule.body));
      if (!isMotionOnlyPreference) return true;
    }
    cursor = close;
  }
  return false;
};

const ownedTarget = (manifest: TargetChangeManifest): boolean =>
  manifest.status === "known" &&
  manifest.headMatchesInitialCommit === true &&
  manifest.forbiddenFiles.length === 0 &&
  !manifest.statusOutput.split("\n").some((line) => line.length >= 2 && line[0] !== " " && line[0] !== "?");

export type FrontendCourseCardsSourceResult = {
  readonly passed: boolean;
  readonly failures: readonly string[];
};

export const evaluateFrontendCourseCardsSources = (input: {
  readonly html: string;
  readonly initialHtml?: string;
  readonly cardCss: string;
  readonly builtCss: string;
}): FrontendCourseCardsSourceResult => {
  const failures: string[] = [];
  const require = (condition: boolean, message: string): void => {
    if (!condition) failures.push(message);
  };
  const utilityToken = /(?:^|\s)(?:sm:|md:|lg:|xl:|2xl:|hover:|group-hover:)?(?:grid-cols-|flex(?:-\w+)?|items-|justify-|gap-\d|p[trblxy]?-\d|m[trblxy]?-\d|w-\d|h-\d|min-h-|max-w-|text-(?:\d|[a-z])|bg-|rounded-|shadow-|border(?:-|$)|transition-|duration-|translate-)/u;
  const classValues = [...input.html.matchAll(/class=["']([^"']*)["']/gu)].map((match) => match[1] ?? "");
  const publicVariables = [...new Set([...input.builtCss.matchAll(/--course-card-[a-z0-9-]+/gu)].map((match) => match[0]))];
  const builtCourseRules = cssRuleEntries(input.builtCss).filter((rule) => courseSeam.test(rule.selector));
  const ownedBaseRule = cssRuleEntries(input.cardCss).find((rule) =>
    rule.selector.split(",").some((selector) => selector.trim() === ".course-card")
  );
  const courseIdentities = (html: string): readonly string[] =>
    [...html.matchAll(/<li\b[^>]*data-course-card[^>]*>([\s\S]*?)<\/li>/gu)].map((match) => {
      const card = match[1] ?? "";
      const href = card.match(/<a\b[^>]*href=["']([^"']+)["']/u)?.[1] ?? "";
      const heading = card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/u)?.[1]?.replace(/<[^>]+>/gu, "").trim() ?? "";
      const copy = card.match(/<p\b[^>]*data-course-copy[^>]*>([\s\S]*?)<\/p>/u)?.[1]?.replace(/<[^>]+>/gu, "").trim() ?? "";
      return JSON.stringify([href, heading, copy]);
    });

  require(/<section\b[^>]*aria-labelledby=/u.test(input.html), "The course-card region must have an accessible section name.");
  require(/<ul\b/u.test(input.html) && /<li\b/u.test(input.html), "The repeated course collection must use list semantics.");
  require(/<a\b[^>]*href=["'][^"']+["']/u.test(input.html) && /<h3\b/u.test(input.html), "Each course card must expose a named link and heading.");
  require(/data-course-card\b/u.test(input.html), "The stable repeated card seam must be machine-observable.");
  if (input.initialHtml !== undefined) {
    require(
      JSON.stringify(courseIdentities(input.html)) === JSON.stringify(courseIdentities(input.initialHtml)),
      "The supplied course links, headings, descriptions, and source order must be preserved."
    );
  }
  for (const token of ["grid", "flow", "wrapper", "region", "course-card"]) {
    require(classValues.some((value) => value.split(/\s+/u).includes(token)), `The output must reuse the ${token} owner.`);
  }
  require(!classValues.some((value) => value.split(/\s+/u).some((token) => utilityToken.test(token))), "Markup must not encode a utility-token architecture.");
  require(!/(?:^|\s)(?:c|u)-[a-z]/mu.test(classValues.join(" ")), "CUBE must not be cargo-culted as c-/u- prefixes.");
  require(
    ownedBaseRule !== undefined &&
      /[a-z-]+\s*:/u.test(ownedBaseRule.body) &&
      /var\(\s*--course-card-[a-z0-9-]+\s*,/u.test(ownedBaseRule.body),
    "The course-card block stylesheet must own a load-bearing base rule and consume its API."
  );
  require(
    !builtCourseRules.some((rule) => /:nth-(?:child|of-type)\s*\(/u.test(rule.selector)),
    "The card implementation must not fork by item position."
  );
  require(!courseMediaCreatesLayoutFork(input.builtCss), "The card implementation must remain intrinsically responsive.");
  require(
    !builtCourseRules.some((rule) => /\b(?:min-)?height\s*:/u.test(rule.body)),
    "The card implementation must not force uniform copy height."
  );
  require(publicVariables.length >= 1 && publicVariables.length <= 8, "The course-card API must expose between one and eight bounded variables.");
  require(publicVariables.every((name) => new RegExp(`var\\(\\s*${name}\\s*,`, "u").test(input.builtCss)), "Every course-card variable must be consumed with a fallback.");
  require(/\.course-card\b/u.test(input.builtCss), "The public CSS build must contain the course-card block.");
  return { passed: failures.length === 0, failures };
};

const browserDocument = (html: string, css: string, count: number): string => {
  const script = `
const expectedCount=${count};
const list=document.querySelector('ul');
const seed=list?.querySelector('[data-course-card]');
if(list&&seed){while(list.children.length<expectedCount)list.append(seed.cloneNode(true));while(list.children.length>expectedCount)list.lastElementChild.remove();}
[...document.querySelectorAll('[data-course-card]')].forEach((card,index)=>{const heading=card.querySelector('h3');const copy=card.querySelector('[data-course-copy]');const link=card.querySelector('a');if(heading)heading.textContent=index===1?'Projektowanie odpornych interfejsów dla bardzo złożonych produktów':('Moduł '+(index+1));if(copy)copy.textContent=index===2?'supercalifragilisticexpialidocioussupercalifragilisticexpialidocious':index===3?'':'Praktyczny opis modułu';if(link)link.href='#module-'+index;});
const cards=[...document.querySelectorAll('[data-course-card]')];
const nodes=[...document.querySelectorAll('body *')];
const fits=document.documentElement.scrollWidth<=window.innerWidth+1&&nodes.every(node=>node.getBoundingClientRect().right<=window.innerWidth+1&&node.getBoundingClientRect().left>=-1);
const named=cards.every(card=>{const link=card.querySelector('a');return link&&link.textContent.trim().length>0;});
const ordered=cards.every((card,index)=>card.querySelector('a')?.getAttribute('href')==='#module-'+index);
document.body.dataset.layoutOk=String(cards.length===expectedCount&&fits&&named&&ordered);`;
  return renderFrontendObservationDocument(html, css, script, 150);
};

const runRenderMatrix = async (
  input: HeldOutCheckerInput,
  runCommand: RunCommand,
  html: string,
  css: string
): Promise<CommandResult> => {
  const observations = createFrontendBrowserObservations({
    counts: [1, 3, 8], widths: [320, 480, 768, 1440], height: 1200,
    documentForCount: (count) => browserDocument(html, css, count)
  });
  const observed = await runFrontendBrowserObservations({
    checkerRoot: input.checkerRoot,
    runCommand,
    filePrefix: "frontend-course-cards",
    observations,
    timeoutMs
  });
  const failures: string[] = [];
  for (const observation of observations) {
    const stdout = observed.stdoutById.get(observation.id);
    if (stdout !== undefined && !/data-layout-ok="true"/u.test(stdout)) failures.push(`layout:${observation.id.replace("-", ":")}`);
  }
  return {
    ...observed.command,
    command: "frontend-course-cards-render-matrix",
    args: ["counts=1,3,8", "widths=320,480,768,1440", "text=150%"],
    exitCode: observed.command.exitCode === 0 && failures.length === 0 ? 0 : 1,
    stdout: failures.length === 0 ? "All 12 content and viewport observations passed." : "",
    stderr: [observed.command.stderr, ...failures].filter(Boolean).join(", ")
  };
};

const observeRenderMatrix = async (input: {
  readonly checkerInput: HeldOutCheckerInput;
  readonly runCommand: RunCommand;
  readonly html: string;
  readonly css: string;
  readonly prerequisitesPassed: boolean;
}): Promise<CommandResult> => input.prerequisitesPassed
  ? runRenderMatrix(input.checkerInput, input.runCommand, input.html, input.css)
  : skipped("frontend-course-cards-render-matrix", "public build or HTML syntax failed");

export const runFrontendCourseCardsChecker = async (
  input: HeldOutCheckerInput,
  runCommand: RunCommand
): Promise<HeldOutArmScore> => {
  const before = await captureHeldOutTargetState(input, runCommand, (path) => allowedFiles.has(path));
  if (!ownedTarget(before)) return invalidFrontendPreflightScore("frontend-course-cards", before);

  const [cssBuild, htmlSyntax, diffCheck] = await Promise.all([
    runCommand("npm", ["run", "css"], input.targetRoot, { env: { ...process.env, CI: "1" }, timeoutMs }),
    runCommand("node", ["scripts/check-html.mjs"], input.targetRoot, { env: { ...process.env, CI: "1" }, timeoutMs }),
    runCommand("git", ["diff", "--check"], input.targetRoot, { timeoutMs })
  ]);
  const initialHtmlRead = await runCommand("git", ["show", `${input.initialCommit}:${htmlPath}`], input.targetRoot, { timeoutMs });
  const [html, cardCss, builtCss] = await Promise.all([
    readOptional(input.targetRoot, htmlPath),
    readOptional(input.targetRoot, cardPath),
    passed(cssBuild) ? readOptional(input.targetRoot, builtCssPath) : Promise.resolve("")
  ]);
  const evaluatedSources = evaluateFrontendCourseCardsSources({
    html,
    ...(passed(initialHtmlRead) ? { initialHtml: initialHtmlRead.stdout } : {}),
    cardCss,
    builtCss
  });
  const sourceResult = passed(initialHtmlRead)
    ? evaluatedSources
    : {
        passed: false,
        failures: [...evaluatedSources.failures, "The initial course identity could not be read from the frozen target commit."]
      };
  const runtime = await observeRenderMatrix({
    checkerInput: input,
    runCommand,
    html,
    css: builtCss,
    prerequisitesPassed: passed(cssBuild) && passed(htmlSyntax)
  });
  const after = await captureHeldOutTargetState(input, runCommand, (path) => allowedFiles.has(path));
  const checks: HeldOutCheck[] = [
    { name: "preflight", passed: ownedTarget(after), details: ownedTarget(after) ? "All target changes are owned and inside the preregistered example boundary." : "Target identity, staging state, or write boundary was violated." },
    { name: "forbidden_files", passed: after.forbiddenFiles.length === 0, details: after.forbiddenFiles.length === 0 ? "Only preregistered example files changed." : `Forbidden target changes: ${after.forbiddenFiles.join(", ")}` },
    { name: "target_typecheck", passed: passed(htmlSyntax), details: passed(htmlSyntax) ? "The example HTML passed its deterministic syntax/landmark check." : "The example HTML failed its syntax/landmark check." },
    { name: "target_test", passed: passed(cssBuild), details: passed(cssBuild) ? "The dependency-free public CSS build passed." : "The public CSS build failed." },
    { name: "target_diff_check", passed: passed(diffCheck), details: passed(diffCheck) ? "The target diff passed whitespace validation." : "The target diff failed whitespace validation." },
    { name: "family_contract", passed: sourceResult.passed, details: sourceResult.passed ? "Course cards satisfy the bounded semantic, ownership, and resilience contract." : sourceResult.failures.join(" ") },
    { name: "held_out_runtime", passed: passed(runtime), details: passed(runtime) ? runtime.stdout : `Content/viewport matrix failed: ${runtime.stderr}` }
  ];
  const validityNames = new Set<HeldOutCheck["name"]>(["preflight", "forbidden_files", "target_typecheck", "target_test", "target_diff_check", "held_out_runtime"]);
  const invalid = checks.some((check) => validityNames.has(check.name) && !check.passed);
  return {
    status: invalid ? "invalid" : sourceResult.passed ? "pass" : "fail",
    score: checks.filter((check) => check.passed).length,
    checks,
    changedFiles: after.changedFiles,
    changeManifest: after,
    commands: { test: cssBuild, typecheck: htmlSyntax, diffCheck },
    runtimeCommand: runtime
  };
};
