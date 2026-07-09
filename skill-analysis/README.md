# Skill Analysis

This is the shared workshop surface for understanding KRN skills through the
Matt Pocock / loop-engineering lens.

It is intentionally not a new authority surface. It is a generated analysis
space used to make the skill system visible before changing it.

## Regenerate

```sh
rtk proxy node skill-analysis/generate-skill-analysis.mjs
```

The generator reads:

- `.agents/skills/*/SKILL.md`
- `.local-lab/mattpocock-skills/skills/engineering/*/SKILL.md` when the local
  Matt Pocock skills clone exists

It writes:

- `generated/index.md`
- `generated/comparison.md`
- `generated/skill-graph.md`
- `generated/krn-skills/*.md`
- `generated/matt-skills/*.md`

## How To Use This

1. Regenerate the analysis after any skill change.
2. Read `WORKSHOP.md` for the human reasoning map.
3. Use `DECISION-CANDIDATES.md` to track which questions are worth promoting
   into real skill, context, or ADR changes.
4. Use `generated/comparison.md` only as inventory, not as a verdict.
5. Open individual generated skill cards when a relationship looks unclear.
6. Decide whether the answer is: keep, rewrite, merge, split, add, or reject.

The point is not to preserve the generated output as product truth. The point is
to keep our discussion grounded in the actual skill files instead of vibes.
