# Notes-Baseline Eval Design (yb2n)

Status: implemented make-or-break falsifier. The runner, fixture, and tests are
`packages/cli/src/runNotesBaselineEval.ts`,
`tests/fixtures/notes-baseline/decision-packet-vs-notes.json`, and
`packages/cli/src/__tests__/notesBaselineEval.test.ts`.

## The Subtle Question This Eval Must Answer

A reviewer-asked falsifier: does KRN beat **Codex + a maintained NOTES.md +
grep** on real task packets? The naive metric (raw recall of the governing
decision) is the WRONG metric, because a well-maintained notes file has near-
perfect recall - a competent human wrote the answer into it. KRN cannot beat
notes on raw recall without the notes being deliberately incomplete, which is
dishonest.

So the eval must measure where KRN's advantage is REAL and structural, not
where it is cosmetic. Three honest advantage axes:

1. **Governed boundary.** A KRN packet structurally carries the evidence chain
   - the governing SourceClaim + SourceDecisionEdge support, confidence, the
   falsifier, and an explicit does-not-prove boundary. A notes file is flat
   prose with no evidence chain; it cannot answer "why is this the right
   decision and what would falsify it?" without the operator remembering.
2. **Staleness handling.** When a decision is superseded, KRN's
   invalidates/supersedes SourceClaimEdges rank it down or mark it superseded
   (proven in `eval:source-graph-ranking`). A notes file goes stale silently;
   grep cannot tell a stale note from a current one.
3. **Rejected paths.** KRN can surface "this approach was tried and rejected"
   via SourceRejection / contradicts edges. Notes rarely track what was tried
   and failed, so an operator re-attempts a known-bad path.

## Honest Metric Set (per framing)

For each task framing, both KRN (`krn source search`) and the notes+grep
baseline produce a packet. Score each packet on:

| Metric | KRN | notes+grep | What it proves |
| --- | --- | --- | --- |
| `recallExpected` | expected governing decision in top-k? | grep matches the note? | baseline recall parity (expected to tie or KRN slightly behind if notes are comprehensive - this is FINE and honest) |
| `governedBoundary` | packet includes falsifier + doesNotProve + decision-link? | structural NO (flat prose) | KRN advantage: evidence chain |
| `staleExcluded` | stale/superseded item ranked down or marked superseded? | cannot distinguish (grep returns stale too) | KRN advantage: staleness |
| `rejectedPathVisible` | known-rejected path surfaced as rejected? | only if manually written into notes | KRN advantage: avoids re-trying dead ends |

KRN "wins" a framing when it provides `governedBoundary` AND
(`staleExcluded` OR `rejectedPathVisible`) at parity-or-better `recallExpected`,
without a noisier packet. KRN "loses" when notes+grep matches recall with less
ceremony and KRN adds no governed/stale/rejected value.

## The Baseline (Defined Precisely)

- `NOTES.md` corpus: one flat note per governing decision, written the way a
  competent operator would actually maintain it (plain prose, the decision
  statement, maybe a one-line rationale). It is COMPREHENSIVE for recall (so the
  baseline is not a strawman) - it contains the governing decision text.
- `grep`: lexical token-overlap match of the query over note text, top-k by
  overlap. This is exactly what an operator does with notes+grep.
- The notes file does NOT carry falsifier/doesNotProve/edge metadata, because
  real notes files do not - that is the point.

## Falsifier (Predeclared)

KRN must win on the governed/stale/rejected axes for a majority of framings at
recall parity. If notes+grep wins raw recall AND KRN adds no governed/stale/
rejected value, STOP feature work and diagnose why KRN is not useful - that is
the reviewer's kill condition.

## Non-Proof

This eval proves packet QUALITY on a curated corpus of real repo governing
decisions, deterministically. It does NOT prove live Codex would obey the
packet, that an operator would pay, or broad advantage across arbitrary repos
(second-repo is `mise-en-palace-v4e9`).

## Resolved Build Decisions

- Runner: sibling runner (`runNotesBaselineEval`) so the notes-corpus and
  scoring do not entangle the memory-eval fixture.
- Corpus: `tests/fixtures/notes-baseline/decision-packet-vs-notes.json`.
- Runtime: deterministic in-memory fixture, not live DB. The live-DB advantage
  remains covered by `db:smoke:real-recall-advantage`.
