# Activation And Reflection Usefulness Decision

Status: V01-03 completion report.

Date: 2026-06-25
Decision run: `482db4e8-5575-4e45-8b8d-25736060c817`
Evidence bundle: `c8e3431c-8863-481b-b599-4542f9d06d91`
Observation group: `d6f255cf-37ed-4c09-ac7a-55e47fee01ea`
Reflection record: `865f46d3-bf02-4405-a2dc-719315d65eb5`
DB available: yes

## Executive Verdict

Open one bounded repair before internal-alpha re-gate:

```txt
V01-R01 — Trust-Aware Target Activation Read Model Repair
```

Reason: V01-00 and V01-02 show the same release-relevant weakness. KRN can install, connect, plan, capture evidence, and guide bounded work, but target-project activation/read-model support is not yet good enough. It either selected a non-target owner file or abstained entirely, and it did not surface target trust exclusions for secret-shaped files. Reflection remains weak, but it is not the first repair because activation/trust determines what context enters the run before reflection can add value.

Decision: repair target activation/read-model first; defer reflection rewrite.

## Evidence Reviewed

| Run | Evidence | Activation | Reflection | Readiness implication |
| --- | --- | --- | --- | --- |
| V01-00 external target trial | `docs/reviews/controlled-dogfood/2026-06-25-external-target-muke-v2/REPORT.md` | Project-scoped activation selected a KRN DB-readiness owner-file item instead of `muke-v2` owner files. | Persisted record, 0 selected observations, 0 findings. | KRN workflow useful; target owner-file recall weak. |
| V01-01 operator handoff | `docs/reviews/controlled-dogfood/2026-06-25-operator-beyond-author/REPORT.md` | General KRN guardrails selected; not target-specific. | Selected 5 observations, 0 findings/candidates. | Install/runbook mixed positive; not a target context proof. |
| V01-02 trust/redaction | `docs/reviews/controlled-dogfood/2026-06-25-target-trust-redaction/REPORT.md` | Project-scoped activation abstained completely. | Selected 5 observations, 0 findings/candidates. | Current seed safe, broader target ingestion not cleared. |

## What Activation Did Well

- Preserved KRN-level guardrails in global planning.
- Did not force context when project-scoped trust context was absent.
- Kept Memory Core mutation out of all V01 runs.

## What Activation Failed To Do

- Did not surface `muke-v2` owner files for the eval repair in V01-00.
- Selected a stale/mismatched KRN owner-file recall item during a target project plan.
- Abstained for target trust/redaction in V01-02.
- Did not expose trust-aware target exclusions such as `.env`, generated `.muke/`, or runtime `.supersearch/` paths.

## What Reflection Did Well

- Persisted records without Memory Core mutation.
- Did not invent candidate rows from weak evidence.

## What Reflection Failed To Do

- Produced no useful findings/gaps/candidates across V01-00, V01-01, and V01-02.
- Did not turn the target trust caveat into a reviewable candidate by itself.

Reflection is still weak, but the safer sequence is:

```txt
first repair target context/read-model quality,
then judge reflection on better selected observations.
```

## Trust / Redaction Decision

V01-02 found:

- current `init/connect` seed is safe enough for `package.json`, `README.md`, `AGENTS.md`;
- target repo contains secret-shaped `.env` files under `.supersearch/runtime/...`;
- broad target ingestion is not cleared.

This should be handled by the same bounded repair as activation because target activation/read-model should know which target paths are allowed, excluded, or redacted before planning uses them.

## Selected Next Repair

```txt
V01-R01 — Trust-Aware Target Activation Read Model Repair
```

Objective:

Make project-scoped KRN planning surface target-repo owner-file/read-model candidates and explicit trust exclusions for target repos, without building a crawler or broad security subsystem.

Minimum behavior:

- target project planning can surface target repo source candidates derived from init/connect seed, package scripts, and small repo file inventory;
- project-scoped activation must not select stale KRN owner-file recall items as if they were target files;
- target trust exclusions must identify `.env*`, generated `.muke/`, `.git/`, `node_modules/`, dist/build output, and runtime directories such as `.supersearch/runtime/`;
- when no target owner files are safe or indexed, activation should abstain with a reason that names the missing target read model.

Non-goals:

- no source crawler;
- no dashboard;
- no MCP/API;
- no worker daemon;
- no broad security subsystem;
- no activation scoring rewrite unless the read-model repair proves insufficient;
- no reflection extraction rewrite;
- no automatic memory/source mutation.

Verification:

- focused activation/init-connect/read-model tests;
- target project dogfood plan against `muke-v2`;
- `pnpm typecheck`;
- `pnpm test`;
- `git diff --check`;
- DB-backed evidence capture/observe/reflect.

## Rejected Alternatives

### Repair Reflection First

Rejected for now. Reflection output is weak, but improving reflection before better target context is likely to produce cleaner ledger entries over poor inputs.

### Proceed Directly To Internal Alpha Re-Gate

Rejected. V01-00/V01-02 show enough target activation/trust weakness that a re-gate would still defer.

### Build A Broad Security Layer

Rejected. The observed need is a bounded target read-model/trust exclusion proof, not a general security product.

### Run Another Target Trial First

Rejected for now. The same target-read-model issue already appeared in V01-00 and V01-02; another trial would likely rediscover the same gap.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn plan --task ... --persist` | passed | KRN created a persisted decision run. | Does not prove the selected repair will work. |
| V01 report review | passed | Decision is grounded in V01-00/V01-01/V01-02 artifacts. | Does not prove target activation is fixed. |
| `krn evidence capture --persist` | passed | Decision evidence was persisted with command provenance. | Does not prove product readiness. |
| `krn observe --persist` / `krn reflect --persist` | passed | Run ledger persisted without Memory mutation. | Reflection selected 0 observations and produced no candidates. |
| `git diff --check` | pending before commit | Formatting verification must pass before commit. | Does not prove product readiness. |

## Next Recommended Action

Run:

```txt
V01-R01 — Trust-Aware Target Activation Read Model Repair
```

Only after that repair should KRN proceed to `V01-04 — Internal Alpha Re-Gate`.
