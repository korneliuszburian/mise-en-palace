# Security reporting

KRN is an internal technical alpha for bounded technical operators. It is not
a production deployment, public service, or externally supported release.

Report suspected vulnerabilities privately. Prefer a GitHub Security Advisory
for `korneliuszburian/mise-en-palace` when that repository feature is enabled.
If it is unavailable, contact the repository owner through a private channel;
do not open a public issue or publish exploit details.

The repository owner will triage the report, confirm whether it is in scope,
and coordinate remediation or mitigation. This internal alpha has no public
response or remediation SLA. Please include the affected commit or version,
reproduction steps, impact, and any safe mitigation when reporting.

Security-sensitive changes are owned by `@korneliuszburian` through
`.github/CODEOWNERS`. This policy does not promise production security,
external release readiness, or a security guarantee for downstream use.

The staged CI security gate runs a high/critical dependency audit, tracked-file
secret-pattern scan, and dependency license allowlist. Scanner startup,
network, parse, and policy failures are blocking failures; the workflow does
not treat an unavailable scanner as a pass. The current internal-alpha license
allowlist is MIT, Apache-2.0, BSD-3-Clause, ISC, MPL-2.0, and Unlicense.
SBOM generation remains reserved for a future explicit release boundary.
