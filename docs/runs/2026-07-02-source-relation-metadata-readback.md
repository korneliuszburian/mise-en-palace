# Source Relation Metadata Readback

Date: 2026-07-02

## Summary

Typed the source-relation metadata readback boundary without changing DB schema.

The audit claim was accurate in a bounded form: source-relation metadata writes
already have runtime governance for `consumer` and `doesNotProve`, but CLI and
worker readbacks were still parsing known `SourceClaimEdge.metadata` keys through
local ad hoc helpers. This slice moved that readback into the core source domain
and reused it from CLI and worker surfaces.

## Changed

- Added `readSourceRelationMetadataReadback` in `@krn/core/source`.
- The helper:
  - trims known string values;
  - drops blank and non-string values;
  - merges singular `evidenceRef` with plural `evidenceRefs`;
  - de-duplicates evidence refs and source ranges;
  - exposes `missingProofBoundaryFields` for `consumer` / `doesNotProve`;
  - does not pass through unrelated metadata keys.
- `krn source search --json` now uses the source-domain helper for
  `SourceClaimEdge` relation support.
- `krn source claim edges` now uses the same helper for text readback.
- Source-relation heartbeat preview now parses relation metadata once and uses
  the same `evidenceRef` / `evidenceRefs` semantics.

## Source To Decision

```yaml
source_id: repo-local-source-relation-metadata-audit
source: Beads issue mise-en-palace-58l0 plus read-only subagent inspection of CLI, workers, and DB source repositories
mechanism: SourceClaimEdge writes already require consumer/doesNotProve, but readback surfaces duplicated local string/list extraction with inconsistent blank and mixed-list behavior.
krn_implication: source relation review candidates and graph readbacks should expose the same source-domain proof boundary instead of each consumer interpreting metadata keys differently.
decision_kind: adopt
decision: add a source-domain metadata readback helper and replace CLI/worker local SourceClaimEdge metadata parsing; do not change DB schema.
consumer: source search JSON readback, source claim edge text readback, source relation heartbeat preview
falsifier: a SourceClaimEdge with blank consumer/doesNotProve or mixed evidence/sourceRanges is rendered inconsistently across CLI and worker readbacks.
```

## Proof

- `rtk pnpm --filter @krn/core test -- source.test.ts -t "source relation metadata"`
- `rtk pnpm --filter @krn/cli test -- runSourceSearchCommand.test.ts -t "SourceClaimEdge relation"`
- `rtk pnpm --filter @krn/cli test -- runSourceClaimEdgesCommand.test.ts`
- `rtk pnpm --filter @krn/workers test -- sourceRelationHeartbeatPreview.test.ts`
- `rtk pnpm -C packages/core typecheck`
- `rtk pnpm -C packages/cli typecheck`
- `rtk pnpm -C packages/workers typecheck`
- `rtk git diff --check`

## Non-Proof

- This does not add DB constraints or migrations.
- This does not define a broad metadata taxonomy.
- This does not change source ranking, graph scoring, or source truth.
- This does not parse `SourceDecisionEdge.metadata`; that remains a separate
  decision-edge surface.
- This does not hard-brand IDs or change persisted schema shape.

## Second-Opinion Prompt

Review the current diff after
`docs/runs/2026-07-02-source-relation-metadata-readback.md`.

Act as a ruthless senior reviewer. Inspect whether
`readSourceRelationMetadataReadback` belongs in `@krn/core/source` or whether it
is another premature public helper. Verify that it trims and filters known
`SourceClaimEdge.metadata` keys consistently, merges `evidenceRef` and
`evidenceRefs` without turning metadata into source truth, and exposes missing
proof-boundary fields without forcing DB schema changes. Check the CLI source
search JSON readback, source claim edge text readback, and worker source
relation preview for accidental behavior changes, over-broad imports, duplicated
remaining helpers, and misleading proof language. Challenge whether
`SourceDecisionEdge.metadata` needs a separate helper now or should stay out of
scope. Propose the next bounded slice with exact files, risks, verification
commands, and non-goals.
