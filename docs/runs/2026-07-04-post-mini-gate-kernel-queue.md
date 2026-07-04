# Post Mini-Gate Kernel Queue

Bead: `mise-en-palace-17o8`

## Context

After `f571dd0`, the active Beads queue was empty and KRN CI
`28692095046` was green. The previous slice added a deterministic
`runBrainSearchCommand` mini-gate that contrasts a weak no-evidence baseline
with source-grounded selectedKnowledge.

Known stale candidates were rejected before review:

- `searchVector` / `searchHybrid` already require `embeddingModelId`.
- old CapabilityPlan binding types are gone.
- source claim add / source search project resolution was fixed by `1ex4`.
- CLI test typecheck whitelist gap is reported closed.

## Second Opinion

Ran governed `second-opinion-claude`:

- prompt: `.local-lab/second-opinion/post-mini-gate-kernel-queue/prompt.md`
- verdict: `.local-lab/second-opinion/post-mini-gate-kernel-queue/claude.json`
- verdict result: `block`
- risk: `MEDIUM`

Accepted findings:

- F1: candidate queue lacked verification commands.
- F2: candidate queue lacked rollback risk.
- F3: candidate queue lacked dependencies.
- F4: Q1 and Q2 were both P1, leaving the next implementation ambiguous.
- F5: retained-pattern usefulness ownership was underspecified.
- F6: vector/hybrid provenance readback was conditional without a current check.

Triage:

- `accept_and_fix` for F1-F6.
- Chose exactly one next P1: DB-backed brain usefulness dogfood.
- Made retained-pattern usefulness depend on that P1.
- Rejected vector/hybrid provenance as a next code slice for now: DB retrieval
  smoke already reads embedding model provenance, and current source-search
  answer packaging uses lexical retrieval rather than vector/hybrid operator
  readback.

Ran a second compact `second-opinion-claude` loop after creating Beads and this
report:

- prompt:
  `.local-lab/second-opinion/post-mini-gate-kernel-queue-fix/prompt.md`
- verdict:
  `.local-lab/second-opinion/post-mini-gate-kernel-queue-fix/claude.json`
- verdict result: `approve_with_fixes`
- risk: `LOW`

Accepted finding:

- F1: `ezbm` said DB-backed but verification was still conditional on whether
  the implementation moved into DB smoke.

Fix:

- Updated `ezbm` notes and the verification block below so the issue cannot be
  closed on `eval:behavior:smoke` alone.

## Created Queue

### `mise-en-palace-ezbm` / P1

Title: Promote brain usefulness mini-gate to DB-backed dogfood smoke.

Purpose: move beyond a JSON fixture contrast and prove a fixed live
source/brain readback path can produce useful source-backed selectedKnowledge
with visible SourceClaim and SourceDecision support.

Verification:

```txt
pnpm --filter @krn/cli test -- runBrainSearchCommand
pnpm eval:behavior:smoke
<explicit DB-backed smoke/test command introduced or extended by ezbm>
pnpm typecheck
git diff --check
```

`ezbm` must not close on fixture/eval smoke alone. Because the issue promises a
DB-backed dogfood smoke, the close evidence must name the exact DB-backed
command or test that proves the live persisted path. If the slice adds a new
smoke script, run that script. If it extends an existing DB smoke, run that
smoke and cite the new asserted fields.

Rollback risk: medium-low. The intended path is read-only fixture or
marker-cleaned DB rows with no schema migration.

### `mise-en-palace-6bdg` / P2

Title: Tie retained-pattern usefulness to execution evidence.

Dependency: `mise-en-palace-ezbm`.

Purpose: make retained-pattern usefulness depend on plan/run evidence refs
instead of merely proving a card can be selected.

Evidence for ownership:

- `packages/core/src/feedbackDelta.ts:patternUsefulnessOutcomesFromMetadata`
- `packages/cli/src/runShowReadback.ts:renderPatternUsefulnessOutcomes`
- `packages/cli/src/runPlanCommand.ts:buildRetainedPatternSelection`
- `docs/brain-knowledge/usefulness-feedback/*`

Verification:

```txt
pnpm --filter @krn/cli test -- runShow runPlanCommand
pnpm eval:behavior:smoke
pnpm typecheck
git diff --check
```

Rollback risk: medium. The slice touches feedback/readback semantics but should
not need a DB migration if metadata remains additive.

### `mise-en-palace-d09u` / P2

Title: Decide source artifact preview domain ownership by code evidence.

Purpose: either extract real reusable source-domain logic from CLI or reject
the move with evidence. No new package unless current consumers prove it.

Verification:

```txt
pnpm --filter @krn/cli test -- sourceArtifactPreview
pnpm typecheck
git diff --check
pnpm quality:fallow:ci
```

`quality:fallow:ci` is required only if extraction is broad.

Rollback risk: medium because source artifact preview is operator-facing and
persisted mode is DB-backed.

## Rejected For Current Queue

- Q3 vector/hybrid readback code work: not next. Retrieval repository and DB
  smoke already expose embedding model provenance. Reopen only when vector or
  hybrid search contributes to operator source/brain answer packaging.
- Q5 naming/topology guard: deferred until naming drift repeats. No broad grep
  ban, no vanity rename sweep.
- dashboard/API/MCP/worker daemon/broad benchmark: no current evidence says
  these are the bottleneck.

## Proof Boundary

Proves:

- the next queue was selected from current repo evidence and challenged by
  `second-opinion-claude`;
- one next P1 is unambiguous;
- follow-up tasks include dependencies, verification commands, proof boundaries,
  and rollback risk.

Does not prove:

- any newly created task is implemented;
- broad ranking quality;
- source truth;
- product readiness;
- worker runtime behavior.
