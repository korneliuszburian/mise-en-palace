# SBV-00 Retained Pattern Vertical

Status: complete with follow-up repair.

Beads issue: `mise-en-palace-rkx`.

## Objective

Build one larger shared-brain vertical where a retained pattern flows through:

```txt
brain knowledge readback
-> persisted plan/context
-> Codex brief
-> evidence/review feedback
-> observe/reflect staging
-> next-run reuse or explicit abstention
```

This slice intentionally avoids another multi-repo bookkeeping closure.

## Selected Pattern

Retained pattern:

```txt
pattern:source-to-decision-retention-gate
```

Backing SourceClaim selected by DB-backed planning:

```txt
125366b1-8bd9-4092-92d8-1aa1d2ed46ae
```

Claim:

```txt
Retained KRN knowledge must preserve source, mechanism, KRN implication,
decision or rejection, consumer, falsifier, and does-not-prove boundary.
```

## Vertical Result

The first persisted run succeeded.

```txt
executionRun: 378724f3-8ce8-46d3-9265-1442576ae6e8
taskContract: 53064ff1-8091-4670-b901-7a9de43fc2f4
contextAssembly: c842a8f5-895a-4e8b-ab2a-3ee2e98711d8
evidenceBundle: 9e7e288c-5775-4df6-aadb-9e0082703588
reviewAssessment: 2cf11f62-c659-4e50-a577-f2b0595204ac
feedbackDelta: 9702148b-8c06-4ed8-b654-419766ebbf5f
observationGroup: f5e3ecf4-922c-49a0-a4cf-7e88b669976a
reflectionRecord: 51364850-e7a9-4540-9db1-d7123c93c27c
```

The SourceClaim was included in the DB-backed plan and rendered into the Codex
brief. Evidence capture persisted usefulness feedback:

```txt
outcome=helped
sourceClaim=125366b1-8bd9-4092-92d8-1aa1d2ed46ae
```

Observe/reflect staged the run without Memory Core mutation:

```txt
Observation items: 5
Findings: 0
Candidate generation status: ready
Candidate rows written: no
MemoryRecord created: no
```

## Next-Run Check

The second persisted plan proved an important gap.

```txt
executionRun: 158f0c56-e022-4c65-8740-4c685b636656
```

For a follow-up SBV/source-to-decision task, the same SourceClaim was available
but excluded:

```txt
source_claim:125366b1-8bd9-4092-92d8-1aa1d2ed46ae | reason=over_budget
```

Meanwhile an unrelated EKOLOGUS target-specific SourceClaim was included first.

Decision: accept this as explicit next-run abstention, not successful reuse.
Open a bounded repair for retained-pattern priority before continuing broad
vertical work.

Follow-up:

```txt
mise-en-palace-tsw: Repair SBV retained-pattern next-run priority.
```

## Source-To-Decision

Source:

- `pattern:source-to-decision-retention-gate`
- SourceClaim `125366b1-8bd9-4092-92d8-1aa1d2ed46ae`
- SBV-00 persisted plan, Codex brief, evidence, observe, reflect, and next-plan
  readbacks.

Mechanism:

- A retained pattern can be selected into persisted context and Codex brief,
  receive source-usefulness feedback, and pass through observe/reflect without
  mutating final memory.
- Next-run selection can still miss the same helped pattern due budget pressure
  from unrelated previously useful target-specific context.

KRN implication:

- The shared brain vertical exists, but next-run reuse is not strong enough
  until current-task retained pattern priority beats unrelated prior context.

Decision:

- Accept the vertical proof as complete.
- Do not claim successful next-run reuse.
- Open a bounded activation/readback repair for SBV retained-pattern priority.

Consumer:

- Activation/context selection.
- Codex brief selected context.
- Evidence/review source-usefulness feedback.
- Next SBV repair task.

Falsifier:

- A future SBV/source-to-decision-shaped persisted plan still excludes
  SourceClaim `125366b1-8bd9-4092-92d8-1aa1d2ed46ae` as over-budget while
  unrelated target-specific context is included first.

Does not prove:

- Source truth.
- Research completeness.
- Ranking quality at scale.
- Codex execution.
- Product readiness.
- Source truth promotion.
- Eval promotion.
- Memory Core mutation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `krn brain knowledge --text source-to-decision --json` | passed | Retained source-to-decision pattern is queryable from the current catalog. | Live DB state, ranking quality, or product readiness. |
| `krn plan --persist` | passed | DB-backed planning can include the retained SourceClaim in context. | Selected context sufficiency or Codex execution. |
| `krn codex brief --run-id 378724f3-8ce8-46d3-9265-1442576ae6e8` | passed | Codex brief renders the selected SourceClaim and proof boundaries. | Codex executed the work. |
| `krn evidence capture --persist --source-usefulness ...` | passed | Source usefulness feedback can be persisted for the selected SourceClaim. | Source truth, promotion, or product readiness. |
| `krn observe --run 378724f3-8ce8-46d3-9265-1442576ae6e8 --persist` | passed | Evidence can stage into observations for the run. | Reflection quality or Memory Core usefulness. |
| `krn reflect --scope run:378724f3-8ce8-46d3-9265-1442576ae6e8 --persist` | passed | Reflection can select the staged observations without Memory mutation. | Useful findings or candidate quality. |
| second `krn plan --persist` | passed | Next-run check exposes explicit over-budget abstention for the helped SourceClaim. | Successful reuse. |

