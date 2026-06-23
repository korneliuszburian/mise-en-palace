# QG-04H — Smell Scan Automation Requirements

Date: 2026-06-23

Status: complete as requirements; QG-06 owns implementation in `krn audit`.

## Purpose

QG-04 proved that manual smell scans catch real repo risks, but manual scans
will be forgotten during feature work. QG-04H turns the accepted QG-04 scans
into a concrete automation contract for QG-06.

This slice does not add audit runtime code. It defines the checks QG-06 must
implement before feature work can continue to MM-66.

## Inputs

QG-06 must consume these existing sources:

- `docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`
- `docs/plans/memory-ideal-state/QG-03-EXPORT-DEAD-CODE-AUDIT.md`
- `docs/standards/code-quality.md`
- `docs/standards/typescript-excellence.md`
- `docs/standards/code-vocabulary.md`
- current `krn audit repo` and `krn audit slice` snapshots
- explicit `--intended-file` and `--verification` slice evidence

## Required QG-06 Audit Categories

### 1. Placeholder Vocabulary

Scope:

- production TypeScript under `packages/*/src/**/*.ts`;
- colocated tests under `packages/*/src/**/*.test.ts`;
- shared fixtures under `tests/fixtures/**`;
- exclude `docs/materials/**` because it is raw quarry.

Terms:

```txt
placeholder
fake
dummy
stub
mock
temp
temporary
TODO
HACK
workaround
```

Severity:

- blocking in production files unless the finding is allowlisted with reason
  and expiry;
- warning in tests/fixtures unless the file is an audit test intentionally
  seeding the term;
- advisory in docs, except current-state docs claiming a placeholder as final
  architecture are blocking.

QG-06 seeded proof:

- a production file containing `placeholder adapter` must make
  `krn audit slice --fail-on warning` fail;
- an audit test fixture containing `placeholder` as a seeded violation must not
  fail repo audit by itself.

### 2. Duplicate Helper Families

QG-06 must block reintroduction of duplicate helper families already repaired
by QG-04A through QG-04F.

Families:

```txt
CLI filesystem boundary:
  pathExists
  findRepoRoot
  readJsonObject

Memory confidence parsing:
  confidenceAliases
  parseConfidence

Schema metadata/text primitives:
  MetadataSchema
  RequiredTextSchema
  OptionalTextSchema
  TextListSchema
  rejectPrivateReasoningMetadata
  rejectForbiddenMetadata

Review signal vocabulary:
  normalizeOutcome
  normalizeRisk
  riskValues
```

Canonical owners:

```txt
packages/cli/src/cliFileBoundary.ts
packages/cli/src/parseMemoryConfidence.ts
packages/schema/src/schemaPrimitives.ts
packages/core/src/reviewSignal.ts
```

Severity:

- blocking when a non-owner production file defines a duplicate helper family;
- warning when a test defines a duplicate helper instead of importing or using
  the public behavior surface;
- advisory when a docs example uses the name as historical evidence.

QG-06 seeded proof:

- a production command defining local `readJsonObject` must fail slice audit;
- a schema file defining local `MetadataSchema` must fail slice audit.

### 3. Large-File Thresholds

QG-06 must report files that cross responsibility-review thresholds.

Thresholds:

```txt
production TypeScript warning: 400 lines
production TypeScript blocking: 800 lines
test TypeScript warning: 700 lines
smoke/proof TypeScript warning: 700 lines
docs current-state file warning: 900 lines
```

Required metadata per finding:

```txt
file
lineCount
threshold
classification
owner
recommendedAction
allowlistId when accepted
allowlistExpiresAt when accepted
```

Initial accepted candidates:

| File | Status | Expiry |
| --- | --- | --- |
| `packages/harness/src/audit/auditChecks.ts` | accepted until QG-06 category split decision | QG-06 |
| `packages/db/src/activationSmoke.ts` | accepted as one smoke proof path | MM-94 |
| `packages/db/src/retrievalSubstrateSmoke.ts` | accepted as one smoke proof path | MM-94 |
| `packages/cli/src/runCli.ts` | accepted as CLI dispatcher until command routing split is justified | QG-06 |

QG-06 seeded proof:

- a new production file over 800 lines with no allowlist must fail slice audit;
- an allowlisted file with expired `allowlistExpiresAt` must fail slice audit.

### 4. Behavior-Governing Metadata

`metadata` may carry audit/debug/compatibility payloads. It must not hide
first-class product behavior.

QG-06 must report metadata keys that affect:

