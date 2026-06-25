# ADR-0027: Internal Alpha Source Workspace Packaging

Status: accepted.

## Decision

Adopt a git-tagged pnpm source workspace as the first internal-alpha
distribution format.

The internal-alpha operator install path is:

```sh
git clone https://github.com/korneliuszburian/mise-en-palace.git
cd mise-en-palace
git checkout v0.1.0-alpha.0
pnpm install --frozen-lockfile
pnpm alpha:verify
pnpm krn doctor
```

KRN packages remain `private: true` for this alpha. No npm publishing, package
registry, global binary install, generated dist output, dashboard, API, MCP
server, worker daemon, or plugin package is adopted by this decision.

## Source To Decision

```yaml
source_id: package-surfaces
title: docs/architecture/package-surfaces.md
trust_tier: high
mechanism: Root package entrypoints carry authority and should expose stable
  contracts rather than internal smokes, adapters, command runners, or table
  modules.
krn_implication: Internal-alpha distribution should not turn every workspace
  package into a public npm API before package surfaces are release-hardened.
decision: keep packages private and distribute by git tag plus pnpm workspace.
does_not_prove: package surfaces are ready for npm publication.
consumer: G-02 install runbook and release notes.
falsifier: normal operator workflow requires importing internal package paths or
  running command implementation files directly.
```

```yaml
source_id: g-00-ci
title: G-00 CI Verification Pipeline
trust_tier: high
mechanism: GitHub Actions runs typecheck, tests, Promptfoo smoke, DB readiness,
  Drizzle check, DB smoke, and diff check on pushed commits.
krn_implication: Internal-alpha tags can point to a commit with remote
  verification instead of relying only on local shell state.
decision: require a green CI run for the tag target commit.
does_not_prove: production deployment or target-repo product readiness.
consumer: release notes and G-03 internal-alpha release gate.
falsifier: tag target commit has failing CI.
```

```yaml
source_id: g-01-backup-policy
title: G-01 Migration And Backup Policy
trust_tier: high
mechanism: The local brain store has a documented pg_dump/pg_restore scratch
  replay policy before risky migration work.
krn_implication: Internal-alpha packaging can require DB backup/restore policy
  as a prerequisite without adding backup automation.
decision: reference G-01 as an alpha limitation and operator prerequisite.
does_not_prove: hosted production disaster recovery.
consumer: internal-alpha install runbook and release notes.
falsifier: operator cannot verify local DB backup/restore before stateful alpha
  trials.
```

## Accepted Boundary

- Distribution format: git tag plus pnpm workspace.
- First internal version tag: `v0.1.0-alpha.0`.
- Operator command: `pnpm krn ...`.
- Verification command: `pnpm alpha:verify`.
- CLI implementation remains owned by `@krn/cli`.
- Normal operator workflow should not require:
  - `pnpm --filter @krn/cli krn`;
  - direct `tsx packages/cli/src/index.ts`;
  - internal package imports;
  - generated dist files.

## Rejected Or Deferred

| Option | Decision | Reason |
| --- | --- | --- |
| Publish npm packages now | rejected now | Package surfaces are narrowed but not release-hardened for external consumers. |
| Global `krn` binary install | deferred | Requires build/bin packaging and install UX not yet proven. |
| Generated `dist/` package output | deferred | Current workspace is source/tsx-based; no build pipeline exists yet. |
| Docker image distribution | deferred | Would add deployment/runtime surface before internal-alpha target proof. |
| Plugin package | rejected now | README and roadmap explicitly defer plugin packaging. |
| API/MCP/dashboard | rejected now | G-02 is packaging/versioning only. |

## Release Tag Policy

Internal-alpha tags use:

```txt
vMAJOR.MINOR.PATCH-alpha.N
```

Rules:

1. Tag only clean commits on `main`.
2. Tag only after CI is green or record why the tag is not releasable.
3. Release notes must name:
   - install command;
   - verification command;
   - known limitations;
   - what the tag proves;
   - what the tag does not prove.
4. Do not call a tag product-ready.

## Verification

G-02 must verify:

```sh
pnpm install --frozen-lockfile
pnpm krn doctor
pnpm alpha:verify
pnpm typecheck
pnpm test
git diff --check
```

Clean clone verification is preferred. If a separate clean clone is not
available in the current shell, the report must say so and use a local
workspace verification only.

## Rollback

Rollback is:

1. delete the internal-alpha git tag if it points to a bad commit and has not
   been consumed;
2. create a corrective tag if the tag was already consumed;
3. revert the focused packaging commit if `pnpm krn` or `pnpm alpha:verify`
   regresses;
4. keep packages private until a later packaging task proves npm readiness.

## Falsifier

Revisit this ADR if:

- a clean checkout cannot run `pnpm krn doctor`;
- operators need internal package paths for normal use;
- target-repo trials require a global binary or package registry install;
- CI cannot verify the tag target commit;
- package root surfaces are not stable enough for the claimed operator flow.
