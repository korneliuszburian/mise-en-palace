import {
  describe,
  expect,
  it
} from "vitest";

import {
  projectDecisionPacketUsefulnessSubjects
} from "../decision-packet-authority.js";

describe("DecisionPacket authority projections", () => {
  it("projects feedback usefulness outcomes into canonical authorization subjects", () => {
    expect(projectDecisionPacketUsefulnessSubjects({
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "source-claim-1",
        outcome: "used",
        reason: "The claim constrained the implementation.",
        evidenceRefs: ["evidence:claim-1"],
        doesNotProve: "The claim is universally true."
      }, {
        sourceDecisionId: "source-decision-1",
        outcome: "helped",
        reason: "The decision selected the supported path.",
        evidenceRefs: ["evidence:decision-1"],
        doesNotProve: "The decision remains current forever."
      }, {
        outcome: "neutral",
        reason: "No source subject was identified.",
        evidenceRefs: ["evidence:unbound-source"],
        doesNotProve: "An unidentified source can be authorized."
      }],
      knowledgeUsefulnessOutcomes: [{
        knowledgeId: "knowledge-1",
        outcome: "used",
        reason: "The knowledge record supplied a constraint.",
        evidenceRefs: ["evidence:knowledge-1"],
        doesNotProve: "The knowledge remains current forever."
      }]
    })).toEqual([{
      kind: "source_claim",
      id: "source-claim-1",
      evidenceRefs: ["evidence:claim-1"]
    }, {
      kind: "source_decision",
      id: "source-decision-1",
      evidenceRefs: ["evidence:decision-1"]
    }, {
      kind: "knowledge",
      id: "knowledge-1",
      evidenceRefs: ["evidence:knowledge-1"]
    }]);
  });
});
