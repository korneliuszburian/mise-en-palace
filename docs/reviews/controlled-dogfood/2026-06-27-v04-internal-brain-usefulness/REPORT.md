# V04 Internal Brain Usefulness Re-Gate

Status: complete validation report.
Date: 2026-06-27.

## Executive Verdict

V04 made KRN materially more useful for our own Codex workflows. The improvement
is not that KRN became product-ready or autonomous; it is that KRN now has a
repeatable internal improvement loop with scenario discipline, condensation
decisions, compact skills, deterministic guards, source-backed surface
screening, and CI-confirmed verification. KRN remains controlled-internal-alpha
for technical operators. V02-01 real second-operator proof remains blocked and
must not be replaced by these self/headless runs.

## Scope

V04 objective:

```txt
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> durable surface or bounded repair
  -> next scenario
```

Primary evidence:

| Evidence | Purpose |
|---|---|
| `docs/plans/v04-internal-brain-utility/PLANS.md` | Long-run V04 ExecPlan and live progress ledger. |
| `docs/architecture/controlled-scenario-factory.md` | Minimal scenario contract and condensation gate. |
| `docs/architecture/skill-first-krn.md` | Skill-first architecture decision. |
| `.agents/skills/target-repo-testing/SKILL.md` | Durable target-repo testing workflow. |
| `packages/cli/src/targetRepoTestingSkill.test.ts` | Deterministic guard for target repo testing skill boundary. |
| V04-SC-001 through V04-SC-004 reports | Scenario evidence across DB, KRN repair, target observation, and evidence-review skill reuse. |
| `docs/reviews/controlled-dogfood/2026-06-27-v04-compression-screening/REPORT.md` | AGENTS/skill compression, hook/MCP/subagent screening, internal utility metrics. |

## Completion Review

| Requirement | Verdict | Evidence |
|---|---:|---|
| Compact root `PLAN.md` and `GOAL.md` record V04 state | met | Root files point to detailed V04 ExecPlan and keep V02-01 deferred. |
| Dirty governance/runbook/report state reconciled | met | Commit `9849754`, CI run `28273097780`; target report corrected to avoid claiming target repair. |
| At least one concrete product friction repaired or rejected | met | DB smoke fresh DB idempotency rejected as current repair in V04-SC-001 after CI/local/scratch DB proof. |
| Minimal controlled scenario contract exists | met | `docs/architecture/controlled-scenario-factory.md`. |
| Knowledge condensation gate exists and is used | met | Scenario factory plus V04-SC-001 through V04-SC-004 reports. |
| At most two repo skills/stable workflow surfaces improved | met | `target-repo-testing` added; existing `evidence-review-loop` explicitly reused, not duplicated. |
| At least six scenarios planned | met | V04 scenario batch plan lists V04-SC-001 through V04-SC-006. |
| At least four scenarios executed/replayed | met | V04-SC-001 through V04-SC-004 reports. |
| Coverage includes KRN repair, DB replay, target observation, skill/evidence loop | met | V04-SC-002, V04-SC-001, V04-SC-003, V04-SC-004. |
| Every executed scenario has proof/non-proof and condensation decision | met | Four scenario reports include command proof and condensation decisions. |
| At least two findings condensed into durable surfaces | met | Scenario factory/condensation gate; `target-repo-testing` skill; deterministic skill guard. |
| At least one deterministic guard added from evidence | met | `targetRepoTestingSkill.test.ts`. |
| At least two bounded product repairs or fewer-safe-repairs rationale | met | Target repo testing skill/guard; scenario/condensation factory; DB smoke repair rejected by current proof. |
| Internal brain usefulness re-gate report exists | met | This report. |
| Final verification passed | met locally; CI for this final report pending until pushed | Command evidence below. |
| Worktree clean and branch pushed | pending for this final report until commit/push/CI | Must be checked after commit. |

## What Improved

