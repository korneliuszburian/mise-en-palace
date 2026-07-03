# Second-Opinion Claude Runbook

Status: active runbook.

Use this after a larger migration, authority-boundary change, cleanup wave, or
Beads slice that needs independent challenge. Claude is a governed, read-only
reviewer. It falsifies "done"; Codex still owns verification, triage, fixes,
Beads state, commit, push, and CI.

## Boundary

Use the repo-local skill for the detailed contract:

```txt
.agents/skills/second-opinion-claude/SKILL.md
```

Do not use this workflow for trivial edits. Do not give Claude tools or write
authority for normal reviews. Do not send secrets, `.env` files, DB dumps, raw
audit archives, or broad historical ledgers.

## Flow

1. Build a compact reviewer prompt after local evidence exists:

   ```sh
   SECOND_OPINION_ACCEPTANCE_CRITERIA="AC1 ..." \
   SECOND_OPINION_VERIFICATION_EVIDENCE="tests run: ..." \
   rtk .agents/skills/second-opinion-claude/scripts/build_context_pack.sh \
     "slice title" .local-lab/second-opinion/<slice>/prompt.md
   ```

   The pack includes the objective, acceptance criteria, verification evidence,
   repo state, diff against `HEAD`, capped untracked file bodies, and Beads
   snapshot. Missing acceptance or verification evidence is a review input gap.

2. Run headless Claude and write a validated verdict JSON:

   ```sh
   SECOND_OPINION_MAX_BUDGET_USD=0.50 \
   rtk .agents/skills/second-opinion-claude/scripts/run_review.sh \
     .local-lab/second-opinion/<slice>/prompt.md \
     .local-lab/second-opinion/<slice>/claude.json
   ```

   The output file is the governed verdict, not the Claude SDK envelope.
   `validate_review.py finalize` injects `diff_sha256` and checks the verdict
   shape and freshness.

3. Re-check a saved verdict when needed:

   ```sh
   rtk .agents/skills/second-opinion-claude/scripts/validate_review.py check \
     .local-lab/second-opinion/<slice>/claude.json --base origin/main
   ```

## Exit Codes

```txt
0: valid approve or approve_with_fixes verdict
2: valid block verdict; JSON is present and must be triaged
other non-zero: wrapper, timeout, model, or validation error
```

If the output JSON has `is_error: true`, treat it as an error artifact
(`error_timeout`, `error_validation`, or `error_exit`). A timeout is an evidence
gap, not a review verdict.

## Triage

For every finding or blocker, choose exactly one move:

```txt
accept_and_fix:
  apply the minimal fix, verify, and re-review only that point when useful.

counterargue_with_evidence:
  reject only with file, test, log, or command proof; record the proof and the
  non-proof boundary.

request_tie_breaker:
  use only for HIGH/CRITICAL risk, a product or budget decision, or after two
  fix/review loops.
```

Do not resolve a finding by opinion. Do not route normal triage back to the
operator. File follow-up Beads work for valid non-blocking findings.

## Environment

All knobs are optional. Defaults live in the skill.

```txt
SECOND_OPINION_MAX_BUDGET_USD
SECOND_OPINION_TIMEOUT_SECONDS
SECOND_OPINION_MODEL
SECOND_OPINION_BASE
SECOND_OPINION_DIFF_MAX_BYTES
SECOND_OPINION_UNTRACKED_MAX_BYTES
SECOND_OPINION_PROMPT_MAX_BYTES
SECOND_OPINION_ACCEPTANCE_CRITERIA
SECOND_OPINION_VERIFICATION_EVIDENCE
```

Use the premium model only when the slice warrants the limited budget. Ordinary
smoke checks should use the local Claude Code default.

## What It Proves

```txt
proves:
  a read-only independent reviewer saw the supplied context and emitted a
  schema-valid, diff-fresh verdict.

does not prove:
  Claude is correct, local tests passed, CI passed, the slice is product-ready,
  or the context pack included everything important.
```
