# IMR-48 Selected Knowledge Target-Fit Readback

Status: complete bounded brain-search output repair.

Issue: `mise-en-palace-by6`.

## Executive Verdict

`krn brain search` now labels every selectedKnowledge packet with target-fit
metadata:

```txt
target_specific | generic_guardrail | adjacent_pattern | noise | unknown
```

and visible reasons.

This does not change selectedKnowledge ranking, count, activation scoring,
source truth, persistence, or Memory Core. It makes the IMR-47 multi-repo
precision gap visible: the `EKOLOGUS Brain quality gate` query returns useful
source evidence, but its selectedKnowledge packets are generic KRN guardrails,
not target-specific repo knowledge.

## Source To Decision

- Source: IMR-47 showed the second-repo source readback worked while
  selectedKnowledge mixed target evidence with generic KRN graph/pattern/ingest
  packets.
- Mechanism: packet-level target-fit classification compares distinctive query
  tokens with selectedKnowledge packet text and falls back to generic guardrail,
  adjacent pattern, noise, or unknown labels.
- KRN implication: operators can distinguish target-specific knowledge from
  generic brain guardrails before trusting selectedKnowledge as sufficient.
- Decision: expose targetFit and targetFitReasons in brain-search JSON and text
  output.
- Rejection: do not rewrite ranking, widen recall, mutate source truth, add DB
  schema, create crawler, or change Memory Core.
- Consumer: multi-repo Brain-QA, activation utility follow-up, and future
  pattern-application gates.
- Falsifier: a q2-shaped multi-repo query returns generic KRN packets that are
  still indistinguishable from target-specific selectedKnowledge.

## Behavior

Added to each selectedKnowledge packet:

```txt
targetFit:
targetFitReasons:
```

Classification rules are deterministic and output-only:

| Label | Meaning |
|---|---|
| `target_specific` | Packet text matches a distinctive query token. |
| `generic_guardrail` | Packet has no distinctive query match but carries generic governance/guardrail language. |
| `adjacent_pattern` | Packet has no distinctive query match but has adjacent domain/pattern signal. |
| `noise` | Packet has no distinctive, generic, or adjacent signal. |
| `unknown` | Query or packet lacks enough classifiable text. |

## Live Readback

| Query | selectedKnowledge targetFit | Interpretation |
|---|---|---|
| `source artifact persisted readback SourceArtifact SourceChunk SearchDocument` | 5 `target_specific` | KRN ingest/source-artifact knowledge matches the query. |
| `EKOLOGUS Brain quality gate` | 4 `generic_guardrail` | Source recall works, but selectedKnowledge is generic guardrail context rather than target-specific repo knowledge. |

The second result is now visible in JSON and text output instead of being
silently treated as target-specific.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand` | passed | Focused CLI tests cover target-specific, generic guardrail, adjacent pattern, and text targetFit output. | Does not prove broad retrieval quality. |
| `rtk pnpm run typecheck` | passed | TypeScript strict compilation still passes. | Does not prove semantic ranking quality. |
| `rtk pnpm quality:fallow:ci` | passed | Fallow changed-files audit found no issues in changed files. | Does not prove all repo baseline findings are gone. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass after the CLI JSON/text surface change. | Does not prove product readiness. |
| `rtk pnpm db:ready` | passed | Current-shell KRN DB is reachable with migrations applied and pgvector available. | Does not prove source truth. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn brain search --query "EKOLOGUS Brain quality gate" --store-only --limit 10 --max-inclusions 5 --json` | passed | Live multi-repo q2 readback exposes generic_guardrail targetFit for all selectedKnowledge packets. | Does not prove activation utility is target-fit aware. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn brain search --query "source artifact persisted readback SourceArtifact SourceChunk SearchDocument" --store-only --limit 10 --max-inclusions 5 --json` | passed | Live KRN q1 readback exposes target_specific targetFit for source artifact selectedKnowledge. | Does not prove ranking quality outside this query. |

## Findings

```txt
helped:
  targetFit makes the multi-repo precision issue visible.

neutral:
  selection order/count remains unchanged.

missing:
  activationUtility still says selected_knowledge_sufficient even when all
  selectedKnowledge packets are generic_guardrail.

next repair:
  make activation utility or brain-search recommendation target-fit aware.
```

## Next Action

`mise-en-palace-h5e`: make activation utility target-fit aware for generic
selectedKnowledge.

Boundaries:

```txt
no ranking rewrite
no crawler
no DB schema
no worker daemon
no API/MCP
no target writes
no source truth mutation
no eval promotion
no Memory Core mutation
```
