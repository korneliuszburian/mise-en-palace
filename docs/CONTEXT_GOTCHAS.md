# KRN Operational Gotchas

This is the expanding, repo-local reference behind the concise index in
`CONTEXT.md`. It records repeatable traps, their safe response, and the proof
boundary. It is workflow context, not runtime memory, a research archive, or a
second task tracker.

## How to use and maintain this file

Read the section matching the workflow before acting. Each entry has four
parts: trigger, safe action, evidence/non-proof, and retirement condition.

Promote a gotcha here when the same assumption fails twice or when it invalidates
a gate, an artifact, or a publication claim. Add only the smallest durable rule
and link the evidence; keep task state in Beads. Retire or rewrite an entry when
current code and a focused verification show that the trigger no longer exists.

## Live Codex auth and invocation

**Trigger:** A live trial fails authentication, or a trial is launched from an
isolated profile.

**Safe action:** Use the currently active Codex profile (`CODEX_HOME` when set,
otherwise `$HOME/.codex`) through `KRN_TRIAL_CODEX_HOME`. Do not use an old
fixture snapshot such as a prior `native-auth-preflight/auth.json` as evidence
of current authorization. If the wrapper changes behavior, verify the direct
vendor binary and record which invocation was used.

**Evidence / non-proof:** The 2026-07-19 rerun with a stale copied snapshot
returned `401 token_invalidated` and `refresh_token_revoked`; the subsequent
run with `/home/krn/.codex/auth.json` reached both Codex processes. This proves
the snapshot was stale for that run, not that future OAuth is valid.

**Retirement:** Replace this entry only after the runner obtains auth from one
canonical active profile and a focused preflight proves the profile is current.

## Retained fixture lifecycle

**Trigger:** A paired trial needs a persistent run and packet after the normal
smoke cleanup has completed.

**Safe action:** Generate an explicitly retained fixture, capture artifacts,
persist evidence-bearing trials, and run `eval:paired-live:cleanup-retained`
with `--require-persisted <manifest.json> <attempt-directory> <fixture-report.json>`.
Use `--disposable <fixture-report.json>` only for explicit no-quality
harness-debug fixtures. Verify `remainingRows=0`, persisted eval-evidence
readback before and after cleanup, and unchanged unrelated project counts.
Never use manual SQL as the normal lifecycle and never confuse retained state
with runtime memory.

**Evidence / non-proof:** The guarded cleanup preserved unrelated projects
(`87 -> 88 -> 87`) and reported zero remaining owned rows. This proves cleanup
containment for that fixture shape, not every future schema migration.

**Retirement:** Retire only when the default runner itself has an equivalent,
verified retention/cleanup path and the separate command is no longer needed.

## Explicit capability overrides

**Trigger:** A matched Codex trial assigns MCP servers or skills per arm.

**Safe action:** Materialize the preregistered profile for audit identity, but
also pass its MCP and skill configuration as explicit `--config` overrides to
the pinned Codex invocation. Falsify baseline leakage and KRN exposure before a
quality run, then require structured capability-use events in the artifact.

**Evidence / non-proof:** The 2026-07-19 combined replication profile named a
KRN MCP server and skill, yet the live arm exposed neither and the artifact was
correctly invalid. Rendering the same manifest as explicit overrides produced
zero MCP servers for baseline and exactly `krn_decision_packet` for KRN. This
proves configuration exposure at the CLI boundary, not model use or quality.

**Retirement:** Retire when the pinned Codex profile path is itself observed to
load arm capabilities and a focused regression signal rejects missing or
leaked capability configuration.

## Hermetic fixture dependencies

**Trigger:** A tracked paired-live source declares test or typecheck commands
that depend on a package binary not contained as regular files in the source
tree.

**Safe action:** Materialize the exact dependency version before hashing and
running the trial, with every required file physically contained in the source
tree. Package-manager symlinks are not valid trial inputs. Treat a missing tool
or rejected symlink as fixture preparation failure, preserve its chronology,
and exclude the attempt from quality scoring.

**Evidence / non-proof:** The 2026-07-19 async-job attempt first reached both
arms but failed their public commands because `tsc` was absent. Installing it
through pnpm then failed preflight because `node_modules/typescript` was a
symlink. Dereferencing the same pinned TypeScript dependency produced a valid
matched trial. This proves the fixture requirement for the current runner, not
that installed dependencies are trustworthy or that either arm has higher
quality.

**Retirement:** Retire when fixture preparation owns dependency materialization
and a focused preflight rejects missing or linked tools before launching either
Codex arm.

## Trial interpretation

**Trigger:** A tracked artifact is `invalid`, `blocked`, or `unverified`, or an
arm lacks obedience/capability/application evidence.

**Safe action:** Preserve the exact status and reasons. Do not map missing
obedience, missing capability events, packet failure, auth failure, or checker
preflight failure to `win`, `tie`, or `loss`. Only the held-out checker may
produce a quality outcome after all required prerequisites pass.

**Evidence / non-proof:** The retained semantic/procedural runs reached Codex
but emitted no bounded obedience JSON; they were invalid and yielded no quality
outcome. The later current-profile run showed capability events for the KRN arm
but remained invalid because the obedience envelope was missing. This proves
the fail-closed boundary, not memory usefulness.

**Retirement:** Retire only if the artifact model and aggregation contract no
longer allow these prerequisite failures to be confused with quality outcomes,
with focused tests proving the distinction.

## First trial versus rerun

