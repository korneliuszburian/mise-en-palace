# V333 Edge-Aware Activation Usefulness Closure

Status: complete bounded DB-backed usefulness closure.

## Verdict

Edge-aware activation is useful for reviewability and bounded ranking readback.
In the V333 persisted run, the normal activation path selected the edge-aware
SourceClaim candidate, attached persisted `SourceClaimEdge` metadata, and ranked
that candidate first with `graphScore: 8`.

This is a positive usefulness signal, but still not product graph retrieval
quality. V333 proves that edge influence can make the activation trace more
reviewable and can affect ordering inside a bounded run. It does not yet prove
that edge influence can rescue an otherwise-missing candidate under budget
pressure, answer graph QA questions, or scale beyond the current local corpus.

## Source To Decision

```yaml
source_id: v332-normal-edge-aware-activation-evidence
trust_tier: high
source_class: repo-local evidence
mechanism: V332 removed the lab-seeded duplicate candidate dependency and made
  normal activation retrieval fetch persisted SourceClaimEdge rows for retrieved
  SourceClaims before ranking/readback.
krn_implication: Before broader graph retrieval work, KRN must measure whether
  the edge-aware path improves bounded activation usefulness instead of only
  rendering reviewable metadata.
decision_kind: adopt
decision: Run a DB-backed usefulness closure over the normal edge-aware
  activation path, classify selected/used/helped/missing/noise, and choose the
  next graph-brain task from evidence.
does_not_prove: This does not prove source truth, edge correctness, activation
  scoring quality, production graph retrieval quality, crawler readiness,
  product readiness, or Memory Core mutation.
consumer: V334 edge-aware activation selection delta proof.
falsifier: A fresh persisted run cannot show useful edge-aware activation
  metadata, owner-file context, or any review/ranking implication beyond
  decorative readback.
```

## Pattern Gate

Retained pattern search:

```txt
edge-aware activation usefulness: 0 results
activation: target-repo-write-authority-boundary
```

Decision:

```txt
target-repo-write-authority-boundary: deferred/noise
```

Reason: V333 did not write to a living external target repo. The applicable
source chain was repo-local V332 evidence plus the active root `PLAN.md` V333
task contract.

## DB Run

```txt
executionRun: 5595420c-58a8-4943-b766-074ff9520d3d
taskContract: a44eccce-3cbe-4409-b2a2-bfba9d8b9c85
contextAssembly: b368df8e-bae4-4a31-a15b-281ac55402b5
retrievalRun: e65b70ec-3b60-4cd1-8888-776ab404a62f
```

Evidence and reflection:

```txt
evidenceBundle: 336cd70a-84af-41c1-bc87-f2feda9a8b2c
reviewAssessment: 7c1fc8fd-a666-4790-b44b-4f2066567f2b
feedbackDelta: 95c3e1d0-ba29-44aa-bfea-3db6cd820f5d
observationGroup: 697ce07b-d987-4aca-b5ba-327dfcc9c5b5
observationItems: 5
reflectionRecord: bb704963-0e78-4cdd-9b48-f833983902d7
MemoryRecord created: no
Candidate rows written: no
```

DB readiness:

```txt
Postgres: reachable
Migrations applied: 14/14
pgvector: available
Brain store readiness: ready
```

## Activation Usefulness

