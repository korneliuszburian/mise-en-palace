# Target Repo Testing Rules

Status: operator runbook.

KRN can inspect and test target repositories, but target repo proof must stay
separate from KRN repo proof.

## Core Rule

Target repositories are not disposable fixtures.

Do not edit, commit, push, reset, clean, or normalize a target repo unless the
current task explicitly says target writes are allowed.

If the target repo is an active checkout with a living dirty state, treat that
dirty state as external operator context.

## Testing Modes

### Mode 1: Observation-Only Target Trial

Allowed:

- inspect target `AGENTS.md`, README, plans, docs, scripts, tests;
- run non-destructive status/readiness commands;
- run typecheck/test commands when they do not write source;
- record command outcomes in KRN evidence;
- write reports in the KRN repo.

Forbidden:

- editing target files;
- committing target files;
- reverting target dirty files;
- calling the run a second-operator proof.

Use when:

- target repo is dirty;
- another instance is actively evolving the target;
- the goal is product validation, not target repair.

### Mode 2: Headless Target Repair Trial

Allowed only when explicitly requested.

Allowed:

- edit target files within the named target scope;
- run target verification;
- commit target changes only if the user explicitly asks for target commits or
  the task says commit/push target repo.

Required:

- record target dirty state before editing;
- classify pre-existing dirty files separately from KRN-made files;
- keep KRN report evidence in the KRN repo;
- do not mix target source commits with KRN source/report commits unless
  explicitly requested.

Forbidden:

- treating target repair as V02-01;
- sweeping unrelated target dirty files into a commit;
- reverting target files not changed by the current KRN run.

### Mode 3: Real Second-Operator Trial

This is the only mode that can satisfy V02-01.

Required inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Required proof:

- the second operator runs or directs the flow;
- support used is recorded;
- target commands and outcomes are recorded;
- transcript and review burden are captured;
- KRN report states what the trial proves and does not prove.

Forbidden:

- replacing a missing operator with another local/headless run;
- calling headless proof V02-01.

## Dirty Context Rules

If target repo is dirty before the trial:

```txt
target_dirty_before: yes
owned_by_current_krn_run: no / partial / yes
```

If files change during the trial and the mode is observation-only:

- stop before editing further;
- record the unexpected dirty context;
- do not fix target tests or source;
- do not commit target changes;
- write the finding in KRN report.

If target repo is dirty after the trial:

- list changed files;
- classify KRN-made files only if target writes were explicitly allowed;
- never claim target verification belongs only to KRN-made changes unless the
  target dirty state was clean or classified.

## Evidence Rules

KRN evidence capture currently records the KRN repo worktree by default. If a
command is run in a target repo, evidence must say that explicitly:

```txt
command: wilq-seo scripts/test.sh
provenance: operator_reported
does_not_prove:
  - KRN source correctness
  - target full frontend verification if skipped
  - product readiness
  - second-operator usability
```

If KRN evidence reports zero changed files while the target repo is dirty, the
report must state:

```txt
KRN EvidenceBundle did not classify target changed files.
```

This is a KRN product gap, not target proof.

## Owner-File Read-Model Contract

Target owner files are explicit read-model inputs. KRN must not claim it
discovered exact owner files unless they were provided through checked-in
metadata, a fixture, or the operator-facing init contract.

Use `--owner-file` during init when a target scenario has known owner files:

```sh
krn init --dry-run --repo <target-repo-path> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"

KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm krn init --connect --repo <target-repo-path> --persist \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point" \
  --owner-file "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof"
```

Each owner-file entry is:

```txt
path|root|kind|reason
```

Rules:

- `path` is the exact target-relative owner file.
- `root` is the source seed/root that owns the file, such as `src`, `tests`,
  `docs`, or `.`.
- `kind` is a short operator-defined classification, such as
  `implementation_entry`, `behavior_test`, `target_runbook`, or
  `agent_guidance`.
- `reason` says why the file is relevant to the bounded target task.
- Do not use `--owner-file` as a crawler substitute or broad file inventory.
- If owner files are absent, `krn plan --project ... --persist` should report
  `missing_owner_file_read_model`. That proves only that exact owner-file data
  was unavailable to the read model; it does not prove owner files do not exist.

## Failure Rules

If target verification fails in observation-only mode:

- record the failure;
- capture exact failing command and failure summary;
- do not patch target tests/source;
- recommend either a target repair trial or KRN repair if the failure exposes a
  KRN evidence problem.

If target verification fails in headless repair mode:

- repair only within the explicit target scope;
- rerun focused failing tests first;
- run target-defined verification after;
- report skipped verification honestly.

## Development Implications For KRN

Current high-value KRN repairs:

1. target-aware evidence capture so KRN can classify target changed files;
2. target trial mode labels in reports and CLI output;
3. DB smoke idempotency after fresh Docker volume recovery;
4. owner-file read model support for real target repos beyond root source
   seeds.

Do not create V04 as another local substitute for V02-01. Use target trials only
when they answer a specific product question or repair a concrete KRN gap.
