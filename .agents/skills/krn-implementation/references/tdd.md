# TDD

Use this reference to create one tight behavior falsifier before implementation.
The goal is not more tests. The goal is a test that would fail for the exact
bug, authority gap, or product behavior being changed.

## Procedure

1. Name the behavior, not the implementation.
2. Pick the highest public seam that observes it:
   - CLI command/readback;
   - core domain function;
   - repository adapter or migration contract;
   - DecisionPacket/eval scorer;
   - MCP transport wrapper only when transport behavior is the point.
3. Write one red test at that seam. The expected value must come from the Bead,
   roadmap rule, fixture fact, or worked example, not from the implementation.
4. Run only the smallest command that proves the test is red.
5. Implement the smallest change that makes it green.
6. Refactor only if the green path exposes real duplication or a shallow seam.
7. Run the local test, `rtk proxy pnpm typecheck`, and the relevant Fallow gate
   through `rtk proxy` before closing the Bead.

## Good KRN Tests

- Prove source and memory authority changes affect activation or a
  DecisionPacket.
- Prove stale, rejected, unsupported, or unsafe knowledge is excluded or
  caveated.
- Prove CLI/parser/persistence boundaries reject malformed input.
- Prove feedback changes a later selection through the store/read model path.
- Use public interfaces and stable fixtures; keep assertions independent and
  literal where possible.

## Bad KRN Tests

- Freeze markdown wording, file counts, command lists, or docs topology.
- Assert constants equal themselves or recompute expected values the same way
  as the implementation.
- Mock internal KRN modules just to observe call order.
- Add broad snapshots when one field-level assertion proves the behavior.
- Create a test only because a rename happened.

## Mocking Rule

Mock true external boundaries only: network APIs, time, randomness, filesystem,
process exit, or a DB when a test DB is not the seam under test. Do not mock
core, CLI, harness, or DB repository collaborators you can exercise through the
public interface.

## Verification

Verification requires the red command, green command, typecheck result, and
relevant Fallow result or an explicit unavailable reason.
