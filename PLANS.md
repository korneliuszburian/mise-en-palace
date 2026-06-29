# KRN Continuous Brain Growth Active Ledger

Status: compact active ledger. Date: 2026-06-29.

Root `GOAL.md` states the continuous objective. Root `PLAN.md` is the compact
product source of truth. This file keeps only current execution state, recent
outcomes, one active task contract, and final-response rules.

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V328 Source Extraction Fence-State Carryover Repair
current task: V328-00 Source Extraction Fence-State Carryover Repair
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V328-00 Source Extraction Fence-State Carryover Repair. V327 proved selected
ready extraction candidates can persist through governed SourceClaim review, but
live ADR-0021 preview exposed that chunks beginning inside an already-open
fenced/YAML block can still emit ready claim candidates.
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

Current brain readiness:

```txt
repo/current-truth hygiene: strong
evidence/review loop: strong
DB-backed replay: proven
candidate reviewability: core primitive
activation: useful for guardrails and some persisted source state; owner-file recall still mixed
pattern brain: partial
graph brain: SourceClaimEdge preview/persistence/readback exists; extraction
  preview exists; extraction reviewability/noise gate complete; reviewed
  extraction persistence bridge complete; fence-state carryover repair next
product-ready: no
```

Important distinction:

```txt
SourceClaimEdge row exists != graph retrieval works
green test != product value
source decision exists != continuous research condensation exists
```

## Recent Outcomes

```txt
V324 complete: SourceClaimEdge readback by SourceClaim id.
V325 complete: candidate-only local extraction preview.
V326 complete: ready vs deferred extraction claim reviewability gate.
V327 complete: selected ready extraction candidate persistence bridge.
```

Reports:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v324-graph-brain-v0-sourceclaimedge-readback-surface/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v325-local-source-extraction-candidate-preview/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v326-extraction-candidate-reviewability-noise-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v327-reviewed-extraction-persistence-bridge/REPORT.md
```

## Outcome V327 Reviewed Extraction Persistence Bridge

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v326-extraction-candidate-reviewability-noise-gate/REPORT.md`
- Mechanism: ready/deferred extraction candidates existed, but reviewed
  persistence required manually copying claim text and lost deterministic
  candidate id/source-range lineage.
- KRN implication: graph brain v0 needs a selected reviewed bridge before graph
  ranking/crawler/runtime work.
- Decision: add `--reviewed-extraction-claim-candidate-id` requiring
  `--extract-candidates`, `--persist`, and explicit SourceClaim governance
  fields.
- Does not prove: extraction quality, source truth, graph retrieval, ranking,
  crawler readiness, product readiness, or Memory Core mutation.
- Consumer: V328 extraction quality repair and later graph-aware retrieval.
- Falsifier: deferred/noisy candidates persist, review fields are optional, or
  candidate id/source-range lineage is missing.

V327 outcome:

```txt
Added `--reviewed-extraction-claim-candidate-id` to persist only selected ready
extraction candidates through existing SourceClaim governance with candidate id
and source-range lineage. Deferred candidates are rejected before DB runtime.
```

V327 verification:

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand: passed
pnpm run typecheck: passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: passed
pnpm db:ready: passed
git diff --check: passed
krn source artifact preview reviewed bridge --persist: passed
deferred candidate rejection: expected failure
```

## Active Task: V328-00 Source Extraction Fence-State Carryover Repair

Goal:

```txt
Repair local extraction preview so fenced/code block state is preserved across
chunk boundaries. Source-decision/YAML content must not appear as ready claim
candidates because the rendered chunk starts inside an already-open fence.
```

Product rationale:

```txt
V327 live ADR-0021 preview found ready candidates from fenced YAML/source-decision
content when a rendered chunk started inside a fence. This weakens reviewed
candidate quality before graph-aware retrieval.
```

Architectural rationale:

```txt
Keep extraction deterministic and candidate-only. Fix source-range/reviewability
classification before graph ranking, crawler, worker, UI/API/MCP, or consensus.
```

Evidence source:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v327-reviewed-extraction-persistence-bridge/REPORT.md
docs/decisions/ADR-0021-temporal-claim-graph.md
```

Files likely touched:

```txt
packages/cli/src/runSourceArtifactPreviewCommand.ts
packages/cli/src/runSourceArtifactPreviewCommand.test.ts
docs/reviews/controlled-dogfood/<date>-v328-source-extraction-fence-state-carryover/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Forbidden writes:

```txt
schema/migration; crawler; graph ranking; graph runtime; UI/API/MCP; worker
daemon; consensus runtime; Memory Core mutation; automatic source truth
promotion; runtime markdown memory
```

Definition of Done:

- Existing V327 reviewed bridge behavior remains intact.
- A test covers a chunk beginning inside an already-open fence.
- `pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand`,
  `pnpm typecheck`, `pnpm test`, and `git diff --check` pass.

Acceptance criteria:

```txt
ready claim candidates do not include fenced/YAML/source-decision block content
that started before the rendered chunk.
```

Risk:

```txt
low-medium: fence-state scanning can over-defer valid prose if implemented too
broadly.
```

Rollback:

```txt
focused revert of the V328 implementation commit
```

Next-task synthesis rule:

```txt
If V328 succeeds, choose graph-aware retrieval stub or source candidate readback
refinement from evidence. Do not jump to crawler/UI/API/MCP.
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

- V324: complete; SourceClaimEdge readback by SourceClaim id.
- V325: complete; local source extraction candidate preview.
- V326: complete; extraction candidate reviewability/noise gate.
- V327: complete; reviewed extraction persistence bridge.
- V328: active; source extraction fence-state carryover repair.

## Pattern Gate

Use `docs/runbooks/pattern-intake.md` only when a source/paper/course/practitioner
pattern materially shapes a slice.

Required chain:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Surface Consumer Matrix:

```txt
infra -> ADR or migration proof
harness/activation -> behavior test or run readback
TypeScript -> standard/typecheck/test
operator UX/CLI -> readback surface and proof/non-proof output
research/paper/course -> source decision with consumer and falsifier
```

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

If attachments, old prompts, or summaries conflict with root active state, read them as historical evidence and do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this compact ledger replaced a long append-only active ledger.
Historical detail remains in reports and archives; active execution resumes from
the root current state above.
