# Naming Hygiene Audit

Date: 2026-07-04
Bead: `mise-en-palace-fg6o`

## Summary

Ran a targeted audit for ambiguous `final`, `new`, and `normalized`
vocabulary. This slice applies only low-risk internal renames and rejects broad
search-and-replace.

## Renamed

- `NewRunEvent` -> `RunEventInput`
  - Why: the type is an input payload for recording a run event; `new` did not
    describe the domain role.
  - Files: `packages/harness/src/repositories/types.ts`,
    `packages/harness/src/repositories/harnessRunRepository.ts`.
- `normalizedIntendedFiles` -> `canonicalIntendedFiles`
  - Why: the value is the canonical set used for changed-file classification;
    the old name described an implementation step.
  - File: `packages/cli/src/runEvidenceCaptureCommand.ts`.

## Rejected

- `NormalizedEvidenceCommand`: kept. It is a domain type representing the
  persisted/readback command shape after evidence-command normalization.
- `normalizedIntent`: kept. It is a persisted DB column and repository contract;
  renaming it needs a migration/API slice, not naming hygiene.
- `final response` and `final ranking quality`: kept. These are prose proof
  boundaries, not misleading code symbols.
- `new Date`, `new Set`, `new Map`, and test fixture ids such as
  `source-claim-new`: kept as language constructs or local fixture data.

## Non-Proof

This does not prove the entire repository vocabulary is ideal. It proves one
bounded cleanup pass removed two ambiguous internal names and avoided behavior
or migration churn.

## Verification

```sh
rg -n "NewRunEvent|normalizedIntendedFiles|canonicalIntendedFiles|RunEventInput" packages
```
