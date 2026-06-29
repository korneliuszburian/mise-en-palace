# KRN Active Plan

Status: active compact root plan. Date: 2026-06-29.

Root `PLAN.md` is the compact product source of truth. Detailed history stays in `PLANS.md`.
Current-task contracts live in `PLANS.md`.

## Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V355 Mini Brain-QA Built-In Usefulness Loop
current task: V355-00 Mini Brain-QA Built-In Usefulness Loop
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
product-ready brain: not complete
```

Recent source-search ladder:

```txt
V340: local artifact -> SourceArtifact/SourceChunk/SearchDocument/SourceClaim -> later activated SourceClaim.
V341: added read-only `krn source search --query`.
V342: usefulness closure found coverage gaps.
V343: seeded heartbeat/consensus/source-to-decision/search-usefulness claims.
V344: repaired SearchDocument retrieval alignment.
V345: proved lower rereads after alignment.
V346: added answer package preview.
V347: repaired broad-query guidance for heartbeat/consensus docs.
V348: added typed JSON answer package readback.
V349: proved JSON consumer without text parsing.
V350: five-case JSON batch exposed broad missing-evidence diagnostics.
V351: repaired missing-evidence specificity.
V352: diagnostics usefulness closure.
V353: classified answer usefulness over five JSON answer packages.
V354: added built-in answerUsefulness labels/reasons to source-search JSON/text output.
```

V353 outcome:

```txt
cases: 5
useful: 4
partly_useful_missing_document: 1
not_useful: 0
allRawCandidatesInspectable: true
memoryMutation: none
report: docs/reviews/controlled-dogfood/2026-06-29-v353-mini-brain-qa-answer-usefulness-closure/REPORT.md
```

## Active Task

V354 outcome:

```txt
behavior: `krn source search --json` exposes answerUsefulness and reasons.
tests: focused CLI tests, workspace typecheck, workspace tests, diff check.
report: docs/reviews/controlled-dogfood/2026-06-29-v354-source-search-answer-usefulness-classification/REPORT.md
```

### V355-00 Mini Brain-QA Built-In Usefulness Loop

Goal: rerun the five-case mini Brain-QA batch using built-in
`answerUsefulness`/reasons from source-search JSON.

Product rationale: prove the new field reduces consumer logic and supports the
next product vertical before ingest/graph expansion.

Architectural rationale: close the source-search answer usefulness loop before
adding broader product surfaces or ranking/retrieval changes.

Source-to-decision:

```txt
source: V354 source-search answer usefulness classification report.
mechanism: built-in answerUsefulness removes ad hoc consumer classification.
KRN implication: mini Brain-QA can consume answer usefulness directly.
decision: run a five-case batch and synthesize next ingest/graph product vertical only if proof boundaries stay clear.
consumer: V356 next product vertical.
falsifier: consumers still need local classification or labels overclaim correctness.
doesNotProve: answer correctness, source truth, ranking quality, product readiness, UI/API/MCP readiness, or Memory Core mutation.
```

Allowed writes: V355 report and compact root state.

Forbidden writes: source changes unless the batch exposes a tiny blocking bug;
DB schema, ranking rewrite, retrieval semantics, UI/API/MCP, crawler,
embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.

Verification: DB-backed source-search JSON batch, evidence capture, observe,
reflect, `git diff --check`.

## Remaining Product Gaps

```txt
1. answer usefulness in source-search output
2. mini Brain-QA usefulness loop
3. ingest v0 expansion with bounded evidence
4. graph brain v0 entity/relation extraction and answer deltas
5. heartbeat/dreaming candidate generator
6. consensus eval/candidate lane
7. product UI/search/API/MCP after usefulness/security gates
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

## Verification Policy

Use the narrowest relevant verification.

```txt
docs/plan-only: git diff --check
source: pnpm typecheck, pnpm test, git diff --check
DB/eval-affecting: pnpm db:ready, pnpm db:smoke, pnpm eval:promptfoo:smoke when relevant
```

If Vitest hits a temporary-directory write error, use
`TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo checkout:
CLI boundary tests rely on outside-workspace temporary directories.

After each bounded slice, commit, push, and confirm CI with the full SHA.
