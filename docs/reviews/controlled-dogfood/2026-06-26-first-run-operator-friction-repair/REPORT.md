# First-Run Operator Friction Repair Report

Status: V03-05 complete.

Date: 2026-06-26.

## Executive Verdict

V03-05 reduces first-run ambiguity before a real second-operator trial. The
doctor target readiness status now names what the target harness actually
guards after V03: source seeds, owner files, evidence readback, and memory
usefulness. The local DB and second-operator runbooks now tell operators to run
the init-connect and target harness smokes before claiming target-readiness.

No new product surface was added.

## Scope

Changed:

- `packages/cli/src/doctorReadiness.ts`
- `packages/cli/src/runCli.test.ts`
- `docs/runbooks/local-brain-store.md`
- `docs/runbooks/second-operator-alpha-trial.md`
- `PLAN.md`
- `GOAL.md`

Not changed:

- package distribution;
- alpha tag;
- dashboard/API/MCP/worker runtime;
- target repo execution behavior;
- DB schema.

## Behavior Added

`krn doctor` target readiness now reports:

```txt
ready (init-connect and target harness smokes proven; source seeds, owner files, evidence readback, and memory usefulness guarded)
```

The runbooks now include:

```sh
pnpm db:smoke:init-connect
pnpm db:smoke:target-repo-harness
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn doctor
```

The second-operator packet also states that the target harness smoke remains
local fixture proof and does not complete the real target repo trial.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- runCli` | passed | CLI doctor readiness expectations match the clearer target readiness message. | Does not prove live DB runtime. |
| `pnpm typecheck` through `rtk proxy` | passed | Workspace TypeScript compiles after the doctor wording change. | Does not prove operator UX quality. |
| `pnpm test` | passed | Workspace tests still pass after the first-run readiness wording and runbook edits. | Does not prove a real second-operator trial. |
| `pnpm eval:brain-battle:smoke` | passed | Existing golden behavior smoke remains wired after the docs/operator change. | Does not prove product readiness. |
| `pnpm eval:promptfoo:smoke` | passed | Promptfoo smoke still passes 2/2 cases; shutdown logged the known telemetry timeout after writing output. | Does not execute the full KRN brain behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic correctness. |

## Product Impact

Before this slice, a technical operator could see target repo readiness as
“target repo harness smoke proven” without knowing what that smoke actually
covered.

After this slice, the readiness wording and runbooks point to the exact
preflight proof commands and clarify the local-fixture proof boundary.

## What This Does Not Prove

- A real second-operator trial.
- Product readiness.
- npm/global install readiness.
- External target repo behavior.
- Hosted CI or another operator's DB state.

## Next Recommended Action

Continue to V03-06:

```txt
Controlled Alpha Re-Gate After V03
```

V03 now has DB recovery, target fixture, owner-file recall, target
evidence/readback, memory usefulness, and first-run guidance evidence. The next
step is an honest readiness decision.
