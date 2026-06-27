# V32 Controlled Target Repair Trial

Status: complete.

Date: 2026-06-27.

Mode: headless-repair.

## Executive Verdict

KRN can govern a bounded headless repair in a living target checkout without
target commits, destructive cleanup, or product-readiness overclaim. The target
repair itself was small and verified, and KRN persisted target evidence,
allowed/forbidden writes, command proof, observe, reflect, and readback in the
current shell.

The important negative finding is owner-file refresh: after `krn init
--connect --persist` with the two exact FAQ owner files, `krn plan --persist`
still selected stale/older target owner files for the reused project. KRN was
useful as a governance/evidence workflow, but weak as owner-file recall for this
reused-project repair.

Next recommended task: V33 Reused Project Owner-File Refresh Repair.

## Target

```txt
target_repo: /home/krn/coding/krn/active/krn-elektroinstal-ogar
target_branch: master...origin/master
target_dirty_before: no
target_dirty_after: yes, exactly two intended target files
target_task: repair FAQ accordion trigger accessibility state
```

Preflight command:

```sh
rtk git status --short --branch
```

Preflight result:

```txt
* master...origin/master
clean - nothing to commit
```

Post-repair target state:

```txt
* master...origin/master
 M bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
 M bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

No target commit was made.

## Allowed Writes

Target writes were allowed only in:

```txt
bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
```

KRN writes were allowed only in:

```txt
docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md
GOAL.md
PLAN.md
PLANS.md
```

## Forbidden Writes

```txt
target commits
target git reset
target git clean
target generated build assets
target files outside the two allowed target files
target secrets or runtime config
broad target refactor
KRN package source
product-ready / widened-alpha / V02-01 overclaim
```

## Rollback

Before editing, the target repo was clean. The rollback method is to inspect
and manually restore only the two allowed files:

```sh
rtk git diff -- bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
```

Do not use broad `git reset` or `git clean`.

## Baseline Finding

`faq-help.php` rendered:

```txt
article.faq__item[aria-expanded=false]
button.faq__trigger[aria-controls=faq-answer-N]
```

`faq-accordion.js` toggled `aria-expanded` only on `.faq__item`.

The button is the interactive control and should expose `aria-expanded`.
Existing CSS depends on `.faq__item[aria-expanded=true]`, so the minimal repair
was to add and update `aria-expanded` on the trigger while preserving the item
attribute for current styling.

## Repair Diff Summary

Target diff:

```txt
bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js    | 6 ++++--
bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php   | 2 +-
2 files changed, 5 insertions(+), 3 deletions(-)
```

Behavioral change:

```txt
faq-help.php:
  button.faq__trigger now starts with aria-expanded="false".

faq-accordion.js:
  click handling reads trigger aria-expanded;
  writes trigger aria-expanded;
  still writes item aria-expanded for existing CSS.
```

This is a minimal target repair, not a target refactor.

## KRN DB-Backed Flow

DB readiness:

```txt
pnpm db:ready: passed
Postgres reachable
Migrations expected/applied: 14/14
pgvector: available
Brain store readiness: ready
```

KRN init/connect:

```txt
project_id: e83b4509-6889-426c-90e2-bc4e6394ba26
repo_installation_id: f08bfff8-cba2-426b-9c0e-18c90774afff
project_kernel_id: b51aebe5-a85d-4fae-babd-80f81a0db86e
owner-file inputs:
  bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
  bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
```

KRN plan:

```txt
execution_run_id: e6c68ed8-4c90-436c-bb33-7673f7ed683b
task_contract_id: 85b1165d-bf0e-41cc-9c1d-ba7f263160db
context_assembly_id: 7afc5fc4-710a-4069-a835-6d5544706e5b
```

Plan selected six context items, but did not select the two FAQ owner files
provided to init/connect for this repair. Instead, it selected older/stale
target owner-file context such as:

```txt
AGENTS.md
bedrock/composer.json
bedrock/README.md
woohub_gateway_v1/main.py
woohub_gateway_v1/README.md
target trust exclusions
```

This is the main V32 finding.

Evidence capture:

```txt
evidence_bundle_id: 2fa1837c-82d7-4ed2-8735-9bd563d806f5
review_assessment_id: f0f7200c-ff08-4099-b234-c852cdc163e9
feedback_delta_id: 310154e3-f327-469d-bbc6-d81d2d88ad00
```

Observe:

```txt
observation_group_id: 9e1b444d-6469-4cc2-bf6a-615085dd6e90
observation_items: 5
MemoryRecord created: no
Memory mutation: none
```

Reflect:

```txt
reflection_record_id: 88616d08-eba9-4af8-a339-af65e4dcf3c0
status: candidate
scope: run:e6c68ed8-4c90-436c-bb33-7673f7ed683b
candidateRowsWritten: false
memoryMutation: none
```

Run readback confirmed persisted target evidence, command proof, feedback
candidate reviewability, and no Memory Core mutation.

## Target Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk php -l bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php` | passed | target PHP syntax for edited template | runtime WordPress behavior, visual QA, accessibility tree correctness |
| `rtk node --check bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js` | passed | target JavaScript syntax for edited script | browser behavior, bundled build, DOM integration |
| `rtk git diff --check` in target | passed | no whitespace diff errors in target diff | semantic correctness |
| `rtk git status --short --branch` in target | passed | target dirty state is exactly visible | that target changes should be committed |

