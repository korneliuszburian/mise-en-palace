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
active stream: V359 Fallow Quality Gate And First Cleanup
current task: V359-00 Fallow Quality Gate And First Cleanup
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
product-ready brain: not complete
```

Recent source-search ladder summary:

```txt
V340-V345: source artifact/search loop and SearchDocument alignment.
V346-V352: answer package JSON/readback and missing-evidence diagnostics.
V353-V357: answerUsefulness and queryShapeDiagnostics became built-in source-search output.
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

Status: complete.

Outcome: `krn source search` answer packages now expose
`queryShapeDiagnostics` when SourceClaims match but lexical SearchDocument
retrieval returns zero results.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v357-source-search-query-shape-diagnostics/REPORT.md
```

### V358-00 Graph Mini Brain-QA Query-Shape Diagnostics Closure

Status: deferred by operator request.

Next condition: resume after Fallow quality-gate cleanup no longer needs the
active slot.

### V359-00 Fallow Quality Gate And First Cleanup

Status: complete pending commit/CI.

Outcome: Fallow added as a JS/TS quality layer, AGENTS guidance added, CI
changed-files gate added, intentional fixture/typecheck/repository exceptions
configured, dead-code findings reduced to zero, and first ranked health target
(`persistActivationTrace`) refactored below Fallow complexity thresholds.

Does not prove: full repo cleanup. Full Fallow audit still reports legacy
duplication and health debt.

Next task: V360 Fallow Legacy Complexity Cleanup, starting with the highest ROI
bounded target that can pass typecheck/tests/Fallow gate without broad refactor.

## Remaining Product Gaps

```txt
1. Fallow legacy duplication/complexity cleanup
2. graph mini Brain-QA query-shape diagnostics closure
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
