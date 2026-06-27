# V38 Clean Target Selection Gate

Status: complete.

Date: 2026-06-27.

Mode: observation-only target selection.

## Executive Verdict

V38 selected `/home/krn/coding/krn/active/wilq-seo` as the next clean/safe
target path.

The unresolved `krn-elektroinstal-ogar` FAQ patch remains:

```txt
target_patch_lifecycle: handed_off_unresolved
same_target_repair_allowed: no
```

KRN must not run another repair in `krn-elektroinstal-ogar` until target owner
action or explicit observation-only verification is requested for that patch.

## Selection Decision

Selected target:

```txt
target_repo: /home/krn/coding/krn/active/wilq-seo
branch: main...origin/main
worktree: clean
target_patch_lifecycle: none
selected_for: observation-only baseline
```

Why selected:

- clean worktree;
- synced with origin;
- real product repo, not a toy fixture;
- has repo-local `AGENTS.md`, `PLAN.md`, `PLANS.md`, package scripts, Python
  runtime, TypeScript package, app/packages/tests surfaces;
- suitable for a target baseline before any bounded repair.

Why not immediate repair:

- V38 is a selection gate, not a repair task;
- WILQ has its own active instructions and product context;
- KRN should first record mode, target dirty state, verification commands,
  owner-file candidates, and proof/non-proof boundaries.

## Target Inventory

Read-only inventory under `/home/krn/coding/krn/active` found these notable
states:

| Repo | Status | Selection decision |
|---|---|---|
| `wilq-seo` | clean, `main...origin/main` | selected for V39 observation-only baseline |
| `krn-elektroinstal-ogar` | dirty with V32 FAQ patch | rejected for repair, lifecycle `handed_off_unresolved` |
| `krn-ai-os` | ahead 49, untracked `GOAL.md` | rejected |
| `krn-ekologus-brain` | dirty | rejected |
| `krn-ekologus` | untracked `GOAL.md` | rejected |
| `krn-gastown` | untracked docs/plans | rejected |
| `krn-llm-wiki` | dirty/untracked KRN files | rejected |
| `krn-nadgodziny` | dirty with many files | rejected |
| `krn-pokemon` | dirty/untracked broad app/docs | rejected |
| `krn-search` | dirty/untracked broad docs/tests/skills | rejected |
| `krn-seo` | dirty | rejected |
| `seo` | dirty | rejected |

## V02-01 Boundary

V02-01 remains blocked/deferred because real second-operator inputs are still
missing:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Using `wilq-seo` headlessly must not be renamed into second-operator proof.

## Next Recommended Task

Promote:

```txt
V39 — WILQ Clean Target Observation-Only Baseline
```

Goal:

Run a read-only / observation-only baseline on `wilq-seo` before any target
repair.

Required:

- record target dirty state before and after;
- classify mode as observation-only;
- inspect `AGENTS.md`, README, package scripts, and active goal/plan files;
- identify candidate owner files only from explicit source/read-model evidence;
- decide whether a bounded repair trial is safe later;
- do not edit, commit, reset, clean, or normalize `wilq-seo`.

Non-goals:

- no target writes;
- no target repair;
- no target commit/push;
- no fake V02-01;
- no product-ready overclaim;
- no broad benchmark lane.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git status --short --branch` in KRN | clean | KRN worktree clean before V38 | target product readiness |
| `rtk git status --short --branch` in `krn-elektroinstal-ogar` | dirty with two FAQ files | lifecycle rule still blocks same-target repair | target owner acceptance |
| `rtk proxy find /home/krn/coding/krn/active -maxdepth 2 -type d -name .git -print` | listed active git repos | candidate target universe for this gate | every repo's semantic suitability |
| `rtk proxy bash -lc 'for gitdir in ... git status ...'` | status inventory captured | most active repos are dirty or ahead/untracked | that rejected repos are bad products |
| `rtk git status --short --branch` in `wilq-seo` | clean, `main...origin/main` | `wilq-seo` is clean enough for observation baseline | safe repair scope |
| `rtk sed -n '1,220p' package.json` in `wilq-seo` | package scripts inspected | target has typecheck/test/build scripts | those scripts pass |
| `rtk sed -n '1,160p' AGENTS.md` in `wilq-seo` | target rules inspected | target has its own recovery and safety rules | full target context |

## Final Decision

V38 is complete as a selection gate.

Next active stream:

```txt
V39 — WILQ Clean Target Observation-Only Baseline
```

