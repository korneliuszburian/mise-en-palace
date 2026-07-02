# Execution Brief Profile Readback

Date: 2026-07-02

Beads issue: `mise-en-palace-3as1`

## Summary

This slice keeps `ExecutionBrief` as the complete typed adapter artifact while
adding a bounded profile/readback for its rendered prompt surface.

Default rendered briefs now classify sections as `required`, `diagnostic`, or
`reserved`, and omit empty reserved future-hook sections:

- `mcp_resource_refs`
- `subagent_probe_hints`

The typed fields remain present on `ExecutionBrief`; only empty rendered
headings are removed from the default text.

## Source To Decision

```yaml
source_id: execution-brief-profile-readback-contract
source: repo-local audits and Codex adapter proof reports
mechanism: >
  The existing `krn.executionBrief.v1` contract already typed MCP resource refs
  and subagent probe hints, but `createExecutionBrief` currently populates both
  as empty arrays and the renderer printed both empty sections.
krn_implication: >
  Empty future-hook sections add prompt surface without product authority. The
  adapter needs typed readback that explains what is required, diagnostic, or
  reserved without implying MCP/subagent runtime readiness.
decision: >
  Add `ExecutionBriefProfileReadback`, a literal section registry, and
  `describeExecutionBriefProfile`. Render a compact `Brief Profile` readback
  and omit empty reserved sections from default text.
consumer: >
  `@krn/codex-adapter` contract tests, render tests, golden brief behavior, and
  CLI/DB smoke surfaces that consume rendered briefs.
falsifier: >
  Default rendered brief prints `MCP Resource Refs:` or `Subagent Probe Hints:`
  while the corresponding arrays are empty, required sections disappear, or the
  readback claims Codex execution/runtime readiness.
```

## Changed Files

```txt
packages/codex-adapter/src/contracts.ts
packages/codex-adapter/src/renderExecutionBrief.ts
packages/codex-adapter/src/__tests__/contracts.test.ts
packages/codex-adapter/src/__tests__/renderExecutionBrief.test.ts
packages/codex-adapter/src/__tests__/codexBriefGoldenBehavior.test.ts
```

## Proof

Proved by verification:

```txt
rtk pnpm --filter @krn/codex-adapter test -- renderExecutionBrief contracts codexBriefGoldenBehavior
rtk pnpm -C packages/codex-adapter typecheck
rtk pnpm --filter @krn/cli test -- runCli codexAdapterSmoke
rtk pnpm -r --workspace-concurrency=1 --if-present typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk pnpm db:smoke:codex-adapter
rtk git diff --check
```

## Does Not Prove

This does not prove Codex consumed or obeyed the brief, prompt quality improved,
prompt length is optimal, MCP resources exist, subagents exist, memory mutated,
worker jobs executed, provider abstraction is ready, or KRN is product-ready.

## Second Opinion Prompt

```txt
You are reviewing the current `mise-en-palace` diff after the
execution-brief profile/readback slice.

Inspect the changed codex-adapter contract, renderer, tests, report, and root
state. Be ruthless:

1. Does the new `ExecutionBriefProfileReadback` reduce prompt bloat or did it
   add another over-abstracted control-plane layer?
2. Are section IDs, `required` / `diagnostic` / `reserved`, and
   `omit_when_empty` classifications technically defensible?
3. Do the tests prove default empty MCP/subagent sections are omitted while
   populated reserved sections still render?
4. Did the slice preserve `krn.executionBrief.v1` without hiding a breaking
   prompt contract change?
5. What false-authority wording remains, especially around MCP, subagents,
   prompt quality, and Codex execution?
6. What is the next bounded slice that most improves the repo toward a senior
   final state without broad renames or speculative architecture?

Return findings first, ordered by severity, with exact file/line references.
Then give delete/rename/leave-alone decisions and one next slice with
acceptance criteria and verification commands.
```
