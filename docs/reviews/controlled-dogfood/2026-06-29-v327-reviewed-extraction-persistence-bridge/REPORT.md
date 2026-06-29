# V327 Reviewed Extraction Persistence Bridge

Status: complete source repair, DB-backed dogfood.

## Verdict

V327 added the smallest explicit bridge from a ready extraction claim candidate
to existing governed `SourceClaim` persistence. The bridge is operator-selected:
it requires `--extract-candidates`, `--persist`,
`--reviewed-extraction-claim-candidate-id`, and explicit review fields. It does
not persist deferred candidates, create schema, rank graph facts, crawl sources,
or mutate Memory Core.

## Source To Decision

```yaml
source_id: v326-extraction-reviewability-report
trust_tier: high
source_class: repo-local evidence
mechanism: V326 split ready claim candidates from deferred/noisy candidates, but
  persistence still required manually copying the claim into `--claim`, losing
  deterministic candidate id and source-range lineage.
krn_implication: Graph Brain v0 needs a reviewed bridge from selected extraction
  candidates to existing SourceClaim persistence before graph-aware retrieval.
decision_kind: adopt
decision: Add `--reviewed-extraction-claim-candidate-id` as a selected-candidate
  bridge that reuses existing SourceClaim governance fields and persistence.
does_not_prove: This does not prove extraction quality, source truth, graph
  retrieval, ranking, crawler readiness, or product readiness.
consumer: `krn source artifact preview --extract-candidates --persist`
falsifier: Deferred/noisy candidates can be persisted, review fields are not
  required, or candidate id/source-range lineage is missing after persistence.
```

## Implementation

Changed:

- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseSourceArgs.ts`
- `packages/cli/src/parseSourceArgs.test.ts`
- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
- `packages/cli/src/runSourceArtifactPreviewCommand.test.ts`

Behavior:

- accepts `--reviewed-extraction-claim-candidate-id <id>`;
- requires `--extract-candidates`, `--persist`, and explicit review fields;
- rejects combining the bridge with manual `--claim`;
- refuses deferred extraction candidates before DB runtime creation;
- persists only selected ready extraction candidates through existing
  `SourceClaim` persistence;
- records `extractionCandidateId`, `extractionCandidateSourceRange`,
  `extractionCandidateReviewability`, and `reviewedExtractionBridge` metadata;
- leaves `SourceClaimEdge` persistence on existing explicit `--graph-edge-*`
  inputs only.

## DB Dogfood

Plan run:

```txt
executionRun: f1548282-32cf-49cc-9e6c-c51a83574e21
taskContract: e2fbd0db-ab4f-428d-9820-385c3c1196fe
contextAssembly: 2dd59843-7e87-494a-b112-e9422d23b5e9
```

Reviewed bridge live readback against `docs/decisions/ADR-0021-temporal-claim-graph.md`:

```txt
sourceArtifact: 33ab17bd-1bf7-4b39-9ff4-1288203aa9ff
sourceChunks: 7ac6f830-3a0d-4add-9358-5cc032290116, dfe68fcd-5bf2-430b-b18a-8d6920083862, c2e8ecd7-b9e1-4e5a-a750-dc3670482e79
searchDocument: 835d3652-783f-4608-9fab-43fdbc434b4e
sourceClaim: 7769dfc9-fb91-4f80-804f-01a206b7690e
reviewedExtractionClaimCandidate: claim-candidate:115:temporal-relations-are-edges-between-sou
reviewedExtractionClaimSourceRange: lines 115-117
sourceClaimEdge: not created
Graph runtime: none
Memory mutation: none
```

Evidence loop:

```txt
evidenceBundle: 179e9212-c9b5-4d84-8471-73e264ba0aab
reviewAssessment: 5b961af0-8eb8-498a-b879-a1c142613daf
feedbackDelta: bd46618d-9392-4536-9071-b131c0f2c802
observationGroup: 9b431bbd-64b4-4da3-b40f-eb0767a4fddf
observationItems: 5
reflectionRecord: c3a1dcb7-92e2-42e4-bb8d-8e83ff89d114
candidateRowsWritten: no
MemoryRecord created: no
```

Negative proof:

```txt
deferred candidate claim-candidate:21:the-current-edge-model-already-supports
was rejected with:
Cannot persist deferred extraction claim candidate: claim-candidate:21:the-current-edge-model-already-supports
```

## Activation Usefulness

```txt
source_claim:3afb4c95-eaad-4df1-aa72-e8c739f385dd
  helped: local artifact preview can carry governed source claims.

source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  helped: reinforced selected/bounded context and no crawler/runtime jump.

owner-file search_documents:
  noise: selected plan/run/activation files, not the source artifact preview
  owner files that actually changed.
```

Verdict: mixed positive. Source claims helped; owner-file recall remains weak for
this graph/source CLI task.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | parser/runner behavior covered | graph retrieval/product quality |
| `pnpm run typecheck` | passed | workspace TypeScript checks pass | runtime DB behavior |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm db:ready` | passed | local DB reachable, migrations applied, pgvector available | CI/remote DB truth |
| `krn source artifact preview ... --reviewed-extraction-claim-candidate-id ... --persist` | passed | selected ready extraction candidate persisted as SourceClaim with readback | source truth/ranking |
| deferred candidate rejection command | expected failure | deferred candidate bridge is blocked | all noisy candidates are detected |
| `git diff --check` | passed | no whitespace diff errors | behavior correctness |

Note: `rtk pnpm typecheck` returned code `1` while printing `TypeScript: No
errors found`; the authoritative typecheck proof used `rtk pnpm run typecheck`.

## New Finding

ADR-0021 wide preview exposed a remaining extraction bug: if a preview chunk
starts inside a fenced YAML/source-decision block, the current deterministic
heuristic may not know the fence is already open and can classify YAML content as
ready. The reviewed bridge still requires operator selection and review fields,
but the candidate surface should preserve fence state across chunks.

## Next Recommended Task

```txt
V328 Source Extraction Fence-State Carryover Repair
```

Goal: keep local extraction preview aware of fenced/code block state across
chunk boundaries so source-decision/YAML content cannot appear as ready claim
candidates merely because the chunk starts inside an already-open fence.

Non-goals: no crawler, no graph ranking, no schema, no worker, no UI/API/MCP, no
Memory Core mutation.
