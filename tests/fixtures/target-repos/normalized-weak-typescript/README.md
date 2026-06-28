# Normalized Weak TypeScript Fixture

Small controlled target repo for KRN product-readiness trials.

It exists to answer:

```txt
Can KRN apply best-pattern pressure to weak target code in a repeatable,
resettable, evidence-capturable way?
```

This is not second-operator proof and not a benchmark platform.

## Baseline And Current State

V252 created this fixture with intentionally weak but small code:

- untrusted JSON parsing;
- loose input typing;
- environment values trusted as domain values;
- mixed persistence/domain behavior;
- invalid states represented by `null`;
- incomplete invalid-input tests.

V253 repaired the JSON/input/result boundary in place. The next substrate
hardening step should make the weak baseline reproducible without relying on
git history.

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

Passing the test proves only the current fixture contract. It does not prove
KRN product readiness or real target transfer.
