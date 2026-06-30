# V375 Pattern Research Brain Intake Trial

Status: complete bounded pattern intake report.
Date: 2026-06-30.

## Verdict

V375 retained one official Codex mechanism as executable KRN brain knowledge:
Codex hooks are useful deterministic lifecycle guardrails, but they are not
semantic authority, memory/source truth, review gates, or complete enforcement
boundaries.

This slice did not add hook implementation, `.codex/hooks`, scheduler, daemon,
crawler, dashboard, API server, MCP server, schema rewrite, broad benchmark,
worker runtime, autonomous Memory Core mutation, or source-truth mutation.

## Source To Decision

```yaml
source_id: openai-codex-hooks
title: Codex Hooks
url: https://developers.openai.com/codex/hooks
trust_tier: high
source_class: official docs
mechanism: >
  Hooks inject command handlers into Codex lifecycle events. Matching hooks
  from multiple files all run, multiple matching command hooks for the same
  event can launch concurrently, non-managed command hooks require trust
  review, project-local hooks require a trusted .codex layer, only command
  handlers run today, and event/matcher support is scoped.
krn_implication: >
  KRN can use hooks for deterministic reminders and guardrails around tool use,
  compaction, evidence capture, and trust boundaries, but product semantics must
  remain in source-to-decision records, review gates, typed domain models,
  evidence bundles, and tests.
decision_kind: adopt
decision: >
  Retain a pattern card named
  codex-hook-deterministic-guardrail-boundary.
consumer: >
  Future Codex hook policy slices, operator evidence-capture hooks, and
  hook-related eval/golden candidates.
falsifier: >
  A future KRN hook is treated as full enforcement, memory/source truth, or
  review-gate authority, or a hook decision ignores trust review, concurrent
  matching, event scope, or unsupported handler limits.
does_not_prove: >
  This source does not prove hooks are configured, sufficient security
  boundaries, safe product policy surfaces, or KRN product readiness.
```

## Change

Added:

- `docs/patterns/retained-patterns/codex-hook-deterministic-guardrail-boundary.json`
- `docs/brain-knowledge/usefulness-feedback/v375-codex-hook-guardrail-pattern.json`
- catalog entry in `docs/brain-knowledge/catalog.json`
- knowledge-card catalog test coverage in
  `packages/cli/src/runKnowledgeCardsCommand.test.ts`

The retained pattern is queryable through the existing read-only brain
knowledge surface:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "hook deterministic guardrail"
```

## Readback

Observed readback:

```txt
pattern:codex-hook-deterministic-guardrail-boundary
reviewability: ready
usefulnessOutcome: helped
mutation: none
doesNotProve: hooks are configured, hooks are sufficient security boundaries, Codex will always run the intended hook, or KRN is product-ready
```

## Eval Candidate

```yaml
type: EvalCandidate
reviewability: ready
decision: review
proposal: >
  A future hook-related golden should fail if a Codex hook is documented,
  rendered, or configured as semantic product authority instead of a
  deterministic guardrail with trust, event-scope, concurrency, and
  proof/non-proof limits.
evidence_refs:
  - docs/patterns/retained-patterns/codex-hook-deterministic-guardrail-boundary.json
  - docs/brain-knowledge/usefulness-feedback/v375-codex-hook-guardrail-pattern.json
  - packages/cli/src/runKnowledgeCardsCommand.test.ts
does_not_prove: >
  This candidate does not prove a hook implementation exists or that hook
  policy is safe without a later focused slice.
```

## Pattern Usefulness

`source-to-decision-retention-gate`: helped. It prevented retaining Codex hooks
as a decorative link and forced mechanism, KRN implication, consumer,
falsifier, and does-not-prove fields.

`codex-skill-progressive-disclosure-routing`: neutral. It was relevant to
Codex surface hygiene but already covered skills, so V375 did not duplicate it.

`codex-hook-deterministic-guardrail-boundary`: helped. It created a queryable
future guardrail for hook-related slices without adding hook implementation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "hook deterministic guardrail"` | passed | The retained hook pattern is queryable through the existing read-only knowledge-card surface. | Search ranking quality, DB truth, hook configuration, or product readiness. |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | Targeted CLI tests cover catalog readback for the retained hook pattern and proof boundaries. | Product readiness or semantic source truth. |
| `pnpm --filter @krn/harness test -- brainKnowledgeReadModel brainKnowledgeReadModelInvariants` | passed | Harness read-model invariants still parse retained pattern and knowledge-card surfaces. | DB truth or usefulness at runtime. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed JS/TS files. | Fallow completeness or absence of all quality issues. |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles. | Runtime correctness or usefulness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass. | Product readiness or SOTA quality. |
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | CI DB state or production readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Behavioral correctness. |
| `krn plan --persist` | passed | V375 plan, context assembly, and execution run were persisted as `57b89b1e-43d9-4dfc-8f1a-3b554dece4fd`. | Selected context sufficiency or ranking quality. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted for V375. | Candidate truth, source truth, or product readiness. |
| `krn observe --persist` | passed | Observation group was persisted without Memory Core mutation. | Reflection usefulness or memory quality. |
| `krn reflect --persist` after observe | passed | Reflection selected 5 observations and persisted without candidate rows or Memory Core mutation. | That reflection extracted useful findings. |

Persisted IDs:

```txt
executionRun: 57b89b1e-43d9-4dfc-8f1a-3b554dece4fd
evidenceBundle: 99ce62e6-fb4e-4290-96cc-31e174036f75
reviewAssessment: 977ca9fe-c39e-4713-8620-1a3d1704c919
feedbackDelta: 5fcaffaa-3106-4310-9c0e-428d8a2f2fcc
observationGroup: 56de1dc8-1584-44a6-8bae-47385f55856e
reflectionRecord: 0641d592-9ad6-4a0a-a189-c89d7924d1e5
```

## What This Proves

- One official Codex source was mapped through source -> mechanism -> KRN
  implication -> decision -> consumer -> falsifier.
- The resulting pattern is queryable through the existing bounded KRN brain
  knowledge surface.
- A local eval/golden candidate exists for future hook policy behavior.

## What This Does Not Prove

- Hooks are implemented or configured in this repo.
- Hooks are complete security boundaries.
- Hooks can replace KRN review gates, source truth, evidence bundles, or Memory
  Core promotion paths.
- Product readiness, second-operator usability, or SOTA quality.

## Next

Next product-moving gap after V375 remains:

```txt
real benchmarks
```

The next slice should be a compact benchmark/readback task, not another
guard-only task or broad research platform.
