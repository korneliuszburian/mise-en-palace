# IMR-40 Natural Source/Eval Recall Repair

Status: complete.

Issue: `mise-en-palace-2fl`

## Executive Verdict

Natural source/brain search now surfaces the retained IMR-38 source/eval follow-up
evidence without relying on the marker query. The repair is bounded: source
search scans a wider SourceClaim set before ranking small operator output, and
the answer package exposes read-only `SourceDecisionEdge` support for included
SourceClaims.

This improves retained evidence reuse. It does not prove source truth, ranking
quality, semantic search quality, product readiness, eval promotion, or Memory
Core mutation safety.

## Scope

Retained evidence repaired:

```txt
SourceClaim: 190f1f72-4621-49b4-b93c-538ea2c581ef
SourceDecisionEdge: 73e266bb-e957-4a07-aa62-fe74cb7178a0
target: eval_candidate/activation-utility-source-eval-follow-up-imr-38
natural query:
  IMR-37 heartbeat-routed activation utility candidate is accepted for manual source eval follow-up only
```

Non-goals:

- no broad ranking rewrite;
- no semantic model;
- no crawler;
- no worker daemon;
- no API/MCP;
- no DB schema;
- no source truth mutation;
- no eval promotion;
- no Memory Core mutation.

## Source To Decision

Source:
IMR-39 DB-backed replay showed marker-addressed evidence worked, but natural and
exact-claim queries missed the exact retained SourceClaim/SourceDecisionEdge.

Mechanism:
`krn source search` applied the operator `--limit` to SourceClaims before
ranking, so a small limit could exclude the best retained SourceClaim before
lexical scoring. It also summarized SourceClaim relation edges but not
SourceDecisionEdge target support.

KRN implication:
Retained follow-up evidence must be visible through natural source/brain search
before it can act as reusable brain evidence for future source/eval decisions.

Decision:
For source-search only, scan at least `max(limit, maxInclusions * 4, 30)`
SourceClaims before ranking and keep the operator-facing output bounded by
ContextROI. Add read-only SourceDecisionEdge support to source-search answer
packages and brain-search summaries.

Consumer:
Future pattern/research brain loops and activation utility follow-ups.

Falsifier:
A small-limit natural source/brain search cannot surface the exact IMR-38
SourceClaim and SourceDecisionEdge, or the repair requires schema/ranking/runtime
work outside this bounded readback.

## Code Changes

- `packages/cli/src/runSourceSearchCommand.ts`
  - widened internal SourceClaim scan depth before ranking small output;
  - normalized `sourceClaimId` for SourceClaim candidates;
  - added read-only SourceDecisionEdge support to answer packages.
- `packages/cli/src/runBrainSearchCommand.ts`
  - exposes SourceDecisionEdge support count in source-search summary.
- `packages/db/src/repositories/DrizzleSourceRepository.ts`
  - adds `listSourceDecisionEdgesForClaim`.
- `packages/harness/src/repositories/sourceRepository.ts`
  - declares optional SourceDecisionEdge lookup capability.
- Tests cover bounded scan depth, SourceDecisionEdge support, and brain summary.

## Replay Results

Source search:

```txt
supportingClaims: 6
supportingDocuments: 2
sourceDecisionSupport: 3
foundClaim: true
foundDecision: true
firstClaim: 190f1f72-4621-49b4-b93c-538ea2c581ef
firstDecision: 73e266bb-e957-4a07-aa62-fe74cb7178a0
answerUsefulness: useful
```

Brain search:

```txt
selectedKnowledge: 0
supportingClaims: 6
supportingDocuments: 2
sourceDecisionSupport: 3
relationSupport: 2
answerUsefulness: useful
activationVerdict: linked_evidence_exploration_candidate
```

Store-only brain search:

```txt
selectedKnowledge: 6
firstSelected: 190f1f72-4621-49b4-b93c-538ea2c581ef
supportingClaims: 6
sourceDecisionSupport: 3
answerUsefulness: useful
activationVerdict: selected_knowledge_sufficient
```

Interpretation:
catalog-backed brain search still separates file-catalog selected knowledge from
source-search evidence, so `selectedKnowledge: 0` there is not a failure of this
slice. Store-only brain search proves governed source evidence can become
selected brain knowledge for the natural query.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runSourceSearchCommand runBrainSearchCommand` | passed | focused source/brain search behavior is guarded | full product readiness |
| `rtk bash -lc 'pnpm typecheck; ...'` | passed | TypeScript boundaries compile across packages | runtime DB truth |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace test suite passes | semantic retrieval quality |
| `rtk pnpm db:ready` | passed | current-shell Postgres, migrations, and pgvector are ready | CI DB state |
| `rtk pnpm quality:fallow:ci` | passed | changed files add no Fallow quality findings | broad repo has no legacy findings |
| `rtk pnpm quality:fallow` | failed on baseline | broad Fallow still reports repo-level duplication/health findings | this slice introduced those global findings |
| source/brain/store-only replay commands | passed | exact retained SourceClaim and SourceDecisionEdge are visible through natural query | source truth, eval promotion, product readiness |
| `rtk git diff --check` | passed | no whitespace errors | behavioral correctness |

## Dogfood Usefulness

KRN helped by keeping the repair bounded to recall/readback instead of broad
ranking, schema, crawler, or runtime work.

Fallow helped catch two real changed-file issues before commit:

- duplicate sourceClaimId extraction;
- complexity introduced by the new source-decision output/test fixture.

The broad Fallow audit still has baseline repo-level findings. They are not fixed
in this slice because they are outside the retained source/eval recall objective.

## Next Recommended Action

Run one compact follow-up that uses this repaired natural recall in the next
pattern/research brain loop. If store-only selected knowledge remains useful,
the next useful product work should move toward cross-repo pattern application
or benchmarked source-decision reuse, not another recall guard.
