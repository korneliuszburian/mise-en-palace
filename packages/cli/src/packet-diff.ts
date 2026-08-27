import type { DecisionPacketContractReadback } from "@krn/core";

export type PacketDiffVerdict = "ordering_changed" | "selection_changed" | "not_comparable";
export interface PacketDiffOutput {
  commonMemoryRecords: string[];
  addedMemoryRecords: string[];
  removedMemoryRecords: string[];
  positionChanges: Array<{ memoryRecordId: string; before: number; after: number }>;
  memoryRecordSummaries: Array<{ id: string; summary: string }>;
  feedbackEvents: Array<{ id: string; memoryRecordId: string; summary?: string; outcome?: string; note: string }>;
  verdict: PacketDiffVerdict;
  doesNotProve: string[];
}

const nonProof = ["does not prove ranking quality", "does not prove feedback caused the change", "does not promote, demote, or otherwise mutate memory"];
const empty = (
  feedbackEvents: PacketDiffOutput["feedbackEvents"],
  memoryRecordSummaries: PacketDiffOutput["memoryRecordSummaries"]
): PacketDiffOutput => ({
  commonMemoryRecords: [],
  addedMemoryRecords: [],
  removedMemoryRecords: [],
  positionChanges: [],
  memoryRecordSummaries,
  feedbackEvents,
  verdict: "not_comparable",
  doesNotProve: nonProof
});

export const diffDecisionPackets = (
  before: DecisionPacketContractReadback | undefined,
  after: DecisionPacketContractReadback | undefined,
  feedbackEvents: PacketDiffOutput["feedbackEvents"],
  memoryRecordSummaries: PacketDiffOutput["memoryRecordSummaries"] = []
): PacketDiffOutput => {
  if (before === undefined || after === undefined || before.request.projectId !== after.request.projectId) {
    return empty(feedbackEvents, memoryRecordSummaries);
  }
  const beforeIds = before.packet.memoryRefs;
  const afterIds = after.packet.memoryRefs;
  if (!Array.isArray(beforeIds) || !Array.isArray(afterIds)) {
    return empty(feedbackEvents, memoryRecordSummaries);
  }
  const beforeSet = new Set(beforeIds);
  const afterSet = new Set(afterIds);
  const commonMemoryRecords = beforeIds.filter((id) => afterSet.has(id));
  const addedMemoryRecords = afterIds.filter((id) => !beforeSet.has(id));
  const removedMemoryRecords = beforeIds.filter((id) => !afterSet.has(id));
  const positionChanges = commonMemoryRecords.map((memoryRecordId) => {
    const beforePosition = beforeIds.indexOf(memoryRecordId);
    const afterPosition = afterIds.indexOf(memoryRecordId);
    return { memoryRecordId, before: beforePosition, after: afterPosition };
  });
  const verdict: PacketDiffVerdict = addedMemoryRecords.length > 0 || removedMemoryRecords.length > 0
    ? "selection_changed"
    : positionChanges.some((change) => change.before !== change.after) ? "ordering_changed" : "not_comparable";
  return {
    commonMemoryRecords,
    addedMemoryRecords,
    removedMemoryRecords,
    positionChanges,
    memoryRecordSummaries,
    feedbackEvents,
    verdict,
    doesNotProve: nonProof
  };
};
