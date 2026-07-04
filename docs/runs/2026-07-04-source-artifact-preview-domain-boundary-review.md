# Source Artifact Preview Domain Boundary Review

## Slice

Bead: `mise-en-palace-q4ym`

## Decision

Reject further extraction for this slice. The reusable pure extraction boundary
is already in `@krn/core`.

## Evidence

Current ownership:

- `packages/core/src/sourceArtifactPreviewExtraction.ts`: pure chunk/extraction
  domain logic, exported from `@krn/core`;
- `packages/cli/src/runSourceArtifactPreviewCommand.ts`: 144-line command
  runner owning file resolution, file read, orchestration, and final output
  dispatch;
- `packages/cli/src/sourceArtifactPreviewPersistence.ts`: CLI persistence and
  DB readback boundary;
- `packages/cli/src/sourceArtifactPreviewView.ts`: CLI view/readback formatting;
- `packages/harness/src/goldenKrnBehaviorGate.ts`: imports and executes the core
  extraction path in deterministic behavior proof.

Current consumers prove the extraction is not trapped inside the CLI:

```txt
packages/cli/src/runSourceArtifactPreviewCommand.ts imports buildSourceArtifactPreviewChunks from @krn/core
packages/cli/src/sourceArtifactPreviewPersistence.ts imports extractLocalSourceCandidates from @krn/core
packages/cli/src/sourceArtifactPreviewView.ts imports extractLocalSourceCandidates from @krn/core
packages/harness/src/goldenKrnBehaviorGate.ts imports buildSourceArtifactPreviewChunks and extractLocalSourceCandidates from @krn/core
```

Size evidence:

```txt
144  packages/cli/src/runSourceArtifactPreviewCommand.ts
1168 packages/cli/src/sourceArtifactPreviewView.ts
897  packages/cli/src/sourceArtifactPreviewPersistence.ts
434  packages/core/src/sourceArtifactPreviewExtraction.ts
```

Prior slice `mise-en-palace-wgei` already moved persistence/readback/JSON helper
logic out of the command runner and recorded the before/after boundary in
`docs/runs/2026-07-03-source-artifact-preview-boundary-split.md`.

## Rejection

Moving `sourceArtifactPreviewView.ts` into `@krn/core` would mix CLI rendering
with domain contracts. Moving `sourceArtifactPreviewPersistence.ts` into
`@krn/core` would mix DB command-runtime concerns into the domain package.

No new `@krn/source` package is justified by current consumers. The existing
core extraction module is the right reusable boundary.

## Proof

```txt
git diff --check
```

## Non-Proof

This review does not prove extraction quality at scale, crawler readiness,
source truth, graph retrieval quality, or DB persistence behavior. It proves only
that this Bead's requested extraction target is already satisfied and further
movement would be architecture churn.

## Rollback Risk

Low. Documentation/Beads closure only; no runtime code changed.
