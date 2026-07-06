# Docs Surface Cleanup

Bead: `mise-en-palace-qqet`

## Outcome

Root historical pointers were moved out of the default root context, and the docs
tree now has a compact routing map at `docs/README.md`.

## Inventory

```txt
docs files: 797
docs markdown files: 757
root markdown files before: 8
root markdown files after: 6
docs/reviews files: 393
docs/runs files: 261
docs/materials files: 7
```

## Decisions

| Surface | Decision | Evidence |
| --- | --- | --- |
| root `README.md`, `AGENTS.md`, `GOAL.md`, `PLAN.md`, `PLANS.md` | keep | Canonical startup, execution, and task truth. |
| root `CLAUDE.md` | keep as compatibility pointer | Already points to `AGENTS.md`; target-repo seed tests still mention `CLAUDE.md`. |
| root `REVIEW.md` | archive | It was only a historical pointer and not active review truth. |
| root `GOAL_REPO_RESET_AUDIT.md` | archive | It was only a historical pointer and not active goal truth. |
| `docs/runs/` | keep as historical evidence | Large but load-bearing: active tests and reports cite run artifacts. |
| `docs/reviews/` | keep as historical evidence | Large but load-bearing: active tests and source/readback evidence refs cite controlled-dogfood reports. |
| `docs/materials/` | keep quarantined | Raw source/audit inputs; explicitly excluded from default context. |

## Proof

Proves:

- root default markdown surface is smaller;
- docs routing now says which files are current truth and which directories are
  evidence/archive/raw material;
- the cleanup avoided deleting evidence refs from active tests/readbacks.

Does not prove:

- every historical report is useful;
- every stale report has been removed;
- runtime behavior changed.

## Verification

```sh
pnpm docs:lint
pnpm test
pnpm -r --workspace-concurrency=1 --if-present typecheck
git diff --check
```
