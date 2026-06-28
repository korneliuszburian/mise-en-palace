# V252 Normalized Target Trial Substrate

Status: substrate created, not target repair proof.

Date: 2026-06-28
Evaluator: Codex

## Executive Verdict

V252 created a KRN-owned normalized target substrate:

```txt
tests/fixtures/target-repos/normalized-weak-typescript/
```

This fixes the V251 problem: KRN no longer needs to use a random living
`active/` repo as the first product-transfer proof. The substrate is small,
resettable through git, has explicit owner files, and contains weak code that
should pressure KRN to apply TypeScript and evidence standards.

This is still not product readiness. It is the controlled proving ground needed
before future real target trials and second-operator proof.

## What Was Created

Files:

```txt
tests/fixtures/target-repos/normalized-weak-typescript/AGENTS.md
tests/fixtures/target-repos/normalized-weak-typescript/README.md
tests/fixtures/target-repos/normalized-weak-typescript/docs/repair-contract.md
tests/fixtures/target-repos/normalized-weak-typescript/package.json
tests/fixtures/target-repos/normalized-weak-typescript/tsconfig.json
tests/fixtures/target-repos/normalized-weak-typescript/src/config.ts
tests/fixtures/target-repos/normalized-weak-typescript/src/index.ts
tests/fixtures/target-repos/normalized-weak-typescript/src/userService.ts
tests/fixtures/target-repos/normalized-weak-typescript/tests/userService.test.ts
```

Purpose:

- controlled target substrate;
- weak external input boundary;
- weak result model;
- weak invalid-input test coverage;
- explicit repair contract;
- explicit owner-file contract;
- explicit rollback.

## Best-Pattern Pressure

| Pattern | Target evidence | Expected next repair |
|---|---|---|
| unknown-first boundary | `parseJsonConfig(raw): any` and direct domain use. | Parse raw JSON to `unknown`, then narrow before domain use. |
| finite-state result | `CreatedUser | null` hides why creation failed. | Use discriminated success/error result. |
| trusted env strings | `DEFAULT_ROLE` becomes domain role directly. | Validate/narrow role before use. |
| mixed IO/domain behavior | `createUserFromJson` parses, reads env, persists, and builds domain object. | Split only the minimum needed boundary. |
| weak proof | baseline `pnpm test` is only `tsc --noEmit`. | Add invalid-input behavior proof and report what tests do not prove. |

## Source To Decision

```yaml
source_id: v252-normalized-target-substrate
title: KRN-owned target substrate before living target trials
trust_tier: high
source_class: repo-local evidence
mechanism: A controlled target fixture makes weak patterns, owner files, allowed writes, rollback, verification, and expected repairs reproducible.
krn_implication: KRN can now test whether it applies best-pattern pressure to target code without touching living repos.
decision_kind: adopt
decision: Add normalized weak TypeScript target substrate and open V253 to run a real repair trial against it.
does_not_prove: Product readiness, real target success, or second-operator usability.
consumer: tests/fixtures/target-repos/normalized-weak-typescript and V253 trial.
falsifier: The substrate repair trial cannot detect or improve the weak boundary, or the fixture becomes decorative and unused.
```

## Adam-Style Brain Pattern Mapping

The user-provided Memory Core post is useful as product inspiration, not as
proof. Mapped to KRN:

| Claimed pattern | KRN equivalent today | Missing before strong claim |
|---|---|---|
| multi-layer memory | Memory/source/evidence/review/candidate layers exist. | target-work usefulness and baseline comparisons. |
| consensus | Source consensus/rejection model exists. | repeated target disputes and argument-value scoring. |
| temporal awareness | run ledgers, timestamps, stale memory, evidence provenance. | temporal update policies and stale repair loops. |
| heartbeat/dreaming | candidate/review/eval loop and continuous PLANS. | scheduled maintenance loop with falsifiable outputs. |
| not just RAG | activation + source-to-decision + reviewability. | BM25/vector/GraphRAG baseline comparisons. |
| legal/permission concern | source-to-decision legal/content boundary. | formal intake policy for external corpora. |

Decision:

Do not claim KRN is equivalent to that brain. Use these as hypothesis surfaces
that must become tests, source decisions, skills, or eval candidates.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --dir tests/fixtures/target-repos/normalized-weak-typescript test` | passed | Baseline fixture compiles under its own TypeScript command. | That the fixture is repaired or high-quality. |
| `krn init --dry-run --repo tests/fixtures/target-repos/normalized-weak-typescript ...` | passed | KRN can detect package manager, TS, scripts, source seeds, and owner files. | That KRN will select/repair correctly in a persisted target trial. |

## Next Recommended Action

Open V253:

```txt
Run Normalized Target Repair Trial
```

V253 should use the substrate as a target and repair exactly one bounded
weakness:

```txt
unsafe JSON.parse / any external input boundary in src/config.ts and
src/userService.ts
```

Success should require source change, focused tests, command evidence, and a
dogfood report that states whether KRN applied the intended best-pattern
pressure.
