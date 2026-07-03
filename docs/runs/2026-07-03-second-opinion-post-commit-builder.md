# Second-Opinion Post-Commit Builder

Date: 2026-07-03
Beads: `mise-en-palace-jjrm`

## Change

`build_context_pack.sh` now supports `SECOND_OPINION_CONTEXT_BASE` so committed
slice reviews can use the governed prompt builder instead of hand-written
post-commit prompts. The prompt also forbids extra top-level verdict keys,
wrong verdict enums such as `approved`, and non-schema finding severities such
as `none`.

The invalid extra-key fixture now mirrors the observed failure mode:
`answers` and `next_tasks`.

## Proof

- `bash -n .agents/skills/second-opinion-claude/scripts/build_context_pack.sh`
- `bash -n .agents/skills/second-opinion-claude/scripts/run_review.sh`
- `! .agents/skills/second-opinion-claude/scripts/validate_review.py check .agents/skills/second-opinion-claude/examples/invalid-extra-key.review.json`
- Built a prompt with `SECOND_OPINION_CONTEXT_BASE=3358470d0ff8240a4bf864f2747e75fca8e0e232` and verified it contains the diff base plus exact-schema guardrails.

## Boundary

Proves the reusable builder path covers committed-range reviews and the
validator rejects the known extra-key failure shape.

Does not prove Claude will always follow the schema; validator failure remains
non-approval and must be triaged from preserved artifacts.
