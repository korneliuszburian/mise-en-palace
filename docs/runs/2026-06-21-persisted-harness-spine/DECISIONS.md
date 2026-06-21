# Decisions

- Use `docs/runs/2026-06-21-persisted-harness-spine/` as the compact M21 run
  ledger. This is audit/handoff material only, not runtime Memory Core.
- Treat `a312afe docs(goal): define persisted harness spine` as the M21 start
  commit.
- Keep `--persist` as the explicit write boundary for M21. Existing preview or
  no-store command behavior must keep working when `KRN_DATABASE_URL` is absent.
- Enforce repo-local skills from `GOAL.md` when their triggers apply. Record
  both used and intentionally unused skills in the run ledger.
- Do not add dashboard, API, MCP server, broad workers, research layer, runtime
  markdown memory, `.krn` runtime truth, separate vector/graph/search/queue
  store, full MemoryStore, full SourceStore, or broad eval suite in M21.
- M21 should stay inside the existing Postgres/Drizzle boundary unless a future
  finding proves a new durable surface is required. If that happens, stop and
  use `target-infra-adr` before implementation.

Slice 00 skill record:

- `codex-adapter-plan`: used for the GOAL/skill-gate update before Slice 00.
- `evidence-review-loop`: used for preflight command evidence and ledger shape.
- `brain-store-schema`: not used yet; required before schema/repository work.
- `typescript-type-safety`: not used yet; required before TypeScript changes.
- `source-to-decision`: not used yet; required before source-backed decisions.
- `handoff-compact`: not used yet; required for final or paused handoff.
- `target-infra-adr`: not used; no new durable surface in Slice 00.
- `activation-engine`: not used; no activation behavior change in Slice 00.
