# Handoff: `second-opinion-claude` refined

> For Codex continuation. Canonical order: `GOAL.md` → `PLAN.md` → `PLANS.md` →
> `docs/KRN_KERNEL.md`. This handoff only summarizes work done and tells you the
> next action. It does **not** change goal docs — that is your call (see below).

## What changed this session

Audited and surgically refined `.agents/skills/second-opinion-claude/`. Commits
on `origin/main`:

- `1ce2319 fix: make second-opinion-claude run autonomously`
- `7b52903 fix: make second-opinion prompt cap UTF-8-safe`

Key fixes (full audit in commit bodies):

- **Hard blocker removed:** `run_review.sh` passed `--max-turns`, which is **not
  a real `claude` flag** → every review call failed at arg-parse. Dropped.
  Single-turn is already enforced by `--tools ""` (no tools ⇒ one response);
  real bounds are `--max-budget-usd` + local timeout.
- Context-pack diff is now `git diff HEAD` (staged slices no longer show an
  empty diff); `bd ready` errors are surfaced instead of blank; whole-prompt
  size cap added (`SECOND_OPINION_PROMPT_MAX_BYTES`, UTF-8-safe truncation).
- `approve_with_fixes` now requires ≥1 finding (was gameable).
- `SKILL.md`: 3-move triage taxonomy, env-var table, exit-code semantics,
  conditional `quick_validate`, `## Trigger` section.
- `__pycache__` gitignored.

**Verified end-to-end:** a live headless `claude` run on a real context pack
returned a valid governed verdict (`approve`, LOW, with `evidence_gaps` +
`non_blocking_notes`, `diff_sha256` injected). `skillInvariants` 190/190.

Beads: `mise-en-palace-jqc8` (this refinement) closed. `mise-en-palace-71rh`
(P1) open — leaked GLM key in `../tour-de-controle/.env`, rotate/verify, do not
touch the value.

## How the skill works (lift this into the goal docs)

Purpose: a governed, **read-only** second-opinion reviewer. When a slice has
local evidence, an agent builds a compact context pack, summons headless Claude
to **falsify "done"** (not praise it), a validator governs the verdict, and the
orchestrating agent triages — never handing routing back to the operator unless a
product/budget/human tradeoff is needed.

Flow + commands:

```bash
# 1) build a self-contained reviewer prompt (objective, ACs, verification
#    evidence, diff vs HEAD, untracked bodies, beads snapshot, JSON contract)
SECOND_OPINION_ACCEPTANCE_CRITERIA="AC1 ..." \
SECOND_OPINION_VERIFICATION_EVIDENCE="tests run: ..." \
rtk .agents/skills/second-opinion-claude/scripts/build_context_pack.sh \
  "slice title" .local-lab/second-opinion/<slice>/prompt.md

# 2) run headless Claude → validated verdict JSON (not the SDK envelope)
SECOND_OPINION_MAX_BUDGET_USD=0.50 \
rtk .agents/skills/second-opinion-claude/scripts/run_review.sh \
  .local-lab/second-opinion/<slice>/prompt.md \
  .local-lab/second-opinion/<slice>/claude.json

# 3) (optional) re-check a committed verdict for freshness vs base
rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
  .local-lab/second-opinion/<slice>/claude.json --base origin/main
```

Exit codes: `0` = approve / approve_with_fixes; `2` = valid `block` (JSON
present, not an error); any other non-zero, or a JSON with `is_error: true`, is
an error artifact (`error_timeout` / `error_validation` / `error_exit`) —
inspect the JSON, not just `$?`. A timeout is an evidence gap, not a verdict.

Triage — for each finding/blocker pick **exactly one move** (no resolving by
opinion, max 2 fix/review loops, then human):

- `accept_and_fix` → minimal fix, verify, re-review only that point.
- `counterargue_with_evidence` → reject only with file/test/log proof; record it
  as explicit non-proof.
- `request_tie_breaker` → human for HIGH/CRITICAL risk or after 2 loops.

Knobs (all optional, defaults in `SKILL.md` `## Environment`): budget, timeout,
model, freshness base, per-diff / per-untracked / whole-prompt byte caps, and the
two injected AC/verification strings. Reviewer is read-only by construction
(`--tools ""`); keep it that way unless running a separate, budgeted experiment.

## Next action (yours)

`GOAL.md` already mandates running `second-opinion-claude` after larger slices
(Operating Rules, the "After each larger migration or audit-hardening slice"
bullet) but says **what**, not **how**. Add the "how to use" block above to the
goal surface so the next Codex thread can run it without re-deriving it:

- Preferred: a compact runbook `docs/runbooks/second-opinion-claude.md` with the
  flow + commands + triage + exit codes, linked from `GOAL.md`/`PLAN.md` with a
  one-line pointer. Keeps root goal docs compact per their own rules.
- Acceptable: a tight "how to use" subsection in `PLAN.md`.
- Do **not** bloat `GOAL.md` itself — at most a one-line pointer to the runbook.

Constraints while doing it: create/claim a Beads issue first (repo protocol),
keep edits surgical, and run `pnpm --filter @krn/harness test -- skillInvariants`
if you touch anything under `.agents/skills/`.

## Do not reread

- The skill scripts are committed and verified end-to-end; trust this summary
  unless you are editing them. Full per-file detail is in the two commit bodies.
