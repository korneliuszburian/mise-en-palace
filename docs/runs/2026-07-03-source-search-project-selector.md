# Source Search Project Selector

Date: 2026-07-03
Bead: `mise-en-palace-543l`

## Objective

Let `krn source search` inspect a specific project by ID so operator-facing
source readback is not limited to the default runtime project.

## What Changed

Added `--project <project-id>` to `krn source search`.

The command now passes the explicit project ID into `createDatabaseRuntime`.
Because source search is read-only and only needs source/search repositories, it
sets `requireProjectKernelForExplicitProject: false`. Other runtime callers keep
the existing default: explicit projects still require a `ProjectKernel` unless a
caller opts out.

## Dogfood

Command output was written under `.local-lab/543l/`.

```txt
projectId: ae9962f9-0b20-4a43-97fe-d715062c4478
sourceClaimId: 7e61831e-c8b0-47af-b0a1-2b24711ce466
sourceDecisionEdgeId: 82b3fd3c-e1b4-4dcd-95e4-125c0b35389b
target: harness_run/e98c2ec2-941a-4e68-8243-e491f952827f
```

Persisted evidence:

```txt
evidenceBundle: 576981a4-f3ed-414b-a967-3a91d9dc7e48
reviewAssessment: a15f8241-00b6-4b2c-b1ab-b0d6b8494b3a
feedbackDelta: f54fae32-7018-45fa-985f-cfd772900972
```

The project has no `ProjectKernel`, which previously made explicit source
search fail before readback. With the new opt-out, source search returned the
dogfood `SourceClaim` as an included supporting claim and exposed
`sourceDecisionSupportState: linked` with the persisted edge ID.

## Verification

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceSearchCommand: passed
pnpm --filter @krn/cli typecheck:tests:clean: passed
pnpm -w typecheck: passed
```

## Proof

This proves `krn source search --project <project-id>` can route read-only
source/search readback to an explicit project, even when that project lacks a
`ProjectKernel`, and can expose existing SourceDecisionEdge support for an
included SourceClaim.

## Non-Proof

This does not prove source truth, ranking quality, graph retrieval quality,
ProjectKernel lifecycle correctness, crawler readiness, worker runtime behavior,
or product readiness.

## Rollback Risk

Low. The runtime opt-out is explicit and used only by source search. Existing
callers keep the prior explicit-project kernel requirement.
