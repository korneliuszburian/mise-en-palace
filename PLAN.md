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
active stream: V357 Source Search Query-Shape Diagnostics
current task: V357-00 Source Search Query-Shape Diagnostics
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
V355: proved the five-case batch consumes built-in answerUsefulness without local classification.
V356: proved graph relation SearchDocuments exist; broad relation queries are over-constrained query-shape gaps.
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

V355 outcome:

```txt
cases: 5
useful: 4
partly_useful_missing_document: 1
gap: graph-relations remains claim-only for SearchDocument support.
report: docs/reviews/controlled-dogfood/2026-06-29-v355-mini-brain-qa-built-in-usefulness-loop/REPORT.md
```

### V356-00 Graph Relation SearchDocument Support Vertical

Status: complete.

Outcome: graph relation SearchDocuments exist and are included for narrower
queries such as `temporal claim graph`; V355-style broad queries are
over-constrained by current lexical query shape.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v356-graph-relation-searchdocument-support/REPORT.md
```

### V357-00 Source Search Query-Shape Diagnostics

Goal: make source-search answer packages expose likely broad-query shape
diagnostics when SourceClaims exist but SearchDocuments are absent.

Product rationale: V356 showed the graph relation document gap was not missing
coverage; operators needed manual DB/source-search inspection to discover that
the broad query was over-constrained.

Architectural rationale: improve operator-facing source-search readback before
ranking, schema, crawler, embeddings, graph runtime, worker runtime, UI/API/MCP,
or broad benchmark work.

Source-to-decision:

```txt
source: V356 graph relation SearchDocument support report.
mechanism: source-search can retrieve graph relation SearchDocuments for narrow queries, but broad `websearch_to_tsquery` shapes can require too many terms and return zero documents.
KRN implication: answer packages need explicit query-shape diagnostics so operators can distinguish missing coverage from over-constrained query wording.
decision: add bounded source-search query-shape diagnostics without changing ranking or retrieval semantics.
consumer: next graph-brain mini QA loop and technical operators using `krn source search --json`.
falsifier: diagnostics cannot be derived safely from existing answer-package fields, or they overclaim ranking/query correctness.
doesNotProve: answer correctness, source truth, ranking quality, product readiness, UI/API/MCP readiness, or Memory Core mutation.
```

Allowed writes: smallest owning source-search CLI/readback source and focused tests, plus compact report/root state.

Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, Memory
Core mutation, or parallel roadmap.

Verification: focused source-search tests, DB-backed readback over broad and
narrow graph relation queries, evidence capture, observe, reflect,
`pnpm typecheck`, `pnpm test`, `git diff --check`.

## Remaining Product Gaps

```txt
1. source-search query-shape diagnostics
2. ingest v0 expansion with bounded evidence
3. graph brain v0 entity/relation extraction and answer deltas
4. heartbeat/dreaming candidate generator
5. consensus eval/candidate lane
6. product UI/search/API/MCP after usefulness/security gates
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
