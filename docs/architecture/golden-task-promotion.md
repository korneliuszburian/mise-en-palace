# GoldenTask Promotion Lane

Status: active D-00 policy.

GoldenTasks are regression proofs for KRN behavior that already failed or
proved useful in dogfood. They are not a broad benchmark suite and they are not
Promptfoo truth.

## Promotion Rule

A dogfood finding may become a GoldenTask only when it meets at least one rule:

1. the same failure repeats in two dogfood runs;
2. one critical invariant protects Memory Core, source truth, evidence
   provenance, Codex brief boundaries, or review gates;
3. a reviewed candidate has concrete evidence, a protected failure mode, and a
   deterministic behavior runner.

Do not promote a finding when it is only:

- a vague quality preference;
- a one-off implementation note with no future failure mode;
- a shape-only fixture;
- a Promptfoo smoke result without KRN behavior execution;
- a proposed candidate without evidence refs and does-not-prove text.

## Required Fields

Every promoted case must include:

- dogfood evidence refs;
- source refs;
- expected behavior;
- protected failure mode;
- deterministic runner or package test that executes real KRN behavior;
- does-not-prove statement in the proof path.

## Proof Boundary

Accepted GoldenTask proof is `krn_behavior_execution`.

Promptfoo may be used later as a runner/result adapter, but Promptfoo output
does not become KRN behavior proof unless a KRN behavior consumer maps the
result to a GoldenTask or EvalCandidate with explicit limits.

## Current D-00 Case

D-00 promotes the Codex brief contract hardening dogfood into the first
non-evidence GoldenTask case:

```txt
golden-task-codex-brief-001
golden-case-codex-brief-001-a
```

The protected invariant is:

```txt
Codex-facing briefs must render constraints, acceptance, review burden,
rollback, selected context, exclusions, and does-not-prove statements without
mutating core state or invoking Codex.
```

This is a capability behavior case, not an evidence-capture case.
