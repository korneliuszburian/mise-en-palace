# V09 Deterministic Hooks Candidate Decision

Status: V09 completion gate.

Date: 2026-06-27

## Executive Verdict

V09 rejects hook implementation now and keeps hooks as candidate-only.

KRN already has Codex hook expectation projections in the Codex adapter, but the
repo does not have trusted repo-local hook scripts or `.codex/hooks` runtime
configuration. The post-V05/V08 evidence does not show a repeated deterministic
violation that survived skills, tests, runbooks, and brief projections.

The next stream should be V10 MCP / subagent candidate screening, not a hook
implementation.

## Inputs

| Input | Verdict | Evidence |
|---|---|---|
| Hook source decision | accepted as projection-first | `docs/decisions/ADR-0022-policy-hooks-boundary.md` |
| Hook projection code | present | `packages/codex-adapter/src/renderHookExpectations.ts` |
| Repo hook runtime | absent | `packages/cli/src/doctorRepoChecks.ts`; repo search found no `.codex/hooks` in KRN root |
| Target write boundary | covered by skill + guard | `.agents/skills/target-repo-testing/SKILL.md`; `docs/reviews/controlled-dogfood/2026-06-27-target-repo-skill-boundary-guard/REPORT.md` |
| Compact recovery | covered by GOAL/PLAN/PLANS and skill | `GOAL.md`; `.agents/skills/handoff-compact/SKILL.md`; V08 report |
| Secret/untrusted context | projection and redaction tests exist | ADR-0022; `packages/harness/src/observations/observerInput.test.ts`; target trust reports |

## Source To Decision

```yaml
source_id: adr-0022-policy-hooks
title: ADR-0022 Policy Hooks Are Deterministic Guardrails
trust_tier: high local
mechanism: Hooks are adopted as deterministic guardrail projections, not semantic authority; actual hook scripts/config are explicitly deferred.
krn_implication: V09 should not create hook scripts unless newer evidence proves a repeated mechanical failure that projections/skills/tests cannot cover.
decision: reject hook implementation now; keep projection-first boundary.
does_not_prove: hooks will never be useful.
consumer: V09 hook candidate gate and future hook backlog.
falsifier: repeated target-write, destructive-command, or pre-compact failures occur despite skill/test/projection guidance and can be blocked deterministically.
```

```yaml
source_id: codex-adapter-hook-projection
title: KRN Codex hook expectation projection
trust_tier: high local
mechanism: The adapter renders SessionStart, PreToolUse, PostToolUse, PreCompact, and Stop expectations while stating it does not create or execute hooks.
krn_implication: Current product value is visible policy guidance in briefs, not hidden runtime enforcement.
decision: keep adapter projection; do not add runtime hooks in V09.
does_not_prove: runtime hook enforcement exists.
consumer: Codex brief/rendering path.
falsifier: operators repeatedly ignore projected warnings in a way a small trusted command hook could prevent.
```

## Candidate Screening

| Candidate | Decision | Evidence | Falsifier |
|---|---|---|---|
| Target repo write prevention hook | defer | Target write boundary is currently skill + guard + explicit target evidence mode; no repeated post-skill violation found in V05-V08. | A future observation-only target scenario writes target files despite skill/plan guidance. |
| Broad `git add .` warning hook | reject now | No repeated current-scope evidence after V05-V08; plan already forbids broad commits. | Repeated broad staging causes unrelated files to enter commits. |
| Compact recovery hook | reject now | V08 refined `handoff-compact`; GOAL/PLAN/PLANS define resume. | Future auto-compact resumes repeatedly lose active stream/task despite the skill. |
| Secret-shaped evidence redaction hook | defer | Redaction/target trust has tests/reports; no V09 evidence of leaked secret values through current workflow. | A KRN run persists or prints secret-shaped values that a deterministic hook could block without semantic guessing. |
| Semantic quality/audit hook | reject | Explicit non-goal; hooks must not become hidden semantic brain. | None under current product doctrine. |

## What This Proves

- V09 inspected hook candidates against current local evidence.
- Hook expectation projection exists, but hook runtime is not configured.
- Current evidence supports skills/tests/projections before runtime hooks.
- No V09 hook candidate has enough repeated deterministic evidence to implement.

## What This Does Not Prove

- Hooks are useless forever.
- Current projections prevent mistakes at runtime.
- Product readiness.
- V02-01 second-operator usability.
- MCP or subagents are justified.

## Condensation Decision

```txt
finding: hook candidates remain useful as policy projections, but no runtime
  hook has enough repeated deterministic evidence after V05-V08.
frequency: repeated candidate, not repeated failure after current guardrails.
candidate_surface: hook
decision: reject/defer implementation now.
rationale: hooks require trust review and deterministic inputs; current
  candidates are covered by skills, tests, runbooks, or adapter projections.
evidence: ADR-0022; V04 compression screening; V08 handoff skill refinement;
  target repo testing skill guard; codex-adapter hook projection source.
does_not_prove: hooks will never be needed.
falsifier: a future scenario repeats a mechanical violation that a small trusted
  hook can block without semantic classification.
next_task_id: V10-00.
```

## Next Recommended Stream

Move to:

```txt
V10 — MCP / Subagent Candidate Gate
```

The first V10 task should ask whether CLI/files/DB are insufficient for any
current useful product question, and whether any read-heavy role has a stable
output contract. Candidate status must not authorize implementation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `sed -n '100,140p' docs/reviews/controlled-dogfood/2026-06-27-v04-compression-screening/REPORT.md` | passed | Prior Codex hook source-to-decision and hook candidates were inspected. | Does not prove current state. |
| `sed -n '1,130p' docs/decisions/ADR-0022-policy-hooks-boundary.md` | passed | ADR keeps hooks projection-first and defers scripts/config. | Does not prove hooks cannot help later. |
| `sed -n '1,130p' packages/codex-adapter/src/renderHookExpectations.ts` | passed | Hook expectations are rendered as projection and explicitly do not create/execute hooks. | Does not prove runtime enforcement. |
| `find ... hook ...` | passed | KRN root has no `.codex/hooks` runtime surface; only local lab git hook dirs appeared. | Does not prove external operator environments lack hooks. |
| `rg -n "hook\|target writes\|secret-shaped\|observation-only" ...` | passed | Hook candidates and existing skill/test/projection coverage were inspected. | Does not prove no future hook need. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic correctness. |
