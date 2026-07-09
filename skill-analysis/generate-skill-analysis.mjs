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
  ["KRN:beads", "router"],
  ["KRN:code-review", "checker"],
  ["KRN:diagnosing-bugs", "maker"],
  ["KRN:domain-modeling", "decision"],
  ["KRN:krn-implementation", "maker"],
  ["KRN:source-to-decision", "decision"],
  ["KRN:target-repo-testing", "checker"],
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

const skillStripDecisions = new Map([
  ["beads", {
    stripDecision: "active",
    ownerSkill: "beads",
    reason: "Durable task graph, planning modes, blocker edges, frontier, and handoff state need one tracker substrate."
  }],
  ["domain-modeling", {
    stripDecision: "active",
    ownerSkill: "domain-modeling",
    reason: "Vocabulary, context, ADR, and codebase-design decisions share the same concept ownership lane."
  }],
  ["source-to-decision", {
    stripDecision: "active",
    ownerSkill: "source-to-decision",
    reason: "Source evidence still needs a distinct mechanism-to-decision gate."
  }],
  ["krn-implementation", {
    stripDecision: "new",
    ownerSkill: "krn-implementation",
    reason: "Unifies maker procedures that were too narrow to remain top-level invocation skills."
  }],
  ["diagnosing-bugs", {
    stripDecision: "new",
    ownerSkill: "diagnosing-bugs",
    reason: "Diagnosis needs an explicit red-capable repro gate that TDD did not cover."
  }],
  ["code-review", {
    stripDecision: "active",
    ownerSkill: "code-review",
    reason: "Checker behavior and evidence review belong behind one review entrypoint."
  }],
  ["target-repo-testing", {
    stripDecision: "active",
    ownerSkill: "target-repo-testing",
    reason: "Target-repo dirty-state and write-authority checks remain a distinct proof boundary."
  }],
  ["activation-engine", {
    stripDecision: "merged",
    ownerSkill: "krn-implementation",
    target: "references/activation.md",
    reason: "Activation is implementation procedure, not an independent top-level workflow."
  }],
  ["brain-store-schema", {
    stripDecision: "merged",
    ownerSkill: "krn-implementation",
    target: "references/store-schema.md",
    reason: "Store schema work is implementation procedure with DB-specific verification."
  }],
  ["codex-adapter-plan", {
    stripDecision: "merged",
    ownerSkill: "krn-implementation",
    target: "references/codex-adapter.md",
    reason: "Codex adapter rendering is a specialized implementation boundary."
  }],
  ["tdd", {
    stripDecision: "merged",
    ownerSkill: "krn-implementation",
    target: "references/tdd.md",
    reason: "TDD is a maker reference used inside implementation, not a standalone KRN workflow."
  }],
  ["typescript-type-safety", {
    stripDecision: "merged",
    ownerSkill: "krn-implementation",
    target: "references/type-safety.md",
    reason: "Type safety is a reusable implementation boundary reference."
  }],
  ["codebase-design", {
    stripDecision: "merged",
    ownerSkill: "domain-modeling",
    target: "references/codebase-design.md",
    reason: "Architecture seams and names are part of domain concept ownership."
  }],
  ["evidence-review-loop", {
    stripDecision: "merged",
    ownerSkill: "code-review",
    target: "references/evidence-review.md",
    reason: "Evidence capture is checker procedure under code review."
  }],
  ["handoff-compact", {
    stripDecision: "merged",
    ownerSkill: "beads",
    target: "templates/handoff.md",
    reason: "Handoff is Beads state transfer, not a separate public skill."
  }]
]);

