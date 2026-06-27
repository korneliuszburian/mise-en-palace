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
target_patch_lifecycle:
  none
  accepted_by_target_owner
  rejected_by_target_owner
  stronger_verification_requested
  handed_off_unresolved
allowed_writes:
forbidden_writes:
```

If the target is dirty and the mode is observation-only, treat the dirty state
as external operator context.

If a previous headless repair left a KRN-made target patch dirty and that patch
has only been handed off, classify it as `handed_off_unresolved`. Do not start
another repair in that same target repo. Allowed next actions are:

- wait for target owner/operator decision;
- run observation-only verification requested for that patch;
- choose a different clean/safe target;
- record a blocked handoff if no useful progress is possible.

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
- a handoff artifact when KRN-made target changes remain dirty after the run.

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

## Owner-File Read-Model Contract

Exact target owner files are explicit read-model inputs, not automatic crawler
output. If the bounded target task has known owner files, pass them through
`krn init`:

```sh
krn init --dry-run --repo <target> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"

krn init --connect --repo <target> --persist \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"
```

Each entry is `path|root|kind|reason`. If no owner files are provided, record
`missing_owner_file_read_model` as read-model incompleteness. Do not treat it as
proof that owner files do not exist, and do not repair activation scoring from
that signal alone.

## Step 5: Stop Conditions

Stop and report instead of patching when:

- observation-only target verification fails;
- target writes are needed but not explicitly allowed;
- secrets or generated runtime surfaces appear;
- another active operator/instance is evolving the target;
- the target has a previous KRN-made patch with
  `target_patch_lifecycle: handed_off_unresolved` and the current task is
  another same-target repair;
- the trial would be renamed into V02-01 without a real second operator.

## Required Output

Every target trial report must include:

```txt
mode:
target_dirty_before:
target_patch_lifecycle:
handoff_artifact:
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
