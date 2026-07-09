# KRN Conventions

This file is the stable operating contract for repo-local skills and agent
artifacts. Product direction belongs in `KRN_ROADMAP.md`; active work belongs in
Beads; runtime memory belongs in the database-backed KRN systems.

## Skill Shape

Every repo-local skill should use this shape unless a section is truly
irrelevant:

```txt
name -> description -> trigger -> steps -> output -> stop_condition -> verification -> forbidden
```

- `name` and `description` live in YAML frontmatter.
- `Trigger` says when the skill changes behavior.
- `Steps` are ordered and end in checkable progress.
- `Output` names the artifact or result.
- `Stop Condition` is the contract for completion.
- `Verification` names the proof path.
- `Forbidden` names hard boundaries only when needed.

## Progressive Disclosure

Keep `SKILL.md` as the entrypoint. Move reusable detail into skill-local
resources when it would otherwise bloat the entrypoint:

- `references/` for decision rules, examples, test guidance, smell catalogs, or
  domain-specific procedures;
- `templates/` for reusable issue/spec/ADR/review shapes;
- `scripts/` for deterministic helper commands or fragile repeated operations.

Reference files must be loaded only when their trigger applies.

## Artifact Ownership

- `CONTEXT.md`: shared vocabulary and stable operating language.
- `CONVENTIONS.md`: skill and artifact rules.
- `docs/adr/`: rare hard-to-reverse decisions.
- Beads: task state, blockers, frontier, claims, follow-ups, handoff state.
- `KRN_ROADMAP.md`: product and architecture direction.
- Store-backed KRN systems: runtime memory, source records, evidence, feedback,
  evals, and retrieval read models.

Do not use any markdown file as runtime memory or a replacement for Beads.

## ADR Rule

Create an ADR only when all are true:

1. hard to reverse;
2. surprising without context;
3. a real trade-off was made;
4. a future agent is likely to rediscover or undo the decision.

Keep ADRs short. Prefer one paragraph plus optional status/options/consequences
only when those sections add value.

## Beads Planning Modes

Use Beads as the tracker substrate. Add explicit modes before creating new
planning skills:

- `to-spec`: conversation or rough idea into a settled issue/spec artifact;
- `to-tickets`: spec or plan into tracer-bullet issues with dependency edges;
- `wayfinding`: foggy large work into a map issue with destination, decisions so
  far, not-yet-specified fog, out-of-scope, and frontier tickets.

Split one mode into a separate skill only when it needs independent invocation
or causes premature completion inside `beads`.

## Review And Debugging

- Maker and checker must be separable for looped work.
- Code review findings need file/line evidence and must separate Standards from
  Spec.
- Debugging requires a tight red-capable loop before hypotheses.
- TDD proves intended behavior; diagnosis proves a reported symptom can be
  reproduced and removed.
