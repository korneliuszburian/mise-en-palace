# V277 Codex Adapter Skill Routing Readback Hook

Status: complete.

## Objective

Route Codex-facing brief and skill-hint work through the retained
`codex-skill-progressive-disclosure-routing` card.

## Change

- Updated `.agents/skills/codex-adapter-plan/SKILL.md` so changes to skill
  hints, Codex-facing execution instructions, `AGENTS.md` pointers, or reusable
  brief guidance query:

  ```sh
  pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text progressive-disclosure
  ```

- Guarded that behavior in `packages/harness/src/skillInvariants.test.ts`.

## Source-To-Decision

- Source: V276 retained pattern card,
  `.agents/skills/codex-adapter-plan/SKILL.md`, and V270 skill readback hook.
- Mechanism: Codex-facing adapter work is where skill hints and reusable
  execution instructions are rendered. That boundary should query the retained
  skill-routing pattern before prompt/brief/skill-hint changes.
- KRN implication: pattern brain improves execution only if adapter/skill
  surfaces can read the relevant retained pattern before changing guidance.
- Decision: add the catalog readback hook to the Codex adapter skill, not a
  hidden runtime router.
- Consumer: future Codex brief and skill-hint changes.
- Falsifier: Codex adapter work can change skill hints or reusable execution
  instructions without reading or explicitly rejecting
  `codex-skill-progressive-disclosure-routing`.

## Evidence

Commands run:

```sh
rtk pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text progressive-disclosure --json
rtk pnpm --filter @krn/harness test -- skillInvariants
```

Result:

```txt
progressive-disclosure readback returned pattern:codex-skill-progressive-disclosure-routing
skillInvariants passed: 33 files / 161 tests
```

## What This Proves

- The Codex adapter skill now has a guarded route to the retained skill-routing
  pattern.
- The route is read-only and does not mutate memory/source/candidates.
- Future adapter/brief work has a concrete pattern to apply or reject.

## What This Does Not Prove

- Automatic skill selection.
- That Codex will always choose the correct skill.
- That all future briefs will improve.
- Product readiness.

## Next Task

V278 should run a small adapter/brief dogfood using this hook and record whether
the progressive-disclosure card helped, was neutral, or was missing/noise.
