# Docs Prune Owned Evidence X3i1

Date: 2026-07-06

Bead: `mise-en-palace-x3i1`

## Change

Removed exact-unowned historical docs from the active tree:

- 240 `docs/runs` / `docs/reviews` files removed;
- no new archive payload retained;
- `docs/inventory/2026-07-06-doc-owner-inventory.json` refreshed to the
  post-prune state;
- `docs/README.md` counts updated.

## Counts

| Metric | Before | After |
| --- | ---: | ---: |
| `docs/` files | 809 | 572 |
| `docs/` markdown files | 769 | 531 |
| `docs/reviews` files | 393 | 311 |
| `docs/runs` files | 272 | 116 |

The delta is not a move into another docs archive. The removed files were
selected from the owner inventory by exact-path non-ownership.

## Still Present

The refreshed owner inventory reports:

- 247 active exact-path evidence refs;
- 155 historical-only exact-path refs;
- 24 remaining exact-unowned candidates, intentionally left because they are
  current 2026-07-06 run reports.

## Proves

- The default docs tree is materially smaller.
- Exact-unowned historical run/review reports were removed rather than moved.
- Active docs now state the smaller inventory counts.

## Does Not Prove

- Every remaining docs file is high value.
- Prose-only references were detected.
- Future cleanup should avoid source-backed checks.

## Verification

```sh
pnpm docs:lint
pnpm quality:fallow:ci
git diff --check
```
