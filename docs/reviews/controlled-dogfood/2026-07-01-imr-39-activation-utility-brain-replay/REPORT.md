# IMR-39 Activation Utility Brain Replay

Status: complete, mixed replay.

Issue: `mise-en-palace-9ei`

## Executive Verdict

The IMR-38 retained follow-up evidence is replayable through source/brain search
as marker-addressed SearchDocument evidence, and brain search correctly classifies
the result as useful linked source/graph evidence with `mutation: none`.

The replay is not complete as natural brain knowledge reuse: natural and
exact-claim queries did not select the exact IMR-38 SourceClaim or the
SourceDecisionEdge target. This is a bounded recall/readback gap, not evidence
for a ranking rewrite, semantic model, crawler, worker daemon, API/MCP, DB
schema, source truth mutation, eval promotion, or Memory Core mutation.

## Scope

Input evidence from IMR-38:

```txt
SourceArtifact: 240a4700-053b-494d-ab59-d4361098cf31
SearchDocument: ec52d802-bbf4-4b04-8737-28e6707c279d
SourceClaim: 190f1f72-4621-49b4-b93c-538ea2c581ef
SourceDecisionEdge: 73e266bb-e957-4a07-aa62-fe74cb7178a0
target: eval_candidate/activation-utility-source-eval-follow-up-imr-38
marker: krn-source-artifact-preview a2d428319fa405c3
```

Queries:

```txt
marker:
  krn-source-artifact-preview a2d428319fa405c3

natural:
  activation utility accepted manual source eval follow-up

focused natural:
  heartbeat routed activation utility candidate accepted manual source eval follow-up only

exact claim:
  IMR-37 heartbeat-routed activation utility candidate is accepted for manual source eval follow-up only

id query:
  190f1f72-4621-49b4-b93c-538ea2c581ef 73e266bb-e957-4a07-aa62-fe74cb7178a0 activation-utility-source-eval-follow-up-imr-38
```

Non-goals:

- no ranking rewrite;
- no semantic model;
- no crawler;
- no worker daemon;
- no API/MCP;
- no DB schema;
- no source truth mutation;
- no eval promotion;
- no Memory Core mutation.

## Source To Decision

Source:
IMR-38 retained source/eval follow-up evidence and current DB-backed
source/brain search readbacks.

Mechanism:
SearchDocument replay can recover the retained SOURCE.md packet by marker, while
source/brain search summaries can carry useful linked source/graph evidence even
when selected brain knowledge is missing.

KRN implication:
The retained evidence is useful as replayable linked evidence, but it is not yet
reliable as natural-query brain knowledge or exact SourceDecisionEdge recall.

Decision:
Accept IMR-39 as a mixed replay proof. Open a bounded recall/readback repair for
natural queries and exact retained SourceClaim/SourceDecisionEdge surfacing.

Consumer:
Next activation utility source/eval replay repair.

Falsifier:
The repair is invalid if exact retained follow-up evidence already surfaces in
natural brain search, or if surfacing it requires broad ranking/schema/runtime
work instead of a bounded readback/owner repair.

Does not prove:
source truth, decision correctness, ranking quality, semantic-aware Thompson
sampling, autonomous acquisition, product readiness, eval promotion, or Memory
Core mutation safety.

## Replay Results

| Query | Surface | Retained SearchDocument | Exact SourceClaim | Selected brain knowledge | Source/link/graph utility | Mutation | Verdict |
|---|---|---:|---:|---:|---|---|---|
| marker | source search | yes | no | n/a | useful | none | helped |
| marker | brain search | yes, via source summary | no | 0 | useful; `linked_evidence_exploration_candidate` | none | helped, but selected knowledge missing |
| natural | source search | not the exact IMR-38 packet | no | n/a | useful generic evidence | none | neutral/missing |
| natural | brain search | not the exact IMR-38 packet | no | 0 | useful generic evidence | none | neutral/missing |
| focused natural | source search | not the exact IMR-38 packet | no | n/a | useful generic evidence | none | neutral/missing |
| focused natural | brain search | not the exact IMR-38 packet | no | 0 | useful generic evidence | none | neutral/missing |
| exact claim | source search | not the exact IMR-38 packet | no | n/a | useful generic evidence | none | missing |
| exact claim | brain search | not the exact IMR-38 packet | no | 0 | useful generic evidence | none | missing |
| id query | source search | no exact retained packet | no | n/a | useful generic evidence | none | missing |
| id query | brain search | no exact retained packet | no | 0 | useful linked evidence | none | missing |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | local DB is reachable; migrations and pgvector are ready in this shell | CI DB state, product readiness |
| `krn source search --query "krn-source-artifact-preview a2d428319fa405c3" --json` | passed | marker query retrieves the retained IMR-38 SearchDocument as included evidence | exact SourceClaim recall, natural-query recall, source truth |
| `krn brain search --query "krn-source-artifact-preview a2d428319fa405c3" --json` | passed | brain search carries useful source/link/graph evidence and activation utility verdict for the marker replay | selected brain knowledge, ranking quality, product readiness |
| `krn source search --query "activation utility accepted manual source eval follow-up" --json` | passed | broad natural query has useful source evidence | exact retained IMR-38 evidence recall |
| `krn brain search --query "activation utility accepted manual source eval follow-up" --json` | passed | brain search handles the broad natural query with mutation none | exact retained IMR-38 evidence recall |
| focused natural and exact-claim source/brain queries | passed | query-shape classification is reproducible | that the exact retained claim/edge is naturally discoverable |

Representative marker brain-search readback:

```txt
supportingClaims: 4
supportingDocuments: 1
sourceClaimDocumentLinks: 4
linkedSearchDocuments: 4
includedCandidates: 5
selectedKnowledge: 0
activationUtility.verdict: linked_evidence_exploration_candidate
activationUtility.selectedKnowledge.strength: missing
activationUtility.sourceLinkGraph.strength: useful
mutation: none
```

Representative exact-claim brain-search readback:

```txt
supportingClaims: 6
supportingDocuments: 2
sourceClaimDocumentLinks: 6
includedCandidates: 8
exactImr38ClaimSelected: false
selectedKnowledge: 0
activationUtility.verdict: linked_evidence_exploration_candidate
mutation: none
```

## Pattern Usefulness

Selected patterns:

- Source-to-decision: helped. It prevented treating marker replay as source
  truth or full natural recall.
- Activation utility readback: helped. It exposed useful linked evidence despite
  missing selected brain knowledge.
- Evidence/review loop: helped. It forced proof/non-proof boundaries and kept
  mutation `none`.

Missing pattern:

- Natural-query recall for retained SourceClaim/SourceDecisionEdge evidence.
  Search can retrieve related evidence, but not the exact retained follow-up
  object in this slice.

## Next Action

Open and run a bounded repair/readback slice:

```txt
mise-en-palace-2fl: Repair retained source/eval evidence natural brain-search recall
```

Acceptance for the repair:
either exact retained follow-up evidence becomes visible through a bounded
source/brain search readback, or the no-op reason is recorded with owner,
falsifier, and next consumer. No broad ranking rewrite or new subsystem.
