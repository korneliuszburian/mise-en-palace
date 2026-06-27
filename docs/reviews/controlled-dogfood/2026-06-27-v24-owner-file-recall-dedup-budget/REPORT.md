# V24 Target Owner-File Recall Deduplication And Budget Priority

Status: completed source repair and DB-backed target-plan replay.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Target reference: `/home/krn/coding/krn/active/krn-elektroinstal-ogar`
Mode: KRN source repair; no target writes.
DB available: yes

## Executive Verdict

V24 repaired the owner-file precision gap found in V23. Target read-model owner
files are now emitted even when they do not lexically match the task, receive a
bounded ROI priority, and suppress source seeds already covered by exact owner
files, owner roots, or adjacent agent-guidance files. This keeps explicit
operator-provided owner files from being crowded out by duplicate `AGENTS.md`,
`CLAUDE.md`, or root-level source seeds in owner-file-heavy target tasks.

This is a bounded activation/read-model repair. It is not an activation scoring
rewrite, source crawler, target repo repair, V02-01 proof, widened alpha proof,
or product-ready proof.

## Source Inspection

The relevant owner-file candidate assembly is:

- `packages/harness/src/activation/ownerFileRecall.ts`
- `packages/harness/src/activation/contextRoi.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`

Finding:

```txt
Target owner files existed in the read model, but target source seeds and owner
files entered the same generic ContextROI budget. Duplicate or adjacent guidance
such as AGENTS.md / CLAUDE.md could consume budget before direct owner files
like bedrock/composer.json or woohub_gateway_v1/main.py.
```

Decision:

```txt
Repair candidate assembly, not global scoring.
```

Why:

- explicit owner files are operator-provided target read-model truth;
- the observed gap was duplicate/covered candidate pressure, not a missing
  crawler or broad scoring failure;
- a local rule can be tested without changing memory/source ranking globally.

## Implementation

Changed:

- `packages/harness/src/activation/ownerFileRecall.ts`
- `packages/harness/src/activation/ownerFileRecall.test.ts`
- `packages/harness/src/compiler/index.test.ts`

Behavior added:

- target owner-file candidates are emitted for every explicit owner file;
- owner-file candidates receive a deterministic minimum lexical signal and
  bounded `contextRoiScore`;
- source seeds are skipped when already covered by:
  - exact owner-file path;
  - owner-file root;
  - adjacent agent-guidance path when an explicit agent guidance owner file
    exists.

This means `AGENTS.md` as an owner file can cover `AGENTS.md` source seed and
adjacent `CLAUDE.md` source seed, while `bedrock/composer.json` covers the
`bedrock` source root for budget purposes.

## DB-Backed KRN Plan Evidence

KRN planning run for this source repair:

```txt
executionRun: 19a1f0c3-a27b-41ad-a44d-a4f12d1a7547
contextAssembly: 22b2dfab-0579-4ef6-98d2-871875625213
context status: abstained
```

Activation usefulness for the source repair was weak: the KRN repo plan
selected no context. That is recorded as an activation caveat, not hidden.

Persisted evidence for the source repair:

```txt
evidenceBundle: 2d1421dc-f516-42f4-b98c-8aff5e243809
reviewAssessment: ca8778ee-dbe1-492c-8e24-ea47b33f2091
feedbackDelta: c7d18848-d9ab-4d48-b4d9-5caf1377065d
changed files: all intended, no unrelated, no unknown
command provenance: 5 operator_reported / passed
```

Observe/reflect:

```txt
observationGroup: 5de334fe-816f-48b7-a3a3-9fcb1468a148
observationItems: 5
reflectionRecord: ddcd7386-d051-40a3-81d7-27970754371c
observations selected: 5
candidate rows written: no
memory mutation: none
```

Operator-friction note:

```txt
krn evidence capture uses --run-id, while krn observe uses --run.
```

This did not block V24, but it is a small CLI consistency candidate if it
repeats.

DB-backed target project replay after the repair:

