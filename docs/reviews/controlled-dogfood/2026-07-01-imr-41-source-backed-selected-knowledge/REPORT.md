# IMR-41 Source-Backed Selected Knowledge

Status: complete.

Issue: `mise-en-palace-wcv`

## Executive Verdict

The repaired natural source/eval recall now feeds the default `krn brain search`
pattern loop. When file-catalog brain knowledge misses, default brain search can
use reviewable source-backed SourceClaim packets as selected brain knowledge.

This removes the need to know `--store-only` before a retained SourceClaim can
guide a Pattern Application Gate. Catalog cards still take priority, and weak
source evidence remains non-selected in default mode.

## Scope

Natural query:

```txt
IMR-37 heartbeat-routed activation utility candidate is accepted for manual source eval follow-up only
```

Expected retained evidence:

```txt
SourceClaim: 190f1f72-4621-49b4-b93c-538ea2c581ef
SourceDecisionEdge: 73e266bb-e957-4a07-aa62-fe74cb7178a0
```

Non-goals:

- no ranking rewrite;
- no semantic model;
- no crawler;
- no worker daemon;
- no API/MCP;
- no DB schema;
- no Memory Core mutation;
- no source truth mutation;
- no eval promotion.

## Source To Decision

Source:
IMR-40 proved the exact retained SourceClaim and SourceDecisionEdge are visible
through natural source/brain search, but default catalog-backed brain search
still showed `selectedKnowledge: 0` while `--store-only` showed the exact retained
claim first.

Mechanism:
`krn brain search` selected knowledge from file-catalog cards in default mode and
from source-search SourceClaims only in `--store-only` mode. This made governed
source evidence visible as source-search support, but not as selected brain
knowledge for normal operator use.

KRN implication:
The brain should use governed source-backed knowledge when catalog files miss,
as long as the SourceClaim packet is reviewable. Otherwise retained source/eval
evidence remains a secondary readback lane instead of a usable pattern gate.

Decision:
Adopt catalog-first selected knowledge. If catalog packets exist, use them. If
catalog packets are empty, use only reviewable source-backed SourceClaim packets.
Keep `--store-only` behavior broader: it can still expose weak source-backed
packets as not-review-ready readback.

Consumer:
Default `krn brain search` pattern/research brain loop.

Falsifier:
A catalog-miss/default brain search with a ready SourceClaim still returns
`selectedKnowledge: 0`, or weak label-only source claims become selected
knowledge in default mode.

## Behavior

Before this slice:

```txt
mode: catalog_files
selectedKnowledge: 0
supportingClaims: 6
sourceDecisionSupport: 3
answerUsefulness: useful
verdict: linked_evidence_exploration_candidate
```

After this slice:

```txt
mode: catalog_files
returnedCards: 0
selectedKnowledge: 6
firstSelected: 190f1f72-4621-49b4-b93c-538ea2c581ef
firstSource: source_search
supportingClaims: 6
sourceDecisionSupport: 3
answerUsefulness: useful
verdict: selected_knowledge_sufficient
recommendedNextAction: Use source-backed selected brain knowledge as a Pattern Application Gate; do not treat it as file-catalog coverage.
```

## Code Changes

- `packages/cli/src/runBrainSearchCommand.ts`
  - adds catalog-first selected knowledge selection;
  - falls back to ready source-backed SourceClaim packets when catalog readback
    misses;
  - keeps weak source-backed packets visible only in store-only readback;
  - updates recommended action for source-backed selected knowledge.
- `packages/cli/src/runBrainSearchCommand.test.ts`
  - guards catalog-miss/source-backed selected knowledge;
  - preserves the existing linked-evidence exploration behavior for weak
    label-only source support.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand` | passed | focused brain-search behavior is guarded | full product readiness |
| `rtk pnpm quality:fallow:ci` | passed | changed files add no Fallow quality findings | broad repo has no baseline findings |
| `rtk bash -lc 'pnpm typecheck; ...'` | passed | strict TypeScript compile succeeds across packages | runtime DB truth |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace test suite passes | source truth or semantic ranking quality |
| `rtk pnpm db:ready` | passed | current-shell Postgres, migrations, and pgvector are ready | CI DB state |
| live default `krn brain search --json` replay | passed | exact retained SourceClaim is selected in default brain search | catalog completeness, product readiness |
| `rtk git diff --check` | passed | no whitespace errors | behavioral correctness |

## Pattern Usefulness

Selected patterns:

- IMR-40 natural source/eval recall: helped. It supplied exact retained
  SourceClaim/SourceDecisionEdge evidence for the default brain loop.
- Source-to-decision: helped. It kept catalog-first/source-backed fallback scoped
  to reviewable source evidence.
- TypeScript boundary discipline: helped. The change stayed in typed internal
  JSON-shape narrowing helpers and kept `JSON.parse` in tests only.
- Fallow changed-files gate: helped. It confirmed no new changed-file quality
  findings after the implementation.

## What This Does Not Prove

- file-catalog brain knowledge is complete;
- source-backed selected knowledge is always high precision;
- ranking quality is solved;
- source truth or eval promotion;
- product readiness;
- Memory Core mutation safety beyond mutation none in this readback.

## Next Recommended Action

Run a compact mini Brain-QA/usefulness batch over default `krn brain search` with
source-backed selected knowledge enabled. Classify selected packets as helped,
neutral, noise, missing, or stale before changing ranking.
