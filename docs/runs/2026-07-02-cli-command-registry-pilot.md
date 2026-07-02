# CLI Command Registry Pilot

Date: 2026-07-02

Beads issue: `mise-en-palace-3pze`

## Summary

This slice pilots a tiny internal CLI command registry on exactly one command
group: `krn run show`.

The registry is deliberately narrow:

```txt
registered top-level command: run
registered command kinds: runShow, runShowHelp
runtime execution: unchanged; still handled by runHarnessCliCommand
public CLI exports: unchanged
```

This is not a broad parser rewrite. It is a small proof that parse/help routing
metadata can move out of the flat `parseArgs.ts` / `runCli.ts` maps without
weakening the `CliCommand` discriminated union.

## Why `run show`

Subagent and local inspection compared `doctor`, `codex brief`, `brain search`,
`review assess`, and `run show`.

`run show` was selected because it is small but not trivial:

```txt
subcommand: run show
required option: --run-id
optional flag: --json
help command kind: runShowHelp
runtime path: read-only DB readback, unchanged
tests: parser, runner, and runCli route coverage already exist
```

Rejected first-pilot candidates:

```txt
doctor: safest but too trivial; would prove almost nothing beyond no-arg routing
codex brief: small, but no help-kind path to exercise registered help rendering
brain search: good shape, but catalog/store readback has larger fixture surface
review assess: isolated parser/runner, but no wired help command kind today
```

## Changed Files

```txt
packages/cli/src/cliCommandRegistry.ts
packages/cli/src/cliCommandRegistry.test.ts
packages/cli/src/parseArgs.ts
packages/cli/src/runCli.ts
GOAL.md
PLAN.md
PLANS.md
```

## Line Count Truth

```txt
packages/cli/src/cliCommandRegistry.ts: 59 lines
packages/cli/src/cliCommandRegistry.test.ts: 41 lines
parseArgs.ts / runCli.ts net local change: +12 lines
```

This pilot is not a line-count win by itself. Its value is architectural
evidence: a command group can be registered through typed parse/help metadata
without touching runtime execution and without `any`/unsafe generic payload
maps. The registry should not be expanded broadly unless the next migrated
command produces a real readability or ownership improvement.

## Source To Decision

```yaml
source_id: cli-command-registry-pilot
source: repo-local CLI parser/dispatch audit, subagent read-only inspection, focused CLI tests
mechanism: >
  CLI command ownership is currently split across parseArgs top-level routing,
  per-command parsers, runCli help renderers, and runtime adapters. A tiny
  registry can make parse/help ownership explicit for one command group.
krn_implication: >
  Registry migration is useful only if it clarifies ownership without turning
  into a broad framework or weakening CliCommand discriminants.
decision: >
  Register only `run show` parse/help metadata. Leave runtime dispatch
  unchanged. Treat this as a pilot, not permission for broad CLI rewrite.
consumer: >
  Future CLI topology cleanup and parser/dispatch simplification decisions.
falsifier: >
  The next migrated command adds more scaffolding than it removes, requires
  `any` or broad casts, breaks runCli behavior, or makes command ownership less
  obvious than the existing flat maps.
```

## Proof

Verification passed:

```txt
rtk pnpm -C packages/cli typecheck
rtk pnpm --filter @krn/cli test -- cliCommandRegistry parseRunArgs runRunShowCommand runCli -t "cliCommandRegistry|parseRunArgs|runRunShowCommand|run show"
rtk pnpm --filter @krn/cli test
rtk pnpm quality:fallow:ci
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm eval:brain-battle:smoke
rtk git diff --check
```

## Does Not Prove

This does not prove the CLI should be broadly migrated to a registry. It does
not fix the giant CLI files, parse/result non-discrimination, runtime adapter
exhaustiveness, or `runSourceArtifactPreviewCommand.ts` size. It only proves
one small parse/help registry shape is type-safe and behavior-preserving.

## Handoff

Current state after this slice:

```txt
run show parse/help metadata: registered
runtime execution: unchanged
CliCommand union: unchanged
public CLI API: unchanged
known caveat: registry is net-new code for one command; expand only with ROI proof
next likely task: challenge whether to migrate one more command or stop registry expansion and attack larger CLI split-before-rename work
```

## Second Opinion Prompt

```txt
You are reviewing the current `mise-en-palace` CLI command registry pilot.

Be ruthless. Verify current repo state and diff, not the intended direction.

Questions:

1. Did registering only `krn run show` parse/help metadata improve ownership, or
   did it add framework overhead without enough payoff?
2. Does `cliCommandRegistry.ts` preserve the `CliCommand` discriminated union
   boundary, or does it introduce hidden type-safety debt?
3. Should the next CLI slice migrate one more command, stop registry expansion,
   or instead split a large command file before any further registry work?
4. Are there better first candidates than `run show` given current tests and
   fixture risk?
5. Did this slice accidentally make help rendering, parser fallback, or
   unsupported-command behavior harder to reason about?
6. What is the next bounded slice that most improves CLI senior-grade topology
   without broad rewrite?

Return findings first with exact file/line refs. Then give delete/rename/leave
decisions, proof/non-proof, and one next bounded slice with acceptance criteria
and verification commands.
```
