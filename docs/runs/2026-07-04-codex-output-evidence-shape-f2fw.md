# Codex Output Evidence Shape Gate

Date: 2026-07-04

## Scope

Added a deterministic KRN behavior gate for claimed Codex-output evidence shape.
The gate is a companion to the Codex execution-brief renderer: it does not call
Codex, but it rejects an output shape that says it used KRN context without
reviewable evidence.

## Behavior Change

`eval:krn:smoke` now includes
`golden-case-codex-output-evidence-shape-001-a`.

The case accepts a reviewed output shape with:

- `summary`
- `claimsKrnContextUse: true`
- `evidenceRefs`
- `verification`
- `changedFiles`
- `doesNotProve`

It rejects KRN-context-use claims when `evidenceRefs`, `verification`,
`changedFiles`, or `doesNotProve` are missing.

## Proof

```sh
pnpm --filter @krn/harness test -- krnBehaviorGate
pnpm eval:krn:smoke
pnpm run typecheck
pnpm quality:fallow:ci
git diff --check
```

## Non-Proof

This does not prove live Codex execution, prompt adherence, source truth, output
correctness, prompt-injection resistance, Promptfoo behavior, broad benchmark
quality, dashboard/API/MCP readiness, or product readiness.
