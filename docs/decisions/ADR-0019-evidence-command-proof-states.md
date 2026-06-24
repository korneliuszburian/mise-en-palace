# ADR-0019: Evidence Command Proof States

Status: accepted.

Date: 2026-06-24

Decision status: implementation queued by TSQ-00A.

## Context

EVI-00 through EVI-03 repaired command evidence provenance enough to stop weak
default rows from masquerading as real command proof. The current live model is
still an optional-field object:

- `EvidenceCommand.status` is a narrow status union;
- `EvidenceCommand.provenance` is optional;
- `doesNotProve` is optional;
- `exitCode`, `outputPath`, `outputRef`, `capturedAt`, and `assertedBy` are
  optional regardless of provenance;
- `normalizeEvidenceCommand` repairs legacy or incomplete rows into a
  `NormalizedEvidenceCommand`.

That model works as a compatibility layer, but it still allows impossible or
weak states to be expressed before normalization.

## Source Decisions

source_id: Total TypeScript, "Designing Your Types"
url:
https://www.totaltypescript.com/books/total-typescript-essentials/designing-your-types-in-typescript
trust_tier: medium as practitioner TypeScript guidance, not KRN product truth.
mechanism: type design affects maintainability because types communicate
business logic, not only compile-time errors.
krn_implication: command evidence is product epistemology; its types should
communicate which proof state is valid instead of relying on optional fields
plus later interpretation.
decision: adopt the principle for KRN evidence command modeling.
does_not_prove: a discriminated union is automatically the right immediate
diff shape or that every existing call site can change without compatibility
mapping.
consumer: TSQ-00 decision and TSQ-00A implementation slice.
falsifier: the discriminated model makes IO mapping less explicit or hides
legacy row normalization behind casts/metadata.

source_id: Total TypeScript, "Unions, Literals, and Narrowing"
url:
https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing
trust_tier: medium as practitioner TypeScript guidance, not KRN product truth.
mechanism: literal unions restrict valid values, and narrowing moves code from
wide states to more specific states.
krn_implication: evidence command rows should narrow by provenance/kind so
fields like `outputRef`, `assertedBy`, and weak default semantics are tied to
the proof state.
decision: adopt discriminated proof-state modeling for `EvidenceCommand`.
does_not_prove: runtime command execution, DB readiness, Memory Brain quality,
or source truth.
consumer: core/schema evidence command types.
falsifier: code still accepts `passed` + `default_template` as a valid final
command proof state after TSQ-00A.

source_id: `docs/standards/typescript-excellence.md`
trust_tier: high repo standard.
mechanism: KRN standard says state-dependent shapes use narrow unions or
discriminated unions, public surfaces use explicit exported types, and external
data stays `unknown` until validated.
krn_implication: `EvidenceCommand` is a public core/schema/CLI/DB boundary with
state-dependent valid fields, so the final model should be discriminated while
schema and DB mappers preserve explicit validation.
decision: adopt.
does_not_prove: a whole-repo TypeScript cleanup is allowed in this slice.
consumer: TSQ-00A implementation constraints.
falsifier: implementation adds `any`, double assertions, unchecked JSON, or a
large unrelated type cleanup.

source_id: `packages/core/src/evidenceBundle.ts`,
`packages/schema/src/evidenceCapture.ts`,
`packages/cli/src/parseEvidenceArgs.ts`,
`packages/cli/src/runEvidenceCaptureCommand.ts`,
`packages/db/src/repositories/DrizzleHarnessRunRepository.test.ts`
trust_tier: high live source.
mechanism: core currently accepts optional provenance/limit fields and
normalizes them; schema permits optional provenance/doesNotProve; CLI creates
operator-reported and default-template rows; DB tests prove normalization
before persistence.
krn_implication: compatibility normalization must remain, but the normalized
domain shape should stop being optional object soup.
decision: adopt a small follow-up implementation slice.
does_not_prove: persisted historical rows already satisfy the final
discriminated shape without mapping.
consumer: TSQ-00A.
falsifier: TSQ-00A requires a DB migration or breaks historical EvidenceBundle
JSON readback.

## Decision

Adopt a discriminated evidence command proof-state model.

The implementation slice should:

- keep a loose/legacy input parser shape for external IO and persisted JSON;
- normalize legacy rows through a mapper at schema/DB/CLI boundaries;
- make the normalized core command proof type discriminated by proof state;
- require `doesNotProve` on normalized/final command rows;
- prevent `passed` / `failed` rows from using `default_template` provenance as
  final proof;
- keep default-template rows visibly weak;
- preserve current CLI and DB behavior through compatibility mapping;
- avoid a DB migration unless current JSON storage cannot preserve the mapped
  shape.

Suggested final direction:

```ts
type EvidenceCommandProof =
  | {
      kind: "default_template";
      command: string;
      status: "not_run" | "skipped";
      provenance: "default_template";
      doesNotProve: string;
    }
  | {
      kind: "operator_reported";
      command: string;
      status: "passed" | "failed" | "skipped" | "missing" | "not_run";
      provenance: "operator_reported";
      assertedBy?: string;
      capturedAt?: string;
      exitCode?: number;
      doesNotProve: string;
    }
  | {
      kind: "captured_output_file";
      command: string;
      status: "passed" | "failed" | "skipped" | "missing" | "not_run";
      provenance: "captured_output_file";
      outputRef: string;
      outputPath?: string;
      capturedAt?: string;
      exitCode?: number;
      doesNotProve: string;
    }
  | {
      kind: "command_runner";
      command: string;
      status: "passed" | "failed";
      provenance: "command_runner";
      exitCode: number;
      capturedAt: string;
      outputRef?: string;
      doesNotProve: string;
    }
  | {
      kind: "external_log";
      command: string;
      status: "passed" | "failed" | "skipped" | "missing" | "not_run";
      provenance: "external_log";
      outputRef: string;
      capturedAt?: string;
      doesNotProve: string;
    };
```

Exact naming may change in TSQ-00A if it better matches existing local code.
The invariant is the important part: proof state controls valid fields.

## Rejections

- Keep the current optional object as final domain truth: rejected because it
  still allows invalid combinations before normalization.
- Convert every evidence/review type in one sweep: rejected as broad cleanup.
- Rewrite historical EvidenceBundle rows: rejected because compatibility
  mapping is enough unless a live readback falsifier appears.
- Add `ts-reset`: rejected for core/schema/public APIs by the repo TypeScript
  standard.
- Add hidden command execution: rejected by Evidence Integrity boundaries.

## Rollback

Revert TSQ-00 and TSQ-00A commits if the discriminated model creates more
authority ambiguity than it removes. If TSQ-00A touches only JSON shape mapping,
rollback should be source-only; do not mutate historical EvidenceBundle rows
unless a later migration explicitly requires it.

## Verification

TSQ-00A is upheld when:

- core exposes a discriminated normalized command proof type;
- schema accepts legacy/loose input as unknown and parses/narrows it into the
  final model;
- CLI `--verification` still records operator-reported outcomes;
- default evidence rows still render weak `default_template` semantics;
- DB persistence round-trips both historical loose rows and normalized proof
  rows without a migration unless proven necessary;
- focused core/schema/CLI/DB tests pass;
- `pnpm typecheck` passes;
- no `any`, double assertion, or unchecked JSON parse is introduced.
