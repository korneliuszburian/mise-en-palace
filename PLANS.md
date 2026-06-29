# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-29.

Root `GOAL.md` states the continuous objective. Root `PLAN.md` is the compact
product source of truth. This file keeps current execution state, active task
contract rules, recent outcome, and final-response contract only.

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V324 Graph Brain v0 SourceClaimEdge Readback Surface
current task: V324-00 Graph Brain v0 SourceClaimEdge Readback Surface
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V324-00 Graph Brain v0 SourceClaimEdge Readback Surface is the current gap.
V323 proved SourceClaimEdge preview/persistence/readback through
`krn source artifact preview`; operators still need a small source graph
readback surface by SourceClaim id before graph ranking, extraction, crawler,
UI/API/MCP, worker daemon, or consensus runtime.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current loop:

```txt
bounded scenario -> evidence -> source/pattern decision -> source change or
readback -> verification -> persisted evidence -> compact next task
```

## Current Brain Readiness

```txt
repo/current-truth hygiene: strong
evidence/review loop: strong
DB-backed replay: proven
candidate reviewability: core primitive
activation: useful for guardrails and some persisted source state; owner-file recall still mixed
pattern brain: partial
graph brain: SourceClaimEdge preview/persistence exists; readback surface next
product-ready: no
```

Important distinction:

```txt
SourceClaimEdge row exists != graph retrieval works
green test != product value
source decision exists != continuous research condensation exists
```

## Active Task Queue

### V324-00 Graph Brain v0 SourceClaimEdge Readback Surface

Status: active.

Goal:

```txt
Expose persisted SourceClaimEdge rows through the smallest operator-facing
readback surface by SourceClaim id.
```

Product rationale:

```txt
V323 proved write/readback at creation time. Operators now need a direct way to
inspect persisted graph edges before graph ranking or extraction work.
```

Architectural rationale:

```txt
Reuse existing Postgres source graph substrate and repository read methods.
Do not introduce graph runtime, schema expansion, crawler, UI/API/MCP, worker
daemon, consensus runtime, or Memory Core mutation.
```

Evidence source:

```txt
V323 report and live SourceClaimEdge 415321b3-4a26-4634-bfbe-38b756777d6a.
```

Official/external sources:

```txt
repo-local evidence; docs/decisions/ADR-0021-temporal-claim-graph.md
```

Inputs required:

```txt
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-29-v323-graph-brain-v0-bounded-source-entity-claim-edge-preview/REPORT.md
packages/cli/src/parseSourceArgs.ts
packages/cli/src/*source*
packages/cli/src/databaseRuntime.ts
packages/harness/src/repositories/sourceRepository.ts
packages/db/src/repositories/DrizzleSourceRepository.ts
```

Files likely touched:

```txt
packages/cli/src/parseSourceArgs.ts
packages/cli/src/runSource*.ts
packages/cli/src/databaseRuntime.ts
focused CLI tests
docs/reviews/controlled-dogfood/<date>-v324-graph-edge-readback/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
focused CLI/readback source, tests, report, compact root state
```

Forbidden writes:

```txt
schema/migration unless proven necessary; graph ranking; entity extraction;
crawler; UI/API/MCP; worker daemon; consensus runtime; Memory Core mutation;
runtime markdown memory; target repo writes
```

Output requirements:

```txt
operator-facing edge readback with edge id, from/to ids, kind, consumer,
doesNotProve, evidence/source-range metadata, and proof/non-proof boundaries
```

Definition of Done:

- SourceClaimEdge readback by SourceClaim id exists or source inspection records
  why the existing surface already satisfies it.
- Focused tests cover readback and proof/non-proof output.
- `pnpm typecheck`, `pnpm test`, `pnpm db:ready`, and `git diff --check` pass.
- Live DB readback is recorded if the command exists.

Verification commands:

```txt
pnpm --filter @krn/cli test -- source
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

Acceptance criteria:

```txt
persisted SourceClaimEdge rows can be inspected by SourceClaim id without
claiming graph truth, ranking quality, or Memory Core mutation
```

Risk:

```txt
medium: CLI surface can accidentally imply accepted graph truth instead of
bounded governed readback.
```

Rollback:

```txt
focused revert of the implementation commit
```

Condensation expectation:

```txt
keep root state compact; archive details in the V324 report
```

Next-task synthesis rule:

```txt
If V324 succeeds, choose graph extraction/ranking only after readback usefulness
is proven; otherwise repair the readback seam.
```

## 9. Task Contract Schema

Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.
If a task cannot satisfy the schema, it is not ready for execution.

ID:
Name:
Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:

## 13. Generated Task Backlog

Template:

### <ID> — <Name>

Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Pattern surface:
Primary consumer:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Does not prove:
Falsifier:
Condensation expectation:
Next-task synthesis rule:

## 15. Progress

- V321: complete; persisted source state activates source claims.
- V322: complete; marker/hash lexical retry exposes persisted local source docs.
- V323: complete; SourceClaimEdge preview/persistence/readback proved.
- V324: active; expose SourceClaimEdge readback by SourceClaim id.

## Pattern Gate

Use `docs/runbooks/pattern-intake.md` when a source/paper/course/practitioner
pattern materially shapes a slice.

Surface Consumer Matrix:

```txt
infra -> ADR or migration proof
harness/activation -> behavior test or run readback
TypeScript -> standard/typecheck/test
operator UX/CLI -> readback surface and proof/non-proof output
research/paper/course -> source decision with consumer and falsifier
```

Required chain:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

## Outcome V323 Graph Brain v0 Bounded Source Entity/Claim Edge Preview

Status: complete.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v323-graph-brain-v0-bounded-source-entity-claim-edge-preview/REPORT.md
```

Source-to-decision:

- Source: `docs/decisions/ADR-0021-temporal-claim-graph.md` and existing
  `SourceRepository.createSourceClaimEdge` / `listSourceClaimEdgesForClaim`.
- Mechanism: KRN already has governed `source_claim_edges` with edge kind,
  consumer, `doesNotProve`, evidence refs, and source-range metadata.
- KRN implication: local source artifact preview can be the first graph fact
  intake surface if it produces reviewable edge candidates and persists only
  complete governed rows.
- Decision: add explicit `--graph-edge-*` inputs to source artifact preview and
  render/persist/read back governed SourceClaimEdge candidates.
- Does not prove: graph retrieval quality, automatic extraction, entity
  resolution, temporal reasoning, product readiness, or Memory Core mutation.
- Consumer: V324 graph edge readback surface and later graph-aware retrieval.
- Falsifier: preview creates graph truth without complete inputs, omits source
  ranges, or requires schema/runtime expansion before bounded readback proof.

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
DB used:
Commands run:
Reports/artifacts:
Commits/CI:
What this proves:
What this does not prove:
Condensation decisions:
Tasks appended to PLANS.md:
Next active task:
Blocked/budget-limited:
```

## 22. Compact GOAL.md Contract To Pair With This Plan

Active stream: <current active stream from PLAN.md>.

For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice,
use:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If attachments, old prompts, or summaries conflict with root active state, read them as historical evidence.
do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this file replaced a long append-only active ledger with a
compact current-state ledger. Historical details remain available through the
archive path and linked reports, but active execution resumes from the root
state above.
