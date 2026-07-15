# KRN Conventions

This file is the stable operating contract for repo-local skills and agent
artifacts. Product direction belongs in `KRN_ROADMAP.md`; active work belongs in
Beads; runtime memory belongs in the database-backed KRN systems.

## Skill Identity And Invocation

- Every skill name must be unique across the repo and installed skill index.
  Repo-local skills add KRN domain or named-tool context; reusable engineering
  procedure belongs to the global skill system. Prefix KRN domain extensions
  with `krn-`; keep an ecosystem name such as `beads` only when the skill
  operates that named tool.
- Do not retain aliases or symlinks for a renamed skill. One workflow has one
  procedural owner.
- Every skill carries `agents/openai.yaml` with matching display metadata and
  an explicit `policy.allow_implicit_invocation` value.
- Model-invoked skills set `allow_implicit_invocation: true`. Their description
  is an always-loaded routing surface: lead with the distinguishing trigger and
  omit synonym lists.
- User-invoked skills set `allow_implicit_invocation: false` in
  `agents/openai.yaml`. Do not add harness-specific frontmatter rejected by the
  Codex skill validator. User-invoked skills cannot be a hidden dependency of
  an autonomous workflow.
- Refer to another skill by `$skill-name`, not by copying its procedure or
  linking into its private references.
- `AGENTS.md` owns the repo router and hard invariants. A skill owns the repeated
  workflow. Do not describe the same procedure in both.

## Skill Shape

Every repo-local skill must answer this contract:

```txt
name -> description -> trigger -> steps -> output -> stop_condition -> verification -> forbidden
```

- `name` and `description` live in YAML frontmatter.
- The frontmatter description distinguishes the skill from adjacent workflows;
  add a body `Trigger` or anti-trigger only when the description is not enough.
- `Steps` are ordered and end in checkable progress.
- `Output` names the artifact or result.
- `Stop Condition` is the semantic completion contract.
- `Verification` names the proof path without duplicating the canonical gate
  map.
- `Forbidden` contains only load-bearing safety boundaries.

Use the shortest headings that fit the workflow (`Process`, branch sections, or
the full contract). Collapse sections that would repeat the same sentence. Do
not keep empty headings or generated scaffolding for visual uniformity.

## Progressive Disclosure

Keep `SKILL.md` as the entrypoint. Move reusable detail into skill-local
resources when it would otherwise bloat the entrypoint:

- `references/` for decision rules, examples, test guidance, smell catalogs, or
  domain-specific procedures;
- `templates/` for reusable issue, spec, ADR, or review shapes;
- `scripts/` for deterministic validation or fragile repeated operations.

Load a reference only when its branch applies. A reference has one owning
skill; shared behavior becomes a skill rather than a copied file.

## Artifact Ownership

- `CONTEXT.md`: shared vocabulary and stable operating language.
- `CONVENTIONS.md`: skill and artifact rules.
- `docs/adr/`: rare hard-to-reverse decisions.
- Beads: task state, blockers, frontier, claims, follow-ups, and handoff state.
- `KRN_ROADMAP.md`: product and architecture direction.
- Store-backed KRN systems: runtime memory, source records, evidence, feedback,
  evals, and retrieval read models.

Do not use Markdown as runtime memory, a research archive, or a replacement for
Beads.

## ADR Rule

Create an ADR only when all are true:

1. the decision is hard to reverse;
2. it is surprising without context;
3. a real trade-off was made;
4. a future agent is likely to rediscover or undo it.

Keep ADRs short and link the consumer and falsifier when they are not obvious.

## Beads Planning Modes

Use Beads as the tracker substrate. Keep planning modes inside `$beads` until a
mode needs independent invocation or repeatedly causes premature completion:

- `to-spec`: rough intent into a settled spec issue;
- `to-tickets`: a spec into vertical issues with dependency edges;
- `wayfinding`: a foggy destination into a map, decisions, blockers, and ready
  frontier;
- `handoff`: compact continuation state for a fresh agent.

## Engineering, Review, And Proof

- Maker and checker remain separable. Global `$code-review` never edits the
  slice it reviews.
- A module interface is the caller and test surface. Prefer a deep module over
  adapter chains, pass-through helpers, or one-adapter hypothetical seams.
- Choose the cheapest proof that can falsify the change before editing:
  `0` new tests for type-only or already-covered refactors, `1` focused test for
  one changed runtime contract, and `N` only when each test maps to a distinct
  acceptance requirement.
- Work in vertical slices: one seam, one falsifier when needed, one minimal
  implementation, then review the resulting design. Do not write a horizontal
  batch of imagined tests.
- Typecheck proves type relationships, not runtime validity. Runtime validators,
  parsers, migrations, authority rules, and user-visible behavior need the
  corresponding behavior or DB proof.
- Review Standards and Spec as independent axes. Diagnosis needs a red-capable
  repro or a measured performance baseline before causal hypotheses.

## Completion And Publication

Semantic completion requires acceptance, scoped verification, and an honest
proof/non-proof record. Commit, push, CI, and handoff state must be reported,
but transport does not replace proof. Publish or clean only owned work with the
required authority; preserve pre-existing dirty state, stashes, and branches.
