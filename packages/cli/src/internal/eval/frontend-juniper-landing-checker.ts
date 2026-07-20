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

const htmlPath = "src/index.html";
const cssPath = "src/styles.css";
const builtHtmlPath = "dist/index.html";
const builtCssPath = "dist/styles.css";
const allowedFiles = new Set([htmlPath, cssPath]);
const timeoutMs = 120_000;
export const frontendJuniperPreregisteredContract = {
  family: "frontend-juniper-landing",
  initialCommit: "abc74e094bcfcb56d67d840a23cdd519cb975db9",
  allowedPaths: [htmlPath, cssPath],
  codeBudget: { maxCssBytes: 14_000, maxHtmlBytes: 12_000, maxCssDeclarations: 160 },
  renderObservations: {
    viewports: [320, 768, 1440],
    programCounts: [1, 3, 7],
    textScalePercent: 150,
    checks: ["overflow", "clipping", "visual-order", "overlap", "hierarchy", "readable-measure", "focus-visible", "wide-composition"]
  },
  visualProtocol: "After both arms complete and before outcome interpretation, capture the same 320, 768, and 1440 screenshots and review hierarchy, rhythm, coherence, and editorial intent without changing the deterministic checker.",
  operatorInterventionLog: "required; zero is a valid recorded value"
} as const;

const ownedTarget = (manifest: TargetChangeManifest, initialCommit: string): boolean =>
  initialCommit === frontendJuniperPreregisteredContract.initialCommit &&
  manifest.status === "known" &&
  manifest.headMatchesInitialCommit === true &&
  manifest.forbiddenFiles.length === 0 &&
  !manifest.statusOutput.split("\n").some((line) => line.length >= 2 && line[0] !== " " && line[0] !== "?");

