# MM-02 Audit Baseline

Date: 2026-06-22

Slice: MM-02 — Establish repo audit baseline.

Objective: record the current repository, DB readiness, forbidden surfaces,
package boundaries, and not-built list before adding AuditBundle contracts.

Intended files:

- `docs/plans/memory-ideal-state/AUDIT_BASELINE.md`
- `docs/plans/memory-ideal-state/PLAN.md`

Non-goals:

- no runtime behavior;
- no DB schema or migration;
- no CLI command;
- no worker;
- no dashboard/API/MCP server/plugin;
- no source crawler;
- no Research Foundry or Pattern Vault;
- no runtime markdown memory or `.krn` runtime truth.

## Repository State

Current branch state at baseline capture:

```txt
## main...origin/main [ahead 18]
?? docs/materials/2026-06-22-big-brain-part-2.md
?? docs/materials/2026-06-22-big-brain.md
```

Latest commits:

```txt
c38eaff docs(memory): add controlled memory brain execution plan
acca6d2 feat(core): add observational memory domain contracts
80f9ef9 docs(memory): add observational memory ideal-state ADR and ledger
a049e1e docs(plan): add memory ideal-state follow-up goal
7fb2b53 docs(handoff): update target repo init-connect status
```

The two `docs/materials/2026-06-22-*` files remain raw quarry and are not part
of runtime truth.

## Workspace Packages

Current package set:

- `packages/core`
- `packages/schema`
- `packages/db`
- `packages/harness`
- `packages/codex-adapter`
- `packages/cli`
- `packages/workers`

Current package boundary status:

- `packages/core`: pure domain package with tests; no DB/CLI/Codex runtime
  dependency.
- `packages/schema`: Zod IO schemas.
- `packages/db`: Drizzle schema, migrations, repositories, DB adapters.
- `packages/harness`: activation/compiler/context assembly.
- `packages/codex-adapter`: Codex brief and hook-expectation rendering.
- `packages/cli`: terminal commands and runtime DB adapter surface.
- `packages/workers`: maintenance job definitions/skeletons, not a broad
  daemon runtime.

Boundary scan note:

- A broad source scan found one allowed test fixture import:
  `packages/harness/src/activation/noisyBrainFixture.test.ts` imports
  `node:fs` to read a fixture.
- No `any`, `as any`, or `as unknown as` matches were found in KRN source
  package scans used for this baseline.

## DB Readiness

Command:

```sh
KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm db:ready
```

Result:

```txt
Postgres config: configured
Postgres: reachable
Migrations expected: 8
Migrations applied: 8
Migrations: applied
pgvector: available
Brain store readiness: ready
```

Current migrations:

```txt
packages/db/src/migrations/0000_optimal_wrecker.sql
packages/db/src/migrations/0001_superb_jetstream.sql
packages/db/src/migrations/0002_shocking_post.sql
packages/db/src/migrations/0003_mushy_shinko_yamashiro.sql
packages/db/src/migrations/0004_cool_toro.sql
packages/db/src/migrations/0005_young_outlaw_kid.sql
packages/db/src/migrations/0006_lucky_ken_ellis.sql
packages/db/src/migrations/0007_conscious_scarlet_witch.sql
```

## Doctor Baseline

Command:

```sh
KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn doctor
```

Key results:

- Postgres configured and reachable.
- pgvector available.
- migrations verified: 8/8 applied.
- Brain store readiness: ready.
- Harness persistence readiness: ready.
- Source graph readiness: ready.
- Memory governance readiness: ready.
- Retrieval substrate readiness: ready.
- Activation readiness: ready.
- Codex adapter readiness: ready.
- Worker job readiness: ready.
- Target repo readiness: ready.
- Runtime markdown memory: absent.
- Automatic memory mutation: absent.
- Source crawler/research layer: absent.
- Separate graph DB: absent.
- Separate vector/search DB: absent.
- Naive RAG dump command: absent.
- KRN MCP server: absent.
- Redis/Kafka queue: absent.
- Broad worker daemon: absent.
- `.krn` runtime truth: absent.
- Forbidden surfaces: absent.

## Forbidden Surface Baseline

Directory scan command:

```sh
find . -path './node_modules' -prune -o -path './.git' -prune -o \( \
  -path './packages/research-foundry' -o \
  -path './packages/pattern-vault' -o \
  -path './packages/research' -o \
  -path './packages/patterns' -o \
  -path './packages/source-crawler' -o \
  -path './packages/crawler' -o \
  -path './packages/vector-db' -o \
  -path './packages/graph-db' -o \
  -path './packages/neo4j' -o \
  -path './packages/qdrant' -o \
  -path './packages/elastic' -o \
  -path './apps' -o \
  -path './.krn' -o \
  -path './memory' -o \
  -path './memories' -o \
  -path './.memory' \
\) -print
```

Result: no matches.

Forbidden dependency scan command:

```sh
rg -n '"(redis|ioredis|kafkajs|@upstash/redis|qdrant|neo4j-driver|@elastic/elasticsearch|lancedb)"' package.json packages/*/package.json
```

Result: no matches.

## Current Not-Built List

Not built as runtime/product behavior:

- AuditBundle domain/schema/persistence.
- `krn audit repo`.
- `krn audit slice --since <ref>`.
- observation DB/runtime/CLI/repository implementation.
- `krn observe --run <id>`.
- reflection/dreaming implementation.
- `krn reflect --scope ...`.
- MemoryEval/golden memory behavior runner.
- `krn eval run --golden`.
- dashboard UI/read models.
- API/MCP server.
- plugin package.
- broad worker daemon.
- source crawler.
- broad eval suite.
- Research Foundry.
- Pattern Vault.
- meta-researcher runtime.
- autoresearch product loop.
- runtime markdown memory.
- `.krn` runtime truth.
- separate vector/graph/search DB.
- Redis/Kafka.

Pre-plan note:

- `acca6d2` added pure observation domain contracts in `packages/core`.
  Controlled MM-08 remains unchecked until that slice audits and reconciles
  those contracts against `docs/plans/memory-ideal-state/PLAN.md`.

## Verification Captured For Baseline

Commands run:

```sh
pnpm --version
pnpm typecheck
pnpm test
KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm db:ready
KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn doctor
git diff --check
```

Results:

- `pnpm --version`: `10.32.1`
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed across 30 files and 139 tests.
- `pnpm db:ready`: passed with 8/8 migrations and pgvector available.
- DB-aware `krn doctor`: passed; forbidden surfaces absent.
- `git diff --check`: passed.

## Next Baseline Use

MM-03 should add pure AuditBundle contracts using this baseline as the first
manual example of the evidence that later audit bundles must capture
automatically.