## Evidence / Review

Target evidence was strong for scope control:

```txt
mode: headless_repair
dirtyBefore: clean
dirtyAfter: dirty
ownedChanges: owned_by_current_krn_run
allowedWrites:
  - bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
  - bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
forbiddenWrites:
  - target commits
  - target git reset/git clean
  - target files outside the two allowed files
```

KRN EvidenceBundle changed-file classification showed one unknown KRN repo
file because the report path was not passed as `--intended-file` during
capture. This is an evidence ergonomics caveat for KRN report capture, not a
target evidence failure.

Feedback candidate reviewability remained `too_vague`, which is acceptable for
this run because no candidate was promoted.

## Dogfood Brain Usefulness

| Area | Verdict | Evidence | Notes |
|---|---|---|---|
| Target safety | good | allowed files recorded before target edit; post-status exactly two files | no target commit, no destructive cleanup |
| KRN planning | mixed/weak | persisted plan omitted the two FAQ owner files supplied to init/connect | useful governance, weak owner-file refresh |
| Evidence capture | good | persisted target metadata and command proof read back correctly | KRN report path classification was unknown because not passed as intended |
| Observation/reflection | good for non-mutation | observe/reflect persisted records without Memory Core mutation | does not prove reflection extraction quality |
| Review burden | lower | target diff, commands, allowed/forbidden writes, rollback all in one report/readback | owner-file miss increases source-discovery burden |
| Product readiness | unchanged | controlled target repair worked, but owner-file refresh gap remains | controlled-internal-alpha stronger; not widened alpha/product-ready |

Brain ROI: positive for governed workflow and evidence; mixed for activation /
owner-file recall in a reused project.

## Candidate Outputs

MemoryCandidate:

```txt
statement: Reused target project init/connect must make newly supplied owner-file
  entries visible to subsequent planning, or clearly report that persisted
  owner-file state was not refreshed.
evidence: V32 persisted init/connect accepted two FAQ owner files, but
  subsequent plan selected older target owner files and omitted both FAQ files.
doesNotProve: activation scoring is broadly wrong, source crawler is needed, or
  owner-file priority from V24 failed in fresh projects.
reviewability: ready
decision: review
```

EvalCandidate:

```txt
statement: DB-backed reused-project plan replay should prove that new
  `krn init --owner-file` inputs are selected or visible for owner-file-heavy
  tasks after reconnect.
evidence: V32 run `e6c68ed8-4c90-436c-bb33-7673f7ed683b`.
doesNotProve: all target repos need automatic source scanning.
reviewability: ready
decision: review
```

AntiMemoryCandidate:

```txt
statement: Do not treat target owner-file recall as proven for reused projects
  merely because init/connect prints newly supplied owner files.
evidence: V32 init/connect printed the FAQ owner files, but plan output selected
  stale/older owner-file context.
doesNotProve: owner-file recall never works.
reviewability: ready
decision: review
```

## Product Boundary

This is not V02-01, not widened alpha, and not product-ready proof. It is one
headless controlled target repair trial.

Readiness impact:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01: blocked/deferred
```

## Next Recommended Action

Promote V33:

```txt
V33 — Reused Project Owner-File Refresh Repair
```

Goal: inspect and repair the reused-project owner-file refresh/read-model path
so new `krn init --owner-file` entries are available to planning or the CLI
prints an explicit stale-owner-file/read-model warning.

Non-goals: activation scoring rewrite, target source crawler, target commit,
product-ready overclaim, dashboard/API/MCP/worker runtime.
