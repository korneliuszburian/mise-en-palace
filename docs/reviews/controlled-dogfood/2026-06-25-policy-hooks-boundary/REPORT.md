# Policy Hooks Boundary Report

Status: E-01 completion report.

Date: 2026-06-25

## Executive Verdict

E-01 turned the E-00 untrusted-context repair into a bounded Codex adapter
change: hook expectations now project `untrusted selected context` as a
required `PreToolUse` warning/deny concern, and ADR-0022 records that hooks are
deterministic lifecycle guardrails, not KRN's semantic brain.

## Scope

Changed:

- `packages/codex-adapter/src/renderHookExpectations.ts`;
- `packages/codex-adapter/src/renderHookExpectations.test.ts`;
- `packages/codex-adapter/src/renderExecutionBrief.test.ts`;
- `docs/decisions/ADR-0022-policy-hooks-boundary.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-policy-hooks-boundary/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- hook scripts;
- `.codex/hooks.json`;
- `.codex/config.toml`;
- Memory Core;
- source promotion;
- activation scoring;
- worker/API/MCP/dashboard runtime.

## Source Inputs

| Source | Used for | Does not prove |
| --- | --- | --- |
| Official Codex manual, Hooks section | Hook lifecycle/trust/config behavior. | KRN hook scripts exist or execute. |
| Official Codex manual, approvals/security section | Sandbox/approval distinction and prompt-injection caution. | KRN product security. |
| `docs/architecture/security-trust-boundaries.md` | Local E-00 finding for untrusted selected context. | Hook enforcement. |

## Implementation

The existing Codex adapter hook projection now states:

```txt
PreToolUse | action=warn_or_deny | applies_to=destructive paths,
generated files, untrusted selected context, destructive/write approval,
tool boundary notes
```

The projection rules also state:

```txt
hooks are lifecycle guardrails, not the semantic brain
```

This is intentionally a projection. No hook handler is created or trusted in
this slice.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn plan --task policy gates hook boundary --persist` | passed | E-01 has a persisted planning run and rendered the new hook expectation in the generated brief. | Does not prove hook enforcement. |
| `pnpm --filter @krn/codex-adapter test -- renderHookExpectations renderExecutionBrief` | passed | Targeted adapter behavior and brief rendering include untrusted selected context. | Does not prove actual hooks run. |
| `pnpm --filter @krn/codex-adapter typecheck` | passed | Adapter source remains type-safe. | Does not prove policy quality. |
| `pnpm typecheck` | passed | Workspace types still compile. | Does not prove policy quality. |
| `pnpm test` | passed | Existing tests still pass. | Does not prove product security. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove hook enforcement. |
| `krn evidence capture --persist` | passed | E-01 evidence, review assessment, feedback delta, changed-file classification, and command proof were persisted. | Does not prove hook enforcement. |
| `krn observe --persist` | passed | E-01 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --persist` | passed | E-01 reflection record was persisted without candidate row writes or Memory Core mutation. | Does not prove useful extraction at scale. |

Note:
- The first targeted adapter test run failed because
  `renderExecutionBrief.test.ts` still asserted the old `PreToolUse` output.
  The test expectation was updated to cover the new brief contract, and the
  final targeted/full checks passed.

## Persistence Evidence

```txt
executionRun: 6a513eea-9595-4960-a34b-d4f616dd37aa
taskContract: 76d8c4ce-4bf3-4cc1-a487-00dff8c4d159
harnessPlan: 971f6667-ab58-407d-91d5-5a648376f4ff
contextAssembly: a1e0283a-543d-4132-88b7-f956fa8f687e
evidenceBundle: b26631fe-fa23-4e57-ab8e-cc55b8651415
reviewAssessment: 632e09b8-fe43-4840-ade6-a2a60336511a
feedbackDelta: ead53d3e-949c-411f-8c51-3adcb2eddb18
observationGroup: 264759fb-2edd-4520-b6ee-a075840c2ce0
reflectionRecord: 0ed14157-eb34-4962-90da-bb4e2f8c6461
Memory mutation: none
MemoryRecord created: no
```

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- E-01 used KRN's security review and official Codex guidance to make one small
  source change without building a hook subsystem.

What this run proves:
- KRN can convert a bounded security review finding into a Codex adapter
  contract/test update.

What this run does not prove:
- hook scripts exist;
- hooks run;
- prompt-injection resistance;
- public product security.

DB used in current shell:
- yes for persisted KRN plan, evidence, observe, and reflect.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| E-00 security review | doc | yes | helped | Supplied SEC-01 untrusted-context warning. |
| Official Codex hooks docs | official source | yes | helped | Prevented treating hooks as semantic authority. |
| Codex adapter hook projection owner files | source | yes | helped | Provided smallest owning implementation surface. |

### Candidate Quality

No memory/source/eval candidate was promoted. A future policy candidate is
deferred until actual hook configuration exists.

## Product Readiness Signal

Verdict:

```txt
policy boundary is clearer, hook enforcement is not implemented.
```

## Next Recommended Action

Continue to:

```txt
E-02 — Worker Runtime Acceptance Gate
```

Do not build worker runtime unless a concrete bottleneck and write-authority
contract justify a one-shot/manual executor proof.
