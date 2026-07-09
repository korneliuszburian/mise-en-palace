---
name: beads
description: Use for durable project state: triage, claims, blockers, to-spec, to-tickets, wayfinding, handoff, follow-up work, or any task that must survive the current chat.
---

# Beads

Use Beads as the shared project task system. If work must survive the current
chat, it belongs in Beads or it does not exist as project state.

## Trigger

Use when durable task state, issue dependencies, blocker management, follow-up
work, or multi-session recovery matters.

## First Step

Run:

```bash
rtk bd prime
```

If that prints nothing, check whether the repository has an active Beads workspace:

```bash
rtk bd where
```

## Mode Dispatch

Choose the narrowest mode before mutating issues:

| Mode | Input | Output | Stop gate |
|---|---|---|---|
| `triage` | backlog, blocker, follow-up, status question | claimed/updated/closed issue or new follow-up | next action is represented in Beads |
| `to-spec` | rough idea or conversation | one settled spec issue/body | spec can be sliced without inventing requirements |
| `to-tickets` | spec or concrete plan | agent-sized issues plus dependency edges | `bd ready` shows the frontier |
| `wayfinding` | named destination with foggy route | map issue plus decision tickets | destination, map, blockers, and frontier are visible |
| `handoff` | meaningful repo/task state | compact continuation state | fresh agent can resume without broad reread |

For planning modes, `references/planning-modes.md` is authoritative. Load it
before creating or rewriting `to-spec`, `to-tickets`, or `wayfinding` issues,
and use the matching template from `templates/`.

If a request spans multiple modes, finish the earlier artifact before starting
the later one. Do not skip from fog to implementation tickets.

## Core CLI Steps

1. Find work:

```bash
rtk bd ready
rtk bd list --status=open
rtk bd list --status=in_progress
```

2. Inspect before editing:

```bash
rtk bd show <id>
```

3. Claim work atomically:

```bash
rtk bd update <id> --claim
```

4. Create durable follow-up work when implementation reveals new tasks:

```bash
rtk bd create "Short title" --description="Why this exists and what needs to be done" --type=task --priority=2
```

5. Wire blocking edges when one issue must finish before another can start:

```bash
rtk bd dep <blocker-id> --blocks <blocked-id>
```

6. Close completed work:

```bash
rtk bd close <id> --reason="Completed"
```

## Steps

Use Beads before durable work:

1. Run `bd prime` after compaction, resume, or a fresh session.
2. Inspect ready/in-progress work before choosing a slice.
3. Claim an existing issue, or create one when the work must survive handoff.
4. Keep implementation notes in Beads comments or issue descriptions when they are durable; keep root KRN plans compact.
5. Close the Beads issue only after verification, commit, push, and CI status are recorded or explicitly marked unavailable.

## Handoff Mode

Use `templates/handoff.md` before compaction, pause, transfer, or session end
when meaningful repo state changed. Keep it compact and store durable task
state in Beads, not in a markdown ledger.

## Output

- Claimed, created, updated, blocked, or closed Beads issue.
- Dependency edge when one task gates another.
- Mode used and why.
- Closing reason or issue note with verification and non-proof boundary.
- No markdown TODO or parallel task ledger.

## Forbidden

- Do not create markdown TODO files as the source of truth when Beads is available.
- Do not use `bd edit`; it opens an interactive editor. Use `bd update` flags instead.
- Prefer `--json` when parsing `bd` output programmatically.
- If hooks are installed, `bd prime` may already be injected. Run it manually when context is missing.
- Do not auto-close or mutate tasks unless the work is actually complete.
- Do not create broad epics disguised as ready work.
- Do not represent blockers only in prose; use native dependency edges.
- Do not use Beads as a research archive.

## Stop Condition

Stop when the active work has a claimed Bead or a justified local-only plan, new
durable follow-up work is represented in Beads, blockers are dependency edges
or explicit human decisions, and completed issues have verification recorded.

## Verification

For Beads workflow changes, verify the CLI and repository handoff surface:

```bash
rtk bd --version
rtk bd prime
rtk bd ready --json
rtk git diff --check
```

If Beads work changes package manifests or generated skills, also rely on the repository CI skill invariants before claiming the integration is complete.
