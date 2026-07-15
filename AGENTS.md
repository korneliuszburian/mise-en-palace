# KRN Agent Instructions

KRN is the governed operating layer around Codex. The current product target is
a temporal Memory Core that emits a bounded `DecisionPacket`: selected current
knowledge, stale or rejected paths, source support, task-specific use, and
falsifiers.

## Context Selectors

- Before writing, run `rtk git status --short --branch` and separate owned
  changes from pre-existing work.
- For durable or multi-step work, read and claim the active Bead. Beads owns
  task state, dependencies, blockers, follow-ups, and handoffs; it does not own
  reusable knowledge.
- Read the roadmap North Star and Current Boundary for product orientation;
  load only the task-relevant roadmap section when a product or architecture
  decision depends on it.
- Read `CONTEXT.md` for shared language and `CONVENTIONS.md` for skill and
  artifact rules. Read historical material only when a current authority
  surface points to it.
- Keep source corpora outside active repo context. Derive bounded mechanisms
  and decisions instead of copying research or course material into Markdown.

## Domain Skills

- Use `$beads` for durable task state, planning, blockers, follow-ups, and
  handoffs.
- Use `$krn-memory-core` when `DecisionPacket`, source/memory authority,
  feedback, activation, or another Memory Core boundary changes.

Reusable engineering workflows are discovered from the installed global
catalog. Do not copy, rename, enumerate, or alias them in this repository. If a
required global owner is unavailable, report the installation gap instead of
recreating its procedure locally.

## Product And Change Boundaries

- Build the Memory Core, not dashboards, benchmark lanes, broad multi-agent
  systems, prompt archives, decorative platform wiring, or file-backed runtime
  memory.
- Before architecture or public-shape work, map the current caller, interface,
  implementation, and persistence or IO path. Name the consumer, owner,
  falsifier, and non-proof.
- Prefer one direct public model. Add an abstraction only when it owns policy or
  isolates a real varying or external seam; do not add aliases, compatibility
  shims, or parallel read models by default.
- Keep external data `unknown` until validated. Do not weaken TypeScript to move
  faster.
- For source-backed decisions, require `source -> mechanism -> KRN implication
  -> adopt/reject/lab-test/defer -> consumer -> falsifier`, plus what the source
  does not prove.
- Change only owned paths. Remove artifacts made obsolete by the current slice;
  leave pre-existing out-of-scope cleanup unchanged.

## KRN Gates And Publication

The installed global engineering contract owns the production loop, `rtk`
usage, proof budget, test boundaries, umbrella-gate policy, dirty-work safety,
and publication separation. This repository adds only KRN gate selection:

- Select gates from `docs/VERIFICATION_GATES.md`; do not invent a parallel list.
- TypeScript changes use the narrowest supported package typecheck. Run the
  root `rtk proxy pnpm typecheck` only for shared compiler config,
  cross-package or public type boundaries, when no narrower command exists, or
  when the final gate map requires it.
- For qualifying JS/TS package-surface, architecture, or cleanup changes, run
  `rtk pnpm quality:fallow:ci` once after the slice stabilizes. Rerun it only
  after a change that can affect its result. The broad Fallow report is
  advisory.
- External review is advisory. Validate every factual finding against current
  code and local verification before acting on it.
- An owned Beads implementation session is not fully handed off until its
  commit is pushed and the branch is verified against its upstream. If
  publication lacks authority or is blocked, record that state instead.
- Use Conventional Commits for owned commits, for example
  `fix(scope): concise imperative summary`.
