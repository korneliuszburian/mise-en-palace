# V278 Codex Adapter Skill Routing Dogfood

Status: complete.

## Objective

Use the retained `codex-skill-progressive-disclosure-routing` card during a
small Codex adapter/brief guidance repair.

## Pattern Readback Used

Command:

```sh
rtk pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text progressive-disclosure --json
```

Result:

```txt
Returned pattern:codex-skill-progressive-disclosure-routing
```

Usefulness:

```txt
helped
```

Reason:

The card made the repair target explicit: skill hints should carry retained
pattern context without creating hidden skill routing, a new prompt system, or
an agent framework.

## Change

- Added `patternRefs: string[]` to `CodexSkillBindingHint`.
- `createCodexSkillBindingHints` now attaches:

  ```txt
  pattern:codex-skill-progressive-disclosure-routing
  ```

  to each capability-derived skill hint.
- `renderExecutionBriefText` now renders the pattern refs beside each skill
  hint.
- Adapter tests assert both the typed artifact and rendered brief include the
  retained skill-routing pattern.

## Source-To-Decision

- Source: V276 retained pattern card and V277 adapter skill readback hook.
- Mechanism: Codex-facing briefs are the execution boundary where skill hints
  reach the operator/Codex. If a skill hint has no retained pattern reference,
  the pattern brain is not visible at the point of execution.
- KRN implication: skill hints should expose the retained pattern that justifies
  the routing suggestion.
- Decision: add read-only `patternRefs` to skill hints and render them.
- Consumer: future Codex execution briefs and adapter smoke/readback.
- Falsifier: rendered skill hints can suggest skills without any retained
  pattern reference and tests still pass.

## Evidence

Commands run:

```sh
rtk pnpm --filter @krn/codex-adapter test -- renderExecutionBrief
rtk pnpm --filter @krn/codex-adapter test
```

Result:

```txt
codex-adapter targeted tests passed
codex-adapter package tests passed: 4 files / 9 tests
```

## What This Proves

- Codex skill hints can carry retained pattern refs in the typed artifact.
- Rendered execution briefs can show the retained pattern behind skill routing.
- The progressive-disclosure card helped a real adapter change.

## What This Does Not Prove

- Automatic skill selection.
- That Codex will always follow the hint.
- DB-backed adapter smoke includes the new field.
- Product readiness.

## Next Task

V279 should guard or prove the adapter smoke/readback path includes skill
pattern refs end-to-end.
