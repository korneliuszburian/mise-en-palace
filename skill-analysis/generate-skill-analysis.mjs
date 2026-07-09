import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const krnSkillRoot = path.join(repoRoot, ".agents", "skills");
const mattSkillRoot = path.join(
  repoRoot,
  ".local-lab",
  "mattpocock-skills",
  "skills",
  "engineering"
);
const outRoot = path.join(repoRoot, "skill-analysis", "generated");

const roleRules = [
  ["router", /ask|setup|triage|ticket|wayfinder|beads|handoff|resolving-merge-conflicts/i],
  ["decision", /source-to-decision|domain|architecture|codebase-design|research|grill-with-docs|context|adr|vocabulary/i],
  ["maker", /tdd|typescript|type safety|schema|migration|activation|adapter|target repo|implement|prototype|bug|diagnos/i],
  ["checker", /code-review|evidence-review|improve-codebase|review|verify|qa|proof|non-proof/i]
];

const roleOverrides = new Map([
  ["KRN:activation-engine", "maker"],
  ["KRN:beads", "router"],
  ["KRN:brain-store-schema", "maker"],
  ["KRN:code-review", "checker"],
  ["KRN:codebase-design", "decision"],
  ["KRN:codex-adapter-plan", "maker"],
  ["KRN:domain-modeling", "decision"],
  ["KRN:evidence-review-loop", "checker"],
  ["KRN:handoff-compact", "router"],
  ["KRN:source-to-decision", "decision"],
  ["KRN:target-repo-testing", "checker"],
  ["KRN:tdd", "maker"],
  ["KRN:typescript-type-safety", "maker"],
  ["Matt Pocock:ask-matt", "router"],
  ["Matt Pocock:code-review", "checker"],
  ["Matt Pocock:codebase-design", "decision"],
  ["Matt Pocock:diagnosing-bugs", "maker"],
  ["Matt Pocock:domain-modeling", "decision"],
  ["Matt Pocock:grill-with-docs", "decision"],
  ["Matt Pocock:implement", "maker"],
  ["Matt Pocock:improve-codebase-architecture", "decision"],
  ["Matt Pocock:prototype", "maker"],
  ["Matt Pocock:research", "decision"],
  ["Matt Pocock:resolving-merge-conflicts", "maker"],
  ["Matt Pocock:setup-matt-pocock-skills", "router"],
  ["Matt Pocock:tdd", "maker"],
  ["Matt Pocock:to-spec", "decision"],
  ["Matt Pocock:to-tickets", "router"],
  ["Matt Pocock:triage", "router"],
  ["Matt Pocock:wayfinder", "router"]
]);

const readIfExists = async (filePath) => {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
};

const listSkillDirs = async (root) => {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(root, entry.name));
};

const listFilesRecursive = async (root) => {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
};

const parseFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  const fields = new Map();
  if (!match) return fields;
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([^:]+):\s*(.*)$/);
    if (field) fields.set(field[1].trim(), field[2].trim().replace(/^"|"$/g, ""));
  }
  return fields;
};

const extractSections = (text) =>
  [...text.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());

const inferOne = (rules, text, fallback) => {
  const found = rules.find(([, pattern]) => pattern.test(text));
  return found ? found[0] : fallback;
};

