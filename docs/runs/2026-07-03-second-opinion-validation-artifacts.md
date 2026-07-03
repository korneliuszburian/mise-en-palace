# Second-Opinion Validation Artifacts

Date: 2026-07-03
Bead: `mise-en-palace-2ksv`

## Change

Hardened `.agents/skills/second-opinion-claude` after a real review returned a
schema-invalid JSON object with useful review content.

Validation failures now preserve inspectable artifacts:

- `validate_review.py finalize` writes `error_validation` with
  `invalid_verdict` when it can extract a verdict-shaped object that fails the
  governed schema.
- `run_review.sh` copies the raw Claude SDK envelope beside the output as
  `*.envelope.json` on validation failure.
- negative fixtures cover unknown top-level keys and invalid `review_version`.

## Proof

Proves:

- invalid model output is not treated as approval;
- rejected verdict content remains inspectable for triage;
- the exact observed failure class, unknown keys, is covered by a fixture;
- the `review_version` strictness failure is covered by a fixture.

Does not prove:

- Claude will obey the schema;
- every invalid envelope is extractable;
- second-opinion review quality;
- CI/product readiness for implementation slices.

## Verification

Passed:

```sh
bash -n .agents/skills/second-opinion-claude/scripts/build_context_pack.sh
bash -n .agents/skills/second-opinion-claude/scripts/run_review.sh
.agents/skills/second-opinion-claude/scripts/validate_review.py check .agents/skills/second-opinion-claude/examples/approve.review.json
.agents/skills/second-opinion-claude/scripts/validate_review.py check .agents/skills/second-opinion-claude/examples/block.review.json
! .agents/skills/second-opinion-claude/scripts/validate_review.py check .agents/skills/second-opinion-claude/examples/invalid-extra-key.review.json
! .agents/skills/second-opinion-claude/scripts/validate_review.py check .agents/skills/second-opinion-claude/examples/invalid-review-version.review.json
validate_review.py finalize synthetic invalid envelope writes invalid_verdict
run_review.sh fake-claude smoke preserves claude.envelope.json
pnpm --filter @krn/harness test -- skillInvariants
pnpm quality:fallow:ci
git diff --check
```