- Scenario discipline improved: V04 now requires mode, allowed writes,
  forbidden writes, expected evidence, proof/non-proof, stop conditions, and
  condensation target.
- Knowledge condensation improved: high-risk target repo testing moved from long
  reports/runbook text into a repo skill plus deterministic guard.
- Target repo safety improved: living dirty target repos now default to
  observation-only unless target writes are explicitly authorized.
- Evidence/review workflow stayed compact: existing `$evidence-review-loop` is
  reused instead of creating a duplicate surface.
- Surface restraint improved: hooks, MCP, and subagents are deferred with
  source-backed falsifiers rather than built speculatively.
- Resume/compact resilience improved: `GOAL.md`, `PLAN.md`, and the V04 ExecPlan
  say how to resume the active slice after context loss.

## What Did Not Improve Enough

- Product readiness is still not proven.
- V02-01 second-operator usability is still blocked/deferred.
- Target-aware evidence capture remains a candidate, not implemented.
- Activation/memory usefulness did not materially advance in V04; V04 focused on
  process/condensation usefulness.
- Hooks/MCP/subagents remain unbuilt by design.

## Internal Brain Utility Verdict

```txt
controlled-internal-alpha for technical operators: stronger
internal brain utility for our own workflows: improved
product-ready: no
widened internal alpha: no
V02-01 second-operator proof: still blocked/deferred
```

V04 is successful as an internal brain utility goal because it converted repeated
findings into durable surfaces and reduced future context waste without adding a
dashboard, MCP server, worker daemon, broad eval platform, agent zoo, or runtime
markdown memory.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm typecheck` via `rtk proxy pnpm typecheck` | passed | All workspace TypeScript packages compile. | Product readiness. |
| `pnpm test` | passed | Workspace tests pass: core, schema, harness, workers, codex-adapter, db, cli. | Arbitrary target repo safety. |
| `pnpm db:ready` | passed | Local Postgres was reachable with 14/14 migrations and pgvector available. | Future shell DB state. |
| `pnpm db:smoke` | passed | Local generic DB persistence smoke passed and cleaned up. | Every named DB smoke target. |
| `pnpm eval:brain-battle:smoke` | passed | Existing deterministic brain-battle smoke surfaces pass. | Full brain quality. |
| `pnpm eval:promptfoo:smoke` | passed | Promptfoo adapter smoke ran 2/2 cases successfully. | Promptfoo as behavior authority. |
| `git diff --check` | passed | Current diff has no whitespace errors. | Semantic correctness. |
| CI runs `28273514668`, `28273567791`, `28273709344`, `28273818047` | passed | Pushed V04 slices passed GitHub Actions with typecheck/tests/eval smoke and DB job. | CI for this final report until pushed. |

## Condensation Decisions

| Finding | Decision | Durable surface |
|---|---|---|
| DB smoke fresh DB idempotency failure did not reproduce | reject source repair now | V04-SC-001 report |
| Target repo testing needs strict write/dirty-state handling | accept | `target-repo-testing` skill + deterministic guard |
| Evidence-review workflow already exists | reject duplicate skill, reuse current skill | V04-SC-004 report |
| Hooks/MCP/subagents not justified by current evidence | defer/reject implementation now | V04 compression screening report |
| Target-aware evidence capture remains useful | defer to future bounded repair | V04-SC-005 planned candidate |

## Next Recommended Goal

Do not start dashboard, MCP, subagents, worker runtime, or broad eval work next.

Best next bounded goal:

```txt
V05: Target-Aware Evidence Capture Repair
```

Reason:

- V04-SC-003 confirmed repeated/high-risk target dirty-state evidence.
- Current KRN evidence capture classifies KRN repo changes, not target repo
  dirty files.
- This is a concrete product gap that blocks cleaner target trials without
  requiring a new product layer.

Alternative:

```txt
Run real V02-01 when second-operator inputs are available.
```

Do not fake it with another local/headless run.

