---
name: second-opinion-claude
description: Use when KRN needs independent second-opinion review through non-interactive Claude Code: governed implementation verdicts after large slices, or read-only strategy reviews for naming, CLI concept models, roadmap direction, architecture tradeoffs, and next-slice synthesis.
---

# Second Opinion Claude

Use this skill after a slice has local evidence, not as a substitute for tests
or engineering judgment. Claude is a reviewer, not the source of truth.

## Trigger

- After a large refactor, authority-boundary change, or cleanup wave.
- Before closing Beads work that needs challenge, proof/non-proof review, and
  next-slice synthesis.
- When local evidence exists but an independent, read-only falsifier should
  stress "done" before merge or closure.
- When Codex needs a strategic second opinion on naming, CLI concept shape,
  roadmap direction, architecture boundaries, or Beads decomposition without a
  diff approval.
- Skip for trivial edits where local tests and review are enough.

## Workflow

Choose one mode:

- **Implementation verdict**: use `build_context_pack.sh` and `run_review.sh`
  after code changed. Output is validated JSON with diff freshness.
- **Strategy review**: use `run_strategy_review.sh` before or between slices
  when the question is conceptual. Output is advisory Markdown, not approval.

### Implementation Verdict

1. Build a compact context pack:

   ```bash
   rtk .agents/skills/second-opinion-claude/scripts/build_context_pack.sh \
     "slice title" \
     .local-lab/second-opinion/slice-title/prompt.md
   ```

   Add only task-local evidence: objective, Beads id, changed files, diff stat,
   capped diff, untracked file bodies, relevant verification output, known
   non-goals, and exact review questions. Do not paste the whole repo,
   historical ledgers, or raw audit archives.

   For an already committed range, set `SECOND_OPINION_CONTEXT_BASE` to the
   base commit before building the pack and set the same value as
   `SECOND_OPINION_BASE` when running the review. This avoids hand-written
   post-commit prompts with stale or empty diffs.

2. Run Claude Code headless with budget caps:

   ```bash
   SECOND_OPINION_MAX_BUDGET_USD=0.50 \
   rtk .agents/skills/second-opinion-claude/scripts/run_review.sh \
     .local-lab/second-opinion/slice-title/prompt.md \
     .local-lab/second-opinion/slice-title/claude.json
   ```

   Output is a validated verdict JSON, not a Claude SDK envelope. The wrapper
   disables Claude tools by default, has a local timeout, injects the current
   `diff_sha256`, and exits `2` for a valid blocking verdict. Exit `0` means
   `approve` or `approve_with_fixes`; exit `2` means a valid `block` verdict
   (JSON present, not an error). Any other non-zero exit, or a JSON with
   `is_error: true`, is an error artifact — inspect the JSON, not just `$?`.
   Set `SECOND_OPINION_MODEL` only when the slice warrants the limited premium
   model. Default to the local Claude Code model configuration for cheap smoke
   checks. Set `SECOND_OPINION_BASE` when the freshness base is not `origin/main`.
   If validation fails, the wrapper writes `error_validation`; schema-shaped
   rejected verdicts are preserved under `invalid_verdict`, and the raw Claude
   envelope is copied beside the output as `*.envelope.json`. If the local
   timeout fires, the wrapper writes a JSON timeout artifact and exits non-zero;
   treat that as an evidence gap, not as a review verdict.

   Re-check a committed verdict:

   ```bash
   rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
     .local-lab/second-opinion/slice-title/claude.json --base origin/main
   ```

3. Triage the result. For each finding or blocker choose exactly one move:

   - `accept_and_fix`: apply the minimal fix, verify, re-review only that point.
   - `counterargue_with_evidence`: reject only with file/test/log proof; record
     the proof as explicit non-proof of the finding.
   - `request_tie_breaker`: escalate to a human for HIGH/CRITICAL risk, or after
     two fix/review loops.

   Map the move onto routing: `must_fix` (accept_and_fix) implements before
   closure; `evidence_gap` (accept_and_fix or counterargue) runs focused proof
   or records non-proof; `follow_up` opens or updates a Beads issue; `rejected`
   (counterargue_with_evidence) keeps only with local code/test evidence. Never
   resolve a finding by opinion.

   Codex owns this triage. Do not hand the operator a prompt or ask them to
   route the review unless the finding requires a product decision, budget
   decision, or explicit human tradeoff.

