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
active stream: V335 Small Graph-Brain QA Case
current task: V335-00 Small Graph-Brain QA Case
latest pushed commit checked: see latest final response / GitHub checks
latest CI checked: see latest final response / GitHub checks
```

Known current gap:

```txt
V335-00 Small Graph-Brain QA Case. V334 proved edge influence can change the
bounded working set; the next gap is whether that relation-selected context
improves a tiny graph-brain QA/review scenario.
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
  extraction persistence bridge complete; fence-state carryover repair complete;
  graph-aware edge readback complete; edge-aware ranking lab complete;
  persisted edge-aware activation readback complete; edge-aware candidate
  refinement complete; usefulness closure complete; selection delta proof
  complete; small graph QA next
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
V328 complete: source extraction fence-state carryover repair.
V329 complete: graph-aware SourceClaimEdge adjacent context readback.
V330 complete: bounded edge-aware source candidate ranking lab.
V331 complete: persisted edge-aware activation readback.
V332 complete: edge-aware source candidate refinement without lab-seeded duplicate row.
V333 complete: edge-aware activation usefulness closure.
V334 complete: edge-aware activation selection delta proof.
```

Reports:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v324-graph-brain-v0-sourceclaimedge-readback-surface/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v325-local-source-extraction-candidate-preview/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v326-extraction-candidate-reviewability-noise-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v327-reviewed-extraction-persistence-bridge/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v328-source-extraction-fence-state-carryover/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v329-graph-aware-sourceclaimedge-activation-readback/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v330-edge-aware-sourceclaim-candidate-ranking-lab/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v331-persisted-edge-aware-activation-readback/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v332-edge-aware-source-candidate-refinement/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v333-edge-aware-activation-usefulness-closure/REPORT.md
docs/reviews/controlled-dogfood/2026-06-29-v334-edge-aware-activation-selection-delta/REPORT.md
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

## Outcome V328 Source Extraction Fence-State Carryover Repair

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v327-reviewed-extraction-persistence-bridge/REPORT.md`
- Mechanism: V327 live ADR-0021 preview showed a chunk beginning inside an
  already-open fenced/YAML block could emit ready claim candidates.
- KRN implication: graph brain candidate surfaces must preserve reviewability
  before graph-aware retrieval.
- Decision: carry fence state across chunks during deterministic extraction.
- Does not prove: extraction quality at scale, entity resolution, graph
  retrieval, source truth, crawler readiness, or product readiness.
- Consumer: V329 graph-aware edge readback/activation stub.
- Falsifier: chunk-crossing fenced content appears as ready claim candidates.

V328 outcome:

```txt
Fenced/code state now carries across chunks; ADR-0021 YAML/source-decision
content that previously appeared as ready candidates is deferred.
```

V328 verification:

```txt
pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand: passed
pnpm run typecheck: passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: passed
pnpm db:ready: passed
git diff --check: passed
krn source artifact preview --extract-candidates on ADR-0021: passed
```

## Outcome V329 Graph-Aware SourceClaimEdge Activation Readback

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v324-graph-brain-v0-sourceclaimedge-readback-surface/REPORT.md` and V328 report.
- Mechanism: direct SourceClaimEdge readback exposed edge metadata but not the
  adjacent SourceClaim context an operator must review before graph-aware
  ranking.
- KRN implication: graph brain v0 needs edge-influenced source context before
  any graph runtime, crawler, or ranking quality claim.
- Decision: extend read-only `krn source claim edges` output with adjacent
  SourceClaim context.
- Does not prove: source truth, edge correctness, graph retrieval quality,
  ranking quality, crawler readiness, product readiness, or Memory Core
  mutation.
- Consumer: V330 edge-aware source candidate ranking lab.
- Falsifier: a persisted SourceClaimEdge exists but readback cannot show the
  adjacent SourceClaim context.

V329 outcome:

```txt
`krn source claim edges` now renders `edgeInfluencedSourceContext` with adjacent
SourceClaim readback when available.
```

V329 verification:

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceClaimEdgesCommand: passed
pnpm run typecheck: failed once on exact optional property shape, then passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: passed
pnpm db:ready: passed
krn source claim edges --source-claim-id 578d...: passed
git diff --check: passed
```

