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
    const referenceFiles = (await readdir(dir, { withFileTypes: true }).catch(() => []))
      .filter((entry) => entry.isFile() && entry.name !== "SKILL.md")
      .map((entry) => entry.name)
      .sort();
    const signalText = `${name} ${description} ${sections.join(" ")} ${body.slice(0, 2500)}`;
    const routingText = `${name} ${description}`;
    const role = roleOverrides.get(`${source}:${name}`)
      ?? inferOne(roleRules, routingText, inferOne(roleRules, signalText, "reference"));
    skills.push({
      source,
      name,
      dir: path.relative(repoRoot, dir),
      description,
      sections,
      referenceFiles,
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

  await writeFile(
    path.join(outRoot, "index.md"),
    `# Skill Analysis Index

Generated files:

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
