# v0.1 Roadmap Gate Report

Status: roadmap gate report, not product readiness proof.

Date: 2026-06-25
Evaluator: Codex / KRN dogfood
DB available: yes for planning; evidence capture for this report not yet persisted

## Executive Verdict

G-03 correctly deferred internal-alpha readiness. KRN has stronger dogfood infrastructure than before: CI verification, local backup/restore policy, source-workspace alpha packaging, DB-backed plan/evidence/observe/reflect proof, target-module dogfood, and candidate reviewability primitives. It still lacks the evidence needed for internal alpha beyond the author: an external target repo trial, operator-beyond-author proof, target trust/redaction validation, target activation/reflection usefulness, and a re-gate after those findings.

The next active work is therefore not a new product surface. It is a bounded v0.1 evidence sequence starting with `V01-00 — Controlled External Target Repo Trial`.

## Scope

This report converts the deferred internal-alpha gate into a small execution roadmap in root `PLAN.md`.

Inputs:

- `docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-release-gate/REPORT.md`
- root `PLAN.md`
- root `GOAL.md`
- release tag `v0.1.0-alpha.0`
- recent DB-backed KRN-on-KRN dogfood reports

Non-goals:

- no product-ready claim;
- no dashboard;
- no API or MCP server;
- no worker runtime;
- no source crawler;
- no broad eval platform;
- no npm or global binary distribution;
- no automatic memory/source mutation.

## KRN Planning Evidence

KRN plan was run for this gate.

```txt
executionRun: a00eb4db-b4ec-484f-bbda-16fe92b3e9c1
taskContract: 7ea0ab72-819b-4810-b1e5-a6b5bee93cf2
harnessPlan: 4271caea-479a-4442-be0c-3f9d172b2525
contextAssembly: a38207ea-8893-4307-94ec-544e80fffd98
operatorIntent: 9808b615-0e82-4029-9ca7-f3d07ed24307
```

Activation selected broad target/init/connect and evidence guardrails. Source inspection still used the G-03 release gate report directly. This is acceptable for a roadmap gate, but it does not prove target-repo activation quality.

## Roadmap Decision

Root `PLAN.md` now adds:

```txt
Phase V01 — Bounded v0.1 Roadmap After Deferred Internal Alpha Gate
```

The active queue is:

```txt
V01-00 — Controlled External Target Repo Trial
V01-01 — Operator-Beyond-Author Trial
V01-02 — Target Trust And Redaction Trial
V01-03 — Activation And Reflection Usefulness Decision
V01-04 — Internal Alpha Re-Gate
```

This sequence keeps KRN in evidence-gathering mode before new product surfaces.

## Production Blockers

| Blocker | Why it matters | Next task |
| --- | --- | --- |
| External target repo proof | KRN has mostly proven KRN-on-KRN and repo-local target-module work, not external target value. | V01-00 |
| Operator-beyond-author proof | Current usage may depend on author context and repo familiarity. | V01-01 |
| Target trust/redaction evidence | Target repos are untrusted input and may contain secret-shaped data. | V01-02 |
| Target activation/reflection usefulness | Activation/reflection have improved, but target-repo value is unproven. | V01-03 |
| Internal-alpha decision after evidence | Release status must follow target evidence, not roadmap momentum. | V01-04 |

## Later / Lab Work

These remain explicitly out of scope until a later task authorizes them:

- dashboard;
- API;
- MCP mutation tools;
- worker daemon;
- source crawler;
- broad eval platform;
- semantic hook brain;
- Codex execution runner;
- npm publishing;
- global binary distribution.

## Dogfood Brain Usefulness Section

### Selected / Used / Helped Context

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| G-03 internal-alpha release gate | report | yes | yes | Primary evidence for deferring internal alpha and opening V01. |
| Target/init/connect guardrails | activation/context | yes | neutral-positive | Kept next task focused on external target proof. |
| Evidence and review guardrails | activation/context | yes | positive | Prevented product-ready overclaim. |
| Direct owner files | source | not applicable | not applicable | This was a docs/roadmap gate, not a source repair. |

### Review Burden Delta

Before:

```txt
G-03 deferred readiness, but the next execution queue was not yet explicit.
```

After:

```txt
V01 tasks make the next external-target-first path explicit and keep later/lab surfaces out of scope.
```

Delta: reduced for roadmap execution, not product validation.

### Candidate Reviewability

No MemoryCandidate, AntiMemoryCandidate, SourceClaim, or EvalCandidate should be promoted from this report alone. The useful output is the bounded V01 task sequence in `PLAN.md`.

### Brain ROI

Verdict: positive for roadmap discipline, insufficient evidence for product usefulness.

KRN helped keep the transition from deferred internal alpha into bounded evidence gates. This does not prove KRN can improve an external target repo yet; V01-00 must test that.

## What This Proves

- G-03 deferral has been converted into a bounded v0.1 roadmap.
- The next active task is external target repo evidence, not product-surface expansion.
- Root `PLAN.md` remains the active roadmap.

## What This Does Not Prove

- KRN is internal-alpha-ready.
- KRN is product-ready.
- KRN improves external target repo work.
- Activation or reflection works well on target repos.
- Hosted DB, DR, deployment, operator UX, API, MCP, dashboard, or worker runtime are ready.

## Command Evidence

| Command / Evidence | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn plan --task v0.1 roadmap gate --persist` | passed | KRN created a persisted planning run for the roadmap gate. | Does not prove the roadmap tasks will succeed. |
| G-03 release gate review | passed | Internal-alpha was deferred with explicit evidence gaps. | Does not prove product readiness. |
| `PLAN.md` V01 update | pending verification | Roadmap has been updated locally. | Does not prove commit, CI, or target-trial value until verified. |

## Next Recommended Action

Run:

```txt
V01-00 — Controlled External Target Repo Trial
```

Use tag `v0.1.0-alpha.0` against one real external target repo. Do not build new KRN product surfaces before that evidence exists.
