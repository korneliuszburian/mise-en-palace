# Pattern Usefulness Evidence Gate

Bead: `mise-en-palace-6bdg`

## Change

Extended the evidence-capture golden behavior fixture so retained pattern
usefulness must remain evidence-linked before it can appear as helped feedback.

The new deterministic case runs real `krn evidence capture` with
`--pattern-usefulness` and requires visible:

- retained pattern id;
- `helped` outcome;
- reason;
- evidence ref;
- `doesNotProve` boundary.

This complements the existing persisted evidence tests that downgrade stale
pattern usefulness evidence refs to `unknown`.

## Evidence

```txt
pnpm --filter @krn/cli test -- evidenceCaptureGoldenBehavior

Test Files 58 passed
Tests 374 passed
```

Existing focused persistence coverage:

```txt
packages/cli/src/__tests__/evidence.test.ts
- persists evidence capture for a run id
- downgrades persisted pattern usefulness when evidence refs do not match current evidence
```

## Proof Boundary

Proves:

- retained pattern usefulness readback cannot silently drop the pattern id,
  outcome, reason, evidence ref, or non-proof boundary in the active behavior
  smoke;
- stale persisted pattern usefulness proof refs are already downgraded to
  `unknown` by focused evidence tests.

Does not prove:

- automatic pattern learning;
- broad retained-pattern recall quality;
- semantic ranking quality;
- that a helped outcome should mutate Memory Core;
- product readiness.

## Rollback Risk

Low. The slice adds one golden behavior case and a behavior-matrix row. It does
not change DB schema, runtime persistence, or public CLI syntax.
