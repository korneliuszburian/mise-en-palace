# V279 Codex Adapter Skill Pattern Smoke Readback

Status: complete.

## Objective

Prove that the DB-backed Codex adapter smoke/readback path includes retained
skill-routing pattern refs in rendered execution briefs.

## Change

- Added `renderedSkillPatternRefs` to the Codex adapter smoke report.
- The DB-backed adapter smoke now fails if the rendered brief omits:

  ```txt
  pattern:codex-skill-progressive-disclosure-routing
  ```

- The smoke report renders:

  ```txt
  Skill pattern refs present: yes/no
  ```

## Evidence

Commands run:

```sh
rtk pnpm --filter @krn/cli test -- codexAdapterSmoke
rtk pnpm db:ready
rtk pnpm db:smoke:codex-adapter
```

Result:

```txt
CLI targeted tests passed: 32 files / 201 tests
DB mode: ready
Migrations expected/applied: 14/14
pgvector: available
Codex adapter smoke: passed
Skill pattern refs present: yes
Cleanup remaining marker count: 0
```

## What This Proves

- DB-backed Codex adapter smoke/readback renders skill hints with retained
  pattern refs.
- The smoke will fail if the skill-routing pattern ref disappears from the
  rendered brief.
- The smoke still does not invoke Codex and cleans up its marker rows.

## What This Does Not Prove

- Automatic skill selection.
- That Codex will follow the hint.
- Pattern ranking quality.
- Product readiness.

## Source-To-Decision

- Source: V278 adapter skill routing dogfood and current DB-backed adapter
  smoke.
- Mechanism: DB-backed smoke is the strongest local proof that persisted KRN
  state can be rendered into a bounded Codex execution brief.
- KRN implication: retained pattern refs should survive the persisted
  plan/readback/render path, not only unit renderers.
- Decision: add `renderedSkillPatternRefs` to the smoke proof.
- Consumer: future Codex adapter and skill-routing work.
- Falsifier: adapter smoke can pass while rendered skill hints omit retained
  pattern refs.

## Next Task

V280 should re-gate pattern brain readiness after V275-V279 and pick the next
highest-ROI product slice.
