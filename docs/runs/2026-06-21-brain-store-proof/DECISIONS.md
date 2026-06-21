# Decisions

- Adopt M20 as the current `GOAL.md`; M19 remains completed at commit
  `4b86738`.
- Preserve the existing first-spine architecture: PostgreSQL with pgvector,
  Drizzle migrations, Zod IO boundaries, CLI as adapter, and no dashboard/API.
- Use `KRN_DATABASE_URL` as the canonical runtime configuration variable unless
  Slice 01 inventory proves a better existing contract.
- Keep run proof in `docs/runs/2026-06-21-brain-store-proof/`; do not create
  `.krn` runtime truth or markdown memory.
- Correct `docs/handoff/HANDOFF.md` references to lowercase
  `docs/handoff/handoff.md` to match the normalized repo structure.
- Require the matching repo-local operational skills in `GOAL.md` for this
  goal: `brain-store-schema`, `target-infra-adr`, `typescript-type-safety`, and
  `handoff-compact`.
- Keep `KRN_DATABASE_URL` as the canonical DB runtime variable. Current code
  already uses it in `krn plan`, `krn doctor`, and `krn evidence capture`.
- Treat existing migrations as generated schema artifacts, not live runtime
  proof. M20 still needs a command that applies or verifies them against a
  reachable DB.
- Treat doctor migration status as incomplete until it checks more than the
  existence of `__drizzle_migrations`.
