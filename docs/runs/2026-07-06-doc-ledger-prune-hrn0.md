# Docs Ledger Prune Hrn0

Date: 2026-07-06

Bead: `mise-en-palace-hrn0`

## Change

Removed the old markdown ledger layer that was still keeping historical
run/review reports alive:

- deleted `docs/plans/historical-ledgers/`;
- deleted 116 newly unowned `docs/reviews` / `docs/runs` files;
- deleted 1 unowned `.diff` artifact;
- refreshed `docs/inventory/2026-07-06-doc-owner-inventory.json`;
- updated `docs/README.md` counts.

## Counts

| Metric | Before x3i1 | After x3i1 | After hrn0 |
| --- | ---: | ---: | ---: |
| `docs/` files | 809 | 572 | 454 |
| `docs/` markdown files | 769 | 531 | 414 |
| `docs/reviews` files | 393 | 311 | 204 |
| `docs/runs` files | 272 | 116 | 108 |
| `docs/plans` files | 17 | 17 | 14 |

## Remaining Evidence Surface

The refreshed inventory reports:

- 134 active exact-path evidence refs;
- 164 historical-only exact-path refs;
- 14 current-day exact-unowned run reports;
- 0 unexpected exact-unowned historical files.

## Next Cleanup Direction

The remaining markdown reports should not become the brain memory layer. The
next cleanup should replace active `docs/.../REPORT.md` evidence refs in tests,
fixtures, and retained-pattern JSON with compact evidence IDs backed by the
decision/import corpus or DB read models, then delete the reports that become
unowned.

## Proves

- Historical ledger snapshots are no longer an active docs owner.
- Exact-unowned historical docs have been removed after the ledger cut.
- The docs tree is materially smaller without creating archive payloads.

## Does Not Prove

- The remaining 453 docs files are all necessary.
- Active fixture/test evidence refs are already compact enough.
- Markdown has been eliminated as a retained pattern/source seed surface.

## Verification

```sh
pnpm docs:lint
pnpm quality:fallow:ci
git diff --check
```
