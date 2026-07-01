# SBV-03 Pattern Usefulness Bridge Report

Status: DB-backed source repair report, not product-readiness proof.

Date: 2026-07-01
Execution run: `6fff27ff-a35b-40d1-8d42-f60df190b541`
Evidence bundle: `63df1502-6647-40c1-9f4f-7571008e9357`
Review assessment: `c5437239-14f2-413e-b062-342615e3e783`
Feedback delta: `34e100e1-8289-4dc3-a348-5f69f25ace77`

## Executive Verdict

SBV-03 added the smallest useful bridge for retained pattern usefulness: `krn evidence capture` now accepts `--pattern-usefulness`, persists it as `FeedbackDelta.metadata.patternUsefulnessOutcomes`, and `krn run show` renders it in text and JSON. This closes the SBV-02 gap for post-run usefulness readback without pretending retained patterns are SourceClaims.

## What Changed

- Added `PatternUsefulnessOutcomeFeedback` and `patternUsefulnessOutcomesFromMetadata`.
- Added repeatable CLI input:
  `--pattern-usefulness "pattern:<id>=outcome|reason|evidence-ref[,ref]|doesNotProve"`.
- Persisted pattern usefulness in existing feedback metadata; no DB schema change.
- Rendered pattern usefulness in evidence capture output and run readback text/JSON.
- Added parser, CLI, persistence, and run-readback tests.

## Pattern Gate

Selected pattern:

```txt
pattern:ts-boundary-unknown-first-result-state
```

Outcome:

```txt
helped
```

Reason:

```txt
Unknown-first retained pattern justified a separate parsed pattern-usefulness outcome instead of overloading SourceClaim feedback.
```

Does not prove:

```txt
Future pattern recall, pattern ranking quality, or TypeScript quality outside this slice.
```

## DB Readback Proof

`krn evidence capture --persist` recorded:

```txt
patternUsefulnessOutcomes:
- outcome=helped pattern=ts-boundary-unknown-first-result-state
```

`krn run show` text readback rendered:

```txt
pattern usefulness outcomes:
- outcome=helped pattern=ts-boundary-unknown-first-result-state
```

`krn run show --json` rendered:

```txt
feedbackDeltas[].patternUsefulnessOutcomes[].patternId
```

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- parseEvidenceArgs runCli runRunShowCommand` | passed | Parser, evidence output, persistence capture, and run readback tests cover the new surface. | Full product readiness or future selector quality. |
| `pnpm run typecheck` | passed | Public TypeScript types compose across workspace packages. | Runtime correctness beyond typed surfaces. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Existing test suite still passes after the bridge. | Memory quality, source truth, or production readiness. |
| `pnpm quality:fallow:ci` | passed | Fallow found no changed-file issues. | Fallow is not semantic proof of architecture quality. |
| `git diff --check` | passed | Diff has no whitespace errors. | Behavior correctness. |
| `pnpm db:ready` | passed | Local Postgres, migrations, and pgvector are ready in this shell. | CI or remote DB state. |
| `krn observe --run ... --persist` | passed | Observation persisted without Memory Core mutation. | Reflection quality or memory usefulness. |
| `krn reflect --scope run:... --persist` | passed | Reflection record persisted without Memory Core mutation. | Candidate quality or autonomous learning. |

## What This Proves

- Retained pattern usefulness can be recorded separately from source usefulness.
- The bridge uses existing feedback metadata; no schema or product surface expansion was needed.
- DB-backed text and JSON run readback expose the retained pattern outcome without SQL.
- Source usefulness remains reserved for real SourceClaims/SourceDecisions.

## What This Does Not Prove

- `krn plan` can reliably select the exact retained pattern before implementation.
- Pattern ranking or recall quality is good.
- SourceClaims are true.
- Memory Core mutated.
- KRN is product-ready.

## Brain Usefulness

Verdict: positive, bounded.

KRN helped by preserving the SBV-02 finding and forcing a non-fake bridge: pattern usefulness is now its own evidence lane, not a SourceClaim abuse. Activation selected useful owner-file/source guardrails, but still did not select the exact retained pattern ID. That should become the next bounded repair only if we want pre-coding pattern application to be first-class in persisted planning.

## Next Candidate

Repair candidate:

```txt
SBV-04: Surface selected retained pattern IDs in persisted plan/brief context.
```

Why:

```txt
SBV-03 can persist post-run pattern usefulness, but the persisted plan still selected owner files and general source claims rather than the exact retained pattern packet.
```

Non-goals:

```txt
no DB schema, no ranking rewrite, no dashboard, no API/MCP, no crawler, no Memory Core mutation
```

Verification:

```txt
krn plan --persist
krn codex brief --run-id <id>
krn evidence capture --pattern-usefulness ... --persist
krn run show --run-id <id> --json
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```
