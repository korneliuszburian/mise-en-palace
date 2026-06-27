# V13 Research-To-Brain Decision Lane Gate

Status: skill refinement and surface gate.

Date: 2026-06-27.

## Executive Verdict

V13 accepts a bounded refinement to the existing `source-to-decision` skill and
rejects a new research subsystem.

KRN already has the right doctrine:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

The gap was execution clarity for research-like inputs: papers, official docs,
practitioner writing, courses, competitor docs, local evidence, and user
provided material. The existing skill named those triggers, but did not yet
make the intake rules harsh enough to prevent source hoarding.

Decision:

```txt
refine existing skill: yes
new research foundry/database/crawler: no
new MCP/subagent workflow: no
new passive research archive: no
```

## Scope

Read:

- `docs/KRN_KERNEL.md`;
- `.agents/skills/source-to-decision/SKILL.md`;
- `docs/KRN_SOURCES.md`;
- `docs/standards/typescript-excellence.md`;
- `docs/standards/typescript-boundaries.md`;
- recent source-backed V08/V10 reports;
- local search results for source-to-decision and research references.

Changed:

- `.agents/skills/source-to-decision/SKILL.md`.

Non-goals:

- no product source changes;
- no source crawler;
- no research database;
- no broad eval platform;
- no MCP/subagent/hook implementation;
- no new plan-sprawl surface;
- no passive paper archive.

## Evidence Table

| Evidence | Finding | Decision |
|---|---|---|
| `docs/KRN_KERNEL.md` | Kernel law already requires retained sources to pass source-to-decision. | Keep this as architecture law. |
| `.agents/skills/source-to-decision/SKILL.md` | Skill exists and is the owning surface for external docs, papers, practitioner writing, local evidence, and user material. | Refine existing skill, do not create a new one. |
| `docs/KRN_SOURCES.md` | Durable source map already keeps Codex/OpenAI sources with mechanism, implication, decision, and does-not-prove. | Use as durable map, not as a research dump. |
| TypeScript standards | Matt Pocock-style discipline is already condensed into repo-specific rules. | Practitioner/course guidance should become standards, not decorative citations. |
| V08/V10 reports | Official docs were useful when mapped into concrete decisions and falsifiers. | Continue source-backed decisions; reject surface expansion from aspiration. |
| Search results | Raw research remains quarantined in `docs/materials/`; derived ledgers/reports carry decisions. | Keep raw materials out of active context unless auditing them. |

## Source-To-Decision Entries

```yaml
source_id: krn-kernel-source-decision-law
title: KRN Kernel Contract
trust_tier: high local
mechanism: retained sources must map through mechanism, implication, decision or rejection, and falsifier.
krn_implication: V13 should not create a research layer; it should strengthen the execution gate that already owns source intake.
decision: adopt as controlling rule for research-to-brain.
does_not_prove: every current source has already been mapped correctly.
consumer: source-to-decision skill and future reports.
falsifier: future runs retain links or papers without mechanism, consumer, and falsifier.
```

```yaml
source_id: source-to-decision-skill
title: Existing source-to-decision skill
trust_tier: high local
mechanism: the skill triggers when Codex cites OpenAI docs, Cookbook examples, papers, practitioner writing, competitor docs, local evidence, or user-provided material.
krn_implication: the skill is the correct bounded surface for research-to-brain execution.
decision: refine existing skill with stricter research intake rules.
does_not_prove: a broader research product is useful now.
consumer: `.agents/skills/source-to-decision/SKILL.md`.
falsifier: a future research decision needs fields or workflow that the refined skill cannot express.
```

```yaml
source_id: typescript-excellence-standard
title: KRN TypeScript Excellence Standard
trust_tier: high local
mechanism: external style doctrine is already condensed into repo-specific rules: domain types, unknown-first input, explicit public types, discriminated unions, no type weakening.
krn_implication: Matt Pocock-style TypeScript guidance should enter KRN as standards and tests, not as recurring source links.
decision: keep practitioner guidance as standards consumer; reject raw course-note accumulation.
does_not_prove: every TypeScript boundary in the repo is perfect.
consumer: TypeScript standards and future TS repair slices.
falsifier: a future TypeScript task cites course/practitioner material without converting it into a rule, test, or rejection.
```

## What Changed

The `source-to-decision` skill now includes:

- research intake rules;
- explicit rejection of source hoarding;
- trust/claim boundaries for papers, practitioner/course guidance, and official
  docs;
- preferred consumers: durable source maps, ADRs, standards, skills, eval
  candidates, and memory/source candidates;
- optional `decision_kind` and `candidate_output` fields.

The strongest added rule is:

```txt
Source without mechanism is decoration.
Mechanism without KRN implication is a note.
Implication without decision or rejection is backlog pressure.
Decision without falsifier is dogma.
```

## Accepted / Rejected Surfaces

| Candidate | Decision | Why |
|---|---|---|
| Refine `source-to-decision` skill | accept | Existing owning surface; smallest repair. |
| New research skill | reject now | Would duplicate the existing skill. |
| Research database / crawler | reject now | No current product question requires broad source intake. |
| Research MCP surface | reject now | V10 already rejected MCP until CLI/files/DB/readback are insufficient. |
| Research subagents | reject now | No repeated read-heavy bottleneck with stable output contract. |
| TypeScript standards consumer | keep | Practitioner guidance is already condensed into standards. |

## What This Proves

- KRN has an explicit execution lane for research-like inputs.
- The lane now requires sources to become decisions, rejections, hypotheses,
  candidates, standards, skills, or falsifiers.
- The current answer is a skill refinement, not a new research architecture.

## What This Does Not Prove

- All future research sources will be high quality.
- Papers or practitioner courses should automatically drive implementation.
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator usability.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk sed ... .agents/skills/source-to-decision/SKILL.md` | passed | Existing skill was inspected before editing. | Does not prove future usage. |
| `rtk sed ... docs/KRN_SOURCES.md` | passed | Durable source map was inspected. | Does not prove every source is current. |
| `rtk sed ... docs/standards/typescript-excellence.md` | passed | TypeScript standard already condenses practitioner guidance. | Does not prove all TS code is ideal. |
| `rtk rg ... source-to-decision ... research` | passed | Current source/research references were sampled. | Does not prove there are no unmapped sources. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic completeness. |
| `rtk node -e <skill sanity>` | passed | `source-to-decision` frontmatter and research intake section are present. | Does not prove future skill trigger quality. |

## Condensation Decision

```txt
finding:
  Research-to-brain exists as doctrine and skill, but needed stricter intake
  wording to prevent source hoarding.

frequency:
  repeated user/product concern and recurring source-backed decisions in V08/V10.

candidate_surface:
  existing skill refinement.

decision:
  accept V13-00 as skill refinement; reject new research subsystem.

rationale:
  A bounded skill is enough to force source -> mechanism -> decision ->
  falsifier for papers/docs/standards without adding architecture.

evidence:
  KRN kernel law, existing skill, KRN sources doc, TypeScript standards, V08/V10
  source-backed reports.

does_not_prove:
  product readiness, source quality at scale, or future research automation need.

falsifier:
  future work repeatedly needs structured research decisions that cannot be
  expressed by the skill, ADRs, standards, source maps, or candidates.
```

## Next Recommended Action

Continue the internal engineering loop with a bounded implementation or proof
task selected from current evidence. Do not build a research product, MCP
surface, crawler, or subagent workflow unless a future falsifier triggers it.
