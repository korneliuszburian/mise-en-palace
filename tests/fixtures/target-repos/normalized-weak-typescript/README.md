# Normalized Weak TypeScript Fixture

Small controlled target repo for KRN product-readiness trials.

It exists to answer:

```txt
Can KRN apply best-pattern pressure to weak target code in a repeatable,
resettable, evidence-capturable way?
```

This is not second-operator proof and not a benchmark platform.

## Baseline

The fixture is intentionally weak but small:

- untrusted JSON parsing;
- loose input typing;
- environment values trusted as domain values;
- mixed persistence/domain behavior;
- invalid states represented by `null`;
- incomplete invalid-input tests.

## Expected Repair Direction

The first KRN repair should prefer:

- unknown-first external input handling;
- a local parser or schema boundary;
- narrow unions for success/error result states;
- explicit proof/non-proof notes;
- focused tests for invalid input;
- minimal final-pattern code.

## Verification

```sh
pnpm test
```

The baseline test is intentionally insufficient. Passing it does not prove the
fixture is repaired.
