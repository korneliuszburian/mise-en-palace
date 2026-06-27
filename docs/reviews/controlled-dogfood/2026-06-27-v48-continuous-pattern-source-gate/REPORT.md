# V48 Continuous Pattern Source-To-Decision Gate

Status: complete.

Date: 2026-06-27.

## Executive Verdict

V48 turns pattern intake into a standing execution gate for every non-trivial
KRN slice. The gate is intentionally broader than TypeScript: it covers infra,
harness, CI, memory, skills, target workflow, Codex surfaces, evals, security,
operator UX, and research/papers. It does not create a source crawler, research
archive, or course index. A pattern becomes useful only when it maps to a
mechanism, KRN implication, decision/rejection, consumer, and falsifier.

## Why This Exists

The user clarified that the Matt Pocock / TypeScript example was only one
instance of the desired loop. KRN should continuously condense strong patterns,
courses, papers, public docs, practitioner writing, local evidence, and target
evidence into better engineering behavior across the whole product.

The risk is source hoarding: collecting links, papers, and course fragments
without changing any future behavior. V48 rejects that pattern.

## Durable Change

The durable consumer is the existing skill:

```txt
.agents/skills/source-to-decision/SKILL.md
```

The skill now includes a `Continuous Pattern Gate` requiring every non-trivial
slice to classify whether it touches one of these pattern surfaces:

```txt
infra / storage / migrations / queues
harness / activation / memory / review gates
CI / release / eval / Promptfoo
Codex surfaces / skills / hooks / MCP / subagents
target-repo workflow
TypeScript boundaries
security / permissions / trust boundaries
operator UX / CLI / readback
```

If a surface applies, Codex must either cite an existing KRN source, standard,
ADR, or skill; add a bounded source decision; or explicitly reject/defer source
work with a reason.

## Source Intake Boundary

Allowed source classes:

```txt
official docs
papers
high-quality courses
practitioner writing
competitor docs
repo-local evidence
target-repo evidence
user-provided research
```

Legal/content boundary:

- Do not copy paid/proprietary course material into KRN.
- Use public pages, user-supplied notes, or short mechanism summaries.
- Prefer links and mechanisms over transcripts.

## Consumer Routing

Patterns must route to one of:

```txt
standard
skill
ADR
eval/golden candidate
memory/source candidate
CLI/readback/CI behavior
bounded repair
reject
```

No consumer means no durable intake.

## Falsifier

The gate is failing if future slices:

- cite sources without mechanism and decision;
- store broad research notes as active context;
- copy paid course material;
- implement patterns without a consumer and falsifier;
- treat papers/practitioner/course guidance as product truth without local proof;
- keep repeating the same research discussion without creating a standard,
  skill, ADR, eval candidate, memory/source candidate, or bounded repair.

## What This Proves

- KRN now has a reusable per-slice gate for continuous source-backed pattern
  condensation.
- Pattern intake is explicitly product-wide, not TypeScript-only.
- The durable surface is a skill, not another roadmap or research archive.

## What This Does Not Prove

- It does not prove product readiness.
- It does not prove all strong patterns have been ingested.
- It does not prove any specific course/paper is authoritative.
- It does not prove the gate improves code until applied in a future slice.
- It does not replace local tests, DB replay, target trials, or operator proof.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git diff --check` | passed | Markdown/plan/skill diff whitespace is clean | Product value or source coverage |
| `pnpm typecheck` | passed on rerun with explicit `TYPECHECK_EXIT:0` | TypeScript workspace still typechecks after plan/skill changes | Pattern gate usefulness or product readiness |
| `pnpm test` | passed | Existing workspace tests still pass after plan/skill changes | Pattern gate usefulness or product readiness |

## Condensation Decision

Accepted:

```txt
Continuous Pattern Source-To-Decision Gate
```

Surface:

```txt
.agents/skills/source-to-decision/SKILL.md
PLANS.md operating rules
```

Next application:

```txt
V49 — First Continuous Pattern Gate Application
```

V49 should apply the new gate to one bounded real KRN slice and record whether
the gate changed a decision, rejected a decorative source, created a useful
consumer, or exposed friction.