**Trigger:** A previously attempted trial is debugged, repeated, or executed
with a changed harness/profile.

**Safe action:** Name it as the original trial, a rerun, or a harness
falsification. Keep chronology and artifact identity explicit. Do not call a
rerun the “first real trial” merely because it is the first run after a code
change.

**Evidence / non-proof:** Earlier live attempts already exercised the paired
trial path; later runs changed fixture retention, auth source, and obedience
classification. They are useful diagnostics but do not create a new product
milestone or a quality result.

**Retirement:** Retire only when the experiment ledger records immutable trial
identity and automatically labels reruns and preflight attempts.

## Trial readback

**Trigger:** A paired-live eval family, checker revision, artifact schema, or
evidence field changes.

**Safe action:** Update the public aggregate and persistence readbacks in the
same slice or create an explicit blocking follow-up before using the result as
frontier evidence. Aggregate readback must include every supported eval family.
Persistence must prefer an artifact's exact `checkerRevision` over legacy
artifact-kind fallbacks. Run the aggregate command against at least one current
artifact when the changed surface is a trial result readback.

**Evidence / non-proof:** The 2026-07-19 temporal-policy-drift checker-v3 win
exposed two stale readback paths: aggregate omitted the new family until
8f2181f3, and persistence would have collapsed the exact checker-v3 identity to
the artifact-kind v2 fallback until 0287e03a. These fixes prove those readback
surfaces now preserve the temporal family and checker revision for the observed
shape; they do not prove causal KRN advantage, product readiness, source truth,
or future artifact schema coverage.

**Retirement:** Retire only when supported eval families and checker identities
are derived from one schema-owned source and a focused test fails whenever a
new family or checker revision is missing from aggregate or persistence
readback.

## Entrypoint arguments

**Trigger:** A script receives a path named `--`, or a command behaves
differently when invoked through `pnpm` versus its direct package entrypoint.

**Safe action:** Inspect `process.argv` at the real entrypoint and use the direct
package command while diagnosing. Add explicit `--` normalization only to the
owned entrypoint that needs it; do not treat argument forwarding as a Memory
Core behavior failure. For tracked paired-live attempts, pass an absolute
attempt directory or run the local `tsx` entrypoint from the repository root:
package-scoped `pnpm exec` can leave relative attempt paths under the package
cwd and fail before packet fetch or live Codex execution.

**Evidence / non-proof:** The retained fixture prepare/cleanup entrypoints
normalize pnpm's separator; the tracked runner currently requires direct
entrypoint invocation for the same reason. The 2026-07-19 async-job durable
trial produced two pre-live blocked artifacts when the attempt path was parsed
or resolved through the package invocation; the absolute-path retry produced a
valid quality trial. This proves an invocation gotcha, not a need for a broad
command wrapper and not a Memory Core quality result.

**Retirement:** Retire after every supported package entrypoint has one focused
argument-forwarding proof and no path can be interpreted as the separator.

## Sandboxed capability paths

**Trigger:** A Codex trial arm should use a repo-local MCP server, skill, or
other capability path while the arm runs inside `bwrap` with `--tmpfs /tmp`, or
structured capability evidence is missing even though the prompt configured the
capability.

**Safe action:** Materialize the capability inside the bound sandbox root before
launching Codex. For the DecisionPacket MCP server, write a self-contained
read-only stdio server into the sandbox and mark it `required = true` so startup
fails closed when the command is invisible. For project-local skills, copy the
skill directory under the sandbox `CODEX_HOME/skills/<skill>/SKILL.md` and pass
that materialized path through explicit per-arm config. Count capability use
only from structured Codex JSONL events: configured MCP tool calls or actual
`command_execution` reads of the materialized skill file/reference path, not
prose claims.

**Evidence / non-proof:** The 2026-07-19 retained combined-capability trial
first exposed a hidden `/tmp` worktree path when `required = true` caused the
KRN arm to fail with `No such file or directory` for the repo-local MCP command.
After sandbox materialization, final fresh run
`fdf0174e-0a19-4605-8994-02eb9c97974c` passed checker-v3 with KRN outcome
`win`, baseline configured events `0/0`, KRN configured events `2` MCP and `2`
skill reads, valid obedience, observed decision application, persisted
paired-live evidence `0a9b958a-c443-404d-ac6c-5a97cbfcf70f`, and guarded
cleanup with `remainingRows=0`. This proves the configured capabilities were
visible and observed for that sandbox shape; it does not prove causal KRN
advantage, source truth, broad Codex obedience, or product readiness.

**Retirement:** Retire only when the Codex runner has a schema-owned capability
materialization layer with focused tests for hidden source paths, required MCP
startup failure, project-local skill loading, and structured evidence
classification.

## Memory Core boundary

**Trigger:** A missing eval result suggests adding more operator, executor,
dashboard, prompt, or platform orchestration behavior.

**Safe action:** First name the Memory Core consumer, authority owner, public
seam, falsifier, and non-proof. Improve DecisionPacket selection, provenance,
feedback, or evidence capture only when the change serves a real consumer.
Keep Codex as executor and keep external evidence untrusted until validated.

**Evidence / non-proof:** The active ablation goal is to measure whether
semantic governed context, procedural skills, episodic examples, or summaries
change Codex outcomes. Harness complexity without a valid held-out result does
not prove a Memory Core advantage.

**Retirement:** Retire only when the product boundary changes through an owned
architecture decision with a named consumer and falsifier.
