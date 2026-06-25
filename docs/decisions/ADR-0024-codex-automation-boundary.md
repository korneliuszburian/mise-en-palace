# ADR-0024: Codex Automation Boundary

Status: accepted

Date: 2026-06-25

## Context

F-01 asked whether KRN should automate parts of Codex execution after CLI and
dogfood proof.

KRN already renders DB-backed Codex briefs through:

```txt
krn codex brief --run-id <id>
```

The current adapter and doctor checks intentionally keep Codex invocation
absent. The product risk is hidden agency: KRN could start executing Codex,
writing patches, or opening PRs before review/evidence/write boundaries are
strong enough.

## Source-To-Decision

```yaml
source_id: openai-codex-noninteractive
title: Codex non-interactive mode
url: /codex/noninteractive.md
trust_tier: high
mechanism: codex exec runs Codex in scripts/CI with explicit sandbox and approval settings, can emit JSONL, and defaults to read-only sandbox.
krn_implication: Codex automation is technically available, but KRN must treat it as an explicit execution surface with sandbox, output, and evidence contracts.
decision: defer KRN-owned codex exec runner until a bounded patch-artifact or read-only review workflow is specified.
does_not_prove: that KRN should invoke Codex automatically in the current repo.
consumer: F-01 decision, future Codex automation task.
falsifier: a repeated dogfood bottleneck requires manual copy/paste of KRN briefs into Codex and cannot be solved with readback/brief artifacts.
```

```yaml
source_id: openai-codex-github-action
title: Codex GitHub Action
url: /codex/github-action.md
trust_tier: high
mechanism: openai/codex-action runs codex exec in CI, supports prompt-file/output-file, and separates patch generation from PR creation in the safer CI failure example.
krn_implication: The first CI automation pattern should produce a patch artifact or review output, while write permissions live in a separate explicit approval job.
decision: do not add a GitHub Action now because this repo has no .github workflow surface and no approved target workflow.
does_not_prove: that GitHub Action automation is unsafe or unnecessary forever.
consumer: F-01 decision, future CI integration task.
falsifier: an internal-alpha target repo needs repeatable Codex review/fix artifacts and has CI/secrets policy ready.
```

```yaml
source_id: openai-codex-approvals-security
title: Agent approvals and security
url: /codex/agent-approvals-security.md
trust_tier: high
mechanism: Codex execution safety depends on sandbox mode and approval policy; network, broader filesystem access, and destructive actions must be controlled explicitly.
krn_implication: KRN cannot treat automation as a harmless adapter call; any future runner must pin sandbox, approval mode, network policy, and write authority.
decision: require an automation acceptance gate before any KRN-owned Codex runner.
does_not_prove: that all local manual Codex work is risky.
consumer: F-01 decision, future runner acceptance checklist.
falsifier: a future KRN runner can prove read-only or patch-only operation with no bypass of review/write policies.
```

## Decision

Do not implement a KRN-owned Codex execution runner in F-01.

Accept this boundary:

- KRN may render Codex-facing briefs.
- KRN may read persisted run/evidence/review state.
- KRN may document a future automation contract.
- KRN must not invoke `codex exec`, spawn Codex, add GitHub Actions, open PRs,
  or apply Codex-generated patches in this slice.

Future automation must start with one of these modes:

1. `read_only_review`: Codex reviews a KRN brief/run state and produces text or
   JSON output only.
2. `patch_artifact`: Codex may create a patch artifact, but a separate reviewed
   job or operator applies it.
3. `explicit_operator_write`: Codex may write only after an explicit operator
   approval and evidence capture path exists.

## Acceptance Gate For Future Runner

A future task may add automation only if it names:

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

## Rejected Alternatives

- Add `krn codex execute` now.
- Spawn `codex exec` from `krn codex brief`.
- Add a GitHub Action without a concrete target workflow.
- Allow Codex to push commits/PRs from KRN without a separate review boundary.
- Treat Codex automation as a worker runtime.

## Falsifier

If repeated dogfood or internal-alpha trials show that manual Codex invocation
is the dominant review burden and a read-only or patch-artifact runner can be
proved without bypassing KRN review/write policies, reopen this ADR with a
single bounded automation prototype.

