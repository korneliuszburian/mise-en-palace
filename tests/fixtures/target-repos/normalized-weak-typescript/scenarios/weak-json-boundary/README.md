# Weak JSON Boundary Scenario

This scenario recreates the V252 weak baseline after V253 repaired the committed
fixture.

It exists so future KRN target trials can start from a known weak state without
relying on git history.

## Expected Weaknesses

- `parseJsonConfig(raw): any`
- unchecked `JSON.parse` result reaches domain logic;
- `CreatedUser | null` hides failure reason;
- invalid JSON/missing email/invalid role are not covered by runtime tests.

## Smoke

```sh
node tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs \
  weak-json-boundary \
  .local-lab/target-substrates/normalized-weak-typescript-weak-json-boundary

pnpm --dir .local-lab/target-substrates/normalized-weak-typescript-weak-json-boundary test
```

Passing the smoke proves only that the weak baseline is reproducible and
compilable. It does not prove the baseline is good code.