| Item | Selected | Used | Verdict | Evidence | Notes |
|---|---:|---:|---|---|---|
| `source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27` | yes | yes | helped | `graphScore: 8`, total `238`, edge ids `ddbcef43...`, `415321b3...` | Top-ranked candidate. Edge metadata made the source-relation context reviewable and changed ordering over the next source claim. |
| `source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e` | yes | yes | helped | total `230` | Preserved the temporal-edge non-truth boundary. |
| `search_document:e1c5f544-7ffd-4ef5-8e34-e8a6bc6c6257` | yes | yes | helped | owner file `packages/harness/src/activation/activationEngine.ts` | Exact owner-file recall for activation retrieval/diagnostics. |
| `search_document:d67827a8-74af-4159-82e7-1b0ab11e94bb` | yes | neutral | neutral | owner file `packages/cli/src/runPlanCommand.ts` | Relevant if plan output changes; not used for a docs-only usefulness closure. |
| `search_document:9f45c159-3d7d-4b0a-8bb4-b4bb79ec2e6c` | yes | yes | helped | owner file `packages/cli/src/runRunShowCommand.ts` | Relevant to persisted readback usefulness. |
| `source_claim:931e7faa-a982-498f-a265-6a938800f707` | yes | yes | helped | explicit SourceClaimEdge preview/readback source | Anchored the work to graph-brain v0 candidate/readback behavior. |
| `source_claim:578d247c-caa7-4cf2-8b27-0a211a00c778` | no | no | missing/acceptable | excluded `over_budget`, total `170` | It was an edge seed for the top candidate but excluded under budget. This is the next useful gap: prove whether edge influence can rescue or include edge-adjacent context when lexical rank alone would lose it. |

Noise:

```txt
No selected item was harmful. One selected CLI owner file was neutral because
this slice produced a report instead of a CLI implementation change.
```

Missing:

```txt
The excluded source_claim:578d... shows the next product gap: edge-aware
metadata is visible and ranking-positive, but V333 does not prove edge influence
can produce a selection delta under tighter budget or weaker lexical overlap.
```

## Usefulness Closure

What improved:

```txt
- The normal persisted activation path selected real edge-aware source context.
- The top source candidate carried SourceClaimEdge ids, edge kind, seed claim
  ids, graphScore, and a does-not-prove boundary.
- Owner-file recall selected the activation and readback owner files.
- The operator can now inspect why graph context affected ordering without ad
  hoc SQL or lab-seeded duplicate candidate rows.
```

What remains unproven:

```txt
- whether graphScore can change inclusion under budget pressure;
- whether edge-aware retrieval can answer graph QA;
- whether source edges are correct or sufficient;
- whether graph-aware activation scales beyond this local corpus;
- whether product-facing knowledge search is ready.
```

## Next Recommended Task

```txt
V334 Edge-Aware Activation Selection Delta Proof
```

Goal: create a bounded scenario where edge influence must change inclusion or
ordering compared with a no-edge baseline. Do not broaden into crawler,
graph database, UI/API/MCP, worker runtime, consensus runtime, or broad ranking
rewrite.

Rationale: V333 proved edge-aware activation is review-useful and
ranking-positive. The next missing proof is selection delta.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs were refreshed | remote CI status |
| `git status --short --branch` | passed | worktree was clean before V333 | product readiness |
| `git log --oneline -n 8` | passed | latest local history was visible | correctness |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "edge-aware activation usefulness"` | passed, 0 results | exact pattern query had no matches | no relevant pattern exists |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "activation"` | passed, 1 result | broader pattern query worked | target-repo pattern applied to V333 |
| `pnpm db:ready` | passed | local Postgres reachable, 14/14 migrations applied, pgvector available | remote DB truth |
| `krn plan --persist` | passed | DB-backed V333 run exists with context assembly and activation trace | graph retrieval quality |
| `krn run show --run-id 5595420c-58a8-4943-b766-074ff9520d3d` | passed | text readback shows selected edge-aware activation context | source truth |
| `krn run show --run-id 5595420c-58a8-4943-b766-074ff9520d3d --json` | passed | JSON readback exposes edge influence and candidate scores | API/product readiness |
| `pnpm run typecheck` | passed | strict TypeScript workspace typecheck passes | product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | graph retrieval quality |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |
| `krn evidence capture --persist` | passed | evidence, review assessment, feedback delta, command provenance, and source usefulness outcomes persisted | source truth or Memory Core mutation |
| `krn observe --persist` | passed | observation group/items persisted for the run | candidate quality |
| `krn reflect --persist` | passed | reflection record persisted after observe without MemoryRecord mutation or candidate rows | reflection extraction quality |

## Current Proof Boundary

This report proves a bounded DB-backed usefulness closure for edge-aware
activation readback. It does not prove production graph retrieval, product
readiness, second-operator usability, source truth, edge correctness, or Memory
Core mutation.
