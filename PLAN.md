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
active stream: V354 Source Search Answer Usefulness Classification
current task: V354-00 Source Search Answer Usefulness Classification
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

### V354-00 Source Search Answer Usefulness Classification

Goal: add deterministic answer-usefulness classification to
`krn source search --json` so consumers do not need ad hoc local classification.

Product rationale: V353 showed answer packages can guide bounded operator
decisions, but usefulness labels currently live outside the CLI output.

Architectural rationale: improve operator-facing readback before UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, or ranking
work.

Source-to-decision:

```txt
source: V353 answer-usefulness batch report.
mechanism: existing JSON answer-package counts and missingEvidence entries are enough to classify bounded answer usefulness.
KRN implication: usefulness classification should become a readback field.
decision: implement a deterministic source-search JSON classification and reasons.
consumer: technical operators and the next mini Brain-QA loop.
falsifier: classification cannot be derived from existing fields without making answer-correctness or ranking-quality claims.
doesNotProve: answer correctness, source truth, ranking quality, product readiness, UI/API/MCP readiness, or Memory Core mutation.
```

Allowed writes: smallest owning CLI/source-search source and tests, compact
V354 report, root state.

Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.

Verification: targeted CLI/source-search tests, `pnpm typecheck`, `pnpm test`,
`git diff --check`; add DB/evidence commands only when persistence is used.

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
