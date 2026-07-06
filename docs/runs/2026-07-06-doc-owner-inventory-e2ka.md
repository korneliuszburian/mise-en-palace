# Docs Owner Inventory E2ka

Date: 2026-07-06

Bead: `mise-en-palace-e2ka`

## Change

Added a machine-readable owner inventory for historical evidence files:

- `docs/inventory/2026-07-06-doc-owner-inventory.json`

The inventory scopes only `docs/runs/` and `docs/reviews/`. It classifies files
by exact relative-path references from active tracked files and historical docs.

## Counts

| Class | Count |
| --- | ---: |
| Total evidence files | 665 |
| Active exact-path refs | 247 |
| Historical-only exact-path refs | 174 |
| Archive candidates with no exact-path ref | 244 |

## First Batch

The inventory records the first 75 archive candidates under
`archiveCandidateFirstBatch`. These are candidates for the next bounded archive
slice, not deletion proof.

## Proves

- Historical docs can be pruned from evidence, not vibes.
- 244 `docs/runs` / `docs/reviews` files currently have no exact-path owner in
  active or historical tracked files.
- The next archive slice has a deterministic candidate list.

## Does Not Prove

- The 244 archive candidates are safe to delete.
- Prose references without exact relative paths were detected.
- Root docs are globally compact.
- Active docs and Beads are free of future count drift.

## Verification

```sh
pnpm docs:lint
pnpm quality:fallow:ci
git diff --check
```
