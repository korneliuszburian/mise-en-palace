# Skill System Decision Candidates

This file tracks decisions that emerged from comparing KRN skills with Matt
Pocock's skills and loop-engineering practice. It is not an ADR log yet. Promote
an item to a real ADR only when it is hard to reverse, surprising without
context, and the result of a real trade-off.

## name

context-artifact-lane

## description

Decide whether KRN needs a compact context artifact for vocabulary and accepted
operating decisions, analogous to Matt Pocock's `CONTEXT.md`, without turning it
into runtime memory or a second roadmap.

## steps

1. Identify terms and decisions that agents repeatedly rediscover or misuse.
2. Compare possible homes: `KRN_ROADMAP.md`, README onboarding, Beads,
   source-to-decision output, and a new compact context file.
3. Accept a separate context lane only if it reduces repeated agent confusion in
   real work.
4. If accepted, define its exact scope: vocabulary and stable operating
   decisions only; no implementation plan, scratchpad, task list, or runtime
   memory.

## stop_condition

A single accepted home exists for shared vocabulary and durable operating
decisions, and every skill can point to it without duplicating that content.

## name

lightweight-adr-lane

## description

Decide whether KRN needs lazy, tiny ADRs for surprising, hard-to-reverse
engineering decisions that future agents are likely to "fix" incorrectly.

## steps

1. Use Matt's ADR test: hard to reverse, surprising without context, real
   trade-off.
2. Find current KRN decisions that pass the test.
3. Reject decisions that are only status updates, implementation notes, or
   temporary plans.
4. If accepted, define one minimal ADR format and one folder.

## stop_condition

The repo has either a deliberate "no ADR lane yet" decision with evidence, or a
minimal ADR lane with one promoted decision that passes the three-part test.

## name

diagnosing-bugs-skill

## description

Add a distinct diagnosis skill because KRN has TDD, testing, and review skills,
but no dedicated loop that forbids hypotheses until a tight red-capable repro
exists.

## steps

1. Extract the KRN-specific version of Matt's bug loop: feedback loop,
   reproduce/minimize, hypotheses, instrumentation, fix/regression, cleanup.
2. Keep it separate from `tdd`; diagnosis starts from a reported symptom, TDD
   starts from intended behavior.
3. Require a command-backed red-capable loop before code changes, unless the
   impossibility is explicitly documented.
4. Pair the skill with `code-review` or `evidence-review-loop` after the fix.

## stop_condition

A `diagnosing-bugs` skill exists with one responsibility, a red-capable loop
gate, KRN verification commands, and no overlap that makes `tdd` ambiguous.

## name

beads-wayfinding-submodes

## description

Decide whether to strengthen the existing Beads skill with Matt-style
wayfinding, triage, and tracer-bullet modes instead of adding separate
`to-spec`, `to-tickets`, `triage`, and `wayfinder` skills.

## steps

1. Inspect current Beads usage and identify where agents produce vague issues or
   over-large plans.
2. Define submodes only if they change behavior: triage, tracer bullets,
   wayfinding, claim/close handoff.
3. Keep Beads as the durable task graph; do not introduce a second markdown
   planning surface.
4. Split into separate skills only if one submode needs independent model
   invocation or causes premature completion.

## stop_condition

Large work has one clear route: use Beads directly with explicit submodes, or
use a separate wayfinding skill because the sequence cut proved necessary.

## name

source-to-decision-scope

## description

Check whether `source-to-decision` is too broad: it currently covers research
intake, source mapping, decision/rejection, falsifiers, and learning candidates.

## steps

1. Review recent uses of `source-to-decision`.
2. Separate roles: research legwork, decision capture, falsifier definition, and
   knowledge promotion.
3. Keep one skill only if the combined loop improves correctness without
   overloading the agent.
4. Split only where a branch has a distinct trigger and stop condition.

## stop_condition

`source-to-decision` is either confirmed as the single source gate, or split
into smaller skills with no duplicated source-of-truth rules.

