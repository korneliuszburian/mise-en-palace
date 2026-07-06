# Notes-Baseline Eval (yb2n)

Status: implemented and second-opinion triaged.

## Change

Added `eval:notes-baseline`, a deterministic comparison between KRN governed
decision packets and a comprehensive `NOTES.md` plus grep baseline.

The fixture uses 17 self-repo task framings, 34 decision rows, and 34 flat notes.
The notes baseline contains the governing decision text, so it ties KRN on raw
expected-decision recall. KRN only wins when it adds the predeclared structural
value: decision-edge evidence, falsifier, does-not-prove boundary, stale
exclusion, and rejected-path visibility without more noise. Ceremony is reported
separately from noise: KRN intentionally carries more structured packet fields
than flat notes, while the win rule constrains irrelevant selected-decision
noise.

## Proof

- `pnpm eval:notes-baseline` passes.
- Notes recall rate: `1`.
- KRN recall rate: `1`.
- KRN wins: `16/17`.
- Notes wins: `0/17`.
- Ties: `1/17`.
- Governed boundary rate: `1`.
- Stale exclusion cases: `13`.
- Rejected-path cases: `16`.
- Notes stale/rejected noise cases: `16`.
- One control case ties because KRN has governed boundary metadata but no stale
  or rejected-path value is applicable.
- Negative tests fail when KRN only ties notes without stale/rejected value or
  when notes beats KRN recall.
- `pnpm eval:determinism` includes notes-baseline and reports bit-identical
  consecutive output.

## Non-Proof

This does not prove live Codex execution or obedience, operator willingness to
pay, broad arbitrary-repo advantage, source truth, production semantic retrieval
quality, or that notes files cannot be manually maintained with falsifiers and
rejection records.

## Second Opinion

`second-opinion-claude` first returned `approve_with_fixes` and found three
review issues:

- F1: the initial context pack truncated the runner before winner/noise logic;
- F2: the notes stale/rejected-noise metric counted the control case;
- F3: the behavior matrix needed to make the structural-by-design nature visible.

F2/F3 were fixed. The final full-file review artifacts could not produce a
validator-clean JSON because Claude broke the response format twice, first with
extra keys and then with a non-object note. Both invalid artifacts nevertheless
returned `approve`, `LOW`, no findings, and no evidence gaps after reading the
full runner, test, and fixture. Per the skill guardrail, those invalid artifacts
are not treated as formal approval; they are recorded as advisory evidence that
F1 was not falsified, while local tests and the deterministic eval remain the
hard proof.

## Verification

```txt
pnpm --filter @krn/cli test -- notesBaselineEval deterministicEval
pnpm --filter @krn/cli test -- notesBaselineEval deterministicEval sourceGraphRankingEval
pnpm eval:notes-baseline
pnpm eval:determinism
pnpm eval:source-graph-ranking
pnpm run typecheck
pnpm docs:lint
pnpm quality:fallow:ci
pnpm test
pnpm eval:behavior:smoke
git diff --check
```