const loadSkills = async (root, source) => {
  const dirs = await listSkillDirs(root);
  const skills = [];
  for (const dir of dirs) {
    const skillPath = path.join(dir, "SKILL.md");
    const text = await readIfExists(skillPath);
    if (!text) continue;
    const frontmatter = parseFrontmatter(text);
    const name = frontmatter.get("name") ?? path.basename(dir);
    const description = frontmatter.get("description") ?? "";
    const body = text.replace(/^---\n[\s\S]*?\n---\n/, "");
    const sections = extractSections(text);
    const resourceFiles = [];
    for (const filePath of await listFilesRecursive(dir)) {
      const relativePath = path.relative(repoRoot, filePath);
      const skillRelativePath = path.relative(dir, filePath);
      resourceFiles.push({
        path: relativePath,
        skillPath: skillRelativePath,
        text: await readFile(filePath, "utf8")
      });
    }
    const referenceFiles = resourceFiles
      .filter((file) => file.skillPath !== "SKILL.md")
      .map((file) => file.skillPath)
      .sort();
    const signalText = `${name} ${description} ${sections.join(" ")} ${body.slice(0, 2500)}`;
    const routingText = `${name} ${description}`;
    const role = roleOverrides.get(`${source}:${name}`)
      ?? inferOne(roleRules, routingText, inferOne(roleRules, signalText, "reference"));
    skills.push({
      source,
      name,
      dir: path.relative(repoRoot, dir),
      skillPath: path.relative(repoRoot, skillPath),
      description,
      text,
      sections,
      referenceFiles,
      resourceFiles,
      role,
      lineCount: text.split("\n").length,
      hasStop: /^##\s+Stop Condition/m.test(text) || /completion criterion/i.test(text),
      hasOutput: /^##\s+Output/m.test(text) || /^##\s+Required Output/m.test(text),
      hasVerification: /^##\s+Verification/m.test(text) || /verify|test|typecheck|red|green/i.test(text),
      isUserInvoked: /disable-model-invocation:\s*true/.test(text)
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
};

const link = (filePath, label = filePath) => `[${label}](./${filePath})`;

const skillDoc = (skill) => `# ${skill.name}

- Source: ${skill.source}
- Path: \`${skill.dir}/SKILL.md\`
- Role: ${skill.role}
- Invocation: ${skill.isUserInvoked ? "user-invoked" : "model-invoked"}
- Lines: ${skill.lineCount}
- Stop condition: ${skill.hasStop ? "yes" : "no"}
- Output: ${skill.hasOutput ? "yes" : "no"}
- Verification: ${skill.hasVerification ? "yes" : "no"}

## Description

${skill.description || "_No description found._"}

## Sections

${skill.sections.map((section) => `- ${section}`).join("\n") || "- _No h2 sections found._"}

## Reference Files

${skill.referenceFiles.map((file) => `- ${file}`).join("\n") || "- _None._"}

`;

const skillBundleMarkdown = (skills) => {
  const files = skills.flatMap((skill) =>
    skill.resourceFiles.map((file) => ({ ...file, skillName: skill.name, role: skill.role }))
  );
  const rows = files.map((file, index) =>
    `| ${index + 1} | ${file.skillName} | ${file.role} | \`${file.path}\` |`
  );
  const docs = files.map((file, index) => `## ${index + 1}. ${file.path}

skill: ${file.skillName}
role: ${file.role}

\`\`\`markdown
${file.text.trim()}
\`\`\`
`);

  return `# KRN Skills Bundle

This is a repomix-style single document for reading, searching, and copying the
current repo-local KRN skills. It is generated from \`.agents/skills/**\`.

## File Index

| # | Skill | Role | File |
|---|---|---|---|
${rows.join("\n")}

## Files

${docs.join("\n")}
`;
};

const mermaidGraph = (krnSkills, mattSkills) => {
  const lines = ["```mermaid", "flowchart LR"];
  lines.push('  AlwaysOn["Always-on routing\\nAGENTS.md / README"]');
  lines.push('  Durable["Durable state\\nBeads / issue graph"]');
  lines.push('  Decisions["Decision artifacts\\nsource decisions / context / ADR candidates"]');
  lines.push('  Verify["Verification\\ntests / typecheck / Fallow / smokes"]');
  lines.push('  AlwaysOn --> Durable --> Decisions');
  for (const [sourceLabel, sourceSkills, prefix] of [
    ["KRN", krnSkills, "KRN"],
    ["Matt Pocock", mattSkills, "MATT"]
  ]) {
    lines.push(`  subgraph ${prefix}["${sourceLabel}"]`);
    for (const role of [...new Set(sourceSkills.map((skill) => skill.role))].sort()) {
      lines.push(`    subgraph ${prefix}_${role.replace(/[^a-z0-9]/gi, "_")}["${role}"]`);
      for (const skill of sourceSkills.filter((item) => item.role === role)) {
        lines.push(`      ${prefix}_${skill.name.replace(/[^a-z0-9]/gi, "_")}["${skill.name}"]`);
      }
      lines.push("    end");
    }
    lines.push("  end");
  }
  lines.push("  Decisions --> KRN_decision");
  lines.push("  KRN_decision --> KRN_maker");
  lines.push("  KRN_maker --> Verify --> KRN_checker");
  lines.push("  KRN_checker --> Durable");
  lines.push("  MATT_decision -. context pattern .-> Decisions");
  lines.push("  Decisions -. comparison .-> MATT_maker");
  lines.push("  MATT_checker -. comparison .-> Verify");
  lines.push("  MATT_router -. pattern .-> AlwaysOn");
  lines.push("```");
  return lines.join("\n");
};

const lifecycleStages = [
  {
    id: "router",
    stage: "Router",
    matt: "ask-matt",
    krn: "AGENTS.md, README, beads",
    status: "partial",
    score: 1,
    metric: "One visible entry point routes the operator to the right skill chain.",
    krnFinding: "KRN has always-on orientation and Beads, but no user-invoked router that says which KRN skill to use when the operator is unsure.",
    missingMechanism: "ask-krn or a compact router section that maps idea/debug/review/research/big-goal to the right loop.",
    nextMove: "Create a router only if confusion repeats; otherwise keep routing in onboarding and Beads."
  },
  {
    id: "grill",
    stage: "Grill",
    matt: "grill-with-docs, domain-modeling",
    krn: "domain-modeling, source-to-decision",
    status: "partial",
    score: 1,
    metric: "Ambiguous intent is clarified with the human before implementation.",
    krnFinding: "KRN can challenge vocabulary and source claims, but lacks a named human-question gate that prevents self-grilling or jumping straight to code.",
    missingMechanism: "A grill gate: one question at a time, no self-answering, capture resolved vocabulary/decision immediately.",
    nextMove: "Add the grill behavior to domain-modeling or a user-invoked router before adding a separate skill."
  },
  {
    id: "spec",
    stage: "Spec",
    matt: "to-spec",
    krn: "Beads issue descriptions, source-to-decision",
    status: "missing",
    score: 0,
    metric: "Conversation or rough idea becomes an agreed build spec.",
    krnFinding: "KRN has task issues and source decisions, but no first-class spec artifact that sits between conversation and ticket slicing.",
    missingMechanism: "A spec format with user stories, constraints, non-goals, acceptance criteria, and open questions.",
    nextMove: "Decide whether Beads issue bodies are enough, or add a to-spec style mode for large/fuzzy work."
  },
  {
    id: "tickets",
    stage: "Tickets",
    matt: "to-tickets",
    krn: "beads",
    status: "partial",
    score: 1,
    metric: "Spec becomes tracer-bullet, agent-sized tickets with blocking edges.",
    krnFinding: "Beads already supports dependencies and tracer-bullet wording, but there is no dedicated conversion workflow from spec/conversation into a frontier.",
    missingMechanism: "A to-tickets-like Beads mode that sizes each issue for one fresh context and wires blocker edges deliberately.",
    nextMove: "Strengthen Beads before adding a separate to-tickets skill."
  },
  {
    id: "wayfinder",
    stage: "Wayfinder",
    matt: "wayfinder",
    krn: "beads wayfinding section",
    status: "partial",
    score: 1,
    metric: "Huge foggy work becomes a map of decision tickets with a frontier.",
    krnFinding: "KRN has foggy-work guidance inside Beads, but lacks Matt's explicit map artifact: destination, decisions so far, not-yet-specified fog, out-of-scope, one ticket per session.",
    missingMechanism: "Wayfinding protocol inside Beads, including map issue shape and frontier discipline.",
    nextMove: "Add a Beads wayfinding mode before creating a separate wayfinder skill."
  },
  {
    id: "research",
    stage: "Research",
    matt: "research",
    krn: "source-to-decision",
    status: "partial",
    score: 1,
    metric: "External sources become decision-grade evidence, not broad summaries.",
    krnFinding: "source-to-decision is strong for source -> mechanism -> implication -> decision, but may be too broad for pure research legwork.",
    missingMechanism: "Clear split between research artifact and decision capture when a run is source-heavy.",
    nextMove: "Audit source-to-decision uses before splitting."
  },
  {
    id: "prototype",
    stage: "Prototype",
    matt: "prototype",
    krn: "none",
    status: "optional-missing",
    score: 0,
    metric: "A cheap artifact raises discussion fidelity before committing to implementation.",
    krnFinding: "KRN currently has no explicit prototype loop. That may be fine for backend/control-plane work, but it is a real gap for UX/state-model exploration.",
    missingMechanism: "Prototype as throwaway, named as non-production, linked from the deciding issue.",
    nextMove: "Defer unless a KRN feature needs visual/state-model exploration."
  },
  {
    id: "implement",
    stage: "Implement",
    matt: "implement",
    krn: "domain maker skills, Codex default execution",
    status: "partial",
    score: 1,
    metric: "One ticket is implemented with the right maker skill and verification chain.",
    krnFinding: "KRN has strong domain-specific maker skills, but no unified implement wrapper that always routes through TDD and review for each ticket.",
    missingMechanism: "Ticket execution protocol: claim, pick maker skill, run verification, call checker, record evidence.",
    nextMove: "Prefer improving Beads/README routing over a generic implement skill unless agents keep skipping review."
  },
  {
    id: "review",
    stage: "Code Review",
    matt: "code-review with Fowler smells",
    krn: "code-review, evidence-review-loop, target-repo-testing",
    status: "covered",
    score: 2,
    metric: "A checker inspects standards, spec fit, smells, and proof gaps.",
    krnFinding: "KRN code-review already includes Fowler-style smells, standards/spec separation, verification gaps, and checker behavior.",
    missingMechanism: "None obvious; keep validating that maker and checker are not the same agent in looped work.",
    nextMove: "Keep as-is; pair it explicitly after implementation."
  },
  {
    id: "diagnosis",
    stage: "Diagnosis",
    matt: "diagnosing-bugs",
    krn: "none",
    status: "missing",
    score: 0,
    metric: "Reported bugs require a tight red-capable loop before hypotheses.",
    krnFinding: "KRN has TDD and review, but no diagnosis discipline that blocks theory-first debugging.",
    missingMechanism: "Feedback loop -> reproduce/minimize -> hypotheses -> instrument -> fix/regression -> cleanup.",
    nextMove: "Add diagnosing-bugs as the first new KRN skill candidate."
  },
  {
    id: "context",
    stage: "Context / ADR",
    matt: "domain-modeling, CONTEXT.md, docs/adr",
    krn: "KRN_ROADMAP.md, source-to-decision, Beads, no dedicated context lane",
    status: "partial",
    score: 1,
    metric: "Resolved vocabulary and surprising decisions survive fresh agent context.",
    krnFinding: "KRN has source decisions and roadmap truth, but no small domain-context artifact analogous to Matt's glossary plus lazy ADR lane.",
    missingMechanism: "A scoped context/ADR lane that is not runtime memory, not a scratchpad, and not a second roadmap.",
    nextMove: "Run the context-artifact-lane decision candidate next."
  }
];

const stageMechanics = new Map([
  ["router", {
    artifact: "Always-on routing text",
    agentSized: "n/a",
    blockerGraph: "n/a",
    makerChecker: "n/a",
    stopGate: "partial"
  }],
  ["grill", {
    artifact: "Resolved question/vocabulary",
    agentSized: "yes",
    blockerGraph: "no",
    makerChecker: "partial",
    stopGate: "partial"
  }],
  ["spec", {
    artifact: "Spec",
    agentSized: "partial",
    blockerGraph: "no",
    makerChecker: "partial",
    stopGate: "missing"
  }],
  ["tickets", {
    artifact: "Beads issues",
    agentSized: "partial",
    blockerGraph: "yes",
    makerChecker: "partial",
    stopGate: "partial"
  }],
  ["wayfinder", {
    artifact: "Map issue",
    agentSized: "yes",
    blockerGraph: "partial",
    makerChecker: "yes",
    stopGate: "partial"
  }],
  ["research", {
    artifact: "Source decision",
    agentSized: "partial",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "partial"
  }],
  ["prototype", {
    artifact: "Prototype link",
    agentSized: "yes",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "missing"
  }],
  ["implement", {
    artifact: "Patch + evidence",
    agentSized: "partial",
    blockerGraph: "partial",
    makerChecker: "partial",
    stopGate: "partial"
  }],
  ["review", {
    artifact: "Review findings",
    agentSized: "yes",
    blockerGraph: "n/a",
    makerChecker: "yes",
    stopGate: "yes"
  }],
  ["diagnosis", {
    artifact: "Red-capable repro",
    agentSized: "yes",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "missing"
  }],
  ["context", {
    artifact: "Context/ADR candidate",
    agentSized: "n/a",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "partial"
  }]
]);

const lifecycleDiagnostics = lifecycleStages.map((stage) => ({
  ...stage,
  ...stageMechanics.get(stage.id)
}));

const skillUtility = new Map([
  ["activation-engine", {
    purpose: "Steruje wyborem kontekstu dla KRN: co aktywować, co odrzucić i kiedy jawnie abstainować.",
    use: "Gdy zmieniamy retrieval, ranking, owner-file recall, budżet kontekstu, filtry zaufania albo selekcję memory/source.",
    gain: "Chroni loop przed prompt bloatem i losowym dociąganiem dokumentów, bo każda inkluzja musi mieć powód użycia.",
    risk: "Może stać się polityką opisaną w markdownu, jeśli nie jest podparta testami selekcji i exclusion records.",
    decision: "Keep as maker skill."
  }],
  ["beads", {
    purpose: "Durable task graph dla dużego loopu: stan pracy, zależności, frontier, claim, close, follow-up.",
    use: "Gdy praca ma przetrwać sesję, wymaga blockerów, równoległości, handoffu albo podziału na agent-sized issues.",
    gain: "Może zastąpić większość `to-tickets` i część `to-spec`, bo końcowym artefaktem i tak jest tracker.",
    risk: "Jeśli wrzucimy tu wszystko, stanie się overloaded routerem; potrzebuje jawnych trybów: triage, to-spec, to-tickets, wayfinding.",
    decision: "Keep, but split internally into explicit modes before adding separate planning skills."
  }],
  ["brain-store-schema", {
    purpose: "Pilnuje granic storage/migration dla temporal Memory Core.",
    use: "Gdy zmieniamy Drizzle/Postgres schema, migracje, repo adapters, persistence, outbox albo job state.",
    gain: "Wymusza TypeScript/store discipline i rollback thinking przy zmianach, które trudno odkręcić.",
    risk: "Bez rzeczywistych migration/evidence gates może udawać safety zamiast go dowodzić.",
    decision: "Keep as maker skill."
  }],
  ["code-review", {
    purpose: "Niezależny checker dla diffu: standardy, spec fit, roadmap drift, smell baseline i proof gaps.",
    use: "Po implementacji, przy PR/diff/review albo gdy trzeba odsiać test theater i shallow modules.",
    gain: "To jest nasz najmocniej pokryty Mattowy element; zawiera Fowler-style smells i rozdziela Standards od Spec.",
    risk: "Traci sens, jeśli ten sam agent ocenia własną zmianę bez świeżego kontekstu lub bez file:line evidence.",
    decision: "Keep; pair explicitly after maker work."
  }],
  ["codebase-design", {
    purpose: "Decyzje architektoniczne: gdzie jest granica modułu, czy interface jest deep, czy nazwa oddaje ownership.",
    use: "Przy zmianach boundary, package seam, public API, refactorach i płytkich modułach.",
    gain: "Daje język do odrzucania speculative seams i adapter-chainów zanim wejdą do kodu.",
    risk: "Może być advice-only, jeśli nie kończy się konkretną decyzją, zmianą granicy albo follow-up Beadem.",
    decision: "Keep as decision skill; tie outputs to context/ADR/source decision."
  }],
  ["codex-adapter-plan", {
    purpose: "Przekłada KRN DecisionPacket/harness output na bounded Codex execution brief.",
    use: "Gdy zmieniamy adapter do Codexa, proof boundaries, context shape albo non-mutating execution brief.",
    gain: "Chroni przed tym, żeby adapter zaczął być ukrytą pamięcią/runtime policy zamiast rendererem decyzji.",
    risk: "Nisza; jeśli nie ma aktywnych adapter zmian, będzie rzadko używany.",
    decision: "Keep as specialized maker skill."
  }],
  ["domain-modeling", {
    purpose: "Pilnuje słownika, nazw domenowych i tego, żeby pojęcia miały jednego właściciela.",
    use: "Gdy pojawia się niejasne nazewnictwo: brain, memory, source, activation, DecisionPacket, retained knowledge itd.",
    gain: "To naturalne miejsce na Mattową logikę `CONTEXT.md`: rozwiąż termin raz i zapisz decyzję poza czatem.",
    risk: "Obecnie bardziej hamuje złe nazwy niż prowadzi do widocznego context artifactu.",
    decision: "Keep; extend with grill/context capture behavior."
  }],
  ["evidence-review-loop", {
    purpose: "Checker dowodów po wykonaniu pracy: co jest proof, co non-proof, jakie ryzyko i feedback delta.",
    use: "Po większych runach, gdy trzeba rozdzielić realną weryfikację od deklaracji w final answer.",
    gain: "Buduje feedback loop i memory/source/skill candidates bez polegania na opowieści agenta.",
    risk: "Jeśli używany jako końcowa checklista przez maker agent, osłabia maker/checker separation.",
    decision: "Keep as checker; invoke deliberately after implementation."
  }],
  ["handoff-compact", {
    purpose: "Zapisuje stan pracy po długiej sesji: objective, issue, commit/push/CI, decyzje, blokery, next action.",
    use: "Przed compaction/resume/pause/transfer albo przy końcu większego taska.",
    gain: "Zmniejsza utratę stanu w wielkim loopie, gdzie model zapomina, a repo/tracker pamięta.",
    risk: "Może dublować Beads, jeśli zamiast compact handoff zacznie być osobnym task ledgerem.",
    decision: "Keep as router/state skill."
  }],
  ["source-to-decision", {
    purpose: "Przerabia źródła na decyzje: source -> mechanism -> KRN implication -> decision/rejection.",
    use: "Gdy architektura, skill, policy, MCP, eval albo TypeScript decision zależy od docs/papers/practitioner writing.",
    gain: "Najlepsza obrona przed research summary bez konsekwencji w systemie.",
    risk: "Może być za szeroki: research legwork, decyzja, falsifier i knowledge promotion w jednym miejscu.",
    decision: "Keep for now; audit whether pure research should split out."
  }],
  ["target-repo-testing", {
    purpose: "Checker/protocol dla pracy na target repo: dirty state, write authority, proof/non-proof, handoff.",
    use: "Gdy KRN inspektuje, testuje lub naprawia zewnętrzne repo przez harness.",
    gain: "Chroni przed fałszywym proofem i przypadkowym mutowaniem cudzego stanu.",
    risk: "Może być zbyt duży i mieszać setup, test, repair oraz handoff.",
    decision: "Keep, but watch for sequence split if agents rush through phases."
  }],
  ["tdd", {
    purpose: "Maker loop dla zamierzonego zachowania: red -> green -> refactor przy właściwym public seam.",
    use: "Przy bugfixach z dobrym seamem i nowych zachowaniach, które da się sfalsyfikować testem.",
    gain: "Najkrótszy feedback loop dla implementacji; typowo Mattowy rdzeń pracy.",
    risk: "Nie zastępuje `diagnosing-bugs`, bo TDD nie wymusza najpierw red-capable repro dla nieznanej usterki.",
    decision: "Keep; add separate diagnosing-bugs."
  }],
  ["typescript-type-safety", {
    purpose: "Pilnuje TypeScript-first granic: unknown narrowing, public types, validators, any/cast discipline.",
    use: "Przy TS source, API boundaries, CLI/MCP inputs, env/file/fetch data, generics i configu typecheck.",
    gain: "Skraca feedback loop przez typy i zapobiega oszukiwaniu kompilatora dla szybkiego green.",
    risk: "Może być policy reminderem, jeśli nie kończy się typecheckiem albo konkretnym boundary fixem.",
    decision: "Keep as maker skill."
  }]
]);

const statusLabel = (status) => ({
  covered: "covered",
  partial: "partial",
  missing: "missing",
  "optional-missing": "optional"
}[status] ?? status);

const statusClass = (status) => status.replace(/[^a-z0-9]/gi, "-");

const htmlEscape = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const lifecycleMarkdown = () => {
  const covered = lifecycleDiagnostics.filter((stage) => stage.status === "covered").length;
  const partial = lifecycleDiagnostics.filter((stage) => stage.status === "partial").length;
  const missing = lifecycleDiagnostics.filter((stage) => stage.status === "missing").length;
  const optional = lifecycleDiagnostics.filter((stage) => stage.status === "optional-missing").length;
  const score = lifecycleDiagnostics.reduce((sum, stage) => sum + stage.score, 0);
  const maxScore = lifecycleDiagnostics.length * 2;
  const rows = lifecycleDiagnostics.map((stage) =>
    `| ${stage.stage} | ${statusLabel(stage.status)} | ${stage.artifact} | ${stage.agentSized} | ${stage.blockerGraph} | ${stage.makerChecker} | ${stage.stopGate} | ${stage.krnFinding} | ${stage.nextMove} |`
  );

  return `# Loop Diagnostics

This file measures whether KRN has the mechanisms needed for Matt Pocock's
v1.1 lifecycle and loop-engineering work, not whether our markdown looks tidy.

## Summary

- Covered: ${covered}
- Partial: ${partial}
- Missing: ${missing}
- Optional missing: ${optional}
- Readiness score: ${score}/${maxScore}

## Lifecycle Coverage

| Stage | Status | Artifact | Agent-sized | Blocker graph | Maker/checker | Stop gate | KRN Finding | Next Move |
|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

## Highest-Value Gaps

1. Add a KRN-specific \`diagnosing-bugs\` skill.
2. Decide the context/ADR lane so vocabulary and surprising decisions survive
   fresh-agent loops.
3. Strengthen Beads with \`to-tickets\` and \`wayfinder\` modes before adding
   separate skills.
4. Decide whether a \`to-spec\` artifact is needed for large or fuzzy work.
`;
};

const skillUtilityMarkdown = (skills) => {
  const rows = skills.map((skill) => {
    const utility = skillUtility.get(skill.name);
    return `| ${skill.name} | ${skill.role} | ${utility?.purpose ?? "_brak opisu_"} | ${utility?.gain ?? "_brak opisu_"} | ${utility?.risk ?? "_brak opisu_"} | ${utility?.decision ?? "_brak decyzji_"} |`;
  });

  return `# Uzytecznosc KRN Skills

Ten dokument opisuje po polsku, po co istnieje kazdy skill w naszym systemie.
Nie jest to katalog dla katalogu. Pytanie brzmi: czy skill realnie zmienia
zachowanie agenta w wielkim loopie?

## Najwazniejsze rozroznienie

\`to-spec\` i \`to-tickets\` prawdopodobnie powinny zaczac jako tryby \`beads\`,
bo ich naturalnym artefaktem koncowym jest tracker: issue body, acceptance
criteria, dependency edges i frontier.

\`wayfinder\` jest innym typem mechanizmu. Nie sluzy tylko do rozbicia planu na
zadania. Sluzy wtedy, gdy planu jeszcze nie da sie uczciwie napisac: istnieje
destination, fog of war, decyzje do odkrycia, blocker graph i frontier. Dlatego
Wayfinder moze byc osobnym protokolem wewnatrz Beads albo osobnym skillem, jesli
sam tryb Beads robi sie zbyt ciezki.

## Skill Utility Table

| Skill | Rola | Po co istnieje | Realny zysk | Ryzyko | Decyzja |
|---|---|---|---|---|---|
${rows.join("\n")}

## Kandydaci na nastepne zmiany

1. \`diagnosing-bugs\`: osobny skill, bo brakuje czerwonej petli diagnostycznej.
2. \`beads\`: dodac tryby \`to-spec\`, \`to-tickets\`, \`wayfinding\`, zamiast
   mnozyc nowe skillsy bez potrzeby.
3. \`domain-modeling\`: dodac grill/context capture, bo to jest najblizszy
   odpowiednik Mattowego \`CONTEXT.md\`.
4. \`source-to-decision\`: sprawdzic, czy nie trzeba oddzielic research legwork
   od decision capture.
`;
};

const dashboardHtml = (krnSkills) => {
  const score = lifecycleDiagnostics.reduce((sum, stage) => sum + stage.score, 0);
  const maxScore = lifecycleDiagnostics.length * 2;
  const covered = lifecycleDiagnostics.filter((stage) => stage.status === "covered").length;
  const partial = lifecycleDiagnostics.filter((stage) => stage.status === "partial").length;
  const missing = lifecycleDiagnostics.filter((stage) => stage.status === "missing").length;
  const optional = lifecycleDiagnostics.filter((stage) => stage.status === "optional-missing").length;
  const rows = lifecycleDiagnostics.map((stage) => `
          <tr>
            <td><strong>${htmlEscape(stage.stage)}</strong><span>${htmlEscape(stage.metric)}</span></td>
            <td><span class="badge ${statusClass(stage.status)}">${htmlEscape(statusLabel(stage.status))}</span></td>
            <td>${htmlEscape(stage.matt)}</td>
            <td>${htmlEscape(stage.krn)}</td>
            <td>${htmlEscape(stage.artifact)}</td>
            <td>${htmlEscape(stage.agentSized)}</td>
            <td>${htmlEscape(stage.blockerGraph)}</td>
            <td>${htmlEscape(stage.makerChecker)}</td>
            <td>${htmlEscape(stage.stopGate)}</td>
            <td>${htmlEscape(stage.krnFinding)}</td>
            <td>${htmlEscape(stage.nextMove)}</td>
          </tr>`).join("");
  const skillTree = krnSkills.map((skill) => `
          <details class="skill-node">
            <summary>
              <span>
                <strong>${htmlEscape(skill.name)}</strong>
                <small>${htmlEscape(skill.skillPath)} · ${htmlEscape(skill.role)} · ${skill.isUserInvoked ? "user" : "model"}</small>
              </span>
              <button type="button" data-copy="${htmlEscape(skill.name)}">Copy</button>
            </summary>
            ${skill.resourceFiles.map((file) => `<details class="skill-file" open>
              <summary>${htmlEscape(file.skillPath)}</summary>
              <pre id="skill-${htmlEscape(skill.name)}-${htmlEscape(file.skillPath).replace(/[^a-z0-9]/gi, "-")}"><code>${htmlEscape(file.text.trim())}</code></pre>
            </details>`).join("")}
          </details>`).join("");
  const utilityRows = krnSkills.map((skill) => {
    const utility = skillUtility.get(skill.name);
    return `
          <tr>
            <td><strong>${htmlEscape(skill.name)}</strong><span>${htmlEscape(skill.role)}</span></td>
            <td>${htmlEscape(utility?.purpose ?? "brak opisu")}</td>
            <td>${htmlEscape(utility?.use ?? "brak opisu")}</td>
            <td>${htmlEscape(utility?.gain ?? "brak opisu")}</td>
            <td>${htmlEscape(utility?.risk ?? "brak opisu")}</td>
            <td>${htmlEscape(utility?.decision ?? "brak decyzji")}</td>
          </tr>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>KRN Skill Loop Diagnostics</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f8fb;
        --text: #17202a;
        --muted: #5c6773;
        --line: #d8dee8;
        --panel: #ffffff;
        --covered: #147d4f;
        --partial: #9a5b00;
        --missing: #a92727;
        --optional: #556070;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background: var(--bg);
      }
      header, main { max-width: 1480px; margin: 0 auto; padding: 24px; }
      header { padding-bottom: 12px; }
      h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0; }
      p { margin: 0; color: var(--muted); max-width: 920px; }
      .metrics {
        display: grid;
        grid-template-columns: repeat(5, minmax(120px, 1fr));
        gap: 12px;
        margin: 18px 0 20px;
      }
      .metric {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
      }
      .metric strong { display: block; font-size: 26px; }
      .metric span { color: var(--muted); }
      .section {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
      }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 12px 14px; border-bottom: 1px solid var(--line); vertical-align: top; text-align: left; }
      th { font-size: 12px; text-transform: uppercase; color: var(--muted); background: #eef2f7; }
      td:first-child { min-width: 190px; }
      td:first-child span { display: block; color: var(--muted); font-weight: 400; margin-top: 4px; }
      tr:last-child td { border-bottom: 0; }
      .badge {
        display: inline-flex;
        min-width: 74px;
        justify-content: center;
        border-radius: 999px;
        padding: 3px 8px;
        color: white;
        font-weight: 700;
        font-size: 12px;
      }
      .covered { background: var(--covered); }
      .partial { background: var(--partial); }
      .missing { background: var(--missing); }
      .optional-missing { background: var(--optional); }
      .callouts {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }
      .callout {
        background: var(--panel);
        border: 1px solid var(--line);
        border-left: 4px solid var(--missing);
        border-radius: 8px;
        padding: 14px;
      }
      .callout h2 { margin: 0 0 6px; font-size: 15px; }
      .callout p { font-size: 13px; }
      .skills-panel {
        margin-top: 18px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
      }
      .utility-panel {
        margin-top: 18px;
      }
      .skills-header {
        padding: 14px;
        border-bottom: 1px solid var(--line);
        background: #eef2f7;
      }
      .skills-header h2 { margin: 0 0 4px; font-size: 16px; }
      .skills-header p { font-size: 13px; }
      .skill-node { border-bottom: 1px solid var(--line); }
      .skill-node:last-child { border-bottom: 0; }
      .skill-node > summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;
        padding: 12px 14px;
      }
      .skill-node summary small {
        display: block;
        color: var(--muted);
        font-size: 12px;
        margin-top: 2px;
      }
      .skill-node button {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--text);
        padding: 5px 9px;
        font: inherit;
        cursor: pointer;
      }
      .skill-file {
        border-top: 1px solid var(--line);
      }
      .skill-file summary {
        padding: 9px 14px;
        cursor: pointer;
        color: var(--muted);
        background: #f8fafc;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
      }
      pre {
        margin: 0;
        padding: 14px;
        max-height: 520px;
        overflow: auto;
        background: #111827;
        color: #e5e7eb;
        font-size: 12px;
        line-height: 1.45;
      }
      @media (max-width: 980px) {
        .metrics, .callouts { grid-template-columns: 1fr 1fr; }
        table { min-width: 1320px; }
        .section { overflow-x: auto; }
      }
      @media (max-width: 620px) {
        header, main { padding: 16px; }
        .metrics, .callouts { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>KRN Skill Loop Diagnostics</h1>
      <p>Operational view of what the big loop can and cannot do yet. This measures lifecycle coverage, artifact ownership, blocker readiness, and missing mechanisms against Matt Pocock skills v1.1.</p>
    </header>
    <main>
      <section class="metrics" aria-label="Summary metrics">
        <div class="metric"><strong>${score}/${maxScore}</strong><span>readiness score</span></div>
        <div class="metric"><strong>${covered}</strong><span>covered stages</span></div>
        <div class="metric"><strong>${partial}</strong><span>partial stages</span></div>
        <div class="metric"><strong>${missing}</strong><span>missing stages</span></div>
        <div class="metric"><strong>${optional}</strong><span>optional gaps</span></div>
      </section>
      <section class="section">
        <table>
          <thead>
            <tr>
              <th>Stage and metric</th>
              <th>Status</th>
              <th>Matt mechanism</th>
              <th>KRN mechanism</th>
              <th>Artifact</th>
              <th>Agent-sized</th>
              <th>Blockers</th>
              <th>Maker/checker</th>
              <th>Stop gate</th>
              <th>Finding</th>
              <th>Next move</th>
            </tr>
          </thead>
          <tbody>${rows}
          </tbody>
        </table>
      </section>
      <section class="callouts" aria-label="Priority gaps">
        <article class="callout"><h2>1. diagnosing-bugs</h2><p>No tight red-capable repro gate exists yet. This is the cleanest new skill candidate.</p></article>
        <article class="callout"><h2>2. context / ADR lane</h2><p>Decisions and vocabulary need a small durable home that is not runtime memory or a second roadmap.</p></article>
        <article class="callout"><h2>3. Beads wayfinding</h2><p>Beads has dependencies, but needs explicit destination, frontier, fog, decisions-so-far, and one-ticket-per-session discipline.</p></article>
        <article class="callout"><h2>4. to-spec</h2><p>Large fuzzy work lacks a settled spec artifact between conversation and ticket slicing.</p></article>
      </section>
      <section class="section utility-panel" aria-label="KRN skill utility">
        <table>
          <thead>
            <tr>
              <th>Skill</th>
              <th>Po co istnieje</th>
              <th>Kiedy uzywac</th>
              <th>Realny zysk</th>
              <th>Ryzyko</th>
              <th>Decyzja</th>
            </tr>
          </thead>
          <tbody>${utilityRows}
          </tbody>
        </table>
      </section>
      <section class="skills-panel" aria-label="KRN skill files">
        <div class="skills-header">
          <h2>KRN Skills Tree</h2>
          <p>Expandable source view generated from .agents/skills. Use this when the loop diagnosis needs exact skill text, not a summary.</p>
        </div>
${skillTree}
      </section>
    </main>
    <script>
      document.querySelectorAll("[data-copy]").forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.preventDefault();
          const name = button.getAttribute("data-copy");
          const node = button.closest(".skill-node");
          if (!node) return;
          const sources = Array.from(node.querySelectorAll("pre")).map((pre) => pre.innerText);
          await navigator.clipboard.writeText(sources.join("\\n\\n"));
          const original = button.innerText;
          button.innerText = "Copied";
          window.setTimeout(() => { button.innerText = original; }, 1200);
        });
      });
    </script>
  </body>
</html>
`;
};

const writeSkillSet = async (skills, folder) => {
  const dir = path.join(outRoot, folder);
  await mkdir(dir, { recursive: true });
  for (const skill of skills) {
    await writeFile(
      path.join(dir, `${skill.name}.md`),
      skillDoc(skill),
      "utf8"
    );
  }
};

const main = async () => {
  const krnSkills = await loadSkills(krnSkillRoot, "KRN");
  const mattSkills = await loadSkills(mattSkillRoot, "Matt Pocock");

  await rm(outRoot, { recursive: true, force: true });
  await mkdir(outRoot, { recursive: true });
  await writeSkillSet(krnSkills, "krn-skills");
  await writeSkillSet(mattSkills, "matt-skills");

  const inventoryRows = (skills) =>
    skills.map((skill) => `| ${skill.name} | ${skill.role} | ${skill.isUserInvoked ? "user" : "model"} | ${skill.hasStop ? "yes" : "no"} | ${skill.hasOutput ? "yes" : "no"} | ${skill.hasVerification ? "yes" : "no"} | ${skill.lineCount} |`);

  await writeFile(
    path.join(outRoot, "skill-graph.md"),
    `# Skill Graph

Generated from current \`.agents/skills/*/SKILL.md\` and optional local Matt Pocock skill clone.
This graph is a navigation aid, not a taxonomy. It groups skills by likely loop
role so the unclear parts of the system are visible.

${mermaidGraph(krnSkills, mattSkills)}
`,
    "utf8"
  );

  await writeFile(
    path.join(outRoot, "comparison.md"),
    `# Skill Inventory

This is an inventory, not a verdict. It intentionally avoids text-similarity
scores because the useful question is whether a skill has a clear role in the
engineering loop.

## KRN Skills

| Skill | Role | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|
${inventoryRows(krnSkills).join("\n")}

## Matt Skills

| Skill | Role | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|
${inventoryRows(mattSkills).join("\n")}
`,
    "utf8"
  );

  await writeFile(path.join(outRoot, "loop-diagnostics.md"), lifecycleMarkdown(), "utf8");
  await writeFile(path.join(outRoot, "skill-utility-pl.md"), skillUtilityMarkdown(krnSkills), "utf8");
  await writeFile(path.join(outRoot, "skill-bundle.md"), skillBundleMarkdown(krnSkills), "utf8");
  await writeFile(
    path.join(repoRoot, "skill-analysis", "dashboard.html"),
    dashboardHtml(krnSkills).replace(/[ \t]+$/gm, ""),
    "utf8"
  );

  await writeFile(
    path.join(outRoot, "index.md"),
    `# Skill Analysis Index

Generated files:

- ${link("../dashboard.html", "HTML dashboard")}
- ${link("../NORMALIZATION-GAPS.md", "Normalization gaps")}
- ${link("loop-diagnostics.md", "Loop diagnostics")}
- ${link("skill-utility-pl.md", "Polish skill utility")}
- ${link("skill-bundle.md", "KRN skills bundle")}
- ${link("comparison.md", "Comparison matrix")}
- ${link("skill-graph.md", "Mermaid skill graph")}
- ${link("krn-skills/", "KRN skill cards")}
- ${link("matt-skills/", "Matt Pocock skill cards")}

## Current Counts

- KRN skills: ${krnSkills.length}
- Matt skills: ${mattSkills.length}

Regenerate with:

\`\`\`sh
rtk proxy node skill-analysis/generate-skill-analysis.mjs
\`\`\`
`,
    "utf8"
  );
};

await main();
