# Source Decision Gaps Readback

Date: 2026-07-03
Bead: `mise-en-palace-p3t1`

## Objective

Provide a read-only operator report for accepted SourceClaims that have no
SourceDecisionEdge readback, without letting CI mutate Beads or creating a broad
audit command.

## What Changed

Added:

```txt
krn source decision gaps [--project <project-id>] [--limit <n>] [--json]
```

The command scans accepted project SourceClaims, checks
`listSourceDecisionEdgesForClaim`, and reports accepted claims with no linked
decision edge. It is read-only and opts out of ProjectKernel requirement for
explicit projects, matching source-search readback behavior.

## Verification

```txt
pnpm --filter @krn/cli test -- parseSourceArgs runSourceDecisionGapsCommand: passed
pnpm --filter @krn/cli typecheck:tests:clean: passed
```

## Proof

Focused tests prove:

```txt
the parser accepts source decision gaps options
JSON output reports one missing accepted SourceClaim and one linked SourceClaim
text output renders no gaps when all accepted claims are linked
the command closes its runtime and performs no source writes
```

## Non-Proof

This does not prove missing edges are defects, source truth, claim usefulness,
Memory Core mutation, CI enforcement, or product readiness.

## Rollback Risk

Low. This is a read-only command surface using existing repository methods.
