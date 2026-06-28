# V307 Pattern Search Usefulness Feedback Closure

Status: complete docs/usefulness closure.

## Executive Verdict

V306 tokenized knowledge-card search helped the next pre-coding Pattern
Application Gate. The natural query:

```sh
rtk pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "research source decision retention gate" --json
```

returned exactly one relevant card:

```txt
pattern:source-to-decision-retention-gate
```

This is enough to proceed to V308, a small research/source-decision initial
pack, without opening a search repair, semantic ranking, embeddings, API, MCP,
dashboard, source crawler, or DB search.

## Selected Pattern

| Pattern | Outcome | Why |
|---|---|---|
| `pattern:source-to-decision-retention-gate` | helped | It gives the required mechanism for V308: source material can become retained KRN knowledge only with mechanism, KRN implication, decision/rejection, consumer, falsifier, and does-not-prove. |

## Rejected Or Deferred Patterns

| Pattern / direction | Decision | Reason |
|---|---|---|
| semantic ranking / embeddings | defer | V307 returned one precise card; no ranking problem was observed. |
| broader knowledge search repair | reject for now | The observed query did not produce noise or miss the obvious retained pattern. |
| dashboard/API/MCP search surface | reject | V307 is a CLI readback usefulness closure, not a product surface expansion. |

## What The Command Proves

- explicit catalog files can be read as a read-only knowledge-card preview;
- the V306 text search path can find the retained source-to-decision pattern
  from a natural multi-token query;
- proof/non-proof boundaries remain visible in the output;
- the next useful task can be V308 instead of another defensive search repair.

## What The Command Does Not Prove

- semantic ranking quality;
- complete retained-pattern coverage;
- source truth;
- automatic research condensation;
- live DB search;
- Memory Core mutation behavior;
- product readiness.

## Decision

Proceed to:

```txt
V308 Research Source Decisions Initial Pack
```

Scope must stay small: 3-5 source decisions maximum, with no source crawler, no
broad research archive, no product UI, and no paper washing.
