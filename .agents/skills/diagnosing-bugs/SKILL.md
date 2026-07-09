---
name: diagnosing-bugs
description: Use for unknown broken, throwing, failing, flaky, slow, or regressed KRN behavior; requires a red-capable repro before hypotheses or fixes.
---

# Diagnosing Bugs

Use this skill for unknown failures. No repro, no hypothesis.

## Trigger

- A command, test, CLI flow, migration, activation path, DecisionPacket, store
  path, or target-repo trial is broken, failing, flaky, slow, or regressed.
- The task asks to diagnose, debug, investigate, or fix a symptom whose cause is
  not already proven.

## Steps

1. State the reported symptom and the exact boundary where it appears.
2. Find or create a red-capable repro command before naming hypotheses or
   editing code.
3. Run the repro command and record whether it is red, green, flaky, missing,
   or not yet specific enough.
4. Minimize the repro to the smallest command, fixture, input, or code path that
   still observes the symptom.
5. Only after a red-capable repro exists, form hypotheses from evidence.
6. Instrument narrowly when the repro does not reveal the cause.
7. Fix the smallest proven cause.
8. Add or update a regression test only when it protects runtime behavior,
   parser boundaries, authority boundaries, or a user-facing flow.
9. Rerun the repro, focused regression check, typecheck for TypeScript changes,
   and any relevant Fallow gate.
10. Remove temporary instrumentation and record proof/non-proof.

## Repro Ladder

Use the lowest rung that can still fail:

1. single unit/fixture command;
2. focused package test;
3. CLI command with fixture input;
4. DB smoke or migration check;
5. target-repo command;
6. broad suite only when narrower repro cannot observe the symptom.

If every rung is green, the task is not a bug fix yet. Report the missing repro
or turn it into a question/observation Bead.

## Output

- Symptom:
- Boundary:
- Repro command:
- Repro status:
- Minimal failing case:
- Cause:
- Fix:
- Regression proof:
- Non-proof:
- Follow-up Beads:

## Stop Condition

Stop when a red-capable repro has been run, the cause is supported by evidence,
the fix removes the repro failure, focused verification passes or is reported
honestly, and remaining uncertainty is represented as non-proof or follow-up
Beads work.

## Verification

Verification requires the before-fix repro result, after-fix repro result, any
regression test result, and typecheck when TypeScript changed.

## Forbidden

- Do not propose hypotheses before a red-capable repro command exists and has
  been run.
- Do not fix by inspection only when the symptom can be reproduced.
- Do not broaden the change beyond the proven cause.
- Do not leave temporary logging, probes, or fixture mutations behind.
- Do not call a broad failing suite a cause.
