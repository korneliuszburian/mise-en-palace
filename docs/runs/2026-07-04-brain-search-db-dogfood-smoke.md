# Brain Search DB Dogfood Smoke

Bead: `mise-en-palace-ezbm`

## Change

Added `krn db smoke brain-search` and root script
`pnpm db:smoke:brain-search`.

The smoke proves a fixed DB-backed path:

1. Create or reuse an isolated smoke project.
2. Run `runBrainSearchCommand` with `--store-only` before seeding source rows.
3. Seed a smoke-scoped `SourceArtifact`, proposed `SourceClaim`, adopting
   `SourceDecision`, `SourceDecisionEdge`, and `SearchDocument`.
4. Run the same `runBrainSearchCommand` path again. The live delegation is
   `runBrainSearchCommand` -> `runSourceSearchCommand` in
   `packages/cli/src/runBrainSearchCommand.ts`.
5. Assert the baseline did not select the smoke SourceClaim.
6. Assert the grounded run selects the smoke SourceClaim and exposes linked
   SearchDocument plus SourceDecision support.
7. Clean up smoke-scoped rows.

## Evidence

```txt
pnpm db:smoke:brain-search

Baseline smoke SourceClaim selected: no
Baseline selectedKnowledge: 0
Baseline supporting claims: 0
Baseline supporting documents: 0
Baseline source decision support: 0
Grounded smoke SourceClaim selected: yes
Grounded selectedKnowledge: 1
Grounded supporting claims: 1
Grounded linked search documents: 1
Grounded source decision support: 1
Cleanup remaining marker count: 0
Brain search smoke: passed
```

Additional verification:

```txt
pnpm --filter @krn/cli test -- parseDbArgs db runBrainSearchCommand
pnpm --filter @krn/harness test -- behaviorGateMatrixInvariants
pnpm typecheck
```

CI now runs `pnpm db:smoke:brain-search` in the DB readiness/smoke lane.

## Proof Boundary

Proves:

- one isolated DB-backed brain/source readback path can move from a weak
  no-evidence baseline to source-backed selectedKnowledge;
- the useful selectedKnowledge is backed by an accepted SourceClaim,
  SourceDecisionEdge support, and linked SearchDocument readback;
- the smoke cleans its own marker-scoped rows.

Does not prove:

- broad ranking quality;
- that source-search `supportingDocuments` must be non-zero; this smoke gates on
  linked SearchDocument readback instead;
- `supportingDocuments` counts are observational readback only and are not
  gates;
- source truth;
- semantic/vector search quality;
- retained-pattern usefulness feedback;
- Codex output correctness;
- product readiness.

## Rollback Risk

Medium-low. The slice adds a DB smoke command, CI step, and readback helper. It
does not add a migration or public operator workflow. Rollback removes the smoke
target, script, CI step, behavior-matrix row, and helper.