- governance;
- ranking;
- promotion;
- review;
- activation;
- source lineage;
- Memory Core semantics;
- cross-project isolation;
- validity or invalidation.

Blocking examples:

```txt
metadata.confidence
metadata.trustTier
metadata.status
metadata.priority
metadata.sourceClaimId
metadata.memoryRecordId
metadata.invalidationRule
metadata.reviewedBy
metadata.evidenceReviewedRef
metadata.promote
metadata.createMemoryRecord
metadata.crossProject
```

Current accepted metadata debt:

| Key | Current use | Why accepted temporarily | Expiry |
| --- | --- | --- | --- |
| `memoryRecordMutation` | review-assess / feedback reporting | read-only mutation summary, not promotion authority | MM-66 |
| `activationAbstention` | ContextAssembly metadata | rendered activation trace artifact until read models exist | MM-85 |
| `observationPrefix` | ContextAssembly metadata | rendered prefix artifact, not MemoryRecord | MM-85 |
| `observationPrefixGate` | ContextAssembly metadata | audit trace for source-range gate | MM-85 |
| `sourceClaimId` in search-document metadata | explicit anti-memory bridge for linked search docs | retrieval/source linkage hardening | MM-82 |
| `memoryRecordId` in search-document metadata | explicit anti-memory bridge for linked memory docs | retrieval/memory linkage hardening | MM-82 |

Severity:

- blocking when a new behavior-governing metadata key is introduced without a
  typed-field decision, allowlist, or expiry;
- warning for existing accepted debt until the expiry slice;
- blocking after expiry.

QG-06 seeded proof:

- a production file adding `metadata: { confidence: 90 }` must fail slice audit;
- a production file adding `metadata: { createMemoryRecord: true }` must fail
  slice audit;
- current accepted metadata debt must be reported with expiry, not silently
  ignored.

### 5. Export / Dead-Code Scan

QG-06 must keep the QG-03 Knip decision alive.

Required behavior:

- run or ingest `pnpm dlx knip --reporter json`;
- preserve the accepted target-repo fixture finding;
- fail on new unused production exports, duplicate exports, unused files, or
  unused dependencies unless allowlisted with reason and expiry.

QG-06 seeded proof:

- a new unused exported alias must fail slice audit;
- the accepted target-repo fixture file remains non-blocking.

### 6. Stale Current-State Docs

QG-06 must detect stale public state claims that contradict the active
`PLAN.md` progress.

Minimum stale claims:

```txt
No CLI implementation
observation DB/runtime/CLI/repository not built
QG-04G remains next
MM-17 is the next slice
Promptfoo snapshot export is the final Promptfoo integration
```

Severity:

- blocking in `README.md`, root `GOAL.md`, root `PLAN.md`,
  `docs/plans/memory-ideal-state/GOAL.md`, and handoff docs;
- warning in historical run docs.

QG-06 seeded proof:

- a seeded README saying `No CLI implementation` must fail slice audit.

## Required Allowlist Shape

QG-06 may use a checked-in allowlist or an in-code constant, but each entry must
have:

```txt
id
category
path
pattern or key
reason
owner
createdAt
expiresAt
replacementPlan
```

Rules:

- no expiry means invalid allowlist;
- expiry may be a slice id such as `QG-06`, `MM-82`, or `MM-94`;
- expired allowlist entries are blocking findings;
- broad path allowlists such as `packages/**` are invalid.

## Required QG-06 Public Surface

QG-06 must make quality findings visible through the existing audit command
surface:

```sh
pnpm --filter @krn/cli krn audit repo --repo ../.. --json
pnpm --filter @krn/cli krn audit slice --since origin/main --repo ../.. --fail-on warning --json
```

The JSON report must include quality findings in the same `findings` array as
memory/source/eval/verification findings. Do not create a second quality-only
audit command.

## Non-Goals

QG-04H does not:

- implement audit code;
- add dependencies;
- run Promptfoo;
- change package topology;
- change DB schema or migrations;
- mutate Memory Core;
- create dashboard/API/MCP/server/plugin/source crawler surfaces.

## Completion Falsifier

QG-06 is not complete if any of these are true:

- `krn audit slice --fail-on warning` can pass with a new production
  placeholder adapter;
- duplicate CLI JSON helpers can reappear unnoticed;
- a new 800+ line production file can pass without allowlist;
- behavior-governing metadata keys can appear silently;
- stale README/GOAL/HANDOFF current-state claims can pass silently;
- new unused exports can pass silently;
- allowlist entries have no owner, reason, or expiry.
