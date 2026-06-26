# Brain Battle Eval Matrix

Status: bounded eval matrix for KRN brain-in-battle checks.

This is not a broad eval platform. It classifies dogfood-derived KRN behavior
boundaries into deterministic guards, candidate checks, real-trial evidence
needs, and rejected eval theater.

## Classification

| Check | Status | Guard | Evidence | Does not prove |
|---|---|---|---|---|
| Target activation uses target read-model source seeds and trust exclusions instead of stale KRN static owner-file recall for target projects. | implemented now | `pnpm eval:brain-battle:smoke` executes `goldenKrnBehaviorGate` target trust exclusion case. | `packages/harness/src/goldenKrnBehaviorGate.ts`; `packages/harness/src/goldenKrnBehaviorGate.test.ts`; `docs/reviews/controlled-dogfood/2026-06-25-target-activation-read-model/REPORT.md`. | Does not prove exact owner-file recall below target source roots. |
| Trust exclusions cover `.env*`, `.git/`, `node_modules/`, `.muke/`, `.supersearch/runtime/`, `dist/`, and `build/`. | implemented now | Same deterministic GoldenGate case checks the target trust exclusion candidate metadata. | `packages/harness/src/activation/ownerFileRecall.ts`; `packages/harness/src/goldenKrnBehaviorGate.ts`. | Does not prove every target repo generated/runtime folder is known. |
| Codex execution brief includes objective, constraints, non-goals, context inclusions/exclusions, evidence contract, review burden, rollback, and proof boundaries. | implemented now | Existing Codex brief GoldenTask behavior and adapter tests. | `tests/fixtures/golden-tasks/codex-brief-behavior.json`; `packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts`; `docs/reviews/controlled-dogfood/2026-06-25-codex-brief-contract-hardening/REPORT.md`. | Does not prove Codex follows the brief. |
| SourceClaim and SourceDecision records require mechanism, KRN implication, consumer, falsifier or `doesNotProve`, and reject decorative source retention. | implemented now | `pnpm eval:brain-battle:smoke` executes `goldenKrnBehaviorGate` decorative source rejection case. | `packages/core/src/source.ts`; `packages/harness/src/goldenKrnBehaviorGate.ts`; `docs/architecture/security-trust-boundaries.md`. | Does not prove source selection quality or that every decorative source is detected before operator review. |
| Memory application feedback records helped/hurt/neutral/stale without direct Memory Core mutation; stale/hurt may create reviewable anti-memory candidates only. | implemented now | `pnpm eval:brain-battle:smoke` runs CLI memory record apply guards covering helped, stale, and hurt outcomes plus Memory Core non-mutation output. | `packages/cli/src/runMemoryRecordApplyCommand.ts`; `packages/cli/src/runCli.test.ts`; `docs/reviews/controlled-dogfood/2026-06-25-memory-feedback-demotion-loop/REPORT.md`; `docs/reviews/controlled-dogfood/2026-06-25-anti-memory-conflict-integration/REPORT.md`. | Does not prove feedback consistently improves future activation. |
| Anti-memory blocks or warns against stale/unsafe context during activation. | implemented now | Existing GoldenGate anti-memory case executes activation conflict behavior. | `packages/harness/src/goldenKrnBehaviorGate.ts`; `packages/harness/src/goldenKrnBehaviorGate.test.ts`. | Does not prove anti-memory coverage is complete for all stale claims. |
| Run readback distinguishes proof from non-proof and can be used by operator or Promptfoo without ad hoc SQL. | implemented now | `pnpm eval:brain-battle:smoke` runs the CLI readback proof/non-proof guard. | `packages/cli/src/runRunShowCommand.ts`; `packages/cli/src/runRunShowCommand.test.ts`; `docs/reviews/controlled-dogfood/2026-06-25-run-evidence-readback/REPORT.md`. | Does not prove live DB readback unless DB commands run. |
| V02-01 cannot be satisfied by simulation. | requires external operator evidence | Root `PLAN.md` and `GOAL.md` keep V02-01 blocked/deferred until real operator setup exists. | `docs/runbooks/second-operator-alpha-trial.md`; `docs/reviews/controlled-dogfood/2026-06-25-second-operator-trial-packet/REPORT.md`; root `PLAN.md`. | Does not complete V02-01. |
| LLM-as-judge grades broad brain quality. | rejected as eval theater | None. LLM judging is non-blocking until validated against known deterministic cases. | Promptfoo remains an adapter boundary. | Would not prove KRN product readiness. |
| Broad dashboard/API/MCP eval suite. | rejected as eval theater | None. | Current product gates reject new product surfaces before behavior proof. | Would add surface area before the brain behavior is proven. |

## Current Smoke

Run:

```sh
pnpm eval:brain-battle:smoke
```

This executes the existing KRN GoldenGate behavior test plus the V02-02 target
trust exclusion case, the V02-03 decorative source rejection case, the V02-03
CLI run-readback proof/non-proof guard, and the V02-04 CLI memory feedback /
anti-memory candidate guards. It is deterministic and does not call an LLM
judge.

## Promptfoo Boundary

Promptfoo remains a portable adapter smoke, not behavior proof. The existing
Promptfoo smoke proves the runner/config/provider path and local artifact output
only. GoldenTask behavior proof still requires `krn_behavior_execution`.

## Next Candidate

If future dogfood again shows review burden around run readback or source
decorative retention, promote one focused deterministic guard rather than
building a broad eval platform.
