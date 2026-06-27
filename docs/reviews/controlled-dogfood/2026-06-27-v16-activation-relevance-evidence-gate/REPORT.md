# V16 Activation Relevance Evidence Gate

Status: activation evidence gate, no scoring repair.

Date: 2026-06-27.

## Executive Verdict

V16 rejects an activation scoring rewrite now.

The current evidence says KRN activation is not generally proven as product
quality, but the repeated miss is not yet scoring. The current owner is target
read-model completeness:

```txt
when target ownerFiles exist:
  KRN can surface exact owner-file candidates below named roots.

when target ownerFiles are missing:
  KRN now reports missing_owner_file_read_model with proof boundary.
```

Decision:

```txt
activation scoring repair: rejected now
owner-file recall measurement: accepted as working controlled behavior
target read-model completeness: next blocker
source crawler: rejected
next stream: V17 Target Owner-File Read-Model Contract Gate
```

## Scope

Read:

- `.agents/skills/activation-engine/SKILL.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v06-owner-file-recall/REPORT.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-usefulness/REPORT.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-re-gate/REPORT.md`;
- `docs/reviews/controlled-dogfood/2026-06-27-v11-product-readiness-re-gate/REPORT.md`;
- `packages/harness/src/activation/ownerFileRecall.ts`;
- `packages/harness/src/activation/ownerFileRecall.test.ts`;
- `packages/harness/src/goldenKrnBehaviorGate.ts`;
- current activation-related search results.

Changed:

- no source/config files.

Non-goals:

- no activation scoring rewrite;
- no retrieval rewrite;
- no source crawler;
- no target repo writes;
- no broad eval platform;
- no MCP/dashboard/subagent surface.

## Evidence Table

| Evidence | Finding | Decision |
|---|---|---|
| V06 owner-file recall report | KRN already surfaced exact owner files when the target read model provided `ownerFiles`; V06 repaired the missing state into typed replayable evidence. | Do not rewrite scoring from V06. |
| `ownerFileRecall.ts` | Target owner-file candidates score higher than source seeds and are emitted only from target read-model `ownerFiles`. | Current ranking path is intentional. |
| `ownerFileRecall.test.ts` | Tests cover static owner recall, target source seeds, trust exclusions, missing owner-file read model, and available owner files. | Controlled behavior covered. |
| `goldenKrnBehaviorGate.ts` | Golden behavior includes target trust exclusions, target fixture source seeds, and exact owner-file below roots. | Behavior proof already exists for controlled fixture cases. |
| V07 memory/source usefulness | Memory usefulness and source decision readback moved forward, but arbitrary external target usefulness remains unproved. | Activation product quality remains partial. |
| V11 readiness gate | Activation quality is partial; exact future proof needs more target runs showing selected/used/helped/missing context. | Keep product-readiness caveat. |
| Headless WILQ-style evidence from prior reports | Owner files were unavailable and planning used root-level source seeds. | This is read-model incompleteness, not proven scoring failure. |

## Activation Verdict

Activation relevance is:

```txt
controlled target fixture:
  good enough / guarded

target read model with ownerFiles:
  good enough / guarded

target read model with only sourceSeeds:
  correctly reports missing_owner_file_read_model

arbitrary external target repo:
  insufficient evidence

activation scoring:
  not enough evidence for repair
```

The current system is behaving honestly: it does not pretend missing owner-file
data means owner files do not exist, and it does not fall back to static KRN
owner files for target project planning.

## Accepted / Rejected Work

| Candidate | Decision | Why |
|---|---|---|
| Activation scoring rewrite | reject now | Evidence points to missing read-model data, not bad ranking. |
| More activation measurement | accept | Needed for real target/product claims. |
| Target owner-file read-model contract gate | accept | Next blocker is how owner-file data enters the target read model. |
| Source crawler | reject | Missing owner files do not prove crawler need. |
| Broader retrieval platform | reject | No evidence CLI/files/DB/readback are insufficient. |

## What This Proves

- KRN has controlled behavior proof for target owner-file recall when owner
  files are present.
- KRN now exposes missing owner-file read-model state instead of hiding it.
- Current evidence does not justify an activation scoring rewrite.

## What This Does Not Prove

- Activation quality on arbitrary external repos.
- Target read-model owner-file discovery completeness.
- Product readiness.
- Widened internal alpha.
- V02-01 second-operator usability.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk sed ... activation-engine/SKILL.md` | passed | Activation execution doctrine was inspected. | Does not prove implementation quality. |
| `rtk sed ... V06/V07/V11 reports` | passed | Current activation/usefulness/readiness evidence was inspected. | Does not prove arbitrary target behavior. |
| `rtk sed ... ownerFileRecall.ts ownerFileRecall.test.ts` | passed | Owner-file recall implementation/tests were inspected. | Does not prove real external target owner-file availability. |
| `rtk sed ... goldenKrnBehaviorGate.ts` | passed | Controlled golden owner-file behaviors were inspected. | Does not prove product readiness. |
| `rtk git diff --check` | passed | Diff whitespace is clean. | Does not prove activation behavior. |

## Condensation Decision

```txt
finding:
  Activation quality remains partial, but current evidence points to target
  read-model completeness rather than scoring.

frequency:
  repeated owner-file availability caveat across target trials and readiness
  gates.

candidate_surface:
  target owner-file read-model contract gate.

decision:
  reject scoring rewrite; accept V17-00.

rationale:
  KRN should define/prove how exact owner files enter target read models before
  changing ranking.

evidence:
  V06, V07, V11, ownerFileRecall tests, golden target owner-file behavior.

does_not_prove:
  activation product quality or target discovery completeness.

falsifier:
  future runs provide ownerFiles but activation still misses obvious matching
  owner files repeatedly.
```

## Next Recommended Action

Move to:

```txt
V17 — Target Owner-File Read-Model Contract Gate
```

The first task should decide whether existing init/connect metadata,
runbooks, and target-repo testing skill sufficiently explain how owner files
enter the target read model, or whether a small CLI/docs/test repair is needed.
