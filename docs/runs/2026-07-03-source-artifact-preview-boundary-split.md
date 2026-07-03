# Source Artifact Preview Boundary Split

Date: 2026-07-03.

Beads: `mise-en-palace-wgei`.

## Change

`runSourceArtifactPreviewCommand.ts` no longer owns DB persistence/readback,
SourceArtifact/SourceChunk/SearchDocument writes, optional SourceClaim and
SourceClaimEdge writes, ingest-loop readback shaping, JSON readback shaping, or
artifact hash helper logic.

Those boundaries moved to `sourceArtifactPreviewPersistence.ts`. The command
runner now owns file resolution, local file read, chunk construction, optional
persistence call, and final text/JSON response dispatch.

Size change before staging:

```txt
runSourceArtifactPreviewCommand.ts: 35.6 KB -> 4.8 KB
sourceArtifactPreviewPersistence.ts: 31.4 KB
sourceArtifactPreviewView.ts: unchanged
```

## Source-To-Decision

source: current source artifact preview command implementation and `wc -c`
evidence.

mechanism: the command mixed shell-facing file preview orchestration with
Postgres writes, readbacks, optional claim/edge creation, and JSON proof output.

KRN implication: source artifact preview is a real ingest/readback loop; its DB
mutation/readback boundary should be isolated from command orchestration before
future source or crawler decisions.

decision: extract persistence/readback/JSON helper logic into one local module,
without adding a new package, crawler, or source graph platform.

consumer: `runSourceArtifactPreviewCommand.ts`, heartbeat acquisition readback,
source artifact preview CLI tests.

falsifier: text/JSON output changes, optional persist behavior regresses, source
claim/edge readback disappears, or strict CLI test typecheck fails.

## Verification

```txt
pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand
pnpm -C packages/cli typecheck
pnpm --filter @krn/cli typecheck:tests:clean
pnpm -w typecheck
pnpm quality:fallow:ci
git diff --check
```

All passed locally.

## Proof Boundary

Proves: the source artifact preview runner is now orchestration-focused and the
existing command contract still passes current CLI tests and strict typecheck.

Does not prove: source truth, crawler readiness, graph retrieval quality,
embeddings, product readiness, or DB smoke behavior.
