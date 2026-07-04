# Coding-Task Memory Decision

Bead: `mise-en-palace-2gti`

## Change

`eval:memory-advantage` now includes a held-out coding-task decision proxy.
The new `heldout-coding-task-json-boundary` case asks whether CLI JSON
metadata readback should cast parsed JSON directly or route it through an
unknown-first parser helper.

The simple lexical baseline selects the tempting cast packet first. KRN selects
the accepted source evidence for the unknown-first parser boundary. The
reported implementation decision is derived mechanically from selected ids, not
hand-authored in the readback.

## Proof

Local verification:

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
```

The eval output shows:

- `codingTaskCaseCount: 1`;
- case id: `heldout-coding-task-json-boundary`;
- simple retrieval top id: `pattern:cast-json-record-in-command-runner`;
- baseline coding decision: `decision:cast-json-record`;
- KRN selected source id: `source:unknown-first-json-metadata-boundary`;
- KRN coding decision: `decision:unknown-first-parser`;
- KRN decision derivation order: `source_claims_first`;
- memory-first counterfactual decision: `decision:cast-json-record`;
- coding-task decision status: `pass`.

## Second Opinion

`second-opinion-claude` R1 returned `approve_with_fixes` / MEDIUM. It found
three issues:

- source-first decision ordering was load-bearing but not explicit enough;
- `coding_task_decision` did not carry selected context size directly;
- the report could be misread as proving KRN filtered the deferred cast-memory
  packet, when the actual proof is source-claim ordering.

The fix added `decisionDerivationOrder: source_claims_first`,
`memoryFirstCounterfactualDecisionId`, and `selectedContextSize` to the coding
decision readback, asserted them in tests, and clarified the proof boundary.

R2 returned `approve` / LOW for the F1-F3 follow-up.

## Non-Proof

This does not execute Codex, mutate a target repo, prove arbitrary code quality,
or prove production retrieval quality. It is a deterministic proxy that checks
whether selected KRN memory/source ids can change an implementation decision in
one company TypeScript boundary scenario.

The case does not prove that KRN filtered the deferred cast-memory packet out of
all selected context. The decision advantage comes from accepted SourceClaim
evidence being evaluated before memory patterns in this coding-task proxy.