## Outcome V330 Edge-Aware SourceClaim Candidate Ranking Lab

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v329-graph-aware-sourceclaimedge-activation-readback/REPORT.md`
- Mechanism: V329 showed adjacent claim context through SourceClaimEdge
  readback; V330 needed a bounded ranking/input seam before production
  graph-aware retrieval.
- KRN implication: graph influence must be inspectable as candidate input before
  retrieval quality is claimed.
- Decision: add `applySourceClaimEdgeInfluence` as a pure activation lab helper
  using bounded `graphScore` and explicit metadata.
- Does not prove: source truth, edge correctness, production graph retrieval
  quality, graph runtime, crawler readiness, product readiness, or Memory Core
  mutation.
- Consumer: V331 persisted edge-aware activation readback.
- Falsifier: SourceClaimEdge-connected candidates cannot expose edge ids, edge
  kinds, seed ids, or graphScore input in activation tests.

V330 outcome:

```txt
SourceClaimEdge-connected source candidates can now be represented as
edge-aware activation inputs with graphScore and review metadata.
```

V330 verification:

```txt
pnpm --filter @krn/harness test -- activation: passed
pnpm run typecheck: passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: passed
pnpm db:ready: passed
git diff --check: passed
```

## Outcome V331 Persisted Edge-Aware Activation Readback

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v330-edge-aware-sourceclaim-candidate-ranking-lab/REPORT.md`
- Mechanism: V330 showed bounded edge-aware graphScore and metadata as
  activation input, but operators could not read persisted retrieval candidate
  scores/metadata through `krn run show`.
- KRN implication: Graph Brain v0 needs persisted activation trace readback
  before production graph retrieval or crawler work.
- Decision: extend run readback with retrieval candidates, activation decisions,
  and typed `sourceClaimEdgeInfluence` metadata.
- Does not prove: activation scoring quality, source truth, edge correctness,
  production graph retrieval quality, crawler readiness, product readiness, or
  Memory Core mutation.
- Consumer: V332 edge-aware source candidate refinement.
- Falsifier: persisted candidate graphScore/sourceClaimEdgeInfluence cannot be
  read through run show text and JSON output.

V331 outcome:

```txt
`krn run show` now reads persisted activation trace candidates/decisions and can
show edge-aware candidate graphScore plus sourceClaimEdgeInfluence metadata.
```

V331 verification:

```txt
pnpm --filter @krn/cli test -- runRunShowCommand: passed
pnpm run typecheck: passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: passed
pnpm db:ready: passed
krn run show --run-id de972...: passed
krn run show --run-id de972... --json: passed
```

## Outcome V332 Edge-Aware Source Candidate Refinement

Status: complete.

Source-to-decision:

- Source: V329, V330, and V331 reports.
- Mechanism: V331 proved persisted edge-aware activation trace readback, but
  required a lab-seeded duplicate retrieval candidate row.
- KRN implication: Graph Brain v0 should use existing SourceClaimEdge context
  in normal activation retrieval before crawler, graph runtime, schema, or
  production graph retrieval work.
- Decision: fetch SourceClaimEdges for retrieved SourceClaims and apply the
  existing edge influence helper before source candidate ranking.
- Does not prove: source truth, edge correctness, activation scoring quality,
  production graph retrieval quality, crawler readiness, product readiness, or
  Memory Core mutation.
- Consumer: V333 edge-aware activation usefulness closure.
- Falsifier: a fresh persisted plan cannot show `sourceClaimEdgeInfluence`
  without manual duplicate retrieval candidate seeding.

V332 outcome:

```txt
Normal activation retrieval now persists source candidate graphScore and
sourceClaimEdgeInfluence through `krn run show` without lab-seeded duplicate
candidate rows.
```

V332 verification:

```txt
pnpm --filter @krn/harness test -- activation compiler: passed
pnpm --filter @krn/cli test -- runCli --testNamePattern "prints bounded activation inclusions": passed
pnpm run typecheck: passed
TMPDIR=/home/krn/.cache/krn-tmp pnpm test: failed once on stale CLI fixture, then passed
pnpm db:ready: passed
pnpm db:smoke: passed
pnpm eval:promptfoo:smoke: passed
krn plan --persist: passed
krn run show --run-id 7555...: passed
krn run show --run-id 7555... --json: passed
git diff --check: passed
```

