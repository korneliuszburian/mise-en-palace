# Repo Reset Repair Plan

Status: decision-ready repair plan, not approved for implementation.

This plan is not approved for implementation. The active phase is still
read-only audit plus audit-artifact writing under `docs/reviews/repo-reset-audit`.

## Repair Principles

Priority order:

1. delete or reduce wrong abstractions;
2. rename misleading surfaces;
3. collapse duplicate or fake layers;
4. repair stale docs;
5. strengthen domain models where behavior is real;
6. only then continue feature slices.

Do not default to "add more audit automation."

## Candidate Repair Tasks

### R-00: Kill The Productized Anti-Slop Direction

objective:

Stop treating "anti-slop" as a KRN feature, subsystem, audit layer, or product
surface. The original need was an anti-slop audit against explicit engineering
standards, not a reusable KRN anti-slop auditing product.

files likely touched:

- `docs/plans/memory-ideal-state/PLAN.md`
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
- `README.md`
- any handoff/current-state docs that present QG-06 as product direction

non-goals:

- no package source changes before user approval;
- no new audit checks;
- no new quality CLI;
- no smell-scanner product;
- no replacement meta-layer.

exact verification:

- `rg -n "anti-slop|quality gate automation|smell scan automation|QG-06|quality engine|audit automation" README.md GOAL.md PLAN.md docs/plans/memory-ideal-state docs/handoff`
- The remaining matches must either be historical, explicitly rejected, or
  describe a narrow mechanical guard rather than product direction.
- `git diff --check`

what not to build:

No `krn comments`, no `krn quality`, no `krn memory-strip-*`, no new audit
subsystem for ordinary code-review concerns.

commit message:

`docs(review): reject productized anti-slop layer`

rollback path:

`git revert <commit>`

why this makes KRN more true:

KRN should supply bounded context, source-grounded memory, policy, traces,
review gates, and feedback. General code quality belongs to architecture,
TypeScript, tests, naming, and review discipline. Productizing every quality
concern creates the wrong software.

### R-01: Repair README Promptfoo Drift

objective:

Align `README.md` with the current QG-05 decision: official Promptfoo is adopted
as a bounded local eval-lane runner/result adapter, not as Memory Core or a broad
eval product.

files likely touched:

- `README.md`

non-goals:

- no Promptfoo feature work;
- no eval runner change;
- no package source change.

exact verification:

- `rg -n "Promptfoo|promptfoo|QG-05" README.md GOAL.md PLAN.md docs/plans/memory-ideal-state/GOAL.md docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md`
- `git diff --check`

what not to build:

No new eval command, dashboard, MCP/server, share/redteam Promptfoo surface, or
broad benchmark lane.

commit message:

`docs(readme): align Promptfoo status with QG-05`

rollback path:

`git revert <commit>`

why this makes KRN more true:

Fresh agents and reviewers stop following stale onboarding state.

### R-02: Deproductize Or Delete `krn audit`

objective:

Decide whether any part of `krn audit` deserves to survive as a narrow
mechanical guard. If it survives, its docs and name must make clear that it is
not architecture review and not an anti-slop system.

files likely touched:

- `README.md`
- `docs/plans/memory-ideal-state/PLAN.md`
- `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`
- future audit docs found during package inspection

non-goals:

- no audit code before user approval;
- no new QG-06 implementation as product direction;
- no new scanner categories.

exact verification:

- `rg -n "quality engine|anti-slop subsystem|krn audit|QG-06|smell scan|quality gate automation" README.md GOAL.md PLAN.md docs/plans/memory-ideal-state`
- `git diff --check`

what not to build:

No separate `krn quality`, no broad smell-scanner product, no audit dashboard.

commit message:

`docs(audit): deproductize audit guard`

rollback path:

`git revert <commit>`

why this makes KRN more true:

It prevents a mechanical helper from becoming a KRN feature that pretends to
certify engineering judgment.

### R-03: Decide QG-06 Scope From Evidence, Not Ambition

objective:

If any QG-06 work survives R-00/R-02, decide which deterministic findings are
worth keeping as mechanical guardrails and which should be repaired directly or
left to review.

files likely touched:

- `docs/reviews/repo-reset-audit/REPAIR_PLAN.md`
- later QG-06 plan/code only after user approval

non-goals:

- no implementation before audit completion and user approval;
- no broad "quality engine."

exact verification:

- Each retained check has a seeded failing fixture/test, a falsifier, and a
  direct mapping to a prior failure mode.
- Any check that cannot meet that bar is deleted from the plan instead of
  carried as future audit automation.

what not to build:

