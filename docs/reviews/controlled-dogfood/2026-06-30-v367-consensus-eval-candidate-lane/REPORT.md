# V367 Consensus Eval/Candidate Lane

Status: complete by current-state audit.

## Executive Verdict

V367 does not need a new implementation slice. The requested candidate-only
consensus/eval lane already exists as the V339
`buildConsensusCandidateEvaluationPreview` surface in `@krn/workers`, and a
fresh V367 audit verified that it still satisfies the active task contract.

This closure avoids duplicating an existing brain surface and moves the product
queue forward.

## Source To Decision

```yaml
source_id: docs/reviews/controlled-dogfood/2026-06-29-v339-consensus-candidate-evaluation-preview/REPORT.md
trust_tier: repo-local evidence
source_class: dogfood report
mechanism: V339 added a pure candidate-only consensus/eval preview that maps
  candidate input plus support/dissent/risk evidence into preserved dissent,
  decision options, reviewability, evidence refs, doesNotProve, and
  no-mutation boundaries.
krn_implication: V367's active task should close by audit rather than creating
  a second consensus helper or broad consensus runtime.
decision_kind: adopt
decision: Treat the existing V339 consensus candidate evaluation preview as the
  V367 consensus/eval lane and move next work toward the product-facing brain
  search surface.
does_not_prove: This does not prove candidate truth, consensus correctness,
  promotion readiness, autonomous agent judgment, product readiness, or UI/API
  readiness.
consumer: root PLAN.md / PLANS.md next-task state
falsifier: The current workers code or tests fail to preserve support, dissent,
  risk, decision options, reviewability, evidence refs, doesNotProve, and
  no-mutation boundaries.
```

## Current-State Evidence

Existing source:

```txt
packages/workers/src/consensusCandidateEvaluationPreview.ts
packages/workers/src/consensusCandidateEvaluationPreview.test.ts
packages/workers/src/index.ts
packages/workers/README.md
```

The current implementation preserves:

- `supportEvidenceRefs`;
- `dissentEvidenceRefs`;
- `riskEvidenceRefs`;
- `preservedDissent`;
- `decisionOptions`;
- `evidenceRefs`;
- `doesNotProve`;
- `reviewability`;
- `reviewabilityReasons`;
- `mutation: none`;
- forbidden writes for memory/source/eval truth.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/workers test -- consensusCandidateEvaluationPreview` | passed | workers consensus preview tests still pass and cover ready, insufficient-evidence, vague, duplicate, not-useful, and max-candidate cases | candidate truth, consensus correctness, product readiness |
| `git status --short --branch` | clean before claim; Beads export changed after claim | worktree state was understood | behavior correctness |
| `pnpm --filter @krn/harness test -- contextHygieneInvariants activePlanInvariants` | passed | compact root docs stay within resume/context invariants after V367 closure and V368 handoff | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |

## Completion Audit

| V367 requirement | Evidence | Verdict |
|---|---|---|
| one bounded candidate-only consensus/eval helper or preview exists | `buildConsensusCandidateEvaluationPreview` | satisfied |
| preserves claim/candidate refs | `candidateId`, `candidateKind` | satisfied |
| preserves pro/con or agreement/disagreement signals | `supportEvidenceRefs`, `dissentEvidenceRefs`, `riskEvidenceRefs` | satisfied |
| preserves dissent | `preservedDissent` | satisfied |
| preserves evidence refs | `evidenceRefs` plus position-specific refs | satisfied |
| preserves does-not-prove | `doesNotProve` | satisfied |
| preserves reviewability and reasons | `reviewability`, `reviewabilityReasons` | satisfied |
| preserves next review decision options | `decisionOptions` | satisfied |
| preserves no-mutation boundary | `mutation: none`, forbidden writes | satisfied |
| focused tests prove ready and insufficient-evidence cases | workers test passed | satisfied |

## What This Proves

- KRN already has the bounded candidate-only consensus/eval lane requested by
  V367.
- The current code still passes focused tests for that lane.
- Duplicating this surface would be defensive treadmill work.

## What This Does Not Prove

- Consensus correctness.
- Candidate truth.
- Autonomous consensus runtime.
- EvalCandidate promotion readiness.
- Product-ready search, UI, API, or MCP.

## Next Recommended Task

V368 Brain Search Product Surface Preview.

Goal: expose the smallest product-facing brain search/readback surface over
existing source-search and knowledge-card outputs without adding a dashboard,
API server, MCP server, crawler, schema, ranking rewrite, or autonomous
runtime.
