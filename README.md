# KRN Kernel

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, service/store-backed memory,
source grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

This repository is a kernel workspace and KRN harness implementation, not a
dashboard-first application.

## Start Here

1. Read `AGENTS.md`.
2. Read `KRN_ROADMAP.md`.
3. Read repo-local skills only when the task matches their scope.
4. Use Beads for durable task state when the Beads workspace is available.
5. Treat docs folders as temporary source artifacts, fixtures, or runbooks, not
   the brain.

## Current Truth

`KRN_ROADMAP.md` is the product and architecture roadmap. Beads is the active
task graph. Detailed execution history, outcomes, and next-task synthesis belong
in Beads and verified store/corpus/eval paths, not markdown report forests.

Current status:

- controlled-internal-alpha for technical operators: yes / stronger;
- product-ready: no;
- widened internal alpha: no;
- real second-operator proof: blocked/deferred.

The current work loop is continuous and evidence-driven:

```text
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> rule / skill / guard / eval / memory candidate / source decision / repair
  -> update Beads and store-backed candidates
  -> continue
```

The legacy audit/anti-slop direction remains closed. Do not rebuild it as a
guardrail layer; keep useful Memory/Source/Evidence invariants in their native
mechanisms.

## Built

- Strict pnpm TypeScript workspace with
  `core/db/harness/codex-adapter/cli/maintenance-preview` packages.
- PostgreSQL/pgvector-oriented brain-store schema, migrations, repositories,
  readiness checks, and DB smoke commands.
- CLI surfaces for planning, doctor/readiness, evidence capture, Codex brief
  rendering, init/connect, manual observation, reflection, source, memory, and
  review workflows.
- Legacy AuditBundle domain/IO/repository contracts are removed. Empty legacy
  `audit_bundles` / `audit_findings` tables were dropped by migration `0012`
  after row-count and provenance review.
- Observation core contracts, IO schemas, DB schema, repository adapter,
  evidence/source-range linkage, deterministic observer input builder, manual
  `krn observe --run <id> [--persist]`, and observation prefix selection.
- Reflection contracts, records, input selection, gap/contradiction reporting,
  and manual `krn reflect`.
- MemoryCandidate, MemoryReviewGate, AntiMemory, source graph, activation,
  evidence/review feedback, GoldenTask, and Promptfoo adapter primitives.

## Built But Not Proven End-To-End

- The full loop
  `evidence -> observation -> reflection -> candidates -> review -> memory -> activation -> golden proof`
  is not complete as one governed product path.
- Reflection currently records/report candidates but must not be described as
  autonomous memory mutation or dreaming runtime.
- Worker jobs are persisted contracts/skeletons; production background
  execution is not built.
- Promptfoo is adopted only as a bounded eval runner/result adapter. The local
  Promptfoo smoke proves runner integration and result mapping only; it does
  not prove KRN memory behavior.
- DB package code exists, but live DB runtime truth depends on running DB
  commands in the current shell with `KRN_DATABASE_URL` configured.

## Not Built

- Dashboard.
- API server.
- KRN MCP product server. An internal read-only agent-packet MCP wrapper exists
  only as a transport check over the CLI DecisionPacket contract.
- Plugin package.
- Source crawler or research layer.
- Broad benchmark lane.
- Broad subagent system or runtime agent zoo.
- Runtime memory in markdown or `.krn`.
- Separate vector DB, graph DB, Redis, or Kafka.
- Productized anti-slop subsystem, quality engine, or autonomous audit layer.

## Verification

Common local checks:

```sh
pnpm alpha:verify
```

`pnpm alpha:verify` is the fast local gate: typecheck, tests, and `krn doctor`.
It does not prove Fallow, Promptfoo, KRN behavior/docs smoke, or DB runtime
truth.

Full local verification, when local DB env is configured:

```sh
pnpm alpha:verify:full
```

The full gate aggregates:

```sh
pnpm typecheck
pnpm test
pnpm krn doctor
pnpm quality:fallow:ci
pnpm eval:krn:smoke
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke
pnpm db:smoke:brain-loop
git diff --check
```

For a non-blocking whole-repo hygiene snapshot, run `pnpm quality:fallow:report`;
it writes reports under `.local-lab/fallow/` and does not replace the fast CI
gate.

Do not claim DB runtime truth unless DB commands were run in the current
environment.

Gate proof boundaries are checked by the harness docs-lint manifest in
`packages/harness/src/evalProofBoundaryManifest.ts`. It is not a public
`@krn/harness` runtime API, and no verification command should be described as
proving more than that manifest allows.
