# QG-05: Official Promptfoo Adapter Decision

> Historical audit/planning ledger.
> Not current execution truth.
> Current canonical execution plan: `/PLAN.md`.
> Reset decision, 2026-06-23: QG-06/productized audit automation is rejected as
> active product direction. Treat QG-06 references below as historical evidence
> or quarry for bounded internal guards only.

Status: complete
Date: 2026-06-23

## Decision

Adopt official Promptfoo as a bounded eval-lane runner and result adapter.

Promptfoo is not Memory Core, not GoldenTask truth, not EvalCandidate truth, not
a review gate, and not a replacement for KRN behavior proofs. KRN owns:

- `GoldenTask`;
- `GoldenBehaviorProof`;
- `EvalCandidate`;
- memory/source/review gates;
- promotion and rejection decisions.

Promptfoo may execute configured eval cases, run assertions, and emit JSON/JSONL
evidence that KRN maps back into explicit behavior proofs only when the eval
case actually executes KRN behavior. The current local smoke does not execute
KRN behavior.

## Source To Decision

### S1: Promptfoo getting started

- Source: https://www.promptfoo.dev/docs/getting-started/
- Trust tier: high for Promptfoo behavior.
- Mechanism: Promptfoo evals are configured with prompts, providers, test vars,
  and assertions, then executed with `promptfoo eval`.
- KRN implication: KRN should use Promptfoo through real config/provider/test
  files, not a fake object shaped like Promptfoo.
- Decision: adopt an official CLI smoke path now.
- Does not prove: Promptfoo can define KRN memory truth or promotion semantics.
- Consumer: `tests/fixtures/promptfoo/krn-golden-smoke.yaml`.
- Falsifier: `promptfoo validate config` or `promptfoo eval` fails on the KRN
  fixture.

### S2: Promptfoo custom JavaScript provider

- Source: https://www.promptfoo.dev/docs/providers/custom-api/
- Trust tier: high for provider API.
- Mechanism: a custom provider implements `id` and `callApi`, and `callApi`
  returns a provider response containing output and optional metadata.
- KRN implication: KRN can run an official Promptfoo eval without external model
  calls by using a local provider for integration smoke proof.
- Decision: adopt a local provider for runner/config/provider smoke proof; do
  not use external model providers until a later eval slice requires them.
- Does not prove: local provider output is product intelligence.
- Consumer: `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs`.
- Falsifier: local provider cannot be loaded by Promptfoo from the fixture.

### S3: Promptfoo output formats

- Source: https://www.promptfoo.dev/docs/configuration/outputs/
- Trust tier: high for output shape.
- Mechanism: Promptfoo can export JSON/JSONL rows containing `success`, `score`,
  `response`, `gradingResult`, and assertion component results.
- KRN implication: Promptfoo result rows are external evidence and must be
  parsed through an unknown-first boundary before becoming KRN proofs.
- Decision: add a typed KRN mapping function for JSONL rows.
- Does not prove: all Promptfoo exports are semantically valid KRN proofs.
- Consumer: `mapPromptfooJsonlRowsToGoldenBehaviorProofs`.
- Falsifier: malformed rows can become passing KRN proofs.

### S4: Promptfoo command line

- Source: https://www.promptfoo.dev/docs/usage/command-line/
- Trust tier: high for CLI contract.
- Mechanism: `promptfoo validate config` validates configuration and
  `promptfoo eval -c <config>` runs an eval. Promptfoo also exposes broad
  commands including `mcp`, red teaming, sharing, and hosted workflows.
- KRN implication: QG-05 should adopt only `validate config` and `eval` for a
  local smoke. MCP/server/share/redteam surfaces remain out of scope.
- Decision: add `pnpm eval:promptfoo:smoke` as the only QG-05 runtime command.
- Does not prove: Promptfoo MCP/API should be exposed in KRN now.
- Consumer: root `package.json` script.
- Falsifier: QG-05 adds Promptfoo MCP/server/dashboard/share integration.

### S5: Promptfoo package security posture

- Source: https://github.com/promptfoo/promptfoo/security
- Trust tier: medium for operational risk; GitHub security page is project
  metadata, not an architecture guarantee.
- Mechanism: Promptfoo runs local configs and referenced provider code, so
  configs/providers must be treated as executable eval assets.
- KRN implication: Promptfoo configs/providers belong in reviewed fixtures or
  controlled eval packages, not untrusted runtime input.
- Decision: keep QG-05 provider local, deterministic, and committed.
- Does not prove: arbitrary Promptfoo configs are safe to run inside KRN.
- Consumer: future QG-06 audit rule for trusted eval config surfaces.
- Falsifier: KRN starts executing user-supplied Promptfoo configs without review
  or sandboxing.

## Implemented Boundary

- Official dependency: `promptfoo@0.121.17`.
- Official config: `tests/fixtures/promptfoo/krn-golden-smoke.yaml`.
- Local provider: `tests/fixtures/promptfoo/krn-golden-smoke-provider.mjs`.
- Command: `pnpm eval:promptfoo:smoke`.
- Result bridge: `mapPromptfooJsonlRowsToGoldenBehaviorProofs`.

The local provider is deliberately not a model evaluator. It proves the
official Promptfoo runner/config/provider/output path only. The committed smoke
provider must not be cited as stale-memory, anti-memory, activation, or Memory
Core behavior proof. Later eval slices may replace the provider with real KRN
behavior runners or model-backed graders, but they must still feed KRN-owned
proof/candidate types.

## Verification

- `pnpm exec promptfoo --version` -> `0.121.17`.
- `pnpm exec promptfoo validate config -c tests/fixtures/promptfoo/krn-golden-smoke.yaml`
  -> configuration valid.
- `pnpm eval:promptfoo:smoke` -> 2 passed, 0 failed, 0 errors; JSONL written to
  `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`.

This verification proves Promptfoo dependency/config/provider/result-output
integration only. It does not prove KRN memory, anti-memory, activation,
observation, reflection, or review-gate behavior.

Observed non-blocking runtime notes:

- Promptfoo CLI emitted Node `ExperimentalWarning: DecompressInterceptor is
  experimental and subject to change`.
- Promptfoo telemetry shutdown timed out after validate/eval, while commands
  still exited successfully.
- `pnpm add -D promptfoo -w` reported dependency peer/deprecation warnings and
  ignored build scripts requiring normal pnpm approval if those transitive
  packages are later used.

## Rejections

- Reject treating MM-65 snapshot export as final Promptfoo integration.
- Reject Promptfoo as a Memory Core writer.
- Reject Promptfoo as a GoldenTask source of truth.
- Reject Promptfoo MCP/server/share/redteam surfaces in this slice.
- Reject running unreviewed Promptfoo configs as user input.

## Next Required Follow-Ups

- QG-06 should audit that Promptfoo configs/providers are reviewed fixtures or
  explicit eval package assets.
- MM-66 can consume Promptfoo result evidence only after KRN maps it into
  `GoldenBehaviorProof` / `EvalCandidate` semantics.
- Later eval slices should decide whether model-backed Promptfoo graders are
  needed for specific behavior classes.
