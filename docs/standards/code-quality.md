# KRN Code Quality Standard

Status: active

Date: 2026-06-23

This standard defines general coding rules for KRN. It complements:

- `docs/standards/typescript-boundaries.md`;
- `docs/standards/typescript-excellence.md`;
- `docs/standards/code-vocabulary.md`.

## Doctrine

KRN code should be easy to audit under pressure.

- Prefer explicit domain language over clever generic abstractions.
- Keep files focused around one responsibility.
- Keep runtime authority visible in package boundaries and function names.
- Make invalid states hard to construct.
- Write behavior tests that prove product rules, not fixture theater.
- Do not build placeholder layers that are meant to be replaced by the real architecture later.

## Naming

Names must describe actual authority.

Use:

- `validate*` only when invalid input is rejected;
- `assess*` when findings/verdicts are returned;
- `select*` when choosing from supplied inputs;
- `build*` for pure construction;
- `create*` for new values or persisted rows in the owning layer;
- `persist*` only for durable writes;
- `promote*` only for governance-gated state transitions;
- `summarize*` for read-only reporting;
- `normalize*` for deterministic label/shape derivation.

Avoid:

- names implying learning, extraction, promotion, persistence, or truth when the function does not perform that authority;
- vague names such as `manager`, `processor`, `handler`, `service`, `helper`, `utils` unless the package already has a precise local convention;
- suffixing everything with `Data`, `Info`, or `Payload` when a domain noun exists;
- hidden model/LLM implication in deterministic helpers.

## File Responsibility

A file should have one dominant reason to change.

Acceptable reasons for a larger file:

- a tightly coupled domain contract where splitting would obscure invariants;
- a repository adapter whose methods share mapping helpers and transaction context;
- a CLI command that owns one command surface and its local parsers.

Smells:

- one file mixes parsing, validation, DB writes, rendering, and policy;
- a file owns multiple unrelated command surfaces;
- a file has many exported helpers with no clear public boundary;
- a file grows because new behavior is appended instead of extracting a real domain unit;
- tests require importing private implementation details to prove behavior.

QG-04 must audit large files and decide whether they are justified or should be split.

## Monolith Boundaries

KRN is a monorepo, not a monolith.

- `packages/core` owns pure domain types/helpers.
- `packages/schema` owns IO validation.
- `packages/harness` owns orchestration, selection, activation, audit, and gates.
- `packages/db` owns persistence.
- `packages/cli` owns terminal/env/filesystem adapters.
- `packages/codex-adapter` owns Codex-facing rendering.
- `packages/workers` owns bounded job contracts until runtime worker behavior is explicitly accepted.

Do not collapse these boundaries for convenience. If a function needs DB and CLI and domain policy at once, the design is probably hiding an adapter seam.

## Abstractions

Add an abstraction only when it removes real duplication, protects a boundary, or makes an invariant easier to enforce.

Do not add abstractions for:

- future flexibility without a current consumer;
- naming taste only;
- hiding a large function without reducing responsibility;
- making tests easier by bypassing the real behavior.

## Exports

Public exports are product surface.

- Package `index.ts` files must be reviewed as API surfaces.
- Test helpers and fixtures must not be exported from package barrels.
- Repository internals should not become public API just because another package wants a shortcut.
- Broad barrels are allowed only while QG-03 audits and accepts the exposed surface.

## Tests

Tests should protect behavior and failure modes.

Good tests:

- name the behavior;
- fail before the implementation exists or before the bug is fixed;
- prove a product invariant or package boundary;
- use fixtures as seed/test material, not runtime truth.

Bad tests:

- snapshot broad shapes without behavior proof;
- only assert that a fixture parses;
- encode fake architecture as if it were final behavior;
- require production code to export internals;
- normalize placeholder names or temporary concepts.

## Comments

Use comments sparingly.

Good comments explain:

- a non-obvious invariant;
- why a boundary exists;
- why a deliberately conservative decision was made;
- why a dependency or workaround is accepted.

Avoid comments that restate the code.

## Error Handling

Errors should identify the failed boundary.

- CLI errors should be actionable for the operator.
- Schema/parser errors should name the invalid field or contract.
- Repository errors should distinguish invariant failure from missing data.
- Audit findings should include evidence refs and a concrete recommendation.

## Forbidden Quality Shortcuts

Do not merge:

- zombie exports;
- dead commands;
- placeholder adapters posing as final architecture;
- fake in-memory paths for final memory behavior;
- broad metadata where a typed field is already known;
- file-backed runtime memory;
- hidden chain-of-thought storage;
- dashboard/API/MCP surfaces before their accepted gates.

