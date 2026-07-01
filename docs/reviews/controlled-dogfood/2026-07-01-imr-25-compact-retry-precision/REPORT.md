# IMR-25 Compact Brain-Search Retry Precision Classification

Status: complete.

Issue: `mise-en-palace-1tu`.

## Executive Verdict

The Q6 compact retry adjacency is acceptable and does not warrant a precision
repair now.

`krn brain search` selects the primary heartbeat/dreaming runtime pattern and
one adjacent cost-aware acquisition pattern. The adjacent pattern is not broad
noise: it is in the same heartbeat/acquisition family, its consumers include
future heartbeat/dreaming candidate runtime slices, and the live Q6 source
readback still reports missing document evidence. That makes the acquisition
pattern useful when Q6 is used to plan missing-evidence follow-up, and neutral
when Q6 is only checking the runtime boundary.

No source code changed in this slice.

## Scope

Inspected:

- IMR-24 report;
- live Q6 `krn brain search --json` readback;
- targeted heartbeat runtime query;
- targeted cost-aware acquisition query;
- unrelated control query.

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

## Source-To-Decision

- Source: IMR-24 Q6 readback and live current-shell Q6/targeted/control
  readbacks.
- Mechanism: compact retry strips bridge terms and makes retained heartbeat
  patterns visible, but heartbeat/dreaming queries can legitimately overlap
  with acquisition escalation patterns because heartbeat is the candidate-only
  runtime that proposes missing-evidence acquisition work.
- KRN implication: do not add precision filtering until an actual downstream
  decision is harmed. Classify the adjacency and keep moving to a product-facing
  acquisition usefulness check.
- Decision: accept the Q6 adjacency as helped/neutral, not noise.
- Rejection: no semantic ranking rewrite, embeddings, crawler, API/MCP, worker
  daemon, DB schema, source truth mutation, Memory Core mutation, or broad
  benchmark lane.
- Consumer: future mini Brain-QA readbacks, AMA-shaped acquisition checks, and
  heartbeat/dreaming pattern gates.
- Falsifier: a future non-acquisition heartbeat query selects cost-aware
  acquisition in a way that hides the primary heartbeat pattern or drives an
  incorrect action.

## Live Readback

Raw output directory:

```txt
/tmp/krn-imr-25-q6-precision
```

### Q6 Benchmark Query

Query:

```txt
heartbeat dreaming source relation evidence
```

Brain knowledge queries:

```txt
heartbeat dreaming source relation evidence -> heartbeat dreaming
```

Selected knowledge:

| Pattern | Classification | Why |
|---|---|---|
| `pattern:heartbeat-candidate-only-runtime-boundary` | helped | This is the primary Q6 target: heartbeat/dreaming must stay candidate-only and avoid scheduler/daemon/source-truth/Memory Core mutation. |
| `pattern:cost-aware-acquisition-escalation-boundary` | helped / neutral | Helpful if the Q6 result drives missing-evidence acquisition follow-up; neutral if the operator only needs the runtime boundary. It is not noise because it governs heartbeat acquisition escalation and Q6 still reports missing evidence. |

Source-search readback:

```txt
answerUsefulness: partly_useful_missing_document
relationSupport: 7
missingEvidence:
  - included SearchDocument evidence for this combined query; artifact-linked SearchDocuments are visible but were not included by lexical retrieval
```

### Targeted Comparison

| Query | Selected knowledge | Verdict |
|---|---|---|
| `heartbeat candidate-only runtime boundary` | heartbeat runtime + cost-aware acquisition | acceptable adjacency; same heartbeat/acquisition family |
| `cost-aware acquisition escalation` | cost-aware acquisition only | precise for the acquisition pattern |
| `unrelated dependency css rendering color palette` | none | no broad false-positive explosion observed |

## Precision Decision

Do not repair ranking or filtering now.

The extra Q6 pattern does not obscure the primary heartbeat result, does not
select for unrelated control queries, and provides useful guidance when the
readback has missing evidence. A precision repair would add complexity before a
real harmed decision exists.

Next step: use the existing patterns in an AMA-shaped acquisition usefulness
check instead of tuning search prematurely.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current shell can reach Postgres, migrations are applied, and pgvector is available. | Does not prove answer quality or Memory Core usefulness. |
| Q6 `krn brain search --json` with `KRN_DATABASE_URL` | passed | Live Q6 selects heartbeat runtime and cost-aware acquisition patterns; Q6 still reports missing evidence. | Does not prove ranking quality or source truth. |
| targeted heartbeat runtime query | passed | The same adjacency appears for a heartbeat-focused query. | Does not prove the adjacency is always useful. |
| targeted cost-aware acquisition query | passed | The acquisition pattern can be selected precisely by mechanism terms. | Does not prove heartbeat precision. |
| unrelated control query | passed | A broad unrelated query did not select retained patterns. | Does not prove no future false positives exist. |

## Proof Boundary

Proves:

- Q6 adjacency is classified with current-shell evidence;
- no immediate precision repair is warranted;
- unrelated control query did not trigger selectedKnowledge;
- DB readiness was true in this shell.

Does not prove:

- semantic ranking quality;
- source truth;
- answer correctness;
- autonomous acquisition quality;
- Memory Core usefulness;
- product readiness.
