# Internal Alpha Re-Gate After V01

Status: V01-04 completion report.

Date: 2026-06-25
Decision run: `77bcaab6-f63b-453d-8c46-a9bad9de2910`
Evidence bundle: `cc7c54d6-44c8-4950-8b25-e0d656121eb2`
Review assessment: `6a2dc74a-78e4-4e45-bbe9-f4d2c58c6775`
Feedback delta: `bb4a8c10-c2d9-4d2e-a7ab-af3432bce2c2`
Observation group: `308e79bf-e49a-4543-b3bc-e2c041ea417e`
Reflection record: `c456bd75-5572-4359-8fdf-9343d8c1a5bf`
CI run: `https://github.com/korneliuszburian/mise-en-palace/actions/runs/28186557878`
DB available: yes

## Executive Verdict

KRN is now **controlled-internal-alpha ready** for technical operators and
bounded target repos.

This is not product-ready. It is not broad internal-alpha for arbitrary repos.
It is a narrow readiness decision:

```txt
classification: internal-alpha
scope: controlled technical operator trials
distribution: source workspace / existing tag path only
target mode: bounded target repos with explicit trust exclusions
product-ready: no
```

The V01 blocker selected in V01-03 is closed by V01-R01. Project-scoped target
planning now surfaces target read-model candidates and trust exclusions instead
of selecting stale KRN owner-file recall as target context.

Do not move `v0.1.0-alpha.0` or create a new release tag unless the operator
explicitly asks.

## Gate Inputs

| Requirement | Verdict | Evidence |
| --- | --- | --- |
| DB-backed target repo trial | pass with caveats | V01-00 against `muke-v2`; run `a4e487d0-760c-4dd3-b652-c2f84a0f5231`; target commit `05a383e`. |
| Real coding task improved | pass | `@muke/evals` linked surgical proof/domain-error tests and timeout tests repaired; scoped target tests/build passed. |
| Operator-beyond-author proof | partial | V01-01 fresh checkout simulation passed install, `alpha:verify`, DB ready/smoke, and persisted plan; not a real second human. |
| Target trust/redaction | pass for narrow seed, not broad ingestion | V01-02 found current seed acceptable and secret-shaped `.env` files outside seed; broad ingestion remains blocked. |
| Activation/read-model | pass for bounded target roots | V01-R01 final run selected `evals`, target trust exclusions, `AGENTS.md`, `CLAUDE.md`, and `docs`; no stale KRN DB-readiness owner file selected. |
| Evidence/observe/reflect | pass for persistence, weak for reflection value | V01 runs persist evidence, observations, reflections without Memory mutation; reflection still mostly ledger. |
| CI | pass | KRN CI run `28186557878` succeeded for typecheck, tests, Promptfoo smoke, diff check, DB ready, Drizzle check, and DB smoke. |
| Product readiness | fail / not claimed | Multiple target repos, hosted install, stronger operator UX, exact file recall, memory usefulness at scale, and reflection quality remain unproven. |

## Why This Clears Controlled Internal Alpha

The previous G-03 gate deferred internal alpha because KRN lacked:

- external target repo evidence;
- operator-beyond-author evidence;
- target trust/redaction evidence;
- target activation/read-model usefulness;
- CI/DB proof strong enough for repeatability.

V01 now supplies enough evidence for a controlled alpha:

- V01-00 proved a tagged alpha can install/connect/plan against a real external
  target and guide a scoped target repair;
- V01-01 proved a fresh clone can run alpha verification and DB commands from
  checked-in docs, though only as a simulation;
- V01-02 bounded trust/redaction by identifying what is safe in current seed
  and what remains forbidden for broad ingestion;
- V01-03 correctly selected activation/read-model repair before release
  re-gate;
- V01-R01 repaired that blocker and proved it with a current-shell DB-backed
  target plan;
- CI passed after the repair.

## Remaining Limits

Internal alpha must keep these constraints:

- no product-ready claim;
- no arbitrary target repo ingestion;
- no source crawler;
- no dashboard/API/MCP/worker runtime;
- no automatic Memory Core mutation;
- no automatic memory/source promotion;
- no npm/global binary distribution;
- no release tag move without operator request;
- target repo work remains bounded by explicit trust exclusions and source
  seed/read-model output;
- a real second-human operator run is still preferred before widening the
  audience.

## Release Scope

Allowed internal-alpha use:

- source-workspace install from the repo/tag path;
- local Docker/Postgres brain store;
- controlled target repo init/connect;
- project-scoped `krn plan --project ... --persist`;
- evidence capture, observe, reflect, run readback;
- dogfood reports and review-gate decisions;
- bounded target source repairs with explicit changed-file evidence.

Not allowed:

- broad target crawling;
- secret-bearing `.env*` ingestion;
- generated `.muke/` state ingestion as source truth;
- product claims from Promptfoo smoke alone;
- autonomous Codex execution;
- worker daemon/background loop;
- dashboard/API/MCP mutation surfaces.

## Command Evidence

| Command / proof | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/harness test -- ownerFileRecall compiler` | passed | V01-R01 activation/compiler behavior has focused test coverage. | Does not prove product readiness. |
| `pnpm --filter @krn/cli test -- runCli` | passed | CLI plan/init paths are covered. | Does not prove all operator UX. |
| `pnpm typecheck` | passed | Strict TypeScript compilation passed locally. | Does not prove runtime correctness. |
| `pnpm test` | passed | Full workspace tests passed locally. | Does not prove target repo quality. |
| `pnpm db:ready` | passed | Local DB was reachable with 14/14 migrations and pgvector. | Does not prove hosted DB readiness. |
| `git diff --check` | passed | V01-R01 diff had no whitespace errors. | Does not prove release readiness alone. |
| GitHub Actions `28186557878` | passed | Remote CI passed fast and DB jobs after V01-R01. | Does not prove human operator usability. |

## Readiness Classification

```txt
not-ready: no
dogfood-only: no
internal-alpha: yes, controlled technical alpha only
product-ready: no
```

## Next Recommended Action

Do not open another source repair from this gate.

Next action should be one of:

1. run a real second-operator controlled alpha trial using the current runbook;
2. if a new release artifact is desired, ask the operator whether to move/create
   an alpha tag;
3. if no second operator is available, make one small runbook friction update
   for V01-01 findings: expected install warnings, expected `alpha:verify`
   runtime, and preview-vs-DB doctor wording.

No giant plan.
