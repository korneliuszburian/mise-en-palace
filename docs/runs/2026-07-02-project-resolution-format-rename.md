# CLI Naming Batch: Format And Selection Helpers

Date: 2026-07-02

## Summary

Renamed two small CLI-private helpers:

- `projectResolutionReadback` -> `projectResolutionFormat`
- `retainedPatternPlanBridge` -> `retainedPatternSelection`

This is a deliberately narrow `mvrx` naming slice. The first helper formats
`ProjectResolutionKind` values for operator-facing CLI output. The second helper
parses and formats retained-pattern selection metadata for plan/brief/run output.
Neither file owns a persistence model, public command, DB schema, or runtime
proof surface.

## Source To Decision

```yaml
source_id: repo-local-naming-layout-inventory-project-resolution
source: docs/runs/2026-07-02-naming-layout-inventory.md
mechanism: inventory flagged projectResolutionReadback and retainedPatternPlanBridge as bounded CLI naming candidates; both modules are private formatting/parsing helpers, not public behavior.
krn_implication: removing readback/bridge wording from non-readback/non-bridge helpers reduces AI-control-plane vocabulary without weakening domain meaning.
decision_kind: adopt
decision: rename helper/test files to projectResolutionFormat and retainedPatternSelection, updating only direct imports.
consumer: mise-en-palace-mvrx
falsifier: if the rename changes CLI output, breaks focused CLI tests, or hides a real readback contract, revert or introduce a clearer compatibility boundary.
```

## Changed

- `packages/cli/src/projectResolutionReadback.ts`
  -> `packages/cli/src/projectResolutionFormat.ts`
- `packages/cli/src/projectResolutionReadback.test.ts`
  -> `packages/cli/src/projectResolutionFormat.test.ts`
- `packages/cli/src/retainedPatternPlanBridge.ts`
  -> `packages/cli/src/retainedPatternSelection.ts`
- `packages/cli/src/retainedPatternPlanBridge.test.ts`
  -> `packages/cli/src/retainedPatternSelection.test.ts`
- Updated direct imports in:
  - `packages/cli/src/runPlanCommand.ts`
  - `packages/cli/src/runRunShowCommand.ts`
  - `packages/cli/src/runHeartbeatPreviewCommand.ts`
  - `packages/cli/src/runCodexBriefCommand.ts`
- Updated the test label from operator readback to operator output.
- Preserved `RetainedPatternPlanSelection` type names and
  `retainedPatternSelection` metadata key because they describe the current data
  contract.

## Before / After

```txt
before: projectResolutionReadback.ts
after:  projectResolutionFormat.ts
```

```txt
before: projectResolutionReadback test suite
after:  projectResolutionFormat test suite
```

```txt
before: retainedPatternPlanBridge.ts
after:  retainedPatternSelection.ts
```

No public CLI command name, output wording, persisted field, DB schema, or
runtime behavior changed.

## Proof

- `rtk pnpm --filter @krn/cli test -- projectResolutionFormat runPlanCommand runRunShowCommand runHeartbeatPreviewCommand`
- `rtk pnpm --filter @krn/cli test -- retainedPatternSelection runPlanCommand runRunShowCommand runCodexBriefCommand`
- `rtk pnpm -C packages/cli typecheck`
- `rtk proxy pnpm typecheck`
- `rtk pnpm test`
- `rtk pnpm quality:fallow:ci`
- `rtk git diff --check`

## Non-Proof

- This does not fix large CLI files such as `runSourceArtifactPreviewCommand.ts`
  or `runCli.test.ts`.
- This does not complete repo-wide naming cleanup.
- This does not migrate CLI tests into `__tests__`.
- This does not remove valid readback vocabulary from real readback surfaces.
- This does not prove product behavior improves; it proves a small naming debt
  was removed without changing behavior.

## Second-Opinion Prompt

Review the current diff after
`docs/runs/2026-07-02-project-resolution-format-rename.md`.

Act as a ruthless senior reviewer. Decide whether this `mvrx` slice removed real
scan noise or whether it was cosmetic churn. Verify that `projectResolutionFormat`
is the right name for a helper that formats `ProjectResolutionKind` values for
CLI output, and that `retainedPatternSelection` is the right name for retained
pattern plan/brief/run selection parsing and formatting. Check all imports and
tests for stale `projectResolutionReadback` or `retainedPatternPlanBridge`
references, and distinguish historical report references from live code
references. Then inspect the remaining naming/layout debt and propose the next
bounded slice. Prefer concrete low-risk candidates with exact files,
public-behavior impact, verification commands, and explicit non-goals. Challenge
any proposal that renames worker/runtime/DB readiness surfaces without a
family-wide terminology decision.
