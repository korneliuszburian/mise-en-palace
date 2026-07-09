# Beads Planning Modes

Use this reference when Beads is being used for planning, not only claim/close
task tracking.

## to-spec Mode

Use when a conversation or rough idea needs a settled build artifact before
ticket slicing.

Output shape:

```md
## Problem Statement

## Solution

## Operator/User Stories

## Implementation Decisions

## Testing Decisions

## Out of Scope

## Open Questions
```

Stop when the spec is specific enough to slice into agent-sized tickets without
inventing requirements.

## to-tickets Mode

Use when a spec or plan is ready to become Beads issues.

Each ticket must include:

```md
## What to build

## Acceptance criteria

## Proof / non-proof

## Blocked by
```

Rules:

- Prefer tracer-bullet vertical slices.
- Each ticket should fit one fresh agent context.
- Use native Beads dependency edges for blockers.
- The frontier is `bd ready`.
- Use expand-contract for wide refactors that cannot land as vertical slices.

Stop when every ticket has acceptance criteria, proof boundaries, and blocker
edges.

## wayfinding Mode

Use when the destination is clear enough to name, but the route is still foggy.
This is not implementation planning. It is decision discovery.

Map issue shape:

```md
## Destination

## Notes

## Decisions so far

## Not yet specified

## Out of scope
```

Child issue types:

- `research`: external or local investigation;
- `prototype`: concrete throwaway artifact to make a decision easier;
- `grilling`: human-in-the-loop question;
- `task`: manual work required before a decision can be made.

Rules:

- Work one ticket per fresh context.
- Claim before work.
- Record the answer in the ticket, then close it.
- Add newly visible tickets only after the current answer makes them specific.
- Keep the map as an index; detailed answers live in child tickets.

Stop when the route to the destination is clear or the remaining fog has become
specific tickets.
