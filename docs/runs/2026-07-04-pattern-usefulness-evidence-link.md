# Pattern Usefulness Evidence Link

## Slice

Bead: `mise-en-palace-i3su`

## Change

Persisted `krn evidence capture --pattern-usefulness` now normalizes usefulness
outcomes against the current evidence path before writing the feedback delta.

Current evidence refs include:

- the created `EvidenceBundle` id;
- the created `ReviewAssessment` id;
- changed file paths captured in the evidence bundle;
- command output refs supplied through explicit command evidence.

If a supplied pattern/source usefulness outcome claims `helped`, `used`,
`selected`, `neutral`, `noise`, or `stale` but none of its `evidenceRefs` match
current evidence, the persisted and rendered outcome is downgraded to `unknown`
with a downgrade reason. `unknown` stays `unknown`.

## Proof

```txt
pnpm --filter @krn/cli test -- evidence
58 files passed, 372 tests passed

pnpm typecheck
git diff --check
```

The focused regression proves a stale pattern usefulness proof ref is not
persisted or rendered as `helped`. After second-opinion review, the same
regression also covers stale source usefulness proof refs because the source and
pattern branches share the same downgrade policy.

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes`, LOW risk.

Accepted finding:

- F1: source usefulness downgrade used the same normalization path as pattern
  usefulness but lacked focused coverage.

Fix:

- extended the regression to pass stale `--source-usefulness` and assert stdout
  plus feedback delta metadata persist `unknown` with the downgrade reason.

Evidence gap triage:

- positive survival is covered by the existing persisted evidence capture test:
  `evidence-bundle-1` remains linked and the original `helped` outcome is
  retained for both source and pattern usefulness.

## Non-Proof

This does not judge whether a pattern actually improved Codex output. It only
prevents evidence capture from recording a strong usefulness outcome when the
outcome is not linked to current evidence/command proof.

## Rollback Risk

Medium. Persisted usefulness metadata can become stricter: old scripts that pass
stale or arbitrary evidence refs will now see `unknown` instead of the requested
strong outcome. That is intentional because it surfaces missing proof instead of
turning a pattern card into fake learning.
