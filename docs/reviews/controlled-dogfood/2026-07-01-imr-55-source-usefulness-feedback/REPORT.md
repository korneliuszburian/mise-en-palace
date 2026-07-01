# IMR-55 Source Usefulness Feedback

Status: complete.

Beads issue: `mise-en-palace-x6u`.

## Objective

Record source-usefulness feedback for the EKOLOGUS SourceClaim that IMR-54
proved was reused by the persisted Codex brief path.

This is a closure slice, not a new multi-repo direction.

## Boundary

- No target repository writes.
- No source truth promotion.
- No eval promotion.
- No Memory Core mutation.
- No ranking/scoring rewrite.
- No crawler, worker daemon, API, MCP, dashboard, or DB schema change.

## Result

`krn evidence capture --persist` created FeedbackDelta
`91045e93-5fa2-4b30-a26f-f0e493d37b41` for run
`07192df3-4656-48f4-b557-89f62c3e3d3d`.

Readback through `krn run show` confirms:

```txt
source usefulness outcomes:
- outcome=helped sourceClaim=bc4731b9-8add-40f8-9df9-fb4bb9342b75 sourceDecision=none
```

Reason:

```txt
Target-specific EKOLOGUS SourceClaim was the first persisted Codex brief
context inclusion and directly shaped the brief reuse decision.
```

## Evidence

| Evidence | Result | What it proves | What it does not prove |
|---|---|---|---|
| `krn evidence capture --persist --source-usefulness ...` | passed | The selected EKOLOGUS SourceClaim usefulness feedback can be persisted into FeedbackDelta metadata. | Source truth, target correctness, Codex execution, ranking quality, product readiness, source promotion, eval promotion, or Memory Core mutation. |
| `krn run show --run-id 07192df3-4656-48f4-b557-89f62c3e3d3d` | passed | FeedbackDelta readback exposes the `helped` outcome for SourceClaim `bc4731b9-8add-40f8-9df9-fb4bb9342b75`. | General source usefulness, future selector quality, or cross-repo product readiness. |
| `gh run view 28508850974` | passed | CI for IMR-54 commit `4c12bd3` succeeded. | This IMR-55 source-usefulness capture was not part of that earlier CI run. |

## Source-To-Decision

Source:

- IMR-54 persisted plan/context/brief readback.
- Current IMR-55 persisted FeedbackDelta readback.

Mechanism:

- A target-specific SourceClaim selected first in the persisted Codex brief can
  be recorded as `helped` through the evidence/review feedback path.

KRN implication:

- The brain should not stop at selection proof. Useful selected source packets
  need feedback so future retrieval and review loops can distinguish helped
  sources from merely selected sources.

Decision:

- Accept IMR-54 SourceClaim reuse as `helped` for this run.
- Do not continue with more small multi-repo closure tasks now.
- Move the active direction to a larger shared brain vertical.

Consumer:

- Source usefulness readback.
- Future shared brain vertical task.
- Future activation/source usefulness analysis.

Falsifier:

- A future run shows this SourceClaim was not actually used by the Codex brief
  path, or source-usefulness feedback is not readable through the normal run
  readback surface.

Does not prove:

- Target correctness.
- Source truth beyond the README snapshot.
- Ranking quality at scale.
- Codex execution.
- Product readiness.
- Source truth promotion.
- Eval promotion.
- Memory Core mutation.

## Next Direction

Stop extending the multi-repo proof surface with tiny closures.

Next Beads task:

```txt
mise-en-palace-rkx: Build end-to-end brain vertical over one retained pattern.
```

The next work should move a retained pattern or source claim through a larger
brain vertical:

```txt
source/pattern -> selected knowledge -> Codex brief -> evidence/review
-> candidate or rejection -> next-run reuse or explicit abstention
```

