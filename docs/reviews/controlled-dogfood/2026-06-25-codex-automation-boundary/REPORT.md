# Codex Automation Boundary Report

Status: F-01 completion report.

Date: 2026-06-25

## Executive Verdict

F-01 defers KRN-owned Codex execution. The repo has a useful DB-backed Codex
brief/readback surface and a passing Codex adapter smoke, but it does not yet
have a concrete bottleneck that justifies `codex exec`, GitHub Action, PR
creation, or patch application automation.

The accepted next boundary is an automation acceptance gate, not a runner.

## Scope

Changed:

- `docs/decisions/ADR-0024-codex-automation-boundary.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-codex-automation-boundary/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- `.github` workflows;
- Codex runner;
- `krn codex brief` behavior;
- worker runtime;
- Memory Core;
- source decisions;
- review gates.

## Evidence Reviewed

| Source | Finding | Decision impact |
| --- | --- | --- |
| Codex non-interactive mode manual section | `codex exec` is intended for scripts/CI, defaults to read-only, supports JSONL and output schemas. | Automation is possible, but must be an explicit execution surface. |
| Codex GitHub Action manual section | Action can run Codex in CI; safer example separates patch generation from PR creation. | Future CI automation should prefer patch artifact / separate reviewed write job. |
| Codex approvals/security manual section | Sandbox and approval policy define what Codex can do and when it must ask. | Future runner must pin sandbox, approvals, network, and write authority. |
| `packages/cli/src/doctorStaticChecks.ts` | Existing doctor scan detects Codex runner presence by package/path/`codex exec`/spawn patterns. | Current absence is already machine-checkable. |
| `krn doctor` | Reports Codex adapter renderer present, hook projection present, Codex execution runner absent, KRN MCP server absent. | Current product surface remains brief/readback only. |
| `pnpm db:smoke:codex-adapter` | Adapter smoke passed with `Codex invocations: 0`. | DB-backed brief/readback proof exists without execution. |

## Decision

```txt
decision: defer Codex execution automation
accepted_now:
  - read-only DB-backed Codex brief rendering
  - Codex adapter smoke
  - future automation acceptance gate
rejected_now:
  - krn codex execute
  - spawning codex exec from CLI
  - GitHub Action workflow
  - automatic PR creation
  - patch application without separate review
```

## Future Automation Acceptance Gate

Before KRN adds a Codex runner, the task must name:

- trigger;
- trusted input source;
- sandbox;
- approval policy;
- network policy;
- allowed writes;
- forbidden writes;
- output artifact;
- evidence capture command;
- rollback;
- what the run proves;
- what the run does not prove.

The first acceptable prototype should be one of:

```txt
read_only_review
patch_artifact
explicit_operator_write
```

## Command Evidence

Persisted IDs:

```txt
executionRun: 1a45a72f-7e84-4532-9f51-c4869425fd03
taskContract: 783f357f-40cb-45f5-acdb-4136557a954f
harnessPlan: 5fdceda0-14f8-4dc1-8b9c-07dad7901cd5
contextAssembly: fe1b9260-6aa0-46bf-977b-7f8abe5efa6a
evidenceBundle: e1c21a5d-9f51-4632-a123-015585dd738e
reviewAssessment: cb5bdf49-23a4-4c68-963c-aceff5249895
feedbackDelta: d98ad74e-ed16-41f9-a953-32a495c575dd
observationGroup: 7c94b1cc-8a1c-4da4-ac71-4d466c6538dc
reflectionRecord: 3410b0ae-8ca0-45ac-8e72-a396fc05c106
Memory mutation: none
MemoryRecord created: no
```

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn plan --task ... --persist` | passed | F-01 has a persisted KRN planning run. | Does not prove automation is needed. |
| `node fetch-codex-manual.mjs` | passed | The local Codex manual cache is current enough for F-01 source decisions. | Does not prove future Codex behavior will not change. |
| `krn doctor` | passed | Current repo reports Codex adapter present and Codex execution runner absent. | Does not prove DB runtime because this command was run without `KRN_DATABASE_URL`. |
| `pnpm db:smoke:codex-adapter` | passed | DB-backed Codex adapter smoke works and records `Codex invocations: 0`. | Does not prove Codex execution automation. |
| `krn evidence capture --run-id 1a45a72f... --persist` | passed | F-01 evidence, review assessment, feedback delta, command provenance, and changed-file classification were persisted. | Does not prove automation is needed. |
| `krn observe --run 1a45a72f... --persist` | passed | F-01 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --scope run:1a45a72f... --persist` | passed | F-01 reflection record selected 5 observations without MemoryRecord creation or candidate row writes. | Does not prove reflection quality at scale. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep Codex automation behind an explicit acceptance gate instead
  of adding hidden execution.

What this run proves:
- Current repo can render Codex briefs and smoke the adapter without invoking
  Codex.
- Official Codex automation surfaces exist, but require explicit sandbox,
  approval, secret, and output handling.

What this run does not prove:
- Codex automation is unnecessary forever;
- GitHub Action integration is product-ready;
- `codex exec` should be wired into KRN now;
- target repos will not need automation later.

DB used in current shell:
- yes for KRN plan and Codex adapter smoke.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| AGENTS guidance source claim | source | yes | helped | Kept durable guidance small and avoided putting automation state into AGENTS. |
| weak evidence source claim | source | yes | helped | Prevented treating adapter smoke as execution proof. |
| reflection quality caveat | source | yes | neutral | Relevant to avoiding overclaiming generated candidates. |
| current source inspection | source | yes | helped | Found doctor scan and existing no-runner boundary. |
| OpenAI Codex manual | external source | yes | helped | Supplied current automation/security mechanisms. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Codex manual source mapping | strong | Automation surfaces and security constraints are official. | reduced |
| `krn doctor` | medium | Local static checks report no runner. | reduced |
| `pnpm db:smoke:codex-adapter` | strong | Adapter smoke works and invokes Codex zero times. | reduced |

### Candidate Quality

No candidate was promoted. F-01 may seed a future EvalCandidate:

```txt
Codex automation acceptance gate should reject runner configs without sandbox,
approval policy, allowed writes, output artifact, evidence capture, and
rollback.
```

Reviewability:
- ready after one future automation trial exists;
- needs_more_evidence now because no runner was implemented.

## Product Readiness Signal

Verdict:

```txt
Codex automation is later/lab, not active product surface.
```

KRN remains dogfood-useful as a governed workflow and readback system. It should
not own Codex execution until a repeated bottleneck proves that automation
reduces review burden without bypassing review/write gates.

## Next Recommended Action

Continue to:

```txt
F-02 — Dashboard Readiness Gate
```

F-02 should decide dashboard readiness from action-oriented read models. It
must not build UI just because read models exist.
