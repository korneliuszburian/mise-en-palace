---
name: target-repo-testing
description: Use when Codex is asked to inspect, test, initialize, plan, verify, or repair a target repository through KRN, especially when the target repo may be dirty, active, external, headless, writable, or used as evidence for second-operator/internal-alpha readiness.
---

# Target Repo Testing

Use this skill before running target-repo commands or writing target-repo
evidence.

## Core Rule

Target repositories are not disposable fixtures.

Do not edit, commit, push, reset, clean, or normalize a target repo unless the
current task explicitly allows target writes.

## Step 1: Classify The Mode

Choose exactly one mode before running target commands:

```txt
observation-only:
  inspect and run non-destructive commands; write only KRN reports/evidence.

headless-repair:
  edit target files only inside explicit target scope.

real-second-operator:
  only mode that can satisfy V02-01; requires real operator inputs/transcript.
```

If the user did not explicitly authorize target writes, default to
`observation-only`.

## Step 2: Record Dirty State

Run target `git status --short --branch` before any target command when the
target is a Git repo.

Classify:

```txt
target_dirty_before: yes/no
owned_by_current_krn_run: no / partial / yes
allowed_writes:
forbidden_writes:
```

If the target is dirty and the mode is observation-only, treat the dirty state
as external operator context.

## Step 3: Run Only Mode-Compatible Commands

Observation-only allows:

- inspect `AGENTS.md`, README, docs, scripts, tests, plans;
- run read/status commands;
- run typecheck/test commands when they do not intentionally write source;
- write KRN repo reports and evidence.

Observation-only forbids:

- editing target files;
- fixing target tests;
- reverting target changes;
- committing/pushing target changes;
- calling the run second-operator proof.

Headless repair additionally requires:

- named target files or package surface;
- rollback path;
- focused verification;
- separation of pre-existing dirty files from KRN-made changes.

## Step 4: Capture Evidence Honestly

When a command ran in the target repo, label it as target evidence:

```txt
command: <target-name> <command>
provenance: operator_reported
does_not_prove:
  - KRN source correctness
  - full target verification if any gate was skipped
  - product readiness
  - second-operator usability
```

If KRN evidence capture reports zero changed files while the target repo is
dirty, state:

```txt
KRN EvidenceBundle did not classify target changed files.
```

## Step 5: Stop Conditions

Stop and report instead of patching when:

- observation-only target verification fails;
- target writes are needed but not explicitly allowed;
- secrets or generated runtime surfaces appear;
- another active operator/instance is evolving the target;
- the trial would be renamed into V02-01 without a real second operator.

## Required Output

Every target trial report must include:

```txt
mode:
target_dirty_before:
allowed_writes:
forbidden_writes:
commands:
what_proved:
what_did_not_prove:
target_dirty_after:
condensation_decision:
```

## Reference

Use `docs/runbooks/target-repo-testing.md` for the full operator runbook when a
scenario needs more detail.
