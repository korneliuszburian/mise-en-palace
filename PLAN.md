# KRN Active Plan

Status: active compact root plan. Date: 2026-06-27.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in `PLANS.md`.

Do not create another parallel roadmap.

## Current Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V326 Graph Brain v0 Extraction Candidate Reviewability Noise Gate
current task: V326-00 Extraction Candidate Reviewability Noise Gate
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
repo/current-truth hygiene: complete enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
pattern gate/readback: active hardening stream
product-ready brain: not complete
```

Remaining product gaps:

```txt
1. pattern search/readback hardening
2. research/paper/course source decisions
3. mini brain-QA benchmark
4. ingest v0 activation/readback closure
5. graph brain v0 candidate extraction/reviewability surface
6. heartbeat/dreaming v0 as candidate generator
7. consensus v0 as eval/candidate layer
8. product UI/search/API/MCP after usefulness/security gates
```

## Active Stream

### V324 Graph Brain v0 SourceClaimEdge Readback Surface

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v324-graph-brain-v0-sourceclaimedge-readback-surface/REPORT.md
`krn source claim edges --source-claim-id <id>` now reads persisted
SourceClaimEdge rows by SourceClaim id with edge kind, direction, from/to ids,
consumer, doesNotProve, evidence/source-range metadata, proof/non-proof
boundaries, DB writes none, Graph runtime none, and Memory mutation none.
Live DB readback returned edge 415321b3-4a26-4634-bfbe-38b756777d6a.
```

### V325 Graph Brain v0 Local Source Entity/Claim Extraction Candidate Preview

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v325-local-source-extraction-candidate-preview/REPORT.md
`krn source artifact preview --extract-candidates` now renders candidate-only
deterministic entity/claim/relation extraction output with source ranges,
reviewability, doesNotProve, Graph runtime none, and Memory mutation none.
Live ADR-0021 dogfood showed the next gap: fenced source-decision/YAML blocks
and weak fragments can appear as globally ready claim candidates.
```

### V326 Graph Brain v0 Extraction Candidate Reviewability Noise Gate

Goal:

Repair local source extraction candidate reviewability/noise before persistence.

Current action:

```txt
Execute V326-00: keep `--extract-candidates` candidate-only, but stop rendering
fenced source-decision/YAML blocks or weak fragments as globally ready claim
candidates. Prefer the smallest deterministic classification/rendering repair.
Do not add persistence, graph ranking, crawler, UI/API/MCP, worker daemon,
consensus runtime, or Memory Core mutation.
```

Primary consumer:

```txt
future source artifact ingest, graph-aware retrieval, contradiction/duplicate
detection, temporal slices, consensus candidate evaluation, and product-facing
knowledge search.
```

Falsifier:

```txt
Given a local source artifact containing source-decision/YAML fences or weak
fragments, KRN presents those extraction candidates as ready product knowledge
instead of candidate-only/noisy/needs-review output.
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work,
apply: source -> mechanism -> KRN implication -> decision/rejection -> consumer
-> falsifier.

Pattern application gate:

```txt
before coding:
  query helped retained patterns;
  select 1-5 expected-use patterns or explicitly reject/defer them.

after verification:
  classify selected patterns as helped / neutral / noise / missing / stale;
  record proof and does-not-prove boundaries.
```

## External Input Blocker

Status: deferred boundary, not the current internal stream.

V02-01 still requires real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Hard Non-Goals

Do not build or claim: fake V02-01 proof, product-ready status, dashboard,
API/MCP, worker, crawler, Research Foundry, broad eval, generic multi-agent,
runtime markdown memory, hidden semantic hooks, unsafe target writes, large
`AGENTS.md`, or parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

If local Vitest or workspace tests fail with a temporary-directory write error,
use `TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo checkout: CLI boundary tests rely on outside-workspace temporary directories.

Docs/plan-only changes: `git diff --check`.
Source changes: `pnpm typecheck`, `pnpm test`, `git diff --check`.
DB/eval-affecting changes: `pnpm db:ready`, `pnpm db:smoke`,
`pnpm eval:promptfoo:smoke`.

After each bounded slice, commit, push, and confirm CI when appropriate. Use a
full `git rev-parse HEAD` SHA for `gh run list --commit`; if that is empty, use
branch readback and match `headSha`. Do not claim missing CI from short-SHA
lookup alone.
