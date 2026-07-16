# Controlled User-Creation Target

Work only inside this materialized target.

Allowed writes:

- `src/**`
- `tests/**`
- `docs/**`

Forbidden actions:

- modifying a parent or unrelated repository;
- reading secrets or generated host caches;
- using the network;
- committing or publishing changes.

Read `docs/repair-contract.md`, make the smallest complete repair, and preserve
the package shape. Run `pnpm test` and `pnpm typecheck` before finishing.

Report changed files, command outcomes, what the checks prove, and what they do
not prove. Do not claim broader product readiness.
