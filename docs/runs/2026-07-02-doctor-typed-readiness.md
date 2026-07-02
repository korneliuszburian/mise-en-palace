# Doctor Typed Readiness Outcomes

Date: 2026-07-02.

Beads issue: `mise-en-palace-fhus`.

## Decision

Doctor checks now support optional typed `outcome` and `severity` fields.

`runDoctorCommand` failure policy prefers `severity: "failure"` over legacy
status-string matching, while preserving legacy fallback for checks that are not
typed yet.

This slice types the audited DB/static/readiness surfaces that were using
display wording as control flow:

- Postgres config / pgvector / migrations outputs;
- Codex adapter static checks;
- worker job static checks;
- target-repo static checks;
- Codex adapter, worker job, and target-repo readiness derivation.

## Source To Decision

```txt
source:
  audit finding: runDoctorCommand/doctorReadiness used display status strings
  and prefix matching as control flow for readiness and failure policy.

mechanism:
  changing human-facing wording can accidentally change exit code or readiness
  behavior when logic reads labels/status text directly.

KRN implication:
  doctor output is an operator trust surface. Its policy should be typed and
  inspectable, while stdout remains stable for humans and scripts.

decision:
  add optional DoctorCheck.outcome/severity; type the highest-risk audited
  checks first; keep legacy fallback for untouched checks.

consumer:
  `krn doctor`, doctor readiness tests, CI smoke/readiness reporting, future
  audit-hardening slices.

falsifier:
  tests pass fixtures with changed display wording but stable typed outcomes;
  readiness and failure policy must remain unchanged.
```

## Changed Files

- `packages/cli/src/runDoctorCommand.ts`
  - adds `DoctorOutcome`, `DoctorSeverity`, optional fields on `DoctorCheck`,
    and `hasDoctorFailure`.
- `packages/cli/src/doctorDbChecks.ts`
  - adds typed outcomes/severities to `checkPostgres` outputs.
- `packages/cli/src/doctorStaticChecks.ts`
  - adds typed outcomes/severities to Codex adapter, worker job, and target repo
    checks.
- `packages/cli/src/doctorReadiness.ts`
  - derives Codex adapter, worker job, and target repo readiness from typed
    outcomes with legacy fallback.
- CLI tests
  - prove typed severity overrides legacy failure wording;
  - prove readiness survives display wording changes;
  - prove typed fields are emitted for audited checks.

## Proof

Focused checks:

```bash
rtk proxy pnpm --filter @krn/cli typecheck
rtk pnpm --filter @krn/cli test -- doctorDbChecks doctorStaticChecks doctorReadiness runDoctorCommand runCli
```

Workspace checks:

```bash
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk pnpm --filter @krn/cli krn doctor
rtk git diff --check
```

Result highlights:

```txt
CLI typecheck: passed
CLI focused tests: 42 files / 328 tests passed
workspace typecheck: passed
workspace tests: 133 files / 769 tests passed
Fallow changed-files audit: passed
brain-battle smoke: passed
krn doctor: passed in preview/no-DB mode
git diff --check: passed
```

## Non-Proof

This does not remove every legacy status-string rule in doctor code. Untyped
checks still use the existing fallback rules.

This does not refactor the CLI command registry, replace static source-file
sniffing with imports, change stdout wording, add DB runtime proof for Codex
adapter, implement worker runtime behavior, or change DB schema.

## Next Slice Candidates

- `mise-en-palace-m4bh`: centralize deterministic smoke fixture clocks and make
  stale memory exclusion proof explicit.
- `mise-en-palace-97a8`: replace Codex adapter smoke literal-string proof with
  typed skillBindingHints/patternRefs proof and add runtime-proof readiness.
- `mise-en-palace-58l0`: type source relation metadata readbacks.
