# Second-Repo Decision-Packet Dry Run

Bead: `mise-en-palace-v4e9`

## Outcome

Added `eval:second-repo-decision-packet`, a deterministic dry run over the
existing `weak-json-boundary-typescript` target repo fixture.

The eval wraps the existing notes-baseline and decision-packet gates on a second
corpus and adds target-specific checks:

- repo-specific governing decisions are present;
- reusable KRN TypeScript patterns are present without self-repo plan evidence;
- rejected-path and stale-decision readback are present;
- scanned self-repo KRN evidence refs are absent from decision and case
  references.

## Result

```txt
status: pass
targetRepo: weak-json-boundary-typescript
caseCount: 15
repoSpecificDecisionCount: 12
reusablePatternDecisionCount: 3
rejectedPathCount: 5
staleDecisionCount: 5
notesKrnWinRate: 1
decisionPacketUsefulRate: 1
selfRepoContaminationCount: 0
```

## Proof

Proves:

- the decision-packet and notes-baseline evals run on a second target-repo
  corpus;
- the second corpus carries target-repo-backed governing decisions;
- reusable KRN TypeScript patterns can appear as governed pattern reuse without
  importing scanned self-repo PLAN/KRN architecture evidence;
- rejected-path and stale-decision readback are present.

Does not prove:

- commercial validation;
- live Codex execution or obedience;
- arbitrary repository portability;
- source truth;
- semantic repo-specificity beyond id prefix plus target-repo evidenceRef
  convention;
- every reusable pattern transfers cleanly.

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` with `MEDIUM` risk.

Accepted fixes:

- expanded self-repo contamination scanning from `decisions[].evidenceRef` to
  decision and case reference fields;
- widened self-repo prefixes to include active run/package/beads surfaces;
- tightened repo-specific counting to require the `weak-json-` id convention
  plus target-repo fixture evidence refs;
- added negative tests for self-repo contamination and loss of target-repo-backed
  decisions;
- added a focused case-level negative test with a schema-valid path-shaped
  rejected decision ref after the focused re-review caught that case refs were
  not live-tested;
- added a non-proof for repo-specificity beyond the proxy convention.

## Verification

```sh
pnpm --filter @krn/cli test -- secondRepoDecisionPacketEval notesBaselineEval decisionPacketEval
pnpm --filter @krn/cli test -- secondRepoDecisionPacketEval
pnpm --filter @krn/cli typecheck:tests:clean
pnpm eval:second-repo-decision-packet
pnpm eval:determinism
pnpm eval:behavior:smoke
pnpm docs:lint
pnpm -r --workspace-concurrency=1 --if-present typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```
