# Roadmap Gap Diagnosis: Why The Queue Keeps Emptying

Status: honest diagnosis + tomorrow's setup. Date: 2026-07-05. Related beads:
`mise-en-palace-pikl` (roadmap redefine), `mise-en-palace-qqet` (doc/test prune).

The operator asked: why do we keep reaching "nothing obvious to do next" when
recently there was a mountain of work? This is the answer, and the fix.

## Diagnosis: It Is A Plan/Roadmap Gap, Not An Execution Gap

Three causes, in order:

1. **The deterministic-proof layer is saturated.** The PLAN/synthesis arc was
   "prove memory/source/context advantage deterministically." All seeded beads
   (jmfl multi-session, 87w0 competency, ebxq cost, 5ydu decision, cxlq relation
   ranking, ...) are closed. This session added a real-recall+teach arc on top
   (b8xl, 17hp, y7yg, w7em, 5cde, 9tzh, hkxb, 1zn7, p722). What remains of
   deterministic proof is diminishing-returns: slice 6 (1nk1) investigated
   recall-quality and found candidates tie at totalScore=95 - genuine ties, not
   a defect, so no clean win to ship.

2. **The next real leap is externally blocked.** Every "prove advantage on a
   REAL task" thread eventually needs a live agent (Codex) to execute against
   the brain's context, and Codex access is out of limits. The deterministic
   proxies prove the brain CAN recall/select/teach, but the "it beats baseline
   Codex on a real task" claim has a hard external blocker.

3. **There is no crisp, actionable product END-STATE.** PLAN's "Remaining
   Product Gaps" are three vague items; the kernel contract
   (select/apply/verify/forget) is a mechanism, not a product definition. So
   once deterministic proof is done, "what to build next" is undefined and the
   queue drifts into cleanup/investigation beads. That is exactly the symptom
   the operator observed.

The roadmap is NOT fully realized - it is that the deterministic-proof phase is
done and the path from "proven kernel" to "actual breakthrough product" was
never decomposed into actionable slices.

## The Fix (Tomorrow)

Two beads seeded so tomorrow starts obvious:

- `mise-en-palace-pikl` (P1 decision) - redefine the roadmap: name the
  breakthrough product end-state concretely (what the brain DOES that beats
  baseline, the loop, the consumer, the falsifier), identify the UNBLOCKED
  paths (not requiring live Codex - e.g. self-fueling ingest, multi-session
  learning within this repo, governed second-opinion as a standing capability),
  and decompose into 3-6 actionable slices with falsifiers. Output: updated
  PLAN / a roadmap decision doc.
- `mise-en-palace-qqet` (P2 cleanup) - prune the ~650 docs in
  docs/materials, docs/runs, docs/reviews (raw research/run logs; only 2 are
  archived today), and consolidate the overlapping root truth surfaces
  (GOAL, PLAN, PLANS, REVIEW, GOAL_REPO_RESET_AUDIT, KRN_BRAIN, KRN_KERNEL,
  KRN_ONBOARDING, KRN_SOURCES, STATE_OF_THE_ART, audit, glossary) into a clear
  canonical set. Plus remove unnecessary/outdated tests.

## Cleanup Hitlist (Concrete, Pre-Gathered 2026-07-05)

```txt
total docs/*.md:        744
docs/materials+runs+reviews: ~650   (raw research/run logs - triage keep/archive/delete)
docs/archive:             2         (already historical)
root truth .md:          ~10        (GOAL, PLAN, PLANS, README, AGENTS, REVIEW,
                                     GOAL_REPO_RESET_AUDIT, CLAUDE, plus docs/KRN_*)
already-marked-historical: CLAUDE.md, GOAL_REPO_RESET_AUDIT.md, REVIEW.md
bd stale / bd orphans:   clean (issue hygiene is good)
```

The doc sprawl is the loudest signal: current truth is buried under hundreds of
historical run/research notes. Triaging them is high-leverage because it makes
every future session faster and forces the question "what is actually current."

## What Does NOT Count As Progress Tomorrow

- More deterministic eval cases (saturated; diminishing returns).
- Any slice that requires live Codex (blocked).
- UI/API/MCP surfaces (rejected until gates pass).
- Subjective ranking tuning that risks breaking the distractor-competition
  proof.

## Proof Boundary

Proves: the symptom is named and root-caused, and tomorrow's work is seeded with
concrete hitlists. Does not prove: that the roadmap redefinition will succeed
(it is research), or that the end-state is achievable without Codex.
