# Release boundary

KRN is currently a private internal alpha. The root and source packages remain
private `0.0.0` contracts, so `pnpm release:check` and package publish hooks
must fail with an internal-alpha message. No package is described as stable or
externally supported.

Before an explicit public-release decision, the owner must separately review:

- compiled artifacts and package `exports` rather than publishing TypeScript
  source contracts;
- supported Node and pnpm versions, semver policy, migration and upgrade
  compatibility, and rollback expectations;
- an explicit license grant and security/reporting posture;
- dependency and source SBOM/provenance requirements;
- package ownership, changelog, support boundary, and reproducible release
  evidence.

This document is a release checklist, not a promise that a future release is
compatible or production-ready. The current guard intentionally adds no
registry, build, signing, or release automation.