## Outcome V333 Edge-Aware Activation Usefulness Closure

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v332-edge-aware-source-candidate-refinement/REPORT.md`
- Mechanism: V332 made normal activation retrieval fetch persisted
  SourceClaimEdge rows before ranking/readback.
- KRN implication: before broader graph retrieval work, KRN needed to measure
  whether edge-aware activation is useful or only decorative metadata.
- Decision: run a DB-backed usefulness closure and classify selected / used /
  helped / missing / noise.
- Does not prove: source truth, edge correctness, production graph retrieval,
  activation scoring quality, crawler readiness, product readiness, or Memory
  Core mutation.
- Consumer: V334 edge-aware activation selection delta proof.
- Falsifier: edge-aware activation cannot show useful metadata, ordering impact,
  or operator review value in a fresh persisted run.

V333 outcome:

```txt
Edge-aware activation selected a normal SourceClaim candidate with persisted
SourceClaimEdge metadata, `graphScore: 8`, and top ordering. Owner-file recall
selected activation/readback owner files. V333 is review-useful and
ranking-positive, but does not prove inclusion delta under budget pressure.
```

V333 verification:

```txt
pnpm db:ready: passed
krn knowledge cards --text "edge-aware activation usefulness": passed, 0 results
krn knowledge cards --text "activation": passed, 1 deferred/noise result
krn plan --persist: passed
krn run show --run-id 5595420c-58a8-4943-b766-074ff9520d3d: passed
krn run show --run-id 5595420c-58a8-4943-b766-074ff9520d3d --json: passed
```

## Outcome V334 Edge-Aware Activation Selection Delta Proof

Status: complete.

Source-to-decision:

- Source: `docs/reviews/controlled-dogfood/2026-06-29-v333-edge-aware-activation-usefulness-closure/REPORT.md`
- Mechanism: V333 proved review-useful edge metadata and top ordering, but not
  whether edge influence can rescue or include an otherwise lower-ranked
  candidate.
- KRN implication: before graph QA or broader graph retrieval, KRN needed a
  bounded no-edge vs edge-aware selection-delta proof.
- Decision: add a focused activation test comparing identical candidates under
  `maxInclusions: 1` with and without SourceClaimEdge influence.
- Does not prove: source truth, edge correctness, production graph retrieval,
  graph QA quality, crawler readiness, product readiness, or Memory Core
  mutation.
- Consumer: V335 small graph-brain QA case.
- Falsifier: edge influence cannot change selected context under identical
  candidate/budget conditions.

V334 outcome:

```txt
Focused activation proof now shows a no-edge baseline selecting the lexical-only
claim while the edge-aware path selects the edge-connected claim under the same
bounded context policy. DB-backed readback also continues to show current
edge-aware activation metadata.
```

V334 verification:

```txt
pnpm --filter @krn/harness test -- activation --testNamePattern "SourceClaimEdge influence can change bounded selection": passed
krn plan --persist: passed
krn run show --run-id f0fc3a0b-7c52-42e6-b096-0bb2025abd61: passed
krn run show --run-id f0fc3a0b-7c52-42e6-b096-0bb2025abd61 --json: passed
```

## Active Task: V335-00 Small Graph-Brain QA Case

Goal:

```txt
Use the edge-aware activation path in one tiny graph-brain QA scenario where the
answer or selected context depends on a source relation.
```

Evidence source:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v334-edge-aware-activation-selection-delta/REPORT.md
```

Files likely touched:

```txt
focused test or bounded report, depending on source inspection
docs/reviews/controlled-dogfood/<date>-v335-small-graph-brain-qa-case/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

Forbidden writes:

```txt
schema/migration; crawler; graph database; production graph runtime; broad
ranking rewrite; UI/API/MCP; worker daemon; consensus runtime; Memory Core
mutation; automatic source truth promotion; runtime markdown memory
```

Definition of Done:

- One tiny graph-brain QA/review scenario uses existing SourceClaimEdge context.
- The report states whether relation-selected context improved answer grounding
  or review usefulness compared with a no-relation baseline.
- `pnpm typecheck`, `pnpm test`, `pnpm db:ready`, and `git diff --check` pass.

Acceptance criteria:

```txt
small graph-brain QA usefulness is measured without claiming product graph
retrieval quality or product readiness.
```

Risk:

```txt
medium: graph QA case can drift into benchmark/platform work before the
system has earned it.
```

Rollback:

```txt
focused revert of the V335 implementation commit if source changes are made
```

Next-task synthesis rule:

```txt
If V335 is positive, choose the next small source-relation refinement or
heartbeat candidate-generation task. If weak, repair edge-aware graph QA
readback before expanding surfaces.
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
- V328: complete; source extraction fence-state carryover repair.
- V329: complete; graph-aware SourceClaimEdge adjacent context readback.
- V330: complete; edge-aware SourceClaim candidate ranking lab.
- V331: complete; persisted edge-aware activation readback.
- V332: complete; edge-aware source candidate refinement.
- V333: complete; edge-aware activation usefulness closure.
- V334: complete; edge-aware activation selection delta proof.
- V335: active; small graph-brain QA case.

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
