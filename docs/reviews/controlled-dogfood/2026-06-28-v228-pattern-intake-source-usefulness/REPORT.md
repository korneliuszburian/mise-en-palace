# V228 Pattern Intake Source Usefulness Dogfood

Status: controlled dogfood report.

## Objective

Use one retained pattern source in a real KRN decision and record whether it
helped through the new source usefulness outcome producer.

This is not a research archive and not a source crawler.

## Selected Source

source_id: `total-typescript-unions-narrowing`

Source:
- `docs/KRN_SOURCES.md#unions-literals-and-narrowing`

Mechanism:
- Literal unions and narrowing constrain finite states and valid transitions.

KRN implication:
- Source usefulness outcomes should be represented as a finite domain state, not
  as free-form strings in CLI/readback behavior.

Decision:
- Use a narrow `SourceUsefulnessOutcome` union and a parser guard for
  `--source-usefulness` input.

Consumer:
- `packages/core/src/feedbackDelta.ts`
- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runRunShowCommand.ts`

Falsifier:
- A future source usefulness outcome accepts arbitrary labels without narrowing,
  or readback treats malformed source usefulness metadata as trusted evidence.

Does not prove:
- The source selector will pick this guidance automatically.
- Every KRN domain state needs a new union.
- The Total TypeScript source is sufficient for product readiness.

## Application

V226 created the readback surface:
- `SourceUsefulnessOutcome`
- `SourceUsefulnessOutcomeFeedback`
- `sourceUsefulnessOutcomesFromMetadata`

V227 created the producer:
- `krn evidence capture --source-usefulness`

The selected source helped by keeping the outcome vocabulary finite:

```txt
selected | used | helped | neutral | noise | stale | unknown
```

That finite vocabulary is now validated in parser tests and read back as typed
JSON/text.

## Source Usefulness Outcome

```yaml
sourceClaimId: total-typescript-unions-narrowing
outcome: helped
reason: The source directly shaped the finite SourceUsefulnessOutcome union and parser guard.
evidenceRefs:
  - packages/core/src/feedbackDelta.ts
  - packages/cli/src/parseEvidenceArgs.ts
  - packages/cli/src/parseEvidenceArgs.test.ts
doesNotProve: This outcome does not prove future source selector quality or that every source-related field needs a union.
```

## Evidence Capture Command

Command run after this report existed:

```sh
pnpm --filter @krn/cli krn evidence capture \
  --intended-file docs/reviews/controlled-dogfood/2026-06-28-v228-pattern-intake-source-usefulness/REPORT.md \
  --source-usefulness "claim:total-typescript-unions-narrowing=helped|The source directly shaped the finite SourceUsefulnessOutcome union and parser guard|packages/core/src/feedbackDelta.ts,packages/cli/src/parseEvidenceArgs.ts,packages/cli/src/parseEvidenceArgs.test.ts|This outcome does not prove future source selector quality or that every source-related field needs a union" \
  --verification "pnpm --filter @krn/cli test -- parseEvidenceArgs runCli runEvidenceCaptureCommand=passed" \
  --verification "pnpm --filter @krn/core test -- reviewFeedback=passed" \
  --verification "pnpm run typecheck=passed" \
  --verification "TMPDIR=/home/krn/.cache/krn-tmp pnpm test=passed" \
  --verification "git diff --check=passed"
```

Result:
- passed.
- persistence: disabled preview.
- dirty context: none detected from intended-file classification.
- command evidence: five operator-reported passed rows.
- memory mutation: none.
- source usefulness output:

```txt
outcome=helped
sourceClaim=total-typescript-unions-narrowing
reason=The source directly shaped the finite SourceUsefulnessOutcome union and parser guard
evidenceRefs:
  - packages/core/src/feedbackDelta.ts
  - packages/cli/src/parseEvidenceArgs.ts
  - packages/cli/src/parseEvidenceArgs.test.ts
doesNotProve=This outcome does not prove future source selector quality or that every source-related field needs a union
```

## Verdict

Source usefulness:
- helped.

Why:
- The source constrained implementation toward narrow states and explicit
  narrowing instead of decorative source metadata.

What remains:
- The next step should use persisted evidence/readback for one source
  usefulness outcome, not just preview/report evidence.
