# Source Claim Add Project Resolution

## Slice

Bead: `mise-en-palace-1ex4`

Bug found during `mise-en-palace-fhku`: `krn source claim add --persist` wrote
accepted SourceClaims to the default workspace/project slug, while source search
and brain search resolved the connected repository project through `repoPathHint`.
The claims were persisted correctly, but they were invisible to the source-search
readback used as the dogfood proof.

## Change

`runSourceClaimAddCommand` now passes `repoPathHint` from the current repo root
into `createDatabaseRuntime`, matching the source search and source artifact
preview persistence paths.

`runSourceCliCommand` now forwards `cwd` into the source-claim add runner so the
repo root can be resolved at the command boundary.

## Proof

Focused regression:

```txt
pnpm --filter @krn/cli test -- source
58 files passed, 370 tests passed
```

Static proof:

```txt
pnpm typecheck
git diff --check
```

The source-claim add persistence test now captures the `DatabaseRuntimeInput`
and asserts `repoPathHint` is populated with the current repo path before the
mock repository writes are allowed.

## Non-Proof

This does not prove source truth, ranking quality, DB migration behavior, or
multi-repo product readiness. It only proves the CLI write path now gives the DB
runtime the same repository hint used by the read/search paths.

## Rollback Risk

Low. Runtime behavior becomes stricter by allowing the existing connected-repo
project resolver to win before falling back to default project creation.
