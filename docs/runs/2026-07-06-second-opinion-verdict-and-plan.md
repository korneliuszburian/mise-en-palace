# Second-Opinion Verdict And Forward Plan (2026-07-06)

Status: adopted. A context-free senior reviewer (read repo files + GitHub
Actions summary; could not run the live DB locally) delivered this verdict and
plan. This doc records it and locks the roadmap. The reviewer's prompt is in
`docs/runs/2026-07-06-second-opinion-state-review-prompt.md`.

## Verdict (adopted as honest)

- **Proven kernel, not proven paid product.** Appropriately restrained product
  law (controlled internal alpha; no dashboard/API/MCP/crawler/daemon without a
  loop). Not yet enough to claim an operator/team would pay over baseline Codex
  plus a notes file.
- **Strongest honest claim:** decision-linked recall over the live DB beats
  tempting lexical distractors (`runRealRecallAdvantageDbSmoke`, 3/3).
- **Teach loop is real but exposed a material weakness:** unlinked claims are
  invisible to source-search - now repairable via `adopt --link`, but the
  invisibility itself is a product weakness, not a footnote.
- **Deterministic eval layer is credible and saturated.**
- **Weakest claim: "useful breakthrough over notes."** No notes-file baseline,
  no measured operator time/review-burden delta, no multi-operator or
  live-agent adherence proof.
- **Product boundary is a strength** (rejects surfaces the loop has not earned).
- **Truth surface was not clean:** `behavior-gate-matrix.md` had stale counts
  (23/17/46 vs the current 25/19/50). FIXED on 2026-07-06.

Overall judgment: **breakthrough in progress, not a dead end** - live
decision-linked recall and teach loop are real; not yet a product breakthrough
because it has not beaten Codex+notes+grep on real task packets.

## Adopted End-State

**KRN is an operator-facing governed decision-packet engine for coding-agent
work.** Before a task, it selects the few source-backed decisions, memories,
constraints, and known anti-patterns that govern the task. After the task, the
operator can promote, reject, downgrade, or forget evidence so the next related
task reuses the right context without rereading raw docs.

**Falsifier:** on a held-out queue of real repo tasks, baseline Codex + a
maintained notes file + grep selects an equal-or-better governing packet with
less ceremony, fewer stale assumptions, and comparable review burden. The next
breakthrough does NOT require live Codex - it requires proving the decision
packet beats notes before the agent writes code.

## Adopted Forward Plan (Slices)

| # | Slice | Bead | Why |
| - | --- | --- | --- |
| 1 | Canonical proof register cleanup (docs agree on counts/stale/proxy; no active doc implies product readiness) | folded into `mise-en-palace-qqet` | stops the repo lying to itself |
| 2 | **Notes-file baseline eval** - KRN decision packet vs Codex+notes+grep on 15-25 real task framings | NEW (P1) | make-or-break falsifier; the real competitor |
| 3 | Corpus closure via product CLI - `source decision gaps --json` zero unadopted governing claims (or explicit reject reasons); canonical queries return governing decision in top 3 | NEW (P2) | close the "claim exists but brain cannot use it" hole |
| 4 | Decision-packet task benchmark - 10-20 real tasks, packet quality >= 70-80% useful, no severe stale-authority inclusions | NEW (P2) | proves packet selection quality pre-code |
| 5 | Feedback/forget loop on a real stale/superseded decision - next activation excludes/demotes/supersedes with explanation | NEW (P2) | proves the brain stops reusing harmful context |
| 6 | Second-repo dry run without live Codex - decision-packet vs notes baseline on a second real TS repo | NEW (P3) | tests portability, not just self-repo machinery |

Slice 2 is the leverage: if KRN cannot beat notes+grep, the rest does not
matter. Slice 2 is executable without live Codex (the blocker the operator
identified). All slices stay within product law (no daemon/API/MCP/crawler).

## What this changes vs the 2026-07-05 gap diagnosis

The diagnosis said "no crisp end-state." The reviewer supplied one (governed
decision-packet engine) and the make-or-break test (notes baseline). `pikl`
(roadmap redefine) is therefore resolved by this review; execution slices are
seeded as beads.
