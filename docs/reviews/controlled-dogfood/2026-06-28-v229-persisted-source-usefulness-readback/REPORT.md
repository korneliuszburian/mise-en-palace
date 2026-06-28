# V229 Persisted Source Usefulness Readback Dogfood

Status: complete.

## Objective

Prove that source usefulness outcome feedback can be captured through the
DB-backed evidence path and read back through `krn run show`.

## Persisted Run

executionRun:
- `dc0b4621-236d-4455-8361-752c0e3b8fcc`

Task:
- `V229 prove persisted source usefulness outcome feedback readback for pattern-intake source`

DB readiness:
- local Postgres reachable;
- migrations applied: 14/14;
- pgvector available.

Plan result:
- context included: 0;
- context excluded: 0;
- activation status: abstained.

Interpretation:
- This run tests persistence/readback of source usefulness feedback, not
  activation quality.

## Source Usefulness Payload

```yaml
sourceClaimId: total-typescript-unions-narrowing
outcome: helped
reason: The source directly shaped the finite SourceUsefulnessOutcome union and parser guard.
evidenceRefs:
  - packages/core/src/feedbackDelta.ts
  - packages/cli/src/parseEvidenceArgs.ts
  - packages/cli/src/parseEvidenceArgs.test.ts
doesNotProve: This persisted outcome does not prove future source selector quality or that every source-related field needs a union.
```

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | Local Postgres was reachable with 14/14 migrations and pgvector. | Product readiness or source selector quality. |
| `KRN_DATABASE_URL=... krn plan --persist` | passed | A persisted execution run was created for V229. | Activation quality; activation abstained. |
| `KRN_DATABASE_URL=... krn evidence capture --persist --source-usefulness ...` | passed | Source usefulness outcome feedback persisted through `FeedbackDelta.metadata`. | That the source selector chose the source automatically. |
| `KRN_DATABASE_URL=... krn run show --run-id ...` | passed | Text readback displays the persisted source usefulness outcome. | Command execution or Memory Core mutation. |
| `KRN_DATABASE_URL=... krn run show --run-id ... --json` | passed | Typed JSON readback includes `feedbackDeltas[].sourceUsefulnessOutcomes`. | That source truth was mutated or that the source is universally useful. |

One attempted command used the wrong run-show syntax:

```txt
krn run show --run-id <id> --format json
```

Result:
- rejected with usage text.

Correct syntax:

```txt
krn run show --run-id <id> --json
```

## Readback Evidence

Persisted IDs:
- evidenceBundle: `0c9a62c1-5051-44fa-855b-ea937eed813b`
- reviewAssessment: `e5450ec4-a1a3-4d71-a5dc-2815fb575752`
- feedbackDelta: `e4f58b44-efb3-450e-9e22-dd4a182f6fb2`

Text readback showed:

```txt
source usefulness outcomes:
- outcome=helped sourceClaim=total-typescript-unions-narrowing sourceDecision=none
```

JSON readback showed:

```json
"sourceUsefulnessOutcomes": [
  {
    "sourceClaimId": "total-typescript-unions-narrowing",
    "outcome": "helped",
    "reason": "The source directly shaped the finite SourceUsefulnessOutcome union and parser guard"
  }
]
```

## Finding

When `krn evidence capture` is invoked through:

```txt
pnpm --filter @krn/cli krn ...
```

the persisted changed file path used package-relative parent traversal:

```txt
../../docs/reviews/controlled-dogfood/2026-06-28-v229-persisted-source-usefulness-readback/
```

Classification still matched the intended file, but readback is less clean than
repo-root-relative evidence.

Implication:
- next repair should normalize evidence changed-file readback to repo-root
  paths even when the CLI process cwd is a package directory.

Non-proof:
- this does not invalidate source usefulness persistence/readback.
