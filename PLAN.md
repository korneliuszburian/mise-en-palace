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
active stream: V360 Fallow Legacy Complexity Cleanup
current task: V360-00 Fallow Legacy Complexity Cleanup
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
V340-V357 complete: source artifact/search, answer packages, usefulness,
graph SearchDocuments, and query-shape diagnostics.
```

## Active Task

### V358-00 Graph Mini Brain-QA Query-Shape Diagnostics Closure

Status: deferred by operator request.

Next condition: resume after Fallow quality-gate cleanup no longer needs the
active slot.

### V359-00 Fallow Quality Gate And First Cleanup

Status: complete.

Outcome: Fallow added as a JS/TS quality layer, AGENTS guidance added, CI
changed-files gate added, intentional fixture/typecheck/repository exceptions
configured, dead-code findings reduced to zero, and first ranked health target
(`persistActivationTrace`) refactored below Fallow complexity thresholds.

Does not prove: full repo cleanup. Full Fallow audit still reports legacy
duplication and health debt.

### V360-00 Fallow Legacy Complexity Cleanup

Status: active.

Goal: reduce legacy Fallow duplication/health debt through bounded source
cleanup slices.

First rule: do not broad-refactor the repo. Pick one high-confidence target
from `pnpm quality:fallow`, fix it with focused tests/typecheck/Fallow gate,
then commit/push/CI before choosing the next target.

Current candidate targets:
DB smoke assertion extraction, another DB smoke owner surface, or another
narrower target if source inspection shows lower risk.

Progress in this stream:

```txt
completed locally: parseKnowledgeArgs, parseReviewArgs, parseEvidenceArgs,
  parseEvidenceArgs source-usefulness cleanup, DB reflection mapper cleanup,
  parseObserveArgs/parseReflectArgs cleanup, parseSourceArgs cleanup,
  parseMemoryArgs cleanup, parseInitArgs cleanup,
  reflectionCandidateWriter cleanup, core evidence command normalization cleanup,
  schema evidence command input normalization cleanup,
  core reflection issue report cleanup,
  DB smoke target metadata cleanup,
  runCli source dispatch cleanup,
  runCli memory dispatch cleanup,
  runCli residual dispatch cleanup,
  source artifact preview extraction/persistence/formatting cleanup plus shared
  repo-input resolver cleanup,
  DB smoke target handler cleanup,
  doctor static checks cleanup,
  doctor failure rules cleanup,
  doctor DB readiness gates cleanup,
  database runtime project resolution cleanup,
	  brain knowledge read-model parser/search cleanup,
	  observation repository persistence cleanup,
	  plan command boundary/runtime cleanup,
	  retrieval repository insert cleanup,
	  memory repository invariant/insert cleanup,
	  DB smoke shared setup cleanup,
	  DB init-connect smoke readback cleanup,
	  memory mapper boundary cleanup,
	  Codex brief/smoke support cleanup,
	  activation/retrieval smoke support cleanup
	full Fallow moved: dupes 136 -> 78; health 117 -> 36
		```

Next candidate targets are tracked in `PLANS.md`. Do not split
`packages/db/src/repositories/common.ts` only because Fallow ranks its fan-in;
pick a bounded owner surface with direct complexity debt. Strict
DB smoke assertion cleanup should be split by smoke family; touching
memory-governance or activation smoke still pulls inherited smoke duplication
into the changed-files gate.

Verification: target package tests, `pnpm typecheck`, `pnpm test`,
`pnpm quality:fallow:ci`, full `pnpm quality:fallow` report, `git diff --check`.

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
