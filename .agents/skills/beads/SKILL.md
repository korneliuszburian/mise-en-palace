---
name: beads
description: Track durable KRN task state in Beads. Use when work must survive the chat, needs a claim, dependency, blocker, follow-up, spec, ticket frontier, wayfinding map, or handoff.
---

# Beads

Beads owns durable project task state. It does not own reusable knowledge,
runtime memory, research archives, or product direction.

## Trigger

Use for work whose claim, dependencies, decisions, blocker, proof, or next
action must survive this chat. Skip mutation for one-turn explanation or
read-only work unless the user asks for durable tracking.

## Steps

1. After compaction, resume, or missing tracker context, run:

   ```bash
   rtk bd prime
   ```

   If it returns no workspace context, run `rtk bd where` before assuming Beads
   is unavailable.

2. Choose the narrowest mode before changing issues:

   | Mode | Input | Output | Stop gate |
   |---|---|---|---|
   | `triage` | backlog, blocker, follow-up, status | claimed, updated, closed, or new issue | next action and owner are represented |
   | `to-spec` | rough intent | one settled spec issue | slicing needs no invented requirement |
   | `to-tickets` | settled spec | vertical issues plus dependency edges | `bd ready` exposes the frontier |
   | `wayfinding` | destination with a foggy route | map issue plus decision/blocker work | destination, fog, and frontier are visible |
   | `handoff` | meaningful live state | compact continuation record | a fresh agent can resume without a broad reread |

   Load `references/planning-modes.md` before `to-spec`, `to-tickets`,
   `wayfinding`, or `handoff`, then use the matching file in `templates/`.

3. Inspect before mutating, then claim atomically:

   ```bash
   rtk bd ready
   rtk bd show <id>
   rtk bd update <id> --claim
   ```

   Create an issue only when no existing issue owns durable work. Use native
   dependency edges when one issue blocks another.

4. Keep the issue current with acceptance, relevant decisions, dependencies,
   blocker ownership, verification, and non-proof. Put reusable source or
   knowledge decisions through their KRN store-backed owner instead of Beads.

5. Close only when acceptance is satisfied and the issue records verification,
   non-proof, and publication state. `not_run`, `unavailable`, `not_authorized`,
   or `not_applicable` are honest states; a push is not semantic proof.

## Output

- Mode used and why.
- Claimed, created, updated, blocked, handed-off, or closed issue.
- Dependency edge when ordering is real.
- Verification, non-proof, and publication state for completed work.
- No parallel Markdown task ledger.

## Stop Condition

Stop when the durable next action has one owner, real blockers are native edges
or named human decisions, the ready frontier is truthful, and completed work
has acceptance plus proof/non-proof recorded.

## Verification

For tracker workflow changes, verify the live CLI and exported state:

```bash
rtk bd --version
rtk bd ready --json
rtk git diff --check
```

Use repository gates only when tracked code or artifacts changed.

## Forbidden

- Do not use `bd edit`; use non-interactive update flags.
- Do not auto-close incomplete work or create broad epics disguised as ready
  slices.
- Do not represent a real dependency only in prose.
- Do not use Beads as runtime memory, a source archive, or proof of behavior.
- Do not require commits, pushes, or cleanup outside the owned and authorized
  workflow.
