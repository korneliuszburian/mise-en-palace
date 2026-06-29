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
active stream: V326 Graph Brain v0 Extraction Candidate Reviewability Noise Gate
current task: V326-00 Extraction Candidate Reviewability Noise Gate
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V326-00 Extraction Candidate Reviewability Noise Gate is the current gap. V325
proved candidate-only local extraction preview, but live ADR-0021 output showed
that fenced source-decision/YAML blocks and weak fragments can be rendered as
globally ready claim candidates. Operators need stronger reviewability/noise
classification before persistence, ranking, crawler, UI/API/MCP, worker daemon,
consensus runtime, or Memory Core mutation.
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
graph brain: SourceClaimEdge preview/persistence/readback exists; candidate extraction preview exists; extraction reviewability/noise gate next
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

Status: active.

Goal:

```txt
Keep local source extraction candidate preview candidate-only, but stop
rendering fenced source-decision/YAML blocks or weak fragments as globally ready
claim candidates.
```

Product rationale:

```txt
V325 created the preview surface. Before any persistence or graph-aware
retrieval, KRN needs operator-trustworthy candidate reviewability/noise signals
for extracted local source candidates.
```

Architectural rationale:

```txt
Reuse existing source artifact preview and candidate reviewability patterns.
Prefer deterministic classification/rendering over a new extractor subsystem.
Do not introduce graph runtime, schema expansion, crawler, UI/API/MCP, worker
daemon, consensus runtime, or Memory Core mutation.
```

Evidence source:

```txt
V325 report and live ADR-0021 `--extract-candidates` output.
```

Official/external sources:

```txt
repo-local evidence; docs/decisions/ADR-0021-temporal-claim-graph.md
```

Inputs required:

```txt
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-29-v325-local-source-extraction-candidate-preview/REPORT.md
packages/cli/src/parseSourceArgs.ts
packages/cli/src/runSourceArtifactPreviewCommand.ts
packages/cli/src/runSourceArtifactPreviewCommand.test.ts
docs/decisions/ADR-0021-temporal-claim-graph.md
```

Files likely touched:

```txt
packages/cli/src/runSourceArtifactPreviewCommand.ts
focused CLI tests
docs/reviews/controlled-dogfood/<date>-v326-extraction-candidate-reviewability-noise-gate/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Allowed writes:

```txt
focused CLI/source preview rendering/classification code, tests, report,
compact root state
```

Forbidden writes:

```txt
schema/migration; candidate persistence; graph ranking; crawler; UI/API/MCP;
worker daemon; consensus runtime; Memory Core mutation; runtime markdown memory;
target repo writes; automatic acceptance of extracted candidates
```

Output requirements:

```txt
operator-facing extraction preview that distinguishes reviewable candidates from
noisy or weak extraction output with source ranges, reviewability,
doesNotProve, and proof/non-proof boundaries
```

Definition of Done:

- Fenced source-decision/YAML blocks or weak fragments are not rendered as
  globally ready claim candidates.
- Focused tests cover ready vs noisy/needs-review candidate rendering and
  proof/non-proof output.
- `pnpm typecheck`, `pnpm test`, `pnpm db:ready`, and `git diff --check` pass.
- Live dogfood is recorded against ADR-0021 or equivalent local source.

Verification commands:

```txt
pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand
pnpm typecheck
pnpm test
pnpm db:ready
git diff --check
```

Acceptance criteria:

```txt
local source extraction candidates can be inspected without noisy fenced blocks
or weak fragments masquerading as ready graph/source knowledge
```

Risk:

```txt
medium: over-filtering can hide useful candidates; under-filtering keeps noisy
candidates looking ready.
```

Rollback:

```txt
focused revert of the V326 implementation commit
```

Condensation expectation:

```txt
keep root state compact; archive details in the V325 report
```

Next-task synthesis rule:

```txt
If V326 succeeds, choose the next graph-brain task from evidence: persistence
bridge, graph-aware retrieval stub, or another reviewability repair. Do not
jump to crawler/UI/API/MCP.
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
- V326: active; extraction candidate reviewability/noise gate.

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
