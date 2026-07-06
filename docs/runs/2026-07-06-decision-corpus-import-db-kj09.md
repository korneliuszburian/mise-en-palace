# Decision Corpus Import DB Smoke

Bead: `mise-en-palace-kj09`

## Change

Added a bounded DB-backed dogfood path for compact source-to-decision corpus
imports.

The existing fixture importer still validates compact import rows and converts
them into decision-packet corpus rows. The new DB smoke persists the same rows
through existing brain-store repository ports:

- `SourceArtifact`
- `SourceChunk`
- `SourceClaim`
- `SourceDecision`
- `SourceDecisionEdge`
- `SearchDocument`
- `SourceRejection`

It then runs source search against the imported task and requires the governing
current decision's `SourceClaim` to be selected.

## Proof

Proves:

- compact source-to-decision import rows can enter the Postgres-backed source
  and retrieval stores without a new schema or parallel import model;
- current and stale import rows go through `SourceDecision(status=adopt)`;
- rejected import rows go through `SourceDecision(status=reject)` plus
  `SourceRejection`;
- duplicate ids and missing case decision links fail before persistence;
- stale import rows get an invalidated `SearchDocument`;
- the current governing row has a decision edge and active search document that
  source search can read back.

Does not prove:

- source truth;
- live Codex obedience;
- arbitrary corpus quality;
- broad ranking quality;
- product readiness.

## Verification

Focused local checks:

```sh
pnpm --filter @krn/cli test -- decisionCorpusImport db
pnpm --filter @krn/cli typecheck:tests:clean
```

DB runtime check:

```sh
pnpm db:smoke:decision-corpus-import
```
