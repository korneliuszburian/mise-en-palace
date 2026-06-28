# V300 Target Repo Write Authority Boundary Usefulness Feedback

Status: controlled dogfood report.

Date: 2026-06-28

## Executive Verdict

`pattern:target-repo-write-authority-boundary` is useful. It prevented unsafe
or misleading target-repo work by forcing explicit target mode, dirty-state
handling, write authority, allowed/forbidden writes, rollback, and command
evidence before target repairs.

This is one of the core safety patterns required before KRN can be trusted on
external or living repositories.

This is not a claim that arbitrary target writes are safe.

## Scope

Pattern reviewed:

```txt
pattern:target-repo-write-authority-boundary
```

Files changed:

```txt
docs/brain-knowledge/usefulness-feedback/v300-target-repo-write-authority.json
docs/brain-knowledge/catalog.json
packages/cli/src/runKnowledgeCardsCommand.test.ts
GOAL.md
PLAN.md
PLANS.md
```

Non-goals:

- no target repo writes;
- no target substrate expansion;
- no real second-operator proof;
- no product-ready claim;
- no activation scoring change.

## Evidence

V251 used observation-only target discovery and rejected a random living
`active/` repo as the first post-activation product proof. That prevented
pre-existing dirty/evolving target state from being mistaken for KRN product
evidence.

V252 created a KRN-owned normalized target substrate with explicit owner files,
known weaknesses, expected repairs, rollback, and verification path.

V256 performed a headless repair only in `.local-lab`, explicitly listing
allowed writes, forbidden writes, rollback/handoff, target evidence, and proof
boundaries. It did not touch KRN package source or living external repos.

The muke-v2 external target trial used a bounded target-only repair and
preserved caveats for broader target-suite failures, showing the same boundary
is useful beyond fixtures.

## Feedback Added

```txt
cardId: pattern:target-repo-write-authority-boundary
outcome: helped
summary: Prevented unsafe living-target writes by forcing observation-only
  target discovery, normalized target substrate work, explicit allowed/forbidden
  writes, rollback, and target evidence boundaries.
```

Proof boundary:

```txt
This does not prove arbitrary target writes are safe, second-operator usability,
external target readiness, or product readiness.
```

## Readback Proof

After this slice:

```txt
--usefulness-outcome helped includes pattern:target-repo-write-authority-boundary
--usefulness-outcome none excludes pattern:target-repo-write-authority-boundary
```

Confirmed count movement:

```txt
helped: 9 -> 10
none: 2 -> 1
```

## Brain Usefulness

Verdict: positive.

What helped:

- blocked writing to random living `active/` repos during target discovery;
- turned target proof into normalized, reproducible substrate work;
- forced allowed/forbidden writes and rollback to be explicit;
- kept external target success bounded to scoped evidence instead of broad
  product claims.

What is still weak:

- this does not prove second-operator usability;
- this does not prove every target repo can be safely repaired;
- this does not solve activation owner-file misses by itself;
- this does not replace target-specific AGENTS/docs.

## Source-To-Decision

Source:

- V251 target trial gate;
- V252 normalized target substrate;
- V256 replayable target repair;
- muke-v2 external target trial;
- `target-repo-testing` skill.

Mechanism:

- target repos can be dirty, evolving, secret-bearing, or owned by another
  operator;
- explicit mode/write authority prevents Codex from turning observation into
  unscoped mutation;
- normalized substrates make target proof replayable before living repo trials.

KRN implication:

- target-repo tasks must declare mode, dirty state, write authority,
  allowed/forbidden writes, rollback, verification, and proof/non-proof before
  any target modification.

Decision:

- mark `pattern:target-repo-write-authority-boundary` as `helped`.

Consumer:

- future target-repo trials;
- target-repo-testing skill;
- future second-operator/internal-alpha gates.

Falsifier:

- a future target-repo task writes to a living or fixture target without
  explicit mode, dirty-state handling, allowed/forbidden writes, rollback, and
  verification while tests still pass.

## Next Recommended Action

Open V301:

```txt
Untrusted Context Warning Boundary Usefulness Feedback
```

Reason:

```txt
The last no-feedback retained pattern is the untrusted-context warning
boundary. It gates external source/target text before broader target alpha.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed | worktree was clean after V299 before V300 inspection | future CI status |
| `krn knowledge cards --text "write authority" --json` | passed | target write-authority card existed and had no usefulness feedback before this slice | usefulness by itself |
| `krn knowledge cards --usefulness-outcome helped --json` | passed | `helped` readback includes 10 cards including target write-authority boundary | arbitrary target safety |
| `krn knowledge cards --usefulness-outcome none --json` | passed | no-feedback readback decreased to 1 card | that the remaining card is unimportant |
| `sed`/`rg` over V251/V252/V256/muke-v2 and target-repo-testing skill | passed | local evidence contains target mode/write authority/rollback decisions | arbitrary target safety |
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | CLI readback/filter tests cover the new feedback count and remaining no-feedback text filter | full repo behavior |
| `pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants patternChainInvariants brainKnowledgeReadModelInvariants brainKnowledgeReadModel skillInvariants` | passed | root-plan, pattern-chain, read-model, and skill invariants still pass | product readiness |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript packages still typecheck | runtime DB behavior |
| `pnpm test` | passed | full local test suite passed | remote CI status |
| `git diff --check` | passed | diff has no whitespace errors | correctness of the decision |
