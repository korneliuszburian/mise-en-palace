# QG-00 Repo-Wide Current-State Inventory

Date: 2026-06-23

Head inspected:

```txt
7e0c6b8691c79e4ccba85bae9ac004f2fe63b5ad docs(memory): add blocking quality correction gate
```

Scope: inventory and current-state correction only. No TypeScript source,
schema, migration, runtime, CLI behavior, worker, API, MCP, dashboard, source
crawler, broad eval suite, or memory-promotion behavior was changed in QG-00.

## Verdict

KRN is not a docs-only bootstrap anymore. It is a real Postgres-backed harness
and memory-spine prototype with observation, reflection, governed memory,
activation, audit, and early golden behavior proof surfaces.

The repo is also not clean enough to continue feature work without a quality
correction gate. The current risk is not one specific file or Promptfoo. The
risk is building more Memory Brain behavior on top of unreviewed engineering
surfaces: colocated tests without a recorded topology decision, broad package
barrels, production smoke placeholders, stale status docs, incomplete
dead-code/export scans, and final-tool decisions that are not yet mapped
through source-to-decision.

Feature work stays blocked until QG-01 through QG-06 resolve those surfaces.

## Package Inventory

| Package | Production TS files | Test files | Responsibility | Notable dependencies |
| --- | ---: | ---: | --- | --- |
| `@krn/core` | 30 | 7 | Pure domain contracts and policy helpers for harness, memory, observations, reflection, evidence, evals, and time. | none |
| `@krn/schema` | 12 | 2 | Zod-owned IO parsing/validation for external data and fixtures. | `zod` |
| `@krn/harness` | 39 | 14 | Pure orchestration logic, activation, audit checks, golden runner/export, memory review gate, reflection/observation selectors, repository ports. | `@krn/core` |
| `@krn/db` | 45 | 23 | Drizzle/Postgres schema, migrations, repository adapters, readiness/smoke helpers, DB semantic snapshots. | `@krn/core`, `@krn/harness`, `drizzle-orm`, `postgres` |
| `@krn/codex-adapter` | 7 | 3 | Codex-facing rendering for briefs, goals, exec-plan refs, skills, and hook expectations. | `@krn/core`, `@krn/harness` |
| `@krn/cli` | 26 | 6 | Operator command surface for plan/doctor/evidence/audit/init/observe/reflect/source/memory/review/db smokes. | `@krn/*`, `postgres` |
| `@krn/workers` | 3 | 1 | Bounded worker job contracts/skeleton. | `@krn/core` |

Repository scripts are workspace-rooted and include:

```txt
pnpm typecheck
pnpm test
pnpm db:ready
pnpm db:check
pnpm db:smoke
pnpm db:smoke:*
```

## Current Memory Product State

Implemented and proven in slices:

- Postgres/pgvector canonical brain-store direction.
- DB-backed harness spine, execution runs, evidence bundles, review
  assessments, feedback deltas, source graph, memory governance, retrieval
  substrate, activation substrate, worker-job persistence skeleton, and Codex
  adapter surfaces.
- Observational memory staging through core contracts, schema, DB,
  repository, source-range lineage, deterministic observer input, manual
  observe CLI, dogfood proof, project scoping, redaction, datetime validation,
  and observation prefix selection/integration.
- Reflection staging through pure contracts, schemas, DB table, repository,
  input selector, contradiction/gap reports, manual reflect CLI, no-memory-core
  mutation proof, and dogfood.
- Memory governance through repository invariants, public
  MemoryReviewGate-backed promotion, invalidation, feedback-aware ranking,
  memory health audit, and anti-memory blocking across source claims, memory
  records, linked search documents, and observation prefix items.
- Activation v2 substrate through query model, hybrid candidate merge,
  post-merge filters, ContextROI diversity/dedup, raw evidence recall metadata,
  observation prefix metadata, and explicit abstention metadata.
- Capability, evidence, review feedback, source-to-decision, and golden
  behavior proof primitives through MM-65.

Not yet complete as one final product loop:

```txt
evidence -> observation -> reflection -> candidates -> review -> memory
  -> activation -> golden proof -> audit
```

The loop has many implemented parts, but QG-00 does not certify it as a
finished Memory Core product. The next feature slice remains blocked by QG.

## Current Quality Risks

### 1. Test Topology Is Real But Undecided

Fact:

```txt
packages/*/src/**/*.test.ts
```

is the active pattern. Current counts:

```txt
cli             6
codex-adapter   3
core            7
db             23
harness        14
schema          2
workers         1
```

This may be the right pattern because behavior tests live next to package
logic, package `tsconfig.json` files exclude tests from production `tsc`, and
Vitest owns test execution. But it is still an unrecorded architecture choice.

Required next gate: QG-01 must either adopt colocated tests with enforcement or
move them. The decision must include:

- no production import from test files;
- no test helper export from public package barrels;
- no fixture truth in runtime paths;
- test files reviewed for slop, not skipped by smell audit.

### 2. TypeScript Strictness Exists But Is Not Yet a Full Standard Gate

`tsconfig.base.json` already enables strict options including:

- `strict`;
- `exactOptionalPropertyTypes`;
- `noUncheckedIndexedAccess`;
- `noUnusedLocals`;
- `noUnusedParameters`;
- `isolatedModules`;
- `verbatimModuleSyntax`.

Existing standards:

- `docs/standards/typescript-boundaries.md`;
- `docs/standards/code-vocabulary.md`.

Gap: these are not yet one enforceable repo-wide TypeScript excellence gate.
QG-02 must consolidate the final rules and exact audit commands. The standard
must reflect the intended code style:

