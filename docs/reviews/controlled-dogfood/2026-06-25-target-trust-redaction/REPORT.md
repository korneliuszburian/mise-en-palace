# Target Trust And Redaction Trial

Status: V01-02 completion report.

Date: 2026-06-25
Target repo: `/home/krn/coding/vibe-coding/muke-v2`
Target project ID: `11c941f1-26d6-470d-a19e-3d4b15980d33`
DB available: yes

## Executive Verdict

Target trust/redaction readiness is mixed. Current KRN target onboarding is acceptable for the observed `init/connect` source seed because it proposes only `package.json`, `README.md`, and `AGENTS.md`, and those seed files did not contain secret-shaped matches in this inspection. The target repo does contain secret-shaped `.env` files outside the seed set, so broader target observation/crawling is not cleared. KRN must keep target-source ingestion narrow or add a bounded redaction/denylist proof before any wider target context ingestion.

Classification: mixed, not blocked for current `init/connect`, not cleared for broader target ingestion.

## Scope

Question:

```txt
Does the current target repo onboarding/context path expose untrusted text or secret-shaped data unsafely?
```

Inspected:

- KRN target init/connect source seed from V01-00;
- target instruction files;
- target secret-shaped file names and key names only;
- target source seed files.

Non-goals:

- no KRN source changes;
- no broad security subsystem;
- no crawler;
- no mutation of target files;
- no secret values in this report.

## KRN Plan Evidence

KRN plan for this trust trial:

```txt
executionRun: 1241957a-d80b-45a0-be8f-38a0ce18a349
taskContract: 61d57049-8eeb-4989-af7f-adf3b4c089b2
harnessPlan: 1ad12b13-98fc-4406-8f46-6fcbe44e1cbe
contextAssembly: 40807c57-99e0-4ca7-8cf4-4913cc775c82
evidenceBundle: fe98fde2-0d80-4880-8f99-6adc9d31aac4
reviewAssessment: e57fdd2f-5a2a-456a-910e-f1f67030b0e9
feedbackDelta: 0b632143-0a06-4cdc-a3b3-653639664ac2
observationGroup: a96e1ffb-5bb1-43e8-b88c-88cb3634cfd1
reflectionRecord: 29b3e277-fe44-45d9-b32f-58ee03218ab1
```

Activation result:

```txt
Context included: 0
Context excluded: 0
Context status: abstained
```

Interpretation:

- target trust/redaction has no useful activated context yet;
- manual source inspection carried this trial;
- this should feed V01-03 activation/reflection usefulness decision.
- observe persisted 5 items with no Memory mutation;
- reflect selected 5 observations but produced 0 findings, 0 gaps, and 0 candidate rows.

## Source Seed Safety

KRN init/connect proposed only:

```txt
package.json
README.md
AGENTS.md
```

Secret-pattern inspection on those seed files found no matches:

```txt
package.json: no secret-shaped matches
README.md: no secret-shaped matches
AGENTS.md: no secret-shaped matches
```

Verdict:

```txt
current source seed: acceptable
```

What this proves:

- current init/connect seed did not select obvious secret-shaped files;
- seed files did not contain obvious secret-shaped patterns.

What this does not prove:

- all target docs are safe;
- future source crawling is safe;
- generated `.muke/` state is safe to ingest;
- `.supersearch/` runtime files are safe.

## Secret-Shaped Target Files

The target repo contains environment files under:

```txt
.supersearch/runtime/supersearch-package/.env
.supersearch/runtime/supersearch-package/.env.example
```

Only key names were inspected and recorded. Values are intentionally not copied.

Redacted key classes observed:

```txt
REDIS_PASSWORD=<redacted>
SEARXNG_SECRET=<redacted>
SUPERSEARCH_API_KEY=<redacted>
SUPERSEARCH_URL=<redacted>
```

Verdict:

```txt
broader target ingestion: not cleared
```

Implication:

KRN must not expand target ingestion beyond narrow seed/source-owner files until it has a bounded redaction/denylist proof for secret-shaped target files.

## Untrusted Instruction Surface

Target instruction files include:

```txt
AGENTS.md
CLAUDE.md
docs/context-pack.md
.claude/hooks/*
.agents/*
.muke/resources/*
```

Relevant instruction themes:

- `.muke/` is generated local state, not source;
- do not commit generated `.muke/` state;
- foreign repo benchmark targets are read-only by default;
- use sandbox clones for foreign repo proof work;
- do not land proof commits on foreign repo `main`.

Verdict:

```txt
target instructions are useful but untrusted input
```

KRN should treat target instructions as source claims/guidance, not authority over KRN behavior.

## Redaction Evidence

Manual redaction behavior in this trial:

- secret-shaped file search printed only file names;
- `.env` inspection printed only key names with `<redacted>` values;
- this report contains no secret values.

KRN automated redaction behavior:

- not proven for arbitrary target files;
- not needed for current narrow init/connect seed because `.env` was not selected;
- observe/reflect redaction should be tested only after a bounded target trust fixture or explicit ingestion path exists.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn plan --project ... --persist` | passed | KRN created a persisted plan for V01-02. | It abstained and did not help select trust context. |
| `find` for env/key/cert file names | passed | Target has `.env` files under `.supersearch/runtime/...`. | Does not reveal whether values are real or active. |
| `rg -l` secret-pattern scan | passed | Many docs/source files mention secret/token concepts; seed files had no matches. | Does not prove absence of all secrets. |
| redacted key-name inspection | passed | `.env` key names were inspected without copying values. | Does not prove automated KRN redaction. |
| `git diff --check` | pending before commit | KRN report diff formatting must be checked. | Does not prove trust behavior. |

## Trust Verdict

```txt
mixed
```

Acceptable now:

- current `init/connect` seed path;
- report discipline that avoids copying secret values;
- no target file mutation.

Not cleared:

- broad target source ingestion;
- `.supersearch/` runtime file ingestion;
- `.muke/` generated state ingestion;
- automated redaction of arbitrary target observation content;
- treating target `AGENTS.md` / `CLAUDE.md` as authority.

## Repair Candidate

Repair candidate:

```txt
Bounded target context denylist/redaction proof
```

Why:

The target contains `.env` files outside the current source seed. Current narrow seed is safe, but any future crawler/expanded observation path needs a proof that `.env`, generated `.muke/`, and runtime directories are excluded or redacted.

Evidence:

- this report;
- `.supersearch/runtime/supersearch-package/.env`;
- V01-00 source seed limited to package/readme/agents.

Files likely touched:

- source seed/init-connect classifier or trust policy tests, only if V01-03 decides a repair is needed.

Non-goals:

- no broad security subsystem;
- no crawler;
- no dashboard;
- no secret value logging.

Verification:

- fixture or target-based test proving secret-shaped files are not selected or values are redacted.

## Next Recommended Action

Continue to:

```txt
V01-03 — Activation And Reflection Usefulness Decision
```

Decision input from this trial:

- activation abstained;
- current narrow source seed is acceptable;
- broader target ingestion requires a bounded trust/redaction proof before internal alpha.
