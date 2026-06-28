# V276 Codex Skill Progressive-Disclosure Pattern Card

Status: complete.

## Objective

Retain the Codex skill progressive-disclosure routing mechanism as a brain
knowledge card.

## Change

- Added retained pattern:
  `docs/patterns/retained-patterns/codex-skill-progressive-disclosure-routing.json`
- Added it to:
  `docs/brain-knowledge/catalog.json`
- Guarded catalog presence in:
  `packages/harness/src/brainKnowledgeReadModelInvariants.test.ts`
- Added CLI readback/search coverage in:
  `packages/cli/src/runKnowledgeCardsCommand.test.ts`

## Source-To-Decision

- Source: `docs/KRN_SOURCES.md#skills`,
  `docs/runbooks/pattern-intake.md#official-codex-docs-to-skill`,
  `.agents/skills/source-to-decision/SKILL.md`,
  `.agents/skills/typescript-type-safety/SKILL.md`.
- Mechanism: skills package reusable workflows through progressive disclosure;
  KRN skills can also query retained brain knowledge before implementation.
- KRN implication: repeated KRN workflows should live in narrow repo-local
  skills, not in giant prompts, root plans, or `AGENTS.md`.
- Decision: retain `codex-skill-progressive-disclosure-routing` as an active
  pattern card.
- Consumer: future Codex skill updates, pattern-to-skill routing, and operator
  execution briefs.
- Falsifier: a repeated KRN workflow still requires copying long prompt blocks
  into chat/root plans/`AGENTS.md`, or a relevant skill cannot query retained
  brain knowledge before implementation.

## Evidence

Commands run:

```sh
rtk pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text progressive-disclosure --json
rtk pnpm --filter @krn/harness test -- brainKnowledgeReadModel brainKnowledgeReadModelInvariants
rtk pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
```

Result:

```txt
progressive-disclosure readback returned pattern:codex-skill-progressive-disclosure-routing
harness targeted tests passed: 33 files / 161 tests
CLI targeted tests passed: 32 files / 201 tests
```

## Finding

Adding the skill-routing card made the old `source-to-decision` search return
two cards because the new skill-routing pattern correctly references the
source-to-decision skill. The test was narrowed to `retention gate` for the
source-to-decision retention-card uniqueness check.

This is expected catalog behavior, not ranking proof.

## What This Proves

- The skill-routing mechanism is now retained as explicit brain knowledge.
- The pattern is searchable through the existing CLI readback.
- The catalog can include a skill-routing pattern without mutating memory or
  adding hidden execution hooks.

## What This Does Not Prove

- Automatic skill selection.
- That many skills are useful by default.
- That Codex will always load the right skill.
- Full research condensation.
- Product readiness.

## Next Task

V277 should guard the new skill-routing pattern in the HTML/catalog breadth
surface so pattern-brain UI/readback cannot silently omit it.