- domain-first types;
- narrow unions;
- discriminated unions when state changes by kind/status;
- unknown-first IO boundaries;
- schema-owned parsing;
- `satisfies` for checked literals where useful;
- no unreviewed `any`;
- no broad anonymous object soup at public boundaries;
- no global `ts-reset` in core/public packages;
- helper names that match actual authority.

### 3. Public Export Surface Is Broad

Fact: every package uses broad `export *` package barrels. Examples include:

- `packages/core/src/index.ts`;
- `packages/schema/src/index.ts`;
- `packages/harness/src/index.ts`;
- `packages/db/src/index.ts`;
- `packages/db/src/repositories/index.ts`;
- `packages/cli/src/index.ts`.

This is not automatically wrong for a workspace kernel, but it is not yet
audited as a public API surface. QG-03 must decide which barrels are acceptable,
which modules are internal-only, and whether test-only helpers or smoke
surfaces are leaking as public runtime API.

### 4. Zombie / Dead Code Is Not Proven Absent

Current green tests prove covered behavior. They do not prove:

- every exported symbol has a real consumer;
- every CLI route is reachable and wanted;
- every package script is still useful;
- every compatibility alias is intentional;
- every smoke helper is final architecture rather than stale scaffolding.

QG-03 must choose and run an export/dead-code toolchain or a repo-local
equivalent. Candidate tools to decide through source-to-decision include
`knip`, `ts-prune`, `depcheck`, `publint`, dependency-cruiser, and ESLint.

### 5. Placeholder-Like Production Smoke Code Exists

The scan found production references in DB smoke code:

```txt
packages/db/src/retrievalSubstrateSmoke.ts
```

including `placeholderVector`, `local-placeholder`, and
`placeholder-1536`.

This may be acceptable as deterministic smoke data, but the naming is a smell
because it can normalize temporary vocabulary in production code. QG-04 must
classify it as either:

- accepted deterministic smoke fixture vocabulary, renamed to a final test
  fixture concept; or
- removed/replaced because it is placeholder scaffolding.

QG-04 must scan both production and tests for fake/stub/mock/temp/decorative
patterns and decide case by case.

### 6. Promptfoo Is Only One Tool Decision

MM-65 added a Promptfoo-compatible snapshot export with no Promptfoo
dependency and no model execution. That slice is explicitly not the final eval
architecture.

QG-05 must decide official Promptfoo integration through
source-to-decision. The decision must cover:

- official mechanism;
- KRN implication;
- adopted boundary or rejection;
- falsifier;
- consumer;
- runnable command proof if adopted;
- mapping Promptfoo output back into KRN `BehaviorProof`, `EvalCandidate`, or
  `GoldenTask` evidence.

If official Promptfoo is rejected, MM-65 must be demoted to a compatibility
snapshot or removed. If adopted, a real adapter/runner must replace the current
snapshot-only status as the eval-lane integration surface.

### 7. Docs Truth Is Better But Still Needs a Drift Gate

Current active truth surfaces:

- `AGENTS.md`;
- `docs/KRN_KERNEL.md`;
- `README.md`;
- `GOAL.md`;
- root `PLAN.md`;
- `docs/plans/memory-ideal-state/GOAL.md`;
- `docs/plans/memory-ideal-state/PLAN.md`;
- `docs/handoff/*.md`;
- this QG-00 inventory.

Historical/quarantine surfaces:

- `REVIEW.md` is now explicitly historical and must point to current QG docs;
- `docs/runs/**` are evidence records, not current status;
- `docs/materials/**` are raw source quarantine;
- `tests/fixtures/**` are test/seed fixtures, not runtime truth.

QG-06 must add stale-doc and intended-file audit coverage so a future slice
cannot leave README/GOAL/PLAN/handoff saying mutually incompatible things.

## Forbidden Surface Scan

The QG-00 local scan found no forbidden directories for:

```txt
packages/research-foundry
packages/pattern-vault
apps/dashboard
packages/api
packages/mcp
.krn
```

This does not prove forbidden concepts never appear in docs. It proves the
forbidden product surfaces were not created as repo directories at the current
head.

## Current Non-Goals Still Active

Do not build before the relevant accepted gate:

- dashboard;
- API server;
- MCP server;
- plugin package;
- source crawler;
- Research Foundry;
- Pattern Vault;
- broad autonomous research swarm;
- broad benchmark suite;
- runtime markdown memory;
- separate vector DB;
- separate graph DB;
- Redis/Kafka queue;
- hidden chain-of-thought storage;
- automatic memory mutation from reflection.

## QG Follow-Up Plan

QG-01: decide and enforce test topology.

QG-02: consolidate TypeScript excellence and code vocabulary into an
enforceable standard.

QG-03: run zombie/dead-code/export-surface audit and decide tooling.

QG-04: run code smell/bloat audit across production, tests, fixtures, and docs.

QG-05: adopt or reject official Promptfoo integration through
source-to-decision and runnable proof.

QG-06: extend `krn audit` so these quality gates become automated slice
findings, not prose.

## Verification Evidence

QG-00 preflight:

```txt
git status --short --branch
git log --oneline -8
git rev-parse HEAD
pnpm typecheck
pnpm test
```

Observed:

- branch `main` was aligned with `origin/main`;
- only `docs/materials/2026-06-22-big-brain.md` and
  `docs/materials/2026-06-22-big-brain-part-2.md` were untracked;
- `pnpm typecheck` passed;
- `pnpm test` passed with 56 test files;
- forbidden directory scan returned no forbidden product directories;
- test inventory found 56 colocated test files;
- production TS inventory found 162 production TS files across packages.

