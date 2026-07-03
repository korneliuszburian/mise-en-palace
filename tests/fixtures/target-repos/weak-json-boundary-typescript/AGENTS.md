# Weak JSON Boundary TypeScript Target

This is a KRN-owned controlled target substrate.

Use it to test whether KRN can force better engineering behavior on weak code
without touching a living external repository.

## Mode

Default mode:

```txt
headless-repair inside this fixture only
```

Allowed writes:

- `src/**`
- `tests/**`
- `docs/**`

Forbidden writes:

- parent KRN package source;
- generated runtime caches;
- unrelated target repos;
- network calls;
- secrets.

Rollback:

```sh
git restore tests/fixtures/target-repos/weak-json-boundary-typescript
```

## Owner Files

Use these owner files for KRN target planning:

- `AGENTS.md|repo|operator_rules|fixture write authority and rollback`
- `docs/repair-contract.md|docs|repair_contract|expected best-pattern pressure`
- `src/config.ts|src|io_boundary|unsafe external input parsing`
- `src/userService.ts|src|domain_boundary|mixed IO/domain logic and weak result model`
- `tests/userService.test.ts|tests|behavior_proof|missing invalid-input coverage`

## Target Weaknesses

V252 baseline intentionally contained:

- unsafe `JSON.parse`;
- `any` at an input boundary;
- trusted environment strings;
- mixed IO/domain concerns;
- boolean/null failure state instead of a typed result;
- incomplete invalid-input tests;
- weak proof/non-proof reporting.

V253 repaired the JSON/input/result boundary. Future substrate work should make
the weak baseline reproducible through a generator or baseline/expected variant
instead of relying on git history.

Do not treat baseline weakness as KRN source quality.
