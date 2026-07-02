# Codex Adapter Proof Hardening

Date: 2026-07-02

## Summary

Hardened the Codex adapter DB smoke proof by replacing brittle brief-string and
magic-count checks with typed brief assertions where the fixture has seeded
authority.

The smoke still proves only adapter rendering and persisted readback. It does
not invoke Codex and does not prove Codex follows the rendered brief.

## Changed

- Exported `skillRoutingPatternRef` from `@krn/codex-adapter`.
- `db:smoke:codex-adapter` now proves skill pattern refs through typed
  `brief.skillBindingHints[].patternRefs`, with rendered text checked only as
  projection evidence.
- Replaced source/memory lower-bound and upper-bound proof checks with exact
  seeded ID checks:
  - the accepted smoke `SourceClaim` is the only `sourceClaimsUsed` item;
  - the bounded active `MemoryRecord` is the only `memoryRecordsUsed` item.
- Replaced `hookExpectations.length >= 5` with exact `codexHookPhases` ordering.
- Updated the codex-adapter contract fixture to include `patternRefs`.
- Aligned the Codex adapter smoke formatter test with real smoke output:
  `Anti-memory warnings: 0`.
- Added `Codex adapter runtime proof` as a separate doctor check.
- Codex adapter doctor readiness now reports `ready` only when runtime proof is
  explicitly proven. With DB configured but no consumed proof marker, it reports
  `runtime unverified (run pnpm db:smoke:codex-adapter)`.

## Source To Decision

```yaml
source_id: repo-local-codex-adapter-proof-audit
source: Beads issue mise-en-palace-97a8 plus read-only subagent audit
mechanism: brittle proof used renderedBrief.includes for a hard-coded skill pattern and magic count thresholds for source/memory/hook fields.
krn_implication: Codex adapter readiness should be grounded in typed ExecutionBrief fields and seeded fixture IDs before text-rendering presence checks.
decision_kind: adopt
decision: keep the smoke non-executing, but make proof checks typed and fixture-specific where possible.
consumer: db:smoke:codex-adapter, KRN CI DB smoke, Codex adapter proof boundary
falsifier: DB smoke passes while the seeded accepted SourceClaim or active MemoryRecord is missing from the typed brief, or hook phases drift without failure.
```

## Proof

- `rtk pnpm --filter @krn/codex-adapter test -- renderSkillHints contracts renderExecutionBrief codexBriefGoldenBehavior`
- `rtk pnpm --filter @krn/cli test -- codexAdapterSmoke runCli`
- `rtk pnpm --filter @krn/cli test -- doctorDbChecks doctorReadiness runCli codexAdapterSmoke`
- `rtk pnpm -C packages/codex-adapter typecheck`
- `rtk pnpm -C packages/cli typecheck`
- `rtk pnpm db:ready`
- `rtk pnpm db:smoke:codex-adapter`
- `rtk pnpm krn doctor`
- `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor`
- `rtk proxy pnpm typecheck`
- `rtk pnpm test`
- `rtk pnpm quality:fallow:ci`
- `rtk pnpm eval:brain-battle:smoke`
- `rtk git diff --check`

## Non-Proof

- This does not invoke Codex.
- This does not prove Codex obeys the rendered brief.
- This does not add a provider abstraction or rename `@krn/codex-adapter`.
- This does not change DB schema, activation ranking, source authority, or
  execution-brief profile behavior.
- This does not prove anti-memory warnings are selected in this fixture; the
  current smoke output reports zero anti-memory warnings.
- Doctor still does not run `db:smoke:codex-adapter` automatically or persist a
  durable proof marker; it reports the current runtime-proof boundary.

## Second-Opinion Prompt

Review the current diff after
`docs/runs/2026-07-02-codex-adapter-proof-hardening.md`.

Act as a ruthless senior reviewer. Inspect whether the Codex adapter smoke proof
is now genuinely stronger or merely renamed: verify that skill pattern refs are
proven from typed `ExecutionBrief.skillBindingHints`, that the accepted
SourceClaim and active MemoryRecord are checked by exact seeded IDs, and that
hook expectations are checked against `codexHookPhases`. Challenge any remaining
string-presence checks and decide whether they are acceptable projection
evidence or still proof theater. Confirm that anti-memory warning expectations
are honest after the real DB smoke reports zero warnings. Inspect the new doctor
runtime-proof check and challenge whether `runtime unverified` is the right
boundary, or whether doctor should record and consume actual smoke proof state.
Then propose the next bounded slice: source relation metadata typing, retrieval
ID branding, or a durable Codex adapter proof marker. Include exact files,
risks, verification commands, and non-goals.
