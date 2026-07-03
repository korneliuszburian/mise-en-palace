# Post-Graph Feedback Next Queue

Date: 2026-07-03

## Scope

After the source-edge scoring policy extraction, positive SourceClaimEdge
ranking proof, and retained pattern usefulness feedback, run
`second-opinion-claude` to falsify the next kernel queue and produce bounded
follow-up work.

Reviewed range: `648a8774..c85708ce`.

## Claude Verdict

Validated artifact:

```txt
.local-lab/second-opinion/post-graph-feedback-next-queue/claude.json
```

Verdict: `approve_with_fixes`
Risk: `LOW`

## Triage

Finding F1 accepted.

Claude found that `docs/brain-knowledge/catalog.json` listed
`usefulnessFeedbackFiles`, but no automated test proved every listed feedback
file exists and parses with the expected shape.

Fix:

```txt
packages/harness/src/brainKnowledgeReadModelInvariants.test.ts
```

The invariant now loads every catalog feedback file through
`parseBrainKnowledgeUsefulnessFeedbackList` and asserts at least one valid
feedback item.

Evidence gap resolved:

```txt
docs/runs/2026-07-03-retained-pattern-brain-code-quality.md exists.
```

## New Queue

Created Beads:

```txt
mise-en-palace-9v8s — Require embedding model for vector retrieval
mise-en-palace-jjfa — Remove orphan capability binding candidate types
```

Rationale:

`9v8s` is the higher-impact correctness follow-up: vector retrieval should not
silently compare embeddings across model boundaries.

`jjfa` is low-risk cleanup from the verified post-refactor residual list:
remove only orphaned capability binding candidate types after checking current
usage.

## Verification

```txt
pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants
pnpm -w typecheck
git diff --check
```

## Proof Boundary

Proves:

- Claude review output is governed JSON, not prose;
- catalog feedback files are present and parser-valid;
- the next queue is represented in Beads.

Does not prove:

- retrieval ranking quality;
- vector model-boundary enforcement;
- capability-plan surface minimality;
- KRN product readiness.
