# V287 Brain Knowledge External Pattern Intake Trial

Status: complete.

## Executive Verdict

V287 proves KRN can retain a small set of external/public Codex workflow
patterns as reviewable brain knowledge cards without turning research intake
into source hoarding. The retained cards are searchable through the existing
read-only knowledge catalog and each includes source refs, evidence refs,
consumer, falsifier, and does-not-prove boundary.

This does not make the brain product-ready. It proves a controlled intake path
for external best-practice mechanisms.

## Scope

Added three retained pattern decisions from already mapped OpenAI/Codex source
decisions:

- `codex-goal-continuation-evidence-contract`
- `codex-execplan-living-validation-loop`
- `codex-prompt-task-contract-proof-boundary`

Updated:

- `docs/brain-knowledge/catalog.json`
- `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
- `packages/cli/src/runKnowledgeCardsCommand.test.ts`

No DB, Memory Core, SourceDecision, candidate status, API, MCP, dashboard, or
runtime mutation path was changed.

## Source-To-Decision Intake

### Codex Goals

```yaml
source_id: codex-goal-continuation-evidence-contract
title: Goals in Codex
url_or_ref: docs/KRN_SOURCES.md#goals-in-codex
trust_tier: high
source_class: official docs
mechanism: goals support continuation with explicit objective and evidence
krn_implication: GOAL.md should stay compact, current, and evidence-bound
decision_kind: adopt
decision: retain as a brain knowledge card for compact goal continuation
consumer: root GOAL.md continuation contract
falsifier: after compaction Codex follows a stale objective or completed slice
does_not_prove: goals are product memory or KRN is product-ready
```

### Codex ExecPlans

```yaml
source_id: codex-execplan-living-validation-loop
title: Codex ExecPlans
url_or_ref: docs/KRN_SOURCES.md#execplans
trust_tier: high
source_class: official docs
mechanism: ExecPlans preserve objective, discoveries, decisions, validation, and next work
krn_implication: PLANS.md carries detailed continuous execution while PLAN.md stays compact
decision_kind: adopt
decision: retain as a brain knowledge card for long-running validation loops
consumer: root PLANS.md continuous ExecPlan
falsifier: a fresh continuation cannot recover active state without broad rereads
does_not_prove: PLANS.md should carry raw logs forever or plan hygiene creates product value alone
```

### Codex Prompting Guide

```yaml
source_id: codex-prompt-task-contract-proof-boundary
title: Codex Prompting Guide
url_or_ref: docs/KRN_SOURCES.md#codex-prompting-guide
trust_tier: high
source_class: official docs
mechanism: explicit tasks, constraints, expected outputs, and verification improve execution
krn_implication: non-trivial KRN tasks need task contracts with proof/non-proof boundaries
decision_kind: adopt
decision: retain as a brain knowledge card for generated task contracts
consumer: generated PLANS.md task contracts and future Codex-facing prompts
falsifier: an active generated task lacks non-goals, write boundaries, verification, rollback, or next-task synthesis
does_not_prove: perfect prompts replace verification or green commands prove product value
```

## Readback

Catalog queries:

```txt
goal continuation -> pattern:codex-goal-continuation-evidence-contract
living validation loop -> pattern:codex-execplan-living-validation-loop
task contract proof boundary -> pattern:codex-prompt-task-contract-proof-boundary
```

Static preview:

```txt
.local-lab/brain-knowledge-preview.html includes all three new pattern ids.
```

## Findings

- External source intake can be bounded when it starts from `docs/KRN_SOURCES.md`
  source decisions and produces retained pattern cards with consumers and
  falsifiers.
- The retained catalog now covers repo-local KRN operating patterns and official
  Codex workflow patterns.
- Search is still deterministic text/filter readback, not semantic ranking or
  product search.
- The first attempted CLI readback used `--format json`; the actual CLI contract
  is `--json`. This is operator friction, not a product logic defect.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants` | passed | Harness invariants accept the expanded retained pattern catalog. | Does not prove all future retained patterns are useful. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed after narrowing an over-broad proof-boundary search query | CLI readback/search tests cover the new Codex workflow cards. | Does not prove ranking quality or semantic search. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "goal continuation" --json` | passed | The goal continuation card is searchable through read-only catalog readback. | Does not prove live DB state or product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "living validation loop" --json` | passed | The ExecPlan card is searchable through read-only catalog readback. | Does not prove automatic application by Codex. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "task contract proof boundary" --json` | passed | The task-contract card is searchable through read-only catalog readback. | Does not prove future prompts are high quality by default. |
| `pnpm brain:knowledge:preview` | passed | Static preview regenerates with expanded catalog. | Does not prove browser polish, DB search, API readiness, or MCP readiness. |
| `rg -n "goal-continuation\|ExecPlan\|task contract\|codex-goal\|codex-execplan\|codex-prompt" .local-lab/brain-knowledge-preview.html` | passed | Static preview contains the new pattern ids/titles. | Does not prove UI usefulness at larger catalog size. |

## Brain Usefulness

Positive. The existing source-to-decision gate prevented decorative intake: each
external pattern had to name mechanism, implication, decision, consumer,
falsifier, and proof boundary before entering the catalog.

Activation/memory quality was not evaluated in this docs/catalog slice.

## What This Proves

- KRN can ingest a bounded set of public/official external best-practice
  mechanisms into retained brain knowledge.
- The catalog can expose these patterns through current read-only CLI/static
  preview surfaces.
- External intake does not require Research Foundry, crawler, dashboard, API,
  MCP, or Memory Core mutation.

## What This Does Not Prove

- Product readiness.
- Search ranking quality.
- Semantic retrieval.
- Completeness of best-practice coverage.
- That Codex will automatically apply these cards in future tasks.
- That paid/proprietary course material may be ingested.

## Next Recommended Action

Open V288: Brain Knowledge External Pattern Usefulness Dogfood.

Use the expanded catalog in a bounded next task and measure whether the three
new Codex workflow cards reduce rereads, prevent stale-plan drift, or improve
task-contract quality. Do not add more external sources until usefulness is
measured on this small batch.