const stripDecisionRows = () => [...skillStripDecisions.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, decision]) => ({
    name,
    stripDecision: decision.stripDecision,
    ownerSkill: decision.ownerSkill,
    target: decision.target ?? "SKILL.md",
    reason: decision.reason
  }));

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
    const references = referenceFiles.filter((file) => file.startsWith("references/"));
    const templates = referenceFiles.filter((file) => file.startsWith("templates/"));
    const scripts = referenceFiles.filter((file) => file.startsWith("scripts/"));
    const signalText = `${name} ${description} ${sections.join(" ")} ${body.slice(0, 2500)}`;
    const routingText = `${name} ${description}`;
    const role = roleOverrides.get(`${source}:${name}`)
      ?? inferOne(roleRules, routingText, inferOne(roleRules, signalText, "reference"));
    const stripDecision = source === "KRN"
      ? skillStripDecisions.get(name) ?? {
        stripDecision: "active",
        ownerSkill: name,
        reason: "Current repo-local active skill."
      }
      : undefined;
    skills.push({
      source,
      name,
      dir: path.relative(repoRoot, dir),
      skillPath: path.relative(repoRoot, skillPath),
      description,
      text,
      sections,
      referenceFiles,
      references,
      templates,
      scripts,
      resourceFiles,
      role,
      stripDecision: stripDecision?.stripDecision,
      ownerSkill: stripDecision?.ownerSkill,
      stripReason: stripDecision?.reason,
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
- Strip decision: ${skill.stripDecision ?? "n/a"}
- Owner skill: ${skill.ownerSkill ?? skill.name}
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

## References

${skill.references.map((file) => `- ${file}`).join("\n") || "- _None._"}

## Templates

${skill.templates.map((file) => `- ${file}`).join("\n") || "- _None._"}

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

  const decisionRows = stripDecisionRows().map((row) =>
    `| ${row.name} | ${row.stripDecision} | ${row.ownerSkill} | \`${row.target}\` | ${row.reason} |`
  );

  return `# KRN Skills Bundle

This is a repomix-style single document for reading, searching, and copying the
current repo-local KRN skills. It is generated from \`.agents/skills/**\`.

## Strip Decisions

| Skill/procedure | strip_decision | Owner skill | Target | Reason |
|---|---|---|---|---|
${decisionRows.join("\n")}

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
    status: "covered",
    score: 2,
    metric: "Ambiguous intent is clarified with the human before implementation.",
    krnFinding: "KRN keeps grill behavior inside domain-modeling: ask one narrow operator question when term, owner, or decision is ambiguous; never self-grill.",
    missingMechanism: "None for this strip; split only if ambiguous non-domain decisions need independent routing.",
    nextMove: "Keep grill as domain-modeling behavior, not a top-level skill."
  },
  {
    id: "spec",
    stage: "Spec",
    matt: "to-spec",
    krn: "beads to-spec mode, templates/spec.md, source-to-decision",
    status: "covered",
    score: 2,
    metric: "Conversation or rough idea becomes an agreed build spec.",
    krnFinding: "KRN keeps to-spec inside Beads and uses a spec template when a settled artifact is needed before slicing.",
    missingMechanism: "None for this strip; validate through actual planning use.",
    nextMove: "Keep specs as Beads artifacts unless repeated independent invocation pressure appears."
  },
  {
    id: "tickets",
    stage: "Tickets",
    matt: "to-tickets",
    krn: "beads to-tickets mode, templates/ticket.md",
    status: "covered",
    score: 2,
    metric: "Spec becomes tracer-bullet, agent-sized tickets with blocking edges.",
    krnFinding: "KRN keeps to-tickets inside Beads with agent-sized acceptance criteria, proof boundaries, and native dependency edges.",
    missingMechanism: "None for this strip; failures should become Beads workflow repairs.",
    nextMove: "Use bd ready as the frontier proof instead of adding a separate to-tickets skill."
  },
  {
    id: "wayfinder",
    stage: "Wayfinder",
    matt: "wayfinder",
    krn: "beads wayfinding mode, templates/wayfinding-map.md",
    status: "covered",
    score: 2,
    metric: "Huge foggy work becomes a map of decision tickets with a frontier.",
    krnFinding: "KRN has explicit wayfinding mode, a map template, one-ticket-per-session discipline, native blockers, and bd ready frontier.",
    missingMechanism: "None for this strip; split later only if Beads mode causes premature completion.",
    nextMove: "Keep wayfinding as a Beads mode until independent invocation pressure is proven."
  },
  {
    id: "research",
    stage: "Research",
    matt: "research",
    krn: "source-to-decision",
    status: "covered",
    score: 2,
    metric: "External sources become decision-grade evidence, not broad summaries.",
    krnFinding: "KRN intentionally routes research through source-to-decision so sources become mechanisms, decisions, consumers, and falsifiers instead of archives.",
    missingMechanism: "No separate research skill unless pure source legwork repeatedly has a consumer independent of decisions.",
    nextMove: "Reject decorative research artifacts; create Beads follow-up only when a source has a consumer."
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
    krn: "krn-implementation, Codex default execution",
    status: "covered",
    score: 2,
    metric: "One ticket is implemented with the right maker skill and verification chain.",
    krnFinding: "KRN now has one implementation entrypoint with activation, store, adapter, TDD, and TypeScript references.",
    missingMechanism: "None for maker routing; checker separation still depends on review workflow.",
    nextMove: "Use specialized references through krn-implementation instead of top-level maker skill sprawl."
  },
  {
    id: "review",
    stage: "Code Review",
    matt: "code-review with Fowler smells",
    krn: "code-review, code-review/references/evidence-review.md, target-repo-testing",
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
    krn: "diagnosing-bugs",
    status: "covered",
    score: 2,
    metric: "Reported bugs require a tight red-capable loop before hypotheses.",
    krnFinding: "KRN now has a diagnosis entrypoint that forbids hypotheses or fixes before a red-capable repro command exists and has been run.",
    missingMechanism: "None for this strip; enforce through usage.",
    nextMove: "Use diagnosis for unknown symptoms and krn-implementation/tdd for known behavior changes."
  },
  {
    id: "context",
    stage: "Context / ADR",
    matt: "domain-modeling, CONTEXT.md, docs/adr",
    krn: "domain-modeling, CONTEXT.md, CONVENTIONS.md, docs/adr",
    status: "covered",
    score: 2,
    metric: "Resolved vocabulary and surprising decisions survive fresh agent context.",
    krnFinding: "KRN owns vocabulary in CONTEXT.md, artifact rules in CONVENTIONS.md, and rare hard-to-reverse decisions in docs/adr/ through domain-modeling.",
    missingMechanism: "None for this strip; avoid per-skill ADR folders and markdown runtime memory.",
    nextMove: "Update the smallest stable owner when a vocabulary or operating decision is resolved."
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
    stopGate: "yes"
  }],
  ["spec", {
    artifact: "Spec",
    agentSized: "yes",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "yes"
  }],
  ["tickets", {
    artifact: "Beads issues",
    agentSized: "yes",
    blockerGraph: "yes",
    makerChecker: "partial",
    stopGate: "yes"
  }],
  ["wayfinder", {
    artifact: "Map issue",
    agentSized: "yes",
    blockerGraph: "yes",
    makerChecker: "yes",
    stopGate: "yes"
  }],
  ["research", {
    artifact: "Source decision",
    agentSized: "yes",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "yes"
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
    agentSized: "yes",
    blockerGraph: "partial",
    makerChecker: "partial",
    stopGate: "yes"
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
    stopGate: "yes"
  }],
  ["context", {
    artifact: "Context/ADR candidate",
    agentSized: "n/a",
    blockerGraph: "n/a",
    makerChecker: "partial",
    stopGate: "yes"
  }]
]);

const lifecycleDiagnostics = lifecycleStages.map((stage) => ({
  ...stage,
  ...stageMechanics.get(stage.id)
}));

const skillUtility = new Map([
  ["beads", {
    purpose: "Durable task graph dla dużego loopu: triage, to-spec, to-tickets, wayfinding, handoff, zależności i frontier.",
    use: "Gdy praca ma przetrwać sesję, wymaga blockerów, równoległości, handoffu albo podziału na agent-sized issues.",
    gain: "Przejmuje Mattowe to-spec/to-tickets/wayfinder bez tworzenia drugiego planning surface poza trackerem.",
    risk: "Może stać się overloaded routerem, jeśli tryby nie kończą się konkretnymi Beads artifacts i bd ready frontier.",
    decision: "Active; keep planning modes inside Beads unless independent invocation pressure appears."
  }],
  ["code-review", {
    purpose: "Niezależny checker dla diffu: standardy, spec fit, roadmap drift, smell baseline, evidence review i proof gaps.",
    use: "Po implementacji, przy PR/diff/review albo gdy trzeba odsiać test theater i shallow modules.",
    gain: "Zawiera Fowler-style smells, rozdziela Standards od Spec i przejmuje evidence-review jako reference.",
    risk: "Traci sens, jeśli ten sam agent ocenia własną zmianę bez świeżego kontekstu lub bez file:line evidence.",
    decision: "Active; pair explicitly after maker work."
  }],
  ["diagnosing-bugs", {
    purpose: "Diagnostyka nieznanych awarii: najpierw czerwony repro command, potem hipotezy i fix.",
    use: "Gdy coś jest broken, flaky, slow, throwing albo regressed, a przyczyna nie jest udowodniona.",
    gain: "Blokuje theory-first debugging i oddziela diagnozę od TDD dla znanego zachowania.",
    risk: "Jeśli repro jest zbyt szerokie albo pominięte, skill zamienia się w zwykłe fix-by-inspection.",
    decision: "New active skill; keep because it enforces a distinct red-capable diagnosis loop."
  }],
  ["domain-modeling", {
    purpose: "Pilnuje słownika, nazw domenowych, context/ADR lane, grill behavior i codebase-design decisions.",
    use: "Gdy pojawia się niejasne nazewnictwo, public seam, concept ownership albo operating decision.",
    gain: "Przejmuje grill-with-docs i codebase-design bez osobnych top-level skills; resolved terms trafiają do CONTEXT/CONVENTIONS/docs/adr.",
    risk: "Może stać się prose-only, jeśli nie kończy się właścicielem, consumerem, falsifierem albo targeted rg/typecheck proof.",
    decision: "Active; ask one narrow human question when ambiguous and never self-grill."
  }],
  ["krn-implementation", {
    purpose: "Maker entrypoint dla runtime work: activation, store schema, Codex adapter, TDD i TypeScript boundaries.",
    use: "Gdy implementujemy KRN behavior, migracje, adapter output, test falsifier albo TypeScript boundary.",
    gain: "Redukuje skill zoo: pięć wyspecjalizowanych maker skills staje się progressive-disclosure references.",
    risk: "Może być za szeroki, jeśli agent nie wybierze konkretnej reference i proof command przed edycją.",
    decision: "New active skill; keep references short and load only the relevant branch."
  }],
  ["source-to-decision", {
    purpose: "Przerabia źródła na decyzje: source -> mechanism -> KRN implication -> decision/rejection.",
    use: "Gdy architektura, skill, policy, MCP, eval albo TypeScript decision zależy od docs/papers/practitioner writing.",
    gain: "Przejmuje research jako decision-grade source gate zamiast tworzyć research archive.",
    risk: "Może być za ciężki dla prostego linku; należy odrzucać źródła bez consumer/falsifier.",
    decision: "Active; no separate research skill until pure source legwork earns one."
  }],
  ["target-repo-testing", {
    purpose: "Checker/protocol dla pracy na target repo: dirty state, write authority, proof/non-proof, handoff.",
    use: "Gdy KRN inspektuje, testuje lub naprawia zewnętrzne repo przez harness.",
    gain: "Chroni przed fałszywym proofem i przypadkowym mutowaniem cudzego stanu.",
    risk: "Może być zbyt duży i mieszać setup, test, repair oraz handoff.",
    decision: "Active; watch for sequence split if agents rush through phases."
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

1. Validate the new \`diagnosing-bugs\` skill on real failures.
2. Keep the context/ADR lane small so vocabulary and surprising decisions survive
   fresh-agent loops.
3. Validate Beads \`to-spec\`, \`to-tickets\`, and \`wayfinding\` modes through
   real issue creation.
4. Watch whether \`krn-implementation\` stays a useful entrypoint or becomes too broad.
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

\`to-spec\`, \`to-tickets\` i \`wayfinder\` zostaja trybami \`beads\`, bo ich
naturalnym artefaktem koncowym jest tracker: issue body, acceptance criteria,
dependency edges i frontier.

\`grill\` zostaje zachowaniem \`domain-modeling\`: pytamy operatora, gdy term,
owner albo decision jest niejasne, i nie odpowiadamy sami za operatora.
\`research\` zostaje \`source-to-decision\`, bo KRN potrzebuje decyzji,
consumerow i falsifierow, nie archiwum linkow. \`prototype\` jest opcjonalnym
brakiem, dopoki realny UX/state-model artifact nie bedzie mial consumerow.

## Skill Utility Table

| Skill | Rola | Po co istnieje | Realny zysk | Ryzyko | Decyzja |
|---|---|---|---|---|---|
${rows.join("\n")}

## Kandydaci na nastepne zmiany

1. Sprawdzic \`diagnosing-bugs\` na prawdziwym failure i doprecyzowac repro gate.
2. Sprawdzic Beads \`wayfinding\` na duzej mglistej pracy i potwierdzic, ze
   frontier przez \`bd ready\` wystarcza.
3. Pilnowac, czy \`krn-implementation\` nie robi sie zbyt szeroki; jesli tak,
   split musi miec consumer/falsifier.
4. Dodac osobny \`prototype\` tylko po realnym UX/state-model consumerze.
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
        <article class="callout"><h2>1. Repro gate</h2><p>Validate diagnosing-bugs on real failures: no repro command means no hypothesis and no fix.</p></article>
        <article class="callout"><h2>2. Beads frontier</h2><p>Validate to-spec, to-tickets, and wayfinding by checking that bd ready exposes the next frontier.</p></article>
        <article class="callout"><h2>3. Implementation breadth</h2><p>krn-implementation must route to one reference and proof path, not become a new omnibus checklist.</p></article>
        <article class="callout"><h2>4. Prototype stays optional</h2><p>Add a prototype skill only after a real UX or state-model consumer earns it.</p></article>
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
    skills.map((skill) => `| ${skill.name} | ${skill.role} | ${skill.stripDecision ?? "n/a"} | ${skill.ownerSkill ?? skill.name} | ${skill.references.length} | ${skill.templates.length} | ${skill.isUserInvoked ? "user" : "model"} | ${skill.hasStop ? "yes" : "no"} | ${skill.hasOutput ? "yes" : "no"} | ${skill.hasVerification ? "yes" : "no"} | ${skill.lineCount} |`);

  const stripRows = stripDecisionRows().map((row) =>
    `| ${row.name} | ${row.stripDecision} | ${row.ownerSkill} | \`${row.target}\` | ${row.reason} |`
  );

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

| Skill | Role | strip_decision | Owner | References | Templates | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|---|---|---|---|
${inventoryRows(krnSkills).join("\n")}

## KRN Strip Decisions

| Skill/procedure | strip_decision | Owner skill | Target | Reason |
|---|---|---|---|---|
${stripRows.join("\n")}

## Matt Skills

| Skill | Role | strip_decision | Owner | References | Templates | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|---|---|---|---|
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
