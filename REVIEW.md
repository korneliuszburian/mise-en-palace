# Extended Reviewer Goal

Date: 2026-06-22

Current head when written: `03442ff feat(db): add observation persistence schema`

Purpose:
run a fresh extended review of the current KRN repo state. The extended
reviewer has not audited the repo recently, while the memory-brain line now has
new audit, observation-domain, observation-schema, and observation-DB slices.
This file is the review goal, not implementation scope.

## Current State

KRN is a Codex Operating Layer / AI Engineering Control Plane. Codex executes;
KRN supplies bounded context, service/store-backed memory, source grounding,
policy, skills, eval expectations, traces, review gates, and feedback.

Canonical constraints:

- no dashboard/API/MCP/server/plugin unless a later reviewed slice explicitly
  opens that boundary;
- no source crawler;
- no Research Foundry or Pattern Vault product layer;
- no runtime markdown memory;
- no `.krn` runtime truth;
- no Redis/Kafka;
- no separate vector or graph DB;
- `docs/materials/` is raw source/audit quarantine, not truth.

Memory ideal-state progress:

- MM-00 through MM-10 are complete.
- Next planned slice is MM-11: observation repositories.
- Observational Memory is staging, not Memory Core.
- Observations are not SourceClaims, approved memory, or final truth.
- Reflections and promotion gates are not built yet.

Recent committed slices:

- `ad36518 feat(harness): add memory brain audit checks`
- `400b4c7 feat(cli): add memory brain audit gate`
- `95c9e0c docs(memory): dogfood memory brain audit gate`
- `3eda7a7 feat(core): reconcile observation domain contracts`
- `026a4b9 feat(schema): add observation io schemas`
- `03442ff feat(db): add observation persistence schema`

Raw quarry still untracked and not accepted as truth:

- `docs/materials/2026-06-22-big-brain.md`
- `docs/materials/2026-06-22-big-brain-part-2.md`

## Audit Layer Status

Current audit path:

- pure `AuditBundle` domain contract exists in `packages/core`;
- schema and DB persistence exist in `packages/schema` and `packages/db`;
- deterministic harness audit checks exist in `packages/harness`;
- CLI adapters exist for `krn audit repo` and `krn audit slice`;
- dogfood evidence exists at
  `docs/runs/2026-06-22-memory-brain-audit-dogfood.md`.

Known advisory findings from dogfood:

- existing unchecked `JSON.parse` boundary in
  `packages/cli/src/runDoctorCommand.ts`;
- existing unchecked `JSON.parse` boundary in
  `packages/cli/src/runInitCommand.ts`;
- slice audit can warn about missing handoff until automated handoff/audit
  integration is wired.

These are review inputs, not blockers for MM-10.

## Observation Memory Status

Built:

- pure observation contracts in `packages/core/src/observations`;
- schema-owned Zod IO contracts in `packages/schema/src/observation.ts`;
- Drizzle/Postgres observation staging schema in
  `packages/db/src/schema/observations.ts`;
- migration `packages/db/src/migrations/0009_dusty_tattoo.sql`;
- tables for observation groups, items, source ranges, entity edges, claim
  edges, and feedback events.

Not built yet:

- observation repositories;
- observe-run CLI;
- observer input builder;
- observer worker;
- reflector worker;
- reflection persistence;
- candidate generation;
- candidate promotion gates;
- anti-memory retrieval integration;
- activation prefix selector;
- dashboard/API/MCP boundary.

## Review Goals

1. Verify the current package boundaries and forbidden-surface constraints.
2. Review whether the audit layer is useful, too noisy, or missing critical
   checks after MM-05 through MM-07.
3. Review the observation DB schema before MM-11 repositories bind to it.
4. Check source-range lineage, temporal fields, and project/run/task scoping.
5. Identify stale assumptions since the last extended repo review.
6. Produce prioritized findings with file/line references and suggested next
   slices. Avoid broad rewrites unless a concrete risk requires one.

## Commands To Reproduce Baseline

Run from repo root:

```sh
pnpm typecheck
pnpm test
KRN_DATABASE_URL="${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn}" pnpm db:ready
pnpm --filter @krn/db db:check
pnpm --filter @krn/cli krn audit repo --repo ../.. --json
pnpm --filter @krn/cli krn audit slice --since origin/main --repo ../.. --json
git diff --check
```

If reviewing after a fresh push to `origin/main`, use the pushed commit range or
the latest local branch point instead of `origin/main` for the slice audit.

Forbidden-surface scans:

```sh
rg -n "redis|kafka|neo4j|qdrant|chroma|pinecone|weaviate" package.json packages/*/package.json
rg -n "research-foundry|pattern-vault|runResearch|pattern inspect|pattern promote" packages --glob '!**/*.test.ts'
find . -maxdepth 3 -type d \( -name dashboard -o -name api -o -name mcp -o -name server -o -name plugin -o -name source-crawler -o -name research-foundry -o -name pattern-vault -o -name .krn \)
```

## Review Non-Goals

- Do not implement MM-11 during review.
- Do not add dashboard/API/MCP/server/plugin surfaces.
- Do not add source crawler behavior.
- Do not promote raw `docs/materials/` files into truth.
- Do not build reflection, worker, activation, or Memory Core mutation behavior.
- Do not replace the current Postgres/Drizzle/pgvector direction with a
  separate vector/graph database without a new source-to-decision ADR.
