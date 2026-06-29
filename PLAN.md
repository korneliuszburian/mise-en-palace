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
active stream: V356 Graph Relation SearchDocument Support Vertical
current task: V356-00 Graph Relation SearchDocument Support Vertical
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

Goal: turn the graph-relations answer usefulness gap into a bounded product
repair or proof.

Product rationale: V355 showed graph relation answers are claim-useful but lack
included SearchDocument evidence for the combined query.

Architectural rationale: improve graph-brain answer support before UI/API/MCP,
crawler, embeddings, graph runtime, worker runtime, broad benchmark, or ranking
work.

Source-to-decision:

```txt
source: V355 built-in usefulness loop report.
mechanism: graph-relations query has governed SourceClaims but no included SearchDocument evidence.
KRN implication: graph answer support needs a bounded document-support repair/proof before broader graph runtime work.
decision: inspect and repair/prove SearchDocument support for graph relation answers using existing source-search/ingest paths.
consumer: next graph-brain mini QA loop.
falsifier: graph relation answers remain claim-only after bounded support work, or repair requires ranking/schema/runtime expansion.
doesNotProve: answer correctness, source truth, ranking quality, product readiness, UI/API/MCP readiness, or Memory Core mutation.
```

Allowed writes: smallest owning source/test files if a source-search support bug
is found, or report/root only if the gap is coverage not code.

Forbidden writes: DB schema, ranking rewrite, retrieval semantics, UI/API/MCP, crawler,
embeddings, graph runtime, worker runtime, broad benchmark, Memory Core
mutation, or parallel roadmap.

Verification: targeted source-search/ingest readback or tests, DB-backed
readback, evidence capture, observe, reflect, `git diff --check`.

## Remaining Product Gaps

```txt
1. graph relation SearchDocument answer support
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
