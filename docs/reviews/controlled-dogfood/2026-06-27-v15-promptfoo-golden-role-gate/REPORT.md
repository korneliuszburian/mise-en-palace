# V15 Promptfoo / Golden Behavior Role Gate

Status: eval role gate, no implementation.

Date: 2026-06-27.

## Executive Verdict

Promptfoo should remain a bounded integration smoke and result adapter. Golden
behavior tests, DB smokes, package tests, and source-backed reports remain KRN's
current behavior proof surfaces.

Decision:

```txt
Promptfoo role: smoke/result adapter
Golden behavior role: behavior proof
broad eval platform: rejected
new Promptfoo case now: rejected/deferred
product-ready impact: none
next stream: V16 Activation Relevance Evidence Gate
```

## Scope

Read:

- root `package.json`;
- `.github/workflows/ci.yml`;
- `tests/fixtures/promptfoo/krn-golden-smoke.yaml`;
- `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs`;
- `docs/architecture/promptfoo-adapter-boundary.md`;
- `docs/architecture/golden-task-promotion.md`;
- `docs/decisions/ADR-0016-eval-candidates-remain-proposal-only.md`;
- current golden behavior fixture/test surfaces.

Changed:

- no source/config/runbook files.

Non-goals:

- no broad eval platform;
- no dashboard;
- no worker runtime;
- no eval candidate table;
- no Promptfoo authority layer;
- no product-ready claim from green Promptfoo smoke.

## Evidence Table

| Evidence | Finding | Decision |
|---|---|---|
| `package.json` | `eval:promptfoo:smoke` runs Promptfoo over `tests/fixtures/promptfoo/krn-golden-smoke.yaml` and writes local JSONL output. | Keep as smoke. |
| `.github/workflows/ci.yml` | CI runs Promptfoo smoke after typecheck/tests. | Keep as integration check, not readiness proof. |
| Promptfoo fixture/provider | Provider returns `doesNotExecuteKrnBehavior=true`. | Strong boundary: the smoke does not execute KRN behavior. |
| `docs/architecture/promptfoo-adapter-boundary.md` | Promptfoo rows may become non-authoritative `promptfoo_integration_smoke` or proposal evidence; only `krn_behavior_execution` can satisfy GoldenTask proof. | Current docs are correct. |
| `docs/architecture/golden-task-promotion.md` | GoldenTasks require dogfood evidence, protected failure mode, deterministic runner, and proof boundary. | Golden behavior remains behavior authority. |
| ADR-0016 | Eval candidates remain proposal-only; Promptfoo smoke is rejected as eval candidate proof. | Do not add eval table/CLI/platform. |

## Role Decision

Promptfoo can prove:

- CLI dependency/config/provider path works;
- the local Promptfoo fixture can execute;
- JSONL output can be produced for adapter/result evidence;
- CI can run the integration smoke.

Promptfoo cannot prove:

- KRN behavior correctness;
- Memory Brain quality;
- GoldenTask behavior pass;
- product readiness;
- second-operator usability;
- widened internal alpha.

Golden behavior tests can prove:

- a deterministic KRN behavior runner protected a known invariant;
- a GoldenTask case stays valid under package tests;
- promptfoo smoke is not required for a behavior proof.

Golden behavior tests cannot prove:

- arbitrary product quality;
- target repo success;
- second-operator usability;
- broad model behavior.

## Accepted / Rejected Work

| Candidate | Decision | Why |
|---|---|---|
| Keep Promptfoo smoke in CI | accept | It catches config/provider/dependency breakage cheaply. |
| Add Promptfoo behavior authority | reject | Existing provider explicitly does not execute KRN behavior. |
| Add a new Promptfoo case now | reject/defer | No current failing behavior requires Promptfoo rather than golden tests. |
| Build eval platform/dashboard | reject | ADR-0016 and current evidence do not justify it. |
| Keep golden behavior tests as behavior proof | accept | They execute deterministic KRN behavior and protect known invariants. |

## What This Proves

- Promptfoo's current role is explicit and bounded.
- Current docs/config already prevent treating Promptfoo smoke as behavior proof.
- No eval platform work is justified now.

## What This Does Not Prove

- Promptfoo will never be useful for broader workflows.
- Golden behavior tests cover every important product invariant.
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator usability.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk sed ... package.json .github/workflows/ci.yml` | passed | Promptfoo smoke script and CI usage were inspected. | Does not prove product quality. |
| `rtk sed ... tests/fixtures/promptfoo/...` | passed | Promptfoo provider declares `doesNotExecuteKrnBehavior=true`. | Does not prove GoldenTask behavior. |
| `rtk sed ... promptfoo-adapter-boundary.md` | passed | Existing boundary docs explicitly reject Promptfoo as behavior authority. | Does not prove future docs stay aligned. |
| `rtk sed ... golden-task-promotion.md` | passed | GoldenTask promotion policy was inspected. | Does not prove all cases are sufficient. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic completeness. |

## Condensation Decision

```txt
finding:
  Promptfoo already has the correct current boundary: smoke/result adapter, not
  behavior proof.

frequency:
  recurring operator question and CI surface.

candidate_surface:
  role gate report.

decision:
  complete V15-00 as no-implementation gate.

rationale:
  Existing docs/config are aligned; a new Promptfoo case or eval platform would
  add authority without a protected failure.

evidence:
  package script, CI, Promptfoo fixture/provider, promptfoo boundary doc,
  golden task promotion policy, ADR-0016.

does_not_prove:
  product readiness or future eval sufficiency.

falsifier:
  a repeated behavior failure can only be captured through Promptfoo result
  mapping and cannot be protected by existing golden/package tests.
```

## Next Recommended Action

Move to activation relevance evidence gating.

Reason:

V11 still listed activation quality as partial: V06 improved owner-file recall
state, but did not prove ranking/discovery quality. After eval role
clarification, the next highest-ROI product question is whether activation
evidence now supports a bounded repair or continued measurement.