```txt
executionRun: 12318455-bfa6-4838-a168-5866f0e5dfbd
contextAssembly: 6cb6e251-608d-4eac-ba6a-cd0ba6be49b1
project: e83b4509-6889-426c-90e2-bc4e6394ba26
repoInstallation: f08bfff8-cba2-426b-9c0e-18c90774afff
projectKernel: b51aebe5-a85d-4fae-babd-80f81a0db86e
```

Target read model:

```txt
sourceSeeds=3
ownerFiles=5
trustExclusions=7
owner-file recall: owner_files_available
```

Included context after repair:

```txt
Target owner file: woohub_gateway_v1/README.md
Target owner file: bedrock/README.md
Target owner file: woohub_gateway_v1/main.py
Target owner file: AGENTS.md
Target owner file: bedrock/composer.json
Target trust exclusions for project-scoped planning
```

Excluded:

```txt
one over-budget candidate
```

This directly addresses the V23 gap: `bedrock/composer.json` and
`woohub_gateway_v1/main.py` now appear in context, and adjacent guidance no
longer crowds them out.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | Local Postgres is reachable, 14/14 migrations are applied, pgvector is available. | Does not prove remote CI DB state or production readiness. |
| `pnpm --filter @krn/harness test -- ownerFileRecall compiler` | passed | Unit/compiler behavior covers owner-file priority and covered-seed suppression. | Does not prove every target repo topology. |
| `pnpm --filter @krn/harness test -- goldenKrnBehaviorGate` | passed | Existing golden behavior still passes after the repair. | Does not prove product readiness. |
| `pnpm typecheck` | passed | TypeScript strict compile succeeds across packages. | Does not prove runtime target correctness. |
| `pnpm test` | passed | Full package test suite passes locally. | Does not prove second-operator usability. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior coverage is complete. |

## Dogfood Brain Usefulness

Activation usefulness: mixed.

- Source-repair KRN plan abstained with zero context, so it did not help find
  owner files.
- DB-backed target replay after repair selected the desired owner-file context
  and preserved target trust exclusions.

Evidence usefulness: strong positive.

- V23 report named the exact gap.
- V24 tests and DB-backed target replay proved the repaired behavior.

Review burden: lower.

- Future target plans should show direct owner files rather than requiring the
  operator to infer missing files from source inspection.

Brain ROI: positive with activation caveat.

## Candidate Outputs

MemoryCandidate:

```txt
summary: Explicit target owner files should outrank covered source seeds in owner-file-heavy target tasks.
evidence: V23 report, V24 source repair, V24 DB-backed target plan replay.
doesNotProve: This does not prove all activation scoring is correct or that source crawling is needed.
reviewability: ready
decision: review after one more real target rerun.
```

EvalCandidate:

```txt
summary: Target planning should include explicit owner files and suppress covered AGENTS/CLAUDE/root seeds under context budget.
evidence: ownerFileRecall/compiler tests added in V24.
doesNotProve: This does not prove every target topology.
reviewability: ready
decision: review.
```

AntiMemoryCandidate:

```txt
summary: Do not treat adjacent agent guidance as higher-value than explicit target owner files during owner-file-heavy target planning.
evidence: V23 missed direct owner files while selecting adjacent guidance; V24 repaired this.
doesNotProve: Agent guidance is never useful.
reviewability: ready
decision: defer until V25 target rerun confirms reuse.
```

## What This Proves

- V24 source repair is implemented and tested.
- Explicit target owner files now get priority over covered source seeds.
- Adjacent `AGENTS.md` / `CLAUDE.md` guidance no longer crowds out direct owner
  files when explicit owner-file guidance exists.
- DB-backed target plan replay now includes all five known target owner files
  plus trust exclusions.

## What This Does Not Prove

- V02-01 second-operator usability.
- Product readiness.
- Widened internal alpha.
- General activation scoring quality.
- Target runtime correctness.
- That every target topology has enough owner-file metadata.

## Next Recommended Action

Promote one bounded follow-up:

```txt
V25 — Real Target Observation Re-Run After Owner-File Priority Repair
```

Why:

The source repair and target plan replay are strong, but the product loop should
prove the full real target observation-only workflow again after owner-file
priority changed.
