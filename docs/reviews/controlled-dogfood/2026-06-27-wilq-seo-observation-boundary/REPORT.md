# WILQ SEO Observation-Only Boundary Scenario

Status: complete.
Scenario ID: V04-SC-003.
Mode: observation-only.
Date: 2026-06-27.

## Product Question

Does `$target-repo-testing` correctly keep a living dirty target repo as
observation-only evidence instead of inviting KRN to patch or normalize it?

## Boundary

Allowed reads:

- `/home/krn/coding/krn/active/wilq-seo/AGENTS.md`;
- `/home/krn/coding/krn/active/wilq-seo/README.md`;
- target `git status --short --branch`;
- prior KRN headless target report.

Allowed writes:

- KRN report files only.

Forbidden writes:

- any `wilq-seo` source, test, docs, skill, generated, commit, reset, clean, or
  normalization change.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git -C /home/krn/coding/krn/active/wilq-seo status --short --branch` | passed, dirty | The target repo is a living dirty checkout with many modified files not owned by this KRN scenario. | Does not prove target correctness or KRN source correctness. |
| `sed -n '1,120p' /home/krn/coding/krn/active/wilq-seo/AGENTS.md` | passed | Target guidance exists and says active recovery/progress docs are the target truth. | Does not authorize target writes. |
| `sed -n '1,120p' /home/krn/coding/krn/active/wilq-seo/README.md` | passed | Target repo identity and local verification commands were inspectable. | Does not prove commands currently pass. |
| `bash -lc 'test -f /home/krn/coding/krn/active/wilq-seo/AGENTS.md && echo wilq-agents-exists'` | passed | The target `AGENTS.md` file exists. | Does not prove the full target recovery index is current. |

Note: an initial `rtk test -f ...` command was not valid through RTK and printed
shell option help. It is excluded as behavior evidence and was replaced by the
explicit `bash -lc` check above.

## Findings

- `$target-repo-testing` selected the correct mode: observation-only.
- The target repo is dirty with many active changes across skills, dashboard
  routes, tests, scripts, and Python modules.
- The safe KRN action is to record target dirty state and stop before any
  target repair. This matches the skill/runbook boundary.
- KRN EvidenceBundle still does not classify target dirty files unless target
  evidence is recorded manually. That remains a product candidate, not a reason
  to patch `wilq-seo` here.

## Condensation Decision

- Finding: Living target dirty state must remain external operator context in
  observation-only target scenarios.
- Frequency: repeated/high-risk; it appeared in the prior headless trial and is
  confirmed again by current target status.
- Condensation target: skill/runbook already implemented; possible future
  evidence-readback repair.
- Decision: deferred for source repair, accepted as evidence for future
  target-aware evidence capture candidate.
- Implemented now: no new target or KRN source change.
- Evidence: target status command; target AGENTS/README read; prior headless
  target report.
- Why not more: writing or cleaning the target repo would violate the active
  observation-only boundary.
- Next bounded repair: evaluate target-aware evidence capture separately if it
  can be implemented in KRN without touching the target repo.

## What This Proves

- The target-repo-testing skill can keep a live dirty target scenario in
  observation-only mode.
- Current `wilq-seo` is not a safe uncontrolled repair target.

## What This Does Not Prove

- Target tests pass.
- KRN can repair the target.
- V02-01 second-operator usability.
- Product readiness.

