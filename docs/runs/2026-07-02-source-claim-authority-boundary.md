# Source Claim Authority Boundary

## Verdict

The audit finding was live.

`retrieveActivationCandidates` retrieved project SourceClaims without an
accepted-status authority gate, and `assembleContext` previously allowed a
well-formed `proposed` SourceClaim to become an inclusion when it had mechanism
and `doesNotProve` text.

## Source To Decision

```yaml
source_id: repo-local-audit-ksvm
title: Proposed SourceClaims can enter activation as implementation authority
trust_tier: high
source_class: repo-local evidence
mechanism: SourceClaim defaults to proposed in persistence, activation mapped claims into candidates without carrying lifecycle status, and context assembly only checked mechanism and doesNotProve.
krn_implication: Activation must distinguish reviewed source authority from review candidates before rendering Codex-facing context.
decision_kind: adopt
decision: Carry SourceClaim lifecycle status into activation candidates and exclude non-accepted source claims at context assembly.
does_not_prove: This does not prove source taxonomy is normalized, SourceDecision links are fully enforced, or all DB source governance invariants are complete.
consumer: packages/harness/src/activation/assembleContext.ts
falsifier: A proposed/rejected/deprecated SourceClaim appears in ContextAssembly.inclusions without an explicit exploratory/untrusted path.
```

## Implementation

- Added `sourceClaimStatus` to activation candidates.
- Preserved SourceClaim lifecycle status in `toSourceClaimCandidate`.
- Excluded non-accepted source claims in `assembleContext` with `reason: "unsafe"`.
- Let activation trace persistence record exclusion categories that are created
  during context assembly.
- Updated tests/fixtures that intentionally model authoritative source claims to
  use `status: "accepted"`.

## Verification

```txt
rtk pnpm --filter @krn/harness test -- activation
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk git diff --check
```

Result:

- focused activation: 34 files passed, 189 tests passed;
- workspace typecheck: passed;
- full workspace tests: 129 files passed, 744 tests passed;
- Fallow changed-files gate: passed, with inherited duplication findings excluded by gate;
- brain-battle smoke: passed;
- diff whitespace check: passed.

## Proof Boundary

Proves:

- Proposed SourceClaims do not silently enter assembled implementation context
  through the activation assembly path.
- Existing activation and compiler-focused harness tests accept the new source
  authority boundary.

Does not prove:

- Source taxonomy is normalized.
- Accepted SourceClaims always have linked SourceDecision records.
- DB-level source governance is complete.
- Product-loop E2E proof is complete.
