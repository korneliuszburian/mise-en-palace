# Anti-Rot Audit

Date: 2026-06-22

Scope: M27 target repo init/connect dogfood after Slice 11.

## Commands

```sh
git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-plan
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-evidence
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:source-graph
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:memory-governance
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:retrieval-substrate
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:activation
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:codex-adapter
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:worker-jobs
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:init-connect
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:target-repo-harness
find . -path './node_modules' -prune -o -path './.git' -prune -o \( -path './apps' -o -path './packages/api' -o -path './packages/dashboard' -o -path './packages/mcp-server' -o -path './packages/krn-mcp-server' -o -path './packages/source-crawler' -o -path './packages/crawler' -o -path './packages/research' -o -path './packages/vector-db' -o -path './packages/graph-db' -o -path './packages/neo4j' -o -path './packages/qdrant' -o -path './packages/elastic' -o -path './.krn' -o -path './memory' -o -path './memories' -o -path './.memory' \) -print
rg -n '"(redis|ioredis|kafkajs|@upstash/redis|qdrant|neo4j-driver|@elastic/elasticsearch|lancedb)"' package.json packages/*/package.json
rg -n "from ['\"]node:|from ['\"]fs|from ['\"]node:fs|child_process|postgres|drizzle" packages/core/src packages/core/package.json
git diff --check
```

## Results

- `git status --short --branch`: branch `main...origin/main [ahead 12]`;
  only user-owned dirty context remains outside commits:
  modified `GOAL.md` and untracked
  `docs/materials/2026-06-22-big-brain*.md`.
- `git log --oneline -20`: latest M27 commits are
  `0dc761c`, `0bca19c`, `462486a`, `cf33aaa`, `c94888e`, `0ee6979`,
  `a353e9e`, `764a8eb`, `2c8076d`, `6f85894`, `29e469a`, and `0de15dd`.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed across 29 test files and 134 tests.
- DB-aware `krn doctor`: passed; target repo readiness is
  `ready (init-connect smoke proven; target repo harness smoke proven)`.
- `pnpm db:ready`: passed; 8 expected migrations, 8 applied, pgvector
  available, brain store ready.
- `pnpm db:smoke`: passed.
- `pnpm db:smoke:harness-plan`: passed; cleanup remaining marker count `0`.
- `pnpm db:smoke:harness-evidence`: passed; cleanup remaining marker count `0`.
- `pnpm db:smoke:source-graph`: passed; cleanup remaining marker count `0`.
- `pnpm db:smoke:memory-governance`: passed; cleanup remaining marker count
  `0`.
- `pnpm db:smoke:retrieval-substrate`: passed; cleanup remaining marker count
  `0`.
- `pnpm db:smoke:activation`: passed; cleanup remaining marker count `0`.
- `pnpm db:smoke:codex-adapter`: passed; cleanup remaining marker count `0`;
  Codex invocations `0`.
- `pnpm db:smoke:worker-jobs`: passed; cleanup remaining marker count `0`.
- `pnpm db:smoke:init-connect`: passed; Project
  `d20fc1ae-2684-4657-9c4d-6c88341c739d`, RepoInstallation
  `db0247cb-ffb0-4008-8596-99e693854281`, ProjectKernel
  `7c030d09-9eb0-480b-80a0-671f37995760`, cleanup remaining marker count `0`.
- `pnpm db:smoke:target-repo-harness`: passed; Project
  `099a9bbf-c034-4702-bbc5-48f4b3749657`, RepoInstallation
  `b203e4fb-6f20-44eb-93f5-96125868bbe5`, ProjectKernel
  `66cbc110-f165-4e1b-969c-a2d99abed3d7`, ExecutionRun
  `ece37032-cb48-477d-bc41-07eb2e742a99`, EvidenceBundle
  `3f2e3e66-5ae2-4077-a031-f0ad5ddb5572`, ReviewAssessment
  `1e5da2b3-c228-4fda-ad02-7e854e4af359`, FeedbackDelta
  `5dc98ce6-afa6-4a06-9241-700f4d45c79f`, target project linked `yes`,
  cleanup remaining marker count `0`.
- Forbidden directory scan printed no matches.
- Forbidden dependency scan printed no matches.
- Core library-safety scan printed no Node/DB runtime imports.
- `git diff --check`: passed.

## Anti-Rot Conclusions

- No dashboard, `apps/`, public API, MCP server, broad worker runtime, research
  layer, source crawler, runtime markdown memory, `.krn` runtime truth,
  separate vector/graph/search store, Redis/Kafka, or broad eval suite exists.
- Core remains library-safe for this audit.
- All smoke cleanup counts that report marker counts are `0`.
- M27 target repo proof is not blocked by anti-rot findings.
