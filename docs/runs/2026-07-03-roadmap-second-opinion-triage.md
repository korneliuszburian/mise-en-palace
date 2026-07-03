# Roadmap Second-Opinion Triage

Date: 2026-07-03

## Objective

Use governed `second-opinion-claude` to synthesize the next autonomous kernel
tasks after the green source decision/source-search slices.

## Review Results

First pass: `block / MEDIUM`.

Claude correctly flagged that the context pack was too thin for a roadmap
review: it had no quoted `PLAN.md` product gaps and no concrete task artifact.

Second pass: `approve_with_fixes / LOW`.

The retry supplied the current `PLAN.md` gaps, pushed commit list, and green CI
run IDs. Claude proposed four bounded tasks. Codex triage accepted one directly,
rewrote one as a graph-edge rank-down follow-up, rewrote one as a read-only
orphan detector, and rejected CI-mutating Beads automation as the wrong coupling.

Created Beads:

```txt
mise-en-palace-a878: Weight SourceDecisionEdge confidence in source search ranking
mise-en-palace-bllf: Rank down invalidated source-graph claims in source search
mise-en-palace-p3t1: Design read-only orphan source-decision detector
```

## Triage

Accepted:

```txt
SourceDecisionEdge confidence/supportType weighting is the next P1 because it
extends the just-green decision-linked ranking behavior without broadening the
activation engine or adding product surfaces.
```

Modified:

```txt
Supersession rank-down should use existing SourceClaimEdge graph semantics,
not a nonexistent SourceDecision superseded status.
```

Rejected:

```txt
CI-created Beads issues would couple verification to project-state mutation.
The useful part is a read-only orphan detector or existing readback, not CI
writing work items.
```

## Non-Proof

This does not prove Claude's priorities are correct, product readiness, global
ranking quality, or that UI/API/MCP should begin. It only provides a governed
external review artifact and Beads-ready task synthesis.
