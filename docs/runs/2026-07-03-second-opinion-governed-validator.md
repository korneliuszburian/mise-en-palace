# Second-Opinion Claude Governed Validator

## Scope

Refined `.agents/skills/second-opinion-claude` from an SDK-envelope capture into a governed review step. The skill now requires a validated verdict JSON, deterministic cross-field checks, and diff freshness.

## Changed

- Added `scripts/validate_review.py` with `finalize` and `check` modes.
- Added `schemas/review.schema.json`.
- Added `examples/approve.review.json` and `examples/block.review.json`.
- Updated `scripts/run_review.sh` to write a clean verdict artifact after validation.
- Updated `scripts/build_context_pack.sh` with falsification-first framing, explicit acceptance/verification sections, and untracked-secret body denial.
- Updated `SKILL.md` with the verdict contract, stale-review guardrail, validator failure handling, and max-two-loop rule.

## Proof

- `quick_validate.py` passes through ephemeral `uv --with PyYAML`.
- Shell syntax passes for both edited scripts.
- `approve.review.json` validates with exit 0.
- `block.review.json` validates as a governed block with exit 2.
- Negative fixtures fail for `approve` plus findings and for empty `evidence_ref`.
- Synthetic Claude envelope finalizes into a verdict with an injected 64-hex `diff_sha256`.
- Tampered verdict hash fails freshness validation.
- Prompt pack includes JSON-only contract, acceptance criteria, verification evidence, and omits secret file bodies.
- `pnpm --filter @krn/harness test -- skillInvariants` passes.
- One real Claude run produced a top-level `verdict` artifact rather than a prose SDK envelope.

## Non-Proof

- This does not prove Claude's review is correct.
- This does not make Claude a merge gate or CI dependency.
- This does not solve the remaining worker-scope decision.
- A second larger real review timed out under the current budget; that is a budget/prompt-size signal, not a validator failure.

## Decision

The diff hash intentionally includes `.agents/**` for this skill. Excluding `.agents` would make freshness meaningless while editing the second-opinion skill itself.
