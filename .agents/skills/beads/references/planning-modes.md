# Beads Planning Modes

Use this reference when Beads is being used for planning, not only claim/close
task tracking.

## to-spec Mode

Use when a conversation or rough idea needs a settled build artifact before
ticket slicing.

Use `templates/spec.md`.

Rules:

- Write the spec as the smallest decision that can create tickets.
- Keep open questions explicit; do not answer them for the operator.
- State non-goals so `to-tickets` cannot smuggle in extra work.
- Do not create implementation tickets while the spec still has requirement
  ambiguity.

Stop when the spec is specific enough to slice into agent-sized tickets without
inventing requirements.

## to-tickets Mode

Use when a spec or plan is ready to become Beads issues.

Use `templates/ticket.md`.

Rules:

- Prefer tracer-bullet vertical slices.
- Each ticket should fit one fresh agent context.
- Use native Beads dependency edges for blockers.
- The frontier is `bd ready`.
- Use expand-contract for wide refactors that cannot land as vertical slices.
- Every ticket must name a consumer, acceptance criteria, proof, non-proof, and
  rollback or contraction condition when relevant.
- Reject tickets that only name a package layer, file move, or ceremony.

Stop when every ticket has acceptance criteria, proof boundaries, and blocker
edges.

## wayfinding Mode

Use when the destination is clear enough to name, but the route is still foggy.
This is not implementation planning. It is decision discovery.

Use `templates/wayfinding-map.md`.

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
- A map issue is not done until child tickets are small enough for one agent
  session and their blockers are dependency edges.
- If the next step is still vague, create a question ticket, not an
  implementation ticket.

Stop when the route to the destination is clear or the remaining fog has become
specific tickets, with native dependency edges and a `bd ready` frontier.

## handoff Mode

Use when a current run needs compact continuation state after meaningful work,
before auto-compaction, resume, pause, transfer, or session end.

Use `templates/handoff.md`.

Rules:

- State the active Beads issue, status, and next action.
- State commit, push, CI, DB, and worktree state without pretending missing
  checks passed.
- List only changed files and context selectors needed to resume.
- Do not turn the handoff into product brain or a task ledger.

Stop when a fresh agent can resume without broad reread and without mistaking
unverified work for pushed or CI-proven work.
