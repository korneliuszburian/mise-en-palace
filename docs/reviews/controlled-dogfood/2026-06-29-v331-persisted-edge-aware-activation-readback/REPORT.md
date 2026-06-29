# V331 Persisted Edge-Aware Activation Readback

Status: complete bounded readback repair, DB-backed dogfood.

## Verdict

V331 makes persisted activation trace candidates visible through `krn run show`.
The readback now exposes retrieval candidate scores, activation decisions, and
bounded `sourceClaimEdgeInfluence` metadata when present.

This is not production graph retrieval. The edge-aware candidate in the dogfood
run was seeded as a lab readback row to prove persisted readback behavior.

## Source To Decision

```yaml
source_id: v330-edge-aware-source-candidate-lab
trust_tier: high
source_class: repo-local evidence
mechanism: V330 proved SourceClaimEdge-connected source candidates can carry
  bounded graphScore and sourceClaimEdgeInfluence metadata as activation input.
krn_implication: Before adding graph runtime or crawler work, KRN must let an
  operator read back persisted edge-aware candidate metadata from the current DB
  run without ad hoc SQL.
decision_kind: adopt
decision: Extend run readback with retrieval candidate and activation decision
  resources keyed from contextAssembly.metadata.retrievalRunId.
does_not_prove: This does not prove activation scoring quality, edge correctness,
  source truth, production graph retrieval quality, crawler readiness, product
  readiness, or Memory Core mutation.
consumer: V332 edge-aware source candidate refinement.
falsifier: A persisted retrieval candidate with sourceClaimEdgeInfluence
  metadata cannot be read through krn run show text and JSON output.
```

## Implementation

Changed:

- `packages/harness/src/repositories/harnessRunRepository.ts`
- `packages/harness/src/repositories/index.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- `packages/cli/src/runRunShowCommand.ts`
- `packages/cli/src/runRunShowCommand.test.ts`

Behavior:

- `HarnessRunAggregate` can now include an optional activation trace.
- `DrizzleHarnessRunRepository.getHarnessRunByExecutionRunId` follows the
  existing `contextAssembly.metadata.retrievalRunId` pointer.
- `krn run show` text output renders activation trace candidates and decisions.
- JSON output includes `context.activationTrace`.
- `sourceClaimEdgeInfluence` is parsed as a bounded typed readback object.
- Raw candidate metadata is not dumped wholesale.
- No schema, migration, crawler, graph DB, graph runtime, ranking rewrite,
  Memory Core mutation, UI/API/MCP, worker daemon, or consensus runtime was
  added.

## DB Dogfood

Plan run:

```txt
executionRun: de972a64-630f-4be0-b6fe-48185f73648e
taskContract: f5b8ecc6-4bdd-49b8-b9da-81df198e7d9f
contextAssembly: 24dc711b-033b-4b8f-be20-4f0444e32da7
retrievalRun: cc3898e5-51ac-4316-b01c-a97603166e8b
```

Evidence and reflection:

```txt
evidenceBundle: 9bae18c3-736d-4a3a-a2f0-0b74d492e861
reviewAssessment: 349181d4-923a-4c08-9e80-c7b525b32a70
feedbackDelta: c3643ea8-d3d8-4974-ac7c-5405afb5556b
observationGroup: 877b5782-aba0-47e2-a261-2f54ed7f6eec
reflectionRecord: a16b1d74-5883-4d69-bdad-75c77d96d4b2
MemoryRecord created: no
Candidate rows written: no
```

Edge-aware lab seed:

```txt
sourceClaimEdge: ddbcef43-a680-407d-bf8b-2b95c07e40d4
seedSourceClaim: 931e7faa-a982-498f-a265-6a938800f707
connectedSourceClaim: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
retrievalCandidate: 52f13b0f-3f93-4e49-ab0a-046a87bf4e0a
graphScore: 9
edgeKinds: narrows
```

Readback proof:

```txt
krn run show --run-id de972a64-630f-4be0-b6fe-48185f73648e
krn run show --run-id de972a64-630f-4be0-b6fe-48185f73648e --json
```

Both readbacks showed:

```txt
sourceClaimEdgeInfluence:
  edgeIds: ddbcef43-a680-407d-bf8b-2b95c07e40d4
  edgeKinds: narrows
  seedSourceClaimIds: 931e7faa-a982-498f-a265-6a938800f707
  doesNotProve: SourceClaimEdge influence does not prove source truth, edge
    correctness, ranking quality, or product graph retrieval quality.
```

## Activation Usefulness

```txt
search_document:9f45c159-3d7d-4b0a-8bb4-b4bb79ec2e6c
  helped: selected runRunShowCommand.ts as exact owner file.

source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
  helped: constrained temporal edge semantics.

source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  helped: constrained this to selected context/readback substrate.

source_claim:931e7faa-a982-498f-a265-6a938800f707
  helped: tied the slice to SourceClaimEdge preview/readback before graph runtime.
```

Verdict: positive. Owner-file recall selected `runRunShowCommand.ts`; source
claims kept the slice bounded.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- runRunShowCommand` | passed | run show renders activation trace text/JSON in focused tests | DB runtime truth |
| `pnpm run typecheck` | passed | strict TypeScript checks pass | product readiness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | graph retrieval quality |
| `pnpm db:ready` | passed | local DB reachable, 14/14 migrations applied, pgvector available | remote DB truth |
| `krn plan --persist` | passed | DB-backed V331 run exists | production activation applies edge influence |
| `krn source claim edges --source-claim-id 931e...` | passed | real persisted SourceClaimEdge exists and is readable | edge correctness |
| `krn run show --run-id de972...` | passed | text readback shows persisted edge-aware candidate metadata | ranking quality |
| `krn run show --run-id de972... --json` | passed | typed JSON readback exposes activationTrace | API/product readiness |
| `krn evidence capture --persist` | passed | evidence, review assessment, feedback delta, command provenance, source usefulness outcomes persisted | source truth or Memory Core mutation |
| `krn observe --persist` | passed | observation group/items persisted for the run | candidate quality |
| `krn reflect --persist` | passed | reflection record persisted without MemoryRecord mutation or candidate rows | reflection extraction quality |

## Next Recommended Task

```txt
V332 Edge-Aware Source Candidate Refinement
```

Goal: remove the need for lab-seeded duplicate candidate rows by defining the
smallest bounded source-candidate refinement path for edge influence. Do not
claim broad graph retrieval quality.

Non-goals: no crawler, no schema, no graph database, no UI/API/MCP, no worker
daemon, no consensus runtime, no broad ranking rewrite, no Memory Core mutation.
