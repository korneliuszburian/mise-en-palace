# EBF-01 ExecutionBrief Format Contract

Date: 2026-07-01

## Summary

EBF-01 adds an explicit `ExecutionBrief` format contract to the Codex adapter
surface.

The format is intentionally small:

```txt
executionBriefFormatVersion: krn.executionBrief.v1
rendered text: Format Version: krn.executionBrief.v1
```

This makes Codex-facing prompt format changes reviewable without rewriting the
renderer, adding provider abstraction, invoking Codex, or creating a broad LLM
eval platform.

## KRN Plan

Persisted plan:

```txt
executionRun: 3acf6fd7-52b8-4453-a827-632d6c21ccd7
operatorIntent: 014e9820-31e7-4043-952f-ae9bd02acc00
taskContract: 1193f84d-d2d7-4a35-9953-3bd3e3fbbd6b
harnessPlan: e45c07e7-fe13-4a02-8984-c738fcd2ca0a
contextAssembly: ca3fdac3-9107-4ce3-bc92-3441015053c7
```

Activation usefulness: weak for owner-file recall.

KRN selected broad plan/activation owner files and unrelated guardrails, not the
direct Codex adapter owner files. Local source inspection identified the owning
surface:

```txt
packages/codex-adapter/src/contracts.ts
packages/codex-adapter/src/renderExecutionBrief.ts
packages/codex-adapter/src/renderExecutionBrief.test.ts
packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts
packages/cli/src/codexAdapterSmoke.ts
```

Retained pattern query returned no result for the Codex brief format/version
contract query. The first query attempt missed shell quoting and was rejected by
the CLI; the corrected query returned zero matches with no-match guidance.

## Source To Decision

Source:

```txt
packages/codex-adapter/src/contracts.ts
packages/codex-adapter/src/renderExecutionBrief.ts
packages/codex-adapter/src/renderExecutionBrief.test.ts
packages/codex-adapter/src/codexBriefGoldenBehavior.test.ts
packages/cli/src/codexAdapterSmoke.ts
audit finding: Codex-facing prompt architecture has no format/version contract
```

Mechanism:

```txt
ExecutionBrief already had a typed structure and rendered plain-text brief, but
the rendered output had no explicit format marker. A field rename or section
order change could alter the Codex-facing prompt without an operator-visible
contract.
```

KRN implication:

```txt
Codex-facing prompt surfaces should carry a stable format/version marker so
future changes are reviewed as contract changes, not invisible renderer drift.
```

Decision:

```txt
Adopt a single exported format constant in @krn/codex-adapter contracts and
render it directly below the brief title. Add unit/golden coverage and DB smoke
readback that confirms the format version is present.
```

Rejected:

```txt
Provider abstraction rewrite, template engine, JSON prompt artifact, renderer
collapse, broad Promptfoo/LLM evaluation, Codex execution changes.
```

Does not prove:

```txt
This does not prove Codex consumed the brief correctly, that prompt quality is
better, that a provider-neutral adapter exists, or that future format changes
will be semantically safe.
```

Consumer:

```txt
ExecutionBrief type contract, rendered Codex brief text, codex adapter golden
behavior proof, DB-backed codex-adapter smoke.
```

Falsifier:

```txt
Rendered brief omits Format Version, DB smoke reports format version missing,
manual ExecutionBrief construction can omit formatVersion, or tests pass after
changing the format marker without review.
```

## Changed

```txt
packages/codex-adapter/src/contracts.ts
  Added executionBriefFormatVersion and ExecutionBrief.formatVersion.

packages/codex-adapter/src/renderExecutionBrief.ts
  createExecutionBrief sets the format version and renderExecutionBriefText
  prints it below the title.

packages/codex-adapter/src/*test.ts
  Added contract, render, and golden behavior coverage for the format marker.

packages/cli/src/codexAdapterSmoke.ts
packages/cli/src/codexAdapterSmoke.test.ts
  DB-backed smoke proof now checks and reports format version presence.
```

## Verification

Passed:

```txt
pnpm --filter @krn/codex-adapter test -- renderExecutionBrief contracts codexBriefGoldenBehavior
pnpm --filter @krn/cli test -- codexAdapterSmoke runCli runCodexBriefCommand
pnpm run typecheck
pnpm db:smoke:codex-adapter
```

DB smoke readback:

```txt
Format version present: yes
Codex invocations: 0
Cleanup remaining marker count: 0
Codex adapter smoke: passed
```

Persisted run evidence:

```txt
evidenceBundle: 386c9034-bdf1-47bc-a46a-dedc5c77aed2
reviewAssessment: 747c3b8a-16af-49da-80e9-a3668dc98a05
feedbackDelta: c4dd3dda-9ce2-4162-a2cc-e2721cbfedd6
observationGroup: 30b39136-1c2a-4909-9930-fbe2eb7c3735
observationItems: 5
reflectionRecord: 92f027f5-e172-40e1-98f8-f9af3701aba1
reflectionObservationsSelected: 5
candidateRowsWritten: no
memoryMutation: none
```

## Proof

This proves:

```txt
ExecutionBrief objects now carry a typed formatVersion.
Rendered Codex briefs expose the format marker.
Golden behavior protects the marker as part of the bounded review contract.
DB-backed codex-adapter smoke reads a persisted run and confirms the marker is
present without invoking Codex.
```

This does not prove:

```txt
Codex executed or understood the brief.
Prompt format v1 is perfect or sufficient forever.
Provider abstraction exists.
Promptfoo measures semantic brief quality.
KRN is product-ready.
```

## Review Burden

Low. The slice adds a format constant, one required field, one rendered line,
and proof checks. It deliberately avoids renderer refactor and adapter
abstraction work.

Rollback:

```txt
Remove executionBriefFormatVersion, ExecutionBrief.formatVersion, the rendered
Format Version line, and the associated test/smoke assertions.
```

## Candidate Outputs

MemoryCandidate:

```txt
Codex-facing ExecutionBrief output should expose a stable format version before
larger prompt-surface changes.
reviewability: ready
decision: review
evidence refs: EBF-01 report, codex adapter tests, codex-adapter DB smoke
doesNotProve: does not prove Codex semantic behavior or prompt quality.
```

EvalCandidate:

```txt
Codex adapter smoke should fail if rendered ExecutionBrief output omits the
current format marker.
reviewability: ready
decision: review
evidence refs: packages/cli/src/codexAdapterSmoke.ts
doesNotProve: does not prove provider-neutral adapter readiness.
```

AntiMemoryCandidate:

```txt
Do not treat ExecutionBrief format versioning as proof that Codex consumed,
executed, or obeyed the brief.
reviewability: ready
decision: review
evidence refs: EBF-01 report, codex adapter smoke
doesNotProve: does not prove future prompt changes are safe without review.
```

## Next

Continue product-facing brain work. If staying on Codex adapter cleanup, the
next bounded slice should be driven by live product need, not renderer
beautification.