4. Continue only when useful:

   - For one-shot review, stop after one JSON result.
   - For back-and-forth, run a second compact prompt containing only the
     previous finding, the applied fix or rejection evidence, and the remaining
     question. Do not start open-ended debate loops.
   - Run at most two fix/review loops before requiring a human product or budget
     decision.

5. Close the slice only after Codex has made the final call, local verification
   passed, Beads state is updated, and the final handoff records what Claude did
   and did not prove.

### Strategy Review

Use this mode for architecture/naming/roadmap questions where a diff verdict
would be fake precision.

1. Write one compact prompt file under `.local-lab/second-opinion/<topic>/`.
   Include the question, current decision pressure, relevant authority surfaces,
   constraints, rejected options, and the output you need. Do not paste broad
   docs or whole audits.

2. Run the strategy reviewer:

   ```bash
   rtk env SECOND_OPINION_MAX_BUDGET_USD=10 \
     .agents/skills/second-opinion-claude/scripts/run_strategy_review.sh \
     .local-lab/second-opinion/<topic>/question.md \
     .local-lab/second-opinion/<topic>/strategy.md
   ```

   The script disables Claude tools, writes Claude's SDK envelope beside the
   answer, and saves only the model's result Markdown to the output file. It
   does not validate a diff hash and does not approve implementation.

3. Triage the result as advisory input:

   - adopt a direction only when it improves the roadmap or current Beads work;
   - reject with local evidence when the recommendation conflicts with current
     code, roadmap, or product constraints;
   - create Beads only for concrete follow-up work with dependencies,
     acceptance, and falsifier;
   - do not add markdown ledgers, aliases, compatibility shims, or broad docs as
     a substitute for implementation.

4. Use implementation verdict mode after a strategy-driven code slice is ready.

## Verdict Contract

The verdict schema lives at `schemas/review.schema.json`. Examples live in
`examples/approve.review.json` and `examples/block.review.json`.

Required shape:

```txt
review_version: "1"
verdict: approve | approve_with_fixes | block
risk_class: LOW | MEDIUM | HIGH | CRITICAL
diff_sha256: injected by validate_review.py finalize
summary: <=300 chars
findings[].evidence_ref: required
evidence_gaps[].verification_requested: required
another_loop_required: block requires true
non_blocking_notes[]: required (may be empty)
approve: findings must be empty
approve_with_fixes: requires >=1 finding
```

Required context:

```txt
slice objective:
beads issue:
repo state:
changed files:
diff stat:
tests/verification already run:
known non-goals:
review questions:
```

## Environment

All optional; defaults shown.

| Variable | Default | Effect |
| --- | --- | --- |
| `SECOND_OPINION_MAX_BUDGET_USD` | `0.50` | `--max-budget-usd` cap on the review call |
| `SECOND_OPINION_TIMEOUT_SECONDS` | `120` | local wall-clock timeout; overrun writes `error_timeout` |
| `SECOND_OPINION_MODEL` | local Claude Code model | override model for premium slices |
| `SECOND_OPINION_BASE` | `origin/main` | freshness base for `diff_sha256` |
| `SECOND_OPINION_CONTEXT_BASE` | `HEAD` | diff base used by `build_context_pack.sh`; set to the pre-slice commit for committed reviews |
| `SECOND_OPINION_DIFF_MAX_BYTES` | `60000` | per-diff byte cap |
| `SECOND_OPINION_UNTRACKED_MAX_BYTES` | `20000` | per-untracked-file byte cap |
| `SECOND_OPINION_PROMPT_MAX_BYTES` | `120000` | whole-prompt cap; overrun truncates with a notice |
| `SECOND_OPINION_ACCEPTANCE_CRITERIA` | gap placeholder | injected into the pack |
| `SECOND_OPINION_VERIFICATION_EVIDENCE` | gap placeholder | injected into the pack |

