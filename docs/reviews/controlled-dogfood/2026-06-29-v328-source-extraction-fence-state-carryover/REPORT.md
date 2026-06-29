# V328 Source Extraction Fence-State Carryover Repair

Status: complete source repair, DB-backed dogfood.

## Verdict

V328 fixed deterministic local extraction so fenced/code block state carries
across rendered chunk boundaries. YAML/source-decision content that starts
inside an already-open fence is now deferred instead of emitted as a ready claim
candidate.

## Source To Decision

```yaml
source_id: v327-reviewed-extraction-persistence-bridge-report
trust_tier: high
source_class: repo-local evidence
mechanism: V327 live ADR-0021 preview showed YAML/source-decision content from
  a fence opened in the previous chunk appearing as ready claim candidates.
krn_implication: Graph Brain v0 must preserve extraction reviewability before
  graph ranking or graph-aware retrieval, otherwise reviewed persistence can be
  fed noisy candidate surfaces.
decision_kind: adopt
decision: Carry fence state across chunks in deterministic local extraction and
  defer fenced/source-decision content.
does_not_prove: This does not prove extraction quality at scale, entity
  resolution, graph retrieval, source truth, crawler readiness, or product
  readiness.
consumer: `krn source artifact preview --extract-candidates`
falsifier: A chunk beginning inside an already-open fence still produces ready
  claim candidates from fenced/YAML/source-decision content.
```

## Implementation

Changed:

- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
- `packages/cli/src/runSourceArtifactPreviewCommand.test.ts`

Behavior:

- `insideFence` state now spans chunks during claim extraction;
- closing fences at chunk starts are handled without creating ready candidates;
- direct prose outside fences remains ready;
- fenced/source-decision blocks remain deferred with the existing
  `needs_more_evidence` reason;
- V327 reviewed persistence bridge behavior remains covered.

No schema, graph ranking, graph runtime, crawler, UI/API/MCP, worker daemon,
consensus runtime, or Memory Core mutation was added.

## Repomix Context Cleanup

The requested previous repomix/context artifact cleanup was checked with:

```txt
find . -path ./node_modules -prune -o -path ./.git -prune -o
  ( -iname "*repomix*" -o -path "./docs/context" -o
    -path "./docs/context/*" -o -path "./docs/contexts" -o
    -path "./docs/contexts/*" -o -name "context-pack.md" ) -print
```

No active `docs/context`, `docs/contexts`, `context-pack.md`, or `*repomix*`
artifact exists in the current tree, so no file was deleted.

## DB Dogfood

Plan run:

```txt
executionRun: 8ae76a1e-e249-4164-97a2-65d1a4d8d864
taskContract: 31450829-588b-4340-a9cd-cea6d069bad3
contextAssembly: 56b9638e-8279-4114-a1e7-515d04b5e896
```

Persisted evidence loop:

```txt
evidenceBundle: e2936973-e246-46e6-8e7e-9c758c9fdb47
reviewAssessment: 16cc2ae4-fdeb-4520-9ed6-1eaac7f7b8ff
feedbackDelta: f7833c13-cde9-4388-924a-70b205271339
observationGroup: 95d446c2-f0b3-4127-a871-8b17882fb49a
observationItems: 5
reflectionRecord: 69f9d4ab-1f5d-43f7-8067-a45b7f23e04b
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Live ADR-0021 preview after repair:

```txt
ready claimCandidates:
- claim-candidate:32:this-is-enough-to-prove-the-graph-shape-
- claim-candidate:37:b-00-is-an-adr-design-task-only-it-must-
- claim-candidate:115:temporal-relations-are-edges-between-sou

deferred claimCandidates now include:
- claim-candidate:81:trust-tier-source-code-mechanism-sourcec
- claim-candidate:94:yaml-source-id-a-01-a-02-dogfood-title-d

Graph runtime: none
Memory mutation: none
```

## Activation Usefulness

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  helped: reinforced bounded context, no crawler/runtime jump.

source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
  neutral/helped: reminded that reviewed extraction bridge is pre-retrieval,
  but did not identify the owner file or fence-state implementation.

owner-file search_documents:
  noise: selected plan/run/activation files again, not the source artifact
  preview owner file.
```

Verdict: positive for persisted source-state activation; still weak for
owner-file recall.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand` | passed | focused extraction behavior covered | full product quality |
| `pnpm run typecheck` | passed | workspace TypeScript checks pass | runtime behavior |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm db:ready` | passed | local DB reachable, migrations applied, pgvector available | remote DB truth |
| `krn source artifact preview --extract-candidates` on ADR-0021 | passed | live preview defers chunk-crossing fenced content | all extraction cases |
| `git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Next Recommended Task

```txt
V329 Graph-Aware SourceClaimEdge Activation Readback Stub
```

Goal: add the smallest graph-aware readback/activation stub that can show how a
persisted `SourceClaimEdge` influences selected source context without claiming
ranking quality, graph runtime, crawler readiness, or product readiness.

Non-goals: no crawler, no new DB schema, no graph database, no UI/API/MCP, no
worker daemon, no consensus runtime, no Memory Core mutation.
