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
active stream: V327 Graph Brain v0 Reviewed Extraction Persistence Bridge
current task: V327-00 Reviewed Extraction Persistence Bridge
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V327-00 Reviewed Extraction Persistence Bridge is the current gap. V325 proved
candidate-only local extraction preview and V326 separated ready claims from
deferred/noisy candidates. Operators now need to know whether existing
`--claim` / `--graph-edge-*` inputs are enough for reviewed persistence, or
whether a tiny explicit bridge is needed. No auto-promotion, schema, ranking,
crawler, UI/API/MCP, worker daemon, consensus runtime, or Memory Core mutation.
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
graph brain: SourceClaimEdge preview/persistence/readback exists; candidate extraction preview exists; extraction reviewability/noise gate complete; reviewed persistence bridge next
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

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v324-graph-brain-v0-sourceclaimedge-readback-surface/REPORT.md
Added `krn source claim edges --source-claim-id <id>` as read-only Postgres
readback for governed SourceClaimEdge rows. Live DB readback returned edge
415321b3-4a26-4634-bfbe-38b756777d6a with kind, direction, from/to ids,
consumer, doesNotProve, evidenceRef, sourceRanges, DB writes none, Graph
runtime none, and Memory mutation none.
```

Verification:

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceClaimEdgesCommand: passed
pnpm test: passed
pnpm typecheck: passed
pnpm db:ready: passed
git diff --check: passed
krn plan/evidence/observe/reflect --persist: passed
```

### V325-00 Local Source Entity/Claim Extraction Candidate Preview

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v325-local-source-extraction-candidate-preview/REPORT.md
Added `krn source artifact preview --extract-candidates` as a candidate-only
deterministic local extraction preview. It renders entity/claim/relation
candidates with source ranges, reviewability, doesNotProve, Graph runtime none,
and Memory mutation none. Live ADR-0021 preview proved the surface and exposed
the next gap: noisy fenced source-decision/YAML or weak fragment candidates.
```

Verification:

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand: passed
pnpm typecheck: passed
pnpm test: passed
pnpm db:ready: passed
git diff --check: passed
krn source artifact preview --extract-candidates: passed
```

### V326-00 Extraction Candidate Reviewability Noise Gate

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v326-extraction-candidate-reviewability-noise-gate/REPORT.md
Updated `krn source artifact preview --extract-candidates` so direct prose
claims stay in `claimCandidates` with `reviewability: ready`, while fenced
source-decision/YAML/code blocks and lead-in fragments move to
`deferredClaimCandidates` with `reviewability: needs_more_evidence`.
```

Verification:

```txt
pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand: passed
pnpm typecheck: passed
pnpm test: passed
pnpm db:ready: passed
git diff --check: passed
krn source artifact preview --extract-candidates: passed
```

### V327-00 Reviewed Extraction Persistence Bridge

Status: active.

Goal:

```txt
Inspect and, if justified, add the smallest explicit reviewed persistence bridge
from extraction candidates to existing SourceClaim/SourceClaimEdge persistence.
```

Product rationale:

```txt
V325/V326 made extraction candidates visible and reviewable. Before graph-aware
retrieval, KRN needs either a clearly documented manual persistence path or a
small explicit bridge that persists only selected reviewed candidates.
```

Architectural rationale:

```txt
Reuse existing source artifact preview, SourceClaim persistence, SourceClaimEdge
persistence, and candidate reviewability patterns. Prefer source inspection over
a new workflow. Do not introduce schema expansion, graph runtime, ranking,
crawler, UI/API/MCP, worker daemon, consensus runtime, or Memory Core mutation.
```

Evidence source:

```txt
V326 report and live ADR-0021 `--extract-candidates` output.
```

Official/external sources:

```txt
repo-local evidence; docs/decisions/ADR-0021-temporal-claim-graph.md
```

Inputs required:

```txt
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-29-v326-extraction-candidate-reviewability-noise-gate/REPORT.md
packages/cli/src/parseSourceArgs.ts
packages/cli/src/runSourceArtifactPreviewCommand.ts
packages/cli/src/runSourceArtifactPreviewCommand.test.ts
docs/decisions/ADR-0021-temporal-claim-graph.md
```

Files likely touched:

```txt
packages/cli/src/parseSourceArgs.ts
packages/cli/src/runSourceArtifactPreviewCommand.ts
focused CLI tests
docs/reviews/controlled-dogfood/<date>-v327-reviewed-extraction-persistence-bridge/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
focused CLI/source preview persistence bridge code if justified, tests, report,
compact root state
```

Forbidden writes:

```txt
schema/migration; automatic extraction persistence; graph ranking; crawler;
UI/API/MCP; worker daemon; consensus runtime; Memory Core mutation; runtime
markdown memory; target repo writes; automatic acceptance of extracted
candidates; persisting deferred/noisy candidates
```

Output requirements:

```txt
operator-facing result that either documents the existing reviewed persistence
path as sufficient or provides an explicit selected-candidate bridge with source
ranges, reviewability, doesNotProve, and proof/non-proof boundaries
```

Definition of Done:

- Source inspection decides whether existing manual persistence is enough.
- If a bridge is added, it persists only selected ready extraction candidates and
  refuses deferred/noisy candidates.
- Focused tests cover the inspected/implemented behavior and proof/non-proof
  output.
- `pnpm typecheck`, `pnpm test`, `pnpm db:ready`, and `git diff --check` pass.
- Live dogfood is recorded against ADR-0021 or equivalent local source.

Verification commands:

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

Acceptance criteria:

```txt
reviewed ready extraction candidates have a clear path to governed
SourceClaim/SourceClaimEdge persistence without auto-promoting noisy/deferred
candidates
```

Risk:

```txt
medium: a bridge can accidentally imply automatic extraction truth or duplicate
existing manual inputs without improving operator workflow.
```

Rollback:

```txt
focused revert of the V327 implementation commit
```

Condensation expectation:

```txt
keep root state compact; archive details in the V325 report
```

Next-task synthesis rule:

```txt
If V327 succeeds, choose the next graph-brain task from evidence: graph-aware
retrieval stub, persistence readback refinement, or another reviewability
repair. Do not jump to crawler/UI/API/MCP.
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
- V324: complete; SourceClaimEdge readback by SourceClaim id.
- V325: complete; local source entity/claim extraction candidate preview.
- V326: complete; extraction candidate reviewability/noise gate.
- V327: active; reviewed extraction persistence bridge.

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
