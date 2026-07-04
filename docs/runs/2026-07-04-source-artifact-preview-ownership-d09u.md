# Source Artifact Preview Ownership Decision

Bead: `mise-en-palace-d09u`

## Decision

Reject further extraction for this slice. The reusable source-domain extraction
boundary already lives in `@krn/core`; moving the remaining CLI files would mix
operator readback, DB persistence, and command-runtime concerns into the domain
package.

## Evidence

Current ownership:

- `packages/core/src/sourceArtifactPreviewExtraction.ts`: pure chunking,
  deterministic local candidate extraction, and reusable source-domain helpers;
- `packages/cli/src/runSourceArtifactPreviewCommand.ts`: small command runner
  owning file resolution, file reading, orchestration, and output dispatch;
- `packages/cli/src/sourceArtifactPreviewView.ts`: CLI view/readback formatting
  and operator-facing candidate presentation;
- `packages/cli/src/sourceArtifactPreviewPersistence.ts`: DB runtime,
  persistence, and readback mapping for `--persist`;
- `packages/harness/src/goldenKrnBehaviorGate.ts`: imports and executes the core
  extraction path for deterministic behavior proof.

Current consumer evidence:

```txt
packages/cli/src/runSourceArtifactPreviewCommand.ts imports buildSourceArtifactPreviewChunks from @krn/core
packages/cli/src/sourceArtifactPreviewPersistence.ts imports SourceArtifactPreviewChunk from @krn/core
packages/cli/src/sourceArtifactPreviewView.ts imports extractLocalSourceCandidates from @krn/core
packages/harness/src/goldenKrnBehaviorGate.ts imports buildSourceArtifactPreviewChunks and extractLocalSourceCandidates from @krn/core
packages/core/src/index.ts exports sourceArtifactPreviewExtraction
```

Size evidence:

```txt
144 packages/cli/src/runSourceArtifactPreviewCommand.ts
434 packages/core/src/sourceArtifactPreviewExtraction.ts
897 packages/cli/src/sourceArtifactPreviewPersistence.ts
```

The earlier boundary report
`docs/runs/2026-07-04-source-artifact-preview-domain-boundary-review.md`
already reached the same conclusion for `mise-en-palace-q4ym`; current code
still matches that boundary.

## Rejection

Do not move `sourceArtifactPreviewView.ts` into `@krn/core`: it formats
operator-facing CLI readback and candidate presentation.

Do not move `sourceArtifactPreviewPersistence.ts` into `@krn/core`: it owns DB
runtime wiring, persistence, and readback mapping for a CLI command.

Do not create a new `@krn/source` package for this slice. Current reusable
source-domain logic is already importable from `@krn/core`, and no additional
consumer proves a new package boundary would reduce complexity.

## Verification

```txt
pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand parseSourceArgs

Test Files 58 passed
Tests 374 passed
```

## Proof Boundary

Proves:

- source artifact preview extraction is not trapped in CLI-only code;
- remaining CLI files have command/readback/persistence ownership rather than
  pure source-domain ownership;
- further extraction would be architecture churn without a new consumer.

Does not prove:

- source truth;
- extraction quality at scale;
- crawler readiness;
- graph retrieval quality;
- DB persistence behavior beyond the focused existing tests;
- that a future `@krn/source` package will never be justified.

## Rollback Risk

Low. Documentation/Beads closure only; no runtime code changed.
