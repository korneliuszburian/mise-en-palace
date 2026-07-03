# Retained Skill Surface Audit

Date: 2026-07-03

## Verdict

Keep the current 10 repo-local skills. They are operational kernel guidance or a
governed review workflow, not runtime authority. No skill deletion is justified
by current evidence.

One stale active proof row was wrong: `docs/architecture/behavior-gate-matrix.md`
still cited `.agents/skills/target-infra-adr/SKILL.md`, but that skill no
longer exists. The row was removed and an invariant now fails on missing
repo-local skill evidence paths in active matrix rows.

## Skill Decisions

| Skill | Class | Decision | Evidence |
|---|---|---|---|
| `activation-engine` | operational kernel | keep | Routes activation/context selection work; guarded by `skillInvariants`. |
| `beads` | operational kernel | keep | Required by `AGENTS.md` Beads workflow and current task tracking. |
| `brain-store-schema` | operational kernel | keep | Routes DB/schema/migration boundaries; guarded by `skillInvariants`. |
| `codex-adapter-plan` | operational kernel | keep | Routes Codex brief rendering boundaries; guarded by `skillInvariants`. |
| `evidence-review-loop` | operational kernel | keep | Routes evidence/proof/non-proof capture and observe-before-reflect ordering; guarded by `skillInvariants`. |
| `handoff-compact` | operational kernel | keep | Routes compact continuation state; guarded by `skillInvariants`. |
| `second-opinion-claude` | governed review | keep | Runs validated, diff-fresh Claude review; referenced by `AGENTS.md`, `GOAL.md`, and runbook. |
| `source-to-decision` | operational kernel | keep | Routes source mechanism, decision, consumer, falsifier, and usefulness closure; guarded by `skillInvariants`. |
| `target-repo-testing` | operational kernel | keep | Routes target mode, dirty state, write authority, and handoff; guarded by `skillInvariants`. |
| `typescript-type-safety` | operational kernel | keep | Routes unknown-first TypeScript boundary discipline; guarded by `skillInvariants`. |

## Delete / Rewrite

- Delete: none.
- Rewrite: none in this slice.
- Active proof cleanup: removed the stale `target-infra-adr` matrix row and
  added missing-skill evidence-path coverage.

## Proof

- `find .agents/skills -maxdepth 3 -type f`
- `rg` over active docs/tests for repo-local skill references
- `pnpm --filter @krn/harness test -- skillInvariants behaviorGateMatrixInvariants`
- `pnpm -w typecheck`
- `pnpm quality:fallow:ci`
- `git diff --check`

## Non-Proof

This does not prove every skill will be useful forever, that Codex always
selects the right skill, or that future brain-backed skills are ready. It proves
only that the current retained skills have explicit operational consumers and
that active behavior-matrix evidence no longer cites a missing skill.