No unbounded scanner categories, no broad allowlists without owner/reason/expiry.

commit message:

`docs(review): decide bounded audit repairs`

rollback path:

`git revert <commit>`

why this makes KRN more true:

It prevents QG-06 from absorbing quality discipline into a meta-layer.

### R-04: Split Public Operator CLI From Internal Dev Surface

objective:

Make it impossible to confuse internal smokes/repository probes with the KRN
operator product surface.

files likely touched:

- `README.md`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/parseDbArgs.ts`
- `packages/cli/src/index.ts`
- docs/handoff/current-state surfaces that list CLI commands

non-goals:

- no behavior removal before user approval;
- no new CLI framework;
- no dashboard/API/MCP;
- no broad command rewrite unless the user approves an implementation slice.

exact verification:

- A public CLI help/readme pass classifies commands as operator, governed admin,
  or internal/dev.
- DB smokes and low-level probes no longer look like the main product path.
- `pnpm --filter @krn/cli test`
- `pnpm --filter @krn/cli typecheck`
- `git diff --check`

what not to build:

No new "control center" command. This is a reduction/classification repair, not
surface expansion.

commit message:

`docs(cli): classify public and internal command surfaces`

rollback path:

`git revert <commit>`

why this makes KRN more true:

KRN's visible operator workflow should be small and governed. Internals can
exist, but they should not pretend to be product.

### R-05: Seal Memory Core Write Authority

objective:

Make MemoryReviewGate or a dedicated promotion service the only public
architecture path from MemoryCandidate to active MemoryRecord.

files likely touched:

- `packages/harness/src/repositories/memoryRepository.ts`
- `packages/harness/src/memory/memoryReviewGate.ts`
- `packages/db/src/repositories/DrizzleMemoryRepository.ts`
- `packages/db/src/repositories/index.ts`
- tests that currently stub or import low-level memory writes

non-goals:

- no schema rewrite unless required by type boundaries;
- no automatic promotion;
- no LLM/reflection-created MemoryRecord path;
- no file-backed memory.

exact verification:

- Public harness-facing repository type no longer advertises direct Memory Core
  creation as a normal runtime operation, or the low-level adapter is explicitly
  internal.
- CLI promotion still requires `--evidence-reviewed-ref`.
- Existing smokes/tests either route through the gate or are marked internal
  fixture setup.
- `pnpm --filter @krn/harness test -- memory/memoryReviewGate.test.ts`
- `pnpm --filter @krn/db test`
- `pnpm typecheck`

what not to build:

No new memory approval UI, no autonomous memory writer, no "learn" command.

commit message:

`refactor(memory): seal public promotion authority`

rollback path:

`git revert <commit>`

why this makes KRN more true:

Memory Core is the durable brain. A public shortcut around review defeats the
whole product thesis.

### R-06: Promote Behavior-Governing Metadata Into Typed Fields

objective:

Identify repeated metadata keys that affect behavior and move them into typed
domain/read-model fields or explicit accepted-debt records.

files likely touched:

- `packages/core/src/source.ts`
- `packages/core/src/contextAssembly.ts`
- `packages/core/src/activation.ts`
- `packages/harness/src/reflection/reflectionInputSelector.ts`
- `packages/harness/src/activation/rankCandidates.ts`
- `packages/harness/src/activation/activationEngine.ts`
- `packages/harness/src/activation/assembleContext.ts`
- `packages/db/src/schema/retrieval.ts`
- related schema/repository mappers

non-goals:

- no generic metadata linter product;
- no broad QG-06 scanner before architecture repair;
- no migration unless a field is truly first-class and accepted.

exact verification:

- `rg -n "metadata\\.(projectId|sourceClaimId|memoryRecordId|antiMemoryRecordId|searchDocumentId|activationAbstention|observationPrefix|observationPrefixGate)" packages`
- Remaining matches are either non-authoritative payload, explicitly accepted
  debt with owner/expiry, or replaced by typed fields.
- `pnpm typecheck`
- targeted tests for activation/reflection still pass.

what not to build:

No metadata-police subsystem. Fix the known behavior keys directly.

commit message:

`refactor(core): type behavior metadata boundaries`

rollback path:

`git revert <commit>`

why this makes KRN more true:

Runtime authority belongs in explicit models. Metadata should not silently
decide project isolation, activation identity, or governance.

### R-07: Repair Golden / Promptfoo Claims

objective:

Make docs and tests state exactly what Promptfoo proves: official runner
integration and result mapping, not KRN behavior correctness unless a real
behavior proof path is run.

files likely touched:

- `README.md`
- `docs/plans/memory-ideal-state/PLAN.md`
- `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md`
- `tests/fixtures/promptfoo/krn-golden-smoke.yaml`
- `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs`
- `packages/harness/src/goldenPromptfooExport.ts`
- `packages/harness/src/goldenPromptfooResult.ts`

non-goals:

- no broad benchmark lane;
- no hosted Promptfoo/share/redteam setup;
- no dashboard.

exact verification:

- README says QG-05 is adopted and bounded.
- Promptfoo smoke docs/fixture names say integration smoke, not behavior proof.
- `pnpm exec promptfoo --version`
- `pnpm eval:promptfoo:smoke`
- `pnpm --filter @krn/harness test -- goldenPromptfooExport.test.ts goldenPromptfooResult.test.ts`

what not to build:

No "eval platform"; no treating Promptfoo as canonical KRN truth.

commit message:

`docs(eval): bound Promptfoo integration claims`

rollback path:

`git revert <commit>`

why this makes KRN more true:

Eval tools should make behavior proof sharper, not create a false badge.

### R-08: Narrow Package Barrels And Internal Exports

objective:

Stop broad package entrypoints from making smokes, repository adapters, schema
tables, and command implementations look like stable product APIs.

files likely touched:

- `packages/db/src/index.ts`
- `packages/db/src/repositories/index.ts`
- `packages/db/src/schema/index.ts`
- `packages/harness/src/index.ts`
- `packages/harness/src/repositories/index.ts`
- `packages/cli/src/index.ts`
- package tests/imports that depend on broad barrels

non-goals:

- no package split;
- no npm publishing;
- no build system redesign.

exact verification:

- `rg -n "export \\*" packages/*/src/index.ts packages/*/src/**/index.ts`
- Every remaining wildcard export is intentionally public or local-internal
  with a documented boundary.
- `pnpm typecheck`
- `pnpm test`

what not to build:

No compatibility layer for imaginary external consumers. This repo is private.

commit message:

`refactor(exports): narrow package public surfaces`

rollback path:

`git revert <commit>`

why this makes KRN more true:

Public exports are product surface. Hiding internals prevents accidental
architecture.

### R-09: Preserve Observation / Reflection, But Remove Brain-Magic Language

objective:

Keep observation/reflection as deterministic staging and candidate/reporting
mechanisms, while removing language that implies autonomous brain, dreaming, or
automatic self-healing behavior.

files likely touched:

- `README.md`
- `GOAL.md`
- `PLAN.md`
- `docs/plans/memory-ideal-state/PLAN.md`
- observe/reflect CLI help docs if any

non-goals:

- no observation/reflection deletion;
- no new reflection worker;
- no candidate row creation path;
- no autonomous LLM/reflection loop.

exact verification:

- `rg -n "dream|dreaming|living brain|self-healing|autonomous|auto-promotion|Memory Core mutation" README.md GOAL.md PLAN.md docs/plans/memory-ideal-state`
- Remaining matches are either raw-material discussion, explicit rejection, or
  bounded future hypotheses.
- `krn observe` / `krn reflect` docs continue to state no MemoryRecord creation.

what not to build:

No hidden consolidation runtime.

commit message:

`docs(memory): keep observation reflection staging honest`

rollback path:

`git revert <commit>`

why this makes KRN more true:

The mechanism is good; the mythology around it is dangerous.

### R-10: Reconcile Current-State Docs Into One Truth Surface

objective:

Stop README, GOAL, root PLAN, memory PLAN, QG docs, and REVIEW from giving
different current-state instructions.

files likely touched:

- `README.md`
- `GOAL.md`
- `PLAN.md`
- `REVIEW.md`
- `docs/plans/memory-ideal-state/GOAL.md`
- `docs/plans/memory-ideal-state/PLAN.md`
- selected handoff docs if they claim current state

non-goals:

- no broad historical rewrite;
- no deleting raw materials;
- no hiding unresolved issues.

exact verification:

- One canonical current-state surface is named.
- Historical docs are marked historical.
- README does not contradict QG-05/QG-06 decisions.
- `rg -n "not adopted or rejected|QG-06 automates|feature work resumes|current phase|not built yet|built but not proven" README.md GOAL.md PLAN.md REVIEW.md docs/plans/memory-ideal-state`
- Contradictions are removed or explicitly labeled as historical.

what not to build:

No second plan. No parallel narrative docs.

commit message:

`docs(state): reconcile current architecture truth`

rollback path:

`git revert <commit>`

why this makes KRN more true:

Agents route from docs. If docs disagree, KRN selects bad context before the
system even starts.
