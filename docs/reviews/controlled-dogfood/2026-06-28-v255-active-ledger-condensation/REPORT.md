# V255 Active Ledger Condensation Report

Status: complete.

Date: 2026-06-28.

## Executive Verdict

V255 condensed root `PLANS.md` from an append-only historical ledger into a
compact active execution ledger. Historical detail was preserved in an archive,
while current state, evidence pointers, readiness status, and the next bounded
tasks remain visible for Codex resume.

This improves KRN brain development speed by reducing context waste and making
the next work explicit: replayable target repair, pattern intake, pattern
enforcement, skills pack re-gate, and future read-model/search planning.

## Scope

Changed:

- `PLANS.md`
- `docs/plans/historical-ledgers/2026-06-28-root-plans-before-v255-active-ledger-condensation.md`
- `docs/reviews/controlled-dogfood/2026-06-28-v255-active-ledger-condensation/REPORT.md`
- `PLAN.md`
- `GOAL.md`

Non-goals:

- no package source changes;
- no new product surface;
- no dashboard/API/MCP/worker runtime;
- no fake product-ready claim;
- no deletion of historical evidence.

## Before / After

| File | Before | After |
|---|---:|---:|
| `PLANS.md` | 20,736 lines | 552 lines |
| Historical archive | none for this slice | 20,736 lines |

Archive:

```txt
docs/plans/historical-ledgers/2026-06-28-root-plans-before-v255-active-ledger-condensation.md
```

## Preserved Active Truth

The compact active ledger preserves:

- controlled-internal-alpha status;
- product-ready status: no;
- widened internal alpha status: no;
- V02-01 second-operator blocker/defer boundary;
- V250..V254 evidence pointers;
- latest pushed commit and CI evidence before this slice;
- next active work queue;
- pattern brain distinction:
  `pattern gate exists != full pattern brain exists`;
- condensation rules for future plan hygiene.

## Pattern Brain Clarification

The project already has pattern brain foundations:

- source-to-decision gate;
- TypeScript standards;
- skills;
- evidence/review loop;
- target fixture and replay substrate;
- candidate reviewability;
- DB-backed run/evidence/readback proof.

The incomplete part is the full continuous loop:

```txt
pattern intake
  -> consumer/falsifier
  -> enforcement/eval
  -> target repair proof
  -> usefulness readback
  -> memory/source/skill candidate
  -> future activation/search/UI read model
```

V255 keeps that distinction explicit so future work does not pretend the full
pattern brain exists before the enforcement loop is proven.

## Condensation Decision

Decision: archive detailed history and keep root `PLANS.md` as a compact active
ledger.

Mechanism: active plan files should route work, not carry every prior slice.
Detailed proof belongs in reports, commits, ADRs, skills, tests, and archives.

Consumer: Codex resume, auto-compact recovery, operator review, future UI/search
read-model work.

Falsifier: root `PLANS.md` again becomes an append-only wall that Codex cannot
read cheaply during active execution.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed, clean before V255 | worktree started clean | no future edits are correct |
| `gh run list --commit b2ccbaf279409f24b01d150dcbecb0f92324b048 ...` | passed, CI success found | previous V254 commit had remote CI success | V255 CI status |
| `wc -l PLANS.md ...archive...` | passed | archive and compact ledger sizes are visible | semantic completeness of condensation |
| `pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants patternChainInvariants` | passed, 30 files / 150 tests | active plan/context guard compatibility | product readiness |
| `git diff --check` | passed | whitespace-safe diff | semantic completeness |

## Next Active Task

V256-00: Run Replayable Target Repair Trial.

Rationale:

V252..V254 created and repaired a normalized TypeScript target substrate, then
made the weak baseline replayable. The next proof is to run the target repair
workflow from the replayable weak baseline, capture evidence, and evaluate
whether KRN enforces selected best patterns rather than merely documenting them.

## What This Proves

- Active ledger condensation is implemented.
- Historical detail is preserved in an archive path.
- The next work queue is compact and explicit.
- Pattern brain status is clarified as partial, with a concrete path to full
  intake/enforcement/readback.

## What This Does Not Prove

- product readiness;
- widened internal alpha;
- real second-operator usability;
- UI/search readiness;
- full pattern brain enforcement;
- target repair replay success.