const normalizeText = (value: string): string => value
  .replace(/<[^>]+>/gu, " ")
  .replace(/&(?:nbsp|#160);/gu, " ")
  .replace(/&amp;/gu, "&")
  .replace(/\s+/gu, " ")
  .trim();

const contentSequence = (html: string): readonly string[] =>
  [...html.matchAll(/<(?:h[1-3]|p|a|address|figcaption)\b[^>]*>([\s\S]*?)<\/(?:h[1-3]|p|a|address|figcaption)>/giu)]
    .map((match) => normalizeText(match[1] ?? ""));

const linkDestinations = (html: string): readonly string[] =>
  [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/giu)].map((match) => match[1] ?? "");

type CssRule = { readonly selector: string; readonly body: string };

const cssRules = (css: string): readonly CssRule[] =>
  [...css.replace(/\/\*[\s\S]*?\*\//gu, "").matchAll(/([^{}]+)\{([^{}]*)\}/gu)]
    .map((match) => ({ selector: (match[1] ?? "").trim(), body: (match[2] ?? "").trim() }))
    .filter((rule) => !rule.selector.startsWith("@"));

const declarations = (body: string): readonly string[] => body
  .split(";")
  .map((declaration) => declaration.trim().replace(/\s+/gu, " "))
  .filter((declaration) => declaration.includes(":"));

const duplicatedRuleBodies = (rules: readonly CssRule[]): readonly string[] => {
  const owners = new Map<string, string[]>();
  for (const rule of rules) {
    const signature = [...declarations(rule.body)].sort().join(";");
    if (signature.split(";").length < 2) continue;
    owners.set(signature, [...(owners.get(signature) ?? []), rule.selector]);
  }
  return [...owners.values()].filter((selectors) => selectors.length > 1).flat();
};

const viewportMediaCount = (css: string): number =>
  [...css.matchAll(/@media\s*([^\{]+)/giu)]
    .filter((match) => !/prefers-reduced-motion/iu.test(match[1] ?? ""))
    .length;

const hasReducedMotionGuard = (css: string): boolean =>
  /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/iu.test(css) &&
  /scroll-behavior\s*:\s*auto/iu.test(css);

const hasBoundedComponentApi = (css: string): boolean => {
  const rules = cssRules(css);
  const rootVariables = new Set(
    [...(rules.find((rule) => rule.selector === ":root")?.body ?? "").matchAll(/(--[a-z0-9-]+)\s*:/giu)]
      .map((match) => match[1] ?? "")
  );
  const ownedVariables = new Set(
    rules
      .filter((rule) => rule.selector !== ":root")
      .flatMap((rule) => [...rule.body.matchAll(/(--[a-z0-9-]+)\s*:/giu)].map((match) => match[1] ?? ""))
  );
  return rootVariables.size >= 8 && rootVariables.size <= 40 && ownedVariables.size >= 1 && ownedVariables.size <= 10 &&
    [...ownedVariables].every((name) => new RegExp(`var\\(\\s*${name}\\s*,`, "iu").test(css));
};

export type FrontendJuniperSourceResult = {
  readonly checks: readonly { readonly name: HeldOutCheck["name"]; readonly passed: boolean; readonly details: string }[];
};

const preservesJuniperSemantics = (html: string, initialHtml: string | undefined): boolean =>
  initialHtml !== undefined &&
  JSON.stringify(contentSequence(html)) === JSON.stringify(contentSequence(initialHtml)) &&
  JSON.stringify(linkDestinations(html)) === JSON.stringify(linkDestinations(initialHtml)) &&
  /<main\b[^>]*\bid=["']main["']/iu.test(html) &&
  (html.match(/<section\b[^>]*aria-labelledby=/giu)?.length ?? 0) >= 3 &&
  /<ul\b[^>]*data-program-list/iu.test(html) &&
  /<article\b/iu.test(html);

const hasProfessionalCssOwnership = (html: string, css: string, rules: readonly CssRule[]): boolean => {
  const classValues = [...html.matchAll(/class=["']([^"']*)["']/giu)].map((match) => match[1] ?? "");
  const utilityToken = /(?:^|\s)(?:sm:|md:|lg:|xl:|2xl:|hover:)?(?:grid-cols-|flex(?:-\w+)?|items-|justify-|gap-\d|p[trblxy]?-\d|m[trblxy]?-\d|w-\d|h-\d|min-h-|max-w-|text-(?:\d|[a-z])|bg-|rounded-|shadow-|border(?:-|$))/u;
  return !/\bstyle\s*=/iu.test(html) &&
    !classValues.some((value) => utilityToken.test(value)) &&
    !/(?:^|\s)(?:c|u)-[a-z]/mu.test(classValues.join(" ")) &&
    !rules.some((rule) => /:nth-(?:child|of-type)\s*\(/iu.test(rule.selector)) &&
    duplicatedRuleBodies(rules).length === 0 &&
    !/!important\b/iu.test(css);
};

const isIntrinsicJuniperCss = (css: string, rules: readonly CssRule[]): boolean => {
  const repeated = rules.filter((rule) => /data-program-list|\bprogram\b|\barticle\b/iu.test(rule.selector));
  return repeated.length > 0 &&
    !repeated.some((rule) => /\b(?:min-|max-)?(?:height|block-size)\s*:/iu.test(rule.body)) &&
    viewportMediaCount(css) <= 3 && hasReducedMotionGuard(css);
};

const juniperCodeBudget = (html: string, css: string, rules: readonly CssRule[]): { readonly passed: boolean; readonly declarations: number } => {
  const count = rules.reduce((total, rule) => total + declarations(rule.body).length, 0);
  return {
    passed: new TextEncoder().encode(css).byteLength <= frontendJuniperPreregisteredContract.codeBudget.maxCssBytes &&
      new TextEncoder().encode(html).byteLength <= frontendJuniperPreregisteredContract.codeBudget.maxHtmlBytes &&
      count <= frontendJuniperPreregisteredContract.codeBudget.maxCssDeclarations,
    declarations: count
  };
};

export const evaluateFrontendJuniperSources = (input: {
  readonly html: string;
  readonly initialHtml?: string;
  readonly css: string;
}): FrontendJuniperSourceResult => {
  const rules = cssRules(input.css);
  const semanticsPassed = preservesJuniperSemantics(input.html, input.initialHtml);
  const ownershipPassed = hasProfessionalCssOwnership(input.html, input.css, rules);
  const resilientSourcePassed = isIntrinsicJuniperCss(input.css, rules);
  const budget = juniperCodeBudget(input.html, input.css, rules);

  return {
    checks: [
      { name: "frontend_semantics", passed: semanticsPassed, details: semanticsPassed ? "Content, links, order, landmarks, named regions, and program-list semantics are preserved." : "Content/link order or the semantic region/list contract changed." },
      { name: "frontend_css_ownership", passed: ownershipPassed, details: ownershipPassed ? "CSS has no inline, utility-token, prefix-cargo-cult, positional, duplicated-body, or !important escape hatch." : "CSS ownership contains duplication, positional coupling, utility/prefix cargo cult, inline style, or !important." },
      { name: "frontend_component_api", passed: hasBoundedComponentApi(input.css), details: hasBoundedComponentApi(input.css) ? "A bounded token surface and load-bearing component variation API are both present." : "The token surface or owned variation API is absent, unbounded, or not consumed with fallbacks." },
      { name: "frontend_intrinsic_resilience", passed: resilientSourcePassed, details: resilientSourcePassed ? "Repeated content owns block size, viewport forks are bounded, and smooth motion has a reduction path." : "Repeated content is height-coupled, viewport forks are excessive, or reduced-motion handling is missing." },
      { name: "frontend_code_budget", passed: budget.passed, details: budget.passed ? `Code stays within 14k CSS bytes, 12k HTML bytes, and 160 declarations (${budget.declarations} observed).` : `Code exceeds the preregistered 14k CSS bytes, 12k HTML bytes, or 160 declaration ceiling (${budget.declarations} observed).` }
    ]
  };
};

const browserDocument = (html: string, css: string, count: number): string =>
  renderFrontendObservationDocument(html, css, `
const expectedCount=${count};
const list=document.querySelector('[data-program-list]');
const seed=list?.querySelector(':scope > li');
if(list&&seed){while(list.children.length<expectedCount)list.append(seed.cloneNode(true));while(list.children.length>expectedCount)list.lastElementChild.remove();}
[...document.querySelectorAll('[data-program-list] > li')].forEach((item,index)=>{const heading=item.querySelector('h3');const copy=item.querySelector('article > p:last-child');const link=item.querySelector('a');if(heading)heading.textContent=index===1?'A deliberately long class title for resilient editorial composition':('Class '+(index+1));if(copy)copy.textContent=index===2?'supercalifragilisticexpialidocioussupercalifragilisticexpialidocious':index===3?'':'Useful class description that can wrap naturally.';if(link)link.href='#class-'+index;});
const items=[...document.querySelectorAll('[data-program-list] > li')];
const nodes=[...document.querySelectorAll('body *')];
const fits=document.documentElement.scrollWidth<=window.innerWidth+1&&nodes.every(node=>{const box=node.getBoundingClientRect();return box.right<=window.innerWidth+1&&box.left>=-1;});
const unclipped=[...document.querySelectorAll('[data-program-list] > li, [data-program-list] article, [data-program-list] h3, [data-program-list] p')].every(node=>{const style=getComputedStyle(node);const xClips=['hidden','clip','scroll','auto'].includes(style.overflowX)&&node.scrollWidth>node.clientWidth+1;const yClips=['hidden','clip','scroll','auto'].includes(style.overflowY)&&node.scrollHeight>node.clientHeight+1;return !xClips&&!yClips&&(style.webkitLineClamp==='none'||style.webkitLineClamp==='0');});
const h1=document.querySelector('h1');const h2=document.querySelector('h2');const bodySize=parseFloat(getComputedStyle(document.body).fontSize);const hierarchy=!!h1&&!!h2&&parseFloat(getComputedStyle(h1).fontSize)>=bodySize*1.7&&parseFloat(getComputedStyle(h2).fontSize)>=bodySize*1.2;
const readable=[...document.querySelectorAll('main p')].every(node=>node.getBoundingClientRect().width/parseFloat(getComputedStyle(node).fontSize)<=82);
const firstLink=document.querySelector('a');firstLink?.focus();const focused=firstLink?getComputedStyle(firstLink):null;const focusVisible=!!focused&&(parseFloat(focused.outlineWidth)>0||focused.boxShadow!=='none');
const intro=document.querySelector('[data-region="introduction"]');const introParts=intro?[...intro.children]:[];const sideBySide=window.innerWidth<1000||introParts.length<2||Math.abs(introParts[0].getBoundingClientRect().left-introParts[1].getBoundingClientRect().left)>window.innerWidth*.18;
const programBoxes=items.map(item=>item.getBoundingClientRect());const multiColumn=window.innerWidth<1000||items.length<2||programBoxes.some((box,index)=>index>0&&Math.abs(box.top-programBoxes[0].top)<4&&Math.abs(box.left-programBoxes[0].left)>20);
const visualOrder=programBoxes.map((box,index)=>({index,top:box.top,left:box.left})).sort((a,b)=>Math.abs(a.top-b.top)<4?a.left-b.left:a.top-b.top).every((entry,index)=>entry.index===index);
const nonOverlapping=programBoxes.every((box,index)=>programBoxes.slice(index+1).every(other=>box.right<=other.left+1||other.right<=box.left+1||box.bottom<=other.top+1||other.bottom<=box.top+1));
document.documentElement.dataset.layoutOk=String(items.length===expectedCount&&fits&&unclipped&&visualOrder&&nonOverlapping);
document.documentElement.dataset.qualityOk=String(hierarchy&&readable&&focusVisible&&sideBySide&&multiColumn);
document.documentElement.dataset.layoutEvidence=[fits,unclipped,visualOrder,nonOverlapping].map(String).join(',');`,
  frontendJuniperPreregisteredContract.renderObservations.textScalePercent);

const runRenderMatrix = async (input: {
  readonly checker: HeldOutCheckerInput;
  readonly runCommand: RunCommand;
  readonly html: string;
  readonly css: string;
}): Promise<{ readonly command: CommandResult; readonly resiliencePassed: boolean; readonly qualityPassed: boolean }> => {
  const observations = createFrontendBrowserObservations({
    counts: frontendJuniperPreregisteredContract.renderObservations.programCounts,
    widths: frontendJuniperPreregisteredContract.renderObservations.viewports,
    height: 1800,
    documentForCount: (count) => browserDocument(input.html, input.css, count)
  });
  const observed = await runFrontendBrowserObservations({
    checkerRoot: input.checker.checkerRoot,
    runCommand: input.runCommand,
    filePrefix: "frontend-juniper",
    observations,
    timeoutMs
  });
  const resilienceFailures: string[] = [];
  const qualityFailures: string[] = [];
  for (const observation of observations) {
    const stdout = observed.stdoutById.get(observation.id);
    if (stdout === undefined) continue;
    if (!/data-layout-ok="true"/u.test(stdout)) {
      const evidence = stdout.match(/data-layout-evidence="([^"]+)"/u)?.[1] ?? "missing";
      resilienceFailures.push(`${observation.id}:${evidence}`);
    }
    if (!/data-quality-ok="true"/u.test(stdout)) qualityFailures.push(observation.id);
  }
  return {
    command: {
      ...observed.command,
      command: "frontend-juniper-render-matrix",
      args: ["counts=1,3,7", "widths=320,768,1440", "text=150%", "clipping", "visual-order", "hierarchy", "measure", "focus", "wide-composition"],
      stdout: JSON.stringify({ resilienceFailures, qualityFailures }),
    },
    resiliencePassed: resilienceFailures.length === 0,
    qualityPassed: qualityFailures.length === 0
  };
};

const observedCheck = (
  name: HeldOutCheck["name"],
  condition: boolean,
  success: string,
  failure: string
): HeldOutCheck => ({ name, passed: condition, details: condition ? success : failure });

const juniperChecks = (input: {
  readonly after: TargetChangeManifest;
  readonly initialCommit: string;
  readonly build: CommandResult;
  readonly smoke: CommandResult;
  readonly diffCheck: CommandResult;
  readonly source: FrontendJuniperSourceResult;
  readonly runtime: Awaited<ReturnType<typeof runRenderMatrix>>;
}): readonly HeldOutCheck[] => [
  observedCheck("preflight", ownedTarget(input.after, input.initialCommit), "Frozen target identity and write ownership remained intact.", "Frozen target commit, staging state, or write ownership changed."),
  observedCheck("forbidden_files", input.after.forbiddenFiles.length === 0, "Only preregistered source files changed.", `Forbidden target changes: ${input.after.forbiddenFiles.join(", ")}`),
  observedCheck("target_test", passed(input.build), "The dependency-free public build passed.", "The public build failed."),
  observedCheck("target_typecheck", passed(input.smoke), "The target-owned browser smoke passed.", "The target-owned browser smoke failed."),
  observedCheck("target_diff_check", passed(input.diffCheck), "The target diff passed whitespace validation.", "The target diff failed whitespace validation."),
  ...input.source.checks,
  observedCheck("held_out_runtime", passed(input.runtime.command), "All nine browser observations completed.", `Browser observer failed: ${input.runtime.command.stderr}`),
  observedCheck("frontend_render_resilience", input.runtime.resiliencePassed, "Content, clipping, visual order, and viewport resilience passed all nine observations.", `Rendered resilience failed: ${input.runtime.command.stdout}`),
  observedCheck("frontend_render_quality", input.runtime.qualityPassed, "Hierarchy, measure, focus, and wide composition passed all nine observations.", `Rendered quality observations failed: ${input.runtime.command.stdout}`)
];

const juniperQualityPassed = (checks: readonly HeldOutCheck[]): boolean => {
  const qualityNames = new Set<HeldOutCheck["name"]>([
    "frontend_semantics", "frontend_css_ownership", "frontend_component_api",
    "frontend_intrinsic_resilience", "frontend_code_budget",
    "frontend_render_resilience", "frontend_render_quality"
  ]);
  return checks.filter((check) => qualityNames.has(check.name)).every((check) => check.passed);
};

export const runFrontendJuniperLandingChecker: (
  input: HeldOutCheckerInput,
  runCommand: RunCommand
) => Promise<HeldOutArmScore> = async (input, runCommand) => {
  const before = await captureHeldOutTargetState(input, runCommand, (path) => allowedFiles.has(path));
  if (!ownedTarget(before, input.initialCommit)) return invalidFrontendPreflightScore("frontend-juniper-landing", before);

  const build = await runCommand("npm", ["run", "build"], input.targetRoot, { env: { ...process.env, CI: "1" }, timeoutMs });
  const [smoke, diffCheck, initialHtmlRead] = await Promise.all([
    runCommand("npm", ["run", "check"], input.targetRoot, { env: { ...process.env, CI: "1" }, timeoutMs }),
    runCommand("git", ["diff", "--check"], input.targetRoot, { timeoutMs }),
    runCommand("git", ["show", `${input.initialCommit}:${htmlPath}`], input.targetRoot, { timeoutMs })
  ]);
  const [html, css] = await Promise.all([
    passed(build) ? readOptional(input.targetRoot, builtHtmlPath) : Promise.resolve(""),
    passed(build) ? readOptional(input.targetRoot, builtCssPath) : Promise.resolve("")
  ]);
  const source = evaluateFrontendJuniperSources({ html, css, ...(passed(initialHtmlRead) ? { initialHtml: initialHtmlRead.stdout } : {}) });
  const runtime = passed(build) && passed(smoke)
    ? await runRenderMatrix({ checker: input, runCommand, html, css })
    : { command: skipped("frontend-juniper-render-matrix", "public build or smoke failed"), resiliencePassed: false, qualityPassed: false };
  const after = await captureHeldOutTargetState(input, runCommand, (path) => allowedFiles.has(path));
  const checks = juniperChecks({ after, initialCommit: input.initialCommit, build, smoke, diffCheck, source, runtime });
  const validityNames = new Set<HeldOutCheck["name"]>(["preflight", "forbidden_files", "target_test", "target_typecheck", "target_diff_check", "held_out_runtime"]);
  const invalid = checks.some((check) => validityNames.has(check.name) && !check.passed);
  const qualityPassed = juniperQualityPassed(checks);
  return {
    status: invalid ? "invalid" : qualityPassed ? "pass" : "fail",
    score: checks.filter((check) => check.passed).length,
    checks, changedFiles: after.changedFiles, changeManifest: after,
    commands: { test: build, typecheck: smoke, diffCheck }, runtimeCommand: runtime.command
  };
};
