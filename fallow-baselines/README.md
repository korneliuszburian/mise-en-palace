# Fallow debt budget

These category baselines are the reviewed static-analysis debt budget for the
internal alpha. They were generated with Fallow `2.103.0` (schema version `7`)
and must be regenerated only in a dedicated, reviewed Beads change.

- `dead-code.json` tracks dead-code identities; the current baseline is empty.
- `health.json` tracks known complexity/CRAP identities by path and category.
- `dupes.json` tracks clone identities in the current changed-file scope; the
  current scope has no clone group.

`pnpm quality:fallow:ci` compares the changed files against all three files and
fails on a new identity. Baseline growth is not an approval signal: updating a
baseline requires an owner-reviewed reason, a Beads note with proves and
does-not-prove, and a focused remediation or follow-up issue. No aggregate
Fallow score is used as a release or product-readiness gate.

The intentional `.fallowrc.json` ignore patterns are limited to disposable
`.local-lab` output, archived `docs/materials`, test fixtures, and explicit
`*.typecheck.ts` proof files. They are not runtime source and remain visible in
their owning tests or verification commands. The repository owner
`@korneliuszburian` owns this policy through `.github/CODEOWNERS`.
