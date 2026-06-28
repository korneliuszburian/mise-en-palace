# V254 Replayable Target Substrate Baseline

Status: replayable baseline added.

Date: 2026-06-28
Evaluator: Codex

## Executive Verdict

V254 made the normalized target substrate replayable without relying on git
history. The committed fixture remains in its V253 repaired state, while the
weak V252-style baseline can now be materialized into `.local-lab` through a
small scenario overlay.

This moves KRN one step closer to repeatable brain trials: future runs can
start from known weak code, apply best-pattern pressure, and compare against the
repaired state without touching living target repos.

## Added Replay Path

Scenario:

```txt
tests/fixtures/target-repos/normalized-weak-typescript/scenarios/weak-json-boundary/
```

Materializer:

```txt
tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs
```

Smoke:

```sh
node tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs \
  weak-json-boundary \
  .local-lab/target-substrates/normalized-weak-typescript-weak-json-boundary

pnpm --dir .local-lab/target-substrates/normalized-weak-typescript-weak-json-boundary test
```

## What Is Replayable Now

The weak baseline overlay restores:

- `parseJsonConfig(raw): any`;
- unchecked parsed JSON reaching domain logic;
- `CreatedUser | null`;
- missing invalid-input runtime tests.

The committed fixture keeps:

- `parseJsonConfig(raw): unknown`;
- local input guard;
- `CreateUserResult` discriminated union;
- runtime invalid JSON / missing email / invalid role tests.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `node .../materialize-scenario.mjs weak-json-boundary .local-lab/...` | passed | Weak baseline can be recreated from committed files. | The repaired state is product-ready. |
| `pnpm --dir .local-lab/target-substrates/normalized-weak-typescript-weak-json-boundary test` | passed | Materialized weak baseline is compilable/runnable under its own test command. | Weak baseline is good code. |
| `rg "parseJsonConfig\\(raw: string\\): any|CreatedUser \\| null" .local-lab .../scenarios/weak-json-boundary` | passed | Baseline overlay and materialized target contain the intended weak markers. | Every weakness is represented. |
| `rg "\bany\b|CreatedUser \| null|as unknown as|@ts-ignore" .../src .../tests` | no matches | Committed repaired fixture source/tests do not retain the V253-targeted smells. | Full target code quality. |

## What This Proves

- The target substrate has both a repaired current state and a replayable weak
  baseline.
- Future target trials can start from a controlled weak state without git
  archaeology.
- Replay is a small fixture mechanism, not a broad benchmark platform.

## What This Does Not Prove

- Product readiness.
- Real target repo transfer.
- Second-operator usability.
- Benchmark superiority over BM25/vector/GraphRAG.
- UI/search readiness.

## Condensation Finding

The active root `PLANS.md` has become too large to be a practical active
context surface. Future work should preserve detailed history in reports and
archives while keeping active plan files as compact current-state indexes.

This aligns with the operator rule added during V254:

```txt
Clean PROGRESS/PLAN-style active surfaces instead of endlessly appending text.
```

## Next Recommended Action

Open V255:

```txt
Condense PLANS.md active ledger.
```

Goal:

Archive historical V48..V254 details and replace root `PLANS.md` with a compact
active ledger that still preserves:

- current active stream/task;
- latest proof state;
- product readiness status;
- next 3-5 bounded tasks;
- links to archived detailed reports.

Do not delete evidence. Move old detail out of active context.
