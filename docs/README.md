# KRN Docs Map

Status: docs inventory and context-routing map. Date: 2026-07-06.

## Canonical Reading Order

Default context is small:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `docs/KRN_BRAIN.md` only when the target brain architecture matters
4. `GOAL.md`
5. `PLAN.md`
6. Beads for durable task state

Everything else is evidence, archive, raw material, or a focused reference. Do
not load broad history unless the active `PLAN.md`, a Beads issue, or a failing
test names the file.

## Inventory

Current count:

```txt
docs files: 809
docs markdown files: 769
root markdown files: 6
docs/reviews files: 393
docs/runs files: 272
docs/materials files: 7
```

Root markdown files after this cleanup:

```txt
AGENTS.md
CLAUDE.md
GOAL.md
PLAN.md
PLANS.md
README.md
```

## Directory Decisions

| Path | Decision | Reason |
| --- | --- | --- |
| `docs/architecture/` | keep focused | Active architecture references and behavior matrices. |
| `docs/decisions/` | keep focused | ADR-style retained decisions. |
| `docs/runbooks/` | keep focused | Operational runbooks used by agents/operators. |
| `docs/standards/` | keep focused | Code, commit, and TypeScript standards. |
| `docs/brain-knowledge/` | keep focused | Retained catalog and usefulness feedback seed data. |
| `docs/patterns/` | keep focused | Pattern intake and reference recipe material. |
| `docs/runs/` | keep as historical evidence | Many reports are evidence refs for current tests/readbacks. Not default context. |
| `docs/reviews/` | keep as historical evidence | Many controlled-dogfood reports are evidence refs. Not default context. |
| `docs/materials/` | keep quarantined | Raw source/audit material. Never default context. |
| `docs/plans/` | keep historical | Archived detailed planning material; root `PLAN.md` owns current execution truth. |
| `docs/archive/` | keep archive | Historical root docs and compacted ledgers. |
| root `REVIEW.md` | archived | Historical pointer moved to `docs/archive/root-docs/2026-07-06-review-pointer.md`. |
| root `GOAL_REPO_RESET_AUDIT.md` | archived | Historical pointer moved to `docs/archive/root-docs/2026-07-06-goal-repo-reset-audit-pointer.md`. |

## Deletion Rule

Do not delete `docs/runs/` or `docs/reviews/` files just because they are old.
They may be evidence refs in tests, source decisions, feedback records, or brain
knowledge. Delete only when a focused grep proves no active source, fixture,
test, Beads issue, or docs map references the artifact.

## Proof Boundary

This map proves where default context should come from and which large docs
zones are historical. It does not prove the old reports are all useful, current,
or worth keeping forever.
