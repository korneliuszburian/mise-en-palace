import { describe, expect, it } from "vitest";
import { diffDecisionPackets } from "../packet-diff.js";

const packet = (projectId: string, ids: string[]) => ({ request: { projectId }, packet: { memoryRefs: ids } }) as never;

describe("packet diff verdict", () => {
  it("reports a selection change", () => {
    const diff = diffDecisionPackets(
      packet("p", ["a"]),
      packet("p", ["b"]),
      [],
      [{ id: "a", summary: "Before" }, { id: "b", summary: "After" }]
    );
    expect(diff.verdict).toBe("selection_changed");
    expect(diff.memoryRecordSummaries).toEqual([
      { id: "a", summary: "Before" },
      { id: "b", summary: "After" }
    ]);
  });
  it("reports an ordering change", () => {
    expect(diffDecisionPackets(packet("p", ["a", "b"]), packet("p", ["b", "a"]), []).positionChanges)
      .toEqual([{ memoryRecordId: "a", before: 0, after: 1 }, { memoryRecordId: "b", before: 1, after: 0 }]);
    expect(diffDecisionPackets(packet("p", ["a", "b"]), packet("p", ["b", "a"]), []).verdict).toBe("ordering_changed");
  });
  it("keeps unchanged common positions observable", () => {
    expect(diffDecisionPackets(packet("p", ["a", "b"]), packet("p", ["a", "b"]), []).positionChanges)
      .toEqual([{ memoryRecordId: "a", before: 0, after: 0 }, { memoryRecordId: "b", before: 1, after: 1 }]);
  });
  it("fails closed for different projects", () => {
    expect(diffDecisionPackets(packet("one", ["a"]), packet("two", ["a"]), []).verdict).toBe("not_comparable");
  });
});
