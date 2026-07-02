# Reference Recipe Drift Lab

## Verdict

The audit finding was live, but the right KRN response is bounded. The
polubis/gon-stack source does not justify a broad clone runtime, skill zoo, or
new product surface. It does show a useful mechanism: keep a small manifest that
links a reviewed code exemplar to its local documentation/recipe, and fail a
check when code and recipe drift apart.

This slice adopts that mechanism as a harness lab-test only.

## Source To Decision

```yaml
source_id: public-polubis-gon-stack-hashy
title: gon-stack hashy module manifest
url:
  - https://github.com/polubis/gon-stack/blob/d901f7c134b4c0885fd7fe3c099f17b4dca88a78/hashy.modules.txt
  - https://github.com/polubis/gon-stack/blob/d901f7c134b4c0885fd7fe3c099f17b4dca88a78/packages/hashy/README.md
trust_tier: medium
source_class: practitioner writing / public repo evidence
mechanism: a repo-local manifest maps module directories to their markdown docs; a deterministic hash check fails when implementation files change without the stamped doc being updated.
krn_implication: KRN can lab-test local reference recipes as code-backed patterns by hashing a reviewed exemplar and its retained recipe document, while keeping recipe authority subordinate to tests, review gates, evidence, and source-to-decision.
decision_kind: lab_test
decision: Add a minimal harness recipe drift check for the existing brainKnowledgeReadModel TypeScript exemplar and retained recipe doc.
does_not_prove: This does not prove clone workflows outperform skills, broad recipe automation is needed, KRN should add a clone runtime, real LLM behavior improved, or KRN is product-ready.
consumer: packages/harness/src/recipes/drift.ts; docs/patterns/reference-recipes/drift.json
falsifier: the exemplar code can change without the drift check failing, or future work treats the recipe manifest as runtime clone authority instead of lab-test evidence.
```

## Implementation

- Added `packages/harness/src/recipes/drift.ts`.
- Added focused tests in `packages/harness/src/recipes/__tests__/drift.test.ts`.
- Added `docs/patterns/reference-recipes/drift.json`.
- Chose short names (`recipes`, `drift`, `Recipe`, `hashRecipe`) instead of
  long AI/control-plane names.
- Kept the code inside harness; no CLI command, DB schema, runtime clone system,
  dashboard, MCP, worker, crawler, or skill zoo was added.
- Added active protocol that larger migration/audit-hardening slices must end
  with compact handoff and a second-opinion prompt.
- Created durable Beads tasks for the larger migration direction:
  - `mise-en-palace-yuvw`: inventory repo naming and layout slop;
  - `mise-en-palace-dqqf`: migrate test topology toward `__tests__` islands;
  - `mise-en-palace-mvrx`: shorten AI-control-plane names without losing meaning;
  - `mise-en-palace-c2jg`: large-slice handoff and second-opinion prompt protocol.

## Polubis Layout Notes

Observed useful patterns from the public repo:

- small package names such as `hashy`, `type-beast`, `react-kit`;
- short file names such as `brand.ts`, `key.ts`, `cn.ts`, `context.tsx`;
- package-local tests under `src/__tests__/`;
- local module docs such as `src/modules/user-profile-setup/AGENTS.md`;
- manifest-style drift check for docs linked to code.

Rejected for now:

- copying the repo topology wholesale;
- adding clone runtime;
- making skills the authority layer;
- mass-renaming KRN without inventory and migration order.

## Verification

```txt
rtk pnpm --filter @krn/harness test -- recipes
rtk pnpm -C packages/harness typecheck
rtk pnpm quality:fallow:ci
rtk pnpm --filter @krn/harness test -- recipes activePlanInvariants contextHygieneInvariants skillInvariants
rtk docker compose up -d krn-postgres && rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm alpha:verify:full
```

Result:

- Focused recipe tests: 36 files passed, 200 tests passed.
- Harness package typecheck: passed.
- Fallow changed-files audit: passed on 8 changed files.
- Focused harness invariants: 36 files passed, 200 tests passed.
- Full alpha verification: passed with typecheck, workspace tests, doctor,
  Fallow, brain-battle smoke, Promptfoo smoke, DB readiness, drizzle check,
  DB smoke, DB-backed brain-loop smoke, and `git diff --check`.

## Proof Boundary

Proves:

- One local reference recipe now has deterministic drift detection.
- A simulated implementation change makes the drift check fail.
- The manifest parser rejects unsafe paths and bad hashes before reading files.
- The external practitioner pattern was reduced into a bounded KRN lab-test.

Does not prove:

- KRN needs broad recipe automation.
- Clone workflows outperform skills.
- Repo-wide naming/layout has been fixed.
- Test topology has been migrated repo-wide.
- Real LLM behavior improved.
- KRN is product-ready.