`run_strategy_review.sh` uses the same budget, timeout, and model variables.
Both scripts require a Claude CLI that supports `--tools ""`,
`--output-format json`, `--max-budget-usd`, and `--no-session-persistence`. If
the local CLI rejects those flags, the output is an error artifact, not a
verdict or strategy decision.

## Guardrails

- Prefer `--bare`, explicit prompt context, JSON output, and `--max-budget-usd`.
  The reviewer is single-turn by construction (`--tools ""` ⇒ one bounded
  response); the real bounds are budget and the local timeout, not a turns cap.
- Keep Claude read-only by default. Do not let the reviewer edit files.
- Disable tools for ordinary review; add repo access only in a separate,
  explicitly budgeted experiment.
- Treat a context pack that omits changed or untracked implementation files as
  invalid review input.
- Treat `error_timeout` output as a prompt-size/budget tuning issue before
  trusting the review loop.
- Treat validator failure or non-JSON model output as no verdict, not as
  approval. Inspect `invalid_verdict` / `*.envelope.json` before retrying.
- Reject a verdict whose `diff_sha256` does not match the current diff.
- Do not send secrets, `.env`, private tokens, full DB dumps, or huge ledgers.
- Do not treat a closed Beads issue, passing CI, or Claude approval as proof by
  itself.
- Do not create a new skill for every review pattern. Improve this one only
  when a repeated failure appears.
- Do not treat strategy review output as a governed verdict. It is direction
  input; code still needs local verification and, for larger slices,
  implementation verdict review.
- Do not use this skill for trivial edits where local tests and review are
  enough.

## Verification

For skill changes:

```bash
rtk bash -n .agents/skills/second-opinion-claude/scripts/build_context_pack.sh
rtk bash -n .agents/skills/second-opinion-claude/scripts/run_review.sh
rtk bash -n .agents/skills/second-opinion-claude/scripts/run_strategy_review.sh
rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
  .agents/skills/second-opinion-claude/examples/approve.review.json
rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
  .agents/skills/second-opinion-claude/examples/block.review.json
! rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
  .agents/skills/second-opinion-claude/examples/invalid-extra-key.review.json
! rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
  .agents/skills/second-opinion-claude/examples/invalid-review-version.review.json
rtk .agents/skills/second-opinion-claude/scripts/build_context_pack.sh \
  "second-opinion smoke" .local-lab/second-opinion/smoke/prompt.md
rtk rg -n "second-opinion-claude/SKILL.md|run_review.sh|build_context_pack.sh" \
  .local-lab/second-opinion/smoke/prompt.md
rtk bash -lc "printf 'Question: Should KRN use one public brain CLI noun?\n' \
  > .local-lab/second-opinion/smoke/strategy-question.md"
rtk env SECOND_OPINION_TIMEOUT_SECONDS=120 \
  .agents/skills/second-opinion-claude/scripts/run_strategy_review.sh \
  .local-lab/second-opinion/smoke/strategy-question.md \
  .local-lab/second-opinion/smoke/strategy.md
rtk rg -n "## Decision|## Beads|## Evidence Gaps" \
  .local-lab/second-opinion/smoke/strategy.md
# Optional codex skill-creator structural check (needs pyyaml); non-fatal if absent.
q="${CODEX_QUICK_VALIDATE:-/home/krn/.codex/skills/.system/skill-creator/scripts/quick_validate.py}"
[[ -x "$q" ]] && rtk "$q" .agents/skills/second-opinion-claude 2>/dev/null \
  || echo "skip quick_validate (absent or missing pyyaml; set CODEX_QUICK_VALIDATE)"
```

For a real slice:

```bash
rtk git diff --stat
rtk git diff --check
rtk pnpm typecheck
```

Add narrower package tests, DB smokes, Fallow, or CI checks according to the
slice's touched surface.
