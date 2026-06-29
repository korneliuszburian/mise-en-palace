# V332 Edge-Aware Source Candidate Refinement

Status: complete bounded source repair, DB-backed dogfood.

## Verdict

V332 removes the V331 lab-seeded duplicate candidate dependency.

Normal activation retrieval now reads persisted `SourceClaimEdge` rows for the
retrieved source claims and applies the existing bounded
`sourceClaimEdgeInfluence` helper before ranking, filtering, context assembly,
and persisted activation trace readback.

This is still not production graph retrieval. It is the smallest source-candidate
refinement path that keeps edge influence reviewable without adding schema,
crawler, graph runtime, broad ranking rewrite, or Memory Core mutation.

## Source To Decision

```yaml
source_id: v329-v331-edge-aware-readback-evidence
trust_tier: high
source_class: repo-local evidence
mechanism: V329 exposed adjacent SourceClaim context for persisted
  SourceClaimEdges; V330 proved a pure edge-aware source candidate helper;
  V331 proved persisted activation trace readback, but only after a lab-seeded
  duplicate retrieval candidate row.
krn_implication: Graph Brain v0 should use existing SourceClaimEdge context in
  normal activation retrieval before any crawler, graph runtime, schema, or
  production graph retrieval claim.
decision_kind: adopt
decision: Extend activation retrieval to fetch SourceClaimEdges for retrieved
  SourceClaims and apply the existing edge influence helper before ranking.
does_not_prove: This does not prove source truth, edge correctness, activation
  scoring quality, production graph retrieval quality, crawler readiness,
  product readiness, or Memory Core mutation.
consumer: V333 edge-aware activation usefulness closure.
falsifier: A fresh persisted plan run cannot show sourceClaimEdgeInfluence in
  `krn run show` unless a manual duplicate retrieval candidate row is seeded.
```

## Implementation

Changed:

- `packages/harness/src/activation/activationEngine.ts`
- `packages/harness/src/activation/index.test.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/cli/src/noStoreRepositories.ts`
- `packages/cli/src/runCli.test.ts`

Behavior:

- `ActivationCandidateRepositories.sourceRepository` now requires
  `listSourceClaimEdgesForClaim`.
- `retrieveActivationCandidates` fetches SourceClaimEdges for the retrieved
  SourceClaims.
- existing `applySourceClaimEdgeInfluence` is applied before source candidate
  ranking.
- persisted activation trace can show `graphScore` and
  `sourceClaimEdgeInfluence` without lab-seeding a duplicate candidate row.
- no schema, migration, crawler, graph database, graph runtime, broad ranking
  rewrite, UI/API/MCP, worker daemon, consensus runtime, or Memory Core mutation
  was added.

## DB Dogfood

Fresh proof run after implementation:

```txt
executionRun: 7555d314-9da2-4d2f-8460-4fa28c5fdbc8
taskContract: 093cc3ad-53ba-4b3c-830d-fbb7f7514205
contextAssembly: 0ead5b4f-53ac-428e-9c27-724533fcd0f7
retrievalRun: 95e57154-5966-4173-b225-ad1d8f8f738b
```

Evidence and reflection:

```txt
evidenceBundle: 6eeba8fd-ffcc-4f42-9a47-b4780f6cb21f
reviewAssessment: 2d6b8043-9426-4f0b-a650-1aebb4f6d41f
feedbackDelta: b962d53c-2a39-4348-8e9a-db30b98161a2
observationGroup: 2d6f0124-8f03-466b-9bdc-6dbb5d8956a2
reflectionRecord: a3861970-8c76-40c8-a993-8bd10b69a792
MemoryRecord created: no
Candidate rows written: no
```

Readback proof:

```txt
krn run show --run-id 7555d314-9da2-4d2f-8460-4fa28c5fdbc8
krn run show --run-id 7555d314-9da2-4d2f-8460-4fa28c5fdbc8 --json
```

Both readbacks showed the normal source candidate:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  graphScore: 8
  sourceClaimEdgeInfluence:
    edgeIds:
      - ddbcef43-a680-407d-bf8b-2b95c07e40d4
      - 415321b3-4a26-4634-bfbe-38b756777d6a
    edgeKinds:
      - narrows
    seedSourceClaimIds:
      - 931e7faa-a982-498f-a265-6a938800f707
      - 578d247c-caa7-4cf2-8b27-0a211a00c778
    doesNotProve: SourceClaimEdge influence does not prove source truth, edge
      correctness, ranking quality, or product graph retrieval quality.
```

No manual retrieval candidate insert or lab seed was used for this proof run.

## Pattern Gate

Retained pattern search:

```txt
edge influence source candidate activation graphScore SourceClaimEdge: 0 results
activation: target-repo-write-authority-boundary only
```

Decision: the target-repo write boundary was not applied because V332 changed
the KRN repo itself, not a living external target repo. V332 used repo-local
V329/V330/V331 evidence as the direct source-to-decision chain.

Usefulness:

```txt
source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
  helped: constrained temporal edge semantics and non-truth claims.

source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  helped: constrained the work to activation/readback substrate before crawler
  or runtime expansion.

source_claim:931e7faa-a982-498f-a265-6a938800f707
  helped: tied the work to reviewable SourceClaimEdge candidate behavior.
```

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- activation compiler` | passed | focused activation/compiler behavior is covered | DB runtime truth |
| `pnpm --filter @krn/cli test -- runCli --testNamePattern "prints bounded activation inclusions"` | passed | CLI fixture uses the new source repository contract | product readiness |
| `pnpm run typecheck` | passed | strict TypeScript checks pass | graph retrieval quality |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | failed once, then passed | first run exposed an outdated CLI test fake; final workspace tests pass | source truth or activation quality |
| `pnpm db:ready` | passed | local Postgres reachable, migrations applied, pgvector available | remote DB truth |
| `pnpm db:smoke` | passed | DB persistence smoke passes | graph retrieval quality |
| `pnpm eval:promptfoo:smoke` | passed | Promptfoo smoke wiring passes | brain quality |
| `krn plan --persist` | passed | fresh DB-backed run exists with normal edge-aware source candidate path | product graph retrieval |
| `krn run show --run-id 7555...` | passed | text readback shows edge influence without lab seed | ranking quality |
| `krn run show --run-id 7555... --json` | passed | JSON readback shows bounded edge influence metadata | API readiness |
| `krn evidence capture --persist` | passed | evidence, review assessment, feedback delta, command provenance, and source usefulness outcomes persisted | source truth or Memory Core mutation |
| `krn observe --persist` | passed | observation group/items persisted for the run | candidate quality |
| `krn reflect --persist` | passed | reflection record persisted without MemoryRecord mutation or candidate rows | reflection extraction quality |
| `git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Next Recommended Task

```txt
V333 Edge-Aware Activation Usefulness Closure
```

Goal: measure whether the normal edge-aware candidate path actually improves a
bounded activation/usefulness scenario, or whether it is merely reviewable
metadata. Use existing persisted source claims/edges and report selected/used/
helped/missing/noise.

Non-goals: no schema, no crawler, no graph database, no UI/API/MCP, no worker
daemon, no consensus runtime, no broad ranking rewrite, no Memory Core mutation.
